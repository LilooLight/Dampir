/* ═ Скиталец · app-d.js — кабинет Сказителя: прегены, твари, локации, импорт/экспорт ═ */
'use strict';
window.__skit.push('app-d');

/* ── прегены ── */
function applyViceStart(c,viceId,quiet){
 if(!viceId||!VICES[viceId])return 0;
 let added=0;
 VICES[viceId].start.forEach(pid=>{
  if(!c.cursedPowers.some(p=>p.powerId===pid)){
   c.cursedPowers.push({id:uid('pw'),powerId:pid,level:1,manifestations:[]});added++;}});
 if(added&&!quiet)toast('Начальные силы порока добавлены (уровень 1 — распределите пункты по правилам вида).');
 return added;}
function distBlock(keys){
 const ids=shuffle([...keys]),map={};
 const two=Math.random()<.5?1:0;
 const ones=two?2:5;
 for(let i=0;i<ones;i++)map[ids[i]]=1;
 for(let i=0;i<two;i++)map[ids[ones+i]]=2;
 return map;}
function genPregen(cursed){
 const c=defaultCharacter(pick(Math.random()<.5?NAMES_F:NAMES_M));
 Object.assign(c.qualities,distBlock(QUALITIES.map(q=>q.id)));
 Object.assign(c.skills,distBlock(SKILLS.map(s=>s.id)));
 Object.assign(c.lore,distBlock(LORE.map(l=>l.id)));
 const vs=shuffle(VIRTUES.map(v=>v.id));
 if(Math.random()<.6)vs.forEach(id=>c.virtues[id]=2);
 else{c.virtues[vs[0]]=3;c.virtues[vs[1]]=2}
 if(cursed){
  const vk=pick(Object.keys(VICES));
  c.vice=vk;applyViceStart(c,vk,true);
  c.humanity=5+irnd(4);}
 c.woundLimit=suggestLimit(c);c.blood=maxBlood(c);
 const eqn=2+irnd(2);
 for(let i=0;i<eqn;i++)c.equipment.push({id:uid('eq'),name:pick(EQUIP_POOL),qty:1+irnd(2),note:''});
 recalcTotal(c);return c;}
function openPregenModal(){
 pgKind='mortal';
 openModal('Сгенерировать прегена',
  '<div class="form-row"><label>Кто это будет</label><div class="btn-group">'+
  '<button class="bg-btn active" data-act="pg-kind" data-k="mortal">Смертный</button>'+
  '<button class="bg-btn" data-act="pg-kind" data-k="cursed">Проклятый</button></div></div>'+
  '<div class="form-row"><label for="pgNameF">Имя (можно оставить пустым)</label>'+
  '<input type="text" id="pgNameF" maxlength="40" placeholder="придумается само"></div>'+
  '<div class="form-row"><label for="pgRole">Роль в истории</label>'+
  '<input type="text" id="pgRole" maxlength="80" placeholder="пьяный сторож, беглая ведьмка, наёмник с тяжёлым прошлым…"></div>'+
  '<p class="empty">Параметры и снаряжение раскидаются по правилам создания. После генерации преген откроется в листе — доведите до ума и передайте игроку.</p>'+
  '<div class="modal-actions"><button class="btn btn-primary" data-act="pg-create">Создать</button></div>');}
function openTransferModal(){
 const c=char();if(!c)return;
 openModal('Передать игроку',
  '<p>Преген <b style="color:var(--ink2)">'+esc(c.name)+'</b> станет полноценным персонажем в летописи выбранного игрока. Портрет и токен переедут вместе с ним.</p>'+
  '<div class="form-row"><label for="trProf">Игрок</label>'+
  '<select id="trProf">'+state.profiles.map(p=>'<option value="'+p.id+'">'+esc(p.name)+'</option>').join('')+'</select></div>'+
  '<div class="form-row"><label for="trName">Имя (можно поменять)</label>'+
  '<input type="text" id="trName" maxlength="40" value="'+esc(c.name)+'"></div>'+
  '<div class="modal-actions"><button class="btn btn-primary" data-act="pg-do-transfer">Передать</button></div>');}
