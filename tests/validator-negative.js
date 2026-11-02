'use strict';
/* 검증 스크립트가 실제로 오류를 잡는지 확인: 데이터를 일부러 망가뜨린 복사본을 만들어 실행 */
const fs = require('fs'); const os = require('os'); const path = require('path'); const { spawnSync } = require('child_process');
const src = fs.readFileSync(path.join(__dirname, '..', 'silicon-library', 'index.html'), 'utf8');
const cases = [
  ['기업 ID 중복', (s) => s.replace('id: "c02", row:', 'id: "c01", row:'), 'ENT_ID_DUP'],
  ['존재하지 않는 제품 참조', (s) => s.replace('"덕산테코피아": ["pre"]', '"덕산테코피아": ["nope"]'), 'TXN_PROD'],
  ['잘못된 분류', (s) => s.replace('id: "c03", row: "디엔에프", cat: "소재"', 'id: "c03", row: "디엔에프", cat: "재료"'), 'ENT_CAT'],
  ['유효하지 않은 출처 ID', (s) => s.replace('src: ["dst", "pre"]', 'src: ["dst", "zzz"]'), 'SRC_ID'],
  ['같은 법인이 두 기업에 등록', (s) => s.replace('legal: "Linde AMT Chonan Co., Ltd.", legalVerified: true, products: ["target"]', 'legal: "린데코리아 주식회사", legalVerified: true, products: ["target"]').replace('id: "c01", row: "덕산테코피아", cat: "소재", sub: [], chain: "직접", vs: "검증", products: ["pre"]', 'id: "c01", row: "덕산테코피아", cat: "소재", sub: [], chain: "직접", vs: "검증", legal: "린데코리아 주식회사", products: ["pre"]'), 'ENT_LEGAL_DUP'],
  ['관련 산업인데 공정에 연결', (s) => s.replace('"삼화전기": ["alcap"]', '"삼화전기": ["alcap", "probe"]').replace('products: ["alcap"]', 'products: ["alcap", "probe"]'), 'ENT_CHAIN'],
  ['기대 고유 기업 수 불일치', (s) => s.replace('unique: 45', 'unique: 44'), 'ENT_COUNT'],
  ['사실 출처 누락', (s) => s.replace('src: ["lk_gl", "lk_mo"], pub: null', 'src: [], pub: null'), 'FACT_SRC'],
  ['발행일이 확인일보다 늦음', (s) => s.replace('pub: "2024-06-04"', 'pub: "2027-01-01"'), 'FACT_DATE'],
  ['제품-기업 products 불일치', (s) => s.replace('row: "린데", cat: "소재", sub: [], chain: "직접", vs: "부분 검증", products: ["gasBulk", "target"]', 'row: "린데", cat: "소재", sub: [], chain: "직접", vs: "부분 검증", products: ["gasBulk"]'), 'ENT_PROD'],
  ['ref 행 별칭 누락', (s) => s.replace('alias: ["에이텍솔루션 (세정)"], ', ''), 'ENT_ALIAS'],
];
let fail = 0;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'slneg-'));
const base = spawnSync('node', [path.join(__dirname, '..', 'scripts', 'validate-silicon-library.js')], { encoding: 'utf8' });
console.log((base.status === 0 ? 'PASS' : 'FAIL') + ' 원본 데이터는 오류 0'); if (base.status !== 0) fail++;
cases.forEach(([name, mut, code]) => {
  const out = mut(src);
  if (out === src) { console.log('FAIL ' + name + ' (변형이 적용되지 않음)'); fail++; return; }
  const f = path.join(tmp, 'x.html'); fs.writeFileSync(f, out);
  const r = spawnSync('node', [path.join(__dirname, '..', 'scripts', 'validate-silicon-library.js')], { encoding: 'utf8', env: Object.assign({}, process.env, { SL_FILE: f }) });
  const hit = r.status === 1 && r.stdout.indexOf('[ERROR] ' + code) >= 0;
  console.log((hit ? 'PASS' : 'FAIL') + ' ' + name + ' → ' + code); if (!hit) { fail++; console.log(r.stdout.split('\n').filter((l) => /ERROR/.test(l)).slice(0, 3).join('\n') || r.stderr.slice(0, 300)); }
});
process.exit(fail ? 1 : 0);
