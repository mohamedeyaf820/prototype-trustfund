'use strict';
const { execFileSync } = require('node:child_process');
const path = require('node:path');
execFileSync(process.execPath, [path.join(__dirname, 'check_sensitive_gates.js')], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(__dirname, 'check_no_legacy_kyc.js')], { stdio: 'inherit' });
console.log('verification sensible OK');