function pregensPanel(){
 const pg=state.pregens;
 const rows=pg.length?pg.map(p=>'<div class="gm-row">'+
  '<span class="tbadge">'+esc(p.vice?VICES[p.vice].being:'Смертный')+'</span><b>'+esc(p.name)+'</b>'+
  '<span class="gm-meta">'+esc(p.pregenNote||'без роли')+'</span>'+
  '<button class="ibtn" data-act="pg-edit" data-id="'+p.id+'" title="Открыть и править">'+icon('quill',13)+'</button>'+
  '<button class="ibtn" data-act="pg-transfer" data-id="'+p.id+'" title="Передать игроку">'+icon('users',13)+'</button>'+
  '<button class="ibtn" data-act="pg-del" data-id="'+p.id+'" title="Удалить">'+icon('trash',12)+'</button></div>').join('')
  :'<p class="empty">Прегенов нет. Сгенерируйте первого — он откроется прямо в листе персонажа.</p>';
 return '<div class="panel"><div class="sec-title"><h2>'+icon('users',15)+' Прегены</h2><span class="ln"></span><span class="note">передаются игрокам</span></div>'+rows+
  '<div style="margin-top:12px"><button class="btn" data-act="pg-new">'+icon('plus',13)+' Сгенерировать прегена</button></div></div>';}

/* ── локации-аккордеоны ── */
const locOpen=new Set();
function locToggle(id){
 if(locOpen.has(id))locOpen.delete(id);else locOpen.add(id);
 renderGM();}
function mobRow(m){
 return '<div class="gm-row">'+
  '<span class="tbadge '+esc(m.type)+'">'+(({monster:'Чудовище',enemy:'Враг',npc:'NPC'})[m.type]||'NPC')+'</span>'+
  '<b>'+esc(m.name)+'</b>'+
  '<span class="gm-meta">КУ '+mobKU(m)+' · раны '+m.woundLimit+' · '+esc(m.attacks[0]?m.attacks[0].name:'без атак')+'</span>'+
  '<button class="ibtn" data-act="mob-open" data-id="'+m.id+'" title="Карточка">'+icon('eye',13)+'</button>'+
  '<button class="ibtn" data-act="mob-dup" data-id="'+m.id+'" title="Дублировать">'+icon('plus',13)+'</button>'+
  '<button class="ibtn" data-act="mob-del" data-id="'+m.id+'" title="Удалить">'+icon('trash',12)+'</button></div>';}
function locHead(loc,count){
 const open=locOpen.has(loc.id);
 return '<div class="loc-head" data-act="loc-toggle" data-id="'+loc.id+'">'+
  '<span class="loc-chev">▸</span>'+
  '<span class="loc-name">'+esc(loc.name)+'</span>'+
  '<span class="loc-count">'+count+'</span>'+
  '<span style="flex:1"></span>'+
  (loc.id!=='__none'?'<button class="ibtn" data-act="loc-edit" data-id="'+loc.id+'" title="Переименовать, заметка">'+icon('info',12)+'</button>'+
  '<button class="ibtn" data-act="loc-del" data-id="'+loc.id+'" title="Удалить локацию (твари останутся без места)">'+icon('trash',12)+'</button>':'')+
  '</div>';}
function locBody(loc,mobs){
 const note=loc.note?'<p class="empty" style="padding:2px 0 6px">'+esc(loc.note)+'</p>':'';
 return '<div class="loc-body">'+note+(mobs.length?mobs.map(mobRow).join(''):'<p class="empty">Пока никого. В карточке твари выберите эту локацию.</p>')+'</div>';}
