# Playful UI verification

## Automated evidence

Python: **103 passed**, with one Starlette/AnyIO deprecation warning. All three JavaScript files passed `node --check`. Browser checks used Chromium with an in-memory synthetic red/blue video stream and mocked expression/cloud responses. Real local no-face WebSocket and photo-snapshot endpoints were exercised. Real health/warmup passed during an earlier run of this redesign; the final browser run mocked startup to avoid repeating ML warmup. No live cloud inference was requested.

Viewport checks covered 320, 375, 414, 768, 859, 860, 1024, and 1440 CSS pixels, including landscape dialog bounds. Tested desktop and modal states had no axe WCAG A/AA violations. This is not full accessibility certification.

- Character startup, actual task progress, inert app/camera until ready, session effects toggle, bounded cursor-following pupils, expandable guide: PASS
- Startup health/warmup flow, no camera before consent, Escape cancellation, live synthetic-camera/no-face WS, Stop track cleanup, desktop axe, no external UI requests: PASS
- 375px layout, reduced motion, dialog axe, focus containment, Cancel without camera: PASS
- 320/375/414/768px overflow, single-line visible buttons, and dialog bounds (including landscape): PASS
- Keyboard skip link, 859/860px grid breakpoint, long cloud text wrapping: PASS
- Permission denied, missing camera, busy camera: PASS
- Backend offline and model-loading failure: PASS
- Majority smoothing, newest tie, no-face reset, uncertain state, mirrored overlay, one-in-flight backpressure, disconnect cleanup: PASS
- Simulated tab hiding, pagehide, and late permission after Stop all release tracks: PASS
- Cloud defaults off; confirm/cancel/Escape; warning accessibility at 320/375/414/768px; one JPEG per confirmation; double-click guard; spinner; local pause/resume; no-face reset; 502 recovery; no retry; Stop ignores late response: PASS
- Cloud Stop before JPEG encoding completes sends no request; tab hiding aborts pending cloud UI and releases tracks: PASS
- Mascot selection, greet does not classify, caption cooldown/mute, no-face deselection: PASS
- Photo consent/cancel, real local no-face blocking, exact capture JPEG, mirrored 1080x1350 PNG download, neutral/uncertain templates and filenames, Retake/Discard memory clearing, Stop/tab hiding ignore late capture: PASS

Photo tests verified a mirrored 1080 x 1350 PNG from the exact captured JPEG, independent of the live smoothed result, including neutral and uncertain templates. Download test artifacts contain synthetic color blocks, not real webcam images. Backend tests cover consent/origin/type/size validation, no-face handling, error sanitization, current free-vision model validation, one outbound image attempt, zero-price provider controls, and cloud failure paths.

## Repeating checks

From the repository root on Windows:

```powershell
.\venv\Scripts\python.exe -m pytest tests -q --basetemp=.pytest_cache/checks
node --check frontend/app.js
node --check frontend/mascots.js
node --check frontend/photo.js
```

Use the manual sequence below for the real webcam. Automated browser checks were run using workspace-local Playwright tooling; they are not an installed project dependency.

## Manual demo checks

1. Start Uvicorn using README instructions. Open http://127.0.0.1:8000 and wait for the two real startup tasks.
2. Stop the backend temporarily and verify the retry message. Restore it and retry.
3. Try Reduce effects and system reduced motion; cursor-following pupils and decorative motion should stop.
4. Cancel participation consent: no camera permission should be requested. Agree, then allow the camera and verify face-box alignment.
5. Explore the five expressions; the stable matching mascot should rise. No face clears the result; uncertain selects no mascot.
6. Click a mascot: it waves without changing the expression result. Mute or dismiss captions.
7. Open Photo card, cancel, and verify nothing was captured. Reopen, consent, capture, inspect the mirrored preview, and explicitly download if desired.
8. Try Retake, Discard, Stop inside the dialog, tab hiding, and page exit. Confirm camera release and preview clearing. A downloaded file remains under the user's control.
9. Check camera permission denied, no camera, and another app holding the device.
10. Only if cloud is privately configured, review its warning and confirm one snapshot. Test Cancel first. There is no automatic retry or paid fallback.

## Scope and limits

No physical webcam, Safari/Firefox, macOS/Linux installation, or live OpenRouter authorization, routing, billing, or inference acceptance was verified. No face image was transmitted to an external AI service. External provider policies still apply to any future confirmed cloud request. Free model availability is not guaranteed. No accuracy or speed claim is made. Dataset evaluation, Chapter IV test-log template, and the full final paper-requirements audit remain pending.

The explicitly requested browser photo-card download revises the original blanket no-image-saving requirement. Server-side frame storage remains absent. The playful light design and local fonts replace the earlier dark glass style; OpenRouter replaces direct Anthropic integration. These are intentional changes from the initial specification.
