/* ═ Скиталец · app-f.js — Яндекс.Диск: подключение, сохранение, загрузка, справка ═ */
'use strict';
window.__skit.push('app-f');

const YD_CLIENT_ID='150444f953df4afe943b9ec547e1512c';
const YD_TOKEN_KEY='skit_yd_token';
const YD_FOLDER_KEY='skit_yd_folder';

const ydToken=()=>{try{return localStorage.getItem(YD_TOKEN_KEY)||''}catch(e){return ''}};
const ydFolder=()=>{try{return localStorage.getItem(YD_FOLDER_KEY)||'Скиталец-летопись'}catch(e){return 'Скиталец-летопись'}};
function ydSetFolder(v){
 try{localStorage.setItem(YD_FOLDER_KEY,String(v||'').replace(/^\/+|\/+$/g,'').slice(0,60)||'Скиталец-летопись')}catch(e){}}
const ydFolderPath=()=>'disk:/Приложения/'+ydFolder();
const ydFilePath=()=>ydFolderPath()+'/skitalec-letopis.json';

async function ydApi(url,opts){
 const r=await fetch(url,Object.assign({},opts||{},{
  headers:Object.assign({'Authorization':'OAuth '+ydToken()},(opts&&opts.headers)||{})}));
 if(!r.ok){
  let msg='HTTP '+r.status;
  try{const j=await r.json();if(j&&(j.message||j.description))msg=j.message||j.description}catch(e){}
  throw new Error(msg);}
 return await r.json();}

