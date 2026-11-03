#!/usr/bin/env node
'use strict';
/* silicon-library/data/deep-content.json 을 index.html 의 DEEP 블록에 주입한다. (--check: 주입된 내용이 JSON과 같은지만 확인) */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'silicon-library');
const html = path.join(root, 'index.html');
const json = JSON.parse(fs.readFileSync(path.join(root, 'data', 'deep-content.json'), 'utf8'));
const block = '/*DEEP:BEGIN*/\n  var DEEP = ' + JSON.stringify(json) + ';\n  /*DEEP:END*/';
let s = fs.readFileSync(html, 'utf8');
const re = /\/\*DEEP:BEGIN\*\/[\s\S]*?\/\*DEEP:END\*\//;
if (!re.test(s)) { console.error('index.html 에 DEEP 마커가 없습니다'); process.exit(2); }
const next = s.replace(re, () => block);
if (process.argv.includes('--check')) {
  if (next !== s) { console.error('DEEP 블록이 data/deep-content.json 과 다릅니다. node scripts/build-deep.js 를 실행하세요'); process.exit(1); }
  console.log('DEEP 블록 일치'); process.exit(0);
}
fs.writeFileSync(html, next); console.log('DEEP 블록 갱신:', Buffer.byteLength(JSON.stringify(json)), 'bytes');
