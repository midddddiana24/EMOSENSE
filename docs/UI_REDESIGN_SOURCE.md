# Complete UI redesign source

Full contents of the frontend and setup README at the redesign handoff. No excerpts. Backend API contracts are unchanged.

## frontend/index.html

````html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#090d1b">
  <meta name="description" content="A consent-first educational demo of local facial expression estimates and matching emojis.">
  <title>EmoSense · Facial expression demo</title>
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="/style.css">
  <script src="/app.js" defer></script>
</head>
<body>
  <div class="ambient" aria-hidden="true"><i></i><i></i></div>
  <section id="splash" class="splash" aria-labelledby="splash-title">
    <div class="splash-content">
      <p class="splash-kicker">Your local expression lab</p>
      <div class="scanner-mount scanner-large" data-scanner aria-hidden="true"></div>
      <h1 id="splash-title" class="gradient-text">EmoSense</h1>
      <p>Facial expressions, explored with care.</p>
      <progress id="startup-progress" max="2" value="0" aria-label="Startup tasks completed"></progress>
      <ol class="startup-tasks" aria-label="Startup checks">
        <li id="health-step" data-state="busy"><span>Backend connection</span><span class="step-state">Checking…</span></li>
        <li id="model-step" data-state="waiting"><span>Expression model</span><span class="step-state">Waiting</span></li>
      </ol>
      <p id="startup-message" role="status">Connecting to the local backend…</p>
      <button id="retry-startup" type="button" hidden>Retry connection</button>
      <p class="small">Your camera stays off until you agree to participate.</p>
      <button id="startup-effects" class="effects-button secondary" type="button" aria-pressed="false">Reduce effects</button>
    </div>
  </section>

  <div id="app" class="app" inert>
    <a class="skip-link" href="#main-content">Skip to camera and results</a>
    <header class="site-header">
      <a class="brand" href="/" aria-label="EmoSense home"><span class="brand-mark" aria-hidden="true">e</span>EmoSense</a>
      <div class="header-tools"><span class="badge"><span class="dot" aria-hidden="true"></span>Local AI - Real-time</span><button id="effects-toggle" class="effects-button secondary" type="button" aria-pressed="false">Reduce effects</button></div>
    </header>
    <main id="main-content" tabindex="-1">
      <div class="intro"><div><p class="eyebrow">Facial expression exploration</p><h1>An expression, reflected.</h1></div>
        <p>Explore five visible expressions and their matching emojis. You choose when to start and stop.</p>
      </div>
      <ol class="pipeline" aria-label="Analysis pipeline"><li>Webcam</li><li>Face detection</li><li>Expression analysis</li><li>Classification</li><li>Emoji</li></ol>
      <details class="quick-guide"><summary>How to use EmoSense</summary><ol><li>Choose Start camera and review the participation notice.</li><li>Allow camera access. Face the camera in even lighting and keep others out of view unless they agree.</li><li>Explore expressions. A result is an estimate of visible features, not your feelings.</li><li>Choose Stop camera at any time. Switching tabs also stops the camera.</li></ol><p>Cloud snapshots are optional and need a separate confirmation for every image.</p></details>
      <div class="workspace">
        <section class="card camera-card" aria-labelledby="camera-heading">
          <div class="card-heading"><h2 id="camera-heading">Your camera</h2><span id="camera-badge" class="badge">Camera off</span></div>
          <div id="video-wrap" class="video-wrap">
            <video id="video" autoplay playsinline muted aria-label="Mirrored live camera preview" hidden></video>
            <canvas id="overlay" aria-hidden="true"></canvas>
            <div id="camera-placeholder" class="camera-placeholder"><div class="scanner-mount scanner-idle" data-scanner aria-hidden="true"></div><h3>Your space to explore</h3><p>Start when you’re ready.<br>Your camera is off.</p></div>
            <div id="video-loading" class="video-loading" hidden><span class="spinner" aria-hidden="true"></span><span id="video-loading-text">Starting your camera…</span></div>
            <span id="preview-note" class="preview-note" hidden>Mirrored preview</span>
          </div>
          <div class="controls"><button id="start-camera" class="primary" type="button" disabled>Start camera</button><button id="stop-camera" class="secondary" type="button" disabled>Stop camera</button></div>
          <p id="camera-message" class="helper">Camera off. Review the participation notice to begin.</p>
          <div class="cloud-controls"><button id="cloud-snapshot" class="secondary" type="button" disabled aria-describedby="cloud-message">Cloud AI snapshot</button><span id="cloud-status" class="badge" role="status">Cloud AI off</span></div>
          <p id="cloud-message" class="small">Optional and off by default. Local analysis needs no cloud service.</p>
          <p class="privacy-line"><span class="dot" aria-hidden="true"></span>Local analysis · This app does not save frames</p>
        </section>
        <section class="card result-card" aria-labelledby="result-heading">
          <div class="card-heading"><h2 id="result-heading">Expression estimate</h2><span id="result-status" class="badge" role="status">Idle</span></div>
          <div class="expression"><div id="emoji" class="emoji" aria-hidden="true"></div><span id="empty-symbol" class="empty-symbol" aria-hidden="true">—</span><h3 id="result-label" aria-live="polite">Ready when you are</h3><p id="confidence">No estimate yet</p></div>
          <div class="score-heading"><span>Model scores</span><span>Five supported expressions</span></div>
          <div id="scores" class="scores" aria-label="Expression model scores"></div>
          <p class="small">Model scores are not accuracy measurements. Low confidence and unsupported expressions are shown as “Not sure”.</p>
          <aside class="estimate-notice"><strong>An estimate, not your feelings.</strong><p>This automated estimate uses visible facial features, may be wrong, and is not a statement about your real feelings.</p></aside>
          <aside id="cloud-result" class="estimate-notice" hidden aria-labelledby="cloud-result-title"><strong id="cloud-result-title">Cloud snapshot · Not live</strong><p id="cloud-label" aria-live="polite"></p><p id="cloud-reason"></p></aside>
        </section>
      </div>
    </main>
    <footer><p>For educational demonstration only. Must not be used for consequential decisions about people.</p><p>This app processes frames in memory and never saves them. No accounts. No database. Optional cloud snapshots leave this device only after confirmation; provider retention may apply.</p></footer>
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
  <template id="scanner-template">
    <div class="scanner-scene"><div class="scanner-orbits"><i class="scan-orbit orbit-one"></i><i class="scan-orbit orbit-two"></i><i class="scan-orbit orbit-three"></i></div><div class="scan-face"><svg viewBox="0 0 100 120" fill="none" aria-hidden="true" focusable="false"><path class="face-outline" d="M50 8C24 8 16 25 19 51l5 28c4 19 18 30 26 33 8-3 22-14 26-33l5-28C84 25 76 8 50 8Z"/><path d="m24 38 26-14 26 14-10 32-16 27-16-27Zm0 0 26 20 26-20M34 70l16-12 16 12M50 24v73" class="face-mesh"/><path d="M30 49h10m20 0h10M50 55l-4 16h9M40 85h20" class="face-features"/><circle cx="24" cy="38" r="2"/><circle cx="76" cy="38" r="2"/><circle cx="50" cy="24" r="2"/><circle cx="50" cy="97" r="2"/></svg></div><span class="scan-plane"></span></div>
  </template>
  <dialog id="cloud-dialog" aria-labelledby="cloud-title" aria-describedby="cloud-warning">
    <span class="badge">Optional external service</span><h2 id="cloud-title">Send one camera image?</h2>
    <p id="cloud-warning">One current camera image, including anything visible in the frame, will be sent to Anthropic for a visible-expression estimate. Their data-retention policies apply. This app does not save the image.</p>
    <p class="cloud-warning">Only continue if everyone visible agrees. The estimate may be wrong and does not describe anyone’s real feelings. API charges may apply. Stop cannot recall an image already sent.</p>
    <div class="controls"><button id="cancel-cloud" class="secondary" type="button" autofocus>Cancel</button><button id="confirm-cloud" class="primary" type="button">Send one snapshot</button></div>
  </dialog>
  <noscript><p class="noscript">JavaScript is required for the camera demo. Your camera has not been started.</p></noscript>
