# Phase 4 complete source

These are the complete frontend source files, not excerpts. Run the app through FastAPI; do not open index.html directly.

## frontend/index.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#090d1b">
  <title>EmoSense · Facial expression demo</title>
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="/style.css">
  <script src="/app.js" defer></script>
</head>
<body>
  <div class="ambient" aria-hidden="true"><i></i><i></i></div>
  <section id="splash" class="splash" aria-labelledby="splash-title">
    <div class="splash-content">
      <div class="brand-mark pulse" aria-hidden="true">e</div>
      <h1 id="splash-title" class="gradient-text">EmoSense</h1>
      <p>Facial expressions, explored with care.</p>
      <progress id="startup-progress" max="2" value="0" aria-label="Startup tasks completed"></progress>
      <p id="startup-message" role="status">Connecting to the local backend…</p>
      <button id="retry-startup" type="button" hidden>Retry connection</button>
      <p class="small">Your camera stays off until you agree to participate.</p>
    </div>
  </section>

  <div id="app" class="app" inert>
    <header class="site-header">
      <a class="brand" href="/" aria-label="EmoSense home"><span class="brand-mark" aria-hidden="true">e</span>EmoSense</a>
      <span class="badge"><span class="dot" aria-hidden="true"></span>Local AI - Real-time</span>
    </header>
    <main>
      <div class="intro"><div><p class="eyebrow">Facial expression exploration</p><h1>An expression, reflected.</h1></div>
        <p>Explore five visible expressions and their matching emojis. You choose when to start and stop.</p>
      </div>
      <ol class="pipeline" aria-label="Analysis pipeline"><li>Webcam</li><li>Face detection</li><li>Expression analysis</li><li>Classification</li><li>Emoji</li></ol>
      <div class="workspace">
        <section class="card camera-card" aria-labelledby="camera-heading">
          <div class="card-heading"><h2 id="camera-heading">Your camera</h2><span id="camera-badge" class="badge">Camera off</span></div>
          <div id="video-wrap" class="video-wrap">
            <video id="video" autoplay playsinline muted aria-label="Mirrored live camera preview" hidden></video>
            <canvas id="overlay" aria-hidden="true"></canvas>
            <div id="camera-placeholder" class="camera-placeholder"><span class="viewfinder" aria-hidden="true"></span><h3>Your space to explore</h3><p>Start when you’re ready.<br>Your camera is off.</p></div>
            <div id="video-loading" class="video-loading" hidden><span class="spinner" aria-hidden="true"></span><span>Starting your camera…</span></div>
            <span id="preview-note" class="preview-note" hidden>Mirrored preview</span>
          </div>
          <div class="controls"><button id="start-camera" class="primary" type="button" disabled>Start camera</button><button id="stop-camera" class="secondary" type="button" disabled>Stop camera</button></div>
          <p id="camera-message" class="helper">Camera off. Review the participation notice to begin.</p>
          <p class="privacy-line"><span class="dot" aria-hidden="true"></span>Processed locally · Frames are not saved</p>
        </section>
        <section class="card result-card" aria-labelledby="result-heading">
          <div class="card-heading"><h2 id="result-heading">Expression estimate</h2><span id="result-status" class="badge" role="status">Idle</span></div>
          <div class="expression"><div id="emoji" class="emoji" aria-hidden="true"></div><span id="empty-symbol" class="empty-symbol" aria-hidden="true">—</span><h3 id="result-label" aria-live="polite">Ready when you are</h3><p id="confidence">No estimate yet</p></div>
          <div class="score-heading"><span>Model scores</span><span>Five supported expressions</span></div>
          <div id="scores" class="scores" aria-label="Expression model scores"></div>
          <p class="small">Model scores are not accuracy measurements. Low confidence and unsupported expressions are shown as “Not sure”.</p>
          <aside class="estimate-notice"><strong>An estimate, not your feelings.</strong><p>This automated estimate uses visible facial features, may be wrong, and is not a statement about your real feelings.</p></aside>
        </section>
      </div>
    </main>
    <footer><p>For educational demonstration only. Must not be used for consequential decisions about people.</p><p>Frames are processed in memory and are not saved. No accounts. No database.</p></footer>
  </div>

  <dialog id="consent-dialog" aria-labelledby="consent-title" aria-describedby="consent-description">
    <form id="consent-form">
      <span class="badge">Voluntary participation</span><h2 id="consent-title">Your camera. Your choice.</h2>
      <p id="consent-description">This demo uses your webcam to estimate visible facial expressions. It may be wrong and cannot tell how you actually feel.</p>
      <ul><li>Frames go to this app’s local backend for analysis in memory. They are not saved or sent to an external AI service in this mode.</li><li>You can stop at any time. The camera also stops when you leave or hide this tab.</li><li>Only participate if you agree. Keep other people out of view unless they also consent.</li></ul>
      <label class="consent-check"><input id="consent-checkbox" type="checkbox" required> <span>I understand and agree</span></label>
      <div class="controls"><button id="cancel-consent" class="secondary" type="button" autofocus>Cancel</button><button id="confirm-consent" class="primary" type="submit" disabled>Agree &amp; start camera</button></div>
    </form>
  </dialog>
  <noscript><p class="noscript">JavaScript is required for the camera demo. Your camera has not been started.</p></noscript>
