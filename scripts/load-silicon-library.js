'use strict';
/* silicon-library/index.html 의 인라인 스크립트를 DOM 없이 실행해 데이터만 꺼낸다. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function stub() {
  const f = function () {};
  const p = new Proxy(f, {
    get(_, k) { if (k === Symbol.toPrimitive) return () => ''; if (k === 'length') return 0; return p; },
    apply() { return p; },
    construct() { return p; },
    set() { return true; }
  });
  return p;
}

function loadData(file) {
  const html = fs.readFileSync(file || path.join(__dirname, '..', 'silicon-library', 'index.html'), 'utf8');
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('인라인 <script>를 찾지 못했습니다');
  let out = null;
  const win = { __SL_EXPORT__: (d) => { out = d; }, addEventListener() {}, matchMedia: () => ({ matches: false }) };
  const mem = {};
  const ls = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
  const ctx = { window: win, document: stub(), localStorage: ls, sessionStorage: ls, location: { hash: '' }, console, setTimeout, JSON };
  win.window = win; win.document = ctx.document; win.localStorage = ls; win.sessionStorage = ls; win.location = ctx.location;
  vm.createContext(ctx);
  vm.runInContext(m[1], ctx, { filename: 'silicon-library/index.html' });
  if (!out) throw new Error('데이터 내보내기 훅이 실행되지 않았습니다');
  return out;
}
module.exports = { loadData };
if (require.main === module) {
  const d = loadData();
  console.log('rows', d.B.length, 'TX', Object.keys(d.TX).length, 'PROC', d.PROC.length);
}
