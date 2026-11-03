#!/usr/bin/env node
'use strict';
/* 공정 13개·제품 기술 31개의 콘텐츠 현황 진단 (읽기 전용). 사용: node scripts/diagnose-content.js [--md] */
const { loadData } = require('./load-silicon-library');
const D = loadData();
const len = (v) => (Array.isArray(v) ? v.join(' ').length : String(v || '').length);
const procOf = {}; D.PROC.forEach((p) => p.tx.forEach((k) => { (procOf[k] = procOf[k] || []).push(p.id); }));
const firmsOf = (keys) => D.B.filter((b) => !b.ref && (D.TXN[b.n] || []).some((k) => keys.includes(k))).map((b) => b.n);
const num = /\d[\d,.]*\s*(%|nm|μm|um|℃|°C|배|단|층|GB|Gb|TB|억|조|원|mm|Å|torr|Pa|kV|V\b)/;
const rows = [];
D.PROC.forEach((p) => {
  const text = [p.s, p.why, p.how, p.eq, p.mat, p.part, p.iss, p.fut].map((x) => (Array.isArray(x) ? x.join(' ') : x)).join(' ');
  const dk = Object.keys((D.DEEP && D.DEEP.areas) || {}); const deep = dk.some((k) => D.DEEP.areas[k].procs[0] === p.id) ? true : dk.some((k) => D.DEEP.areas[k].procs.includes(p.id)) ? 'link' : false;
  rows.push({ kind: '공정', id: p.id, name: p.n, chars: len(text), how: p.how.length, iss: p.iss.length, firms: firmsOf(p.tx).length, tx: p.tx.length, nums: (text.match(new RegExp(num, 'g')) || []).length, deep: deep === true ? '있음' : deep === 'link' ? '링크' : '-' });
});
Object.keys(D.TX).forEach((k) => {
  const x = D.TX[k]; const text = [x.w, x.h, x.p, x.k, x.r].map((v) => (Array.isArray(v) ? v.join(' ') : v)).join(' ');
  rows.push({ kind: '기술', id: k, name: x.t, chars: len(text), how: (x.k || []).length, iss: 0, firms: firmsOf([k]).length, tx: (procOf[k] || []).length, nums: (text.match(new RegExp(num, 'g')) || []).length, deep: '-' });
});
const flags = [];
rows.forEach((r) => {
  if (r.kind === '공정' && r.chars < 700) flags.push(`${r.name}: 설명 분량 얇음(${r.chars}자)`);
  if (r.kind === '기술' && r.chars < 450) flags.push(`${r.name}: 설명 분량 얇음(${r.chars}자)`);
  if (r.kind === '기술' && r.tx === 0) flags.push(`${r.name}: 어떤 공정에도 연결되지 않음`);
  if (r.firms === 0) flags.push(`${r.name}: 서재 속 연결 기업 없음`);
  if (r.nums > 0) flags.push(`${r.name}: 수치 ${r.nums}개가 출처 없이 본문에 있음`);
});
if (process.argv.includes('--md')) {
  console.log('| 구분 | ID | 이름 | 글자 수 | 단계/핵심 항목 | 연결 기업 | 연결 공정(또는 제품) | 본문 수치 | 심화 |\n|---|---|---|---|---|---|---|---|---|');
  rows.forEach((r) => console.log(`| ${r.kind} | ${r.id} | ${r.name} | ${r.chars} | ${r.how} | ${r.firms} | ${r.tx} | ${r.nums} | ${r.deep} |`));
  console.log('\n' + flags.map((f) => '- ' + f).join('\n'));
} else { console.table(rows); flags.forEach((f) => console.log('FLAG', f)); }
