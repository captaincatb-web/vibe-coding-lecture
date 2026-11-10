#!/usr/bin/env node
'use strict';
// Read-only inventory. Counts and heuristics are not source verification.
const {loadData} = require('./load-silicon-library');
function audit(d) {
  const text = value => JSON.stringify(value);
  const duplicate = values => [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];
  const firms = keys => d.ENT.list.filter(e => e.products.some(k => keys.includes(k))).map(e => e.id);
  const companies = d.ENT.list.map(e => {
    const b = d.B.find(b => b.n === e.row);
    const facts = d.ENT.facts.filter(f => f.ent === e.id);
    return {id:e.id, name:e.row, characters:text(b).length, products:e.products,
      sources:b.src, facts:facts.length, verification: facts.length ? 'fact-table-only' : 'not-checked',
      quantitativeTextNeedsReview:/\d[\d,.]*\s*(억|조|%|톤|명|단)/.test(text(b)),
      missingSections:['one','facts','tech','mkt','watch','src'].filter(k=>!b[k] || b[k].length===0)};
  });
  const processes = d.PROC.map(p => ({id:p.id, name:p.n, characters:text(p).length,
    products:p.tx, companies:firms(p.tx), emptyProducts:p.tx.length===0,
    missingSections:['s','why','how','eq','mat','part','iss','fut','sb'].filter(k=>!p[k] || p[k].length===0)}));
  const technologies = Object.entries(d.TX).map(([id,t]) => ({id, name:t.t,
    characters:text(t).length, companies:firms([id]),
    processes:d.PROC.filter(p=>p.tx.includes(id)).map(p=>p.id),
    intentionalNoProcess:t.noProc || null}));
  return {scope:'Source inventory; entity records are not legal-entity counts. No external URL checks.',
    counts:{books:d.B.length, companies:companies.length, processes:processes.length, technologies:technologies.length, sources:Object.keys(d.S).length},
    duplicateCompanyIds:duplicate(companies.map(c=>c.id)),
    duplicateProcessIds:duplicate(processes.map(p=>p.id)),
    companies,processes,technologies};
}
module.exports = {audit};
if(require.main===module) console.log(JSON.stringify(audit(loadData(process.env.SL_FILE)),null,2));
