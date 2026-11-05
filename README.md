# EmoSense

Facial Emotion Detection and Automatic Emoji Recognition System: an educational FastAPI and vanilla JavaScript demo.

The local pipeline detects the largest face using OpenCV Haar detection, estimates expression scores with DeepFace, and maps them to happy, sad, angry, surprised, or neutral. Low-confidence, tied, fear, and disgust predictions become uncertain. No face means no emotion result.

## Setup

Use Python **3.11** (64-bit). Run commands from the repository root, which contains `backend` and `frontend`.

### Windows PowerShell

```powershell
py -3.11 -m venv venv
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\venv\Scripts\python.exe -m pip uninstall -y opencv-python opencv-python-headless
.\venv\Scripts\python.exe -m pip install --no-deps opencv-python-headless==4.11.0.86
```

### macOS/Linux

```bash
python3.11 -m venv venv
./venv/bin/python -m pip install --upgrade pip
./venv/bin/python -m pip install -r backend/requirements.txt
./venv/bin/python -m pip uninstall -y opencv-python opencv-python-headless
./venv/bin/python -m pip install --no-deps opencv-python-headless==4.11.0.86
```

DeepFace and RetinaFace declare desktop OpenCV. This project deliberately substitutes headless OpenCV; `pip check` can report those metadata warnings. Install only one OpenCV variant. Reapply the replacement after reinstalling requirements.

## Run

Windows:

```powershell
.\venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --workers 1 --ws-max-size 2097152 --ws-max-queue 1 --no-access-log
```

macOS/Linux:

```bash
./venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --workers 1 --ws-max-size 2097152 --ws-max-queue 1 --no-access-log
```

Open **http://127.0.0.1:8000**. Do not open the HTML file directly. First warmup may download model weights into DeepFace's cache; frames are never cached. An optional `DEEPFACE_HOME` environment variable changes the model-cache location. Keep the terminal open; Ctrl+C stops the server.

The 3D scanner is decorative. Startup progress reports actual backend connection and model warmup. Start camera opens the participation notice; camera permission is requested only after agreement. Stop camera, page exit, and tab hiding release tracks. Reduce effects disables decorative motion for the session; system reduced-motion preferences are honored automatically. How to use expands the short guide.

## Optional cloud snapshot

Cloud is off by default. To enable it, copy `backend/.env.example` to `backend/.env` without overwriting any existing settings. Set `CLOUD_AI_ENABLED=true`, and supply your own `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` server-side. Restart the server and reload the page. Never commit `.env` or put credentials in JavaScript.

Every snapshot requires its own warning and confirmation. The backend rejects oversized/invalid images and locally checks for a face before making one Anthropic request. No automatic retries occur. Local frame sending pauses while the cloud request is pending and resumes afterward. A snapshot result is separate from live scores. Provider retention and charges may apply; an already-sent image cannot be recalled. Cancelling before confirmation sends nothing externally.

## Checks

Windows, from the repository root:

```powershell
.\venv\Scripts\python.exe -m pytest tests -q --basetemp=.pytest_cache/checks
.\venv\Scripts\python.exe scripts/test_websocket.py
```

On macOS/Linux substitute `./venv/bin/python`. The WebSocket check requires a running server. To check an existing consented/authorized photo, run `python scripts/test_photo.py "path/to/photo.jpg"` using the virtual environment interpreter. These helpers never write images.

## Troubleshooting

- **Backend offline:** start Uvicorn, check the port, and use the same-origin URL above.
- **Model unavailable:** check first-run internet access, model-cache permissions, and the Python environment. Retry startup after correcting the cause.
- **Camera denied/missing/busy:** allow camera access in browser site settings, connect a webcam, or close other camera applications.
- **No face/uncertain:** try frontal positioning and even lighting. Do not force a classification to obtain a result.
- **Cloud off/unavailable:** check the enable flag, key, model access, and connectivity. Local mode needs no API key.
- **ModuleNotFoundError: backend:** run commands from the repository root, not its parent or `backend` folder.
- **Old styles:** hard-refresh the browser after an update.

## Privacy and limitations

No accounts, database, frame persistence, or frame logging. Frames remain in memory; external transmission occurs only for a separately confirmed cloud snapshot. Do not include non-consenting people in the camera view. This is an automated estimate of visible features and may be wrong; it does not establish a person's true feelings or mental state.

For educational demonstration only. Do not use results for consequential decisions about people. Model scores are not accuracy measurements. No dataset accuracy is claimed. Dataset evaluation, the Chapter IV test-log template, and the final paper-requirements audit remain pending.

Automated browser checks use synthetic video and mocked cloud responses. They do not establish physical webcam behavior, Safari/Firefox compatibility, or live Anthropic access. macOS/Linux setup commands are provided but have not been executed on those platforms.

Inter is bundled locally under the license in `frontend/fonts/OFL.txt`. The app has no frontend build step and loads no remote font or animation service.
