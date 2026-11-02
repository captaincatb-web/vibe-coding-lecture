#!/usr/bin/env node
'use strict';
/* 실리콘 서재 데이터 정합성 검사 (의존성 없음)
   사용: node scripts/validate-silicon-library.js [--json] [--strict]
   종료 코드: 오류(ERROR)가 있으면 1. --strict 이면 경고(WARN)도 1.
   수준: ERROR 데이터가 깨졌음 / WARN 확인이 필요함 / REVIEW 사람이 판단할 항목 / INFO 참고 */
const { loadData } = require('./load-silicon-library');

const args = process.argv.slice(2);
const D = loadData(process.env.SL_FILE);
const out = [];
const add = (lv, code, msg) => out.push({ lv, code, msg });
const E = (c, m) => add('ERROR', c, m), W = (c, m) => add('WARN', c, m), R = (c, m) => add('REVIEW', c, m), I = (c, m) => add('INFO', c, m);
const ISO = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const strip = (n) => String(n).replace(/\s*\(.*\)$/, '').replace(/[㈜\s]/g, '');

const { B, S, shelves, TX, TXN, PROC, REP, X, GA, groupOf, ENT } = D;
const uniq = (a) => Array.from(new Set(a));

/* ---------- 1. 행(책) 기본 ---------- */
const names = {};
B.forEach((b, i) => {
  if (names[b.n] !== undefined) E('ROW_DUP', `책 이름 중복: ${b.n} (#b${names[b.n]}, #b${i})`);
  names[b.n] = i;
  ['n', 'reg', 'item', 'g', 'conf', 'one'].forEach((k) => { if (!b[k]) E('ROW_REQ', `${b.n}: 필수 필드 ${k} 누락`); });
  ['facts', 'tech', 'mkt', 'watch', 'src'].forEach((k) => { if (!Array.isArray(b[k])) E('ROW_REQ', `${b.n}: ${k} 배열 아님`); });
  if (!['A', 'B', 'C'].includes(b.conf)) E('CONF', `${b.n}: 신뢰도 값 오류 ${b.conf}`);
  if (!groupOf[b.g]) E('GROUP', `${b.n}: 존재하지 않는 품목군 ${b.g}`);
  if (b.ref && names[b.ref] === undefined && !B.some((x) => x.n === b.ref)) E('REF', `${b.n}: ref 대상 없음 ${b.ref}`);
  (b.src || []).forEach((k) => { if (!S[k]) E('SRC_ID', `${b.n}: 유효하지 않은 출처 ID ${k}`); });
  const labels = (b.facts || []).map((f) => f[0]);
  const dup = labels.filter((l, k) => labels.indexOf(l) !== k);
  if (dup.length) W('FACT_DUP', `${b.n}: 같은 항목명이 기본 데이터와 PATCH에서 중복됨 → ${uniq(dup).join(', ')}`);
  if (!b.ref && b.conf === 'A' && !(b.src || []).length) E('CONF_SRC', `${b.n}: 신뢰도 A인데 출처 없음`);
  if (!b.ref && b.conf !== 'C' && !(b.src || []).length) W('CONF_SRC', `${b.n}: 신뢰도 ${b.conf}인데 출처 없음`);
  if (b.conf === 'C' && (b.src || []).length) I('CONF_C_SRC', `${b.n}: 신뢰도 C이나 출처 ${b.src.length}건 있음`);
});
const base = B.filter((b) => !b.ref);
const refs = B.filter((b) => b.ref);