/* PKCE: приложение без секрета подтверждает себя парой challenge/verifier */
function b64url(bytes){
 let s='';new Uint8Array(bytes).forEach(b=>{s+=String.fromCharCode(b)});
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function ydChallenge(){
 const raw=new Uint8Array(32);crypto.getRandomValues(raw);
 const verifier=b64url(raw.buffer);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
 return {verifier,challenge:b64url(digest)};}
let ydVerifier='';

function openYDModal(){
 const tok=ydToken();
 openModal('Яндекс.Диск',
  (tok
   ?'<p><b style="color:var(--gold)">Подключено.</b> Свиток лежит в папке приложения на вашем Диске и переживёт чистку браузера.</p>'
   :'<p>Сейчас летопись живёт только в этом браузере. Подключите Диск — и свиток (персонажи, твари, локации, портреты) можно сохранять в облако одним нажатием.</p>')
  +'<div class="form-row"><label for="ydFolder">Папка на Диске (внутри «Приложения»)</label>'
  +'<input type="text" id="ydFolder" value="'+esc(ydFolder())+'" maxlength="60">'
  +'<span class="empty">Совпадает с названием приложения, которое вы указали на Яндексе. Меняется только до первой записи.</span></div>'
  +'<div class="modal-actions" style="justify-content:flex-start">'
  +(tok
   ?'<button class="btn btn-primary" data-act="yd-save">'+icon('dl',13)+' Сохранить летопись на Диск</button>'
    +'<button class="btn" data-act="yd-load">'+icon('dl',13)+' Загрузить с Диска</button>'
   :'<button class="btn btn-primary" data-act="yd-connect">Подключить Диск</button>')
  +'</div>'
  +'<p class="empty">Путь к файлу: '+esc(ydFilePath())+'</p>'
  +(tok?'<div class="modal-actions" style="justify-content:flex-end"><button class="btn btn-danger" data-act="yd-disconnect">Отключить Диск</button></div>':'')
  +'<p class="empty" style="margin-top:14px">Подключение: откроется окно Яндекса — нажмите «Разрешить», скопируйте код со страницы и вставьте его в окошко. Токен хранится только в этом браузере; инструменту доступна лишь своя папка приложений, а не весь Диск.</p>');}

function openYDCodeModal(){
 openModal('Подключение: код подтверждения',
  '<p>1. В открывшемся окне Яндекса нажмите «Разрешить».<br>'
  +'2. Скопируйте код со страницы подтверждения.<br>'
  +'3. Вставьте его сюда.</p>'
  +'<div class="form-row"><label for="ydCode">Код из окна Яндекса</label>'
  +'<input type="text" id="ydCode" autocomplete="off" placeholder="y0_AgAAAA…"></div>'
  +'<div class="modal-actions"><button class="btn btn-primary" data-act="yd-code-go">Подключить</button></div>'
  +'<p class="empty">Окно не открылось или закрылось? <button class="link-btn" data-act="yd-connect">Открыть снова</button> · Другой путь: <button class="link-btn" data-act="yd-manual">вставить токен вручную</button></p>');
 const i=$('#ydCode');if(i)i.focus();}

function openYDManualModal(){
 openModal('Подключение: токен вручную',
  '<p>Откройте <a href="https://oauth.yandex.ru/authorize?response_type=token&client_id='+YD_CLIENT_ID+'" target="_blank" rel="noopener">страницу разрешения</a>, нажмите «Разрешить» и скопируйте показанный токен целиком.</p>'
  +'<div class="form-row"><label for="ydTokIn">Токен (начинается с y0_)</label>'
  +'<textarea id="ydTokIn" rows="3" style="width:100%;resize:vertical" placeholder="y0_AgAAAA…"></textarea></div>'
  +'<div class="modal-actions"><button class="btn btn-primary" data-act="yd-token-go">Подключить</button></div>');}

function skitYDConnect(){
 (async()=>{
  try{
   const ch=await ydChallenge();
   ydVerifier=ch.verifier;
   try{sessionStorage.setItem('skit_yd_verifier',ch.verifier)}catch(e){}
   window.open('https://oauth.yandex.ru/authorize?response_type=code&client_id='+YD_CLIENT_ID
    +'&code_challenge='+ch.challenge+'&code_challenge_method=S256',
    'skit_oauth','width=520,height=640');
   openYDCodeModal();
  }catch(e){toast('Не удалось начать подключение: '+e.message,1)}
 })();}
async function ydFinishWithCode(){
 const inp=$('#ydCode'),code=((inp&&inp.value)||'').trim();
 if(!code){toast('Вставьте код из окна Яндекса.',1);return}
 try{
  const verifier=(function(){try{return sessionStorage.getItem('skit_yd_verifier')||''}catch(e){return ''}})()||ydVerifier;
  const r=await fetch('https://oauth.yandex.ru/token',{
   method:'POST',
   headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams({grant_type:'authorization_code',code:code,client_id:YD_CLIENT_ID,code_verifier:verifier}).toString()});
  const j=await r.json();
  if(!r.ok||!j.access_token)throw new Error(j.error_description||j.description||j.error||('HTTP '+r.status));
  localStorage.setItem(YD_TOKEN_KEY,j.access_token);
  try{sessionStorage.removeItem('skit_yd_verifier')}catch(e){}
  closeModal();openYDModal();
  toast('Яндекс.Диск подключён.');
 }catch(e){toast('Обмен кода не удался: '+e.message,1)}}
function ydFinishWithToken(){
 const t=($('#ydTokIn')?.value||'').trim();
 if(!t){toast('Вставьте токен.',1);return}
 localStorage.setItem(YD_TOKEN_KEY,t);
 closeModal();openYDModal();toast('Токен сохранён.');}
async function ydDisconnect(){
 const t=ydToken();
 try{localStorage.removeItem(YD_TOKEN_KEY)}catch(e){}
 if(t){try{await fetch('https://oauth.yandex.ru/revoke_token',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({client_id:YD_CLIENT_ID,token:t}).toString()})}catch(e){}}
 openYDModal();toast('Диск отключён.');}

async function skitYDSave(){
 if(!ydToken()){openYDModal();return}
 try{
  /* папка приложения, если её ещё нет, создаётся сама; «уже существует» — не ошибка для нас */
  try{await ydApi('https://cloud-api.yandex.net/v1/disk/resources?path='+encodeURIComponent(ydFolderPath()),{method:'PUT'})}catch(e){}
  const j=await ydApi('https://cloud-api.yandex.net/v1/disk/resources/upload?path='+encodeURIComponent(ydFilePath())+'&overwrite=true');
  if(!j.href)throw new Error('Диск не дал ссылку загрузки');
  const payload=JSON.stringify(exportPayload(state.characters,true),null,2);
  const r=await fetch(j.href,{method:'PUT',body:payload});
  if(!r.ok)throw new Error('HTTP '+r.status);
  toast('Летопись сохранена на Диск: «'+ydFolder()+'».');
 }catch(e){toast('Сохранить не удалось: '+e.message,1)}}
