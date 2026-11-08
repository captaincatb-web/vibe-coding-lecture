'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const c=require('../silicon-library/src/lab-core');
test('Rayleigh result follows wavelength, NA and k1 with explicit units',()=>{
  assert.equal(c.lithography(193,1,0.5).cd_nm,96.5);
  assert.equal(c.lithography(193,0.5,0.5).cd_nm,193);
  assert.equal(c.lithography(193,1,0.25).cd_nm,48.25);
  assert.equal(c.lithography(193,1.35,0.5).immersion_assumption,true);
});
test('EUV NA and invalid optical inputs are bounded',()=>{
  assert.throws(()=>c.lithography(13.5,0.6,0.5),RangeError);
  assert.throws(()=>c.lithography(200,0.5,0.5),RangeError);
  for(const x of [NaN,Infinity,-1,null,'',{},true])assert.throws(()=>c.lithography(193,x,0.5),RangeError);
});
test('ALD uses assumed GPC and handles zero cycles without inventing a monolayer',()=>{
  assert.equal(c.ald(50,0.1).thickness_nm,5);
  assert.equal(c.ald(100,0.1).thickness_nm,10);
  assert.equal(c.ald(0,0.1).thickness_nm,0);
  assert.equal(c.ald(300,0.2).thickness_nm,60);
});
test('ALD rejects fractional cycles, out-of-range GPC and invalid values',()=>{
  for(const pair of [[1.5,0.1],[301,0.1],[-1,0.1],[20,0],[20,NaN]])assert.throws(()=>c.ald(...pair),RangeError);
});
test('normalized Preston removal has the correct relative scaling',()=>{
  assert.equal(c.cmp(1,1,1,1).relative_removal,1);
  assert.equal(c.cmp(2,1,1,1).relative_removal,2);
  assert.equal(c.cmp(2,2,2,1).relative_removal,8);
  assert.equal(c.cmp(0,1,1,1).relative_removal,0);
  assert.equal(c.cmp(3,3,3,2).relative_removal,54);
});
test('CMP rejects invalid pressure, speed, time and coefficient',()=>{
  for(const values of [[-1,1,1,1],[1,4,1,1],[1,1,NaN,1],[1,1,1,0]])assert.throws(()=>c.cmp(...values),RangeError);
});
test('sequence models a simple transfer loop without mutating input',()=>{
  const steps=['wafer','dep','photo','etch','clean','metro'];const before=steps.slice();const r=c.sequence(steps);
  assert.deepEqual(steps,before);assert.equal(r.last,'metro');assert.equal(r.patterned,true);assert.ok(r.next.includes('dep'));
  assert.equal(c.sequence(['wafer']).has_film,false);
});
test('sequence rejects unsupported orders and length',()=>{
  for(const steps of [[],['etch'],['wafer','etch'],['wafer','dep','photo','metro'],['wafer','unknown'],['wafer',...Array(25).fill('dep')]])assert.throws(()=>c.sequence(steps),RangeError);
});
test('every lab has equation, units, assumptions, limitations, reference and quiz',()=>{
  assert.equal(Object.keys(c.models).length,5);
  for(const m of Object.values(c.models)){for(const k of ['formula','unit','assumptions','limits','reference'])assert.ok(m[k].length>10);assert.ok(m.reference.startsWith('https://'));assert.ok(m.quiz.answer>=0&&m.quiz.answer<m.quiz.options.length);}
  assert.match(c.models.ald.limits,/항상 원자 1층/);assert.match(c.models.cmp.limits,/양산 제거량을 예측하지 않습니다/);
});
test('glossary entries resolve to existing public routes',()=>{
  const d=require('../scripts/load-silicon-library').loadData();
  for(const r of c.glossary){assert.equal(r.length,4);assert.ok(d.PROC.some(p=>r[3]==='#t-'+p.id));}
});
