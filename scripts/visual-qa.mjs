import { spawn } from "node:child_process";
import { mkdtemp, readFile, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = process.argv[2] || join(tmpdir(), "mvuli-visual-qa");
const profileDir = await mkdtemp(join(tmpdir(), "mvuli-chrome-"));
await mkdir(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--disable-background-networking",
  "--remote-debugging-port=0", `--user-data-dir=${profileDir}`, "about:blank",
], { stdio: "ignore", windowsHide: true });

let socket;
try {
  let port;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      port = Number((await readFile(join(profileDir, "DevToolsActivePort"), "utf8")).split("\n")[0]);
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  if (!port) throw new Error("Chrome debugging endpoint did not start.");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const target = targets.find(item => item.type === "page");
  if (!target) throw new Error("Chrome page target not found.");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  await send("Page.enable");
  for (const page of ["", "admin.html"]) {
    for (const width of [280, 320, 390, 600, 768, 900, 1024, 1440, 1600]) {
      const height = width < 600 ? 844 : 900;
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
      await send("Page.navigate", { url: `http://127.0.0.1:8080/${page}` });
      await new Promise(resolve => setTimeout(resolve, 750));
      const { result } = await send("Runtime.evaluate", {
        expression: "JSON.stringify({viewport:innerWidth,content:document.documentElement.scrollWidth,overflow:Array.from(document.querySelectorAll('body *')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left< -2)}).slice(0,12).map(e=>e.tagName.toLowerCase()+'.'+e.className)})",
        returnByValue: true,
      });
      const info = JSON.parse(result.value);
      const name = `${page ? "admin" : "home"}-${width}.png`;
      const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(join(outputDir, name), Buffer.from(image.data, "base64"));
      console.log(name, JSON.stringify(info));
    }
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url: "http://127.0.0.1:8080/" });
  await new Promise(resolve => setTimeout(resolve, 750));
  for (const section of ["perspective", "gallery", "interiors", "units", "invest", "questions", "contact"]) {
    await send("Runtime.evaluate", { expression: `document.getElementById(${JSON.stringify(section)}).scrollIntoView({behavior:'instant'})` });
    await new Promise(resolve => setTimeout(resolve, 900));
    const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(outputDir, `home-390-${section}.png`), Buffer.from(image.data, "base64"));
  }
  for (const [name, selector] of [["interior-cards", "#interiors .render-cards"], ["interior-floor", "#interiors .render-floor"]]) {
    await send("Runtime.evaluate", { expression: `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({behavior:'instant'})` });
    await new Promise(resolve => setTimeout(resolve, 900));
    const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(outputDir, `home-390-${name}.png`), Buffer.from(image.data, "base64"));
  }
  const { result: previewResult } = await send("Runtime.evaluate", {
    expression: "(() => { document.querySelector('#interiors img[data-lightbox]').click(); const opened = document.getElementById('lightbox').classList.contains('open'); const alt = document.getElementById('lightbox-img').alt; document.getElementById('lightbox-close').click(); return {opened, closed: !document.getElementById('lightbox').classList.contains('open'), alt}; })()",
    returnByValue: true,
  });
  console.log("interior-lightbox", JSON.stringify(previewResult.value));
  for (const width of [280, 768]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    await send("Page.navigate", { url: "http://127.0.0.1:8080/#interiors" });
    await new Promise(resolve => setTimeout(resolve, 900));
    await send("Runtime.evaluate", { expression: "document.getElementById('interiors').scrollIntoView({behavior:'instant'})" });
    await new Promise(resolve => setTimeout(resolve, 900));
    const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(outputDir, `home-${width}-interiors.png`), Buffer.from(image.data, "base64"));
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "http://127.0.0.1:8080/#interiors" });
  await new Promise(resolve => setTimeout(resolve, 700));
  await send("Runtime.evaluate", { expression: "document.getElementById('interiors').scrollIntoView({behavior:'instant'})" });
  const interiorDesktop = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(join(outputDir, "home-1440-interiors.png"), Buffer.from(interiorDesktop.data, "base64"));

  const dashboardFixture = `(() => {
    document.getElementById('setup-screen').hidden = true;
    document.getElementById('login-screen').hidden = true;
    document.getElementById('admin-screen').hidden = false;
    document.getElementById('sign-out').hidden = false;
    document.getElementById('staff-identity').textContent = 'staff@example.com';
    document.getElementById('metric-inquiries').textContent = '18';
    document.getElementById('metric-units').textContent = '120';
    document.getElementById('metric-available').textContent = '74';
    document.getElementById('units-summary').textContent = '120 units · 74 available · 31 reserved · 15 sold';
    document.getElementById('seed-btn').disabled = false;
    const addRows = (bodyId, labels, records) => {
      const body = document.getElementById(bodyId);
      body.replaceChildren();
      for (const record of records) {
        const row = document.createElement('tr');
        record.forEach((value, index) => {
          const cell = document.createElement('td');
          cell.dataset.label = labels[index];
          if (value instanceof Node) cell.append(value);
          else cell.textContent = value;
          row.append(cell);
        });
        body.append(row);
      }
    };
    addRows('inquiries-body', ['Date','Name','Phone','Email','Unit','Message'], [
      ['24 Sep 2026','Amina N.','+254 700 000 000','amina@example.com','Studio','I would like the latest price list and a viewing appointment.'],
      ['23 Sep 2026','Brian M.','+254 711 000 000','brian@example.com','One Bedroom B','Please confirm which floors have available units.'],
      ['22 Sep 2026','Cynthia K.','+254 722 000 000','—','One Bedroom A','Can you send the payment stages in writing?']
    ]);
    const status = value => {
      const select = document.createElement('select');
      select.className = 'status-select';
      select.setAttribute('aria-label', 'Status for sample unit');
      for (const optionValue of ['available','reserved','sold']) {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue[0].toUpperCase() + optionValue.slice(1);
        select.append(option);
      }
      select.value = value;
      return select;
    };
    addRows('units-body', ['Unit number','Floor','Layout','Indicative price','Status'], [
      ['F03-01','3','Studio','Ksh 2,000,000',status('available')],
      ['F03-04','3','One Bedroom A','Ksh 3,500,000',status('reserved')],
      ['F04-11','4','One Bedroom C','Ksh 3,800,000',status('sold')]
    ]);
    return { viewport: innerWidth, content: document.documentElement.scrollWidth };
  })()`;

  for (const width of [280, 390, 768, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    await send("Page.navigate", { url: "http://127.0.0.1:8080/admin.html" });
    await new Promise(resolve => setTimeout(resolve, 650));
    const { result } = await send("Runtime.evaluate", { expression: dashboardFixture, returnByValue: true });
    const top = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(outputDir, `admin-sim-${width}-overview.png`), Buffer.from(top.data, "base64"));
    await send("Runtime.evaluate", { expression: "document.querySelector('#tab-inquiries .admin-table-scroll').scrollIntoView({behavior:'instant'})" });
    const enquiries = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(outputDir, `admin-sim-${width}-enquiries.png`), Buffer.from(enquiries.data, "base64"));
    await send("Runtime.evaluate", { expression: "document.querySelector('[data-tab=units]').click(); document.querySelector('#tab-units .admin-table-scroll').scrollIntoView({behavior:'instant'})" });
    const units = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(outputDir, `admin-sim-${width}-units.png`), Buffer.from(units.data, "base64"));
    console.log(`admin-sim-${width}`, JSON.stringify(result.value));
  }

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url: "http://127.0.0.1:8080/admin.html" });
  await new Promise(resolve => setTimeout(resolve, 650));
  await send("Runtime.evaluate", { expression: "document.getElementById('setup-screen').hidden=true; document.getElementById('login-screen').hidden=false" });
  const login = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(join(outputDir, "admin-sim-390-login.png"), Buffer.from(login.data, "base64"));
  console.log(`Screenshots: ${outputDir}`);
} finally {
  socket?.close();
  chrome.kill();
}
