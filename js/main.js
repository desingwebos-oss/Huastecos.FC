/* Interfaz (pantallas, HUD, mensajes), controles y progreso guardado. */
const HELENA_IMG_SRC = 'assets/helena.png';
let progress = { unlocked: 0, stars: [0, 0, 0, 0] };
try { progress = JSON.parse(localStorage.getItem('helena_progress')) || progress; } catch (e) {}
let keys = {}, joy = { x: 0, y: 0, active: false }, muted = false;
let phaser = null, G = null;
const $ = id => document.getElementById(id);

function toggleMute() { muted = !muted; }
function save() { try { localStorage.setItem('helena_progress', JSON.stringify(progress)); } catch (e) {} updateHome(); }
function updateHome() {
  $('totalStars').textContent = progress.stars.reduce((a, b) => a + b, 0) + ' / ' + LEVELS.length * 3;
  $('lvlUnlocked').textContent = (progress.unlocked + 1) + ' de ' + LEVELS.length;
}
function beep(f) {
  if (muted) return;
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)(), o = ac.createOscillator();
    o.frequency.value = f; o.connect(ac.destination); o.start();
    setTimeout(() => { o.stop(); ac.close(); }, 120);
  } catch (e) {}
}

/* ----- pantallas ----- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  if (id !== 'gameScreen') stopGame();
}
function showLevels() {
  const list = $('levelList'); list.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const locked = i > progress.unlocked, div = document.createElement('div');
    div.className = 'level-card' + (locked ? ' locked' : '');
    div.innerHTML = `<div class="big">${lv.emoji}</div><div style="flex:1"><b>Nivel ${i + 1} • ${lv.name}</b><p class="small">${locked ? '🔒 Completa el nivel anterior' : '✅ Listo para jugar • ' + lv.story.slice(0, 70) + '...'}</p><div style="color:#ffd700">${'★'.repeat(progress.stars[i]) + '☆'.repeat(3 - progress.stars[i])}</div></div>`;
    if (!locked) div.onclick = () => startLevel(i);
    list.appendChild(div);
  });
  showScreen('levels');
}

/* ----- juego ----- */
function destroyPhaser() { if (phaser) { phaser.destroy(true); phaser = null; } G = null; window.G = null; }
function stopGame() { destroyPhaser(); }
function startLevel(idx) {
  showScreen('gameScreen'); destroyPhaser();
  window.LEVEL_IDX = idx;
  const lv = LEVELS[idx];
  $('hudLevel').textContent = lv.emoji + ' ' + lv.name;
  $('msg').classList.remove('show'); $('alert').style.display = 'none';
  phaser = new Phaser.Game({
    type: Phaser.AUTO, width: 800, height: 480, parent: 'phaser', backgroundColor: '#000000',
    input: { keyboard: false, gamepad: false },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [GameScene]
  });
}
function onSceneReady() { showStory(); }
function showStory() {
  const lv = LEVELS[G.idx];
  $('msgBox').innerHTML = `<h2>${lv.emoji} Nivel ${G.idx + 1}</h2><p>${lv.story}</p><p><b>🔍 ${G.clues.length} pistas + 🔑 ${G.keysArr.length} llaves → 🚪 Escapa</b></p><button class="btn-gold" onclick="closeMsg()">¡Vamos, Helena!</button>`;
  $('msg').classList.add('show'); G.paused = true;
}
function closeMsg() { $('msg').classList.remove('show'); if (G) G.paused = false; }
function togglePause() {
  if (!G || G.over) return;
  G.paused = !G.paused;
  if (G.paused) {
    $('msgBox').innerHTML = `<h2>⏸️ Pausa</h2><p>Helena está descansando un momento.</p><button class="btn-gold" onclick="closeMsg()">Seguir jugando</button><button class="btn-ghost" onclick="showLevels()">Salir a niveles</button>`;
    $('msg').classList.add('show');
  } else closeMsg();
}
function endGame(win) {
  $('alert').style.display = 'none';
  const box = $('msgBox');
  if (win) {
    const stars = G.lives === 3 ? 3 : G.lives === 2 ? 2 : 1;
    box.innerHTML = `<img src="${HELENA_IMG_SRC}" style="width:90px;height:110px;object-fit:contain;margin:0 auto;display:block"><h2>🎉 ¡ESCAPASTE!</h2><p>¡Lo lograste, Helena! Encontraste todas las pistas y llaves en ${G.elapsed} segundos.</p><div id="quiz"><p><b>🕵️ ¿Quién era el impostor?</b></p><div class="suspects">${LEVELS[G.idx].suspects.map((s, i) => `<button class="suspect" onclick="answerQuiz(${i},${stars})">${s.n}</button>`).join('')}</div></div>`;
  } else {
    box.innerHTML = `<h2>👹 ¡Te atrapó!</h2><p>El Devorador te encontró. ¡No te rindas, Helena!</p><button class="btn-gold" onclick="startLevel(${G.idx})">🔁 Intentar de nuevo</button><button class="btn-ghost" onclick="showLevels()">Salir a niveles</button>`;
  }
  $('msg').classList.add('show'); beep(win ? 1200 : 200);
}
function answerQuiz(i, baseStars) {
  const correct = LEVELS[G.idx].suspects[i].c, last = LEVELS.length - 1;
  if (baseStars > progress.stars[G.idx]) progress.stars[G.idx] = baseStars;
  if (G.idx === progress.unlocked && G.idx < last) progress.unlocked++;
  save();
  $('msgBox').innerHTML = `<h2>${correct ? '✅ ¡Correcto!' : '❌ ¡Ese no era!'}</h2><p>${correct ? '¡Era el Devorador! Helena lo descubrió con sus pistas.' : 'Era el Devorador, pero Helena seguirá investigando.'}</p><p>⭐ Estrellas: ${'★'.repeat(baseStars)}${'☆'.repeat(3 - baseStars)}</p><button class="btn-gold" onclick="showLevels()">🗺️ Ver niveles</button><button class="btn-ghost" onclick="startLevel(${Math.min(last, G.idx + 1)})">▶ Siguiente nivel</button>`;
}