/* ---------- 1b. 기본 데이터(B)와 PATCH 병합 충돌 ---------- */
Object.keys(D.PATCH).forEach((k) => {
  const p = D.PATCH[k], b0 = D.B0.find((x) => x.n === k);
  if (!b0) { E('PATCH_ROW', `PATCH 대상 행 없음: ${k}`); return; }
  if (b0.ref) E('PATCH_REF', `PATCH가 ref 행(${k})을 가리킴 — 병합에서 무시됨`);
  if (p.conf && p.conf !== b0.conf) R('PATCH_CONF', `${k}: PATCH가 신뢰도를 ${b0.conf}→${p.conf}로 덮어씀 — 근거(출처)와 책 내용이 일치하는지 확인`);
  if (p.one && p.one !== b0.one) I('PATCH_ONE', `${k}: 회사 한 줄 소개를 PATCH가 교체함`);
  if (p.watch && (b0.watch || []).length) I('PATCH_WATCH', `${k}: 기본 "추가 확인할 점"(${b0.watch.length}건)을 PATCH가 교체함 — 해소된 항목이 남아 있지 않은지 확인`);
  const bl = (b0.facts || []).map((f) => f[0]);
  (p.facts || []).forEach((f) => { if (bl.includes(f[0])) W('PATCH_FACT', `${k}: 항목 "${f[0]}"이 기본 데이터와 PATCH에 모두 있음 → 서로 다른 값이 공존할 수 있음`); });
  const bt = (b0.tech || []).concat(b0.mkt || []);
  (p.tech || []).concat(p.mkt || []).forEach((t) => { if (bt.includes(t)) W('PATCH_TEXT', `${k}: 같은 문장이 기본 데이터와 PATCH에 반복됨 → ${t.slice(0, 30)}`); });
  (p.src || []).forEach((s2) => { if (!S[s2]) E('SRC_ID', `PATCH ${k}: 출처 ID ${s2} 없음`); if ((b0.src || []).includes(s2)) W('PATCH_SRC', `${k}: 출처 ${s2}가 기본 데이터와 PATCH에 중복`); });
});
D.B0.forEach((b0) => { if (!b0.ref && !D.PATCH[b0.n] && b0.conf === 'C') R('CONF_C', `${b0.n}: 신뢰도 C(PATCH 없음) — 후속 조사 대상`); });

/* ---------- 2. 중복 기업(표시명 정규화는 '검토'만, 자동 병합하지 않음) ---------- */
const byNorm = {};
base.forEach((b) => { (byNorm[strip(b.n).toLowerCase()] = byNorm[strip(b.n).toLowerCase()] || []).push(b.n); });
Object.keys(byNorm).forEach((k) => { if (byNorm[k].length > 1) R('NAME_SIM', `표시명이 같은 서로 다른 행: ${byNorm[k].join(' / ')} — 같은 법인인지 사람이 확인`); });