function locsPanel(){
 const mobs=state.bestiary;
 const addRow='<div class="locs-add">'+
  '<input type="text" id="locNameIn" maxlength="60" placeholder="новая локация — «Деревня Берест», «Русалье болото»…" style="flex:1;min-width:180px">'+
  '<button class="btn" data-act="loc-add">'+icon('plus',13)+' Создать</button></div>';
 if(!mobs.length&&!state.locations.length)
  return '<div class="panel"><div class="sec-title"><h2>'+icon('flame',15)+' Твари и NPC</h2><span class="ln"></span><span class="note">КУ · раны · атаки</span></div>'+
   '<p class="empty">Тварей нет. Заведите первую — карточка с КУ, ранами и атаками для быстрого броска. А локации помогут не путаться, кто где живёт.</p>'+addRow+
   '<div style="margin-top:12px"><button class="btn" data-act="mob-new">'+icon('plus',13)+' Создать тварь</button></div></div>';
 const byLoc=loc=>mobs.filter(m=>m.locId===loc.id);
 let html='';
 state.locations.forEach(loc=>{
  const group=byLoc(loc);
  const open=locOpen.has(loc.id);
  html+='<div class="loc '+(open?'loc-open':'')+'">'+locHead(loc,group.length)+(open?locBody(loc,group):'')+'</div>';});
 const stray=mobs.filter(m=>!m.locId||!state.locations.some(l=>l.id===m.locId));
 if(stray.length){
  const open=locOpen.has('__none');
  html+='<div class="loc '+(open?'loc-open':'')+'">'+locHead({id:'__none',name:'Без места'},stray.length)+(open?locBody({id:'__none',name:'',note:'Эти твари пока не привязаны к локации.'},stray):'')+'</div>';}
 return '<div class="panel"><div class="sec-title"><h2>'+icon('flame',15)+' Твари и NPC</h2><span class="ln"></span><span class="note">по локациям</span></div>'+
  html+addRow+
  '<div style="margin-top:12px"><button class="btn" data-act="mob-new">'+icon('plus',13)+' Создать тварь</button></div></div>';}
function renderGM(){
 $('#view-gm').innerHTML='<div class="view-head"><h2>Кабинет Сказителя</h2><p>Прегены для безымянных и кодекс тварей по местам жительства — всё, что нужно за ширмой.</p></div>'+
  '<div class="gm-grid">'+pregensPanel()+locsPanel()+'</div>';}
function openLocEditModal(id){
 const loc=state.locations.find(l=>l.id===id);if(!loc)return;
 openModal('Локация',
  '<div class="form-row"><label for="locNameE">Название</label>'+
  '<input type="text" id="locNameE" maxlength="60" value="'+esc(loc.name)+'"></div>'+
  '<div class="form-row"><label for="locNoteE">Заметка (чем дышит место, чем опасно)</label>'+
  '<textarea id="locNoteE" rows="3" style="width:100%;resize:vertical">'+esc(loc.note)+'</textarea></div>'+
  '<div class="modal-actions"><button class="btn btn-primary" data-act="loc-save" data-id="'+loc.id+'">Сохранить</button></div>');
 $('#locNameE').focus();}

/* ── твари ── */
function setMobField(path,val){
 const d=mobUI.draft;
 if(path.startsWith('q.'))d.quals[path.slice(2)]=clamp(parseInt(val)||0,0,12);
 else if(path.startsWith('sk.'))d.skills[path.slice(3)]=clamp(parseInt(val)||0,0,9);
 else if(path==='woundLimit')d.woundLimit=clamp(parseInt(val)||1,1,999);
 else if(path==='locId')d.locId=val;
 else if(['name','type','being','desc','tactics','loot','size'].includes(path))d[path]=val;}
function refreshMobDerived(){
 const k=$('#mobKU');if(!k||!mobUI)return;
 k.textContent=mobKU(mobUI.draft);
 $('#mobInit').textContent=mobInit(mobUI.draft);}
