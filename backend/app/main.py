
import logging

import os

import shutil

import tempfile

import threading

import time

import urllib.request

import uuid

from pathlib import Path

from typing import Optional



from fastapi import FastAPI, HTTPException, UploadFile, File

from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles

from gradio_client import Client, handle_file
from gradio_client.exceptions import AppError

from pydantic import BaseModel, Field



#---------------------------------------------------------------------

# Logging

#---------------------------------------------------------------------

logging.basicConfig(

    level=logging.INFO,

    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",

)

log = logging.getLogger("vton")

logging.getLogger("httpx").setLevel(logging.WARNING)



#---------------------------------------------------------------------

# Constants

#---------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/

STATIC_DIR = BASE_DIR / "static"

OUTPUTS_DIR = STATIC_DIR / "outputs"

UPLOADS_DIR = STATIC_DIR / "uploads"



# Ensure directories exist

OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)



# Hugging Face Space endpoint

HF_SPACE = os.environ.get("HF_SPACE", "yisol/IDM-VTON")

BACKEND_HOST = os.environ.get("BACKEND_HOST", "http://localhost:8000")

STATIC_OUTPUTS_URL = f"{BACKEND_HOST}/static/outputs"

STATIC_UPLOADS_URL = f"{BACKEND_HOST}/static/uploads"



#---------------------------------------------------------------------



# --------------------------------------------------------------------------

# Automatic file cleanup

# --------------------------------------------------------------------------

# Environment-configurable max age for stored files (default: 1 hour)

UPLOAD_RETENTION_SECONDS = int(os.environ.get("UPLOAD_RETENTION_SECONDS", 3600))





def _cleanup_old_files(directory: Path, max_age_seconds: int) -> None:

    """Delete files in *directory* older than *max_age_seconds*.



    Safe: only removes plain files, never directories. Skips ``.gitkeep``.

    """

    now = __import__("time").time()

    for entry in directory.iterdir():

        if entry.is_file() and entry.name != ".gitkeep":

            age = now - entry.stat().st_mtime

            if age > max_age_seconds:

                try:

                    entry.unlink()

                    log.info("Cleaned up old file: %s (age: %.1fh)", entry.name, age / 3600)

                except OSError as exc:

                    log.warning("Failed to delete %s: %s", entry, exc)





def _cleanup_loop(interval_seconds: int = 600) -> None:

    """Background loop: periodically clean up both uploads and outputs."""

    while True:

        time.sleep(interval_seconds)

        _cleanup_old_files(UPLOADS_DIR, UPLOAD_RETENTION_SECONDS)

        _cleanup_old_files(OUTPUTS_DIR, UPLOAD_RETENTION_SECONDS)



# Task database (in-memory)

#---------------------------------------------------------------------

# Structure: { task_id: {"status": str, "result_url": str|None, "error": str|None} }

task_db: dict[str, dict] = {}

_lock = threading.Lock()



#---------------------------------------------------------------------

# Pydantic models

#---------------------------------------------------------------------

class GarmentItem(BaseModel):

    image_url: str = Field(..., description="Public URL of the garment image")

    garment_description: str = Field("A stylish garment", description="Text description of the garment")

    is_bottom: bool = Field(False, description="Whether the garment is a bottom (pants/jeans) vs top")





class TryOnRequest(BaseModel):

    user_image_url: str = Field(..., description="Public URL of the user / person image")

    garment: GarmentItem = Field(..., description="Single garment to apply")


# Backwards-compat: keep older clients working by accepting a single-item list
# TODO: if you need multi-garment sequencing later, reintroduce a 'garments' array.





class TaskResponse(BaseModel):

    task_id: str





class StatusResponse(BaseModel):

    task_id: str

    status: str  # "pending" | "completed" | "failed"

    result_url: Optional[str] = None

    error: Optional[str] = None





class UploadResponse(BaseModel):

    url: str



#---------------------------------------------------------------------

# FastAPI application

#---------------------------------------------------------------------

app = FastAPI(

    title="Virtual Try-On API",

    description="Async backend that proxies try-on requests to Hugging Face Space yisol/IDM-VTON",

    version="1.1.0",

)



# CORS - allow Next.js dev server on port 3000

