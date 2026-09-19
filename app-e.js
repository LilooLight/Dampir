/* ═ Скиталец · app-e.js — события, поиск, запуск ═ */
'use strict';
window.__skit.push('app-e');

function renderTabs(){
 $('#tabs').innerHTML=[['sheet','Лист','sword'],['codex','Кодекс','book'],['xp','Опыт','gem'],['gm','Сказитель','eye'],['help','Помощь','info']]
  .map(([v,n,i])=>'<button class="tab '+(view===v?'active':'')+'" data-act="view" data-view="'+v+'">'+icon(i,15)+' '+n+'</button>').join('');
 const pb=$('#profBtn');if(pb&&!pb.innerHTML)pb.innerHTML=icon('users',14);
 themeIcon();}
function render(){
 renderTabs();renderProfSel();
 $$('.view').forEach(v=>v.hidden=true);
 $('#view-'+view).hidden=false;
 if(view==='sheet')renderSheet();
 if(view==='codex')renderCodex();
 if(view==='xp')renderXP();
 if(view==='gm')renderGM();
 if(view==='help')renderHelp();}
function switchView(v){view=v;hideGDrop();window.scrollTo({top:0});render()}
function createChar(){
 const name=($('#ncName')?.value||'').trim()||'Безымянный';
 const c=defaultCharacter(name);
 c.profileId=state.activeProfileId;
 const vice=$('#ncVice')?.value||'';
 if(vice){c.vice=vice;applyViceStart(c,vice)}
 state.characters.push(c);state.activeCharId=c.id;save();closeModal();
 if(view!=='sheet')switchView('sheet');else renderSheet();
 toast(name+' выходит на дорогу.');}
function addSpec(){
 const c=char(),name=($('#specName')?.value||'').trim(),skillId=$('#specSkill').value;
 if(!name){toast('Дайте грани имя — узкое и живое.',1);return}
 const lv=(c.skills[skillId]??c.lore[skillId])||0;
 if(lv<3)toast('По правилам специализация доступна с уровня 3 умения — записана на вырост.');
 c.specializations.push({id:uid('sp'),skillId,specializationName:name});
 save();renderSheet();}

/* ── сквозной поиск ── */
const GCHIPS=['Попадание','КУ','Урон','Инициатива','Сложность','Провал','Предел ран','Стресс','Чёрная кровь','Волколак','Преген'];
function buildIndex(){
 const ix=[];
 CODEX.forEach((a,i)=>ix.push({type:'codex',id:String(i),title:a.title,meta:catName(a.cat),hay:norm(a.title+' '+a.summary+' '+a.body.join(' '))}));
 TOOLS.forEach(t=>ix.push({type:'tool',id:t.id,title:t.title,meta:'формула под рукой',hay:norm(t.title+' '+t.keys)}));
 Object.entries(POWERS).forEach(([id,p])=>ix.push({type:'power',id,title:p.name,meta:'проклятая сила',hay:norm(p.name+' '+p.flavor+' '+p.manif.map(m=>m[1]+' '+m[2]).join(' '))}));
 Object.entries(VICES).forEach(([id,v])=>ix.push({type:'vice',id,title:v.name+' · '+v.being,meta:'порок',hay:norm(v.name+' '+v.being+' '+v.adv+' '+v.dis)}));
 state.bestiary.forEach(m=>ix.push({type:'mob',id:m.id,title:m.name,meta:(({monster:'чудовище',enemy:'враг',npc:'NPC'})[m.type]||'тварь'),hay:norm(m.name+' '+m.being+' '+m.desc+' '+m.tactics+' '+m.abilities.join(' ')+' '+m.attacks.map(a=>a.name).join(' '))}));
 const pn=id=>{const p=state.profiles.find(x=>x.id===id);return p?p.name:'—'};
 state.characters.forEach(c=>ix.push({type:'char',id:c.id,title:c.name,meta:pn(c.profileId),hay:norm(c.name+' '+c.notes+' '+(VICES[c.vice]?VICES[c.vice].name+' '+VICES[c.vice].being:'')+' '+c.essence+' '+c.mask)}));
 state.pregens.forEach(c=>ix.push({type:'pregen',id:c.id,title:c.name,meta:c.pregenNote||'преген',hay:norm(c.name+' '+c.pregenNote+' '+(VICES[c.vice]?VICES[c.vice].being:''))}));
 HELP.forEach(s=>{const hay=norm(s.title+' '+(s.items?s.items.map(i=>i[0]+' '+i[1]).join(' '):'')+(s.keys?s.keys.map(k=>k[0]+' '+k[1]).join(' '):''));
  ix.push({type:'help',id:s.id,title:s.title,meta:'справка',hay})});
 return ix;}
