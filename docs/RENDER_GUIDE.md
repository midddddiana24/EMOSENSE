# Deploy EmoSense on Render

This guide deploys the existing FastAPI application and frontend together as one Render **Web Service**, using the native Python runtime. No Dockerfile, separate frontend hosting, database, or cloud-image storage is needed for this route. Render supports FastAPI and inbound WebSockets: [FastAPI guide](https://render.com/docs/deploy-fastapi), [WebSockets](https://render.com/docs/websocket).

These instructions are prepared from the current repository and Render documentation. A live Render deployment, hosting memory requirement, and physical-camera use over Render have not been verified.

## 1. Protect credentials before uploading

- Revoke the OpenRouter key previously pasted into chat or placed in a tracked template. Make a replacement privately.
- `backend/.env.example` must contain `OPENROUTER_API_KEY=` with no value. A real key was found there during preparation and cleared.
- Keep any local key only in the ignored `backend/.env`. Do not upload that file, your `venv`, datasets, or reference screenshots.
- On Render, enter the replacement directly in the Environment page. Do not paste it into source code, this guide, GitHub issues, or support screenshots.
- If a key was already committed or uploaded, deleting the current line does not revoke it. Revoke the key first; history cleanup is a separate task.

Render documents this configuration at [Environment Variables and Secrets](https://render.com/docs/configure-environment-variables).

## 2. Prepare the GitHub repository

Open PowerShell:

```powershell
cd C:\Users\rober\Desktop\ULUBRAHON\ULUBRAHON1\emosense
```

Create a `.python-version` file in that directory containing exactly:

```text
3.11
```

You can create it with:

```powershell
Set-Content -LiteralPath .python-version -Value '3.11' -Encoding ascii
```

Pinning 3.11 matters for the current TensorFlow/Keras dependencies. Render's default Python can differ; `.python-version` supports selecting a minor version and uses the matching latest patch. Do not set a conflicting `PYTHON_VERSION` environment variable: it takes precedence and requires a complete version number. [Python version documentation](https://render.com/docs/python-version)

Verify that the repository root contains:

```text
.python-version
backend/main.py
backend/emotion_engine.py
backend/cloud_ai.py
backend/requirements.txt
frontend/index.html
frontend/app.js
frontend/style.css
frontend/mascots.js
frontend/photo.js
```

Commit only the new version file, the guide if desired, and the sanitized template:

```powershell
git add .python-version docs/RENDER_GUIDE.md backend/.env.example
git diff --cached --stat
git commit -m "Document Render deployment and pin Python 3.11"
git push origin main
```

The existing application changes are already committed locally. Open your EMOSENSE repository on GitHub and confirm it contains the updated application and `.python-version`. Earlier pushes failed because Windows Credential Manager was unavailable; if that still happens, complete GitHub sign-in using GitHub Desktop and push this existing repository there. Do not force-push. Render cannot deploy commits that exist only on your computer.

## 3. Create the Render service

1. Visit [Render Dashboard](https://dashboard.render.com/) and sign in.
2. Choose **New > Web Service**.
3. Connect GitHub and authorize access to `midddddiana24/EMOSENSE`.
4. Select that repository.
5. Configure the fields below. This is a **Web Service**, not a Static Site.

| Setting | Value |
| --- | --- |
| Name | `emosense` or another available name |
| Branch | `main` |
| Region | Prefer Singapore if available for your account |
| Language / Runtime | `Python 3` |
| Root Directory | Leave blank when GitHub shows `backend` and `frontend` at the repository root |
| Health Check Path | `/api/health` |

Do not set Root Directory to `backend` or `frontend`. If the GitHub repository itself has an outer `emosense` folder, set Root Directory to `emosense` instead. The selected root must contain both directories. Your current local Git repository root is already the `emosense` directory.

Render's service creation, port binding, and settings are documented under [Web Services](https://render.com/docs/web-services).

## 4. Choose compute deliberately

The free web-service plan has 512 MB RAM. This is not an established fit for this TensorFlow application. Paid compute includes a 2 GB option and larger sizes. A 2 GB instance is a reasonable initial test budget if you accept its displayed price, not a guaranteed minimum or a proven requirement. Check runtime memory while warming the model and analyzing frames; resize according to measurements. [Compute plans](https://render.com/docs/compute-plans)

Review the current price in Render before creating a paid service. Free services have idle spin-down and other limits, so they are unsuitable for assuming an immediately ready panel demonstration. [Free-service limitations](https://render.com/docs/free)

The application serializes inference in one process. Keep one worker and test with one participant first; no multi-user capacity or speed is claimed.

## 5. Enter the build command

Paste this entire line into Render's **Build Command** field:

```bash
python -m pip install -r backend/requirements.txt && python -m pip uninstall -y opencv-python opencv-python-headless && python -m pip install --no-deps opencv-python-headless==4.11.0.86 && mkdir -p .tools/deepface && python -c "from backend.emotion_engine import warmup; warmup()"
```

It installs the pinned dependencies, replaces conflicting desktop OpenCV with headless OpenCV, and runs a model warmup. The warmup downloads model weights if needed and exercises the ML import/inference path during the build. It uses an in-memory dummy input, not a webcam capture.

Set `DEEPFACE_HOME` as described in step 7 **before starting the build**. That directs weights into the deployment working tree's ignored `.tools/deepface` folder. Model weights are application assets, not saved user frames. Check the first runtime warmup logs to confirm the cache is used; do not assume filesystem cache behavior across deployments. Rebuilding repeats the setup as necessary.

This is a Linux build command for Render. Do not paste it into your Windows app-start terminal.

## 6. Enter the start command

Paste this entire line into **Start Command**:

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT --workers 1 --ws-max-size 2097152 --ws-max-queue 1 --no-access-log --proxy-headers --forwarded-allow-ips='*'
```

Render supplies `$PORT`; do not replace it with a fixed local port. `0.0.0.0` allows the platform to reach the service. The app serves the UI and APIs on the same origin, so a separate CORS setup is unnecessary. Keep HTTPS/WSS rather than changing the frontend to localhost URLs.

The proxy options preserve the HTTPS scheme in backend request URLs, which matters for the existing snapshot-origin check. Trusting forwarded headers with `*` is specific to running behind Render's managed ingress; do not reuse that trust setting for a directly exposed server without a trusted proxy. The installed Uvicorn CLI supports these options.

## 7. Add environment variables

Under **Advanced > Environment Variables** during creation, or **Environment** on an existing service, add:

| Key | Initial value |
| --- | --- |
| `CONFIDENCE_MIN` | `45` |
| `CLOUD_AI_ENABLED` | `false` |
| `DEEPFACE_HOME` | `.tools/deepface` |

Do not add an OpenRouter key yet. First verify ordinary hosted inference. It needs no AI API credential.

For an existing service, choose **Save, rebuild, and deploy** when changing the build-time model cache or Python setup. **Save only** does not apply changes to the running instance. [Environment settings](https://render.com/docs/configure-environment-variables)

## 8. Deploy and verify

1. Review the plan and price, then click **Create Web Service**.
2. Follow build logs. Dependencies and model weights can take time; no fixed completion time is promised.
3. Successful startup should show Uvicorn listening on `0.0.0.0` with the assigned port.
4. When Render marks the service live, open its actual `https://...onrender.com` URL.
5. Check `https://YOUR-SERVICE.onrender.com/api/health`. Expected fields include `status: "ok"`, `model_ready`, and `cloud_available`.
6. `model_ready: false` can be normal in a fresh runtime even after build warmup: build and runtime are different processes. The UI calls `/api/warmup`; afterwards the runtime should report `model_ready: true`.
7. Wait for the app's two startup tasks, then test consent cancellation before allowing camera access.
8. Start the camera, allow browser permission, check the face box and peeking crew, and leave the frame to verify no-face clearing.
9. Test Stop, switching tabs, Photo card consent, preview, Discard, and an explicit PNG download.

The `/api/health` route is a lightweight process-health check, not a guarantee the model has already warmed or a measurement of accuracy. Render treats successful HTTP health responses as healthy. [Health checks](https://render.com/docs/health-checks)

## 9. Correct the online privacy wording before inviting participants

Online webcam frames travel from the participant's browser to the hosted backend over the HTTPS/WSS connection. They are no longer processed on the participant's own computer.

Update the consent notice, mode badge, help text, and relevant status copy to explain this accurately. Suggested consent wording:

> Your webcam frames are sent securely to this hosted EmoSense server for automated expression analysis in memory. The application does not save those frames. Results may be wrong and do not establish your real feelings. Stop or hide this tab to stop the camera. Optional external AI snapshots require separate confirmation.

Use **Hosted AI - Real-time** for the public mode badge. Keep the estimate notice and educational limitation. Retain consent before starting, no-face handling, and the explicit download notice for photo cards. Keep request/frame payloads out of diagnostic logs.

These public-copy changes are a release task, not something this documentation-only update claims to have implemented. Hosting on Render also means Render operates the server infrastructure; application in-memory handling is not a blanket guarantee about every hosting-provider policy.

## 10. Enable optional OpenRouter snapshots later

After the hosted camera/local-model flow works, open your Render service's **Environment** page and add or change:

| Key | Value |
| --- | --- |
| `CLOUD_AI_ENABLED` | `true` |
| `OPENROUTER_API_KEY` | Your newly created private replacement key |
| `OPENROUTER_MODEL` | `nvidia/nemotron-3.5-super-vl:free` as an example only |

Save and deploy, then reload the site. Expand **Optional cloud analysis** and choose **Cloud AI snapshot**. Read the external-service warning and confirm each image separately. No automatic retry or paid-model fallback is implemented. Current free-vision compatibility/pricing is checked only for confirmed requests; the example model and eligible providers may be unavailable. An already-sent external image cannot be recalled.

Do not put the key into `.env.example` or the frontend. Confirm that turning cloud mode off still leaves normal expression analysis and photo cards usable.

## Troubleshooting

| Symptom | Check / fix |
| --- | --- |
| `No matching distribution` for TensorFlow | Confirm the deployed `.python-version` selects 3.11. Remove a conflicting `PYTHON_VERSION` override and rebuild. |
| `ModuleNotFoundError: backend` | Correct Root Directory: it must contain both `backend` and `frontend`; use the start command exactly. |
| No open port / deployment timeout | Bind to `0.0.0.0` and Render's `$PORT`; inspect the preceding startup error. |
| OpenCV / `libGL.so.1` error | Use the complete headless-OpenCV replacement build command, then rebuild. |
| Model loading fails or service restarts | Read logs for download, permission, dependency, or memory errors. Check the cache variable. For runtime out-of-memory, increase service RAM or reduce the model footprint; for build-time memory failure, inspect the build/pipeline limits separately. |
| Camera denied or missing | Open the HTTPS service URL, allow camera access in browser site settings, connect a camera, or close other apps using it. |
| Snapshot returns `403 origin_denied` | Use the UI and API on the same service URL and check proxy-header handling. Do not remove the origin check. |
| WebSocket connection lost | Confirm the request uses `wss://` on the same hostname, then check service restarts and redeploys. Start the camera again after a disconnect. |
| Cloud AI stays off | Check variable spelling, set the flag to `true`, deploy saved changes, and reload. |
| Cloud AI returns unavailable | Verify the replacement key privately, current free vision model, quotas, provider availability, and outbound access. Keep ordinary analysis enabled; do not expose provider error payloads or keys. |
| Old UI appears | Verify the deployed commit on Render/GitHub and hard-refresh with Ctrl+F5. |

## Updating or stopping the service

Push new reviewed commits to the linked `main` branch. With auto-deploy enabled, Render builds and deploys those commits; otherwise use **Manual Deploy**. Keep keys in Render's environment settings. A redeploy interrupts camera WebSockets, so warn participants and restart the camera afterwards. [Deploy behavior](https://render.com/docs/deploys)

If you no longer need a paid service, use Render's service controls to suspend or delete it after reviewing the confirmation and billing implications. Closing your browser does not stop a paid server.

Before a panel demo, open the hosted page, finish warmup, and test one complete camera session on the actual demo device. Retain the verified local launch as a fallback. Do not report a successful hosted deployment until its real startup, camera/WebSocket, and photo-card flows have passed.