</body>
</html>
````

## frontend/style.css

````css
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
  --font-body: Inter, system-ui, sans-serif;
  --scan-line: rgba(34, 211, 238, .3); --scan-glow: rgba(34, 211, 238, .13);
  --glass-edge: rgba(243, 245, 252, .06); --hover-edge: rgba(34, 211, 238, .55);
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
html, body { overflow-x: clip; }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.6 var(--font-body); }
.skip-link { position: fixed; top: var(--s2); left: var(--s2); z-index: 11; padding: var(--s2); border-radius: var(--video-radius); background: var(--surface-solid); color: var(--text); transform: translateY(-200%); }
.skip-link:focus { transform: none; }
button, input { font: inherit; }
button, a, input { -webkit-tap-highlight-color: transparent; }
button { min-height: 48px; padding: var(--s1) var(--s3); border: 1px solid var(--border); border-radius: var(--pill); background: var(--surface-solid); color: var(--text); cursor: pointer; font-weight: 650; white-space: nowrap; transition: transform .18s, border-color .18s; }
button:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--cyan); }
button:active:not(:disabled) { transform: translateY(1px); }
button:disabled { opacity: .45; cursor: not-allowed; }
:focus-visible { outline: 3px solid var(--cyan); outline-offset: 4px; }
h1, h2, h3, p { margin: 0; }
h1 { font-size: clamp(28px, 3.2vw, 44px); line-height: 1.15; letter-spacing: -.045em; font-weight: 600; }
h2 { font-size: 18px; line-height: 1.4; font-weight: 600; }
h3 { font-size: 22px; font-weight: 550; }
p { color: var(--muted); }
h1, h2, h3, .helper, .estimate-notice, #cloud-message { overflow-wrap: anywhere; min-width: 0; }
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
.intro { padding: var(--s3) 0; align-items: end; }
.intro > p { max-width: 340px; font-size: 14px; }
.eyebrow { color: var(--cyan); margin-bottom: var(--s1); font-size: 13px; }
.pipeline { display: flex; flex-wrap: wrap; gap: var(--s1) var(--s3); padding: 0; margin: 0 0 var(--s3); list-style: none; color: var(--muted); font-size: 12px; }
.pipeline li:not(:last-child)::after { content: '›'; margin-left: var(--s3); color: var(--cyan); }
.workspace { display: grid; grid-template-columns: minmax(0, 1.28fr) minmax(0, 1fr); gap: var(--s3); align-items: start; }
.card { min-width: 0; padding: var(--s3); border: 1px solid var(--border); border-radius: var(--card-radius); background: linear-gradient(145deg, var(--glass-edge), transparent 45%), var(--surface); backdrop-filter: blur(24px); box-shadow: inset 0 1px var(--glass-edge), 0 16px 40px var(--shadow); transition: border-color .2s; }
.ready .card { animation: rise .5s both; }
.ready .result-card { animation-delay: .1s; }
.card-heading { margin-bottom: var(--s3); }
.video-wrap { position: relative; aspect-ratio: 16 / 10; overflow: hidden; border-radius: var(--video-radius); background: radial-gradient(ellipse at 50% 30%, var(--scan-glow), transparent 70%), var(--well); border: 1px solid var(--border); }
video, #overlay { position: absolute; inset: 0; width: 100%; height: 100%; transform: scaleX(-1); }
video { object-fit: contain; }
#overlay { pointer-events: none; }
.camera-placeholder, .video-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: var(--s1); text-align: center; padding: var(--s2); }
.camera-placeholder h3 { font-size: 20px; }
.camera-placeholder p { font-size: 14px; }
.video-loading { background: var(--scrim); z-index: 2; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--cyan); border-radius: var(--pill); animation: spin .8s linear infinite; }
.preview-note { position: absolute; bottom: var(--s2); left: var(--s2); padding: var(--s1) var(--s2); border-radius: var(--pill); background: var(--scrim); font-size: 12px; }
.controls { display: flex; flex-wrap: wrap; gap: var(--s1); margin-top: var(--s3); }
.primary { background: linear-gradient(115deg, var(--violet), var(--cyan)); border-color: transparent; color: var(--bg); }
.secondary { background: transparent; }
.helper { margin-top: var(--s2); min-height: 40px; max-width: 65ch; }
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
.splash { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; padding: var(--s3); overflow-y: auto; background: radial-gradient(ellipse at 50% 35%, var(--scan-glow), transparent 60%), var(--bg); transition: opacity .3s; }
.splash.leaving { opacity: 0; pointer-events: none; }
.splash-content { width: min(440px, 100%); margin: auto; text-align: center; display: grid; justify-items: center; gap: var(--s2); }
.gradient-text { background: linear-gradient(115deg, var(--violet), var(--cyan)); background-clip: text; color: transparent; font-size: 48px; }
progress { width: 100%; height: 8px; appearance: none; border: 0; border-radius: var(--pill); overflow: hidden; background: var(--track); }
progress::-webkit-progress-bar { background: var(--track); }
progress::-webkit-progress-value { background: linear-gradient(90deg, var(--violet), var(--cyan)); }
progress::-moz-progress-bar { background: var(--cyan); }
dialog { width: min(560px, calc(100% - 32px)); max-height: calc(100dvh - 32px); padding: var(--s3); border: 1px solid var(--border); border-radius: var(--card-radius); background: var(--surface-solid); color: var(--text); box-shadow: 0 16px 40px var(--shadow); }
dialog::backdrop { background: var(--scrim); backdrop-filter: blur(8px); }
dialog h2 { font-size: 26px; margin: var(--s2) 0; }
dialog ul { padding-left: var(--s3); margin: var(--s2) 0; color: var(--muted); }
dialog li + li { margin-top: var(--s1); }
.consent-check { display: flex; align-items: center; gap: var(--s2); padding: var(--s2); border: 1px solid var(--border); border-radius: var(--video-radius); cursor: pointer; }
.consent-check input { width: 24px; height: 24px; margin: 0; accent-color: var(--cyan); flex-shrink: 0; }
.cloud-controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s1); margin: var(--s2) 0 var(--s1); }
.cloud-warning { margin-top: var(--s2); }
#cloud-label { color: var(--text); font-weight: 600; margin-bottom: var(--s1); }
.noscript { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: var(--s3); background: var(--bg); }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes pop { 0% { transform: scale(.85); } 60% { transform: scale(1.08); } 100% { transform: scale(1); } }
@keyframes pulse { 50% { transform: scale(1.05); } }
@keyframes drift { to { transform: translate(40px, 40px); } }
.header-tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s1); }
.effects-button { min-height: 40px; padding: var(--s1) var(--s2); font-size: 12px; }
.effects-button[aria-pressed="true"] { border-color: var(--cyan); color: var(--cyan); }
.quick-guide { border: 1px solid var(--border); border-radius: var(--video-radius); padding: var(--s2); margin-bottom: var(--s3); background: var(--notice); font-size: 13px; }
.quick-guide summary { cursor: pointer; font-weight: 600; }
.quick-guide ol { padding-left: var(--s3); color: var(--muted); margin: var(--s2) 0; }
.quick-guide li + li { margin-top: var(--s1); }
.quick-guide p { max-width: 65ch; }
.splash-kicker { color: var(--cyan); font-size: 13px; }
.startup-tasks { display: grid; gap: var(--s1); padding: 0; margin: 0; width: 100%; list-style: none; font-size: 13px; }
.startup-tasks li { display: flex; justify-content: space-between; align-items: center; gap: var(--s2); padding: var(--s1) var(--s2); border: 1px solid var(--border); border-radius: var(--video-radius); }
.step-state { color: var(--muted); }
[data-state="done"] .step-state { color: var(--cyan); }
[data-state="error"] .step-state { color: var(--error); }
[data-state="busy"] { border-color: var(--scan-line); }
.scanner-mount { --tilt-x: 0deg; --tilt-y: 0deg; --scan-travel: 110px; position: relative; width: 160px; height: 160px; flex-shrink: 0; perspective: 600px; }
.scanner-large { width: 184px; height: 184px; }
.scanner-idle { --scan-travel: 64px; width: 112px; height: 112px; }
.scanner-scene { position: absolute; inset: 0; transform-style: preserve-3d; transform: rotateX(var(--tilt-x)) rotateY(var(--tilt-y)); transition: transform .2s ease-out; }
.scanner-orbits { position: absolute; inset: 0; transform-style: preserve-3d; animation: scanner-turn 12s linear infinite; }
.scan-orbit { position: absolute; inset: 8%; border: 1px solid var(--scan-line); border-radius: 50%; box-shadow: 0 0 24px var(--scan-glow); }
.orbit-one { transform: rotateX(68deg); border-top: 2px solid var(--cyan); }
.orbit-two { transform: rotateY(68deg) rotateX(20deg); border-left: 2px solid var(--violet); }
.orbit-three { inset: 0; transform: rotateZ(-25deg); border-style: dashed; }
.scan-face { position: absolute; inset: 15% 22%; transform: translateZ(24px); color: var(--cyan); filter: drop-shadow(0 0 8px var(--scan-glow)); animation: face-float 5s ease-in-out infinite; }
.scan-face svg { width: 100%; height: 100%; overflow: visible; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.scan-face circle { fill: var(--cyan); stroke: none; }
.face-outline { fill: var(--well); }
.face-mesh { opacity: .35; stroke-width: .8; }
.face-features { stroke-width: 2; }
.scan-plane { position: absolute; top: 15%; left: 12%; right: 12%; height: 1px; background: var(--cyan); box-shadow: 0 0 16px var(--cyan); transform: translateZ(32px); animation: scanner-sweep 3s ease-in-out infinite alternate; }
@keyframes scanner-turn { from { transform: rotateY(-20deg) rotateZ(0deg); } to { transform: rotateY(-20deg) rotateZ(360deg); } }
@keyframes scanner-sweep { to { transform: translateY(var(--scan-travel)) translateZ(32px); opacity: .2; } }
@keyframes face-float { 50% { transform: translateZ(32px) rotateY(12deg); } }
@media (hover: hover) and (pointer: fine) {
  .card:hover { border-color: var(--hover-edge); }
  .quick-guide summary:hover { color: var(--cyan); }
}
[data-effects="reduced"] *, [data-effects="reduced"] *::before, [data-effects="reduced"] *::after { animation: none !important; transition: none !important; }
[data-effects="reduced"] .scanner-scene { transform: none; }
[data-effects="reduced"] button:hover, [data-effects="reduced"] button:active { transform: none; }
.page-hidden *, [data-startup="error"] .splash * { animation-play-state: paused !important; }
@media (max-width: 859px) {
  .app { padding: 0 var(--s2); }
  .workspace { grid-template-columns: minmax(0, 1fr); }
  .intro { align-items: start; flex-direction: column; }
  .intro > p { max-width: 65ch; }
  .video-wrap { aspect-ratio: 4 / 3; }
}
@media (max-width: 440px) {
  dialog { padding: var(--s2); }
  .card { padding: var(--s2); }
  .site-header { flex-wrap: wrap; }
  .header-tools { width: 100%; justify-content: space-between; }
  .scanner-idle { --scan-travel: 32px; width: 64px; height: 64px; }
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
````

## frontend/app.js

````javascript
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
for (const mount of document.querySelectorAll("[data-scanner]")) {
  mount.append($("scanner-template").content.cloneNode(true));
  mount.addEventListener("pointermove", (event) => {
    if (effectsReduced || motionPreference.matches || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rect = mount.getBoundingClientRect();
    mount.style.setProperty("--tilt-x", `${(0.5 - (event.clientY - rect.top) / rect.height) * 16}deg`);
    mount.style.setProperty("--tilt-y", `${((event.clientX - rect.left) / rect.width - 0.5) * 20}deg`);
  });
  mount.addEventListener("pointerleave", () => {
    mount.style.removeProperty("--tilt-x"); mount.style.removeProperty("--tilt-y");
  });
}
function startupStep(id, state, text) {
  $(id).dataset.state = state; $(id).querySelector(".step-state").textContent = text;
}

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
  $("video-wrap").style.aspectRatio = "";
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
    $("video-wrap").style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
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
  if (token !== session || !active || pending || cloudBusy || socket?.readyState !== WebSocket.OPEN) return;
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
for (const modal of [dialog, cloudDialog]) modal.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const controls = [...modal.querySelectorAll("input:not(:disabled), button:not(:disabled)")];
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
function updateCloudButton() {
  $("cloud-snapshot").disabled = !cloudAvailable || !active || cloudBusy || socket?.readyState !== WebSocket.OPEN;
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
  if (!active || !cloudAvailable || cloudBusy || document.hidden || !stream) return;
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
      : "No face detected in the snapshot. No image was sent to Anthropic.";
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
  if (document.hidden) stopCamera("Idle", "Camera stopped because this tab was hidden. Start again when you’re ready.");
});
window.addEventListener("pagehide", () => stopCamera());
window.addEventListener("beforeunload", () => stopCamera());
window.addEventListener("offline", () => { if (active) failConnection(session); });
startup();
````

## README.md

````markdown
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
````
