'use strict';
const { execFileSync } = require('node:child_process');
execFileSync(process.execPath, ['--check', 'app.js'], { cwd: __dirname + '/..', stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/verify_sensitive.js'], { cwd: __dirname + '/..', stdio: 'inherit' });
console.log('controles JS OK');
