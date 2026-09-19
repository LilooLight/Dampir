/* ═ Скиталец · app-b.js — лист персонажа: отрисовка и броски ═ */
'use strict';
window.__skit.push('app-b');

function pipsHTML(group,id,val,max,blood){
 return '<span class="pips '+(blood?'blood':'')+'">'+Array.from({length:max},(_,i)=>
  '<span class="pip '+(i<val?'on':'')+'" data-act="pip" data-group="'+group+'" data-id="'+id+'" data-v="'+(i+1)+'" title="Поставить: '+(i+1)+'"></span>').join('')+'</span>';}
function pipsStatic(val,max,blood){
 return '<span class="pips static '+(blood?'blood':'')+'">'+Array.from({length:max},(_,i)=>'<span class="pip '+(i<val?'on':'')+'"></span>').join('')+'</span>';}
function statRow(group,def,val){
 const g=GROUPS[group];
 return '<div class="stat-row"><span class="stat-name">'+esc(def.name)+'</span>'+
  pipsHTML(group,def.id,val,g.max,group==='virtues')+
  '<span class="stat-ctl">'+
  '<button class="ibtn" data-act="stat" data-kind="dec" data-group="'+group+'" data-id="'+def.id+'" '+(val<=g.min?'disabled':'')+' title="Убавить">'+icon('minus',11)+'</button>'+
  '<button class="ibtn" data-act="stat" data-kind="inc" data-group="'+group+'" data-id="'+def.id+'" '+(val>=g.max?'disabled':'')+' title="Прибавить">'+icon('plus',11)+'</button>'+
  '<button class="ibtn" data-act="quick-roll" data-type="'+group+'" data-id="'+def.id+'" title="Бросить: '+esc(def.name)+'">'+icon('die',13)+'</button>'+
  '</span></div>';}
function defName(group,id){const d=(GROUPS[group]||{list:[]}).list.find(x=>x.id===id);return d?d.name:id}
const skillSpecs=(c,skillId)=>c.specializations.filter(s=>s.skillId===skillId);

function sunsHTML(c){
 const D=damnation(c);
 return '<span class="suns">'+Array.from({length:10},(_,i)=>{const n=i+1;
  return '<span class="sun '+(n<=D?'dark':'lit')+'" data-act="sun" data-i="'+n+'" title="Проклятье: '+n+' · Праведность: '+(10-n)+'"></span>'}).join('')+'</span>';}
function trackHTML(kind,val,max){
 return '<div class="track">'+Array.from({length:max},(_,i)=>
  '<span class="cell '+(i<val?('on '+kind):'')+'" data-act="track" data-kind="'+kind+'" data-v="'+(i+1)+'" title="Отметить: '+(i+1)+'"></span>').join('')+'</div>';}
function figureSVG(c){
 return '<svg viewBox="0 0 140 244" role="img" aria-label="Схема тела">'+PARTS.map(p=>{
  const w=c.wounds[p.id],a=Math.min(.85,w.heavy*.22+w.light*.07);
  const fill=a>0?'rgba(163,53,44,'+a.toFixed(2)+')':'#1d1812';
  const stroke=selectedPart===p.id?'var(--gold)':(w.heavy>0?'var(--blood)':'var(--line2)');
  return '<path class="fig-part" data-act="select-part" data-part="'+p.id+'" d="'+PART_SVG[p.id]+'" style="fill:'+fill+';stroke:'+stroke+'"><title>'+p.name+'</title></path>'}).join('')+'</svg>';}
function woundPanelHTML(c){
 const w=c.wounds[selectedPart],name=PARTS.find(p=>p.id===selectedPart).name,L=c.woundLimit;
 return '<div class="wound-panel"><div class="wp-head"><b>'+esc(name)+'</b><span class="wp-total">всего: '+c.wounds.total.light+' лёгк. · '+c.wounds.total.heavy+' тяж.</span></div>'+
  '<div class="wp-row"><span>Лёгкие</span><span class="wctl"><button class="ibtn" data-act="wound" data-kind="dec" data-sev="light" '+(w.light<=0?'disabled':'')+'>'+icon('minus',11)+'</button><b>'+w.light+'</b><button class="ibtn" data-act="wound" data-kind="inc" data-sev="light">'+icon('plus',11)+'</button></span></div>'+
  '<div class="wp-row"><span>Тяжёлые</span><span class="wctl"><button class="ibtn" data-act="wound" data-kind="dec" data-sev="heavy" '+(w.heavy<=0?'disabled':'')+'>'+icon('minus',11)+'</button><b>'+w.heavy+'</b><button class="ibtn" data-act="wound" data-kind="inc" data-sev="heavy">'+icon('plus',11)+'</button></span></div>'+
  '<div class="wp-thresh">пороги зоны: боль '+Math.floor(L*.1)+' · отключка '+Math.floor(L*.2)+' · смерть '+Math.floor(L*.4)+'</div>'+
  '<div class="wounds-reset"><button class="link-btn" data-act="wounds-reset">заживить все раны</button></div></div>';}

