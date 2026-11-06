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

The cream-and-ink interface includes five original illustrated expression mascots with oversized eyes and rounded faces. They peek over the bottom edge of a cropped result-panel stage. Their pupils follow the pointer within bounded movement; the mascot matching a stable local result rises and enlarges in a single 400ms transition. Repeated identical results do not restart it. Use the labeled greeting buttons to wave without changing a classification. No mascot is selected for uncertain or no-face results. Optional scripted captions can be dismissed or muted; they are not AI advice or statements about your feelings.

The crew lives inside the result panel beside the camera on desktop. The stage reserves 224px, or 192px on mobile and at viewport heights up to 768px. On shorter desktops the header is compacted to retain the camera controls, crew, and notice together. The compact heading and collapsed **Show model scores** / **Optional cloud analysis** sections keep the current estimate, all five characters, and camera controls together. **Focus view** hides the introduction and secondary details without stopping the camera; **Exit Focus view** restores them and their previous expanded states. Stop, Photo card, the permanent estimate notice, and educational footer remain available. Short viewports and increased zoom may scroll normally instead of clipping content. On mobile, the result card stacks below the camera, with the peeking scene above a three-plus-two layout of greeting buttons.

The active mascot has a colored highlight and check mark, plus a **Current estimate** text label. Cropped artwork is decorative; greeting buttons keep their labels and keyboard focus outside the crop. Reduced motion applies the selected pose without rising, scaling transitions, blinking, or pointer tracking. Captions clear immediately when the displayed expression changes; a matching caption waits for the ten-second cooldown. No-face and uncertain states clear the supported-crew selection. The video wrapper follows actual video dimensions, including stream-resolution changes, so the overlay shares the same bounds. Startup and photo cards share the new illustrations; exported mascots are not cropped by the peeking stage.

Startup progress reports actual backend connection and model warmup. Start camera opens the participation notice; camera permission is requested only after agreement. Stop camera, page exit, and tab hiding release tracks. Reduce effects disables decorative motion for the session; system reduced-motion preferences are honored automatically. How it works expands the short guide.

## Local photo cards

Start the camera, choose **Photo card**, agree to capture, then choose **Capture & preview**. One frozen JPEG is analyzed by the same local pipeline at `/api/analyze-snapshot`. Its result determines the card, independently of the smoothed live result. No face blocks card creation; uncertain uses a separate template. The preview is mirrored like the webcam, without cropping faces, and includes the estimate notice.

Choose **Download PNG** to save a 1080 x 1350 card to your device. Retake, Discard, Stop, and hiding the tab clear the browser preview and ignore pending work. The server never stores the JPEG or card. This explicit browser download is the sole image-saving feature; it revises the original paper's blanket no-image-saving scope and should be disclosed in the paper. Everyone visible must agree. Cards do not use cloud AI.

## Optional cloud snapshot

Cloud is off by default. This revision uses OpenRouter through HTTPX in place of the original direct Anthropic SDK, as requested. To enable it, copy `backend/.env.example` to `backend/.env` without overwriting any existing settings. Set `CLOUD_AI_ENABLED=true`, and supply a replacement private `OPENROUTER_API_KEY` and an `OPENROUTER_MODEL` server-side. Revoke any key pasted into chat; never reuse it here. Restart the server and reload the page. Never commit `.env` or put credentials in JavaScript. Local mode needs no API key.

Every snapshot requires its own warning and confirmation. The backend rejects oversized/invalid images and locally checks for a face. Only then does it fetch the public model catalog and allow the configured `:free` model if it currently advertises image input, text output, and zero prices. The example model is a configuration suggestion, not a promise of ongoing availability. A missing, paid, or incompatible model fails closed.

The single image-bearing Responses API request sets zero provider price ceilings, disables provider fallbacks, requests no data collection, and sets `store:false`. No automatic retry or paid-model fallback occurs. Free quotas, eligible providers, and model availability can prevent a request from succeeding; no free key is bundled or obtained from third parties. See the official [Responses API](https://openrouter.ai/docs/api/reference/responses/overview) and [provider-routing documentation](https://openrouter.ai/docs/guides/routing/provider-selection). These safeguards have mocked automated coverage; live provider acceptance is unverified.

Local frame sending pauses while the cloud request is pending and resumes afterward. A snapshot result is separate from live scores. OpenRouter and downstream provider policies apply; the app cannot guarantee external retention behavior or recall an already-sent image. Cancelling before confirmation sends nothing externally.

## Checks

Windows, from the repository root:

```powershell
.\venv\Scripts\python.exe -m pytest tests -q --basetemp=.pytest_cache/checks
.\venv\Scripts\python.exe scripts/test_websocket.py
```

On macOS/Linux substitute `./venv/bin/python`. The WebSocket check requires a running server. To check an existing consented/authorized photo, run `python scripts/test_photo.py "path/to/photo.jpg"` using the virtual environment interpreter. These helpers never write images.

Optional UI regression check (Node.js is needed for development testing only; the app still has no frontend build step):

```powershell
npm install --prefix .tools/browser-check playwright@1.58.2 @axe-core/playwright@4.11.0
node .tools/browser-check/node_modules/playwright/cli.js install chromium
node scripts/test_peek_stage.cjs
```

This self-contained check mocks startup/analysis and supplies synthetic video. It checks all five rising poses, stable/rapid result changes, greeting isolation, desktop visibility, mobile sizing, focus view, reduced motion, no-face/uncertain clearing, Stop/tab-hide cleanup, keyboard access, and axe. Preview artifacts go to the ignored `.tools/peek-stage` folder. They are not real inference evidence. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` only if using a custom installed Chromium binary.

## Troubleshooting

- **Backend offline:** start Uvicorn, check the port, and use the same-origin URL above.
- **Model unavailable:** check first-run internet access, model-cache permissions, and the Python environment. Retry startup after correcting the cause.
- **Camera denied/missing/busy:** allow camera access in browser site settings, connect a webcam, or close other camera applications.
- **No face/uncertain:** try frontal positioning and even lighting. Do not force a classification to obtain a result.
- **Cloud off/unavailable:** check the enable flag, replacement key, current free vision-model availability, quotas, eligible providers, and connectivity. A zero-price request may have no eligible endpoint. Local mode needs no API key.
- **ModuleNotFoundError: backend:** run commands from the repository root, not its parent or `backend` folder.
- **Old styles:** hard-refresh the browser after an update.

## Privacy and limitations

No accounts, database, server frame persistence, or frame logging. Frames remain in memory; transmission outside this app's local server occurs only for a separately confirmed cloud snapshot. Only an explicit photo-card download saves an image on the user's device. Do not include non-consenting people in the camera view. This is an automated estimate of visible features and may be wrong; it does not establish a person's true feelings or mental state.

For educational demonstration only. Do not use results for consequential decisions about people. Model scores are not accuracy measurements. No dataset accuracy is claimed. Dataset evaluation, the Chapter IV test-log template, and the final paper-requirements audit remain pending.

Automated browser checks use synthetic video and mocked cloud responses. They do not establish physical webcam behavior, Safari/Firefox compatibility, or live OpenRouter access. macOS/Linux setup commands are provided but have not been executed on those platforms. See `docs/UI_VERIFICATION.md` for evidence and manual checks.

Nunito and DM Sans are bundled locally under `frontend/fonts/Nunito-OFL.txt` and `frontend/fonts/DMSans-OFL.txt`. The earlier Inter asset and its license remain available but are not loaded. All mascot SVGs are original code illustrations; reference screenshots are not shipped. The app has no frontend build step and loads no remote font or animation service.