function runSearch(qraw){
 const q=norm(String(qraw||'').trim()),res=[];
 if(q){
  buildIndex().forEach(it=>{
   const pos=it.hay.indexOf(q);
   if(pos<0)return;
   const inTitle=norm(it.title).includes(q);
   res.push({...it,score:(inTitle?0:pos<12?1:2)*1000+pos})});
  res.sort((a,b)=>a.score-b.score);}
 renderGDrop(res,q);}
function renderGDrop(res,q){
 const d=$('#gdrop');if(!d)return;
 if(!q){d.innerHTML='<div class="g-hint">'+GCHIPS.map(c=>'<span class="g-chip" data-act="chip" data-q="'+esc(c)+'">'+c+'</span>').join('')+'</div>';d.hidden=false;return}
 const groups={};res.forEach(r=>{(groups[r.type]=groups[r.type]||[]).push(r)});
 const order=[['tool','Инструменты','die'],['codex','Кодекс','book'],['power','Проклятые силы','drop'],['vice','Пороки','flame'],['mob','Твари и NPC','flame'],['char','Персонажи','heart'],['pregen','Прегены','hourglass'],['help','Справка','info']];
 let html='',total=0;
 order.forEach(([type,label,ic])=>{
  const arr=groups[type];if(!arr)return;
  html+='<div class="g-head">'+label+'</div>'+arr.slice(0,6).map(r=>{total++;
   return '<div class="g-item" data-act="go" data-gtype="'+type+'" data-gid="'+esc(r.id)+'">'+icon(ic,14)+'<span class="g-tt">'+esc(r.title)+'</span><span class="g-meta">'+esc(r.meta||'')+'</span></div>'}).join('');});
 d.innerHTML=total?html:'<div class="g-none">Тьма молчит. Попробуйте: попадание, КУ, урон, провал…</div>';
 d.hidden=false;}
function hideGDrop(){const d=$('#gdrop');if(d)d.hidden=true}

