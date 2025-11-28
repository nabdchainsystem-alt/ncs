const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ECOSYSTEM_PATH = path.join(__dirname, '../ecosystem.config.cjs');

const args = process.argv.slice(2);
const command = args[0];

if (command === 'add-tenant') {
    const tenantName = args[1];
    const frontendPort = parseInt(args[2]);
    const backendPort = parseInt(args[3]);

    if (!tenantName || !frontendPort || !backendPort) {
        console.error('Usage: node control-plane.js add-tenant <name> <frontend-port> <backend-port>');
        process.exit(1);
    }

    addTenant(tenantName, frontendPort, backendPort);
} else if (command === 'start') {
    startFleet();
} else {
    console.log('Available commands:');
    console.log('  add-tenant <name> <frontend-port> <backend-port>');
    console.log('  start');
}

function addTenant(name, frontendPort, backendPort) {
    // Read the current module.exports
    // Note: This is a simple string manipulation for demo purposes.
    // In a real app, we'd import, modify object, and write back.
    let content = fs.readFileSync(ECOSYSTEM_PATH, 'utf8');

    // Check if tenant exists
    if (content.includes(`tenant-${name}-backend`)) {
        console.log(`Tenant ${name} already exists.`);
        return;
    }

    // Find the end of the apps array
    const insertionPoint = content.lastIndexOf(']');

    if (insertionPoint === -1) {
        console.error('Could not parse ecosystem.config.cjs');
        return;
    }

    const newTenantConfig = `,
    {
      name: "tenant-${name}-backend",
      script: "npm",
      args: "run server -- --port ${backendPort}",
      env: {
        PORT: ${backendPort}
      }
    },
    {
      name: "tenant-${name}-frontend",
      script: "npm",
      args: "run dev -- --port ${frontendPort}",
      env: {
        VITE_API_URL: "http://localhost:${backendPort}"
      }
    }`;

    const newContent = content.slice(0, insertionPoint) + newTenantConfig + content.slice(insertionPoint);

    fs.writeFileSync(ECOSYSTEM_PATH, newContent);
    console.log(`Added tenant ${name} to ecosystem.config.cjs`);
    console.log(`Run 'node scripts/control-plane.js start' to apply changes.`);
}

function startFleet() {
    console.log('Starting SaaS Fleet with PM2...');
    try {
        execSync('npx pm2 start ecosystem.config.cjs', { stdio: 'inherit' });
        console.log('Fleet started successfully.');
        execSync('npx pm2 status', { stdio: 'inherit' });
    } catch (e) {
        console.error('Failed to start fleet:', e.message);
    }
}
