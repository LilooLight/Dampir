/* ═ Скиталец · app-c.js — кодекс, опыт, инструменты, профили, справка ═ */
'use strict';
window.__skit.push('app-c');

function catName(id){const c=CODEX_CATS.find(c=>c.id===id);return c?c.name:id}
function fmtBody(body){
 let out='',list=[];
 const flush=()=>{if(list.length){out+='<ul>'+list.map(li=>'<li>'+li+'</li>').join('')+'</ul>';list=[]}};
 body.forEach(l=>{if(l.startsWith('- '))list.push(esc(l.slice(2)));else{flush();out+='<p>'+esc(l)+'</p>'}});
 flush();return out;}
function markMatches(text,q){
 if(!q)return esc(text);
 const nT=norm(text),nq=norm(q);let out='',i=0,idx;
 while((idx=nT.indexOf(nq,i))>=0){
  out+=esc(text.slice(i,idx))+'<mark>'+esc(text.slice(idx,idx+q.length))+'</mark>';
  i=idx+q.length;if(out.length>400)break;}
 return out+esc(text.slice(i));}
function snippet(a,q){
 if(!q)return esc(a.summary||'');
 const hay=a.body.join(' § '),i=norm(hay).indexOf(norm(q));
 if(i<0)return esc(a.summary||'');
 const s=Math.max(0,i-55),e=Math.min(hay.length,i+95);
 return (s>0?'…':'')+esc(hay.slice(s,i))+'<mark>'+esc(hay.slice(i,i+q.length))+'</mark>'+esc(hay.slice(i+q.length,e))+(e<hay.length?'…':'');}
function renderCodexList(){
 const q=codexUI.q.trim();
 let items=q?CODEX.filter(a=>norm(a.title+' '+a.body.join(' ')).includes(norm(q)))
   :CODEX.filter(a=>codexUI.cat==='all'||a.cat===codexUI.cat);
 $('#codexList').innerHTML='<div class="codex-count">'+(q?'Найдено статей: '+items.length:'Статей: '+items.length)+'</div>'+
  (items.length?items.map(a=>'<article class="codex-row" data-act="codex-open" data-id="'+CODEX.indexOf(a)+'" tabindex="0" role="button">'+
   '<div class="cr-top"><span class="cr-title">'+markMatches(a.title,q)+'</span><span class="cr-cat">'+catName(a.cat)+'</span></div>'+
   '<p class="cr-sum">'+snippet(a,q)+'</p></article>').join('')
  :'<p class="empty">Кодекс молчит — такого в нём не записано.</p>');}
function renderCodex(){
 $('#view-codex').innerHTML='<div class="view-head"><h2>Кодекс Оживших кошмаров</h2><p>Правила — как заметки на полях дорожной книги.</p></div>'+
  '<div class="codex-head"><div class="searchbox">'+icon('search',16)+
  '<input type="text" id="codexSearch" placeholder="Поиск: десятки, провал, кровь, КУ…" value="'+esc(codexUI.q)+'"></div>'+
  '<div class="cat-filter" id="catFilter"><button class="cf-btn '+(codexUI.cat==='all'?'active':'')+'" data-act="cf-cat" data-cat="all">Все</button>'+
  CODEX_CATS.map(c=>'<button class="cf-btn '+(codexUI.cat===c.id?'active':'')+'" data-act="cf-cat" data-cat="'+c.id+'">'+c.name+'</button>').join('')+'</div></div><div id="codexList"></div>';
 renderCodexList();}
function openCodexArticle(id){
 const a=CODEX[+id];if(!a)return;
 openModal('<span class="cat-tag">'+catName(a.cat)+'</span>'+esc(a.title),fmtBody(a.body));}
function openPowerInfo(pid){
 const p=POWERS[pid];if(!p)return;
 openModal(esc(p.name),'<span class="cat-tag">проклятая сила</span><p>'+esc(p.flavor)+'</p>'+
  p.manif.map(([lv,n,d])=>'<div class="mrow"><span class="mlv">'+'◆'.repeat(lv)+'</span><span><b>'+esc(n)+'</b><p>'+esc(d)+'</p></span></div>').join(''));}

/* ── летопись опыта ── */
function calcCost(){
 const k=$('#calcType')?$('#calcType').value:'skill';
 const n=clamp(Math.round(+($('#calcTarget')?.value)||0),1,10);
 const pair=XP_MULT[k]||['Навык / Знание',4];
 return '<b>'+(pair[1]*n)+'</b> '+plural(pair[1]*n,'очко','очка','очков')+' опыта <span style="color:var(--faint)">('+pair[1]+' × '+n+')</span>';}