</body>
</html>
```

## frontend/style.css

```css
@font-face { font-family: Inter; src: url('/fonts/InterVariable.woff2') format('woff2'); font-weight: 100 900; font-display: swap; }
:root {
  color-scheme: dark;
  --bg: #090d1b; --surface: rgba(21, 28, 48, .78); --surface-solid: #151c30;
  --text: #f3f5fc; --muted: #b1bdd4; --violet: #7c5cff; --cyan: #22d3ee;
  --amber: #f5c46b; --error: #ffabab; --border: rgba(177, 189, 212, .21);
  --well: #0b1120; --track: #303a50; --notice: rgba(124, 92, 255, .1);
  --scrim: rgba(9, 13, 27, .88); --shadow: rgba(0, 0, 0, .22);
  --s1: 8px; --s2: 16px; --s3: 24px; --s4: 40px;
  --card-radius: 20px; --video-radius: 16px; --pill: 999px;
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.6 Inter, system-ui, sans-serif; }
button, input { font: inherit; }
button, a, input { -webkit-tap-highlight-color: transparent; }
button { min-height: 48px; padding: var(--s1) var(--s3); border: 1px solid var(--border); border-radius: var(--pill); background: var(--surface-solid); color: var(--text); cursor: pointer; font-weight: 650; transition: transform .18s, border-color .18s; }
button:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--cyan); }
button:active:not(:disabled) { transform: translateY(1px); }
button:disabled { opacity: .45; cursor: not-allowed; }
:focus-visible { outline: 3px solid var(--cyan); outline-offset: 4px; }
h1, h2, h3, p { margin: 0; }
h1 { font-size: clamp(28px, 3.2vw, 44px); line-height: 1.15; letter-spacing: -.045em; font-weight: 600; }
h2 { font-size: 18px; line-height: 1.4; font-weight: 600; }
h3 { font-size: 22px; font-weight: 550; }
p { color: var(--muted); }
.small, .helper, .privacy-line, footer { font-size: 13px; }
.ambient { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: -1; }
.ambient i { position: absolute; width: 48vw; height: 48vw; border-radius: var(--pill); filter: blur(100px); opacity: .11; background: var(--violet); left: -20%; top: -20%; animation: drift 18s ease-in-out infinite alternate; }
.ambient i + i { background: var(--cyan); left: 75%; top: 45%; animation-delay: -8s; }
.app { width: min(1240px, 100%); margin: auto; padding: 0 var(--s4); opacity: 0; transition: opacity .35s; }
.app.ready { opacity: 1; }
.site-header, .card-heading, .score-heading, .intro { display: flex; justify-content: space-between; align-items: center; gap: var(--s2); }
.site-header { padding: var(--s3) 0; border-bottom: 1px solid var(--border); }
.brand { display: inline-flex; align-items: center; gap: var(--s1); text-decoration: none; color: var(--text); font-size: 23px; font-weight: 700; letter-spacing: -.04em; }
.brand-mark { display: grid; place-items: center; width: 40px; height: 40px; border-radius: var(--pill); background: linear-gradient(135deg, var(--violet), var(--cyan)); color: var(--bg); font-size: 32px; font-weight: 800; line-height: 1; }
.badge { display: inline-flex; align-items: center; justify-content: center; gap: var(--s1); padding: var(--s1) var(--s2); border: 1px solid var(--border); border-radius: var(--pill); color: var(--muted); font-size: 12px; line-height: 1.3; text-align: center; }
.dot { flex: 0 0 6px; width: 6px; height: 6px; border-radius: var(--pill); background: var(--cyan); }
.intro { padding: var(--s4) 0 var(--s3); align-items: end; }
.intro > p { max-width: 340px; font-size: 14px; }
.eyebrow { color: var(--cyan); margin-bottom: var(--s1); font-size: 13px; }
.pipeline { display: flex; flex-wrap: wrap; gap: var(--s1) var(--s3); padding: 0; margin: 0 0 var(--s3); list-style: none; color: var(--muted); font-size: 12px; }
.pipeline li:not(:last-child)::after { content: '›'; margin-left: var(--s3); color: var(--cyan); }
.workspace { display: grid; grid-template-columns: minmax(0, 1.28fr) minmax(0, 1fr); gap: var(--s3); align-items: start; }
.card { min-width: 0; padding: var(--s3); border: 1px solid var(--border); border-radius: var(--card-radius); background: var(--surface); backdrop-filter: blur(24px); box-shadow: 0 16px 40px var(--shadow); }
.ready .card { animation: rise .5s both; }
.ready .result-card { animation-delay: .1s; }
.card-heading { margin-bottom: var(--s3); }
.video-wrap { position: relative; aspect-ratio: 4 / 3; overflow: hidden; border-radius: var(--video-radius); background: var(--well); border: 1px solid var(--border); }
video, #overlay { position: absolute; inset: 0; width: 100%; height: 100%; transform: scaleX(-1); }
video { object-fit: contain; }
#overlay { pointer-events: none; }
.camera-placeholder, .video-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: var(--s2); text-align: center; padding: var(--s2); }
.camera-placeholder h3 { font-size: 20px; }
.camera-placeholder p { font-size: 14px; }
.viewfinder { width: 64px; height: 64px; border: 2px dashed var(--muted); border-radius: var(--video-radius); opacity: .7; }
.video-loading { background: var(--scrim); z-index: 2; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--cyan); border-radius: var(--pill); animation: spin .8s linear infinite; }
.preview-note { position: absolute; bottom: var(--s2); left: var(--s2); padding: var(--s1) var(--s2); border-radius: var(--pill); background: var(--scrim); font-size: 12px; }
.controls { display: flex; flex-wrap: wrap; gap: var(--s1); margin-top: var(--s3); }
.primary { background: linear-gradient(115deg, var(--violet), var(--cyan)); border-color: transparent; color: var(--bg); }
.secondary { background: transparent; }
.helper { margin-top: var(--s2); min-height: 40px; }
.privacy-line { display: flex; align-items: center; gap: var(--s1); padding-top: var(--s2); margin-top: var(--s2); border-top: 1px solid var(--border); }
.expression { position: relative; text-align: center; padding-bottom: var(--s3); }
.emoji, .empty-symbol { display: grid; place-items: center; height: 144px; font-size: 104px; line-height: 1; }
.emoji:empty { display: none; }
.empty-symbol { color: var(--muted); opacity: .45; font-weight: 200; }
.emoji.pop { animation: pop .32s ease-out; }
.expression h3 { font-size: 26px; letter-spacing: -.025em; }
.expression p { font-size: 13px; margin-top: var(--s1); }
.score-heading { font-size: 12px; color: var(--muted); margin-bottom: var(--s2); }
.score-heading span:first-child { color: var(--text); }
.scores { display: grid; gap: var(--s2); margin-bottom: var(--s3); }
.score-row { display: grid; grid-template-columns: 80px minmax(0, 1fr) 40px; gap: var(--s1); align-items: center; font-size: 13px; }
.score-row output { text-align: right; color: var(--muted); font-variant-numeric: tabular-nums; }
.bar-track { height: 8px; background: var(--track); border-radius: var(--pill); overflow: hidden; }
.bar-fill { width: 0; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--violet), var(--cyan)); transition: width .3s ease-out; }
.estimate-notice { padding: var(--s2); margin-top: var(--s3); border: 1px solid var(--border); border-radius: var(--video-radius); background: var(--notice); font-size: 13px; }
.estimate-notice strong { display: block; margin-bottom: var(--s1); font-weight: 600; }
[data-tone="warning"] { color: var(--amber); }
[data-tone="error"] { color: var(--error); }
[data-tone="active"] { color: var(--cyan); }
footer { padding: var(--s3) 0 var(--s4); display: grid; gap: var(--s1); }
.splash { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; padding: var(--s3); background: var(--bg); transition: opacity .3s; }
.splash.leaving { opacity: 0; pointer-events: none; }
.splash-content { width: min(440px, 100%); text-align: center; display: grid; justify-items: center; gap: var(--s3); }
.splash .brand-mark { width: 80px; height: 80px; font-size: 64px; }
.gradient-text { background: linear-gradient(115deg, var(--violet), var(--cyan)); background-clip: text; color: transparent; font-size: 48px; }
progress { width: 100%; height: 8px; appearance: none; border: 0; border-radius: var(--pill); overflow: hidden; background: var(--track); }
progress::-webkit-progress-bar { background: var(--track); }
progress::-webkit-progress-value { background: linear-gradient(90deg, var(--violet), var(--cyan)); }
progress::-moz-progress-bar { background: var(--cyan); }
.pulse { animation: pulse 2s ease-in-out infinite; }
dialog { width: min(560px, calc(100% - 32px)); max-height: calc(100dvh - 32px); padding: var(--s3); border: 1px solid var(--border); border-radius: var(--card-radius); background: var(--surface-solid); color: var(--text); box-shadow: 0 16px 40px var(--shadow); }
dialog::backdrop { background: var(--scrim); backdrop-filter: blur(8px); }
dialog h2 { font-size: 26px; margin: var(--s2) 0; }
dialog ul { padding-left: var(--s3); margin: var(--s2) 0; color: var(--muted); }
dialog li + li { margin-top: var(--s1); }
.consent-check { display: flex; align-items: center; gap: var(--s2); padding: var(--s2); border: 1px solid var(--border); border-radius: var(--video-radius); cursor: pointer; }
.consent-check input { width: 24px; height: 24px; margin: 0; accent-color: var(--cyan); flex-shrink: 0; }
.noscript { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: var(--s3); background: var(--bg); }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes pop { 0% { transform: scale(.85); } 60% { transform: scale(1.08); } 100% { transform: scale(1); } }
@keyframes pulse { 50% { transform: scale(1.05); } }
@keyframes drift { to { transform: translate(40px, 40px); } }
@media (max-width: 859px) {
  .app { padding: 0 var(--s2); }
  .workspace { grid-template-columns: minmax(0, 1fr); }
  .intro { align-items: start; flex-direction: column; }
  .intro > p { max-width: 65ch; }
}
@media (max-width: 440px) {
  .card { padding: var(--s2); }
  .site-header { flex-wrap: wrap; }
  .site-header > .badge { font-size: 11px; }
  .card-heading { gap: var(--s1); }
  .card-heading h2 { font-size: 16px; }
  .card-heading .badge { padding: var(--s1); max-width: 50%; }
  .controls > button { flex: 1 1 auto; }
  .score-heading { align-items: start; gap: var(--s1); }
  .score-heading span:last-child { text-align: right; }
  .camera-placeholder h3 { font-size: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
```

## frontend/app.js

```javascript
"use strict";

// Only labels live here. The backend remains the sole source of emoji mappings.
const LABELS = ["happy", "sad", "angry", "surprised", "neutral"];
const FRAME_WIDTH = 320, JPEG_QUALITY = 0.75, SMOOTHING_WINDOW = 6;
const FRAME_INTERVAL_MS = 150, RESPONSE_TIMEOUT_MS = 30000;
const $ = (id) => document.getElementById(id);
const video = $("video"), overlay = $("overlay"), context = overlay.getContext("2d");
const capture = document.createElement("canvas"), captureContext = capture.getContext("2d");
const dialog = $("consent-dialog");
let ready = false, session = 0, stream = null, socket = null, active = false;
let pending = false, history = [], displayedLabel = null;
let frameTimer, responseTimer, connectTimer;
const scoreRows = new Map();

for (const label of LABELS) {
  const row = document.createElement("div");
  row.className = "score-row";
  row.innerHTML = `<span>${title(label)}</span><div class="bar-track" role="progressbar" aria-label="${title(label)} model score" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="No estimate"><div class="bar-fill"></div></div><output>—</output>`;
  $("scores").append(row);
  scoreRows.set(label, row);
}

function title(label) { return label[0].toUpperCase() + label.slice(1); }
function status(label, message, tone = "") {
  if ($("result-status").textContent !== label) $("result-status").textContent = label;
  $("result-status").dataset.tone = tone;
  $("camera-message").textContent = message;
  $("camera-message").dataset.tone = tone;
}
function bars(scores = null) {
  for (const [label, row] of scoreRows) {
    const value = scores ? Math.max(0, Math.min(100, scores[label])) : 0;
    row.querySelector(".bar-fill").style.width = `${value}%`;
    row.querySelector("[role=progressbar]").setAttribute("aria-valuenow", String(Math.round(value)));
    row.querySelector("[role=progressbar]").setAttribute("aria-valuetext", scores ? `${Math.round(value)}% model score` : "No estimate");
    row.querySelector("output").textContent = scores ? `${Math.round(value)}%` : "—";
  }
}
function resetResult(label = "Ready when you are") {
  history = []; displayedLabel = null;
  $("emoji").textContent = ""; $("emoji").classList.remove("pop");
  $("empty-symbol").hidden = false;
  if ($("result-label").textContent !== label) $("result-label").textContent = label;
  $("confidence").textContent = "No estimate yet";
  bars(); context.clearRect(0, 0, overlay.width, overlay.height);
}
async function requestJSON(path, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(path, { ...options, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error("request_failed");
    return await response.json();
  } finally { clearTimeout(timer); }
}
async function startup() {
  ready = false; $("retry-startup").hidden = true;
  $("startup-progress").value = 0;
  $("startup-message").textContent = "Connecting to the local backend…";
  let healthPassed = false;
  try {
    const health = await requestJSON("/api/health");
    if (health.status !== "ok") throw new Error("unhealthy");
    healthPassed = true; $("startup-progress").value = 1;
    $("startup-message").textContent = "Loading local AI… First setup may download model weights. Your camera is off.";
    const result = await requestJSON("/api/warmup", { method: "POST" }, 180000);
    if (!result.model_ready) throw new Error("model_not_ready");
    $("startup-progress").value = 2; $("startup-message").textContent = "Ready!";
    ready = true; $("start-camera").disabled = false;
    // A short transition follows completed work; progress is never simulated.
    setTimeout(() => {
      $("app").inert = false; $("app").classList.add("ready");
      $("splash").classList.add("leaving");
      setTimeout(() => { $("splash").hidden = true; }, 300);
    }, 300);
  } catch {
    $("startup-message").textContent = healthPassed
      ? "Local AI unavailable. Check the backend and model download, then retry. Your camera is off."
      : "Backend offline. Start the local server, then retry. Your camera is off.";
    $("retry-startup").hidden = false;
  }
}
function stopCamera(label = "Idle", message = "Camera stopped. Start again when you’re ready.", tone = "") {
  session++; active = false; pending = false;
  clearTimeout(frameTimer); clearTimeout(responseTimer); clearTimeout(connectTimer);
  const oldSocket = socket; socket = null;
  if (oldSocket) oldSocket.close();
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = null; video.pause(); video.srcObject = null; video.hidden = true;
  capture.width = 0; capture.height = 0;
  overlay.width = 0; overlay.height = 0;
  $("video-wrap").style.aspectRatio = "4 / 3";
  $("camera-placeholder").hidden = false; $("video-loading").hidden = true;
  $("preview-note").hidden = true; $("camera-badge").textContent = "Camera off";
  $("stop-camera").disabled = true; $("start-camera").disabled = !ready;
  resetResult(); status(label, message, tone);
  if (dialog.open) dialog.close();
}
function failConnection(token) {
  if (token !== session) return;
  stopCamera("Connection lost", "Connection lost. Camera stopped. Check the backend, then start again.", "error");
}
async function startCamera() {
  if (!ready || active || document.hidden) return;
  const token = ++session;
  active = true; resetResult();
  $("start-camera").disabled = true; $("stop-camera").disabled = false;
  $("video-loading").hidden = false; $("camera-badge").textContent = "Starting";
  status("Camera starting", "Allow camera access in your browser. You can stop or cancel at any time.");
  try {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      stopCamera("Camera unavailable", "Open this app on localhost or HTTPS in a browser with camera support.", "error");
      return;
    }
    const media = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } });
    // A permission prompt may finish after Stop or tab hiding. Release late tracks.
    if (token !== session || document.hidden) { media.getTracks().forEach((track) => track.stop()); return; }
    stream = media; video.srcObject = media;
    media.getVideoTracks().forEach((track) => track.addEventListener("ended", () => {
      if (token === session) stopCamera("Camera unavailable", "The camera disconnected. Reconnect it and start again.", "error");
    }));
    await video.play();
    if (token !== session) return;
    if (!video.videoWidth || !video.videoHeight) throw new Error("invalid_video");
    $("video-wrap").style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
    video.hidden = false; $("camera-placeholder").hidden = true;
    $("video-loading").hidden = true; $("preview-note").hidden = false;
    $("camera-badge").textContent = "Camera active";
    status("Camera active", "Connecting to local analysis…", "active");
    const ws = new WebSocket(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws/analyze`);
    socket = ws;
    connectTimer = setTimeout(() => failConnection(token), 10000);
    ws.onopen = () => { if (token === session) { clearTimeout(connectTimer); sendFrame(token); } };
    ws.onmessage = (event) => receiveFrame(event, token);
    ws.onerror = ws.onclose = () => failConnection(token);
  } catch (error) {
    if (token !== session) return;
    if (["NotAllowedError", "SecurityError"].includes(error.name)) {
      stopCamera("Camera permission denied", "Camera permission denied. Allow camera access in site settings, then start again.", "error");
    } else if (["NotFoundError", "DevicesNotFoundError", "OverconstrainedError"].includes(error.name)) {
      stopCamera("No camera found", "No camera found. Connect a webcam, then start again.", "error");
    } else {
      stopCamera("Camera unavailable", "Could not start the camera. Close other camera apps and try again.", "error");
    }
  }
}
function sendFrame(token) {
  if (token !== session || !active || pending || socket?.readyState !== WebSocket.OPEN) return;
  if (document.hidden) { stopCamera(); return; }
  pending = true;
  responseTimer = setTimeout(() => failConnection(token), RESPONSE_TIMEOUT_MS);
  try {
    capture.width = FRAME_WIDTH;
    capture.height = Math.max(1, Math.round(video.videoHeight * FRAME_WIDTH / video.videoWidth));
    captureContext.drawImage(video, 0, 0, capture.width, capture.height);
    capture.toBlob((blob) => {
      if (token !== session) return;
      if (!blob || socket?.readyState !== WebSocket.OPEN) { failConnection(token); return; }
      try { socket.send(blob); } catch { failConnection(token); }
    }, "image/jpeg", JPEG_QUALITY);
  } catch { failConnection(token); }
}
function validResult(data) {
  if (typeof data.face !== "boolean" || !data.frame || !Number.isInteger(data.frame.width)
      || !Number.isInteger(data.frame.height) || data.frame.width < 1 || data.frame.height < 1
      || data.frame.width > 1920 || data.frame.height > 1920) return false;
  if (!data.face) return true;
  return [...LABELS, "uncertain"].includes(data.label) && typeof data.emoji === "string"
    && data.emoji.length > 0 && data.emoji.length < 16 && Number.isFinite(data.confidence)
    && data.confidence >= 0 && data.confidence <= 100 && data.scores
    && LABELS.every((label) => Number.isFinite(data.scores[label])) && data.box
    && ["x", "y", "width", "height"].every((key) => Number.isFinite(data.box[key]));
}
function receiveFrame(event, token) {
  if (token !== session || !pending) return;
  clearTimeout(responseTimer); pending = false;
  try {
    const data = JSON.parse(event.data);
    if (data.error || !validResult(data)) {
      stopCamera("Analysis unavailable", "Local analysis failed. Camera stopped. Check the backend and model, then retry.", "error");
      return;
    }
    if (!data.face) {
      resetResult("No face detected");
      status("No face detected", "Face the camera in even lighting. No emotion is shown without a detected face.");
    } else {
      history.push(data); if (history.length > SMOOTHING_WINDOW) history.shift();
      const counts = new Map();
      history.forEach((item) => counts.set(item.label, (counts.get(item.label) || 0) + 1));
      const highest = Math.max(...counts.values());
      // Newest result wins a vote tie; its emoji and scores stay consistent.
      const chosen = [...history].reverse().find((item) => counts.get(item.label) === highest);
      showResult(chosen); drawBox(data, chosen.label === "uncertain");
    }
    frameTimer = setTimeout(() => sendFrame(token), FRAME_INTERVAL_MS);
  } catch { failConnection(token); }
}
function showResult(result) {
  const uncertain = result.label === "uncertain";
  $("empty-symbol").hidden = true; $("emoji").textContent = result.emoji;
  if (displayedLabel !== result.label) {
    $("emoji").classList.remove("pop"); void $("emoji").offsetWidth;
    $("emoji").classList.add("pop"); displayedLabel = result.label;
  }
  const labelText = uncertain ? "Not sure" : title(result.label);
  if ($("result-label").textContent !== labelText) $("result-label").textContent = labelText;
  $("confidence").textContent = `${Math.round(result.confidence)}% top model score · Smoothed over ${history.length} frame${history.length === 1 ? "" : "s"}`;
  bars(result.scores);
  status(uncertain ? "Not sure" : "Face detected", uncertain
    ? "The expression is unclear or outside the five supported categories."
    : "Showing an automated estimate of the largest visible face.", uncertain ? "warning" : "active");
}
function drawBox(data, uncertain) {
  overlay.width = data.frame.width; overlay.height = data.frame.height;
  const { x, y, width, height } = data.box;
  const colors = getComputedStyle(document.documentElement);
  context.strokeStyle = colors.getPropertyValue(uncertain ? "--amber" : "--cyan").trim();
  context.shadowColor = context.strokeStyle; context.shadowBlur = 8; context.lineWidth = 2;
  context.beginPath(); context.roundRect(x, y, width, height, Math.min(8, width / 2, height / 2)); context.stroke();
}
$("start-camera").addEventListener("click", () => {
  $("consent-checkbox").checked = false; $("confirm-consent").disabled = true; dialog.showModal();
});
$("consent-checkbox").addEventListener("change", () => { $("confirm-consent").disabled = !$("consent-checkbox").checked; });
$("cancel-consent").addEventListener("click", () => dialog.close());
$("consent-form").addEventListener("submit", (event) => {
  event.preventDefault(); if (!$("consent-checkbox").checked) return;
  dialog.close(); startCamera();
});
dialog.addEventListener("close", () => { $("consent-checkbox").checked = false; $("confirm-consent").disabled = true; });
dialog.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const controls = [...dialog.querySelectorAll("input:not(:disabled), button:not(:disabled)")];
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
$("stop-camera").addEventListener("click", () => stopCamera());
$("retry-startup").addEventListener("click", startup);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopCamera("Idle", "Camera stopped because this tab was hidden. Start again when you’re ready.");
});
window.addEventListener("pagehide", () => stopCamera());
window.addEventListener("beforeunload", () => stopCamera());
window.addEventListener("offline", () => { if (active) failConnection(session); });
startup();
```

## frontend/fonts/OFL.txt

```text
Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## Bundled font

Binary file: `frontend/fonts/InterVariable.woff2`

SHA-256: `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3`

The font is served locally. No Google Fonts request is needed at runtime.
