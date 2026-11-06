"use strict";

// Captured photos and composed cards exist only in browser memory until Download.
const PhotoCards = (() => {
  let options, dialog, preview, controller = null, processing = false, generation = 0;
  let cardLabel = null;
  const downloadURLs = new Set();
  const el = (id) => document.getElementById(id);
  function updateButton() {
    if (options) el("photo-card").disabled = !options.canCapture() || dialog.open || processing;
  }
  function clearPreview() {
    generation++;
    if (controller) controller.abort();
    controller = null; processing = false; cardLabel = null;
    preview.width = 0; preview.height = 0; preview.hidden = true;
    el("photo-consent").hidden = false; el("photo-checkbox").checked = false;
    el("photo-capture").disabled = true;
    el("photo-retake").hidden = true; el("photo-download").hidden = true;
    el("photo-message").textContent = "No image has been captured.";
  }
  function close() {
    if (!options) return;
    clearPreview();
    if (dialog.open) dialog.close();
    updateButton(); options.onBusyChange();
  }
  function stop() {
    close();
    downloadURLs.forEach((url) => URL.revokeObjectURL(url)); downloadURLs.clear();
  }
  async function renderCard(bitmap, result) {
    await document.fonts.ready;
    const art = new Image();
    await new Promise((resolve, reject) => {
      art.onload = resolve; art.onerror = reject;
      art.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(Mascots.svg(result.label));
    });
    const card = document.createElement("canvas"); card.width = 1080; card.height = 1350;
    const ctx = card.getContext("2d"), ink = "#171717", cream = "#FFF8E7";
    ctx.fillStyle = Mascots.colors[result.label]; ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = ink; ctx.font = '900 52px Nunito'; ctx.fillText("EmoSense.", 64, 92);
    ctx.font = '900 80px Nunito'; ctx.fillText(result.label === "uncertain" ? "Not sure" : result.label[0].toUpperCase() + result.label.slice(1), 64, 190);
    ctx.fillStyle = cream; ctx.beginPath(); ctx.roundRect(64, 240, 952, 660, 24); ctx.fill();
    ctx.save(); ctx.clip();
    const scale = Math.min(952 / bitmap.width, 660 / bitmap.height);
    const w = bitmap.width * scale, h = bitmap.height * scale;
    // Mirror exactly as the live preview does, without cropping faces out of frame.
    ctx.translate(64 + 952, 240); ctx.scale(-1, 1);
    ctx.drawImage(bitmap, (952 - w) / 2, (660 - h) / 2, w, h); ctx.restore();
    ctx.strokeStyle = ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(64, 240, 952, 660, 24); ctx.stroke();
    ctx.drawImage(art, 730, 940, 270, 270);
    ctx.fillStyle = ink; ctx.font = '900 48px Nunito'; ctx.fillText("A little expression.", 64, 1010);
    ctx.fillText("A whole lot of you.", 64, 1070);
    ctx.font = '400 26px "DM Sans"'; ctx.fillText("Visible-expression estimate, not your feelings.", 64, 1240);
    ctx.fillText("Educational demo - Downloaded by your choice.", 64, 1285);
    return card;
  }
  async function capture() {
    if (!options.canCapture() || !el("photo-checkbox").checked || processing || document.hidden) return;
    const version = ++generation, session = options.getSession();
    processing = true;
    const operation = new AbortController(); controller = operation;
    const signal = operation.signal;
    const timer = setTimeout(() => operation.abort(), 30000);
    const frame = document.createElement("canvas");
    let bitmap = null, rendered = null;
    el("photo-capture").disabled = true; el("photo-message").textContent = "Capturing and analyzing this exact frame locally...";
    updateButton(); options.onBusyChange();
    try {
      frame.width = Math.min(960, options.video.videoWidth);
      frame.height = Math.max(1, Math.round(options.video.videoHeight * frame.width / options.video.videoWidth));
      if (frame.height > 1920 || frame.width * frame.height > 1920 * 1080) throw new Error("unsupported_frame");
      frame.getContext("2d").drawImage(options.video, 0, 0, frame.width, frame.height);
      const blob = await new Promise((resolve, reject) => {
        const abort = () => reject(new DOMException("Cancelled", "AbortError"));
        signal.addEventListener("abort", abort, { once: true });
        frame.toBlob((value) => { signal.removeEventListener("abort", abort); resolve(value); }, "image/jpeg", .9);
      });
      frame.width = 0; frame.height = 0;
      if (version !== generation || session !== options.getSession()) return;
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      if (!blob) throw new Error("capture_failed");
      const response = await fetch("/api/analyze-snapshot", { method: "POST",
        headers: { "Content-Type": "image/jpeg", "X-Confirm-Photo": "true" }, body: blob, signal, cache: "no-store" });
      const result = await response.json();
      if (version !== generation || session !== options.getSession()) return;
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      if (!response.ok || !options.validResult(result)) throw new Error("analysis_failed");
      if (!result.face) {
        el("photo-message").textContent = "No face detected. No card was created. Face the camera and try again.";
        return;
      }
      bitmap = await createImageBitmap(blob);
      rendered = await renderCard(bitmap, result);
      if (version !== generation || session !== options.getSession()) return;
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      preview.width = 1080; preview.height = 1350;
      preview.getContext("2d").drawImage(rendered, 0, 0); preview.hidden = false;
      cardLabel = result.label;
      el("photo-consent").hidden = true;
      el("photo-retake").hidden = false; el("photo-download").hidden = false;
      el("photo-message").textContent = "Preview only. Nothing has been saved. Choose Download PNG or Discard.";
      el("photo-download").focus();
    } catch {
      if (version === generation) el("photo-message").textContent = "Could not create the card. Nothing was saved. Retry or discard.";
    } finally {
      clearTimeout(timer); frame.width = 0; frame.height = 0;
      if (bitmap) bitmap.close();
      if (rendered) { rendered.width = 0; rendered.height = 0; }
      if (version === generation) {
        processing = false; controller = null;
        el("photo-capture").disabled = !el("photo-checkbox").checked;
        updateButton(); options.onBusyChange();
      }
    }
  }
  function download() {
    if (!cardLabel || preview.hidden || processing) return;
    const version = generation, label = cardLabel;
    preview.toBlob((blob) => {
      if (!blob || version !== generation || !dialog.open) return;
      const url = URL.createObjectURL(blob); downloadURLs.add(url);
      const link = document.createElement("a"); link.href = url; link.download = `emosense-${label}.png`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => { URL.revokeObjectURL(url); downloadURLs.delete(url); }, 1000);
      close();
    }, "image/png");
  }
  function init(settings) {
    options = settings; dialog = el("photo-dialog"); preview = el("photo-preview");
    el("photo-card").addEventListener("click", () => {
      if (!options.canCapture()) return;
      clearPreview(); dialog.showModal(); updateButton(); options.onBusyChange();
    });
    el("photo-checkbox").addEventListener("change", () => { el("photo-capture").disabled = !el("photo-checkbox").checked || processing; });
    el("photo-capture").addEventListener("click", capture);
    el("photo-discard").addEventListener("click", close);
    el("photo-stop").addEventListener("click", options.stopCamera);
    el("photo-retake").addEventListener("click", () => { clearPreview(); options.onBusyChange(); el("photo-checkbox").focus(); });
    el("photo-download").addEventListener("click", download);
    dialog.addEventListener("close", () => { clearPreview(); updateButton(); options.onBusyChange(); });
  }
  return { init, stop, updateButton, get busy() { return Boolean(dialog?.open || processing); } };
})();
