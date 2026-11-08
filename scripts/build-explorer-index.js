#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const {validateLibrary}=require('./validate-normalized-library');
const core=require('../silicon-library/src/explorer-core');
const DEFAULT=path.join(__dirname,'../silicon-library/data/explorer-index.json');
function buildIndex({data,output=DEFAULT,check=false}={}) {
  data=data || JSON.parse(fs.readFileSync(path.join(__dirname,'../silicon-library/data/normalized-library.json'),'utf8'));
  const errors=validateLibrary(data);
  if(errors.length) throw new Error(JSON.stringify(errors));
  const index=core.createIndex(data), issues=core.validateIndex(index);
  if(issues.length) throw new Error(issues.join('; '));
  const body=JSON.stringify(index)+'\n';
  if(check) {
    if(!fs.existsSync(output) || fs.readFileSync(output,'utf8')!==body) throw new Error('Explorer index is stale; run npm run build');
  } else {
    const tmp=output+'.'+process.pid+'.tmp';
    try {fs.writeFileSync(tmp,body,{flag:'wx'});fs.renameSync(tmp,output);}
    finally {if(fs.existsSync(tmp)) fs.unlinkSync(tmp);}
  }
  return index;
}
module.exports={buildIndex};
if(require.main===module) {
  try {
    if(process.argv.slice(2).some(a=>a!=='--check')) throw new Error('Usage: node scripts/build-explorer-index.js [--check]');
    const index=buildIndex({check:process.argv.includes('--check')});
    console.log('PASS explorer index: '+index.records.length+' records');
  } catch(e) {console.error(e.message);process.exitCode=1;}
}