app.add_middleware(

    CORSMiddleware,

    allow_origins=["http://localhost:3000"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)





@app.on_event("startup")

def _start_cleanup_thread() -> None:

    """Start the periodic cleanup thread on app startup."""

    t = threading.Thread(target=_cleanup_loop, args=(600,), daemon=True)

    t.start()

    log.info("Started cleanup thread (retention: %ds)", UPLOAD_RETENTION_SECONDS)



# Mount static files so generated images are publicly accessible

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")



#---------------------------------------------------------------------

#---------------------------------------------------------------------

# Image resolver -- ensures the HF Space gets a local file path, not a URL

#---------------------------------------------------------------------

def _resolve_image(url_or_path: str) -> str:

    """Convert any image URL/path into a local temp file for the HF Space.



    * If it is a local path (already on disk), copy it to a clean temp file.

    * If it is one of our own /static/ URLs, resolve to disk then copy to temp.

    * Otherwise, download the remote URL to a temporary file.



    Always returns a path in the system temp directory (short 8.3 name on

    Windows) so that spaces and backslashes in the user profile path do NOT

    get passed to the Linux Hugging Face server.

    """

    local_source = None  # path on disk we can read



    # --- Already a local file path -------------------------------------------

    if not url_or_path.startswith(("http://", "https://")):

        local_source = Path(url_or_path)

        if not local_source.exists():

            log.error("Local file does not exist: %s", url_or_path)

            return url_or_path  # hopeless fallback



    # --- Our own /static/ URL -> resolve to local file on disk ---------------

    else:

        static_url = f"{BACKEND_HOST}/static/"

        if url_or_path.startswith(static_url):

            relative = url_or_path[len(static_url):]

            candidate = STATIC_DIR / relative

            if candidate.exists():

                local_source = candidate

            else:

                log.warning("Static file not found on disk: %s", candidate)



        # --- External / public URL -> download to a temp file ----------------

        if local_source is None:

            try:

                from urllib.parse import urlparse

                suffix = Path(urlparse(url_or_path).path).suffix or ".png"

                tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)

                tmp_path = tmp.name

                tmp.close()

                urllib.request.urlretrieve(url_or_path, tmp_path)
                log.info("Downloaded remote image to %s", tmp_path)
                return Path(tmp_path).as_posix()

            except Exception as exc:

                log.error("Failed to download image %s: %s", url_or_path, exc)

                return url_or_path  # fallback



    # --- Copy local file to a clean temp path (avoids spaces/backslashes) ----

    try:

        suffix = local_source.suffix or ".png"

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)

        tmp_path = tmp.name

        tmp.close()

        import shutil

        shutil.copy2(str(local_source), tmp_path)
        log.info("Copied %s to clean temp path %s", local_source, tmp_path)
        return Path(tmp_path).as_posix()

    except Exception as exc:

        log.error("Failed to copy %s to temp: %s", local_source, exc)

        return str(local_source)  # fallback





# Background worker

#---------------------------------------------------------------------

def _predict_single(client: Client, person, garment: GarmentItem):

    """Run one IDM-VTON pass and return the local output image path."""

    # The /tryon API expects these parameters in order:
    # 1. dict (EditorData): {background, layers[], composite}
    # 2. garm_img (FileData): garment image
    # 3. garment_des (str): description
    # 4. is_checked (bool): True=top, False=bottom
    # 5. is_checked_crop (bool): default False
    # 6. denoise_steps (int): default 30
    # 7. seed (int): default 42

    # Log payload summary for debugging
    try:
        log.info("_predict_single payload: person=%r, garment_url=%s, is_bottom=%s", person, garment.image_url, garment.is_bottom)
    except Exception:
        log.exception("Failed to log predict payload")

    try:
        result = client.predict(
            {
                "background": person,
                "layers": [],
                "composite": None,
            },
            handle_file(_resolve_image(garment.image_url)),  # garm_img
            garment.garment_description,                      # garment_des
            not garment.is_bottom,                            # is_checked (True=top)
            False,                                            # is_checked_crop
            30,                                               # denoise_steps
            42,                                               # seed
            api_name="/tryon",
        )
    except AppError as exc:
        # Gradio app returned an error modal — capture its message and attributes
        log.exception("IDM-VTON /tryon raised AppError")
        msg = getattr(exc, "message", str(exc))
        log.error("AppError.message=%r, attrs=%s", msg, getattr(exc, "__dict__", {}))
        raise RuntimeError(f"IDM-VTON error: {msg}") from exc
    except Exception as exc:
        log.exception("IDM-VTON /tryon failed with unexpected exception")
        log.error("Exception repr=%r, attrs=%s", exc, getattr(exc, "__dict__", {}))
        raise

    # result is typically a tuple of (output_image_path, ...) or just a path
    return result[0] if isinstance(result, (list, tuple)) else result





