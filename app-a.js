/* ═ Скиталец · app-a.js — утилиты, хранилище, расчёты, кошелёк опыта ═ */
'use strict';
window.__skit=(window.__skit||[]);window.__skit.push('app-a');

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).toLowerCase().replace(/ё/g,'е');
const uid=p=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function plural(n,a,b,c){n=Math.abs(n)%100;const d=n%10;if(n>10&&n<20)return c;if(d>1&&d<5)return b;if(d===1)return a;return c}
const fmtDate=ts=>new Date(ts).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
const r10=()=>1+Math.floor(Math.random()*10);
const irnd=n=>Math.floor(Math.random()*n);
const pick=a=>a[irnd(a.length)];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=irnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function download(name,text){
 const blob=new Blob([text],{type:'application/json'});
 const a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),500);}

const ICONS={
 die:'<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="M12 7.5v9M8 11l4-3.5 4 3.5" stroke-linecap="round"/>',
 eye:'<path d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
 book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
 drop:'<path d="M12 3.5s6.5 7.2 6.5 11.3a6.5 6.5 0 0 1-13 0C5.5 10.7 12 3.5 12 3.5z"/>',
 flame:'<path d="M12 2.5c1 4-4.5 5.5-4.5 10a4.5 4.5 0 0 0 9 0c0-2.5-1-4-2-5.5-.3 1.4-1 2.2-2 2.5.6-2.4.2-4.8-.5-7z"/>',
 gem:'<path d="M12 2.5l6.5 6.5L12 21.5 5.5 9z"/><path d="M5.5 9h13"/><path d="M12 2.5 9 9l3 12.5L15 9z"/>',
 quill:'<path d="M20.5 3.5c-7 .5-11.5 4-13.5 10L4 20.5l7-3c6-2 9-7 9.5-14z"/><path d="M8 16l7.5-7.5"/>',
 sword:'<path d="M19.5 4.5 9.5 14.5"/><path d="M19.5 4.5 19 9m.5-4.5L15 5"/><path d="M7.5 13.5l3 3"/><path d="M9.5 16.5 5 21l-2-2 4.5-4.5z"/>',
 heart:'<path d="M12 20.5S4 15 4 9.5A4.5 4.5 0 0 1 12 6.7 4.5 4.5 0 0 1 20 9.5c0 5.5-8 11-8 11z"/>',
 hourglass:'<path d="M6 3h12M6 21h12"/><path d="M8 3v3l4 5 4-5V3M8 21v-3l4-5 4 5v3"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 minus:'<path d="M5 12h14"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 trash:'<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5M14 11v5.5"/>',
 dl:'<path d="M12 4v11M7.5 11l4.5 4.5L16.5 11"/><path d="M5 20h14" stroke-linecap="round"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5" stroke-linecap="round"/><circle class="f" cx="12" cy="8" r="1.1"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3.5"/><path d="M21 21v-2a4 4 0 0 0-3-3.9"/><path d="M15 3.6a3.5 3.5 0 0 1 0 6.8"/>'};
function icon(n,s=16){return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+(ICONS[n]||'')+'</svg>'}

/* ── состояние UI ── */
const STORE_KEY='skitalec_ozhivshie_koshmary_v2';
const LEGACY_KEY='skitalec_dark_times_v1';
let state,view='sheet',selectedPart='torso',editingPregen=null;
let codexUI={q:'',cat:'all'},xpUI={type:'gain',filter:'all',amount:'',reason:''};
let rollSel={quality:'',skill:'',bonus:0,diff:6,spec:false};
let dice={rolling:false,last:null,history:[]};
let pwUI={powerId:null,level:1,picked:[],editing:null};
let mobUI=null,toolUI=null,pgKind='mortal',pendingImport=null;

/* ── расчёты ── */
const damnation=c=>clamp(10-(+c.humanity||6),0,10);
const maxBlood=c=>5+damnation(c)*2;
const resilience=c=>clamp(((c.virtues&&c.virtues.composure)||0)+((c.virtues&&c.virtues.courage)||0)+2,0,12);
const ku=c=>11+(c.qualities.agility||0)+Math.ceil((c.qualities.intuition||0)/2);
const initiative=c=>(c.qualities.agility||0)+(c.qualities.intellect||0);
const stepSpd=c=>3+Math.floor((c.qualities.agility||0)/2);
const runSpd=c=>6+(c.qualities.agility||0);
const dashSpd=c=>10+(c.qualities.agility||0)*3;
const suggestLimit=c=>51+35*(c.qualities.endurance||0);

