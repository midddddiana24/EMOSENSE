"use strict";

// Only labels live here. The backend remains the sole source of emoji mappings.
const LABELS = ["happy", "sad", "angry", "surprised", "neutral"];
const FRAME_WIDTH = 320, JPEG_QUALITY = 0.75, SMOOTHING_WINDOW = 6;
const FRAME_INTERVAL_MS = 150, RESPONSE_TIMEOUT_MS = 30000;
const $ = (id) => document.getElementById(id);
const video = $("video"), overlay = $("overlay"), context = overlay.getContext("2d");
const capture = document.createElement("canvas"), captureContext = capture.getContext("2d");
const dialog = $("consent-dialog");
const cloudDialog = $("cloud-dialog");
let cloudAvailable = false, cloudBusy = false, cloudController = null;
let ready = false, session = 0, stream = null, socket = null, active = false;
let pending = false, history = [], displayedLabel = null;
let frameTimer, responseTimer, connectTimer;
const scoreRows = new Map();
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let effectsReduced = motionPreference.matches;

function updateEffects() {
  const reduced = effectsReduced || motionPreference.matches;
  if (reduced) resetPupils();
  document.documentElement.dataset.effects = reduced ? "reduced" : "full";
  for (const id of ["effects-toggle", "startup-effects"]) {
    $(id).setAttribute("aria-pressed", String(reduced));
    $(id).textContent = reduced ? "Effects reduced" : "Reduce effects";
    $(id).disabled = motionPreference.matches;
    $(id).title = motionPreference.matches ? "Reduced motion follows your system preference" : "Change decorative motion for this session";
  }
}
for (const id of ["effects-toggle", "startup-effects"]) $(id).addEventListener("click", () => {
  effectsReduced = !effectsReduced; updateEffects();
});
motionPreference.addEventListener("change", updateEffects);
updateEffects();
$("focus-view").addEventListener("click", () => {
  const focused = $("app").classList.toggle("focus-view");
  $("focus-view").setAttribute("aria-pressed", String(focused));
  $("focus-view").textContent = focused ? "Exit Focus view" : "Focus view";
});
function updateVideoRatio() {
  if (video.videoWidth && video.videoHeight && active) {
    $("video-wrap").style.setProperty("--video-ratio", video.videoWidth / video.videoHeight);
  }
}
video.addEventListener("resize", updateVideoRatio);
const CAPTIONS = {
  happy: "A bright little moment.", sad: "No pressure to smile. Take your time.",
  angry: "A pause is always okay.", surprised: "That's an expressive look!",
  neutral: "A quiet expression counts too.", uncertain: "Not sure yet. Try facing the camera.",
};
let captionsMuted = false, lastCaptionAt = -Infinity, crewLabel = null, captionTimer;
for (const [index, label] of LABELS.entries()) {
  const tile = document.createElement("div");
  tile.className = "mascot-tile"; tile.dataset.label = label; tile.dataset.selected = "false";
  tile.style.setProperty("--character-color", Mascots.colors[label]);
  tile.style.setProperty("--slot", index);
  tile.style.setProperty("--tilt", `${[-9, 6, -4, 8, -6][index]}deg`);
  tile.innerHTML = `<div class="mascot-pose">${Mascots.svg(label, true)}<span class="mascot-check">&#10003;</span></div>`;
  const button = document.createElement("button"); button.type = "button"; button.dataset.label = label;
  button.setAttribute("aria-label", `Greet the ${title(label)} character; does not select a result`);
  button.textContent = title(label);
  button.addEventListener("click", () => {
    tile.classList.remove("waving"); void tile.offsetWidth; tile.classList.add("waving");
  });
  $("mascot-crew").append(tile); $("crew-greetings").append(button);
}
const stageObserver = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  if (!height) return;
  $("crew-stage").style.setProperty("--rest-scale", Math.min(.8, width / 5 * 1.45 / height));
  $("crew-stage").style.setProperty("--edge-shift", `${Math.max(0, height / 2 - width / 10 - 8)}px`);
});
stageObserver.observe($("crew-stage"));
for (const selector of [".startup-crew", ".placeholder-crew"]) {
  document.querySelector(selector).innerHTML = ["sad", "happy", "surprised"].map((label) => Mascots.svg(label)).join("");
}
function hideCaption() {
  clearTimeout(captionTimer);
  $("caption").hidden = true; $("caption-text").textContent = "";
  $("caption-idle").hidden = false;
  $("caption-idle").textContent = captionsMuted
    ? "Captions muted. Tap a character to greet it."
    : "Characters are illustrations. Tap to greet, not select.";
}
function selectCrew(label) {
  crewLabel = label;
  for (const tile of document.querySelectorAll(".mascot-tile")) {
    const selected = tile.dataset.label === label;
    tile.dataset.selected = String(selected);
    const button = $("crew-greetings").querySelector(`[data-label="${tile.dataset.label}"]`);
    button.dataset.selected = String(selected);
    button.setAttribute("aria-label", `${title(tile.dataset.label)} character${selected ? ", current estimate" : ""}; tap to greet, not select`);
  }
  $("crew-stage").dataset.activeLabel = LABELS.includes(label) ? label : "";
  $("crew-selection").textContent = LABELS.includes(label) ? `Current estimate: ${title(label)}` : "No character selected";
  hideCaption();
  if (captionsMuted || !LABELS.includes(label)) return;
  // Replace stale captions immediately; delay the new one without moving the layout.
  const showCaption = () => {
    if (captionsMuted || crewLabel !== label || document.hidden) return;
    $("caption-text").textContent = CAPTIONS[label]; $("caption").hidden = false;
    $("caption-idle").hidden = true; lastCaptionAt = performance.now();
  };
  const remaining = Math.max(0, 10000 - (performance.now() - lastCaptionAt));
  if (remaining) captionTimer = setTimeout(showCaption, remaining);
  else showCaption();
}
$("caption-dismiss").addEventListener("click", hideCaption);
$("caption-mute").addEventListener("click", () => {
  captionsMuted = !captionsMuted;
  $("caption-mute").setAttribute("aria-pressed", String(captionsMuted));
  $("caption-mute").textContent = captionsMuted ? "Unmute" : "Mute";
  $("caption-mute").setAttribute("aria-label", captionsMuted ? "Unmute captions" : "Mute captions");
  if (captionsMuted) hideCaption();
  else selectCrew(crewLabel);
});
let pointerFrame = null, pointerX = 0, pointerY = 0;
function resetPupils() {
  for (const pupil of document.querySelectorAll(".pupils")) pupil.style.transform = "";
}
document.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch" || effectsReduced || motionPreference.matches || document.hidden) return;
  pointerX = event.clientX; pointerY = event.clientY;
  if (pointerFrame !== null) return;
  pointerFrame = requestAnimationFrame(() => {
    pointerFrame = null;
    if (effectsReduced || motionPreference.matches || document.hidden) { resetPupils(); return; }
    for (const tile of document.querySelectorAll(".mascot-tile")) {
      const rect = tile.getBoundingClientRect(), dx = pointerX - rect.x - rect.width / 2, dy = pointerY - rect.y - rect.height / 2;
      const distance = Math.hypot(dx, dy) || 1;
      tile.querySelector(".pupils").style.transform = `translate(${(dx / distance * 3.5).toFixed(2)}px, ${(dy / distance * 3.5).toFixed(2)}px)`;
    }
  });
});
document.documentElement.addEventListener("pointerleave", resetPupils);
function startupStep(id, state, text) {
  $(id).dataset.state = state; $(id).querySelector(".step-state").textContent = text;
}

