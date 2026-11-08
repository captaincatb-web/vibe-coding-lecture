'use strict';
const Ajv = require('ajv');
const {isDeepStrictEqual} = require('util');
const schema = require('../silicon-library/data/library.schema.json');
const {normalize} = require('./normalize-silicon-library');
const ajv = new Ajv({allErrors:true, allowUnionTypes:true});
function validDate(value) {
  if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(value)) return false;
  const [y,m=1,d=1] = value.split('-').map(Number);
  return y>=1000 && m>=1 && m<=12 && d>=1 && d<=new Date(Date.UTC(y,m,0)).getUTCDate();
}
ajv.addFormat('partial-date',validDate);
const validateSchema = ajv.compile(schema);
const keys = {books:'route', companies:'company_id', business_units:'unit_id', facilities:'facility_id',
  processes:'process_id', products:'product_id', claims:'claim_id', sources:'source_id',
  financials:'financial_id', relationship_edges:'edge_id', knowledge:'knowledge_id'};

function validateLibrary(data,{today=new Date().toISOString().slice(0,10)}={}) {
  const errors=[];
  const add=(code,path,message)=>errors.push({code,path,message});
  if (!validateSchema(data)) return validateSchema.errors.map(e=>({code:'SCHEMA',path:e.instancePath,message:e.message}));
  const maps={};
  for (const [collection,key] of Object.entries(keys)) {
    maps[collection]=new Map();
    data[collection].forEach((r,i)=>{
      if(maps[collection].has(r[key])) add('DUPLICATE_ID',`${collection}/${i}`,r[key]);
      maps[collection].set(r[key],r);
    });
  }
  const has=(collection,id,path)=>{
    if(!maps[collection].has(id)) add('ORPHAN_REFERENCE',path,`${collection}: ${id}`);
  };
  const refs=(collection,ids,path)=>ids.forEach(id=>has(collection,id,path));
  const dateCheck=(value,path)=>{if(value && value>today) add('FUTURE_DATE',path,value);};
  for(const name of ['companies','business_units','facilities','processes','products','claims','knowledge']) {
    data[name].forEach((r,i)=>refs('sources',r.source_ids,`${name}/${i}/source_ids`));
  }
  data.companies.forEach((r,i)=>{
    refs('products',r.product_ids,`companies/${i}/product_ids`);
    refs('processes',r.process_ids,`companies/${i}/process_ids`);
    if(r.parent_company_id) has('companies',r.parent_company_id,`companies/${i}/parent_company_id`);
    dateCheck(r.last_verified_at,`companies/${i}/last_verified_at`);
  });
  data.business_units.forEach((r,i)=>{
    has('companies',r.company_id,`business_units/${i}/company_id`);
    refs('products',r.product_ids,`business_units/${i}/product_ids`);
  });
  data.facilities.forEach((r,i)=>has('companies',r.company_id,`facilities/${i}`));
  data.books.forEach((r,i)=>{
    has('companies',r.company_id,`books/${i}/company_id`);
    has('books',r.canonical_route,`books/${i}/canonical_route`);
    const canonical=maps.books.get(r.canonical_route);
    if(canonical && (canonical.is_alias || canonical.company_id!==r.company_id)) add('BOOK_ALIAS',`books/${i}`,'Canonical route must point to the same record, not another alias');
  });
  for(const [name,other,field] of [['processes','products','product_ids'],['products','processes','process_ids']]) {
    data[name].forEach((r,i)=>refs(other,r[field],`${name}/${i}/${field}`));
  }
  data.processes.forEach((r,i)=>{
    if(r.parent_process_id) has('processes',r.parent_process_id,`processes/${i}/parent_process_id`);
    r.product_ids.forEach(id=>{
      if(maps.products.has(id) && !maps.products.get(id).process_ids.includes(r.process_id)) add('BIDIRECTIONAL_LINK',`processes/${i}`,id);
    });
  });
  data.products.forEach((r,i)=>r.process_ids.forEach(id=>{
    if(maps.processes.has(id) && !maps.processes.get(id).product_ids.includes(r.product_id)) add('BIDIRECTIONAL_LINK',`products/${i}`,id);
  }));
  data.claims.forEach((r,i)=>{
    const p=`claims/${i}`;
    const collections={company:'companies',business_unit:'business_units',product:'products',process:'processes'};
    if(r.company_id) has('companies',r.company_id,p);
    has(collections[r.subject_type],r.subject_id,p+'/subject_id');
    const owner=maps.business_units.get(r.subject_id);
    if((r.subject_type==='company' && r.subject_id!==r.company_id) || (r.subject_type==='business_unit' && owner?.company_id!==r.company_id) || (['product','process'].includes(r.subject_type) && r.company_id!==null)) add('CLAIM_SCOPE',p,'Subject and company scope disagree');
    if((r.object_id===null)!==(r.object_type===null)) add('CLAIM_SCOPE',p,'Object ID and type must be supplied together');
    if(r.object_id && r.object_type) has(collections[r.object_type],r.object_id,p+'/object_id');
    if(r.provenance==='legacy_fact' && !(data.legacy_snapshot.ENT.facts || []).some(f=>f.id===r.claim_id)) add('CLAIM_PROVENANCE',p,'Unknown legacy fact ID');
    [r.published_at,r.checked_at].forEach(v=>dateCheck(v,p));
    if(r.published_at && r.checked_at && r.published_at>r.checked_at) add('DATE_ORDER',p,'Publication follows verification');
    if(r.claim_type!=='편집 분석' && !(r.claim_type==='확인 불가' && r.verification_status==='unverified') && r.source_ids.length===0) add('CLAIM_SOURCE',p,'Non-editorial claim needs a source');
    if(r.provenance==='new' && r.verification_status==='verified' && (!r.source_ids.length || !r.checked_at || !r.source_locator)) add('CLAIM_EVIDENCE',p,'New verified claim needs sources, date, and original locator');
    if(r.provenance==='new' && r.verification_status==='verified') r.source_ids.forEach(id=>{
      const s=maps.sources.get(id);
      if(s && (s.retrieval_status!=='accessible' || !['full_text','partial_text'].includes(s.read_status) || !s.accessed_at || !s.source_locator || (r.checked_at && s.accessed_at>r.checked_at))) add('SOURCE_NOT_READ',p,'Verified claims require dated original-text access, not a snippet or unchecked source');
    });
    if(typeof r.value==='number' && (!r.unit || !r.effective_date)) add('QUANTITATIVE_SCOPE',p,'Numeric value needs unit and period');
  });
  const cpKeys=new Set();
  data.company_products.forEach((r,i)=>{
    const p=`company_products/${i}`, key=`${r.company_id}|${r.product_id}|${r.relationship_type}`;
    if(cpKeys.has(key)) add('DUPLICATE_RELATION',p,key);
    cpKeys.add(key);
    has('companies',r.company_id,p); has('products',r.product_id,p); refs('claims',r.evidence_ids,p);
    if(r.relationship_type==='legacy_catalog_link' && (r.verification_status!=='unverified' || r.evidence_ids.length)) add('LEGACY_RELATION_PROMOTED',p,'A catalog link is not verified manufacturing or customer evidence');
    if(r.relationship_type!=='legacy_catalog_link') {
      if(!r.evidence_ids.length) add('RELATION_EVIDENCE',p,'A specific business relationship requires claim evidence');
      r.evidence_ids.forEach(id=>{
        const c=maps.claims.get(id);
        if(c && (c.company_id!==r.company_id || c.object_type!=='product' || c.object_id!==r.product_id || c.predicate!==r.relationship_type || (r.verification_status==='verified' && c.verification_status!=='verified'))) add('RELATION_EVIDENCE',p,'Evidence does not support this company, product, relationship, or status');
      });
    }
  });
  data.relationship_edges.forEach((r,i)=>{
    const p=`relationship_edges/${i}`;
    has('products',r.from_id,p); has('processes',r.to_id,p); refs('claims',r.evidence_ids,p);
    dateCheck(r.verified_at,p);
    const product=maps.products.get(r.from_id);
    if(product && !product.process_ids.includes(r.to_id)) add('EDGE_MAPPING',p,'Edge absent from product/process relation');
    if(r.confidence_status==='verified') {
      if(!r.verified_at || !r.evidence_ids.length) add('EDGE_EVIDENCE',p,'Verified edge needs dated evidence');
      r.evidence_ids.forEach(id=>{
        const c=maps.claims.get(id);
        if(!c || c.verification_status!=='verified' || c.subject_type!=='product' || c.subject_id!==r.from_id || c.object_type!=='process' || c.object_id!==r.to_id || c.predicate!==r.relation_type) add('EDGE_EVIDENCE',p,'Evidence does not support this typed product/process edge');
      });
    }
  });
  data.knowledge.forEach((r,i)=>{refs('processes',r.process_ids,`knowledge/${i}`);refs('products',r.product_ids,`knowledge/${i}`);});
  data.sources.forEach((r,i)=>{
    [r.published_at,r.accessed_at].forEach(v=>dateCheck(v,`sources/${i}`));
    try {const u=new URL(r.url);if(u.username || u.password) add('CREDENTIAL_URL',`sources/${i}`,'Source URLs must not embed credentials');} catch {add('SOURCE_URL',`sources/${i}`,'Invalid URL');}
  });
  data.financials.forEach((r,i)=>{
    const p=`financials/${i}`;
    has('companies',r.company_id,p);has('sources',r.source_id,p);
    if(!r.period_start || !r.period_end || !r.checked_at) add('FINANCIAL_PERIOD',p,'Statement dates are required');
    if(r.period_start && r.period_end && r.period_start>r.period_end) add('DATE_ORDER',p,'Financial period reversed');
    [r.period_start,r.period_end,r.checked_at].forEach(v=>dateCheck(v,p));
  });
  for(const [name,key,parent] of [['companies','company_id','parent_company_id'],['processes','process_id','parent_process_id']]) {
    data[name].forEach(r=>{
      const seen=new Set();let cursor=r;
      while(cursor) {
        if(seen.has(cursor[key])) {add('PARENT_CYCLE',name+'/'+r[key],'Parent hierarchy must be acyclic');break;}
        seen.add(cursor[key]);cursor=maps[name].get(cursor[parent]);
      }
    });
  }
  // Protect imported metadata, row/favorite keys, source text, and optional DEEP
  // against changes made only in the generated read model.
  try {
    const expected=normalize(data.legacy_snapshot);
    if(expected.metadata.legacy_digest!==data.metadata.legacy_digest || expected.metadata.deep_content_present!==data.metadata.deep_content_present) add('LEGACY_DIGEST','metadata','Legacy payload changed');
    for(const name of [...Object.keys(keys),'company_products']) {
      if(!expected[name]) continue;
      const key=keys[name];
      expected[name].forEach((r,i)=>{
        const actual=name==='company_products' ? data[name].find(x=>x.company_id===r.company_id && x.product_id===r.product_id && x.relationship_type===r.relationship_type) : maps[name].get(r[key]);
        if(!isDeepStrictEqual(actual,r)) add('LEGACY_CHANGED',`${name}/${i}`,'Imported legacy data or historical verification changed');
      });
    }
  } catch(e) {add('LEGACY_PAYLOAD','legacy_snapshot',e.message);}
  return errors;
}
module.exports={validateLibrary,validDate};