/* ----- controles ----- */
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); keys[k] = true;
  if (!G) return;
  if (k.startsWith('arrow') || k === ' ') e.preventDefault();
  if (k === 'p') togglePause(); if (k === 'e') G.toggleHide(); if (k === 'f') G.toggleLight();
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
$('btnHide').onclick = () => G && G.toggleHide();
$('btnLight').onclick = () => G && G.toggleLight();
const run = v => () => { if (G) G.running = v; };
$('btnRun').addEventListener('touchstart', e => { e.preventDefault(); run(true)(); });
$('btnRun').addEventListener('touchend', run(false)); $('btnRun').addEventListener('touchcancel', run(false));
$('btnRun').onmousedown = run(true); $('btnRun').onmouseup = run(false);

const joyEl = $('joy'), knob = $('knob');
function handleJoy(e) {
  const r = joyEl.getBoundingClientRect(), t = e.touches ? e.touches[0] : e;
  let dx = (t.clientX - (r.left + r.width / 2)) / 40, dy = (t.clientY - (r.top + r.height / 2)) / 40;
  const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
  joy.x = dx; joy.y = dy; joy.active = true;
  knob.style.left = (31 + dx * 28) + 'px'; knob.style.top = (31 + dy * 28) + 'px';
}
function resetJoy() { joy.x = 0; joy.y = 0; joy.active = false; knob.style.left = '31px'; knob.style.top = '31px'; }
joyEl.addEventListener('touchstart', e => { e.preventDefault(); handleJoy(e); });
joyEl.addEventListener('touchmove', e => { e.preventDefault(); handleJoy(e); });
joyEl.addEventListener('touchend', resetJoy); joyEl.addEventListener('touchcancel', resetJoy);
joyEl.addEventListener('mousedown', e => {
  handleJoy(e);
  const up = () => { resetJoy(); document.removeEventListener('mousemove', handleJoy); document.removeEventListener('mouseup', up); };
  document.addEventListener('mousemove', handleJoy); document.addEventListener('mouseup', up);
});
window.addEventListener('resize', () => phaser && phaser.scale.refresh());

/* ----- arranque + PWA ----- */
updateHome();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
