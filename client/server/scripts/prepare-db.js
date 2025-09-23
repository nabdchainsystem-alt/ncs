#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function ensureSymlink() {
  const serverRoot = path.resolve(__dirname, '..');
  const tmpDir = path.join(serverRoot, 'tmp');
  const source = path.join(tmpDir, 'dev2-writable.db');
  const target = path.join(tmpDir, 'dev2.db');

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  if (!fs.existsSync(source)) {
    throw new Error(`Expected database at ${source}.`);
  }

  if (fs.existsSync(target)) {
    const stats = fs.lstatSync(target);
    if (stats.isSymbolicLink()) {
      const current = fs.readlinkSync(target);
      const resolvedCurrent = path.resolve(tmpDir, current);
      const resolvedSource = path.resolve(source);
      if (resolvedCurrent === resolvedSource) {
        return; // already linked correctly
      }
      fs.unlinkSync(target);
    } else if (stats.isFile()) {
      fs.unlinkSync(target);
    } else {
      throw new Error(`Cannot replace ${target}; unsupported file type.`);
    }
  }

  const relativeSource = path.relative(tmpDir, source) || 'dev2-writable.db';
  fs.symlinkSync(relativeSource, target);
  console.log(`[prepare-db] Linked ${target} -> ${relativeSource}`);
}

function runPrismaGenerate() {
  const serverRoot = path.resolve(__dirname, '..');
  execSync('pnpm dlx prisma generate', { stdio: 'inherit', cwd: serverRoot });
}

try {
  ensureSymlink();
  runPrismaGenerate();
} catch (error) {
  console.error('[prepare-db] failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
