// Optional UI check: npm install --prefix .tools/browser-check playwright @axe-core/playwright
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const dependencies = [root, path.dirname(root)].map(p => path.join(p, '.tools/browser-check/node_modules'))
  .find(p => fs.existsSync(path.join(p, 'playwright')));
if (!dependencies) throw new Error('Install the optional Playwright dependencies described at the top of this file.');
const {chromium} = require(path.join(dependencies, 'playwright'));
const AxeBuilder = require(path.join(dependencies, '@axe-core/playwright')).default;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const frontend = path.join(root, 'frontend');
  const server = http.createServer((req, res) => {
    const file = path.resolve(frontend, '.' + (req.url === '/' ? '/index.html' : req.url));
    if (!file.startsWith(frontend + path.sep)) {res.writeHead(403).end();return;}
    const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf'};
    res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).on('error',()=>res.writeHead(404).end()).pipe(res);
  });
  await new Promise(r => server.listen(0,'127.0.0.1',r));
  let browser;
  const artifacts = path.join(root,'.tools/peek-stage'); fs.mkdirSync(artifacts,{recursive:true});
  try {
    const cached = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1228/chrome-win64/chrome.exe');
    browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(cached)?cached:undefined)});
    const context = await browser.newContext({viewport:{width:1366,height:768}});
    const page = await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/health',r=>r.fulfill({json:{status:'ok',model_ready:true,cloud_available:false}}));
    await page.route('**/api/warmup',r=>r.fulfill({json:{status:'ready',model_ready:true}}));
    await page.addInitScript(()=>{
      window.__tracks=[];window.__requests=0;
      navigator.mediaDevices.getUserMedia=async()=>{
        window.__requests++;const c=document.createElement('canvas');c.width=640;c.height=480;
        const paint=()=>{const ctx=c.getContext('2d');ctx.fillStyle='#6BAAF5';ctx.fillRect(0,0,640,480)};
        paint();setInterval(paint,100);const stream=c.captureStream(10);window.__tracks.push(...stream.getTracks());return stream;
      };
    });
    let label='happy',face=true;
    // Synthetic protocol fixtures only; production emojis come from the backend.
    const fixtureEmoji={happy:'😊',sad:'😢',angry:'😠',surprised:'😲',neutral:'😐',uncertain:'🤔'};
    await page.routeWebSocket('**/ws/analyze',ws=>ws.onMessage(()=>ws.send(JSON.stringify(face?{
      face:true,frame:{width:320,height:240},box:{x:40,y:30,width:100,height:100},label,
      emoji:fixtureEmoji[label],confidence:70,scores:{happy:label==='happy'?70:5,sad:label==='sad'?70:5,angry:label==='angry'?70:5,surprised:label==='surprised'?70:5,neutral:label==='neutral'?70:5}
    }:{face:false,frame:{width:320,height:240}}))));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.locator('#splash').waitFor({state:'hidden'});
    assert.equal(await page.locator('#crew-stage').count(),1,'The oversized peeking stage must exist');
    assert.equal(await page.locator('#crew-stage .mascot-tile').count(),5);
    assert.equal(await page.locator('#crew-greetings button').count(),5);
    assert.equal(await page.locator('#result-art').count(),0,'Do not duplicate the active illustration');
    assert.equal(await page.evaluate(()=>window.__requests),0);
    await page.locator('#start-camera').click();await page.locator('#consent-checkbox').check();await page.locator('#confirm-consent').click();
    for(const target of ['happy','sad','angry','surprised','neutral']) {
      label=target;
      await page.waitForFunction(target=>document.querySelector('.mascot-tile[data-selected="true"]')?.dataset.label===target,target);
      await sleep(450);
      assert.equal(await page.locator('.mascot-tile[data-selected="true"]').count(),1);
      const size=await page.locator(`.mascot-tile[data-label="${target}"] .mascot-pose`).boundingBox();
      assert.ok(size.height>=180,'Active face must be oversized');
      assert.match(await page.locator('#crew-selection').textContent(),new RegExp(target,'i'));
    }
    label='happy';await page.waitForFunction(()=>document.getElementById('result-label').textContent==='Happy');await sleep(450);
    await page.evaluate(()=>{window.__riseCount=0;document.querySelector('.mascot-tile[data-label="happy"] .mascot-pose').addEventListener('transitionrun',()=>window.__riseCount++);});
    await sleep(1000);assert.equal(await page.evaluate(()=>window.__riseCount),0,'Same label must not restart the rise');
    await page.locator('#crew-greetings button[data-label="sad"]').click();
    assert.equal(await page.locator('#result-label').textContent(),'Happy');
    for(const next of ['sad','angry','surprised','neutral','happy']) {label=next;await sleep(160);}
    label='angry';await page.waitForFunction(()=>document.getElementById('result-label').textContent==='Angry');await sleep(450);
    assert.equal(await page.locator('.mascot-tile[data-selected="true"]').count(),1);
    assert.equal(await page.locator('.mascot-pose').evaluateAll(nodes=>nodes.some(node=>node.getAnimations().some(a=>a.playState==='running'))),false,'Rapid changes must settle');
    label='happy';await page.waitForFunction(()=>document.getElementById('result-label').textContent==='Happy');await sleep(450);
    for(const [width,height] of [[1280,720],[1366,768],[1440,900]]) {
      await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));await sleep(450);
      for(const selector of ['#stop-camera','#photo-card','#crew-stage','#crew-greetings','.estimate-notice']) {
        const bounds=await page.locator(selector).first().boundingBox();
        assert.ok(bounds.y>=0&&bounds.y+bounds.height<=height,`${selector} below fold at ${width}x${height}: ${JSON.stringify(bounds)}`);
      }
    }
    await page.setViewportSize({width:1366,height:768});
    await page.screenshot({path:path.join(artifacts,'desktop.png'),fullPage:true});
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(v=>v.id),[]);
    const requests=await page.evaluate(()=>window.__requests);await page.locator('#focus-view').click();
    assert.equal(await page.locator('#crew-stage').isVisible(),true);assert.equal(await page.evaluate(()=>window.__requests),requests);
    await page.locator('#focus-view').click();
    label='uncertain';await page.waitForFunction(()=>document.getElementById('result-label').textContent==='Not sure');
    assert.equal(await page.locator('.mascot-tile[data-selected="true"]').count(),0);assert.equal(await page.locator('#caption').isHidden(),true);
    face=false;await page.waitForFunction(()=>document.getElementById('result-status').textContent==='No face detected');
    assert.equal(await page.locator('#emoji').textContent(),'');assert.equal(await page.locator('.mascot-tile[data-selected="true"]').count(),0);
    face=true;label='surprised';await page.waitForFunction(()=>document.getElementById('result-label').textContent==='Surprised');
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.mascot-pose').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    assert.equal(await page.locator('.mascot-eyes').first().evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.mouse.move(10,10);await sleep(50);
    assert.equal(await page.locator('.pupils').evaluateAll(nodes=>nodes.every(node=>node.style.transform==='')),true);
    for(const width of [320,375,414,768,860]) {
      await page.setViewportSize({width,height:768});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      const stage=await page.locator('#crew-stage').boundingBox();assert.equal(stage.height,192);
      if(width===375) await page.screenshot({path:path.join(artifacts,'mobile.png'),fullPage:true});
    }
    await page.setViewportSize({width:375,height:768});
    for(let i=0;i<5;i++){const button=page.locator('#crew-greetings button').nth(i);await button.focus();assert.equal(await button.evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Enter');}
    assert.equal(await page.locator('#result-label').textContent(),'Surprised');
    await page.locator('#stop-camera').click();assert.equal(await page.locator('.mascot-tile[data-selected="true"]').count(),0);
    assert.equal(await page.evaluate(()=>window.__tracks.every(t=>t.readyState==='ended')),true);assert.deepEqual(errors,[]);
    await page.locator('#start-camera').click();await page.locator('#consent-checkbox').check();await page.locator('#confirm-consent').click();
    await page.waitForFunction(()=>document.getElementById('result-label').textContent==='Surprised');
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
    assert.equal(await page.locator('.mascot-tile[data-selected="true"]').count(),0);assert.equal(await page.locator('#caption').isHidden(),true);
    assert.equal(await page.evaluate(()=>window.__tracks.every(t=>t.readyState==='ended')),true);
    console.log('PASS: five oversized poses, stable transitions, greeting isolation, desktop visibility, mobile stage, reduced motion, focus view, no-face/uncertain/Stop cleanup, keyboard and axe.');
  } finally {if(browser) await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