function asideHTML(c){
 const D=damnation(c),MB=maxBlood(c),R=resilience(c),L=c.woundLimit;
 const tier=STRESS_TIERS[Math.min(c.stress,10)]||'';
 return '<aside class="sheet-aside">'+
  '<div class="panel name-plate"><input id="charName" value="'+esc(c.name)+'" maxlength="40" placeholder="Безымянный" aria-label="Имя скитальца"></div>'+
  '<div class="panel">'+
   '<div class="counter"><span class="c-label">'+icon('eye',14)+' Человечность</span>'+sunsHTML(c)+'</div>'+
   '<div class="hum-note">Праведность <b>'+(10-D)+'</b> · Проклятье <b>'+D+'</b> · крови не больше <b>'+MB+'</b></div>'+
   '<div class="counter"><span class="c-label">'+icon('drop',14)+' Чёрная кровь</span>'+trackHTML('blood',c.blood,MB)+
    '<button class="ibtn" data-act="track-step" data-kind="blood" data-d="-1">'+icon('minus',11)+'</button><b class="c-num">'+c.blood+'</b>'+
    '<button class="ibtn" data-act="track-step" data-kind="blood" data-d="1">'+icon('plus',11)+'</button></div>'+
   '<div class="counter"><span class="c-label">'+icon('flame',14)+' Стресс</span>'+trackHTML('stress',c.stress,R)+
    '<b class="c-num">'+c.stress+'<span class="tier-tag">'+(tier?' · '+tier:'')+'</span></b>'+
    '<button class="ibtn" data-act="stress-essence" title="Сброс по Сути: −1 стресса">−С</button></div>'+
   '<div class="counter"><span class="c-label">'+icon('gem',14)+' Опыт</span><b class="c-num big">'+c.xp+'</b>'+
    '<button class="btn btn-ghost" data-act="view" data-view="xp" style="margin-left:auto">летопись</button></div></div>'+
  '<div class="panel"><div class="sec-title"><h2>'+icon('sword',14)+' Расчёты</h2><span class="ln"></span><span class="note">от параметров</span></div>'+
   '<div class="der-grid">'+
   '<div class="der-item"><span>КУ уклонения</span><b>'+ku(c)+'</b></div>'+
   '<div class="der-item"><span>Инициатива</span><b>'+initiative(c)+'</b></div>'+
   '<div class="der-item"><span>Шаг</span><b>'+stepSpd(c)+' м</b></div>'+
   '<div class="der-item"><span>Бег</span><b>'+runSpd(c)+' м</b></div>'+
   '<div class="der-item"><span>Рывок</span><b>'+dashSpd(c)+' м</b></div>'+
   '<div class="der-item"><span>Стрессоуст.</span><b>'+R+'</b></div>'+
   '<div class="der-item der-wide"><span>Предел ран</span><span class="wctl">'+
    '<button class="ibtn" data-act="limit-step" data-d="-1">'+icon('minus',11)+'</button>'+
    '<input type="number" id="woundLimit" value="'+L+'" min="20" max="999">'+
    '<button class="ibtn" data-act="limit-step" data-d="1">'+icon('plus',11)+'</button>'+
    '<button class="ibtn" data-act="limit-auto" title="Установить по Выносливости">'+icon('die',12)+'</button></span></div>'+
   '<div class="der-item der-wide" style="border:none;color:var(--faint);font-style:italic;font-size:12.5px">боль '+Math.floor(L/2)+' · отключка '+L+' · смерть '+(L*2)+'</div>'+
   '</div></div>'+
  '<div class="panel"><div class="sec-title"><h2>'+icon('heart',14)+' Добродетели</h2><span class="ln"></span><span class="note">'+GROUPS.virtues.note+'</span></div>'+
   VIRTUES.map(v=>statRow('virtues',v,c.virtues[v.id])).join('')+'</div>'+
  '<div class="panel"><div class="sec-title"><h2>'+icon('eye',14)+' Тело и раны</h2><span class="ln"></span><span class="note">клик по зоне</span></div>'+
   '<div class="body-fig">'+figureSVG(c)+'</div>'+woundPanelHTML(c)+'</div>'+
  '<div class="panel"><div class="sec-title"><h2>'+icon('quill',14)+' Заметки</h2><span class="ln"></span></div>'+
   '<textarea id="charNotes" rows="4" style="width:100%;resize:vertical" placeholder="внешность, привязанности, цели, шрамы души…">'+esc(c.notes)+'</textarea></div>'+
  '</aside>';}