function renderXP(){
 if(editingPregen){
  $('#view-xp').innerHTML='<div class="view-head"><h2>Летопись опыта</h2></div><div class="panel"><p class="empty">Преген не ведёт летопись — передайте его игроку, и счёт откроется.</p><button class="btn" data-act="pg-done">в кабинет Сказителя</button></div>';
  return;}
 const c=char();if(!c)return;
 const recs=state.log.filter(r=>r.charId===c.id).sort((a,b)=>b.ts-a.ts);
 const gained=recs.filter(r=>r.type==='+').reduce((s,r)=>s+r.amount,0);
 const spent=recs.filter(r=>r.type==='-').reduce((s,r)=>s+r.amount,0);
 const form='<div class="btn-group" style="margin-bottom:16px">'+
  '<button class="bg-btn '+(xpUI.type==='gain'?'active':'')+'" data-act="xp-type" data-type="gain">Получено</button>'+
  '<button class="bg-btn '+(xpUI.type==='spend'?'active spend-act':'')+'" data-act="xp-type" data-type="spend">Потрачено</button></div>'+
  '<div class="form-row"><label for="xpAmount">Сколько очков</label><input type="number" id="xpAmount" min="1" max="999" value="'+esc(xpUI.amount)+'" placeholder="1–999"></div>'+
  '<div class="form-row"><label for="xpReason">За что / на что</label><input type="text" id="xpReason" maxlength="100" value="'+esc(xpUI.reason)+'" placeholder="за победу над волколаком, на обучение скрытности…"></div>'+
  '<button class="btn btn-primary" data-act="xp-commit">'+icon('quill',14)+' Внести в летопись</button>';
 const calcHTML='<div class="sec-title" style="margin-top:20px"><h2>'+icon('gem',14)+' Цены развития</h2><span class="ln"></span></div>'+
  '<div class="calc-row"><select id="calcType">'+Object.entries(XP_MULT).map(([k,v])=>'<option value="'+k+'">'+v[0]+'</option>').join('')+'</select>'+
  '<input type="number" id="calcTarget" min="1" max="10" value="3" style="width:64px" title="Приобретаемый уровень"><span class="roll-sub">уровень</span></div>'+
  '<div class="calc-out" id="calcOut">'+calcCost()+'</div>';
 const filt=recs.filter(r=>xpUI.filter==='all'||r.type===xpUI.filter);
 const log=filt.length?filt.map(r=>'<div class="log-row"><span class="log-date">'+fmtDate(r.ts)+'</span>'+
  '<span class="log-delta '+(r.type==='+'?'plus':'minus')+'">'+r.type+r.amount+'</span>'+
  '<span class="log-cat">'+esc(r.reason||'—')+'</span>'+
  '<button class="ibtn log-del" data-act="xp-del" data-id="'+r.id+'">'+icon('x',11)+'</button></div>').join('')
  :'<p class="empty">Летопись пуста. Сцены ждут.</p>';
 $('#view-xp').innerHTML='<div class="view-head"><h2>Летопись опыта</h2><p>'+esc(c.name)+' — что нажито странствием и во что обошлось.</p></div>'+
  '<div class="xp-grid"><div class="panel"><div class="xp-balance"><span class="xp-num">'+c.xp+'</span>'+
  '<span class="xp-cap">'+plural(c.xp,'очко','очка','очков')+' опыта</span></div>'+
  '<div class="xp-stats"><span>получено: <b>+'+gained+'</b></span><span>потрачено: <b>−'+spent+'</b></span></div>'+form+calcHTML+'</div>'+
  '<div class="panel"><div class="sec-title"><h2>'+icon('book',15)+' Хроника</h2><span class="ln"></span>'+
  '<span class="btn-group" style="margin-left:8px">'+
  '<button class="bg-btn" style="padding:4px 10px" data-act="xp-filter" data-f="all">все</button>'+
  '<button class="bg-btn" style="padding:4px 10px" data-act="xp-filter" data-f="+">+</button>'+
  '<button class="bg-btn" style="padding:4px 10px" data-act="xp-filter" data-f="-">−</button></span></div>'+log+'</div></div>';
 $$('#view-xp [data-f]').forEach(b=>b.classList.toggle('active',b.dataset.f===xpUI.filter));}
function commitXP(){
 const c=char();if(!c||editingPregen)return;
 const amount=Math.floor(+($('#xpAmount')?.value||0));
 if(!(amount>=1&&amount<=999)){toast('Сумма опыта — целое число от 1 до 999.',1);return}
 xpUI.reason=$('#xpReason').value.trim();
 const type=xpUI.type==='gain'?'+':'-';
 state.log.push({id:uid('xp'),charId:c.id,ts:Date.now(),type,amount,reason:xpUI.reason});
 c.xp+=type==='+'?amount:-amount;save();
 xpUI.reason='';xpUI.amount='';renderXP();
 toast(type+amount+' опыта внесено в летопись.');}