function renderMobEditor(){
 const d=mobUI.draft;
 const qIn=QUALITIES.map(q=>'<label class="mf">'+q.name+'<input type="number" class="mini" data-mf="q.'+q.id+'" value="'+(d.quals[q.id]||0)+'" min="0" max="12"></label>').join('');
 const sIn=SKILLS.map(s=>'<label class="mf">'+s.name+'<input type="number" class="mini" data-mf="sk.'+s.id+'" value="'+(d.skills[s.id]||0)+'" min="0" max="9"></label>').join('');
 const atk=d.attacks.map((a,i)=>'<div class="atk-row">'+
  '<input type="text" data-ai="'+i+'" data-af="name" value="'+esc(a.name)+'" placeholder="название атаки">'+
  '<input type="number" data-ai="'+i+'" data-af="pool" value="'+a.pool+'" min="0" max="20" title="пул к10">'+
  '<input type="text" data-ai="'+i+'" data-af="damage" value="'+esc(a.damage)+'" placeholder="урон: к10, тяжёлые раны">'+
  '<button class="ibtn" data-act="mob-atk-roll" data-i="'+i+'" title="Бросить атаку">'+icon('die',13)+'</button>'+
  '<button class="ibtn" data-act="mob-atk-del" data-i="'+i+'">'+icon('x',11)+'</button></div>').join('');
 const abl=d.abilities.map((a,i)=>'<span class="tag">'+esc(a)+'<button class="ibtn" data-act="mob-abl-del" data-i="'+i+'">'+icon('x',10)+'</button></span>').join('');
 const locOpts=['<option value="" '+(!d.locId?'selected':'')+'>— без места —</option>']
  .concat(state.locations.map(l=>'<option value="'+l.id+'" '+(d.locId===l.id?'selected':'')+'>'+esc(l.name)+'</option>')).join('');
 $('#mobWrap').innerHTML=
  '<div class="mob-grid">'+
  '<label class="mf">Имя<input type="text" data-mf="name" value="'+esc(d.name)+'"></label>'+
  '<label class="mf">Тип<select data-mf="type">'+
  '<option value="monster" '+(d.type==='monster'?'selected':'')+'>Чудовище</option>'+
  '<option value="enemy" '+(d.type==='enemy'?'selected':'')+'>Враг</option>'+
  '<option value="npc" '+(d.type==='npc'?'selected':'')+'>NPC</option></select></label>'+
  '<label class="mf">Вид нечисти<input type="text" data-mf="being" value="'+esc(d.being)+'" placeholder="волколак…"></label>'+
  '<label class="mf">Размер<select data-mf="size">'+SIZES.map(s=>'<option value="'+s.id+'" '+(d.size===s.id?'selected':'')+'>'+s.name+'</option>').join('')+'</select></label>'+
  '<label class="mf">Локация<select data-mf="locId">'+locOpts+'</select></label>'+
  '<div class="mf">КУ<div class="derived" id="mobKU">'+mobKU(d)+'</div></div>'+
  '<div class="mf">Инициатива<div class="derived" id="mobInit">'+mobInit(d)+'</div></div>'+
  '<label class="mf">Предел ран<input type="number" data-mf="woundLimit" value="'+d.woundLimit+'" min="1" max="999"></label></div>'+
  '<div class="sec-title"><h2 style="font-size:13px">Качества</h2><span class="ln"></span></div>'+
  '<div class="mob-grid" style="grid-template-columns:repeat(9,1fr);gap:6px">'+qIn+'</div>'+
  '<div class="sec-title"><h2 style="font-size:13px">Умения</h2><span class="ln"></span></div>'+
  '<div class="mob-grid" style="grid-template-columns:repeat(9,1fr);gap:6px">'+sIn+'</div>'+
  '<div class="sec-title"><h2 style="font-size:13px">Атаки</h2><span class="ln"></span><button class="ibtn" data-act="mob-atk-add" title="Добавить атаку">'+icon('plus',13)+'</button></div>'+
  (atk||'<p class="empty">Ни одной атаки.</p>')+
  '<div class="sec-title" style="margin-top:10px"><h2 style="font-size:13px">Способности</h2><span class="ln"></span></div>'+
  '<div class="tags">'+(abl||'<span class="empty">Особых способностей нет</span>')+'</div>'+
  '<div class="spec-add"><input type="text" id="ablIn" maxlength="80" placeholder="способность — «Незримая поступь 2: тихий шаг»…">'+
  '<button class="btn" data-act="mob-abl-add">'+icon('plus',13)+'</button></div>'+
  '<div class="form-row" style="margin-top:12px"><label>Описание и повадки</label>'+
  '<textarea data-mf="desc" rows="3" style="width:100%;resize:vertical">'+esc(d.desc)+'</textarea></div>'+
  '<div class="form-row"><label>Тактика в бою</label>'+
  '<textarea data-mf="tactics" rows="2" style="width:100%;resize:vertical">'+esc(d.tactics)+'</textarea></div>'+
  '<div class="form-row"><label>Добыча</label>'+
  '<input type="text" data-mf="loot" value="'+esc(d.loot)+'" placeholder="шкура, клык, ключ от амбара…"></div>'+
  '<div class="modal-actions"><button class="btn" data-act="mob-cancel">Отмена</button>'+
  '<button class="btn btn-primary" data-act="mob-save">Сохранить в кодекс тварей</button></div>'+
  '<div class="tool-roll" id="mobRoll"></div>';}
