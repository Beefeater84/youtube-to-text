#!/usr/bin/env node
import { spawn, execSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE_URL = 'http://localhost:3000';
const ERROR_STRINGS = ['DYNAMIC_SERVER_USAGE', 'Internal Server Error', 'Application error'];

// Step 1: build
console.log('=== Step 1: Building production app ===');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: process.cwd() });
} catch {
  console.error('Build failed.');
  process.exit(1);
}

// Step 2: start server and wait for readiness
console.log('\n=== Step 2: Starting production server ===');
const server = spawn('npm', ['run', 'start'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  shell: true,
});

async function waitForServer(maxMs = 30_000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE_URL + '/');
      if (res.status < 600) return true;
    } catch {
      // not ready yet
    }
    await sleep(1000);
  }
  return false;
}

const ready = await waitForServer();
if (!ready) {
  console.error('Server did not become ready within 30s.');
  server.kill();
  process.exit(1);
}
console.log('Server is ready.');

// Step 3: fetch sitemap and extract URLs
console.log('\n=== Step 3: Fetching sitemap ===');
let sitemapUrls = [];
try {
  const sitemapRes = await fetch(BASE_URL + '/sitemap.xml');
  const sitemapText = await sitemapRes.text();
  const matches = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)];
  sitemapUrls = matches.map(m => m[1]);
  console.log(`Found ${sitemapUrls.length} URLs in sitemap.`);
} catch (err) {
  console.warn('Could not fetch sitemap:', err.message);
}

// Step 4: add static pages not in sitemap
const staticPages = ['/login'];
const allUrls = [...new Set([
  ...sitemapUrls,
  ...staticPages.map(p => BASE_URL + p),
])];

// Protected routes: unauthenticated access must redirect to /login
const protectedPaths = ['/dashboard'];

// Routes to skip (e.g. dynamic content that depends on prod DB data)
const skipPatterns = [/^http:\/\/localhost:3000\/channels\//];

// Normalize sitemap URLs (they should already be absolute)
const urlsToTest = allUrls.filter(u => !skipPatterns.some(p => p.test(u))).map(u => {
  try {
    const parsed = new URL(u);
    // rewrite host to localhost:3000 so tests run against local server
    parsed.host = 'localhost:3000';
    parsed.protocol = 'http:';
    return parsed.href;
  } catch {
    return BASE_URL + u;
  }
});

// Step 5: check each URL
console.log('\n=== Step 5: Checking pages ===');
const results = [];
for (const url of urlsToTest) {
  try {
    const res = await fetch(url);
    const body = await res.text();
    const statusOk = res.status === 200;
    const errorFound = ERROR_STRINGS.find(s => body.includes(s));
    const pass = statusOk && !errorFound;
    results.push({ url, status: res.status, pass, reason: errorFound ? `body contains "${errorFound}"` : (!statusOk ? `status ${res.status}` : null) });
    console.log(`${pass ? 'PASS' : 'FAIL'} [${res.status}] ${url}${errorFound ? ` — ${errorFound}` : ''}`);
  } catch (err) {
    results.push({ url, status: null, pass: false, reason: err.message });
    console.log(`FAIL [ERR] ${url} — ${err.message}`);
  }
}

// Step 5b: verify protected routes redirect unauthenticated users to /login
console.log('\n=== Step 5b: Checking auth protection on protected routes ===');
for (const path of protectedPaths) {
  const url = BASE_URL + path;
  try {
    // redirect: 'follow' is the default; check that the final URL is /login
    const res = await fetch(url);
    const finalUrl = res.url;
    const expectedPath = '/login';
    const redirectedToLogin = new URL(finalUrl).pathname === expectedPath;
    const pass = redirectedToLogin;
    results.push({ url, status: res.status, pass, reason: pass ? null : `expected redirect to ${expectedPath}, got ${new URL(finalUrl).pathname}` });
    console.log(`${pass ? 'PASS' : 'FAIL'} [protected] ${url} → ${new URL(finalUrl).pathname}`);
  } catch (err) {
    results.push({ url, status: null, pass: false, reason: err.message });
    console.log(`FAIL [ERR] ${url} — ${err.message}`);
  }
}

// Step 6: kill server, print summary, exit
server.kill();

const failed = results.filter(r => !r.pass);
console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} passed ===`);
if (failed.length > 0) {
  console.error('Failed pages:');
  for (const r of failed) console.error(`  ${r.url} — ${r.reason}`);
  process.exit(1);
}
console.log('All checks passed.');
