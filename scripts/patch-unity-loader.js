const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'client', 'public', 'games', 'suhoor-rush', 'Build', 'suhoor-rush.loader.js');
let src = fs.readFileSync(file, 'utf8');
const unsafe = '"string"==typeof o?o:o.url';
const safe = '"string"==typeof o?o:(o&&o.url)';
if (src.indexOf(safe) !== -1) {
  console.log('Already patched.');
  process.exit(0);
}
if (src.indexOf(unsafe) === -1) {
  console.error('Unsafe pattern not found. Aborting.');
  process.exit(2);
}
src = src.split(unsafe).join(safe);
fs.writeFileSync(file, src, 'utf8');
console.log('Patched loader successfully.');
