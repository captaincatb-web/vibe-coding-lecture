'use strict';
/* 검증 스크립트가 실제로 오류를 잡는지 확인: 데이터를 일부러 망가뜨린 복사본을 만들어 실행 */
const fs = require('fs'); const os = require('os'); const path = require('path'); const { spawnSync } = require('child_process');
const src = fs.readFileSync(path.join(__dirname, '..', 'silicon-library', 'index.html'), 'utf8');
const cases = [
  ['기업 ID 중복', (s) => s.replace('id: "c02", row:', 'id: "c01", row:'), 'ENT_ID_DUP'],
  ['존재하지 않는 제품 참조', (s) => s.replace('"덕산테코피아": ["pre"]', '"덕산테코피아": ["nope"]'), 'TXN_PROD'],
  ['잘못된 분류', (s) => s.replace('id: "c03", row: "디엔에프", cat: "소재"', 'id: "c03", row: "디엔에프", cat: "재료"'), 'ENT_CAT'],
  ['유효하지 않은 출처 ID', (s) => s.replace('src: ["dst", "pre"]', 'src: ["dst", "zzz"]'), 'SRC_ID'],
  ['같은 법인이 두 기업에 등록', (s) => s.replace('legal: "Linde AMT Chonan Co., Ltd.", legalVerified: true, products: ["target"]', 'legal: "린데코리아 주식회사", legalVerified: true, products: ["target"]').replace('id: "c01", row: "덕산테코피아", cat: "소재", sub: [], chain: "직접", chainBasis: "공정 지도 연결", vs: "검증", products: ["pre"]', 'id: "c01", row: "덕산테코피아", cat: "소재", sub: [], chain: "직접", chainBasis: "공정 지도 연결", vs: "검증", legal: "린데코리아 주식회사", products: ["pre"]'), 'ENT_LEGAL_DUP'],
  ['관련 산업인데 공정에 연결', (s) => s.replace('"삼화전기": ["alcap"]', '"삼화전기": ["alcap", "probe"]').replace('products: ["alcap"]', 'products: ["alcap", "probe"]'), 'ENT_CHAIN'],
  ['기대 고유 기업 수 불일치', (s) => s.replace('unique: 45', 'unique: 44'), 'ENT_COUNT'],
  ['사실 출처 누락', (s) => s.replace('src: ["lk_gl", "lk_mo"], pub: null', 'src: [], pub: null'), 'FACT_SRC'],
  ['발행일이 확인일보다 늦음', (s) => s.replace('pub: "2024-06-04"', 'pub: "2027-01-01"'), 'FACT_DATE'],
  ['제품-기업 products 불일치', (s) => s.replace('row: "린데", cat: "소재", sub: [], chain: "직접", chainBasis: "사실 근거", chainFacts: ["f002"], vs: "부분 검증", products: ["gasBulk", "target"]', 'row: "린데", cat: "소재", sub: [], chain: "직접", chainBasis: "사실 근거", chainFacts: ["f002"], vs: "부분 검증", products: ["gasBulk"]'), 'ENT_PROD'],
  ['인프라 장비를 근거 없이 직접으로 분류', (s) => s.replace(/(row: "EDWARDS", cat: "장비", sub: \[\], )chain: "검증 필요", chainBasis: "근거 부족"/, '$1chain: "직접", chainBasis: "공정 지도 연결"'), 'ENT_CHAIN_INFRA'],
  ['법인이 여럿인데 unit 없는 법인 단위 사실', (s) => s.replace('scope: "법인", unit: "linde-korea", ', 'scope: "법인", '), 'FACT_SCOPE'],
  ['레코드 수 설명 삭제', (s) => s.replace('법인 수가 아닙니다', '법인 수입니다'), 'ENT_NOTE'],
  ['심화: 수치 문장의 정량 메타 제거', (s) => s.replace('"q":{"t":"원논문 실험","v":"원문 확인","yr":"2017"', '"qx":{"t":"원논문 실험","v":"원문 확인","yr":"2017"'), 'DEEP_NUM'],
  ['심화: 존재하지 않는 출처 ID', (s) => s.replace('"s":["d_ald3"]', '"s":["d_zzz"]'), 'DEEP_SRC_ID'],
  ['심화: 전망 문장에 출처 없음', (s) => s.replace('"lv":"산업","c":"불확실"', '"lv":"산업","c":"전망"'), 'DEEP_NOSRC'],
  ['심화: 미열람 출처만으로 근거 표시', (s) => s.replace(/("d_ald4":\{[^}]*?"read":")검색 발췌 열람/, '$1미열람'), 'DEEP_UNREAD'],
  ['심화: 7개 관점 중 하나 누락', (s) => s.replace('"id":"defects"', '"id":"defectz"'), 'DEEP_SECT'],
  ['심화: 주입 블록이 JSON 원본과 다름', (s) => s.replace('ALD 한 사이클은', 'ALD 두 사이클은'), 'DEEP_SYNC'],
  ['심화: 원문을 열람하지 않은 출처로 원문 확인 표시', (s) => s.replace(/("d_hb5":\{[^}]*?"read":")원문 열람/, '$1검색 발췌 열람'), 'DEEP_VS'],
  ['심화: 원문 열람인데 확인한 내용이 없음', (s) => s.replace(/("d_hb2":\{[^}]*?),"checked":"[^"]*"/, '$1'), 'DEEP_READ'],
  ['심화: 열람하지 않은 출처에 확인한 내용 기재', (s) => s.replace(/("d_ts3":\{[^}]*?)"note"/, '$1"checked":"가짜 확인","note"'), 'DEEP_READ'],
  ['심화: 불확실 표시만으로 출처 없는 정량 주장 통과', (s) => s.replace('"v":"미확인","yr":"2026","cond":"서재 프로브카드', '"v":"발췌 확인","yr":"2026","cond":"서재 프로브카드'), 'DEEP_Q'],
  ['심화: 정량 주장에 조건 누락', (s) => s.replace(',"cond":"MoS₂ ALD, Mo(thd)₃+H₂S, 유동형 F-120 반응기 약 5mbar, 250~400℃ 탐색, 실리콘 기판"', ''), 'DEEP_Q'],
  ['심화: 오래된 자료의 적용 한계 제거', (s) => s.replace('"lim":"1990년대 실험실 조건. 현재 양산 공정의 표준 성능이 아님"', '"limx":"x"').replace('"lim":"1990년대 실험실 조건(권 번호 기준 추정). 현재 양산 세정 공정의 표준 성능으로 일반화하지 않음"', '"limx":"x"'), 'DEEP_OLD'],
  ['심화: 수율 모델 가정 제거', (s) => s.replace(/"as":\["개별 TSV[^\]]*\]/, '"as":[]'), 'DEEP_MODEL'],
  ['심화: 기존 수치가 미검증 목록에서 빠짐', (s) => s.replace('{"where":"TX.pre.k","text":"99.9999%"', '{"where":"TX.pre.k","text":"99.9999%x"'), 'LEGACY_NUM'],
  ['심화: 정정한 기존 문장이 되돌려짐', (s) => s.replace('사이클마다 아주 얇은 막(보통 한 원자층 이하)을 쌓습니다.', '한 사이클에 원자 1층 두께(약 0.1nm)씩 막을 쌓습니다. 표면에서만 반응하는 자기제한 반응이라 깊은 홈 안쪽까지 두께가 균일합니다.'), 'CORRECTION'],
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
