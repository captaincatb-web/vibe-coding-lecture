'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {loadData}=require('../scripts/load-silicon-library');
const {normalize}=require('../scripts/normalize-silicon-library');
const {validateLibrary,validDate}=require('../scripts/validate-normalized-library');
const {build,serialize}=require('../scripts/build-normalized-library');
const source=loadData();
const fresh=()=>normalize(source);
const validate=d=>validateLibrary(d,{today:'2026-11-08'});
const rejects=(name,code,mutate)=>test(name,()=>{
  const d=fresh();mutate(d);const errors=validate(d);
  assert.ok(errors.some(e=>e.code===code),JSON.stringify(errors));
});
function newClaim(d) {
  if(!d.sources.some(s=>s.source_id==='fixture-source')) d.sources.push({...d.sources[0],
    source_id:'fixture-source',title:'TEST FIXTURE ONLY',url:'https://example.com/test-only',
    published_at:'2026-01-01',accessed_at:'2026-11-02',source_locator:'TEST FIXTURE section 1',
    retrieval_status:'accessible',read_status:'full_text'});
  return {...d.claims[0],claim_id:'new-manufactures',company_id:'c01',subject_id:'c01',subject_type:'company',
    predicate:'manufactures',object_id:'pre',object_type:'product',provenance:'new',legacy:null,
    source_ids:['fixture-source'],
    source_locator:'TEST FIXTURE ONLY: section 1',checked_at:'2026-11-02'};
}