async function skitYDLoad(){
 if(!ydToken()){openYDModal();return}
 try{
  const j=await ydApi('https://cloud-api.yandex.net/v1/disk/resources/download?path='+encodeURIComponent(ydFilePath()));
  if(!j.href)throw new Error('Диск не дал ссылку');
  const r=await fetch(j.href);
  if(!r.ok)throw new Error('HTTP '+r.status);
  const text=await r.text();
  /* дальше работает обычный импорт: предложит «заменить» или «добавить» */
  handleImportText(text);
 }catch(e){toast('Загрузить не удалось: '+e.message+' — возможно, свитка ещё нет на Диске (сначала сохраните).',1)}}

/* ── справка: раздел «Облако» для всех пользователей ── */
(function extendHelp(){
 if(typeof HELP==='undefined'||!Array.isArray(HELP))return;
 HELP.push({id:'cloud',icon:'dl',title:'Облако: Яндекс.Диск',
  intro:'Свиток летописи можно хранить в облаке — он переживёт чистку браузера и переезд на другой компьютер.',
  items:[
   ['Что уезжает на Диск','Весь архив этого устройства одним файлом: все персонажи всех профилей — с портретами, токенами и хрониками опыта, — а также прегены, твари и локации. У Сказителя это вся сессия; у игрока — его собственные герои.'],
   ['Подключить (один раз)','Кнопка «☁ Яндекс.Диск» в подвале страницы → «Подключить Диск» → в открывшемся окне Яндекса «Разрешить» → скопировать код со страницы → вставить в окошко инструмента. Токен живёт только в этом браузере; при необходимости — «Отключить» и заново.'],
   ['Сохранить и загрузить','«Сохранить летопись на Диск» — архив уезжает в папку «Приложения / Скиталец-летопись» одним файлом. «Загрузить с Диска» — свиток возвращается через знакомый импорт: выберите «Заменить летопись целиком» или «Добавить к текущим».'],
   ['Чей Диск, чьи данные','Каждый подключает свой личный Яндекс — персонажи не смешиваются, и никто не видит чужого. Инструменту доступна только своя папка приложений, а не весь Диск. Чтобы герой игрока попал в архив Сказителя — «Выгрузить» у игрока, «Из JSON» у Сказителя, затем сохранить на Диск.'],
   ['История версий','Диск помнит прошлые версии свитка: на disk.yandex.ru правый клик по файлу → «История изменений» — можно откатить летопись на вчерашнее состояние.'],
   ['Привычка на сессию','После игры — «Сохранить летопись на Диск», и никакая чистка браузера летописи не страшна. Перед сессией на новом устройстве — «Загрузить с Диска».']
  ]});
 const d=HELP.find(s=>s.id==='data');
 if(d)d.items.push(['Облако','Свиток летописи можно хранить на Яндекс.Диске — см. раздел «Облако: Яндекс.Диск» в оглавлении выше.']);
})();

/* ── обработчики ── */
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-act]');
 if(!t)return;
 switch(t.dataset.act){
  case 'yd-menu':openYDModal();break;
  case 'yd-connect':skitYDConnect();break;
  case 'yd-code-go':ydFinishWithCode();break;
  case 'yd-manual':openYDManualModal();break;
  case 'yd-token-go':ydFinishWithToken();break;
  case 'yd-save':skitYDSave();break;
  case 'yd-load':skitYDLoad();break;
  case 'yd-disconnect':if(armButton(t))ydDisconnect();break;
 }});
document.addEventListener('change',e=>{
 if(e.target.id==='ydFolder'){
  ydSetFolder(e.target.value);
  toast('Папка: «'+ydFolder()+'».');
 }});

/* кнопка в подвале */
(function mount(){
 const btns=document.querySelector('.foot .btns');
 if(!btns||btns.querySelector('[data-act="yd-menu"]'))return;
 const b=document.createElement('button');
 b.className='link-btn';b.dataset.act='yd-menu';
 b.title='Хранить свиток летописи в облаке';
 b.textContent='☁ Яндекс.Диск';
 const anchor=btns.querySelector('#resetBtn');
 btns.insertBefore(b,anchor||btns.firstChild);
})();
/* === КОНЕЦ ФАЙЛА: app-f.js === */
