#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const {loadData}=require('./load-silicon-library');
const {normalize}=require('./normalize-silicon-library');
const {validateLibrary}=require('./validate-normalized-library');
const DEFAULT=path.join(__dirname,'../silicon-library/data/normalized-library.json');
function serialize(data) {
  const result=normalize(data), errors=validateLibrary(result);
  if(errors.length) throw new Error(JSON.stringify(errors,null,2));
  return JSON.stringify(result,null,2)+'\n';
}
function build({input,output=DEFAULT,check=false}={}) {
  const body=serialize(loadData(input));
  if(check) {
    if(!fs.existsSync(output) || fs.readFileSync(output,'utf8')!==body) throw new Error('Normalized artifact is missing or stale; run npm run build:data');
  } else {
    // Validate before touching the output, then atomically replace it. Failed
    // conversion leaves the previous good artifact available.
    fs.mkdirSync(path.dirname(output),{recursive:true});
    const temp=output+'.'+process.pid+'.tmp';
    try {fs.writeFileSync(temp,body,{flag:'wx'});fs.renameSync(temp,output);}
    finally {if(fs.existsSync(temp)) fs.unlinkSync(temp);}
  }
  return body;
}
module.exports={build,serialize};
if(require.main===module) {
  try {
    const args=process.argv.slice(2);
    if(args.some(a=>a!=='--check')) throw new Error('Usage: node scripts/build-normalized-library.js [--check]');
    build({check:args.includes('--check')});
    console.log(args.includes('--check')?'PASS normalized artifact is current':'Built normalized-library.json');
  }catch(e){console.error(e.message);process.exitCode=1;}
}
