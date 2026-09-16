'use strict';
/**
 * TrustFund - resolution du navigateur utilise par les scripts Puppeteer.
 * Ordre : PUPPETEER_EXECUTABLE_PATH, cache Puppeteer local, installations systeme.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const SYSTEM_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

function cacheCandidates() {
  const base = process.env.PUPPETEER_CACHE_DIR || path.join(os.homedir(), '.cache', 'puppeteer');
  const found = [];
  ['chrome', 'chrome-headless-shell'].forEach((name) => {
    const dir = path.join(base, name);
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach((version) => {
      const versionDir = path.join(dir, version);
      const exe = process.platform === 'win32'
        ? path.join(versionDir, 'chrome-win64', 'chrome.exe')
        : path.join(versionDir, 'chrome-linux64', 'chrome');
      found.push(exe);
    });
  });
  return found;
}

function resolveChromePath() {
  const candidates = [process.env.PUPPETEER_EXECUTABLE_PATH, ...cacheCandidates(), ...SYSTEM_CANDIDATES].filter(Boolean);
  const match = candidates.find((candidate) => fs.existsSync(candidate));
  if (!match) {
    throw new Error('Chrome introuvable. Definissez PUPPETEER_EXECUTABLE_PATH ou installez Google Chrome.');
  }
  return match;
}

module.exports = { ROOT, resolveChromePath, cacheCandidates, SYSTEM_CANDIDATES };