def _run_tryon(task_id: str, params: TryOnRequest) -> None:

    """Execute the Gradio call(s) in a background thread and persist the result.



    Multiple garments are applied sequentially: each pass output becomes the

    person input for the next garment.

    """

    try:

        log.info(
            "Task %s - starting Gradio client call to %s (single garment)",
            task_id,
            HF_SPACE,
        )



        # Optionally read API key from environment

        hf_token = os.environ.get("HF_TOKEN") or os.environ.get("API_KEY")

        client = Client(HF_SPACE, token=hf_token)



        # Start from the user photo (a public URL)
        person_path = _resolve_image(params.user_image_url)
        person = handle_file(person_path)

        # Single garment pass
        garment = params.garment
        log.info("Task %s - applying single garment (is_bottom=%s)", task_id, garment.is_bottom)
        output_path = _predict_single(client, person, garment)
        log.info("Task %s - predict returned %s", task_id, output_path)

        if not output_path:
            raise RuntimeError(f"Empty output from tryon: {output_path!r}")

        # If result is a relative/local path, ensure it exists before copying
        try:
            if not os.path.exists(output_path):
                log.warning("Predict returned path does not exist locally: %s", output_path)
        except Exception:
            log.exception("Error while checking output path existence")


        # Copy the final generated file into our static outputs directory
        dest_path = OUTPUTS_DIR / f"{task_id}.png"
        try:
            shutil.copy2(str(output_path), str(dest_path))
        except Exception as exc:
            log.exception("Failed to copy output to static outputs: %s", exc)
            raise

        result_url = f"{STATIC_OUTPUTS_URL}/{task_id}.png"



        with _lock:

            task_db[task_id]["status"] = "completed"

            task_db[task_id]["result_url"] = result_url

            task_db[task_id]["error"] = None



        log.info("Task %s - completed successfully -> %s", task_id, result_url)



    except Exception as exc:

        log.exception("Task %s - failed with error", task_id)

        with _lock:

            task_db[task_id]["status"] = "failed"

            task_db[task_id]["error"] = str(exc)



#---------------------------------------------------------------------

# Endpoints

#---------------------------------------------------------------------

@app.post(

    "/api/v1/upload",

    response_model=UploadResponse,

)

async def upload_image(file: UploadFile = File(...)):

    """

    Accept a raw image file, persist it under /static/uploads, and return a

    public URL that can be handed to the try-on pipeline.

    """

    if not (file.content_type or "").startswith("image/"):

        raise HTTPException(status_code=400, detail="Only image files are supported")



    suffix = Path(file.filename or "").suffix.lower() or ".png"

    file_id = f"{uuid.uuid4()}{suffix}"

    dest_path = UPLOADS_DIR / file_id



    with dest_path.open("wb") as buffer:

        shutil.copyfileobj(file.file, buffer)



    return UploadResponse(url=f"{STATIC_UPLOADS_URL}/{file_id}")





@app.post(

    "/api/v1/tryon/generate",

    status_code=202,

    response_model=TaskResponse,

)

async def generate_tryon(request: TryOnRequest):

    """

    Submit a virtual try-on generation request.



    The request is processed in the background. Returns immediately with a

    task_id that can be polled via GET /api/v1/tryon/status/{task_id}.

    """

    task_id = str(uuid.uuid4())



    with _lock:

        task_db[task_id] = {

            "status": "pending",

            "result_url": None,

            "error": None,

        }



    # Spawn background thread (avoid asyncio event loop blocking)

    thread = threading.Thread(target=_run_tryon, args=(task_id, request), daemon=True)

    thread.start()



    return TaskResponse(task_id=task_id)





@app.get(

    "/api/v1/tryon/status/{task_id}",

    response_model=StatusResponse,

)

async def get_task_status(task_id: str):

    """

    Poll the status of an earlier generation request.

    """

    with _lock:

        entry = task_db.get(task_id)



    if entry is None:

        raise HTTPException(status_code=404, detail="Task not found")



    return StatusResponse(

        task_id=task_id,

        status=entry["status"],

        result_url=entry.get("result_url"),

        error=entry.get("error"),

    )



#---------------------------------------------------------------------

# Health check

#---------------------------------------------------------------------

@app.get("/api/v1/health")

async def health_check():

    return {"status": "ok"}



#---------------------------------------------------------------------

# Entrypoint

#---------------------------------------------------------------------

if __name__ == "__main__":

    import uvicorn



    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 

