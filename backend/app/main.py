"""
FastAPI Backend for Virtual Try-On (IDM-VTON via Hugging Face Spaces)

Architecture:
  Next.js Frontend (port 3000)  - HTTP/JSON  - FastAPI Backend (port 8000)
  - gradio_client (HTTPS)  - Hugging Face Space "yisol/IDM-VTON"

Workflow:
  1. Frontend uploads user photo + garment photos via POST /api/v1/upload
  2. Frontend calls POST /api/v1/tryon/generate with image URLs
  3. Backend downloads images, calls IDM-VTON /tryon on HF Space
  4. Result saved as static file, return pollable task_id
  5. Frontend polls GET /api/v1/tryon/status/{task_id} until complete
"""

import logging
import os
import shutil
import tempfile
import threading
import time
import uuid
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from gradio_client import Client, handle_file
from PIL import Image
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
log = logging.getLogger("vton")
# Mute the endless 404 heartbeat logs from gradio_client
logging.getLogger("httpx").setLevel(logging.WARNING)

# ---------------------------------------------------------------------------
# Paths & environment
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
load_dotenv(dotenv_path=BASE_DIR / ".env")

STATIC_DIR = BASE_DIR / "static"
OUTPUTS_DIR = STATIC_DIR / "outputs"
UPLOADS_DIR = STATIC_DIR / "uploads"
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Hugging Face Space (only IDM-VTON)
HF_SPACE = os.environ.get("HF_SPACE", "yisol/IDM-VTON")
HF_TOKEN = os.environ.get("HF_TOKEN", "")

BACKEND_HOST = os.environ.get("BACKEND_HOST", "http://localhost:8000")
STATIC_OUTPUTS_URL = f"{BACKEND_HOST}/static/outputs"
STATIC_UPLOADS_URL = f"{BACKEND_HOST}/static/uploads"

UPLOAD_RETENTION_SECONDS = int(os.environ.get("UPLOAD_RETENTION_SECONDS", 3600))

# ---------------------------------------------------------------------------
# File cleanup
# ---------------------------------------------------------------------------
def _cleanup_old_files(directory: Path, max_age_seconds: int) -> None:
    now = time.time()
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
    while True:
        time.sleep(interval_seconds)
        _cleanup_old_files(UPLOADS_DIR, UPLOAD_RETENTION_SECONDS)
        _cleanup_old_files(OUTPUTS_DIR, UPLOAD_RETENTION_SECONDS)

# ---------------------------------------------------------------------------
# In-memory task database
# ---------------------------------------------------------------------------
task_db: dict[str, dict] = {}
_lock = threading.Lock()

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class GarmentItem(BaseModel):
    image_url: str = Field(..., description="Public URL of the garment image")
    garment_description: str = Field("A stylish garment", description="Text description")
    is_bottom: bool = Field(False, description="True = bottom/pants, False = top")

class TryOnRequest(BaseModel):
    user_image_url: str = Field(..., description="Public URL of the user photo")
    garments: list[GarmentItem] = Field(
        ..., min_length=1, description="Garments applied sequentially"
    )

class TaskResponse(BaseModel):
    task_id: str

class StatusResponse(BaseModel):
    task_id: str
    status: str  # "pending" | "completed" | "failed"
    result_url: Optional[str] = None
    error: Optional[str] = None

class UploadResponse(BaseModel):
    url: str

# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Virtual Try-On API",
    description="Proxies try-on requests to Hugging Face Space yisol/IDM-VTON",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _start_cleanup_thread() -> None:
    t = threading.Thread(target=_cleanup_loop, args=(600,), daemon=True)
    t.start()
    log.info("Started cleanup thread (retention: %ds)", UPLOAD_RETENTION_SECONDS)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ---------------------------------------------------------------------------