function emptyWounds(){return{light:0,heavy:0}}
function recalcTotal(c){
 const t={light:0,heavy:0};
 PARTS.forEach(p=>{t.light+=c.wounds[p.id].light;t.heavy+=c.wounds[p.id].heavy});
 c.wounds.total=t;}

function defaultCharacter(name){
 const c={id:uid('char'),name:name||'Безымянный',profileId:'',pregenNote:'',
  qualities:Object.fromEntries(QUALITIES.map(q=>[q.id,0])),
  skills:Object.fromEntries(SKILLS.map(s=>[s.id,0])),
  lore:Object.fromEntries(LORE.map(l=>[l.id,0])),
  specializations:[],virtues:{conscience:2,composure:2,selfControl:2,courage:2},
  cursedPowers:[],
  wounds:{total:emptyWounds(),head:emptyWounds(),torso:emptyWounds(),leftArm:emptyWounds(),rightArm:emptyWounds(),leftLeg:emptyWounds(),rightLeg:emptyWounds()},
  equipment:[],humanity:6,woundLimit:51,blood:0,stress:0,xp:0,vice:'',essence:'',mask:'',notes:'',
  portrait:'',token:'',creating:true};
 c.blood=maxBlood(c);return c;}

function strToEq(s){
 s=String(s).trim();if(!s)return null;
 let name=s,qty=1,note='';
 const di=s.indexOf(' — ');
 if(di>0){note=s.slice(di+3).trim();s=s.slice(0,di)}
 const m=s.match(/^(.*?)\s*[×xX]\s*(\d+)$/);
 if(m){name=m[1];qty=clamp(+m[2],1,99)}
 name=name.trim();if(!name)return null;
 return {id:uid('eq'),name,qty,note};}
const eqToStr=it=>it.name+(it.qty>1?' ×'+it.qty:'')+(it.note?' — '+it.note:'');
function baseRightSafe(c){return clamp(((c.virtues&&c.virtues.conscience)||2)+((c.virtues&&c.virtues.selfControl)||2)+2,1,10)}

const okImg=v=>typeof v==='string'&&v.startsWith('data:image');
function normalizeCharacter(src){
 src=src&&typeof src==='object'?src:{};
 const d=defaultCharacter(typeof src.name==='string'?src.name:undefined);
 const c={...d,...src,id:src.id||d.id};
 ['qualities','skills','lore'].forEach(k=>{c[k]={...d[k],...(src[k]||{})}});
 c.virtues={...d.virtues,...(src.virtues||{})};
 QUALITIES.forEach(q=>c.qualities[q.id]=clamp(Math.round(+c.qualities[q.id])||0,0,6));
 SKILLS.forEach(s=>c.skills[s.id]=clamp(Math.round(+c.skills[s.id])||0,0,5));
 LORE.forEach(l=>c.lore[l.id]=clamp(Math.round(+c.lore[l.id])||0,0,5));
 VIRTUES.forEach(v=>c.virtues[v.id]=clamp(Math.round(+c.virtues[v.id])||2,1,5));
 c.humanity=clamp(Math.round(+c.humanity)||baseRightSafe(c),0,10);
 c.woundLimit=clamp(Math.round(+c.woundLimit)||suggestLimit(c),20,999);
 c.wounds={...d.wounds};
 PARTS.forEach(p=>{const w=(src.wounds||{})[p.id]||{};
  c.wounds[p.id]={light:clamp(Math.round(+w.light)||0,0,99),heavy:clamp(Math.round(+w.heavy)||0,0,99)}});
 c.specializations=(Array.isArray(src.specializations)?src.specializations:[])
  .filter(s=>s&&s.skillId&&s.specializationName)
  .map(s=>({id:s.id||uid('sp'),skillId:String(s.skillId),specializationName:String(s.specializationName).slice(0,40)}));
 c.cursedPowers=(Array.isArray(src.cursedPowers)?src.cursedPowers:[])
  .filter(p=>p&&POWERS[p.powerId])
  .map(p=>({id:p.id||uid('pw'),powerId:p.powerId,level:clamp(Math.round(+p.level)||1,1,5),
   manifestations:(Array.isArray(p.manifestations)?p.manifestations:[]).filter(m=>typeof m==='string').slice(0,20)}));
 c.equipment=(Array.isArray(src.equipment)?src.equipment:[])
  .map(it=>typeof it==='string'?strToEq(it):{id:it.id||uid('eq'),name:String(it.name||'').slice(0,60).trim(),qty:clamp(Math.round(+it.qty)||1,1,99),note:String(it.note||'').slice(0,80)})
  .filter(it=>it&&it.name);
 c.blood=clamp(Math.round(+c.blood)||0,0,maxBlood(c));
 c.stress=clamp(Math.round(+c.stress)||0,0,12);
 c.xp=Math.round(+c.xp)||0;
 c.vice=VICES[src.vice]?src.vice:'';
 c.essence=ESSENCES.some(e=>e[0]===src.essence)?src.essence:'';
 c.mask=ESSENCES.some(e=>e[0]===src.mask)?src.mask:'';
 c.notes=String(src.notes||'').slice(0,2000);
 c.profileId=typeof src.profileId==='string'?src.profileId:'';
 c.pregenNote=String(src.pregenNote||'').slice(0,120);
 /* портрет до 512px, токен 128×128 */
 c.portrait=okImg(src.portrait)&&src.portrait.length<400000?src.portrait:'';
 c.token=okImg(src.token)&&src.token.length<120000?src.token:'';
 /* старые сохранения создавались до режима создания — они уже «за созданием» */
 c.creating=typeof src.creating==='boolean'?src.creating:false;
 recalcTotal(c);return c;}

