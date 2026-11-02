const { chromium } = require('C:/Users/Augus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const source = 'C:/Users/Augus/OneDrive/Desktop/log-integrado-proveedores-compras.html';
  const output = path.resolve('output/pdf/log-integrado-proveedores-compras.pdf');
  let html = await fs.readFile(source, 'utf8');
  // Los mensajes desplegables se incluyen completos en el documento estático.
  html = html.replace(/<details\b/gi, '<details open');
  html = html.replace('</style>', `
    @media print {
      h1,h2,h3,summary { break-after: avoid; }
      pre { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 10px; }
      details { margin: 8px 0; }
      summary { font-weight: 600; }
      td { overflow-wrap: anywhere; }
      a { text-decoration: none; }
    }
  </style>`);
  await fs.mkdir(path.dirname(output), { recursive: true });
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, offline: true });
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: output, preferCSSPageSize: true, printBackground: true,
      displayHeaderFooter: true, headerTemplate: '<div></div>',
      footerTemplate: '<div style="width:100%;font-size:8px;color:#657581;text-align:right;padding:0 15mm">Registro integrado · <span class="pageNumber"></span> / <span class="totalPages"></span></div>'
    });
    console.log(output);
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exitCode = 1; });