# Image helpers
# ---------------------------------------------------------------------------
def _resolve_image(url_or_path: str) -> str:
    """Convert any image URL/path into a local temp file for the HF Space."""
    local_source: Optional[Path] = None

    if not url_or_path.startswith(("http://", "https://")):
        local_source = Path(url_or_path)
        if not local_source.exists():
            log.error("Local file does not exist: %s", url_or_path)
            return url_or_path
    else:
        static_url = f"{BACKEND_HOST}/static/"
        if url_or_path.startswith(static_url):
            relative = url_or_path[len(static_url):]
            candidate = STATIC_DIR / relative
            if candidate.exists():
                local_source = candidate
            else:
                log.warning("Static file not found on disk: %s", candidate)

        if local_source is None:
            try:
                from urllib.parse import urlparse
                import urllib.request
                suffix = Path(urlparse(url_or_path).path).suffix or ".png"
                tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
                tmp_path = tmp.name
                tmp.close()
                urllib.request.urlretrieve(url_or_path, tmp_path)
                log.info("Downloaded remote image to %s", tmp_path)
                # CRITICAL WINDOWS FIX: Convert to safe POSIX path
                return Path(tmp_path).as_posix()
            except Exception as exc:
                log.error("Failed to download image %s: %s", url_or_path, exc)
                return url_or_path

    try:
        suffix = local_source.suffix or ".png"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp_path = tmp.name
        tmp.close()
        shutil.copy2(str(local_source), tmp_path)
        log.info("Copied %s to clean temp path %s", local_source, tmp_path)
        # CRITICAL WINDOWS FIX: Convert to safe POSIX path
        return Path(tmp_path).as_posix()
    except Exception as exc:
        log.error("Failed to copy %s to temp: %s", local_source, exc)
        return Path(local_source).as_posix()

def _normalize_image_for_next_pass(image_path: str) -> str:
    """Load image, force RGB, ensure minimum size, save as clean PNG for next inference pass."""
    try:
        with Image.open(image_path) as img:
            rgb = img.convert("RGB")
            # Ensure minimum size for openpose detection (at least 384x512 after resize)
            w, h = rgb.size
            if w < 200 or h < 200:
                log.warning("Image too small (%dx%d), upscaling...", w, h)
                scale = max(384/w, 512/h)
                rgb = rgb.resize((int(w*scale), int(h*scale)), Image.LANCZOS)
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            tmp_path = tmp.name
            tmp.close()
            rgb.save(tmp_path, format="PNG")
            log.info("Normalized intermediate image: %s (%dx%d) -> %s", image_path, rgb.width, rgb.height, tmp_path)
            return Path(tmp_path).as_posix()
    except Exception as exc:
        log.warning("Failed to normalize %s, falling back: %s", image_path, exc)
        return Path(image_path).as_posix()


# ---------------------------------------------------------------------------
# Space-specific inference helpers
# ---------------------------------------------------------------------------
def _predict_idm_vton(client: Client, person_file, garment: GarmentItem) -> str:
    """
    Run one IDM-VTON /tryon call and return the output image path.

    API: /tryon
    Params: dict(EditorData), garm_img, garment_des, is_checked,
            is_checked_crop, denoise_steps, seed
    Returns: (output_image, masked_image)
    """
    normalized_garment_path = _normalize_image_for_next_pass(_resolve_image(garment.image_url))
    prompt = garment.garment_description
    if garment.is_bottom:
        prompt = f"{prompt}, lower body, pants, trousers, skirt"

    log.info("IDM-VTON /tryon: desc=%s is_bottom=%s", prompt, garment.is_bottom)

    try:
        result = client.predict(
            {
                "background": person_file,
                "layers": [],
                "composite": None,
            },
            handle_file(normalized_garment_path),
            prompt,
            True,   # is_checked: auto-mask
            True,   # is_checked_crop: auto-crop to 3:4
            30.0,   # denoise_steps
            42.0,   # seed
            api_name="/tryon",
        )
    except Exception as exc:
        log.exception("IDM-VTON /tryon failed")
        error_msg = str(exc)
        if hasattr(exc, 'message') and exc.message:
            error_msg = exc.message
        raise RuntimeError(f"IDM-VTON error: {error_msg}") from exc

    if isinstance(result, (list, tuple)):
        if len(result) == 0:
            raise ValueError("Empty result from /tryon")
        first = result[0]
        if isinstance(first, dict) and "path" in first:
            return first["path"]
        if isinstance(first, str):
            return first
        raise ValueError(f"Unexpected /tryon result: {type(first).__name__}")
    if isinstance(result, str):
        return result
    if isinstance(result, dict) and "path" in result:
        return result["path"]
    raise ValueError(f"Unexpected /tryon output: {type(result).__name__}")