function openMobModal(id){
 const src=id?state.bestiary.find(m=>m.id===id):null;
 mobUI={isNew:!src,draft:src?JSON.parse(JSON.stringify(src)):defaultMob()};
 openModal('Карточка твари','<div id="mobWrap"></div>');
 renderMobEditor();}

/* ── импорт / экспорт ── */
function exportPayload(chars,withGM){
 const ids=new Set(chars.map(c=>c.id));
 const eqConv=c=>({...c,equipment:c.equipment.map(eqToStr)});
 const pay={version:3,profiles:state.profiles,characters:chars.map(eqConv),
  activeCharId:ids.has(state.activeCharId)?state.activeCharId:(chars[0]&&chars[0].id)||'',
  log:state.log.filter(l=>ids.has(l.charId)).map(l=>({ts:l.ts,charId:l.charId,type:l.type,amount:l.amount,reason:l.reason}))};
 if(withGM){pay.pregens=state.pregens.map(eqConv);pay.bestiary=state.bestiary;pay.locations=state.locations}
 return pay;}
function doExportAll(){
 download('skitalec-letopis.json',JSON.stringify(exportPayload(state.characters,true),null,2));
 toast('Летопись скопирована в свиток.');}
function doExportChar(){
 const c=char();if(!c||editingPregen)return;
 const pay=exportPayload([c],false);
 const single={...pay.characters[0]};
 if(pay.log.length)single.log=pay.log;
 const fname='skitalec-'+c.name.replace(/[^\wа-яёА-ЯЁ-]+/g,'-').replace(/^-+|-+$/g,'')+'.json';
 download(fname,JSON.stringify(single,null,2));
 toast('«'+c.name+'» переписан в свиток.');}
