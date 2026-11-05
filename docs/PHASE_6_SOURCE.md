# Phase 6 complete source

Complete contents of the two UI files changed during the polish pass.

Changes: keyboard skip link, shared font token, horizontal overflow containment, single-line control labels, long-result text wrapping, and compact modal padding at narrow widths. Existing spacing, palette, camera, and cloud behavior are retained.

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
    <a class="skip-link" href="#main-content">Skip to camera and results</a>
    <header class="site-header">
      <a class="brand" href="/" aria-label="EmoSense home"><span class="brand-mark" aria-hidden="true">e</span>EmoSense</a>
      <span class="badge"><span class="dot" aria-hidden="true"></span>Local AI - Real-time</span>
    </header>
    <main id="main-content" tabindex="-1">
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
  <dialog id="cloud-dialog" aria-labelledby="cloud-title" aria-describedby="cloud-warning">
    <span class="badge">Optional external service</span><h2 id="cloud-title">Send one camera image?</h2>
    <p id="cloud-warning">One current camera image, including anything visible in the frame, will be sent to Anthropic for a visible-expression estimate. Their data-retention policies apply. This app does not save the image.</p>
    <p class="cloud-warning">Only continue if everyone visible agrees. The estimate may be wrong and does not describe anyone’s real feelings. API charges may apply. Stop cannot recall an image already sent.</p>
    <div class="controls"><button id="cancel-cloud" class="secondary" type="button" autofocus>Cancel</button><button id="confirm-cloud" class="primary" type="button">Send one snapshot</button></div>
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
  --font-body: Inter, system-ui, sans-serif;
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
.cloud-controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s1); margin: var(--s2) 0 var(--s1); }
.cloud-warning { margin-top: var(--s2); }
#cloud-label { color: var(--text); font-weight: 600; margin-bottom: var(--s1); }
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
  dialog { padding: var(--s2); }
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
