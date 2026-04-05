// Deploy backend to Easypanel — reads actual source files from disk
const https = require('https');
const fs = require('fs');
const path = require('path');

const dockerfile = [
  'FROM node:20-alpine',
  'WORKDIR /app',
  'RUN npm init -y && npm install express@4.21.2 cors@2.8.5',
  'RUN mkdir -p routes',
  'EXPOSE 3001',
  'CMD ["node", "server.prod.js"]'
].join('\n');

// Read actual source files
const serverJs = fs.readFileSync(path.join(__dirname, 'server.prod.js'), 'utf8');
const apiJs = fs.readFileSync(path.join(__dirname, 'routes', 'api.js'), 'utf8');
const webhooksJs = fs.readFileSync(path.join(__dirname, 'routes', 'webhooks.js'), 'utf8');

console.log('Files loaded:');
console.log('  server.prod.js:', serverJs.length, 'bytes');
console.log('  api.js:', apiJs.length, 'bytes');
console.log('  webhooks.js:', webhooksJs.length, 'bytes');

// Verify the critical line is present
if (webhooksJs.includes('indexOf')) {
  console.log('  ✓ webhooks.js contains indexOf (correct parsing)');
} else {
  console.log('  ✗ WARNING: webhooks.js missing indexOf!');
}

const payload = {
  json: {
    projectName: "dulce_y_jaleo",
    serviceName: "backend",
    source: { type: "dockerfile", dockerfile },
    env: "AIRTABLE_API_KEY=YOUR_AIRTABLE_PAT\nAIRTABLE_BASE_ID=YOUR_BASE_ID\nGEMINI_API_KEY=YOUR_GEMINI_API_KEY\nTABLE_FACTURAS=tbl2mXyo6cpCQpLL9\nTABLE_ALBARANES=tbl0T9iOA6l4sbwvQ\nTABLE_GASTOS_VARIOS=tbloFQDdyjTX5d5PQ\nPORT=3001",
    domains: [{
      host: "dulce-y-jaleo-backend.xm1sa3.easypanel.host",
      https: true,
      port: 3001,
      path: "/"
    }],
    mounts: [
      { type: "file", content: serverJs, mountPath: "/app/server.prod.js" },
      { type: "file", content: apiJs, mountPath: "/app/routes/api.js" },
      { type: "file", content: webhooksJs, mountPath: "/app/routes/webhooks.js" }
    ]
  }
};

const body = JSON.stringify(payload);

// Step 1: Destroy existing service
function makeRequest(reqPath, reqBody) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'xm1sa3.easypanel.host',
      path: reqPath,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_EASYPANEL_TOKEN',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqBody)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(reqBody);
    req.end();
  });
}

async function deploy() {
  // 1. Destroy
  console.log('\n1. Destroying existing service...');
  const destroyRes = await makeRequest(
    '/api/trpc/services.app.destroyService',
    JSON.stringify({ json: { projectName: "dulce_y_jaleo", serviceName: "backend" } })
  );
  console.log('   Destroy:', destroyRes.status);

  // Wait for cleanup
  await new Promise(r => setTimeout(r, 5000));

  // 2. Create
  console.log('2. Creating service...');
  const createRes = await makeRequest('/api/trpc/services.app.createService', body);
  console.log('   Create:', createRes.status, createRes.data.substring(0, 200));

  // Wait
  await new Promise(r => setTimeout(r, 3000));

  // 3. Deploy
  console.log('3. Deploying...');
  const deployRes = await makeRequest(
    '/api/trpc/services.app.deployService',
    JSON.stringify({ json: { projectName: "dulce_y_jaleo", serviceName: "backend" } })
  );
  console.log('   Deploy:', deployRes.status);

  // 4. Wait and test
  console.log('4. Waiting 45s for build...');
  await new Promise(r => setTimeout(r, 45000));

  console.log('5. Testing health...');
  const healthRes = await makeRequest('/health', '');
  // Use fetch for GET
  const h = await fetch('https://dulce-y-jaleo-backend.xm1sa3.easypanel.host/health');
  console.log('   Health:', h.status, await h.text());

  console.log('6. Testing scan-invoice...');
  const scanRes = await fetch('https://dulce-y-jaleo-backend.xm1sa3.easypanel.host/webhook/scan-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png'
    })
  });
  console.log('   Scan:', scanRes.status, (await scanRes.text()).substring(0, 300));
}

deploy().catch(e => console.error('Deploy failed:', e.message));