function personaHTML(c){
 const viceOpts=['<option value="">— род людской —</option>'].concat(Object.entries(VICES).map(([id,v])=>
  '<option value="'+id+'" '+(c.vice===id?'selected':'')+'>'+esc(v.name)+' · '+esc(v.being)+'</option>')).join('');
 const esOpts=sel=>['<option value="">—</option>'].concat(ESSENCES.map(e=>
  '<option value="'+esc(e[0])+'" '+(sel===e[0]?'selected':'')+' title="'+esc(e[1])+'">'+esc(e[0])+'</option>')).join('');
 return '<div class="panel persona-strip"><div class="sec-title"><h2>'+icon('flame',15)+' Лик</h2><span class="ln"></span><span class="note">порок · суть · маска</span></div>'+
  '<div class="ps-row">'+
  '<label class="ps-field"><span>Порок</span><select data-persona="vice">'+viceOpts+'</select>'+
   '<button class="ibtn" data-act="vice-info" title="Подробности порока" '+(c.vice?'':'style="opacity:.35"')+'>'+icon('info',12)+'</button></label>'+
  '<label class="ps-field"><span>Суть</span><select data-persona="essence">'+esOpts(c.essence)+'</select></label>'+
  '<label class="ps-field"><span>Маска</span><select data-persona="mask">'+esOpts(c.mask)+'</select></label></div></div>';}

function rollPanelHTML(){
 const q=QUALITIES.map(x=>'<option value="'+x.id+'" '+(rollSel.quality===x.id?'selected':'')+'>'+x.name+'</option>').join('');
 const s=[...SKILLS,...LORE].map(x=>'<option value="'+x.id+'" '+(rollSel.skill===x.id?'selected':'')+'>'+x.name+'</option>').join('');
 const d=[3,4,5,6,7,8,9].map(x=>'<option value="'+x+'" '+(rollSel.diff===x?'selected':'')+'>'+x+'</option>').join('');
 return '<div class="panel"><div class="sec-title"><h2>'+icon('die',15)+' Испытание</h2><span class="ln"></span><span class="note">пул d10 · успех на сложность</span></div>'+
  '<div class="roll-controls">'+
  '<label class="rc">Качество<select data-rollsel="quality"><option value="">—</option>'+q+'</select></label>'+
  '<label class="rc">Навык / знание<select data-rollsel="skill"><option value="">—</option>'+s+'</select></label>'+
  '<label class="rc">Доп. кости<input type="number" data-rollsel="bonus" value="'+rollSel.bonus+'" min="-3" max="9" style="width:60px"></label>'+
  '<label class="rc">Сложность<select data-rollsel="diff">'+d+'</select></label>'+
  '<label class="rc" style="flex-direction:row;align-items:center;padding-bottom:8px"><input type="checkbox" data-rollsel="spec" '+(rollSel.spec?'checked':'')+'> Специализация</label>'+
  '<button class="btn btn-primary" data-act="roll">'+icon('die',15)+' Бросок</button>'+
  '<span class="roll-sub" id="poolPreview"></span></div>'+
  '<div class="dice-field" id="diceField"></div><div class="dice-result" id="diceResult"></div><div class="history" id="diceHistory"></div></div>';}

const DEC_PTS='12,1.5 18.2,3.5 22,8.8 22,15.2 18.2,20.5 12,22.5 5.8,20.5 2,15.2 2,8.8 5.8,3.5';
const dieSVG=v=>'<svg viewBox="0 0 24 24"><polygon points="'+DEC_PTS+'"/><text x="12" y="15.5" text-anchor="middle">'+v+'</text></svg>';