/* ── инструменты-калькуляторы ── */
function fieldHTML(f){
 const v=toolUI.vals;
 if(f.type==='num')return '<label class="mf">'+f.label+'<input type="number" data-tf="'+f.k+'" value="'+v[f.k]+'" min="'+(f.min??0)+'" max="'+(f.max??99)+'"></label>';
 if(f.type==='sel')return '<label class="mf">'+f.label+'<select data-tf="'+f.k+'">'+f.options.map(o=>{
  const val=(o.v!==undefined)?o.v:o,lab=(o.n!==undefined)?o.n:o;
  return '<option value="'+esc(val)+'" '+(String(v[f.k])===String(val)?'selected':'')+'>'+esc(lab)+'</option>'}).join('')+'</select></label>';
 if(f.type==='chk')return '<label class="mf" style="flex-direction:row;align-items:center;gap:7px"><input type="checkbox" data-tf="'+f.k+'" '+(v[f.k]?'checked':'')+'>'+f.label+'</label>';
 return '';}
function openTool(id){
 const T=TOOLS.find(t=>t.id===id);if(!T)return;
 toolUI={id,vals:Object.fromEntries(T.fields.map(f=>[f.k,f.def]))};
 openModal('<span class="cat-tag">инструмент</span>'+esc(T.title),
  '<div id="toolWrap"><div class="tool-fields">'+T.fields.map(fieldHTML).join('')+'</div><div class="tool-out" id="toolOut"></div></div>');
 renderToolOut(false);}
function readToolVals(){
 const T=TOOLS.find(t=>t.id===toolUI.id);
 const out={...toolUI.vals};
 $$('#toolWrap [data-tf]').forEach(el=>{
  const f=T.fields.find(x=>x.k===el.dataset.tf);if(!f)return;
  out[el.dataset.tf]=f.type==='chk'?el.checked:(f.type==='num'?(parseInt(el.value)||0):el.value);});
 toolUI.vals=out;return out;}
function renderToolOut(rnd){
 if(!toolUI)return;
 const T=TOOLS.find(t=>t.id===toolUI.id);
 const out=$('#toolOut');if(!out)return;
 out.innerHTML=T.compute(readToolVals(),rnd);}

/* ── профили игроков ── */
function renderProfSel(){
 const sel=$('#profSel');if(!sel)return;
 sel.innerHTML=state.profiles.map(p=>'<option value="'+p.id+'" '+(p.id===state.activeProfileId?'selected':'')+'>'+esc(p.name)+'</option>').join('');}
function switchProfile(pid){
 state.activeProfileId=pid;
 const pc=state.characters.filter(c=>(c.profileId||state.profiles[0].id)===pid);
 if(!pc.some(c=>c.id===state.activeCharId))state.activeCharId=pc[0]?pc[0].id:state.characters[0].id;
 editingPregen=null;save();hideGDrop();render();}
function openProfModal(){
 const rows=state.profiles.map(p=>'<div class="equip-row">'+
  '<input type="text" value="'+esc(p.name)+'" maxlength="30" data-pid="'+p.id+'" style="flex:1">'+
  '<button class="ibtn" data-act="prof-del" data-id="'+p.id+'" '+(state.profiles.length<=1?'disabled':'')+' title="Убрать профиль">'+icon('trash',12)+'</button></div>').join('');
 openModal('Игроки за столом',rows+
  '<div class="spec-add"><input type="text" id="newProfName" maxlength="30" placeholder="имя нового игрока…">'+
  '<button class="btn" data-act="prof-create">'+icon('plus',13)+' Добавить</button></div>'+
  '<p class="empty">Профиль — метка на этом устройстве: переключая, вы фильтруете список персонажей. Для игры на разных компьютерах передавайте свитки через экспорт и импорт.</p>');
 const inp=$('#newProfName');if(inp)inp.focus();}

/* ── справка ── */
function renderHelp(){
 const toc='<div class="help-toc">'+HELP.map(s=>'<button class="g-chip" data-act="help-jump" data-id="'+s.id+'">'+esc(s.title)+'</button>').join('')+'</div>';
 const secs=HELP.map(s=>{
  let body='';
  if(s.items)body=s.items.map(([t,d])=>'<div class="help-row"><b>'+esc(t)+'</b><p>'+d+'</p></div>').join('');
  if(s.keys)body='<table class="key-table">'+s.keys.map(([k,d])=>'<tr><td>'+k+'</td><td style="color:var(--dim)">'+d+'</td></tr>').join('')+'</table>';
  return '<div class="panel help-sec" id="help-'+s.id+'"><div class="sec-title"><h2>'+icon(s.icon,15)+' '+esc(s.title)+'</h2><span class="ln"></span></div>'+
   (s.intro?'<p class="help-intro">'+s.intro+'</p>':'')+body+'</div>'}).join('');
 $('#view-help').innerHTML='<div class="view-head"><h2>Как пользоваться летописью</h2><p>Памятка для новых странников: что где лежит и что нажимать.</p></div>'+toc+secs;}
/* === КОНЕЦ ФАЙЛА: app-c.js === */