function normalizeLog(e){
 if(!e||typeof e!=='object')return null;
 let type=e.type,amount=Math.abs(Math.round(+e.amount)||0);
 if(!amount&&e.delta){amount=Math.abs(Math.round(+e.delta)||0);if(type!=='+'&&type!=='-')type=+e.delta>0?'+':'-'}
 if(type==='gain'||type==='spend')type=type==='gain'?'+':'-';
 if(type!=='+'&&type!=='-')type='+';
 return {id:e.id||uid('xp'),charId:String(e.charId||''),ts:+e.ts||Date.now(),type,amount,
  reason:String(e.reason||e.note||'').slice(0,120)};}

function defaultMob(){
 return {id:uid('mob'),name:'Безымянная тварь',type:'monster',being:'',desc:'',tactics:'',loot:'',size:'medium',locId:'',
  quals:{strength:3,agility:2,accuracy:2,endurance:3,charisma:0,cunning:1,perception:2,intellect:0,intuition:2},
  skills:Object.assign(Object.fromEntries(SKILLS.map(s=>[s.id,0])),{fencing:2,athletics:2,vigilance:2}),
  woundLimit:80,attacks:[{id:uid('atk'),name:'Когти',pool:4,damage:'к10 — тяжёлые раны',notes:''}],abilities:[]};}
function normalizeMob(m){
 const d=defaultMob();m=m&&typeof m==='object'?m:{};
 const out={...d,...m,id:m.id||d.id};
 out.name=String(out.name||'Безымянная').slice(0,60)||'Безымянная';
 out.type=['monster','enemy','npc'].includes(out.type)?out.type:'monster';
 out.being=String(out.being||'').slice(0,40);
 out.desc=String(out.desc||'').slice(0,1200);
 out.tactics=String(out.tactics||'').slice(0,600);
 out.loot=String(out.loot||'').slice(0,120);
 out.size=SIZES.some(s=>s.id===out.size)?out.size:'medium';
 out.locId=typeof out.locId==='string'?out.locId:'';
 out.quals={...d.quals,...(m.quals||{})};
 out.skills={...d.skills,...(m.skills||{})};
 QUALITIES.forEach(q=>out.quals[q.id]=clamp(Math.round(+out.quals[q.id])||0,0,12));
 SKILLS.forEach(s=>out.skills[s.id]=clamp(Math.round(+out.skills[s.id])||0,0,9));
 out.woundLimit=clamp(Math.round(+out.woundLimit)||80,1,999);
 out.attacks=(Array.isArray(out.attacks)?out.attacks:[]).slice(0,10).map(a=>({
  id:a&&a.id?a.id:uid('atk'),name:String((a&&a.name)||'Атака').slice(0,50),
  pool:clamp(Math.round(+(a&&a.pool))||0,0,20),
  damage:String((a&&a.damage)||'').slice(0,80),notes:String((a&&a.notes)||'').slice(0,80)}));
 out.abilities=(Array.isArray(out.abilities)?out.abilities:[]).filter(x=>typeof x==='string'&&x.trim()).map(x=>x.slice(0,80)).slice(0,12);
 return out;}
