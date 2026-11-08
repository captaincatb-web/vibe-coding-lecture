(function () {
  'use strict';
  var core=window.SiliconExplorerCore, indexPromise, mounted;
  var dataURL=new URL('../data/explorer-index.json',document.currentScript.src);
  var LABEL={company:'기업',product:'제품 기술',process:'공정',knowledge:'심화 해설'};
  function el(tag,text,cls) {
    var node=document.createElement(tag);
    if(text!==undefined) node.textContent=text;
    if(cls) node.className=cls;
    return node;
  }
  function load() {
    if(!indexPromise) indexPromise=fetch(dataURL,{credentials:'same-origin'}).then(function(r){
      if(!r.ok) throw new Error('Index unavailable');
      return r.json();
    }).then(function(d){if(core.validateIndex(d).length) throw new Error('Invalid index');return d;}).catch(function(e){indexPromise=null;throw e;});
    return indexPromise;
  }
  function mount(root) {
    mounted=root;
    root.replaceChildren(el('p','탐색 자료를 불러오는 중입니다…','note'));
    root.setAttribute('aria-busy','true');
    load().then(function(index){
      if(root!==mounted || !root.isConnected) return;
      root.setAttribute('aria-busy','false');render(root,index);
    }).catch(function(){
      if(!root.isConnected) return;
      root.setAttribute('aria-busy','false');
      var p=el('p','탐색 자료를 불러오지 못했습니다. 기존 책장과 기술 백과는 계속 이용할 수 있습니다.','note');
      p.setAttribute('role','alert');
      var retry=el('button','다시 시도');retry.type='button';retry.onclick=function(){mount(root);};
      var link=el('a','기술 백과 열기');link.href='#tech';root.replaceChildren(p,retry,link);
    });
  }
  function render(root,index) {
    var state=core.readState(location.hash), sources=new Map(index.sources.map(function(s){return [s.source_id,s];}));
    function saved(name){try{var keys=JSON.parse(localStorage.getItem('siliconLibrary:'+name+':v1')||'[]');return Array.isArray(keys)?keys.filter(function(k){return typeof k==='string'&&index.records.some(function(r){return r.key===k;});}).slice(0,100):[];}catch(e){return [];}}
    function save(name,keys){try{localStorage.setItem('siliconLibrary:'+name+':v1',JSON.stringify(keys));}catch(e){}}
    root.replaceChildren();
    var intro=el('p','기업·제품·공정을 함께 찾고, 연결을 따라 근거 자료를 확인하세요. 검색에는 설명과 연결 항목도 포함됩니다.','lede');root.append(intro);
    var note=el('p','연결선은 서재의 품목·공정 분류입니다. 실제 납품이나 고객 관계를 뜻하지 않습니다. 기존 대조 기록과 이번 원문 재확인은 구분합니다.','note');root.append(note);
    var form=el('form',undefined,'explorer-tools');form.setAttribute('role','search');
    var queryLabel=el('label','검색어'), query=el('input');query.id='explorer-query';query.type='search';query.maxLength=200;query.value=state.query;query.placeholder='ALD · 원자층 증착 · HBM · 솔브레인';queryLabel.append(query);
    var typeLabel=el('label','결과 종류'), type=el('select');type.id='explorer-type';
    var all=el('option','전체');all.value='all';type.append(all);
    Object.keys(LABEL).forEach(function(k){var op=el('option',LABEL[k]);op.value=k;type.append(op);});
    type.value=state.type;typeLabel.append(type);form.append(queryLabel,typeLabel);root.append(form);
    var savedPanel=el('details',undefined,'explorer-saved');savedPanel.append(el('summary','탐색 책갈피와 최근 본 항목'));var savedBody=el('div');savedPanel.append(savedBody);root.append(savedPanel);
    var status=el('p',undefined,'cap');status.id='explorer-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
    var layout=el('div',undefined,'explorer-layout'), results=el('ul',undefined,'explorer-results'), detail=el('section',undefined,'explorer-detail');
    results.setAttribute('aria-label','통합 검색 결과');detail.setAttribute('aria-label','선택 항목과 연결');layout.append(results,detail);root.append(layout);
    function updateURL(push) {history[push?'pushState':'replaceState'](null,'',core.stateHash(state));}
    function choose(key) {state.item=key;save('recent',[key].concat(saved('recent').filter(function(k){return k!==key;})).slice(0,12));updateURL(true);drawDetails(true);drawResults();drawSaved();}
    function drawSaved(){savedBody.replaceChildren();[['bookmarks','탐색 책갈피'],['recent','최근 본 항목']].forEach(function(pair){savedBody.append(el('h4',pair[1]));var keys=saved(pair[0]);if(!keys.length)savedBody.append(el('p','아직 저장된 항목이 없습니다.','empty'));keys.forEach(function(k){var r=index.records.find(function(r){return r.key===k;});savedBody.append(recordButton(r));});});}
    function recordButton(record) {
      var b=el('button');b.type='button';b.dataset.key=record.key;
      b.append(el('small',LABEL[record.type]),el('span',record.title));
      if(record.key===state.item) b.setAttribute('aria-current','true');
      b.onclick=function(){choose(record.key);};return b;
    }
    function drawResults() {
      var found=core.search(index,state.query,state.type);results.replaceChildren();
      status.textContent='검색 결과 '+found.length+'건'+(found.length>100?' · 처음 100건 표시':'');
      found.slice(0,100).forEach(function(r){var li=el('li');li.append(recordButton(r));results.append(li);});
      if(!found.length) results.append(el('li','검색 결과가 없습니다. 다른 별칭을 입력하거나 결과 종류를 전체로 바꿔 보세요.','empty'));
    }
    function drawDetails(focus) {
      detail.replaceChildren();
      var record=index.records.find(function(r){return r.key===state.item;});
      if(!record) {detail.append(el('p',state.item?'공유된 항목을 찾지 못했습니다. 검색 결과에서 다시 선택해 주세요.':'검색 결과를 선택하면 관련 기업·제품·공정과 출처가 표시됩니다.','empty'));return;}
      var heading=el('h2',record.title);heading.tabIndex=-1;detail.append(el('small',LABEL[record.type]),heading,el('p',record.summary));
      var actions=el('div',undefined,'explorer-actions'),full=el('a','기존 상세 페이지 열기');full.href=record.route;full.className='kchip';actions.append(full);
      var bookmark=el('button'),bookmarked=saved('bookmarks').includes(record.key);bookmark.type='button';bookmark.id='explorer-bookmark';bookmark.textContent=bookmarked?'탐색 책갈피 해제':'탐색 책갈피 저장';bookmark.setAttribute('aria-pressed',String(bookmarked));
      bookmark.onclick=function(){var keys=saved('bookmarks');if(keys.includes(record.key))keys=keys.filter(function(k){return k!==record.key;});else keys.unshift(record.key);save('bookmarks',keys.slice(0,100));drawDetails(false);drawSaved();detail.querySelector('#explorer-bookmark').focus();};actions.append(bookmark);
      var share=el('button','공유 주소 복사');share.type='button';share.onclick=async function(){try{await navigator.clipboard.writeText(location.href);status.textContent='현재 검색과 선택 항목의 공유 주소를 복사했습니다.';}catch(e){status.textContent='주소창의 URL을 복사하면 현재 검색과 선택 항목을 공유할 수 있습니다.';}};actions.append(share);
      var print=el('button','선택 항목 인쇄');print.type='button';print.onclick=function(){window.print();};actions.append(print);detail.append(actions);
      detail.append(el('h3','연결된 항목'));
      var neighbors=core.related(index,record.key), groups=el('div',undefined,'explorer-relations');
      Object.keys(LABEL).forEach(function(kind){
        var rows=neighbors.filter(function(r){return r.type===kind;});if(!rows.length) return;
        var group=el('section');group.append(el('h4',LABEL[kind]+' '+rows.length+'건'));
        var list=el('ul');rows.forEach(function(r){var li=el('li');li.append(recordButton(r));list.append(li);});group.append(list);groups.append(group);
      });
      if(!neighbors.length) groups.append(el('p','아직 연결된 항목이 없습니다. 확인된 근거를 확보한 뒤 연결합니다.','empty'));
      detail.append(groups);
      detail.append(el('h3','기존 사실 대조 기록'));
      var claims=index.claims.filter(function(c){return record.claim_ids.includes(c.claim_id);});
      if(!claims.length) detail.append(el('p','이 항목에 직접 연결된 사실 대조 기록은 없습니다. 기업 자료 확보 등급은 개별 주장의 검증 상태와 다릅니다.','empty'));
      claims.forEach(function(c){
        var box=el('div',undefined,'explorer-claim');var labels={verified:'검증',partial:'부분 검증',unverified:'미검증'};
        box.append(el('strong','기존 기록: '+labels[c.verification_status]+' · '+c.scope+' · '+(c.checked_at || '확인일 미기재')),el('p',c.statement));
        c.source_ids.forEach(function(id){var s=sources.get(id);if(s) box.append(sourceLink(s));});detail.append(box);
      });
      detail.append(el('h3','참고자료'));
      detail.append(el('p','참고자료 등록은 이 항목의 모든 문장을 검증했다는 뜻이 아닙니다. 심화 해설은 기존 상세 페이지에서 문장별 근거와 열람 상태를 확인하세요.','cap'));
      if(!record.source_ids.length) detail.append(el('p','직접 연결된 참고자료가 없습니다. 연결된 심화 해설이나 기업 항목에서 자료 범위를 확인하세요.','empty'));
      var sourceList=el('ul',undefined,'explorer-sources');
      record.source_ids.forEach(function(id){var s=sources.get(id);if(!s) return;var li=el('li');li.append(sourceLink(s),el('small','이번 원문 재확인 전'+(s.legacy_read_status?' · 기존 '+s.legacy_read_status:'')));sourceList.append(li);});detail.append(sourceList);
      if(focus) heading.focus({preventScroll:true});
    }
    function sourceLink(s) {var a=el('a',s.title+' (새 탭)');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';return a;}
    query.oninput=function(){state.query=query.value;updateURL(false);drawResults();};
    type.onchange=function(){state.type=type.value;updateURL(false);drawResults();};
    form.onsubmit=function(e){e.preventDefault();var first=results.querySelector('button');if(first) first.focus();};
    drawResults();drawDetails(false);drawSaved();
  }
  window.SiliconExplorer={mount:mount};
  var root=document.getElementById('explorer-root');if(root) mount(root);
})();