/* ── обработчик кликов ── */
document.addEventListener('click',e=>{
 if(!e.target.closest('#gsearch'))hideGDrop();
 if(e.target.dataset&&e.target.dataset.mb){closeModal();return}
 const t=e.target.closest('[data-act]');if(!t)return;
 const act=t.dataset.act,c=char();
 switch(act){
  case 'view':switchView(t.dataset.view);break;
  case 'modal-close':closeModal();break;
  case 'theme':toggleTheme();break;
  case 'help-jump':{const el=$('#help-'+t.dataset.id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});break}
  case 'chip':{$('#gq').value=t.dataset.q;runSearch(t.dataset.q);break}
  case 'go':{
   hideGDrop();
   const ty=t.dataset.gtype,gid=t.dataset.gid;
   if(ty==='tool')openTool(gid);
   else if(ty==='codex')openCodexArticle(gid);
   else if(ty==='power')openPowerInfo(gid);
   else if(ty==='vice'){
    const v=VICES[gid];
    if(v)openModal(esc(v.name)+' · '+esc(v.being),'<span class="cat-tag">порок</span>'+
     '<p><b style="color:var(--ink2)">Достоинство.</b> '+esc(v.adv)+'</p>'+
     '<p><b style="color:var(--ink2)">Недостаток.</b> '+esc(v.dis)+'</p>'+
     '<p><b style="color:var(--ink2)">Начальные силы.</b> '+v.start.map(id=>esc(POWERS[id].name)).join(', ')+'.</p>');}
   else if(ty==='mob')openMobModal(gid);
   else if(ty==='help'){switchView('help');setTimeout(()=>{const el=$('#help-'+gid);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})},80)}
   else if(ty==='char'){
    editingPregen=null;
    const cc=state.characters.find(x=>x.id===gid);
    if(cc){if(cc.profileId&&state.activeProfileId!==cc.profileId)state.activeProfileId=cc.profileId;
     state.activeCharId=cc.id;save();switchView('sheet')}}
   else if(ty==='pregen'){if(state.pregens.some(p=>p.id===gid)){editingPregen=gid;switchView('sheet')}}
   break}
  case 'troll':renderToolOut(true);break;
  case 'char-modal':{
   const vo=['<option value="">— род людской (смертный) —</option>'].concat(Object.entries(VICES).map(([id,v])=>'<option value="'+id+'">'+esc(v.name)+' · '+esc(v.being)+'</option>')).join('');
   openModal('Новый скиталец',
    '<div class="form-row"><label for="ncName">Имя</label><input type="text" id="ncName" maxlength="40" placeholder="Кто идёт сквозь тьму?"></div>'+
    '<div class="form-row"><label for="ncVice">Порок (для Проклятых)</label><select id="ncVice">'+vo+'</select></div>'+
    '<p class="empty">Параметры начнутся с нуля, добродетели — с двух. Остальное допишет дорога: по 5 пунктов на каждый блок и 40 свободных — по правилам Книги первой.</p>'+
    '<div class="modal-actions"><button class="btn btn-primary" data-act="char-create">Выйти на дорогу</button></div>');
   $('#ncName').focus();break}
  case 'char-create':createChar();break;
  case 'char-select':state.activeCharId=t.dataset.id;save();render();break;
  case 'char-export':doExportChar();break;
  case 'char-del':
   if(!armButton(t))return;
   state.characters=state.characters.filter(x=>x.id!==t.dataset.id);
   state.log=state.log.filter(r=>r.charId!==t.dataset.id);
   if(state.activeCharId===t.dataset.id)state.activeCharId=state.characters[0]?.id;
   if(!state.characters.length){const d=defaultCharacter('Безымянный');d.profileId=state.activeProfileId;state.characters.push(d);state.activeCharId=d.id}
   save();render();toast('Свиток предан огню.');break;
  case 'prof-open':openProfModal();break;
  case 'prof-create':{
   const nm=($('#newProfName')?.value||'').trim();
   if(!nm){toast('Дайте игроку имя.',1);break}
   state.profiles.push({id:uid('prof'),name:nm});
   save();openProfModal();renderProfSel();break}
  case 'prof-del':{
   if(state.profiles.length<=1)break;
   const id=t.dataset.id,rest=state.profiles.filter(p=>p.id!==id);
   state.characters.forEach(ch=>{if(ch.profileId===id)ch.profileId=rest[0].id});
   state.pregens.forEach(p=>{if(p.profileId===id)p.profileId=rest[0].id});
   state.profiles=rest;
   if(state.activeProfileId===id)state.activeProfileId=rest[0].id;
   if(!state.characters.some(ch=>ch.id===state.activeCharId))state.activeCharId=state.characters[0].id;
   save();openProfModal();renderProfSel();break}
  case 'pip':{
   const g=t.dataset.group,id=t.dataset.id,v=+t.dataset.v,gd=GROUPS[g];
   if(g==='virtues')c.virtues[id]=clamp(v,gd.min,gd.max);else c[g][id]=clamp(v,gd.min,gd.max);
   save();renderSheet();break}
  case 'stat':{
   const g=t.dataset.group,id=t.dataset.id,d=t.dataset.kind==='inc'?1:-1,gd=GROUPS[g];
   if(g==='virtues')c.virtues[id]=clamp(c.virtues[id]+d,gd.min,gd.max);else c[g][id]=clamp(c[g][id]+d,gd.min,gd.max);
   save();renderSheet();break}
  case 'sun':
   c.humanity=clamp(10-(+t.dataset.i),0,10);
   c.blood=clamp(c.blood,0,maxBlood(c));
   save();renderSheet();break;
  case 'track':{
   const v=+t.dataset.v,k=t.dataset.kind,max=k==='blood'?maxBlood(c):resilience(c);
   c[k]=clamp(c[k]===v?v-1:v,0,max);save();renderSheet();break}
  case 'track-step':{
   const k=t.dataset.kind,max=k==='blood'?maxBlood(c):resilience(c);
   c[k]=clamp(c[k]+(+t.dataset.d),0,max);save();renderSheet();break}
  case 'stress-essence':{
   if(c.stress<=0){toast('Стресса и так нет — душа чиста.');break}
   if(!c.essence){toast('Сначала выберите Суть — иначе непонятно, что именно вас лечит.',1);break}
   c.stress--;save();renderSheet();
   toast('Действие в согласии с Сутью «'+c.essence+'» — стресс снижен.');break}
  case 'limit-step':c.woundLimit=clamp(c.woundLimit+(+t.dataset.d),20,999);save();renderSheet();break;
  case 'limit-auto':c.woundLimit=suggestLimit(c);save();renderSheet();toast('Предел ран установлен по Выносливости: '+c.woundLimit+'.');break;
  case 'select-part':selectedPart=t.dataset.part;renderSheet();break;
  case 'wound':{
   const d=t.dataset.kind==='inc'?1:-1,sev=t.dataset.sev;
   c.wounds[selectedPart][sev]=clamp(c.wounds[selectedPart][sev]+d,0,30);
   recalcTotal(c);save();renderSheet();break}
  case 'wounds-reset':
   PARTS.forEach(p=>{c.wounds[p.id]={light:0,heavy:0}});
   recalcTotal(c);save();renderSheet();toast('Раны затянулись — до следующей беды.');break;
  case 'vice-info':{
   if(!c.vice)break;
   const v=VICES[c.vice];
   openModal(esc(v.name)+' · '+esc(v.being),'<span class="cat-tag">порок</span>'+
    '<p><b style="color:var(--ink2)">Достоинство.</b> '+esc(v.adv)+'</p>'+
    '<p><b style="color:var(--ink2)">Недостаток.</b> '+esc(v.dis)+'</p>'+
    '<p><b style="color:var(--ink2)">Начальные силы.</b> '+v.start.map(id=>esc(POWERS[id].name)).join(', ')+'.</p>');break}
  case 'spec-add':addSpec();break;
  case 'spec-del':
   c.specializations=c.specializations.filter(s=>s.id!==t.dataset.id);
   save();renderSheet();break;
  case 'power-modal':{
   pwUI={powerId:null,level:1,picked:[],editing:null};
   const rows=Object.entries(POWERS).map(([id,p])=>
    '<div class="pw-opt" data-act="pw-pick" data-id="'+id+'"><div class="pw-top"><b>'+esc(p.name)+'</b>'+
    (c.cursedPowers.some(x=>x.powerId===id)?'<span class="pw-has">уже изучена</span>':'')+'</div><p>'+esc(p.flavor)+'</p></div>').join('');
   openModal('Принять силу',rows+'<div class="pw-detail" id="pwDetail"><p class="empty">Выберите путь, по которому пойдёт ваша кровь.</p></div>'+
    '<div class="modal-actions"><button class="btn btn-primary" data-act="pw-save">Принять силу</button></div>');break}
  case 'power-edit':{
   const ex=c.cursedPowers.find(p=>p.id===t.dataset.id);if(!ex)break;
   pwUI={powerId:ex.powerId,level:ex.level,picked:[...ex.manifestations],editing:ex.id};
   const rows=Object.entries(POWERS).map(([id,p])=>
    '<div class="pw-opt '+(pwUI.powerId===id?'sel':'')+'" data-act="pw-pick" data-id="'+id+'"><div class="pw-top"><b>'+esc(p.name)+'</b></div><p>'+esc(p.flavor)+'</p></div>').join('');
   openModal('Путь силы',rows+'<div class="pw-detail" id="pwDetail"></div>'+
    '<div class="modal-actions"><button class="btn btn-primary" data-act="pw-save">Сохранить путь</button></div>');
   $('#pwDetail').innerHTML=powerDetailHTML();break}
  case 'pw-pick':
   pwUI.powerId=t.dataset.id;pwUI.picked=[];
   $$('#modal-root .pw-opt').forEach(o=>o.classList.toggle('sel',o.dataset.id===pwUI.powerId));
   $('#pwDetail').innerHTML=powerDetailHTML();break;
  case 'pw-lvl':pwUI.level=+t.dataset.l;$('#pwDetail').innerHTML=powerDetailHTML();break;
  case 'pw-toggle':{
   const n=t.dataset.name;
   if(pwUI.picked.includes(n))pwUI.picked=pwUI.picked.filter(x=>x!==n);else pwUI.picked.push(n);
   $('#pwDetail').innerHTML=powerDetailHTML();break}
  case 'pw-save':{
   if(!pwUI.powerId){toast('Сначала выберите силу.',1);break}
   if(pwUI.editing){
    const pw=c.cursedPowers.find(p=>p.id===pwUI.editing);
    if(pw){pw.powerId=pwUI.powerId;pw.level=pwUI.level;pw.manifestations=[...pwUI.picked]}
   }else c.cursedPowers.push({id:uid('pw'),powerId:pwUI.powerId,level:pwUI.level,manifestations:[...pwUI.picked]});
   save();closeModal();renderSheet();
   toast(pwUI.editing?'Путь переписан.':'Кровь приняла новую силу.');break}
  case 'power-lvl':{
   const pw=c.cursedPowers.find(p=>p.id===t.dataset.id);
   pw.level=clamp(pw.level+(+t.dataset.d),1,5);save();renderSheet();break}
  case 'power-del':
   if(!armButton(t))return;
   c.cursedPowers=c.cursedPowers.filter(p=>p.id!==t.dataset.id);
   save();renderSheet();toast('Сила отринута — но не забыта.');break;
  case 'equip-modal':
   openModal('Снаряжение',
    '<div class="form-row"><label for="eqName">Предмет</label><input type="text" id="eqName" maxlength="60" placeholder="Фонарь с треснувшим стеклом"></div>'+
    '<div class="form-row"><label for="eqQty">Сколько</label><input type="number" id="eqQty" min="1" max="99" value="1"></div>'+
    '<div class="form-row"><label for="eqNote">Пометка</label><input type="text" id="eqNote" maxlength="80" placeholder="чей, где взял, чем важно…"></div>'+
    '<div class="modal-actions"><button class="btn btn-primary" data-act="equip-create">Положить в котомку</button></div>');
   $('#eqName').focus();break;
  case 'equip-create':{
   const name=($('#eqName')?.value||'').trim();
   if(!name){toast('Безымянное в котомку не кладут.',1);break}
   const qty=clamp(Math.floor(+($('#eqQty')?.value||1))||1,1,99);
   c.equipment.push({id:uid('eq'),name,qty,note:($('#eqNote')?.value||'').trim()});
   save();closeModal();renderSheet();toast(name+' — в котомке.');break}
  case 'eq-qty':{
   const it=c.equipment.find(i=>i.id===t.dataset.id);
   it.qty=clamp(it.qty+(+t.dataset.d),1,99);save();renderSheet();break}
  case 'eq-del':
   c.equipment=c.equipment.filter(i=>i.id!==t.dataset.id);
   save();renderSheet();break;
  case 'roll':rollFromPanel();break;
  case 'effort':doEffort();break;
  case 'quick-roll':quickRoll(t.dataset.type,t.dataset.id);break;
  case 'cf-cat':
   codexUI.cat=t.dataset.cat;
   $$('#catFilter .cf-btn').forEach(b=>b.classList.toggle('active',b.dataset.cat===codexUI.cat));
   renderCodexList();break;
  case 'codex-open':openCodexArticle(t.dataset.id);break;
  case 'xp-type':xpUI.type=t.dataset.type;renderXP();break;
  case 'xp-filter':xpUI.filter=t.dataset.f;renderXP();break;
  case 'xp-commit':commitXP();break;
  case 'xp-del':{
   if(editingPregen)break;
   const rec=state.log.find(r=>r.id===t.dataset.id);
   if(!rec)break;
   const owner=state.characters.find(x=>x.id===rec.charId);
   if(owner)owner.xp+=rec.type==='+'?-rec.amount:rec.amount;
   state.log=state.log.filter(r=>r.id!==rec.id);
   save();renderXP();toast('Строка вычеркнута, опыт возвращён.');break}
  case 'pg-new':openPregenModal();break;
  case 'pg-kind':
   pgKind=t.dataset.k;
   $$('#modal-root [data-act="pg-kind"]').forEach(b=>b.classList.toggle('active',b.dataset.k===pgKind));
   break;
  case 'pg-create':{
   const gen=genPregen(pgKind==='cursed');
   const nm=($('#pgNameF')?.value||'').trim();if(nm)gen.name=nm;
   const role=($('#pgRole')?.value||'').trim();if(role)gen.pregenNote=role;
   state.pregens.push(gen);editingPregen=gen.id;save();closeModal();
   switchView('sheet');toast('Преген «'+gen.name+'» готов — правьте и передавайте.');break}
  case 'pg-edit':editingPregen=t.dataset.id;switchView('sheet');break;
  case 'pg-transfer':
   if(t.dataset.id)editingPregen=t.dataset.id;
   if(!editingPregen)break;
   openTransferModal();break;
  case 'pg-do-transfer':{
   const cc=char();if(!cc||!editingPregen)break;
   const pid=$('#trProf').value,nm=($('#trName').value||'').trim();
   if(nm)cc.name=nm;
   cc.profileId=pid;cc.pregenNote='';
   state.pregens=state.pregens.filter(p=>p.id!==cc.id);
   state.characters.push(cc);state.activeCharId=cc.id;state.activeProfileId=pid;
   editingPregen=null;save();closeModal();
   const pn=state.profiles.find(p=>p.id===pid);
   toast('«'+cc.name+'» передан игроку «'+(pn?pn.name:'—')+'».');
   if(view!=='sheet')switchView('sheet');else renderSheet();break}
  case 'pg-del':{
   if(!armButton(t))return;
   const id=t.dataset.id||editingPregen;
   state.pregens=state.pregens.filter(p=>p.id!==id);
   if(editingPregen===id)editingPregen=null;
   save();closeModal();
   if(view==='gm')renderGM();else switchView('gm');
   toast('Преген стёрт.');break}
  case 'pg-done':editingPregen=null;switchView('gm');break;
  case 'mob-new':openMobModal(null);break;
  case 'mob-open':openMobModal(t.dataset.id);break;
  case 'mob-dup':{
   const src=state.bestiary.find(m=>m.id===t.dataset.id);if(!src)break;
   const copy=JSON.parse(JSON.stringify(src));
   copy.id=uid('mob');copy.name=src.name+' (копия)';
   copy.attacks=copy.attacks.map(a=>({...a,id:uid('atk')}));
   state.bestiary.push(copy);save();renderGM();
   toast('Тварь размножилась — как они это любят.');break}
  case 'mob-del':
   if(!armButton(t))return;
   state.bestiary=state.bestiary.filter(m=>m.id!==t.dataset.id);
   if(mobUI&&mobUI.draft.id===t.dataset.id)closeModal();
   save();renderGM();toast('Тварь изгнана из кодекса.');break;
  case 'mob-save':{
   if(!mobUI)break;
   const dft=mobUI.draft;
   if(!String(dft.name||'').trim()){toast('У твари должно быть имя.',1);break}
   const m=normalizeMob(dft);
   if(mobUI.isNew)state.bestiary.push(m);
   else{const i=state.bestiary.findIndex(x=>x.id===m.id);if(i>=0)state.bestiary[i]=m;else state.bestiary.push(m)}
   save();closeModal();if(view==='gm')renderGM();
   toast('«'+m.name+'» — в кодексе тварей.');break}
  case 'mob-cancel':closeModal();break;
  case 'mob-atk-add':
   mobUI.draft.attacks.push({id:uid('atk'),name:'Атака',pool:3,damage:'к10',notes:''});
   renderMobEditor();break;
  case 'mob-atk-del':mobUI.draft.attacks.splice(+t.dataset.i,1);renderMobEditor();break;
  case 'mob-atk-roll':{
   const a=mobUI.draft.attacks[+t.dataset.i];if(!a)break;
   const n=clamp(a.pool,1,20),d=Array.from({length:n},r10);
   let s=0;d.forEach(x=>{if(x===10)s+=2;else if(x>=6)s++});
   $('#mobRoll').innerHTML='«'+esc(a.name)+'»: '+d.join(' · ')+' → <b>'+s+'</b> '+plural(s,'успех','успеха','успехов')+' (сложность 6) против КУ цели.';break}
  case 'mob-abl-add':{
   const v=($('#ablIn')?.value||'').trim();if(!v)break;
   mobUI.draft.abilities.push(v);renderMobEditor();break}
  case 'mob-abl-del':mobUI.draft.abilities.splice(+t.dataset.i,1);renderMobEditor();break;
  case 'imp-replace':importReplace();break;
  case 'imp-add':importAdd();break;
  case 'export':doExportAll();break;
  case 'import':$('#impFile').click();break;
  case 'reset':
   if(!armButton(t))return;
   localStorage.removeItem(STORE_KEY);state=seed();
   dice={rolling:false,last:null,history:[]};selectedPart='torso';editingPregen=null;
   render();toast('Летопись стёрта. Всё начинается заново.');break;
 }});