function currentPool(){
 const c=char();if(!c)return 0;
 const q=rollSel.quality?(c.qualities[rollSel.quality]||0):0;
 const s=rollSel.skill?((c.skills[rollSel.skill]??c.lore[rollSel.skill])||0):0;
 return q+s+(parseInt(rollSel.bonus)||0);}
function rollLabel(){
 const p=[];if(rollSel.quality)p.push(defName('qualities',rollSel.quality));
 if(rollSel.skill)p.push(defName('skills',rollSel.skill)||defName('lore',rollSel.skill));
 return p.join(' + ')||'Голая удача';}
function computeRoll(values,diff,spec){
 let s=0,ones=0;
 values.forEach(v=>{if(v===10)s+=spec?3:2;else if(v>=diff)s++;else if(v===1)ones++});
 const f=Math.max(0,s-ones);
 return {succ:s,ones,final:f,botch:f===0&&ones>0};}
function resultHTML(L){
 return '<span class="succ-big '+(L.final>0?'':'fail')+'">'+verdictText(L.final,L.botch)+'</span>'+
  '<span class="roll-sub">'+esc(L.label)+' · '+L.pool+' к10 · сложность '+L.diff+(L.spec?' · специализация':'')+(L.virtue?' · добродетель':'')+'</span>'+
  '<span class="roll-math">успехов: '+L.succ+(L.ones?' − '+L.ones+' (единицы)':'')+' = '+L.final+'</span>';}
const effortCandidates=L=>L.values.map((v,i)=>({v,i})).filter(o=>o.v<L.diff).sort((a,b)=>a.v-b.v).slice(0,3).map(o=>o.i);

function renderDiceField(){
 const L=dice.last,f=$('#diceField'),r=$('#diceResult');
 if(!f)return;
 if(L){
  f.innerHTML=L.values.map(v=>{
   const ok=v>=L.diff||v===10;
   return '<div class="die settled '+(ok?('success'+(v===10?' ten':'')):(v===1?'botch':''))+'" style="--tilt:'+((Math.random()*16)-8).toFixed(1)+'deg">'+dieSVG(v)+'</div>'}).join('');
  let res=resultHTML(L);
  if(!L.effortUsed&&!L.virtue&&!dice.rolling){
   const n=effortCandidates(L).length;
   if(n>0)res+='<button class="btn btn-danger" data-act="effort" style="margin-left:auto">Сверхусилие · +1 стресс · переброс '+n+'</button>';}
  r.innerHTML=res;
 }else{
  f.innerHTML='<span class="dice-empty">'+icon('die',26)+'<span>Кости ещё спят.<br>Соберите пул — или бросьте прямо со строки умения.</span></span>';
  r.innerHTML='';}
 renderHistory();}
function renderHistory(){
 const el=$('#diceHistory');if(!el)return;
 if(!dice.history.length){el.innerHTML='';return}
 el.innerHTML='<div class="h-head">Последние броски</div>'+dice.history.map(h=>
  '<div class="h-row"><span class="h-label">'+esc(h.label)+'</span><span class="h-vals">'+
  h.values.map(v=>(v>=h.diff||v===10)?'<b>'+v+'</b>':(v===1?'<i>'+v+'</i>':v)).join('·')+
  '</span><span class="h-succ '+(h.final>0?'':'fail')+'">'+h.final+'</span></div>').join('');}
function updatePoolPreview(){
 const el=$('#poolPreview');if(!el)return;
 const c=char();if(!c){el.textContent='';return}
 const pool=currentPool(),parts=[];
 if(rollSel.quality)parts.push(defName('qualities',rollSel.quality)+' '+(c.qualities[rollSel.quality]||0));
 const cb=document.querySelector('[data-rollsel="spec"]');
 if(rollSel.skill){
  const sv=(c.skills[rollSel.skill]??c.lore[rollSel.skill])||0;
  parts.push((defName('skills',rollSel.skill)||defName('lore',rollSel.skill))+' '+sv);
  const sp=skillSpecs(c,rollSel.skill);
  if(cb){cb.disabled=!sp.length;cb.parentElement.title=sp.length?'Специализации: '+sp.map(s=>s.specializationName).join(', '):'Специализация доступна с уровня 3 умения'}
 }else if(cb)cb.disabled=true;
 el.textContent=pool+' '+plural(pool,'кость','кости','костей')+(parts.length?' · '+parts.join(' + '):'');}

