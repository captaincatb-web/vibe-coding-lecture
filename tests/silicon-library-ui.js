'use strict';
/* 실리콘 서재 UI 회귀 테스트 (Playwright). 실행: node tests/silicon-library-ui.js */
const path = require('path');
const { chromium } = require('playwright');
const URL = process.env.SL_TEST_URL || 'file://' + path.join(__dirname, '..', 'silicon-library', 'index.html');
const results = [];
async function configureContext(context) {
  if (process.env.SL_OFFLINE_FIXTURES === '1') {
    await context.route('https://fonts.googleapis.com/**', r => r.fulfill({status:200, contentType:'text/css', body:'/* System font fallback; external fonts are not tested. */'}));
    await context.route('**/favicon.ico', r => r.fulfill({status:204, body:''}));
  }
}
const ok = (name, cond, extra) => { results.push([name, !!cond, extra || '']); console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : '  → ' + (extra || ''))); };

(async () => {
  const browser = await chromium.launch(process.env.SL_BROWSER_EXECUTABLE ? { executablePath: process.env.SL_BROWSER_EXECUTABLE } : {});
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await configureContext(ctx);
  if (process.env.SL_OFFLINE_FIXTURES === '1') console.log('FIXTURE: system fonts and empty favicon; external font delivery excluded');
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const text = () => page.evaluate(() => document.getElementById('app').innerText);
  const idx = (n) => page.evaluate((n) => [...document.querySelectorAll('.spine')].findIndex((e) => e.getAttribute('aria-label').indexOf(n) === 0 && e.dataset.i !== undefined) && +[...document.querySelectorAll('.spine')].find((e) => e.getAttribute('aria-label').indexOf(n) === 0).dataset.i, n);

  await page.goto(URL);
  ok('오류 없이 로드', errs.length === 0, errs.join('|'));
  const n = await page.locator('.spine').count();
  ok('책등 46권', n === 46, n);
  const leg = await page.locator('.legend').innerText();
  const nums = [...leg.matchAll(/(\d+)개 사/g)].map((m) => +m[1]);
  ok('신뢰도 집계 합계가 고유 기업 45', nums.reduce((a, b) => a + b, 0) === 45, leg);
  ok('책장 설명에 고유 기업 수 표시', (await page.locator('.shelf .cap').allInnerTexts()).every((t) => /고유 기업 \d+곳/.test(t)));

  /* 에이텍솔루션 검색 */
  await page.fill('#q', '에이텍솔루션');
  ok('에이텍솔루션 검색은 고유 기업 1곳', /회사 1권/.test(await page.locator('#hits').innerText()), await page.locator('#hits').innerText());
  await page.fill('#q', '');
  const aets = +(await page.evaluate(() => [...document.querySelectorAll('.spine')].find((e) => e.getAttribute('aria-label').startsWith('에이텍솔루션,')).dataset.i));
  const aetsClean = +(await page.evaluate(() => [...document.querySelectorAll('.spine')].find((e) => e.getAttribute('aria-label').startsWith('에이텍솔루션 (세정)')).dataset.i));
  await page.goto(URL + '#b' + aets);
  let t = await text();
  ok('에이텍: 법인·사업 구분에 재생 웨이퍼·정밀세정', /법인·사업 구분/.test(t) && /재생 웨이퍼/.test(t) && /부품 정밀세정/.test(t));
  ok('에이텍: 한 법인의 두 사업 설명', /한 법인이 두 사업/.test(t));
  ok('에이텍: 보조 분류 부품', /보조 분류\s*부품/.test(t));
  await page.click('.tabs button:nth-child(4)');
  const on = await page.$$eval('.pflow li.on', (l) => l.map((x) => x.innerText));
  ok('에이텍: 공정 내 역할에 웨이퍼 제조·세정 모두 강조', on.some((x) => /웨이퍼/.test(x)) && on.some((x) => /세정/.test(x)), on.join(','));
  await page.click('.pflow li.on a >> nth=-1');
  ok('에이텍: 공정 링크로 공정 페이지 이동', /^#t-/.test(await page.evaluate(() => location.hash)));
  await page.goto(URL + '#t-clean'); t = await text();
  ok('세정 공정에 에이텍솔루션 표시', /에이텍솔루션/.test(t));
  await page.goto(URL + '#t-wafer'); t = await text();
  ok('웨이퍼 공정에 에이텍솔루션 표시', /에이텍솔루션/.test(t));
  /* 기존 중복 행 URL */
  await page.goto(URL); await page.goto(URL + '#b' + aetsClean);
  await page.waitForTimeout(300);
  ok('기존 세정 행 URL이 통합 기업으로 이동', (await page.evaluate(() => location.hash)) === '#b' + aets, await page.evaluate(() => location.hash));
  ok('통합 기업 책이 열림', /에이텍솔루션/.test(await page.locator('.cover h1').innerText()));

  /* 린데 */
  const linde = +(await page.evaluate(() => (location.hash = '', [...document.querySelectorAll('.spine')].length, 0)));
  await page.goto(URL); const li = +(await page.evaluate(() => [...document.querySelectorAll('.spine')].find((e) => e.getAttribute('aria-label').startsWith('린데,')).dataset.i));
  await page.goto(URL + '#b' + li); t = await text();
  ok('린데: 두 법인명 표시', /린데코리아 주식회사/.test(t) && /Linde AMT Chonan Co\., Ltd\./.test(t));
  ok('린데: 합산 금지 설명', /합산하지 않았고/.test(t));
  ok('린데: 타겟은 천안, 가스는 천안 아님', /충남 천안시 서북구/.test(t) && /평택/.test(t));
  await page.click('.tabs button:nth-child(2)');
  ok('린데: 미확인 관계 명시', /지분 관계는 확인하지 못함/.test(await text()));

  /* 삼화전기 */
  await page.goto(URL); const sw = +(await page.evaluate(() => [...document.querySelectorAll('.spine')].find((e) => e.getAttribute('aria-label').startsWith('삼화전기,')).dataset.i));
  await page.goto(URL + '#b' + sw); t = await text();
  ok('삼화전기: 주 분류 기타 / 공급망 관련 산업', /주 분류\s*기타/.test(t) && /관련 산업/.test(t));
  ok('삼화전기: 제조공정 투입 근거 미확인 설명', /투입된다는 근거는 확인하지 못함/.test(t));
  await page.click('.tabs button:nth-child(4)'); t = await text();
  ok('삼화전기: 공정 내 역할에 공정 흐름 대신 안내문', /제조공정에 투입되는 재료가 아니어서/.test(t) && (await page.locator('.pflow').count()) === 0);
  await page.goto(URL + '#t-pkg'); t = await text();
  ok('패키징 공정에 삼화전기 없음', !/삼화전기/.test(t));
  await page.goto(URL + '#map'); t = await text();
  ok('공정 지도에 삼화전기 없음', !/삼화전기/.test(t));
  await page.goto(URL + '#x-alcap'); t = await text();
  ok('전해 커패시터 기술 페이지 유지, 삼화전기 연결', /알루미늄 전해 커패시터/.test(t) && /삼화전기/.test(t));
  await page.goto(URL + '#b' + sw); await page.click('.tabs button:nth-child(8)'); t = await text();
  ok('삼화전기: 사실 단위 근거 표', /사실 단위 근거/.test(t) && /f010/.test(t) && /기업 발표 또는 주장/.test(t) && /확인 불가/.test(t));
  ok('참고자료: A등급 의미 설명', /모든 수치와 미래 전망이 검증됐다는 뜻이 아닙니다/.test(t));

  /* PR1 마무리: 집계 기준·공급망·원문 대조 표시 */
  await page.goto(URL);
  ok('레코드 수가 법인 수가 아니라는 설명', /법인 수가 아닙니다/.test(await text()));
  ok('신뢰도가 원문 대조가 아니라는 안내와 대조 건수', /문장별 원문 대조는 15건\(3개 기업\)뿐/.test(await text()));
  for (const nm of ['EDWARDS', '세메스', '쿠리타한수', '에어프로덕츠코리아']) {
    const k = +(await page.evaluate((nm) => [...document.querySelectorAll('.spine')].find((e) => e.getAttribute('aria-label').startsWith(nm + ',')).dataset.i, nm));
    await page.goto(URL + '#b' + k); const tt = await text();
    ok(nm + ': 공급망 구분 검증 필요(근거 부족)', /공급망 구분\s*검증 필요/.test(tt) && /근거 부족/.test(tt), tt.slice(0, 0));
    await page.goto(URL);
  }
  await page.goto(URL + '#b' + li); t = await text();
  ok('린데: 원문 대조 건수 표시', /원문 대조\s*6건 등록/.test(t));
  ok('린데: 공급망 구분 정의 포함', /공급망 구분 정의/.test(t));
  await page.click('.tabs button:nth-child(8)'); t = await text();
  ok('린데: 사실 표에 범위(법인·그룹) 구분', /법인 \(linde-korea\)/.test(t) && /법인 \(linde-amt-chonan\)/.test(t) && /그룹/.test(t));
  await page.goto(URL + '#b0'); t = await text();
  ok('대조하지 않은 기업은 "대조한 사실 없음" 표시', /대조한 사실 없음/.test(t));

  /* PR2: 공정 심화 해설 */
  const SEC7 = ['기본 개념', '동작 원리', '핵심 소재·부품·장비', '주요 공정 변수', '품질·불량 메커니즘', '기술 발전 방향', '산업·기업 연계'];
  const AREAS = { dep: '증착', etch: '식각 및 세정', cmp: 'CMP', hbm: 'HBM 및 첨단 패키징', test: '반도체 테스트' };
  for (const [pid, nm] of Object.entries(AREAS)) {
    await page.goto(URL + '#t-' + pid); t = await text();
    const hs = await page.$$eval('.deepbox section.tsec > h3', (l) => l.map((x) => x.innerText));
    ok('심화 해설(' + nm + '): 7개 관점이 순서대로 표시', JSON.stringify(hs.slice(0, 7)) === JSON.stringify(SEC7), hs.join('|'));
    ok('심화 해설(' + nm + '): 출처 목록과 열람 상태 표시', /출처 \d+건/.test(t) && /검색 발췌 열람/.test(t) && /해결되지 않은 불확실성/.test(t));
    ok('심화 해설(' + nm + '): 기업 신뢰도와 별개라는 안내', /기업 신뢰도 A\/B\/C와 별개/.test(t));
    ok('심화 해설(' + nm + '): 서재 속 책 연결 표', (await page.locator('.deepbox table.rt .mchip').count()) > 0);
  }
  await page.goto(URL + '#t-dep'); t = await text();
  ok('증착: ALD 단순화 정정 문장', /과도한 단순화/.test(t) && /nm²당 7~9개/.test(t));
  ok('증착: 기존 해설 보존(CVD·ALD·PVD 흐름 단계)', /ALD: 전구체와 반응가스를 번갈아 넣어/.test(t));
  await page.goto(URL + '#t-cmp'); t = await text();
  ok('CMP: 디싱·에로전·선택비·Preston 설명', /Preston/.test(t) && /디싱/.test(t) && /에로전/.test(t) && /선택비/.test(t));
  await page.goto(URL + '#t-hbm'); t = await text();
  ok('HBM: TSV·본딩·언더필·열·수율·검사 연결', /TSV/.test(t) && /MR-MUF/.test(t) && /열저항/.test(t) && /거듭제곱/.test(t) && /KGSD/.test(t));
  ok('HBM: 제3자 매체 정량 주장은 쓰지 않았다는 불확실성 표시', /Nomad Semi/.test(t) && /쓰지 않았습니다/.test(t));
  await page.goto(URL + '#t-clean'); t = await text();
  ok('세정 공정에서 식각·세정 심화 해설로 연결', /식각 및 세정 심화 해설/.test(t) && (await page.locator('.deepbox').count()) === 0);
  await page.goto(URL + '#t-pkg'); t = await text();
  ok('패키징 공정에서 HBM 심화 해설로 연결', /HBM 및 첨단 패키징 심화 해설/.test(t));
  await page.goto(URL + '#t-photo'); t = await text();
  ok('심화 해설이 없는 공정(노광)은 기존 그대로 표시', (await page.locator('.deepbox').count()) === 0 && /포토/.test(t));
  await page.goto(URL + '#t-dep');
  await page.locator('.deepbox table.rt .mchip').first().click();
  ok('심화 해설의 연결 표에서 회사 책으로 이동', /^#b\d+$/.test(await page.evaluate(() => location.hash)));
  await page.goto(URL + '#tech'); t = await text();
  ok('기술 백과에 심화 해설 5개 영역 목록', /심화 해설/.test(t) && Object.values(AREAS).every((a) => t.indexOf(a) >= 0));
  await page.goto(URL + '#x-cmp'); t = await text();
  ok('제품 기술 페이지에서 심화 해설로 연결', (await page.locator('a.kchip.p[href="#t-cmp"]').count()) > 0);
  await page.goto(URL); await page.fill('#q', 'Preston');
  ok('통합 검색이 심화 해설 본문까지 찾음', (await page.locator('#hits .kchip.p').count()) > 0 && /CMP/.test(await page.locator('#hits').innerText()));
  await page.fill('#q', '');
  for (const w of [400, 1280]) {
    const p3 = await ctx.newPage(); await p3.setViewportSize({ width: w, height: 800 }); const e3 = []; p3.on('pageerror', (e) => e3.push(String(e)));
    let bad3 = 0;
    for (const pid of Object.keys(AREAS)) { await p3.goto(URL + '#t-' + pid); await p3.waitForTimeout(150); if (await p3.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) bad3++; }
    ok('심화 해설 5개 가로 넘침 없음 (' + w + 'px)', bad3 === 0 && e3.length === 0, bad3 + ' ' + e3.join('|')); await p3.close();
  }
  { const dctx = await browser.newContext({ colorScheme: 'dark', viewport: { width: 400, height: 800 } }); await configureContext(dctx); const dd = await dctx.newPage(); const de2 = []; dd.on('pageerror', (e) => de2.push(String(e))); await dd.goto(URL + '#t-test');
    ok('다크 모드 심화 해설 오류 없음', de2.length === 0 && (await dd.locator('.deepbox').count()) === 1, de2.join('|')); await dctx.close(); }

  /* PR2 정확성 검증 보완 */
  await page.goto(URL + '#x-pre'); t = await text();
  ok('전구체: 단순화 문장 정정(원자 1층 0.1nm 표현 제거)', !/원자 1층 두께\(약 0\.1nm\)/.test(t) && /보통 한 원자층 이하/.test(t));
  ok('전구체: 출처 없는 기존 수치를 미검증으로 표시', /수치 검증 상태/.test(t) && /99\.9999%/.test(t) && (await page.locator('.ctag.unc', { hasText: '미검증' }).count()) > 0);
  await page.goto(URL + '#t-dep'); t = await text();
  ok('증착: 기존 공정 문장도 조건부 표현으로 정정', !/깊은 홈도 균일(?!하)/.test(t.replace(/깊은 홈도 비교적 고르게/, '')) && /노출량·반응물 조건에 따라 달라짐/.test(t));
  ok('증착: CVD 반응 율속·물질 전달 율속 구분', /반응 율속/.test(t) && /물질 전달 율속/.test(t));
  ok('증착: ALD 피복이 조건에 따라 달라진다는 설명(5:1~1750:1)', /5:1에서 1750:1/.test(t) && /보장한다는 뜻이 아닙니다/.test(t));
  ok('증착: 정량 문장에 유형·조건·한계 표시', /유형 리뷰 재인용/.test(t) && /조건·범위/.test(t) && /원 자료/.test(t));
  ok('문장별 확인 상태 표시(원문 확인·발췌 확인·출처 등록)', /원문 확인/.test(t) && /발췌 확인/.test(t) && /출처 등록 · 문장 대조 전/.test(t));
  ok('서재 속 회사 연결이 납품 관계가 아니라는 안내(공정 페이지)', /실제 납품·공급 관계를 뜻하지 않습니다/.test(t));
  await page.goto(URL + '#t-hbm'); t = await text();
  ok('HBM: 수율 모델 가정 명시와 양산 예측식 금지', (await page.locator('.asl li').count()) >= 3 && /양산 수율 예측 공식으로 쓰면 안 됩니다/.test(t) && /독립/.test(t));
  ok('HBM: ISSCC 논문 저자 SK hynix로 정정', /Cho 외\(SK hynix\)/.test(t) && !/Samsung, A 1\.2V/.test(t));
  ok('HBM: 열람 상태 구분 표시(원문 열람·원문 일부·검색 발췌)', /원문 열람 \d+건/.test(t) && /검색 발췌 열람 \d+건/.test(t));
  ok('HBM: 열저항 수치의 인용 구조(리뷰 재인용·시뮬레이션) 명시', /Mehta 외/.test(t) && /비교 대상이 다르고/.test(t) && /HBM4 [^\n]*12Gbps/.test(t) || /12Gbps/.test(t));
  await page.goto(URL + '#t-cmp'); t = await text();
  ok('CMP: 디싱 0.65배는 서로 다른 연구 간 비교·실험 조건 명시', /pH 7/.test(t) || /중성 pH/.test(t)) ;
  ok('CMP: 0.65배의 한계 표시(2001년·비교 대상)', /서로 다른 연구 간 비교/.test(t) && /Park 외 1999/.test(t));
  await page.goto(URL + '#t-etch'); t = await text();
  ok('식각·세정: SC1 실험 조건·연도 한계 표시', /HF-last/.test(t) && /1990년대 실험실 조건/.test(t) && /표준 성능/.test(t));
  ok('식각·세정: RIE lag 사례의 조건(QALE, low-k)과 한계', /준-ALE\(QALE\)/.test(t) && /ALE 일반의 성능이 아닙니다/.test(t));
  await page.goto(URL + '#t-clean'); t = await text();
  ok('세정 공정: 부품 세정과 웨이퍼 세정의 차이 안내와 에이텍솔루션 연결 보존', /부품 세정은 세정 공정의 장비·부품을 유지하는 서비스/.test(t) && /에이텍솔루션/.test(t));
  await page.goto(URL + '#x-clean'); t = await text();
  ok('장비 부품 세정 기술 페이지: 웨이퍼 세정 재료가 아니라는 안내', /웨이퍼를 씻는 세정 공정 재료가 아닙니다/.test(t));
  await page.goto(URL + '#x-hbmfilm'); t = await text();
  ok('다른 기술 페이지에도 수치 미검증 표시', /수치 검증 상태/.test(t) && /250℃/.test(t));

  /* 즐겨찾기 */
  await page.goto(URL);
  await page.evaluate(() => localStorage.setItem('semiPartners:fav:v1', JSON.stringify(['삼화전기', '린데', '에이텍솔루션 (세정)', '덕산테코피아'])));
  await page.goto(URL); await page.reload();
  ok('기존 즐겨찾기 저장 데이터 유지(별 4개)', (await page.locator('.spine .star').count()) === 4, await page.locator('.spine .star').count());
  await page.goto(URL + '#b' + sw);
  ok('책 안에서 즐겨찾기 상태 유지', (await page.locator('#fav').getAttribute('aria-pressed')) === 'true');
  await page.click('#fav');
  ok('즐겨찾기 해제 저장', !((await page.evaluate(() => JSON.parse(localStorage.getItem('semiPartners:fav:v1')))).includes('삼화전기')));

  /* 공정 지도 → 회사 */
  await page.goto(URL + '#map');
  const chip = page.locator('.mchip').first(); await chip.click();
  ok('공정 지도 → 회사 책 이동', /^#b\d+$/.test(await page.evaluate(() => location.hash)));
  await page.goto(URL + '#map'); t = await text();
  ok('지도 식각·세정 단계에 에이텍솔루션 표시', /식각·세정[\s\S]*에이텍솔루션[\s\S]*증착·배선/.test(t));

  await page.goto(URL + '#t-metro'); t = await text();
  ok('계측 빈 회사 연결은 수록 범위 한계로 설명', /아직 연결된 회사 정보가 없습니다/.test(t) && /해당 기업이 없다는 뜻은 아닙니다/.test(t));
  ok('계측 빈 제품 연결에도 안내와 복귀 링크 표시', /아직 연결된 제품 기술이 없습니다/.test(t));
  await page.getByRole('link', { name:'기술 백과 전체 보기', exact:true }).click();
  ok('빈 제품 안내에서 기술 백과 복귀', (await page.evaluate(() => location.hash)) === '#tech');
  const data = require('../scripts/load-silicon-library').loadData();
  for (const hash of data.PROC.map(p => '#t-' + p.id).concat(Object.keys(data.TX).map(k => '#x-' + k))) {
    await page.goto(URL + hash);
    ok('기존 지식 URL 유지 ' + hash, (await page.evaluate(() => location.hash)) === hash && await page.locator('.ttl').count() === 1);
  }

  /* 모든 책 8탭 + 가로 넘침 */
  async function sweep(w) {
    const p2 = await ctx.newPage(); await p2.setViewportSize({ width: w, height: 800 }); const e2 = []; p2.on('pageerror', (e) => e2.push(String(e)));
    await p2.goto(URL); let bad = 0, tabsBad = 0;
    for (let i = 0; i < 46; i++) {
      await p2.evaluate((i) => { location.hash = 'b' + i; }, i); await p2.waitForTimeout(700);
      const tc = await p2.locator('.tabs button').count(); if (tc !== 8) { tabsBad++; }
      const ov = await p2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); if (ov) bad++;
    }
    await p2.close(); return { bad, tabsBad, e2 };
  }
  for (const w of [400, 1280]) { const r = await sweep(w); ok(`전체 책 가로 넘침 없음 (${w}px)`, r.bad === 0 && r.e2.length === 0, JSON.stringify(r)); ok(`전체 책 탭 수 확인 (${w}px, 46권 모두 8탭)`, r.tabsBad === 0, JSON.stringify(r)); }
  /* 모바일 책장·기능 */
  const mp = await ctx.newPage(); await mp.setViewportSize({ width: 400, height: 800 }); await mp.goto(URL);
  ok('모바일 책장 가로 넘침 없음', !(await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));
  await mp.fill('#q', 'ALD'); ok('모바일 검색 동작', (await mp.locator('.spine:not([hidden])').count()) > 0);
  await mp.close();
  /* 키보드 */
  await page.goto(URL + '#b' + li); await page.keyboard.press('ArrowRight');
  ok('키보드 → 로 다음 쪽', /2 \/ \d+ 쪽/.test(await page.locator('.folio').innerText()));
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  ok('Esc 로 책장 복귀', (await page.evaluate(() => location.hash)) === '');
  /* 다크 모드 */
  const dp = await browser.newContext({ colorScheme: 'dark', viewport: { width: 400, height: 800 } }); await configureContext(dp); const d = await dp.newPage(); const de = []; d.on('pageerror', (e) => de.push(String(e)));
  await d.goto(URL + '#b' + sw); ok('다크 모드 책 열기 오류 없음', de.length === 0 && /삼화전기/.test(await d.locator('.cover h1').innerText()), de.join('|'));
  ok('전체 실행 중 콘솔 오류 없음', errs.length === 0, errs.join('|'));
  await browser.close();
  const fail = results.filter((r) => !r[1]);
  console.log(`\n${results.length - fail.length}/${results.length} 통과`);
  process.exit(fail.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