const mobKU=m=>{const s=SIZES.find(x=>x.id===m.size)||SIZES[2];return s.c+(m.quals.agility||0)+Math.ceil((m.quals.intuition||0)/2)};
const mobInit=m=>(m.quals.agility||0)+(m.quals.intellect||0);

function normalizeState(d){
 d=d&&typeof d==='object'?d:{};
 let profiles=(Array.isArray(d.profiles)?d.profiles:[]).filter(p=>p&&typeof p==='object')
  .map(p=>({id:p.id||uid('prof'),name:String(p.name||'Игрок').slice(0,30)}));
 if(!profiles.length)profiles=[{id:'prof_table',name:'Общий стол'}];
 const pids=new Set(profiles.map(p=>p.id));
 const defP=profiles[0].id;
 let locations=(Array.isArray(d.locations)?d.locations:[]).filter(l=>l&&typeof l==='object')
  .map(l=>({id:typeof l.id==='string'&&l.id?l.id:uid('loc'),
   name:String(l.name||'Локация').slice(0,60)||'Локация',note:String(l.note||'').slice(0,200)}));
 const seen=new Set();
 locations=locations.filter(l=>!seen.has(l.id)&&seen.add(l.id));
 const lids=new Set(locations.map(l=>l.id));
 let characters=(d.characters||[]).map(c=>{const n=normalizeCharacter(c);if(!pids.has(n.profileId))n.profileId=defP;return n});
 if(!characters.length)characters=[normalizeCharacter({name:'Безымянный',profileId:defP})];
 const pregens=(d.pregens||[]).map(c=>{const n=normalizeCharacter(c);if(!pids.has(n.profileId))n.profileId=defP;return n});
 const bestiary=(d.bestiary||[]).map(normalizeMob);
 bestiary.forEach(m=>{if(m.locId&&!lids.has(m.locId))m.locId=''});
 const ids=new Set(characters.map(c=>c.id));
 const activeProfile=pids.has(d.activeProfileId)?d.activeProfileId:profiles[0].id;
 const profChars=characters.filter(c=>c.profileId===activeProfile);
 const activeChar=ids.has(d.activeCharId)?d.activeCharId:(profChars[0]&&profChars[0].id)||characters[0].id;
 return {version:3,profiles,activeProfileId:activeProfile,characters,activeCharId:activeChar,pregens,bestiary,locations,
  log:(d.log||[]).map(normalizeLog).filter(l=>l&&ids.has(l.charId))};}

function migrateLegacy(){
 try{
  const raw=localStorage.getItem(LEGACY_KEY);if(!raw)return null;
  const d=JSON.parse(raw);if(!d||!Array.isArray(d.characters))return null;
  return normalizeState(d);
 }catch(e){return null}}

function seed(){
 const prof={id:'prof_table',name:'Общий стол'};
 const c=defaultCharacter('Фрейя');c.profileId=prof.id;
 c.creating=false;
 c.vice='wrath';c.essence='Защитник';c.mask='Бунтарь';
 Object.assign(c.qualities,{agility:1,accuracy:1,endurance:1,perception:1,intuition:1});
 Object.assign(c.skills,{athletics:1,vigilance:1,survival:1,stealth:1,fencing:1});
 Object.assign(c.lore,{mysticism:2,medicine:1,animals:1});
 c.humanity=6;c.woundLimit=86;c.blood=maxBlood(c);
 c.cursedPowers=[
  {id:uid('pw'),powerId:'beastStrength',level:1,manifestations:['Недремлющая мощь']},
  {id:uid('pw'),powerId:'nightbirdWail',level:1,manifestations:['Проклятая быстрота']}];
 c.equipment=[
  {id:uid('eq'),name:'Длинный меч',qty:1,note:'отцовский — не подведёт'},
  {id:uid('eq'),name:'Кожаный дублет',qty:1,note:''},
  {id:uid('eq'),name:'Фляга',qty:2,note:'на чёрный день'}];
 c.wounds.torso.light=1;c.xp=6;recalcTotal(c);
 return {version:3,profiles:[prof],activeProfileId:prof.id,characters:[c],activeCharId:c.id,pregens:[],bestiary:[],locations:[],log:[
  {id:uid('xp'),charId:c.id,ts:Date.now()-2*864e5,type:'+',amount:6,reason:'За правду о колодце на перепутье'},
  {id:uid('xp'),charId:c.id,ts:Date.now()-864e5,type:'-',amount:2,reason:'Обучение у старого фехтовальщика'}]};}