/* ── ввод ── */
document.addEventListener('input',e=>{
 const t=e.target;
 if(t.id==='gq'){runSearch(t.value);return}
 if(t.id==='charName'){const c=char();if(c){c.name=t.value||'Безымянный';save()}return}
 if(t.id==='charNotes'){const c=char();if(c){c.notes=t.value;save()}return}
 if(t.id==='woundLimit'){const c=char();if(!c)return;c.woundLimit=clamp(Math.round(+t.value)||c.woundLimit,20,999);save();return}
 if(t.id==='pgName'&&editingPregen){const c=char();if(c){c.name=t.value||'Безымянный';save()}return}
 if(t.id==='pgNote'&&editingPregen){const c=char();if(c){c.pregenNote=t.value;save()}return}
 if(t.id==='codexSearch'){codexUI.q=t.value;renderCodexList();return}
 if(t.id==='xpAmount'){xpUI.amount=t.value;return}
 if(t.id==='xpReason'){xpUI.reason=t.value;return}
 if(t.id==='calcTarget'||t.id==='calcType'){const el=$('#calcOut');if(el)el.innerHTML=calcCost();return}
 if(t.dataset.rollsel){
  const k=t.dataset.rollsel;
  if(k==='spec'){rollSel.spec=t.checked;return}
  if(k==='bonus')rollSel.bonus=parseInt(t.value)||0;
  else if(k==='diff')rollSel.diff=parseInt(t.value)||6;
  else{rollSel[k]=t.value;if(k==='skill')rollSel.spec=false}
  updatePoolPreview();return}
 if(t.dataset.tf!==undefined&&t.closest('#toolWrap')){renderToolOut(false);return}
 if(t.closest('#mobWrap')&&mobUI){
  if(t.dataset.ai!==undefined){
   const a=mobUI.draft.attacks[+t.dataset.ai];
   if(a)a[t.dataset.af]=t.dataset.af==='pool'?clamp(parseInt(t.value)||0,0,20):t.value;
  }else if(t.dataset.mf)setMobField(t.dataset.mf,t.value);
  refreshMobDerived();}});
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.id==='profSel'){switchProfile(t.value);return}
 if(t.dataset&&t.dataset.persona){
  const c=char();if(!c)return;
  const k=t.dataset.persona;
  c[k]=t.value;
  if(k==='vice')applyViceStart(c,t.value);
  save();renderSheet();return}
 if(t.dataset&&t.dataset.tf!==undefined&&t.closest('#toolWrap')){renderToolOut(false);return}
 if(t.closest&&t.closest('#mobWrap')&&mobUI&&t.dataset.mf){setMobField(t.dataset.mf,t.value);refreshMobDerived();return}
 if(t.id==='impFile'&&t.files[0]){
  const f=t.files[0],rd=new FileReader();
  rd.onload=()=>handleImportText(rd.result);
  rd.readAsText(f);t.value='';return}
 if(t.dataset&&t.dataset.pid){
  const p=state.profiles.find(x=>x.id===t.dataset.pid);
  if(p){p.name=t.value.trim()||p.name;save();renderProfSel()}}});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){hideGDrop();closeModal();return}
 const t=e.target;
 const inField=el=>el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT'||el.isContentEditable);
 if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
  if(inField(t))return;
  e.preventDefault();$('#gq').focus();$('#gq').select();return}
 if(e.key==='Enter'&&t.id==='gq'){
  e.preventDefault();
  const first=$('#gdrop .g-item');
  if(first)first.click();else hideGDrop();
  return}
 if(e.key==='Enter'){
  if(t.id==='ncName'){e.preventDefault();createChar()}
  else if(t.id==='specName'){e.preventDefault();addSpec()}
  else if(t.id==='eqName'||t.id==='eqNote'||t.id==='eqQty'){e.preventDefault();document.querySelector('[data-act="equip-create"]')?.click()}
  else if(t.id==='ablIn'){e.preventDefault();document.querySelector('[data-act="mob-abl-add"]')?.click()}
  else if(t.closest&&t.closest('.codex-row')){openCodexArticle(t.closest('.codex-row').dataset.id)}
  return}
 if(inField(t))return;
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(document.querySelector('.mb'))return;
 const VK={'1':'sheet','2':'codex','3':'xp','4':'gm','5':'help'};
 if(VK[e.key]){e.preventDefault();switchView(VK[e.key]);return}
 const k=e.key.toLowerCase();
 if(k==='b'||k==='и'){if(view==='sheet'&&!dice.rolling&&char())rollFromPanel()}});
 $('#gq')?.addEventListener('focus',()=>runSearch($('#gq').value));

/* ── запуск ── */
state=loadState();
render();
if(migrated)setTimeout(()=>toast('Старая летопись перенесена: профили созданы, параметры и раны сохранены.'),600);
/* === КОНЕЦ ФАЙЛА: app-e.js === */