for (const label of LABELS) {
  const row = document.createElement("div");
  row.className = "score-row";
  row.style.setProperty("--score-color", Mascots.colors[label]);
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
  selectCrew(null);
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
  document.documentElement.dataset.startup = "loading";
  startupStep("health-step", "busy", "Checking…");
  startupStep("model-step", "waiting", "Waiting");
  ready = false; $("retry-startup").hidden = true;
  $("startup-progress").value = 0;
  $("startup-message").textContent = "Connecting to the local backend…";
  let healthPassed = false;
  try {
    const health = await requestJSON("/api/health");
    if (health.status !== "ok") throw new Error("unhealthy");
    cloudAvailable = health.cloud_available === true;
    resetCloud();
    healthPassed = true; $("startup-progress").value = 1;
    startupStep("health-step", "done", "Connected");
    startupStep("model-step", "busy", "Loading…");
    $("startup-message").textContent = "Loading local AI… First setup may download model weights. Your camera is off.";
    const result = await requestJSON("/api/warmup", { method: "POST" }, 180000);
    if (!result.model_ready) throw new Error("model_not_ready");
    $("startup-progress").value = 2; $("startup-message").textContent = "Ready!";
    startupStep("model-step", "done", "Ready");
    document.documentElement.dataset.startup = "ready";
    ready = true; $("start-camera").disabled = false;
    // A short transition follows completed work; progress is never simulated.
    setTimeout(() => {
      $("app").inert = false; $("app").classList.add("ready");
      $("splash").classList.add("leaving");
      setTimeout(() => { $("splash").hidden = true; }, 300);
    }, 300);
  } catch {
    document.documentElement.dataset.startup = "error";
    startupStep(healthPassed ? "model-step" : "health-step", "error", "Unavailable");
    $("startup-message").textContent = healthPassed
      ? "Local AI unavailable. Check the backend and model download, then retry. Your camera is off."
      : "Backend offline. Start the local server, then retry. Your camera is off.";
    $("retry-startup").hidden = false;
  }
}
function stopCamera(label = "Idle", message = "Camera stopped. Start again when you’re ready.", tone = "") {
  session++; active = false; pending = false;
  PhotoCards.stop(); resetPupils();
  if (pointerFrame !== null) cancelAnimationFrame(pointerFrame);
  pointerFrame = null;
  if (cloudController) cloudController.abort();
  cloudController = null; cloudBusy = false;
  if (cloudDialog.open) cloudDialog.close();
  resetCloud();
  clearTimeout(frameTimer); clearTimeout(responseTimer); clearTimeout(connectTimer);
  const oldSocket = socket; socket = null;
  if (oldSocket) oldSocket.close();
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = null; video.pause(); video.srcObject = null; video.hidden = true;
  capture.width = 0; capture.height = 0;
  overlay.width = 0; overlay.height = 0;
  $("video-wrap").style.removeProperty("--video-ratio");
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
  $("video-loading-text").textContent = "Starting your camera…";
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
    updateVideoRatio();
    video.hidden = false; $("camera-placeholder").hidden = true;
    $("video-loading-text").textContent = "Waiting for the first local analysis…";
    $("preview-note").hidden = false;
    $("camera-badge").textContent = "Camera active";
    status("Camera active", "Connecting to local analysis…", "active");
    const ws = new WebSocket(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws/analyze`);
    socket = ws;
    connectTimer = setTimeout(() => failConnection(token), 10000);
    ws.onopen = () => { if (token === session) { clearTimeout(connectTimer); updateCloudButton(); sendFrame(token); } };
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
  if (token !== session || !active || pending || cloudBusy || PhotoCards.busy || socket?.readyState !== WebSocket.OPEN) return;
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
    if (!cloudBusy) $("video-loading").hidden = true;
    if (data.error || !validResult(data)) {
      stopCamera("Analysis unavailable", "Local analysis failed. Camera stopped. Check the backend and model, then retry.", "error");
      return;
    }
    if (!data.face) {
      resetResult("No face detected");
      if (!cloudBusy) $("cloud-result").hidden = true;
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
    selectCrew(result.label);
    $("emoji").classList.remove("pop"); void $("emoji").offsetWidth;
    $("emoji").classList.add("pop"); displayedLabel = result.label;
  }
  const labelText = uncertain ? "Not sure" : title(result.label);
  if ($("result-label").textContent !== labelText) $("result-label").textContent = labelText;
  $("confidence").textContent = `${Math.round(result.confidence)}% top model score · Smoothed over ${history.length} frame${history.length === 1 ? "" : "s"}`;
  bars(result.scores);
  status(uncertain ? "Not sure" : "Face detected", uncertain
    ? "Expression unclear—take your time. It may be outside the five supported categories."
    : "Showing an automated estimate of the largest visible face.", uncertain ? "warning" : "active");
}
function drawBox(data, uncertain) {
  overlay.width = data.frame.width; overlay.height = data.frame.height;
  const { x, y, width, height } = data.box;
  const colors = getComputedStyle(document.documentElement);
  context.strokeStyle = colors.getPropertyValue(uncertain ? "--amber" : "--box").trim();
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
for (const modal of [dialog, cloudDialog, $("photo-dialog")]) modal.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const controls = [...modal.querySelectorAll("input:not(:disabled), button:not(:disabled)")].filter((control) => control.getClientRects().length);
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
function updateCloudButton() {
  PhotoCards.updateButton();
  $("cloud-snapshot").disabled = !cloudAvailable || !active || cloudBusy || PhotoCards.busy || socket?.readyState !== WebSocket.OPEN;
}
function resetCloud() {
  $("cloud-result").hidden = true; $("cloud-label").textContent = ""; $("cloud-reason").textContent = "";
  $("cloud-status").textContent = cloudAvailable ? "Optional snapshot" : "Cloud AI off";
  $("cloud-status").dataset.tone = "";
  $("cloud-message").textContent = cloudAvailable
    ? "Each snapshot needs your confirmation. Start the camera to use it."
    : "Cloud AI is off or unconfigured. Local analysis needs no cloud service.";
  updateCloudButton();
}
async function sendCloudSnapshot() {
  if (!active || !cloudAvailable || cloudBusy || PhotoCards.busy || document.hidden || !stream) return;
  const token = session;
  cloudBusy = true; cloudDialog.close(); updateCloudButton();
  clearTimeout(frameTimer); $("cloud-result").hidden = true;
  $("cloud-status").textContent = "Cloud AI processing";
  $("cloud-status").dataset.tone = "active";
  $("cloud-message").textContent = "Processing one snapshot. Local frame sending is paused.";
  $("video-loading-text").textContent = "Processing one cloud snapshot…";
  $("video-loading").hidden = false;
  const controller = new AbortController(); cloudController = controller;
  const timer = setTimeout(() => controller.abort(), 45000);
  const shot = document.createElement("canvas");
  try {
    shot.width = FRAME_WIDTH;
    shot.height = Math.max(1, Math.round(video.videoHeight * FRAME_WIDTH / video.videoWidth));
    shot.getContext("2d").drawImage(video, 0, 0, shot.width, shot.height);
    const blob = await new Promise((resolve, reject) => {
      const abort = () => reject(new DOMException("Snapshot cancelled", "AbortError"));
      controller.signal.addEventListener("abort", abort, { once: true });
      shot.toBlob((value) => {
        controller.signal.removeEventListener("abort", abort); resolve(value);
      }, "image/jpeg", JPEG_QUALITY);
    });
    shot.width = 0; shot.height = 0;
    if (token !== session) return;
    if (controller.signal.aborted) throw new Error("snapshot_timeout");
    if (!blob) throw new Error("capture_failed");
    const response = await fetch("/api/analyze-cloud", {
      method: "POST", headers: { "Content-Type": "image/jpeg", "X-Confirm-Cloud": "true" },
      body: blob, signal: controller.signal, cache: "no-store",
    });
    const result = await response.json();
    if (token !== session) return;
    if (!response.ok || typeof result.reason !== "string"
        || typeof result.face !== "boolean") throw new Error("cloud_unavailable");
    if (result.face && (![...LABELS, "uncertain"].includes(result.label)
        || typeof result.emoji !== "string")) throw new Error("invalid_result");
    $("cloud-result").hidden = false;
    $("cloud-label").textContent = result.face
      ? `${result.emoji} ${result.label === "uncertain" ? "Not sure" : title(result.label)}` : "No face detected";
    $("cloud-reason").textContent = result.reason;
    $("cloud-status").textContent = result.face ? "Snapshot complete" : "No face detected";
    $("cloud-status").dataset.tone = result.face ? "active" : "warning";
    $("cloud-message").textContent = result.face
      ? "One snapshot analyzed. Local analysis continues. Another snapshot needs a new confirmation."
      : "No face detected in the snapshot. No image was sent to OpenRouter.";
  } catch {
    if (token !== session) return;
    $("cloud-status").textContent = "Cloud AI unavailable";
    $("cloud-status").dataset.tone = "error";
    $("cloud-message").textContent = "Cloud request failed or timed out. Local analysis continues. No automatic retry was made; an image already sent cannot be recalled.";
  } finally {
    clearTimeout(timer); shot.width = 0; shot.height = 0;
    if (token === session) {
      cloudBusy = false; cloudController = null; $("video-loading").hidden = true;
      updateCloudButton(); frameTimer = setTimeout(() => sendFrame(token), FRAME_INTERVAL_MS);
    }
  }
}
$("cloud-snapshot").addEventListener("click", () => {
  if (active && cloudAvailable && !cloudBusy) cloudDialog.showModal();
});
$("cancel-cloud").addEventListener("click", () => cloudDialog.close());
$("confirm-cloud").addEventListener("click", sendCloudSnapshot);
$("stop-camera").addEventListener("click", () => stopCamera());
$("retry-startup").addEventListener("click", startup);
document.addEventListener("visibilitychange", () => {
  document.documentElement.classList.toggle("page-hidden", document.hidden);
  if (document.hidden) resetPupils();
  if (document.hidden) stopCamera("Idle", "Camera stopped because this tab was hidden. Start again when you’re ready.");
});
window.addEventListener("pagehide", () => stopCamera());
window.addEventListener("beforeunload", () => stopCamera());
window.addEventListener("offline", () => { if (active) failConnection(session); });
PhotoCards.init({ video, getSession: () => session, validResult, stopCamera: () => stopCamera(),
  canCapture: () => active && !cloudBusy && socket?.readyState === WebSocket.OPEN,
  onBusyChange: () => {
    clearTimeout(frameTimer); updateCloudButton();
    if (!PhotoCards.busy && active) frameTimer = setTimeout(() => sendFrame(session), FRAME_INTERVAL_MS);
  },
});
startup();
