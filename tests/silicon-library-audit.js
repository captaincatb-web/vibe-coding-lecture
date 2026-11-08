'use strict';
const assert = require('assert/strict');
const {loadData} = require('../scripts/load-silicon-library');
const {audit} = require('../scripts/audit-silicon-library-v2');
const d=loadData();
const report=audit(d);
assert.deepEqual(report.counts,{books:46,companies:45,processes:13,technologies:31,sources:188});
assert.deepEqual(report.duplicateCompanyIds,[]);
assert.equal(report.processes.find(p=>p.id==='metro').companies.length,0);
// The audit must detect changed relationships rather than repeat hardcoded counts.
const clone=JSON.parse(JSON.stringify(d));
clone.PROC.find(p=>p.id==='metro').tx.push(clone.ENT.list[0].products[0]);
assert.ok(audit(clone).processes.find(p=>p.id==='metro').companies.length>0);
clone.ENT.list.push(clone.ENT.list[0]);
assert.ok(audit(clone).duplicateCompanyIds.length>0);
console.log('PASS audit counts, empty coverage, relationship mutation, duplicate mutation (5 checks)');