function animateRoll(pool,label,opts){
 dice.rolling=true;
 const f=$('#diceField'),r=$('#diceResult');
 if(r)r.innerHTML='';
 f.innerHTML=Array.from({length:pool},(_,i)=>'<div class="die dealing" style="animation-delay:'+(i*40)+'ms">'+dieSVG(6)+'</div>').join('');
 const els=[...f.children];els.forEach(el=>el.classList.add('shuffling'));
 const fin=Array.from({length:pool},r10);
 const iv=setInterval(()=>els.forEach(el=>el.innerHTML=dieSVG(irnd(10)+1)),75);
 setTimeout(()=>{
  clearInterval(iv);
  const res=computeRoll(fin,opts.diff,opts.spec);
  dice.last={label,pool,diff:opts.diff,spec:!!opts.spec,virtue:!!opts.virtue,values:fin,effortUsed:false,...res};
  els.forEach((el,i)=>{const v=fin[i],ok=v>=opts.diff||v===10;
   el.classList.remove('shuffling','dealing');el.classList.add('settled');
   el.style.setProperty('--tilt',((Math.random()*16)-8).toFixed(1)+'deg');
   el.innerHTML=dieSVG(v);
   el.classList.toggle('success',ok);el.classList.toggle('ten',v===10);el.classList.toggle('botch',v===1)});
  if(r)r.innerHTML=resultHTML(dice.last);
  dice.history.unshift(dice.last);if(dice.history.length>8)dice.history.pop();
  dice.rolling=false;renderDiceField();
 },650+Math.min(pool*30,550));}
function rollFromPanel(){
 if(dice.rolling)return;
 const pool=currentPool();
 if(pool<1){toast('Нужна хотя бы одна кость — поднимите качество, умение или доп. кости.',1);return}
 const cb=document.querySelector('[data-rollsel="spec"]');
 animateRoll(pool,rollLabel(),{diff:rollSel.diff,spec:rollSel.spec&&!(cb&&cb.disabled)});}
function quickRoll(type,id){
 if(dice.rolling)return;
 const c=char();
 if(type==='virtues'){const v=VIRTUES.find(x=>x.id===id);
  animateRoll(c.virtues[id]||1,v.name,{diff:rollSel.diff,virtue:true});return}
 if(type==='qualities'){rollSel.quality=id;rollSel.skill=QPARTNER[id]||''}
 else{rollSel.skill=id;rollSel.quality=PARTNER[id]||''}
 rollSel.spec=false;syncRollSelects();rollFromPanel();}
function syncRollSelects(){
 const q=document.querySelector('[data-rollsel="quality"]'),s=document.querySelector('[data-rollsel="skill"]');
 if(q)q.value=rollSel.quality;if(s)s.value=rollSel.skill;
 updatePoolPreview();}
function doEffort(){
 if(dice.rolling||!dice.last||dice.last.effortUsed||dice.last.virtue)return;
 const c=char();if(!c)return;
 const idx=effortCandidates(dice.last);
 if(!idx.length){toast('Перебрасывать нечего — все кости удачны.');return}
 c.stress=clamp(c.stress+1,0,12);
 if(c.stress>=resilience(c))toast('Стресс на пределе шкалы — психика на грани срыва.',1);
 idx.forEach(i=>{dice.last.values[i]=r10()});
 Object.assign(dice.last,computeRoll(dice.last.values,dice.last.diff,dice.last.spec),{effortUsed:true});
 dice.history[0]=dice.last;save();renderSheet();
 toast('Сверхусилие: переброшено костей — '+idx.length+'. Цена — 1 стресс.');}