function handleImportText(text){
 let d;try{d=JSON.parse(text)}catch(e){toast('Свиток повреждён — JSON не читается.',1);return}
 try{
  const locs=Array.isArray(d&&d.locations)?d.locations.map(l=>({id:typeof l.id==='string'&&l.id?l.id:uid('loc'),
   name:String(l.name||'Локация').slice(0,60)||'Локация',note:String(l.note||'').slice(0,200)})):[];
  if(Array.isArray(d)){
   const chars=d.map(normalizeCharacter).filter(c=>c.name);
   if(!chars.length)throw 0;
   pendingImport={chars,logs:[],replace:false,pregens:[],bestiary:[],locations:locs};
  }else if(d&&typeof d==='object'&&Array.isArray(d.characters)){
   const chars=d.characters.map(normalizeCharacter).filter(c=>c.name);
   if(!chars.length)throw 0;
   const ids=new Set(chars.map(c=>c.id));
   pendingImport={chars,logs:(d.log||[]).map(normalizeLog).filter(l=>l&&ids.has(l.charId)),replace:true,
    pregens:Array.isArray(d.pregens)?d.pregens.map(normalizeCharacter):[],
    bestiary:Array.isArray(d.bestiary)?d.bestiary.map(normalizeMob):[],locations:locs};
  }else if(d&&typeof d==='object'&&(d.qualities||d.skills||d.virtues)){
   const c=normalizeCharacter(d);
   const logs=(d.log||[]).map(normalizeLog).filter(l=>l&&(!l.charId||l.charId===c.id)).map(l=>({...l,charId:c.id}));
   pendingImport={chars:[c],logs,replace:false,pregens:[],bestiary:[],locations:[]};
  }else throw 0;
  const names=pendingImport.chars.map(c=>'«'+esc(c.name)+'»').join(', ');
  openModal('Импорт свитка',
   '<p>В свитке найдено: <b style="color:var(--ink2)">'+pendingImport.chars.length+' '+plural(pendingImport.chars.length,'персонаж','персонажа','персонажей')+'</b> — '+names+'.</p>'+
   '<p style="color:var(--dim)">Записей опыта: '+pendingImport.logs.length+'. Тварей: '+pendingImport.bestiary.length+'. Локаций: '+pendingImport.locations.length+'. Параметры будут сверены и достроены.</p>'+
   '<div class="modal-actions">'+
   (pendingImport.replace?'<button class="btn btn-danger" data-act="imp-replace">Заменить летопись целиком</button>':'')+
   '<button class="btn btn-primary" data-act="imp-add">Добавить к текущим</button></div>');
 }catch(e){toast('В свитке не найдено персонажей.',1)}}
function importAdd(){
 const locMap={};
 pendingImport.locations.forEach(l=>{
  const ex=state.locations.find(x=>x.id===l.id||x.name===l.name);
  if(ex)locMap[l.id]=ex.id;
  else{const nl={id:l.id===state.locations.some(x=>x.id===l.id)?uid('loc'):l.id,name:l.name,note:l.note};
   state.locations.push(nl);locMap[l.id]=nl.id;}});
 pendingImport.bestiary.forEach(m=>{m.id=uid('mob');if(m.locId&&locMap[m.locId])m.locId=locMap[m.locId];else m.locId='';state.bestiary.push(m)});
 pendingImport.chars.forEach(c=>{
  if(state.characters.some(x=>x.id===c.id))c.id=uid('char');
  if(!state.profiles.some(p=>p.id===c.profileId))c.profileId=state.activeProfileId;
  state.characters.push(c);});
 pendingImport.logs.forEach(l=>{
  if(!state.characters.some(x=>x.id===l.charId))return;
  state.log.push({...l,id:uid('xp')});});
 pendingImport.pregens.forEach(p=>{p.id=uid('char');state.pregens.push(p)});
 state.activeCharId=pendingImport.chars[0].id;
 save();closeModal();
 if(view!=='sheet')switchView('sheet');else render();
 toast('В летопись вписано: '+pendingImport.chars.length+' '+plural(pendingImport.chars.length,'странник','странника','странников')+'.');}
function importReplace(){
 editingPregen=null;
 state=normalizeState(pendingImport);
 save();closeModal();dice={rolling:false,last:null,history:[]};
 render();toast('Летопись переписана из свитка.');}
/* === КОНЕЦ ФАЙЛА: app-d.js === */