test('preserves complete legacy export, input, counts, and deterministic output',()=>{
  const before=JSON.stringify(source),d=fresh();
  assert.deepEqual(validate(d),[]);
  assert.equal(JSON.stringify(d.legacy_snapshot),before);
  assert.equal(JSON.stringify(source),before);
  assert.deepEqual([d.books.length,d.companies.length,d.processes.length,d.products.length,d.claims.length,d.sources.length],[46,45,13,31,15,188+Object.keys(source.DEEP?.sources || {}).length]);
  assert.equal(serialize(source),serialize(source));
});
test('keeps Linde legal units separate without inventing facilities or financials',()=>{
  const d=fresh();
  assert.equal(d.companies.filter(c=>c.company_id==='c27').length,1);
  assert.equal(d.companies.find(c=>c.company_id==='c27').entity_kind,'unresolved_record');
  assert.deepEqual(d.business_units.filter(u=>u.company_id==='c27').map(u=>u.unit_id),['linde-korea','linde-amt-chonan']);
  assert.equal(d.business_units.filter(u=>u.company_id==='c22').length,2);
  assert.equal(d.facilities.length,0);assert.equal(d.financials.length,0);
});
test('preserves row routes, favorite names, alias targets, and historical statuses',()=>{
  const d=fresh(),alias=d.books.find(b=>b.is_alias);
  assert.equal(alias.company_id,'c22');assert.notEqual(alias.route,alias.canonical_route);
  assert.equal(alias.favorite_key,'에이텍솔루션 (세정)');
  assert.deepEqual(d.claims.reduce((a,c)=>(a[c.verification_status]++,a),{verified:0,partial:0,unverified:0}),{verified:7,partial:6,unverified:2});
  assert.ok(d.companies.every(c=>c.last_verified_at===null));
  assert.ok(d.company_products.every(r=>r.verification_status==='unverified' && r.evidence_ids.length===0));
  assert.ok(d.relationship_edges.every(r=>r.from_type==='product' && r.to_type==='process'));
});
rejects('rejects duplicate company IDs','DUPLICATE_ID',d=>d.companies.push(d.companies[0]));
rejects('rejects duplicate business relationships','DUPLICATE_RELATION',d=>d.company_products.push(d.company_products[0]));
rejects('rejects an unknown source','ORPHAN_REFERENCE',d=>d.claims[0].source_ids.push('missing'));
rejects('rejects an orphan company','ORPHAN_REFERENCE',d=>d.company_products[0].company_id='missing');
rejects('rejects an orphan process','ORPHAN_REFERENCE',d=>d.products[0].process_ids.push('missing'));
rejects('rejects one-way product/process links','BIDIRECTIONAL_LINK',d=>d.products[0].process_ids=[]);
rejects('rejects aliases pointing to another company','BOOK_ALIAS',d=>d.books[0].canonical_route='#b1');
rejects('rejects classification changes only in generated output','LEGACY_CHANGED',d=>d.companies.find(c=>c.company_id==='c29').classification_view='소재');
rejects('rejects changed historical verification','LEGACY_CHANGED',d=>d.claims[0].verification_status='unverified');
rejects('rejects unverified catalog links promoted to verified','LEGACY_RELATION_PROMOTED',d=>d.company_products[0].verification_status='verified');
rejects('rejects unsupported customer relationships','SCHEMA',d=>d.company_products[0].relationship_type='supplies_customer');
rejects('rejects missing verified relation evidence','RELATION_EVIDENCE',d=>d.company_products.push({...d.company_products[0],relationship_type:'manufactures',verification_status:'verified'}));
rejects('rejects evidence for another product','RELATION_EVIDENCE',d=>{
  const c=newClaim(d);c.object_id='cmp';d.claims.push(c);
  d.company_products.push({company_id:'c01',product_id:'pre',relationship_type:'manufactures',verification_status:'verified',evidence_ids:[c.claim_id]});
});
test('accepts a new relationship only with matching scoped evidence (synthetic fixture)',()=>{
  const d=fresh(),c=newClaim(d);d.claims.push(c);
  d.company_products.push({company_id:'c01',product_id:'pre',relationship_type:'manufactures',verification_status:'verified',evidence_ids:[c.claim_id]});
  assert.deepEqual(validate(d),[]);
});
rejects('rejects a new verified claim without an original locator','CLAIM_EVIDENCE',d=>{const c=newClaim(d);c.source_locator=null;d.claims.push(c);});
rejects('rejects snippet-only evidence for a new verified claim','SOURCE_NOT_READ',d=>{const c=newClaim(d);d.sources.at(-1).read_status='snippet';d.claims.push(c);});
rejects('rejects blocked evidence for a new verified claim','SOURCE_NOT_READ',d=>{const c=newClaim(d);d.sources.at(-1).retrieval_status='blocked';d.claims.push(c);});
rejects('rejects source access after the claimed verification date','SOURCE_NOT_READ',d=>{const c=newClaim(d);d.sources.at(-1).accessed_at='2026-11-03';d.claims.push(c);});
rejects('rejects cyclic company parents','PARENT_CYCLE',d=>{d.companies[0].parent_company_id='c02';d.companies[1].parent_company_id='c01';});
rejects('rejects cyclic process parents','PARENT_CYCLE',d=>d.processes[0].parent_process_id=d.processes[0].process_id);
rejects('rejects unknown facts pretending to be legacy','CLAIM_PROVENANCE',d=>{const c=newClaim(d);c.provenance='legacy_fact';d.claims.push(c);});
rejects('rejects business-unit claims assigned to another company','CLAIM_SCOPE',d=>d.claims[0].company_id='c01');
rejects('rejects numeric claims without unit or effective period','QUANTITATIVE_SCOPE',d=>{const c=newClaim(d);c.value=10;d.claims.push(c);});
rejects('rejects impossible dates','SCHEMA',d=>d.claims[0].checked_at='2026-02-30');
rejects('rejects future verification','FUTURE_DATE',d=>d.claims[0].checked_at='2099-01-01');
rejects('rejects publication following verification','DATE_ORDER',d=>{const c=newClaim(d);c.published_at='2026-11-03';d.claims.push(c);});
rejects('rejects credentials embedded in URLs','CREDENTIAL_URL',d=>d.sources[0].url='https://user:password@example.com/report');
rejects('rejects unknown schema properties','SCHEMA',d=>d.companies[0].revenue=0);
rejects('rejects fabricated graph edges','EDGE_MAPPING',d=>d.relationship_edges[0].to_id='metro');
rejects('rejects unrelated evidence for verified graph edges','EDGE_EVIDENCE',d=>Object.assign(d.relationship_edges[0],{confidence_status:'verified',verified_at:'2026-11-02',evidence_ids:['f001']}));
rejects('rejects missing periods on financial statements','FINANCIAL_PERIOD',d=>d.financials.push({financial_id:'fiscal-test',company_id:'c01',period_start:null,period_end:null,currency:'KRW',unit:'원',consolidation:'separate',revenue:0,operating_income:null,source_id:d.sources[0].source_id,original_report_locator:'TEST ONLY',checked_at:'2026-11-02'}));
test('validates leap days and partial dates',()=>{
  for(const x of ['2024-02-29','2026','2026-11']) assert.ok(validDate(x));
  for(const x of ['2025-02-29','2026-00','2026-13','2026-04-31']) assert.equal(validDate(x),false);
});
test('preserves optional PR3 metadata without promoting snippets or quantities',()=>{
  const raw=JSON.parse(JSON.stringify(source));
  raw.DEEP={sources:{deep_test:{t:'Test fixture',u:'https://example.com/',read:'검색 발췌 열람',pub:null,readAt:'2026-11-02'}},areas:{dep:{n:'Test',procs:['dep'],tx:['pre'],quantitative:[{value:10,vs:'unverified'}]}}};
  const d=normalize(raw);
  assert.deepEqual(validate(d),[]);
  assert.deepEqual(d.legacy_snapshot.DEEP,raw.DEEP);
  assert.equal(d.sources.at(-1).legacy_read_status,'검색 발췌 열람');
  assert.equal(d.sources.at(-1).retrieval_status,'not_rechecked');
  assert.equal(d.knowledge[0].verification_status,'unverified');
  assert.equal(d.claims.length,15);
});
test('failed build preserves last good output and check mode detects drift',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'silicon-library-data-test-'));
  try {
    const output=path.join(dir,'data.json');build({output});const good=fs.readFileSync(output,'utf8');
    assert.doesNotThrow(()=>build({output,check:true}));
    const html=fs.readFileSync(path.join(__dirname,'../silicon-library/index.html'),'utf8');
    const bad=html.replace('checked: "2026-11-02"','checked: "2099-01-01"');assert.notEqual(bad,html);
    const input=path.join(dir,'bad.html');fs.writeFileSync(input,bad);
    assert.throws(()=>build({input,output}),/FUTURE_DATE/);
    assert.equal(fs.readFileSync(output,'utf8'),good);
    fs.writeFileSync(output,'stale');assert.throws(()=>build({output,check:true}),/stale/);
    assert.equal(fs.readFileSync(output,'utf8'),'stale');
    assert.deepEqual(fs.readdirSync(dir).sort(),['bad.html','data.json']);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