function abilitiesHTML(c){
 const specs=c.specializations.map(sp=>{
  const sk=SKILLS.find(x=>x.id===sp.skillId)||LORE.find(x=>x.id===sp.skillId);
  return '<span class="tag">'+esc(sk?sk.name:'—')+' · '+esc(sp.specializationName)+
   '<button class="ibtn" data-act="spec-del" data-id="'+sp.id+'">'+icon('x',10)+'</button></span>'}).join('')
  ||'<span class="empty">Граней мастерства пока нет — откроются с уровня 3 умения</span>';
 return '<div class="panel"><div class="sec-title"><h2>'+icon('sword',15)+' Качества</h2><span class="ln"></span><span class="note">'+GROUPS.qualities.note+'</span></div>'+
  QUALITIES.map(d=>statRow('qualities',d,c.qualities[d.id])).join('')+'</div>'+
  '<div class="two-col"><div class="panel"><div class="sec-title"><h2>'+icon('sword',15)+' Навыки</h2><span class="ln"></span><span class="note">'+GROUPS.skills.note+'</span></div>'+
  SKILLS.map(d=>statRow('skills',d,c.skills[d.id])).join('')+'</div>'+
  '<div class="panel"><div class="sec-title"><h2>'+icon('book',15)+' Знания</h2><span class="ln"></span><span class="note">'+GROUPS.lore.note+'</span></div>'+
  LORE.map(d=>statRow('lore',d,c.lore[d.id])).join('')+'</div></div>'+
  '<div class="panel"><div class="sec-title"><h2>'+icon('quill',15)+' Специализации</h2><span class="ln"></span><span class="note">«10» дают три успеха</span></div>'+
  '<div class="tags">'+specs+'</div><div class="spec-add">'+
  '<select id="specSkill">'+[...SKILLS,...LORE].map(s=>'<option value="'+s.id+'">'+s.name+'</option>').join('')+'</select>'+
  '<input type="text" id="specName" maxlength="40" placeholder="грань мастерства — «длинные клинки»…">'+
  '<button class="btn" data-act="spec-add">'+icon('plus',13)+' Добавить</button></div></div>';}

function powersHTML(c){
 const rows=c.cursedPowers.length?c.cursedPowers.map(pw=>{
  const def=POWERS[pw.powerId];
  return '<div class="power-row"><div class="pr-main">'+
   '<button class="power-name" data-act="power-edit" data-id="'+pw.id+'">'+esc(def.name)+'</button>'+
   pipsStatic(pw.level,5,true)+
   '<span class="stat-ctl" style="opacity:1">'+
   '<button class="ibtn" data-act="power-lvl" data-d="-1" data-id="'+pw.id+'" '+(pw.level<=1?'disabled':'')+'>'+icon('minus',11)+'</button>'+
   '<button class="ibtn" data-act="power-lvl" data-d="1" data-id="'+pw.id+'" '+(pw.level>=5?'disabled':'')+'>'+icon('plus',11)+'</button>'+
   '<button class="ibtn" data-act="power-del" data-id="'+pw.id+'" title="Отринуть силу">'+icon('trash',12)+'</button></span></div>'+
   '<div class="pr-manif">'+(pw.manifestations.map(m=>'<span class="tag">'+esc(m)+'</span>').join('')||'<span class="empty">Проявления не выбраны</span>')+'</div></div>'}).join('')
  :'<p class="empty">Кровь пока чиста. Так ли это надолго?</p>';
 return '<div class="panel"><div class="sec-title"><h2>'+icon('drop',15)+' Проклятые силы</h2><span class="ln"></span><span class="note">уровень · проявления</span></div>'+rows+
  '<div style="margin-top:12px"><button class="btn" data-act="power-modal">'+icon('plus',13)+' Принять силу</button></div></div>';}

function equipHTML(c){
 const rows=c.equipment.length?c.equipment.map(it=>
  '<div class="equip-row"><span class="eq-qty">'+
  '<button class="ibtn" data-act="eq-qty" data-d="-1" data-id="'+it.id+'" '+(it.qty<=1?'disabled':'')+'>'+icon('minus',10)+'</button>'+
  '<b>×'+it.qty+'</b><button class="ibtn" data-act="eq-qty" data-d="1" data-id="'+it.id+'">'+icon('plus',10)+'</button></span>'+
  '<span class="eq-main"><span class="eq-name">'+esc(it.name)+'</span>'+(it.note?'<span class="eq-note">'+esc(it.note)+'</span>':'')+'</span>'+
  '<button class="ibtn" data-act="eq-del" data-id="'+it.id+'">'+icon('trash',12)+'</button></div>').join('')
  :'<p class="empty">Котомка пуста — и то ли это мудрость, то ли бедность.</p>';
 return '<div class="panel"><div class="sec-title"><h2>'+icon('hourglass',15)+' Снаряжение</h2><span class="ln"></span><span class="note">что станет важным</span></div>'+rows+
  '<div style="margin-top:12px"><button class="btn" data-act="equip-modal">'+icon('plus',13)+' Положить в котомку</button></div></div>';}

