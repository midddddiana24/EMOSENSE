# UI redesign verification

## Automated evidence

Python: **85 passed**, with one Starlette/AnyIO deprecation warning. JavaScript syntax check passed. Browser checks used Chromium, a controlled in-memory video stream, and mocked cloud responses. The health/warmup and local no-face WebSocket checks used the real local backend.

Viewport checks included 320, 375, 414, 768, 859, 860, 1024, and 1440 CSS pixels, plus landscape dialog bounds. Tested desktop and modal states had no axe WCAG A/AA violations. This is not a full accessibility certification.

- 3D startup, actual task progress, inert app/camera until ready, session effects toggle, scanner hover tilt, expandable guide: PASS
- Real health/warmup, no camera before consent, Escape cancellation, live synthetic-camera/no-face WS, Stop track cleanup, desktop axe, no external UI requests: PASS
- 375px layout, reduced motion, dialog axe, focus containment, Cancel without camera: PASS
- 320/375/414/768px overflow, single-line visible buttons, and dialog bounds (including landscape): PASS
- Keyboard skip link, 859/860px grid breakpoint, long cloud text wrapping: PASS
- Permission denied, missing camera, busy camera: PASS
- Backend offline and model-loading failure: PASS
- Majority smoothing, newest tie, no-face reset, uncertain state, mirrored overlay, one-in-flight backpressure, disconnect cleanup: PASS
- Simulated tab hiding, pagehide, and late permission after Stop all release tracks: PASS
- Cloud defaults off; confirm/cancel/Escape; warning accessibility at 320/375/414/768px; one JPEG per confirmation; double-click guard; spinner; local pause/resume; no-face reset; 502 recovery; no retry; Stop ignores late response: PASS
- Cloud Stop before JPEG encoding completes sends no request; tab hiding aborts pending cloud UI and releases tracks: PASS

## Verification limits

No physical webcam, Safari/Firefox, macOS/Linux installation, or live Anthropic authorization/billing/inference acceptance was performed. No image was transmitted to Anthropic during these tests. No dataset accuracy or speed claim is made. Dataset evaluation and the final paper-requirements audit remain pending.

## Manual demo checks

1. Start the backend using README instructions and open localhost.
2. Check connection/model task states; retry after an intentionally stopped backend.
3. Test Reduce effects and system reduced-motion preference.
4. Expand How to use using pointer and keyboard.
5. Cancel consent and confirm the camera stays off.
6. Agree, allow camera access, and check box alignment with a physical webcam.
7. Leave the frame: no emotion should remain.
8. Stop, switch tabs, and close the page: confirm the camera indicator turns off.
9. If cloud is explicitly configured, test Cancel before sending and confirm each snapshot separately. Provider retention and charges may apply.