let migrated=false;
function loadState(){
 try{
  const raw=localStorage.getItem(STORE_KEY);
  if(!raw){
   const mig=migrateLegacy();
   if(mig){migrated=true;return mig}
   return seed();}
  const d=JSON.parse(raw);
  if(!d||!Array.isArray(d.characters))return seed();
  return normalizeState(d);
 }catch(e){console.warn('Летопись повреждена',e);return seed()}}
function save(){
 try{localStorage.setItem(STORE_KEY,JSON.stringify(state))}
 catch(e){toast('Память браузера переполнена — вероятно, портрет слишком велик. Уменьшите его или удалите лишние изображения.',1)}}
function char(){
 if(editingPregen){const p=state.pregens.find(x=>x.id===editingPregen);if(p)return p;editingPregen=null}
 return state.characters.find(c=>c.id===state.activeCharId);}

/* ── кошелёк опыта: списание за повышения ── */
function chargeXP(c,mult,newVal,label){
 if(!c||c.creating)return true;
 const cost=Math.max(1,Math.round(mult))*Math.max(1,newVal);
 if(c.xp<cost){
  toast('Не хватает опыта: нужно '+cost+' '+plural(cost,'очко','очка','очков')+' ('+esc(label)+' до '+newVal+'), доступно '+c.xp+'. Сказитель выдаст в конце сцены — вкладка «Опыт».',1);
  return false;}
 c.xp-=cost;
 state.log.push({id:uid('xp'),charId:c.id,ts:Date.now(),type:'-',amount:cost,reason:label+' — до уровня '+newVal});
 save();
 toast('−'+cost+' XP: '+label+' до '+newVal+'. Осталось: '+c.xp+'.');
 return true;}
/* видовая сила — из начального списка порока, сторонняя — прочие */
const powerMult=(c,powerId)=>(c.vice&&VICES[c.vice]&&VICES[c.vice].start.includes(powerId))?XP_MULT.powerKind[1]:XP_MULT.powerSide[1];

/* ── тема ── */
function themeIcon(){const b=$('#themeBtn');if(b)b.innerHTML=document.documentElement.getAttribute('data-t')==='l'?'☾':'☀'}
function toggleTheme(){
 const el=document.documentElement,cur=el.getAttribute('data-t');
 const next=cur==='l'?'d':'l';
 el.setAttribute('data-t',next);
 try{localStorage.setItem('skit_theme',next)}catch(e){}
 themeIcon();}

/* ── тосты и модалки ── */
function toast(msg,err){
 const t=document.createElement('div');
 t.className='toast'+(err?' err':'');t.textContent=msg;
 $('#toast-root').appendChild(t);
 setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),320)},3000);}
function openModal(title,bodyHTML){
 $('#modal-root').innerHTML=
  '<div class="mb" data-mb="1"><div class="modal" role="dialog" aria-modal="true">'+
  '<header><h3>'+title+'</h3><button class="ibtn" data-act="modal-close" title="Закрыть">'+icon('x',13)+'</button></header>'+
  '<div class="modal-body">'+bodyHTML+'</div></div></div>';
 document.body.classList.add('locked');}
function closeModal(){$('#modal-root').innerHTML='';document.body.classList.remove('locked');mobUI=null;toolUI=null}
function armButton(btn){
 if(btn.dataset.armed){delete btn.dataset.armed;btn.classList.remove('armed');return true}
 btn.dataset.armed='1';btn.classList.add('armed');
 const old=btn.innerHTML;btn.innerHTML='точно?';
 setTimeout(()=>{if(!btn.isConnected||!btn.dataset.armed)return;
  delete btn.dataset.armed;btn.classList.remove('armed');btn.innerHTML=old},2600);
 return false;}
/* === КОНЕЦ ФАЙЛА: app-a.js === */
