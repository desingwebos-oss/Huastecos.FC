/* Interfaz - v5 Final - Primera Persona 3D + PWA conservada */
const HELENA_IMG_SRC='assets/helena.png';
let progress={unlocked:0,stars:[0,0,0,0]};
try{ progress=JSON.parse(localStorage.getItem('helena_progress'))||progress; }catch(e){}
let keys={}, joy={x:0,y:0,active:false}, muted=false;
let G=null; let curLevel=0;
const $=id=>document.getElementById(id);
function toggleMute(){muted=!muted;}
function save(){try{localStorage.setItem('helena_progress',JSON.stringify(progress));}catch(e){} updateHome();}
function updateHome(){$('totalStars').textContent=progress.stars.reduce((a,b)=>a+b,0)+' / '+LEVELS.length*3; $('lvlUnlocked').textContent=(progress.unlocked+1)+' de '+LEVELS.length;}
function beep(f){if(muted) return; try{const ac=new (window.AudioContext||window.webkitAudioContext)(),o=ac.createOscillator(); o.frequency.value=f; o.connect(ac.destination); o.start(); setTimeout(()=>{o.stop(); ac.close();},120);}catch(e){}}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); $(id).classList.add('active'); if(id!=='gameScreen') stopGame();}
function showLevels(){
  const list=$('levelList'); list.innerHTML='';
  LEVELS.forEach((lv,i)=>{let locked=i>progress.unlocked, div=document.createElement('div'); div.className='level-card'+(locked?' locked':''); div.innerHTML='<div class="big">'+lv.emoji+'</div><div style="flex:1"><b>Nivel '+(i+1)+' - '+lv.name+'</b><p class="small">'+(locked?'Completa el nivel anterior':'Listo para jugar - '+lv.stage+'</p><div style="color:#ffd700">'+'★'.repeat(progress.stars[i])+'☆'.repeat(3-progress.stars[i])+'</div></div>'); if(!locked) div.onclick=()=>showIntro(i); list.appendChild(div);});
  showScreen('levels');
}
function showIntro(i){
  curLevel=i; let lv=LEVELS[i];
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); $('introLevel').classList.add('active');
  $('introImg').src = i===0? 'assets/castle.jpg' : i===1? 'assets/classroom.jpg' : i===2? 'assets/classroom.jpg' : 'assets/castle.jpg';
  $('introTitle').textContent=(i+1)+'. '+lv.name+' - '+lv.stage;
  $('introText').textContent=lv.story + ' Junta 5 pistas + 3 llaves y llega a la puerta.';
}
function enterLevel(){ startLevel(curLevel); }
function destroyGame(){ if(G){ G.destroy(); G=null; window.G=null; } }
function stopGame(){ destroyGame(); }
function startLevel(idx){
  showScreen('gameScreen'); destroyGame(); window.LEVEL_IDX=idx; let lv=LEVELS[idx];
  $('hudLevel').textContent=lv.emoji+' '+lv.name; $('msg').classList.remove('show'); $('alert').style.display='none';
  G=new FirstPersonGame(idx, document.getElementById('phaser')); window.G=G;
  onSceneReady();
}
function onSceneReady(){ showStory(); }
function showStory(){ let lv=LEVELS[G.idx]; $('msgBox').innerHTML='<h2>'+lv.emoji+' Nivel '+(G.idx+1)+'</h2><p>'+lv.story+'</p><p><b>'+G.clues.length+' pistas + '+G.keysArr.length+' llaves - Escapa en primera persona</b></p><button class="btn-gold" onclick="closeMsg()">¡Vamos, Helena!</button>'; $('msg').classList.add('show'); G.paused=true; }
function closeMsg(){ $('msg').classList.remove('show'); if(G) G.paused=false; }
function togglePause(){ if(!G||G.over) return; G.paused=!G.paused; if(G.paused){ $('msgBox').innerHTML='<h2>Pausa</h2><p>Helena está descansando.</p><button class="btn-gold" onclick="closeMsg()">Seguir jugando</button><button class="btn-ghost" onclick="showLevels()">Salir a niveles</button>'; $('msg').classList.add('show'); } else closeMsg(); }
function endGame(win){
  $('alert').style.display='none'; let box=$('msgBox');
  if(win){ let stars=G.lives===3?3:G.lives===2?2:1; box.innerHTML='<img src="'+HELENA_IMG_SRC+'" style="width:90px;height:110px;object-fit:contain;margin:0 auto;display:block"><h2>ESCAPASTE!</h2><p>¡Lo lograste, Helena! Encontraste todo en '+G.elapsed+' segundos en primera persona.</p><div id="quiz"><p><b>¿Quién era el impostor?</b></p><div class="suspects">'+LEVELS[G.idx].suspects.map((s,i)=>'<button class="suspect" onclick="answerQuiz('+i+','+stars+')">'+s.n+'</button>').join('')+'</div></div>'; }
  else { box.innerHTML='<h2>Te atrapó!</h2><p>El Devorador te encontró. ¡No te rindas!</p><button class="btn-gold" onclick="startLevel('+G.idx+')">Intentar de nuevo</button><button class="btn-ghost" onclick="showLevels()">Salir a niveles</button>'; }
  $('msg').classList.add('show'); beep(win?1200:200);
}
function answerQuiz(i,baseStars){
  let correct=LEVELS[G.idx].suspects[i].c, last=LEVELS.length-1;
  if(baseStars>progress.stars[G.idx]) progress.stars[G.idx]=baseStars;
  if(G.idx===progress.unlocked && G.idx<last) progress.unlocked++;
  save();
  $('msgBox').innerHTML='<h2>'+(correct?'Correcto!':'Ese no era!')+'</h2><p>'+(correct?'Era el Devorador! Helena lo descubrió.':'Era el Devorador, pero Helena seguirá investigando.')+'</p><p>Estrellas: '+'★'.repeat(baseStars)+'☆'.repeat(3-baseStars)+'</p><button class="btn-gold" onclick="showLevels()">Ver niveles</button><button class="btn-ghost" onclick="startLevel('+Math.min(last,G.idx+1)+')">Siguiente nivel</button>';
}
document.addEventListener('keydown',e=>{let k=e.key.toLowerCase(); keys[k]=true; if(!G) return; if(k.startsWith('arrow')||k===' ') e.preventDefault(); if(k==='p') togglePause(); if(k==='e') G.toggleHide(); if(k==='f') G.toggleLight();});
document.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
$('btnHide').onclick=()=>G&&G.toggleHide();
$('btnLight').onclick=()=>G&&G.toggleLight();
const run=v=>()=>{if(G) G.running=v;};
$('btnRun').addEventListener('touchstart',e=>{e.preventDefault(); run(true)();}); $('btnRun').addEventListener('touchend',run(false)); $('btnRun').addEventListener('touchcancel',run(false)); $('btnRun').onmousedown=run(true); $('btnRun').onmouseup=run(false);
// Joystick ARREGLADO con Pointer Events (el viejo con touchstart fallaba en algunos celulares)
const joyEl=$('joy'), knob=$('knob'); let joyId=null;
function handleJoy(e){let r=joyEl.getBoundingClientRect(); let dx=(e.clientX-(r.left+r.width/2))/40, dy=(e.clientY-(r.top+r.height/2))/40; let l=Math.hypot(dx,dy); if(l>1){dx/=l; dy/=l;} joy.x=dx; joy.y=dy; joy.active=true; knob.style.left=(31+dx*28)+'px'; knob.style.top=(31+dy*28)+'px';}
function resetJoy(){joy.x=0; joy.y=0; joy.active=false; knob.style.left='31px'; knob.style.top='31px';}
joyEl.addEventListener('pointerdown',e=>{joyId=e.pointerId; joyEl.setPointerCapture(e.pointerId); handleJoy(e);});
joyEl.addEventListener('pointermove',e=>{if(e.pointerId===joyId) handleJoy(e);});
joyEl.addEventListener('pointerup',e=>{if(e.pointerId===joyId){joyId=null; resetJoy();}}); joyEl.addEventListener('pointercancel',e=>{if(e.pointerId===joyId){joyId=null; resetJoy();}});
updateHome();
if('serviceWorker' in navigator && location.protocol.startsWith('http')){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