def _run_tryon(task_id: str, params: TryOnRequest) -> None:
    """Execute IDM-VTON Gradio call(s) in background thread, persist result."""
    last_error = None
    max_retries = 2  # Retry on transient GPU errors

    for attempt in range(max_retries):
        try:
            log.info("Task %s - attempt %d/%d on %s (%d garment(s))",
                     task_id, attempt + 1, max_retries, HF_SPACE, len(params.garments))

            client = Client(HF_SPACE, token=HF_TOKEN)
            person_path = _resolve_image(params.user_image_url)
            output_path = None

            for idx, garment in enumerate(params.garments, start=1):
                log.info("Task %s - pass %d/%d (is_bottom=%s)", task_id, idx, len(params.garments), garment.is_bottom)
                output_path = _predict_idm_vton(client, handle_file(person_path), garment)

                if not output_path or not isinstance(output_path, str):
                    raise ValueError(f"Invalid output from pass {idx}: {output_path!r}")
                if not os.path.exists(output_path):
                    raise FileNotFoundError(f"Output path missing after pass {idx}: {output_path}")

                log.info("Task %s - pass %d returned %s", task_id, idx, output_path)

                if idx < len(params.garments):
                    person_path = _normalize_image_for_next_pass(output_path)

            dest_path = OUTPUTS_DIR / f"{task_id}.png"
            shutil.copy2(str(output_path), str(dest_path))
            result_url = f"{STATIC_OUTPUTS_URL}/{task_id}.png"

            with _lock:
                task_db[task_id]["status"] = "completed"
                task_db[task_id]["result_url"] = result_url
                task_db[task_id]["error"] = None

            log.info("Task %s - completed -> %s", task_id, result_url)
            return

        except Exception as exc:
            last_error = exc
            log.warning("Task %s - attempt %d failed: %s", task_id, attempt + 1, exc)
            if attempt < max_retries - 1:
                wait = 5 * (attempt + 1)  # Progressive backoff: 5s, 10s
                log.info("Task %s - retrying in %ds...", task_id, wait)
                time.sleep(wait)
            continue

    log.exception("Task %s - failed after %d attempts", task_id, max_retries)
    with _lock:
        task_db[task_id]["status"] = "failed"
        task_db[task_id]["error"] = str(last_error)


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------
@app.post("/api/v1/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """Accept image file, save to uploads, return public URL."""
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files supported")

    suffix = Path(file.filename or "").suffix.lower() or ".png"
    file_id = f"{uuid.uuid4()}{suffix}"
    dest_path = UPLOADS_DIR / file_id

    with dest_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return UploadResponse(url=f"{STATIC_UPLOADS_URL}/{file_id}")


@app.post("/api/v1/tryon/generate", status_code=202, response_model=TaskResponse)
async def generate_tryon(request: TryOnRequest):
    """Submit try-on request. Processed in background, returns task_id."""
    task_id = str(uuid.uuid4())

    with _lock:
        task_db[task_id] = {"status": "pending", "result_url": None, "error": None}

    thread = threading.Thread(target=_run_tryon, args=(task_id, request), daemon=True)
    thread.start()

    return TaskResponse(task_id=task_id)


@app.get("/api/v1/tryon/status/{task_id}", response_model=StatusResponse)
async def get_task_status(task_id: str):
    """Poll the status of an earlier generation request."""
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


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)