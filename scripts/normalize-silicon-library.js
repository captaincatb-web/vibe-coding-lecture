'use strict';
const crypto = require('crypto');
const copy = value => JSON.parse(JSON.stringify(value));
const status = {'검증':'verified', '부분 검증':'partial', '미검증':'unverified'};

// A read model, not a new source of verified facts. Never infer a legal entity,
// customer, facility, or product-specific evidence from a display-name match.
function normalize(input) {
  const d = copy(input); // VM values become ordinary JSON without mutating the source.
  const bookByName = new Map(d.B.map((b,i) => [b.n,{...b,index:i}]));
  const recordByName = new Map();
  d.ENT.list.forEach(e => [e.row,...(e.alias || [])].forEach(n => recordByName.set(n,e)));
  const companies = d.ENT.list.map(e => ({
    company_id:e.id, display_name:e.row, canonical_name_ko:null, canonical_name_en:null,
    aliases:e.alias || [], entity_kind:'unresolved_record', country:null,
    parent_company_id:null, dart_corp_code:null, stock_code:null, cik:null,
    website:null, listing_status:null, source_ids:bookByName.get(e.row).src,
    last_verified_at:null, visibility:'public', material_grade:bookByName.get(e.row).conf,
    classification_view:e.cat, secondary_classifications:e.sub, supply_chain_class:e.chain,
    supply_chain_basis:e.chainBasis, legacy_verification_status:e.vs,
    product_ids:e.products, process_ids:e.processes, areas:e.areas,
    legacy_row_index:bookByName.get(e.row).index
  }));
  const business_units = d.ENT.list.flatMap(e => (e.units || []).map(u => ({
    unit_id:u.id, company_id:e.id, display_name:u.name, legal_name:u.legal || null,
    legal_verified:u.legalVerified === true, product_ids:u.products,
    location_labels:u.regions || [], source_ids:[...new Set(d.ENT.facts.filter(f => f.unit===u.id).flatMap(f => f.src))],
    legacy:u
  })));
  const sources = Object.entries(d.S).map(([id,s]) => ({
    source_id:id, title:s[0], url:s[1], publisher:null, published_at:null,
    accessed_at:null, source_locator:null, license_reuse_status:'unknown',
    source_type:null, retrieval_status:'not_rechecked', read_status:'not_rechecked', legacy_read_status:null
  }));
  const processes = d.PROC.map(p => ({
    process_id:p.id, name_ko:p.n, name_en:p.en, stage:p.id==='infra'?'인프라':(['pkg','hbm','test'].includes(p.id)?'P&T':'FAB'),
    parent_process_id:null, purpose:p.why, mechanism:p.how, product_ids:p.tx,
    source_ids:[], legacy_reading_ids:p.sb, legacy:p
  }));
  const products = Object.entries(d.TX).map(([id,t]) => ({
    product_id:id, name:t.t, classification_original:null, classification_view:null,
    mapping_status:'review_required', process_ids:processes.filter(p => p.product_ids.includes(id)).map(p => p.process_id),
    source_ids:[], intentional_no_process:t.noProc || null, legacy:t
  }));
  const claims = d.ENT.facts.map(f => ({
    claim_id:f.id, company_id:f.ent, subject_id:f.unit || f.ent, subject_type:f.unit?'business_unit':'company',
    statement:f.text, predicate:null, object_id:null, object_type:null, value:null, unit:null,
    scope:f.scope, claim_type:f.kind, effective_date:f.asof || null,
    published_at:f.pub || null, source_ids:f.src, source_locator:null,
    checked_at:f.checked || null, verification_status:status[f.vs],
    provenance:'legacy_fact', limitations:['Imported historical status; not reverified by conversion.'], legacy:f
  }));
  const company_products = d.ENT.list.flatMap(e => e.products.map(k => ({
    company_id:e.id, product_id:k, relationship_type:'legacy_catalog_link',
    evidence_ids:[], verification_status:'unverified'
  })));
  const relationship_edges = products.flatMap(p => p.process_ids.map(id => ({
    edge_id:`product:${p.product_id}:process:${id}`, from_id:p.product_id, to_id:id, from_type:'product', to_type:'process',
    relation_type:'used_in_process', evidence_ids:[], verified_at:null,
    confidence_status:'unverified'
  })));
  const knowledge = [];
  // PR #3's optional export is retained in full. This does not promote its
  // snippets, qualitative principles, or legacy quantitative claims to verified.
  if (d.DEEP) {
    for (const [id,s] of Object.entries(d.DEEP.sources || {})) {
      if (sources.some(x => x.source_id===id)) throw new Error(`Deep source ID collision: ${id}`);
      sources.push({source_id:id, title:s.t, url:s.u, publisher:null, published_at:s.pub || null,
        accessed_at:s.readAt || null, source_locator:s.checked || null,
        license_reuse_status:'unknown', source_type:s.type || null,
        retrieval_status:'not_rechecked', read_status:'not_rechecked', legacy_read_status:s.read || null});
    }
    for (const [id,a] of Object.entries(d.DEEP.areas || {})) knowledge.push({
      knowledge_id:`deep:${id}`, title:a.n, process_ids:a.procs || [], product_ids:a.tx || [],
      source_ids:[], verification_status:'unverified', legacy:a
    });
  }
  return {
    schema_version:2,
    metadata:{legacy_digest:crypto.createHash('sha256').update(JSON.stringify(d)).digest('hex'),
      counting_basis:'Company records, not legal entities. Facilities and financials are not inferred.',
      deep_content_present:!!d.DEEP},
    books:d.B.map((b,i) => ({route:`#b${i}`, company_id:recordByName.get(b.n).id,
      favorite_key:b.n, canonical_route:`#b${bookByName.get(recordByName.get(b.n).row).index}`,
      is_alias:!!b.ref})),
    companies,business_units,facilities:[],processes,products,company_products,claims,sources,
    financials:[],relationship_edges,knowledge,legacy_snapshot:d
  };
}
module.exports = {normalize};