function charStripHTML(){
 const prof=state.activeProfileId;
 const chars=state.characters.filter(c=>(c.profileId||state.profiles[0].id)===prof);
 if(!chars.length)return '<div class="char-strip"><span class="empty">У этого профиля пока нет персонажей.</span>'+
  '<button class="char-tab" data-act="char-modal" style="border-style:dashed">'+icon('plus',13)+' Новый странник</button>'+
  '<button class="char-tab" data-act="import">'+icon('dl',14)+' Из JSON</button></div>';
 return '<div class="char-strip">'+chars.map(c=>
  '<button class="char-tab '+(c.id===state.activeCharId?'active':'')+'" data-act="char-select" data-id="'+c.id+'">'+
  '<span>'+esc(c.name)+'</span><span class="ct-xp">'+icon('gem',11)+c.xp+'</span>'+
  (c.id===state.activeCharId?'<span class="ibtn ct-del" data-act="char-del" data-id="'+c.id+'" role="button">'+icon('x',11)+'</span>':'')+
  '</button>').join('')+
  '<button class="char-tab" data-act="char-export" title="Выгрузить активного персонажа в JSON">'+icon('dl',14)+' Выгрузить</button>'+
  '<button class="char-tab" data-act="import" title="Добавить персонажа из JSON">'+icon('dl',14)+' Из JSON</button>'+
  '<button class="char-tab" data-act="char-modal" style="border-style:dashed">'+icon('plus',13)+' Новый странник</button></div>';}
function pregenBannerHTML(c){
 return '<div class="pregen-banner panel"><span class="pb-tag">Преген</span>'+
  '<input type="text" id="pgName" value="'+esc(c.name)+'" maxlength="40" aria-label="Имя прегена">'+
  '<input type="text" id="pgNote" value="'+esc(c.pregenNote||'')+'" maxlength="80" placeholder="роль в истории…">'+
  '<button class="btn" data-act="pg-transfer">'+icon('users',13)+' Передать игроку</button>'+
  '<button class="ibtn" data-act="pg-del">'+icon('trash',12)+'</button>'+
  '<button class="btn btn-ghost" data-act="pg-done">в кабинет</button></div>';}

function renderSheet(){
 const c=char();
 if(!c){$('#view-sheet').innerHTML='<p class="empty">Скитальцев нет.</p>';return}
 $('#view-sheet').innerHTML=(editingPregen?pregenBannerHTML(c):charStripHTML())+
  '<div class="sheet-grid">'+asideHTML(c)+'<div class="sheet-main">'+
  personaHTML(c)+rollPanelHTML()+abilitiesHTML(c)+powersHTML(c)+equipHTML(c)+'</div></div>';
 renderDiceField();updatePoolPreview();}

function powerDetailHTML(){
 const p=POWERS[pwUI.powerId];
 if(!p)return '<p class="empty">Выберите путь, по которому пойдёт ваша кровь.</p>';
 const rows=p.manif.map(([lv,n,d])=>{
  const on=pwUI.picked.includes(n);
  return '<label class="mrow '+(on?'on':'')+'" data-act="pw-toggle" data-name="'+esc(n)+'"><span class="mbox"></span>'+
   '<span class="mlv">'+'◆'.repeat(lv)+'</span><span><b>'+esc(n)+'</b><p>'+esc(d)+'</p></span></label>'}).join('');
 const cnt=pwUI.picked.length,over=cnt>pwUI.level;
 return '<p>'+esc(p.flavor)+'</p>'+
  '<div class="pw-lvl"><span class="lbl">Уровень силы</span>'+pipsStatic(pwUI.level,5,true)+
  '<span style="display:flex;gap:4px">'+[1,2,3,4,5].map(n=>
   '<button class="ibtn" style="width:26px" data-act="pw-lvl" data-l="'+n+'" '+(n===pwUI.level?'style="width:26px;border-color:var(--gold);color:var(--gold)"':'')+'>'+n+'</button>').join('')+'</span></div>'+
  '<div class="pw-count '+(over?'over':'')+'">Отмечено проявлений: '+cnt+' · уровень силы позволяет держать активными '+pwUI.level+(over?' — сверх уровня считаются сторонними и дороже в опыте':'')+'</div>'+rows;}
/* === КОНЕЦ ФАЙЛА: app-b.js === */