/* ---------- 3. 출처 참조 ---------- */
Object.keys(REP).forEach((k) => REP[k].forEach((r) => { if (r.s && !S[r.s]) E('SRC_ID', `리포트 ${k}/${r.by}: 출처 ID ${r.s} 없음`); }));
Object.keys(X).forEach((k) => (X[k].news || []).forEach((n) => { if (n[2] && !S[n[2]]) E('SRC_ID', `뉴스 ${k}: 출처 ID ${n[2]} 없음`); }));
Object.keys(S).forEach((k) => { const s = S[k]; if (!s || !s[0] || !/^https?:\/\//.test(s[1] || '')) E('SRC_FMT', `출처 ${k}: 제목 또는 URL 형식 오류`); });

/* ---------- 4. 제품·공정 참조 ---------- */
Object.keys(TXN).forEach((n) => {
  if (!B.some((b) => b.n === n)) E('TXN_ROW', `TXN: 존재하지 않는 회사 ${n}`);
  TXN[n].forEach((k) => { if (!TX[k]) E('TXN_PROD', `TXN ${n}: 존재하지 않는 제품 ${k}`); });
  if (new Set(TXN[n]).size !== TXN[n].length) E('TXN_DUP', `TXN ${n}: 제품 중복`);
});
const procIds = PROC.map((p) => p.id);
if (new Set(procIds).size !== procIds.length) E('PROC_DUP', '공정 ID 중복');
PROC.forEach((p) => p.tx.forEach((k) => { if (!TX[k]) E('PROC_PROD', `공정 ${p.id}: 존재하지 않는 제품 ${k}`); }));
const procOf = {};
PROC.forEach((p) => p.tx.forEach((k) => { (procOf[k] = procOf[k] || []).push(p.id); }));
Object.keys(TX).forEach((k) => {
  if (!procOf[k]) {
    if (TX[k].noProc) I('PROD_NOPROC', `제품 ${k}: 공정에 연결되지 않음(의도: ${TX[k].noProc})`);
    else W('PROD_NOPROC', `제품 ${k}: 어떤 공정에도 연결되지 않음`);
  }
  if (!Object.keys(TXN).some((n) => TXN[n].includes(k))) W('PROD_NOFIRM', `제품 ${k}: 만드는 회사 없음`);
});
base.forEach((b) => { if (!TXN[b.n]) W('ROW_NOPROD', `${b.n}: 연결된 제품 없음`); });
refs.forEach((b) => { if (!TXN[b.n]) W('ROW_NOPROD', `${b.n}: (ref 행) 연결된 제품 없음`); });

/* ---------- 5. 책장 구조·집계 ---------- */
const catOf = { mat: '소재', part: '부품', eq: '장비' };
const shelfOfGroup = {};
shelves.forEach((s) => { if (!catOf[s.id]) E('SHELF_CAT', `알 수 없는 책장 ${s.id}`); s.groups.forEach((g) => { shelfOfGroup[g.id] = s.id; }); });
B.forEach((b) => { if (!shelfOfGroup[b.g]) E('GROUP', `${b.n}: 책장에 없는 품목군 ${b.g}`); });
const rowsByShelf = {}; B.forEach((b) => { const s = shelfOfGroup[b.g]; rowsByShelf[s] = (rowsByShelf[s] || 0) + 1; });
I('COUNT', `책 ${B.length}행 / 고유 기업 ${base.length} / ref 행 ${refs.length} / 책장별 행 ${JSON.stringify(rowsByShelf)}`);
const conf = { A: 0, B: 0, C: 0 }; base.forEach((b) => conf[b.conf]++);
I('CONF', `신뢰도(고유 기업 기준) ${JSON.stringify(conf)}`);

/* ---------- 6. 정량 주장의 출처(휴리스틱) ---------- */
const numRe = /\d[\d,.]*\s*(억|조|%|톤|명|만 원|달러|단|장|곳)/;
base.forEach((b) => {
  if ((b.src || []).length) return;
  const lines = [].concat(b.tech || [], b.mkt || [], (b.facts || []).map((f) => f.join(' ')));
  const q = lines.filter((t) => numRe.test(t));
  if (q.length) W('NUM_NOSRC', `${b.n}: 출처가 없는데 수치가 들어간 문장 ${q.length}건`);
});

/* ---------- 7. PR1 메타데이터(ENT) ---------- */
if (!ENT) {
  E('ENT_MISSING', 'ENT(기업 분류 메타데이터)가 없습니다');
} else {
  const ids = ENT.list.map((e) => e.id);
  if (new Set(ids).size !== ids.length) E('ENT_ID_DUP', `기업 ID 중복: ${ids.filter((x, k) => ids.indexOf(x) !== k).join(', ')}`);
  const rows = ENT.list.map((e) => e.row);
  rows.forEach((r, k) => { if (rows.indexOf(r) !== k) E('ENT_ROW_DUP', `같은 책 행이 두 기업에 등록됨: ${r}`); });
  const legal = {};
  ENT.list.forEach((e) => {
    (e.units || []).forEach((u) => { if (u.legal) (legal[u.legal] = legal[u.legal] || []).push(e.id + '/' + u.id); });
    if (e.legal) (legal[e.legal] = legal[e.legal] || []).push(e.id);
  });
  Object.keys(legal).forEach((k) => { const ent = uniq(legal[k].map((x) => x.split('/')[0])); if (ent.length > 1) E('ENT_LEGAL_DUP', `같은 법인이 서로 다른 기업 ID에 등록됨: ${k} → ${ent.join(', ')}`); });
  if (ENT.expected) {
    if (ENT.list.length !== ENT.expected.unique) E('ENT_COUNT', `기업 ID ${ENT.list.length}개, 기대 고유 기업 ${ENT.expected.unique}`);
    if (base.length !== ENT.expected.unique) E('ENT_COUNT', `ref 제외 책 ${base.length}권, 기대 고유 기업 ${ENT.expected.unique}`);
    if (B.length !== ENT.expected.rows) E('ENT_COUNT', `책 행 ${B.length}개, 기대 ${ENT.expected.rows}`);
  }
  const rowSet = new Set(B.map((b) => b.n));
  base.forEach((b) => { if (!rows.includes(b.n)) E('ENT_MISSING_ROW', `${b.n}: ENT에 등록되지 않은 기업`); });
  const entIds = new Set(ids), aliasOwner = {};
  ENT.list.forEach((e) => {
    const tag = `${e.id} ${e.row}`;
    if (!rowSet.has(e.row)) E('ENT_ROW', `${tag}: 존재하지 않는 책 행`);
    if (!ENT.cat.includes(e.cat)) E('ENT_CAT', `${tag}: 잘못된 주 분류 ${e.cat}`);
    (e.sub || []).forEach((c) => { if (!ENT.cat.includes(c)) E('ENT_CAT', `${tag}: 잘못된 보조 분류 ${c}`); if (c === e.cat) E('ENT_CAT', `${tag}: 보조 분류가 주 분류와 같음`); });
    if (!ENT.chain.includes(e.chain)) E('ENT_CHAIN', `${tag}: 잘못된 공급망 구분 ${e.chain}`);
    if (!ENT.vstat.includes(e.vs)) E('ENT_VS', `${tag}: 잘못된 검증 상태 ${e.vs}`);
    (e.areas || []).forEach((a) => { if (!ENT.areas.includes(a)) E('ENT_AREA', `${tag}: 잘못된 공정 영역 ${a}`); });
    ['id', 'row', 'cat', 'chain', 'vs', 'why'].forEach((k) => { if (!e[k]) E('ENT_REQ', `${tag}: 필수 필드 ${k} 누락`); });
    (e.alias || []).forEach((a) => {
      const bi = B.find((b) => b.n === a);
      if (!bi) E('ENT_ALIAS', `${tag}: 존재하지 않는 별칭 행 ${a}`);
      else if (bi.ref !== e.row) E('ENT_ALIAS', `${tag}: 별칭 행 ${a}의 ref(${bi.ref})가 ${e.row}와 다름`);
      if (aliasOwner[a]) E('ENT_ALIAS', `별칭 행 ${a}가 두 기업에 연결됨`); aliasOwner[a] = e.id;
    });
    refs.forEach((r) => { if (r.ref === e.row && !(e.alias || []).includes(r.n)) E('ENT_ALIAS', `${tag}: ref 행 ${r.n}이 별칭으로 등록되지 않음`); });
    /* 제품·공정 연결 정합성 */
    const prods = uniq([].concat(TXN[e.row] || [], ...(e.alias || []).map((a) => TXN[a] || [])));
    if (JSON.stringify(prods.slice().sort()) !== JSON.stringify((e.products || []).slice().sort())) E('ENT_PROD', `${tag}: products(${(e.products || []).join(',')})가 TXN(${prods.join(',')})과 다름`);
    (e.products || []).forEach((k) => { if (!TX[k]) E('ENT_PROD', `${tag}: 존재하지 않는 제품 ${k}`); });
    const procs = uniq([].concat(...(e.products || []).map((k) => procOf[k] || []))).sort();
    if (JSON.stringify(procs) !== JSON.stringify((e.processes || []).slice().sort())) E('ENT_PROC', `${tag}: processes(${(e.processes || []).join(',')})가 제품에서 도출한 공정(${procs.join(',')})과 다름`);
    (e.processes || []).forEach((p) => { if (!procIds.includes(p)) E('ENT_PROC', `${tag}: 존재하지 않는 공정 ${p}`); });
    const area = uniq(procs.map((p) => (p === 'infra' ? '인프라' : ['pkg', 'hbm', 'test'].includes(p) ? 'P&T' : 'FAB'))).sort();
    if (JSON.stringify(area) !== JSON.stringify((e.areas || []).slice().sort())) E('ENT_AREA', `${tag}: areas(${(e.areas || []).join(',')})가 공정에서 도출한 영역(${area.join(',')})과 다름`);
    /* 공급망 구분 규칙 */
    if (e.chain === '직접' && !procs.some((p) => p !== 'infra')) E('ENT_CHAIN', `${tag}: 직접으로 분류했지만 제조공정에 연결된 제품이 없음`);
    if (e.chain === '간접' && procs.some((p) => p !== 'infra')) W('ENT_CHAIN', `${tag}: 간접으로 분류했지만 인프라 외 공정에 연결됨`);
    if (e.chain === '관련 산업' && procs.length) E('ENT_CHAIN', `${tag}: 관련 산업인데 제조공정(${procs.join(',')})에 연결됨`);
    const b = B.find((x) => x.n === e.row);
    if (b) {
      const want = { A: '검증', B: '부분 검증', C: '미검증' }[b.conf];
      if (want !== e.vs) E('ENT_VS', `${tag}: 검증 상태(${e.vs})가 책 신뢰도(${b.conf}→${want})와 다름`);
      if (b.conf === 'C' && e.chain !== '검증 필요') W('ENT_CHAIN', `${tag}: 신뢰도 C인데 공급망 구분이 ${e.chain}`);
      const shelfCat = catOf[shelfOfGroup[b.g]];
      if (e.cat !== shelfCat && !(e.shelfNote)) E('ENT_SHELF', `${tag}: 주 분류(${e.cat})와 책장(${shelfCat})이 다른데 shelfNote 없음`);
    }
    /* 법인·사업 단위 */
    (e.units || []).forEach((u) => {
      ['id', 'name', 'biz', 'products'].forEach((k) => { if (!u[k]) E('UNIT_REQ', `${tag}/${u.id || '?'}: 필수 필드 ${k} 누락`); });
      (u.products || []).forEach((k) => { if (!(e.products || []).includes(k)) E('UNIT_PROD', `${tag}/${u.id}: 제품 ${k}가 기업 products에 없음`); });
    });
    if ((e.units || []).length) {
      const covered = uniq([].concat(...e.units.map((u) => u.products)));
      (e.products || []).forEach((k) => { if (!covered.includes(k)) W('UNIT_COVER', `${tag}: 제품 ${k}가 어떤 사업 단위에도 속하지 않음`); });
      const lu = e.units.filter((u) => u.legal && u.legalVerified === true).map((u) => u.legal);
      if (new Set(lu).size > 1 && e.sameLegal === true) E('UNIT_LEGAL', `${tag}: 서로 다른 법인을 sameLegal로 표시`);
    }
  });
  /* 공정 지도(MAP)와 기업의 공정 연결 일치 */
  const stageProc = { '웨이퍼': ['wafer'], '노광': ['photo'], '식각·세정': ['etch', 'clean', 'imp', 'diff'], '증착·배선': ['dep', 'imp'], 'CMP': ['cmp'], '테스트': ['test'], '패키징': ['pkg', 'hbm'] };
  const mapped = {};
  D.MAP.forEach((st) => (st[3] || []).forEach((n) => {
    const en = ENT.list.find((x) => x.row === n);
    if (!en) { E('MAP_ROW', `공정 지도 ${st[0]}: ENT에 없는 회사 ${n}`); return; }
    (mapped[n] = mapped[n] || []).push(st[0]);
    if (en.chain === '관련 산업') E('MAP_CHAIN', `공정 지도 ${st[0]}에 관련 산업 기업(${n})이 들어 있음`);
    if (!en.processes.some((p) => (stageProc[st[0]] || []).includes(p))) W('MAP_PROC', `공정 지도 ${st[0]}의 ${n}: 연결 제품이 이 단계 공정에 쓰이지 않음(${en.processes.join(',') || '없음'})`);
  }));
  ENT.list.forEach((en) => {
    if (en.chain === '직접' && !mapped[en.row] && !(D.MAP_INFRA || []).includes(en.row)) R('MAP_MISSING', `${en.row}: 직접 공급망인데 공정 지도의 어느 단계에도 없음`);
  });

  /* 다중 분류에 따른 중복 집계 */
  const total = ENT.list.length;
  const primary = {}; ENT.list.forEach((e) => { primary[e.cat] = (primary[e.cat] || 0) + 1; });
  const sum = Object.keys(primary).reduce((a, k) => a + primary[k], 0);
  if (sum !== total) E('ENT_DOUBLE', `주 분류 합계 ${sum} ≠ 고유 기업 ${total}`);
  I('ENT_PRIMARY', `주 분류별 고유 기업 ${JSON.stringify(primary)} (합계 ${sum})`);
  const part = {}; B.forEach((b) => { part[shelfOfGroup[b.g]] = (part[shelfOfGroup[b.g]] || 0) + 1; });
  I('ENT_PARTICIPATION', `책장별 사업 참여(행) ${JSON.stringify(part)} 합계 ${B.length} — 고유 기업 ${total}와의 차이 ${B.length - total}는 ref 행 ${refs.length}개`);
  if (B.length - total !== refs.length) E('ENT_DOUBLE', '행 수 − 고유 기업 수가 ref 행 수와 다름(다중 분류로 중복 집계 의심)');
  ENT.list.forEach((e) => { if (e.cat === '기타' && e.chain === '직접') E('ENT_CHAIN', `${e.id} ${e.row}: 기타 분류인데 직접 공급망`); });

  /* ---------- 8. 사실(FACTS) ---------- */
  const F = ENT.facts || [];
  const fid = F.map((f) => f.id);
  if (new Set(fid).size !== fid.length) E('FACT_ID', '사실 ID 중복');
  F.forEach((f) => {
    const t = `사실 ${f.id}`;
    ['id', 'ent', 'text', 'kind', 'vs', 'checked'].forEach((k) => { if (f[k] === undefined || f[k] === '') E('FACT_REQ', `${t}: 필수 필드 ${k} 누락`); });
    if (!entIds.has(f.ent)) E('FACT_ENT', `${t}: 존재하지 않는 기업 ID ${f.ent}`);
    if (!ENT.kinds.includes(f.kind)) E('FACT_KIND', `${t}: 자료 유형 오류 ${f.kind}`);
    if (!ENT.vstat.includes(f.vs)) E('FACT_VS', `${t}: 검증 상태 오류 ${f.vs}`);
    ['pub', 'asof', 'checked'].forEach((k) => { if (f[k] != null && !ISO.test(f[k])) E('FACT_DATE', `${t}: ${k} 날짜 형식 오류 ${f[k]}`); });
    (f.src || []).forEach((k) => { if (!S[k]) E('SRC_ID', `${t}: 출처 ID ${k} 없음`); });
    if (f.kind !== '확인 불가' && f.kind !== '편집 분석' && !(f.src || []).length) E('FACT_SRC', `${t}: ${f.kind}인데 원문 출처 없음`);
    if (f.vs === '검증' && !(f.src || []).length) E('FACT_SRC', `${t}: 검증 상태인데 원문 출처 없음`);
    if (f.vs === '검증' && (f.kind === '확인 불가')) E('FACT_VS', `${t}: 확인 불가 유형을 검증으로 표시할 수 없음`);
    if (f.pub && f.checked && f.pub > f.checked) E('FACT_DATE', `${t}: 발행일(${f.pub})이 확인일(${f.checked})보다 늦음`);
    if (f.asof && f.checked && f.asof > f.checked) E('FACT_DATE', `${t}: 사실 기준일(${f.asof})이 확인일(${f.checked})보다 늦음`);
    if ((f.src || []).length && f.pub == null && f.kind !== '확인 불가') I('FACT_PUB', `${t}: 발행일 미기재`);
    if (f.kind === '증권사·기관 추정' && f.vs === '검증' && /전망|목표|예상/.test(f.text) && !/전망/.test(f.kindNote || '')) W('FACT_FWD', `${t}: 전망성 문장은 kindNote로 전망임을 밝혀야 함`);
  });
  const nVer = F.filter((f) => f.vs === '검증').length;
  I('FACT_COUNT', `사실 ${F.length}건 (검증 ${nVer} / 부분 검증 ${F.filter((f) => f.vs === '부분 검증').length} / 미검증 ${F.filter((f) => f.vs === '미검증').length})`);
}

/* ---------- 출력 ---------- */
const order = { ERROR: 0, WARN: 1, REVIEW: 2, INFO: 3 };
out.sort((a, b) => order[a.lv] - order[b.lv]);
const cnt = (lv) => out.filter((o) => o.lv === lv).length;
if (args.includes('--json')) {
  console.log(JSON.stringify({ errors: cnt('ERROR'), warnings: cnt('WARN'), review: cnt('REVIEW'), items: out }, null, 2));
} else {
  out.forEach((o) => console.log(`[${o.lv}] ${o.code}: ${o.msg}`));
  console.log(`\n요약: 오류 ${cnt('ERROR')} · 경고 ${cnt('WARN')} · 검토 ${cnt('REVIEW')} · 참고 ${cnt('INFO')}`);
}
process.exit(cnt('ERROR') || (args.includes('--strict') && cnt('WARN')) ? 1 : 0);
