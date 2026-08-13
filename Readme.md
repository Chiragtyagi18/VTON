# VTO Studio — Virtual Try-On (VTON)

A lightweight, cost-effective **Virtual Try-On** web application. Upload your photo and one or more garment images, and let an AI diffusion pipeline (IDM-VTON) visualize how the outfit looks on you — all powered by a **$0.00** AI compute budget.

> **Note:** This monorepo contains both the `frontend` (Next.js) and `backend` (FastAPI). Read more in [`docs/PRD.md`](docs/PRD.md), [`docs/Architecture.md`](docs/Architecture.md), [`docs/Design.md`](docs/Design.md), and [`docs/Phase.md`](docs/Phase.md).

---

## Features

- **User image via URL** — Paste a public URL of your portrait photo (full- or half-body); no server-side storage for the person image.
- **Digital Closet (multi-garment)** — Upload multiple garments as files (Tops and/or Bottoms). Add/remove cards dynamically, each with its own upload status.
- **Multi-garment chaining** — Outfits are applied *sequentially* (e.g., shirt → pants): each AI pass feeds its output back in as the "person" for the next garment.
- **AI Try-On engine** — Uses the [IDM-VTON](https://huggingface.co/yisol/IDM-VTON) model served from a Hugging Face Space via the `gradio_client`, so there is **zero dedicated AI infrastructure cost**.
- **Result gallery** — View, compare, and download generated try-on results.
- **Light / dark theming** — Class-based dark mode, persisted to `localStorage`, with a flash-free init on load.

---

## Tech Stack

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Frontend  | Next.js 16, React 19, Tailwind CSS v4, Framer Motion   |
| Backend   | FastAPI (Python), Pydantic, `gradio_client`, Pillow    |
| AI Model  | Hugging Face Space `yisol/IDM-VTON` (via `gradio_client`) |

---

## Architecture

```
+-------------------+       HTTP / JSON        +--------------------+
|  Next.js Frontend | <======================> |  FastAPI Backend   |
| (React / Tailwind)|                          |  (Python / Async)  |
+-------------------+                          +--------------------+
                                                          ||
                                                          || gradio_client (HTTPS)
                                                          \/
                                                +--------------------+
                                                | Hugging Face Space |
                                                |  (yisol/IDM-VTON)  |
                                                +--------------------+
```

- **Frontend** (`frontend/`) communicates with the backend over HTTP/JSON.
- **Backend** (`backend/`) proxies try-on requests to the Hugging Face Space, chains multi-garment passes, and serves generated images from `/static`.
- **Static files** — garments are persisted to `backend/static/uploads`, results to `backend/static/outputs`, both exposed as public URLs.

---

## Getting Started

### 1. Backend (FastAPI)

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/Scripts/activate      # Git Bash / Linux-style on Windows
# or: .venv\Scripts\activate       # PowerShell (Windows)

# Install dependencies
pip install -r requirements.txt

# Configure environment (see .env)
cp .env.example .env   # if present, otherwise create one from the table below

# Start the API server (http://localhost:8000)
python -m app.main        # runs uvicorn with reload, on port 8000
# or:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> The backend calls the public Hugging Face Space `yisol/IDM-VTON`. Set `HF_TOKEN` (a Hugging Face **Read** token — see [docs/Rules.md](docs/Rules.md)) if the Space requires authentication.

### 2. Frontend (Next.js)

```bash
cd frontend

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the VTO Studio workspace.

> The frontend expects the backend at `http://localhost:8000` (see `API_BASE` in `frontend/src/hooks/useVirtualTryOn.ts`). CORS on the backend currently allows `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                | Default                        | Description                                              |
| ----------------------- | ------------------------------ | -------------------------------------------------------- |
| `HF_TOKEN`              | *(unset)*                      | Optional Hugging Face Read token for the model Space.    |
| `HF_SPACE`              | `yisol/IDM-VTON`               | Hugging Face Space hosting the model.                    |
| `BACKEND_HOST`          | `http://localhost:8000`        | Public base URL used to build static file URLs.          |
| `UPLOAD_RETENTION_SECONDS` | `3600` (1 hour)             | Auto-cleanup age for uploaded + generated files.         |

> **Security:** All secrets must live in `.env` files, never in committed code. `.env` files are already ignored via `.gitignore`. Use a **Read-only** Hugging Face token.

---

## API Reference

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| `POST` | `/api/v1/upload` | Upload a garment image (multipart) → returns `{ "url": "<public-url>" }`. |
| `POST` | `/api/v1/tryon/generate` | Accepts `{ user_image_url, garment: { image_url, garment_description, is_bottom } }` → returns `{ task_id }` (HTTP 202). Processed in a background thread. |
| `GET`  | `/api/v1/tryon/status/{task_id}` | Returns `{ task_id, status, result_url, error }`. Polled by the frontend every 2.5s. |
| `GET`  | `/api/v1/health` | Health check → `{ "status": "ok" }`. |

Interactive docs are available at [http://localhost:8000/docs](http://localhost:8000/docs) once the backend is running.

---

## Project Structure

```
.
├── backend/                 # FastAPI service
│   ├── app/
│   │   ├── main.py          # App entrypoint, endpoints, background worker
│   │   └── api/
│   ├── static/
│   │   ├── uploads/         # Uploaded garment files (public URLs)
│   │   └── outputs/         # Generated try-on results
│   ├── requirements.txt
│   └── .env
├── frontend/                # Next.js app
│   └── src/
│       ├── app/             # layout + VTO Studio page
│       ├── components/      # Garment uploader, preview panel, overlays, navbar, footer…
│       ├── hooks/           # useVirtualTryOn (API + polling), uploadImage helper
│       └── lib/
└── docs/                    # PRD, Architecture, Design, Phase/Roadmap, Rules
```

---

## Roadmap

- **Phase 1 — MVP** ✅ Done: end-to-end try-on pipeline, single garment.
- **Phase 1.5** ✅ Done: multi-garment chaining + light/dark theming.
- **Phase 2** ⏳ Planned: auth (Supabase/Firebase), persisted histories + "My Closet" dashboard.
- **Phase 3** ⏳ Planned: skeleton/queue UX polish, textual prompt tuning for better bottom accuracy.

---

## Security Notes

- Never commit API keys or tokens; keep them in gitignored `.env` files.
- Only **Read** Hugging Face tokens are permitted (`docs/Rules.md`).
- The upload endpoint rejects non-image content types.
- Uploaded and generated files are auto-purged after `UPLOAD_RETENTION_SECONDS` by a background cleanup thread.

---

## License

Proprietary / private project. See repository owners for usage terms.