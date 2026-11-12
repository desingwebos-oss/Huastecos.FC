/* Escena principal (Phaser 3). Misma jugabilidad del HTML original,
   con gráficos procedurales, luz dinámica, partículas y animaciones. */
const TS = 40, W = 800, H = 480;
const hex = s => Phaser.Display.Color.HexStringToColor(s).color;
const EMOJI = 'Arial,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

function hole(c, x, y, r, a = 1) {
  const g = c.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, `rgba(0,0,0,${a})`);
  g.addColorStop(0.55, `rgba(0,0,0,${a * 0.8})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }
  preload() { this.load.image('helena', 'assets/helena.png'); }

  create() {
    this.idx = window.LEVEL_IDX; this.lv = LEVELS[this.idx];
    Object.assign(this, { lives: 3, paused: true, over: false, hidden: false, light: true,
      stamina: 100, ms: 0, elapsed: 0, invuln: 0, chasing: false, running: false, exitOpen: false });
    this.bake(); this.buildMap(); this.buildActors(); this.buildLighting(); this.buildFx();
    window.G = this;
    onSceneReady();
  }

  /* ---------- texturas procedurales ---------- */
  radial(key, w, h, r0, r1, c0, c1) {
    const t = this.textures.createCanvas(key, w, h), c = t.getContext();
    const g = c.createRadialGradient(w / 2, h / 2, r0, w / 2, h / 2, r1);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    c.fillStyle = g; c.fillRect(0, 0, w, h); t.refresh();
  }
  bake() {
    const lv = this.lv, g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(hex(lv.floor)).fillRect(0, 0, TS, TS);
    g.fillStyle(0xffffff, 0.04).fillRect(0, 0, TS / 2, TS / 2).fillRect(TS / 2, TS / 2, TS / 2, TS / 2);
    g.lineStyle(1, 0x000000, 0.25).strokeRect(0.5, 0.5, TS - 1, TS - 1);
    g.generateTexture('floor', TS, TS); g.clear();
    g.fillStyle(hex(lv.wall)).fillRect(0, 0, TS, TS);
    g.lineStyle(1, 0x000000, 0.4);
    for (let r = 0; r < 4; r++) {
      g.lineBetween(0, r * 10, TS, r * 10);
      for (let x = (r % 2 ? 10 : 0); x < TS; x += 20) g.lineBetween(x, r * 10, x, r * 10 + 10);
    }
    g.fillStyle(hex(lv.color), 0.6).fillRect(0, 0, TS, 5);
    g.fillStyle(0xffffff, 0.15).fillRect(0, 0, TS, 1);
    g.fillStyle(0x000000, 0.35).fillRect(0, TS - 6, TS, 6);
    g.generateTexture('wall', TS, TS); g.destroy();
    this.radial('glow', 64, 64, 0, 32, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');
    this.radial('vig', W, H, 170, 480, 'rgba(255,0,60,0)', 'rgba(255,0,60,0.7)');
  }

  /* ---------- mapa y objetos ---------- */
  buildMap() {
    const rows = this.lv.map;
    this.floorTiles = []; this.clues = []; this.keysArr = []; this.hides = [];
    this.start = { x: 60, y: 60 }; this.exit = { x: 0, y: 0 };
    const bob = (t, dy, d) => this.tweens.add({ targets: t, y: `-=${dy}`, duration: d, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const item = (x, y, ch, tint) => {
      const glow = this.add.image(x, y, 'glow').setTint(tint).setAlpha(0.55).setScale(1).setDepth(3);
      const icon = this.add.text(x, y, ch, { fontSize: '24px', fontFamily: EMOJI }).setOrigin(0.5).setDepth(4).setResolution(2);
      this.tweens.add({ targets: glow, alpha: 0.2, scale: 1.4, duration: 700, yoyo: true, repeat: -1 });
      bob(icon, 4, 600 + Math.random() * 300);
      return { x, y, taken: false, glow, icon };
    };
    rows.forEach((row, r) => {
      for (let c = 0; c < 20 && c < row.length; c++) {
        const ch = row[c], x = c * TS + 20, y = r * TS + 20;
        if (ch === '#') { this.add.image(c * TS, r * TS, 'wall').setOrigin(0).setDepth(2); continue; }
        this.add.image(c * TS, r * TS, 'floor').setOrigin(0).setDepth(0);
        this.floorTiles.push({ x, y });
        if (ch === 'P') this.start = { x, y };
        else if (ch === 'C') this.clues.push(item(x, y, '🔍', 0xffd700));
        else if (ch === 'K') this.keysArr.push(item(x, y, '🔑', 0x66ccff));
        else if (ch === 'E') this.exit = { x, y };
        else if (ch === 'H') {
          const b = this.add.graphics({ x, y }).setDepth(3);
          b.fillStyle(0x1f7a46).fillRoundedRect(-17, -17, 34, 34, 10);
          b.fillStyle(0x2a9d5c).fillRoundedRect(-15, -17, 30, 28, 10);
          const l = this.add.text(x, y + 1, '🌿', { fontSize: '20px', fontFamily: EMOJI }).setOrigin(0.5).setDepth(4).setResolution(2);
          this.tweens.add({ targets: l, angle: { from: -6, to: 6 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          this.hides.push({ x, y });
        }
      }
    });
    const e = this.exit;
    this.doorGlow = this.add.image(e.x, e.y, 'glow').setTint(0xffd700).setAlpha(0).setScale(1.8).setDepth(3);
    this.door = this.add.text(e.x, e.y, '🚪', { fontSize: '30px', fontFamily: EMOJI }).setOrigin(0.5).setDepth(4).setAlpha(0.6).setResolution(2);
    this.exitLabel = this.add.text(e.x, e.y - 30, '✨ ¡SALIDA ABIERTA! ✨', { fontSize: '12px', fontStyle: 'bold', color: '#ffd700', fontFamily: EMOJI, stroke: '#000', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(58).setVisible(false);
    this.tweens.add({ targets: this.exitLabel, y: e.y - 36, duration: 700, yoyo: true, repeat: -1 });
  }

  buildActors() {
    this.p = { x: this.start.x, y: this.start.y };
    const far = [...this.floorTiles].sort((a, b) =>
      Math.hypot(b.x - this.p.x, b.y - this.p.y) - Math.hypot(a.x - this.p.x, a.y - this.p.y))[0];
    this.m = { x: far.x, y: far.y, target: null, stuck: 0 };
    const shadow = this.add.ellipse(0, 24, 24, 8, 0x000000, 0.4);
    this.himg = this.add.image(0, 0, 'helena');
    this.hbase = 56 / this.himg.height; this.himg.setScale(this.hbase);
    const label = this.add.text(0, 36, 'HELENA', { fontSize: '9px', fontStyle: 'bold', color: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    this.hc = this.add.container(this.p.x, this.p.y, [shadow, this.himg, label]).setDepth(10);
    this.mglow = this.add.image(0, 0, 'glow').setTint(0xff2e88).setDepth(8);
    this.mg = this.add.graphics().setDepth(9);
    this.eyes = this.add.graphics().setDepth(61);
    this.hint = this.add.text(0, 0, 'E · 🙈 Esconderse', { fontSize: '11px', fontStyle: 'bold', fontFamily: EMOJI, backgroundColor: '#000000aa', padding: { x: 5, y: 2 } })
      .setOrigin(0.5).setDepth(58).setVisible(false);
  }

  buildLighting() {
    this.dark = this.textures.createCanvas('dark', W / 2, H / 2);
    this.dctx = this.dark.getContext();
    this.add.image(0, 0, 'dark').setOrigin(0).setScale(2).setDepth(50);
  }

  buildFx() {
    const burst = tint => this.add.particles(0, 0, 'glow', { speed: { min: 60, max: 200 }, scale: { start: 0.4, end: 0 }, lifespan: 650,
      alpha: { start: 1, end: 0 }, blendMode: 'ADD', tint, emitting: false }).setDepth(55);
    this.gold = burst(0xffd700); this.pink = burst(0xff2e88);
    this.dust = this.add.particles(0, 0, 'glow', { lifespan: 380, scale: { start: 0.14, end: 0 }, alpha: { start: 0.45, end: 0 },
      tint: 0xcbb8ff, speed: 12, emitting: false }).setDepth(9);
    this.add.particles(0, 0, 'glow', { x: { min: 0, max: W }, y: { min: 0, max: H }, lifespan: 5000, speedY: { min: -12, max: -4 },
      speedX: { min: -6, max: 6 }, scale: { start: 0.12, end: 0 }, alpha: { start: 0.3, end: 0 }, frequency: 240, blendMode: 'ADD' }).setDepth(51);
    this.vig = this.add.image(0, 0, 'vig').setOrigin(0).setDepth(60).setAlpha(0);
  }

  /* ---------- colisiones ---------- */
  isWall(x, y) {
    const c = Math.floor(x / TS), r = Math.floor(y / TS);
    if (r < 0 || r >= this.lv.map.length || c < 0 || c >= 20) return true;
    return this.lv.map[r][c] === '#';
  }
  free(x, y, r) { return !this.isWall(x - r, y - r) && !this.isWall(x + r, y - r) && !this.isWall(x - r, y + r) && !this.isWall(x + r, y + r); }
  move(o, dx, dy, r) { // desliza por las paredes
    let ok = false;
    if (dx && this.free(o.x + dx, o.y, r)) { o.x += dx; ok = true; }
    if (dy && this.free(o.x, o.y + dy, r)) { o.y += dy; ok = true; }
    return ok;
  }

  /* ---------- acciones ---------- */
  toggleHide() {
    const near = this.hides.some(h => Math.hypot(h.x - this.p.x, h.y - this.p.y) < 40);
    if (near || this.hidden) { this.hidden = !this.hidden; beep(this.hidden ? 500 : 700); this.dust.emitParticleAt(this.p.x, this.p.y, 6); }
    else {
      const a = document.getElementById('alert');
      a.textContent = '🌿 Acércate a un arbusto verde para esconderte'; a.style.display = 'block';
      setTimeout(() => { if (!this.chasing) a.style.display = 'none'; a.textContent = '👹 ¡TE VIO! ¡CORRE O ESCÓNDETE!'; }, 1500);
    }
  }
  toggleLight() { this.light = !this.light; beep(900); }

  pickup(o, burst, f) {
    o.taken = true; beep(f); burst.explode(14, o.x, o.y);
    this.tweens.add({ targets: [o.icon, o.glow], alpha: 0, scale: 1.9, y: '-=18', duration: 320, onComplete: () => { o.icon.destroy(); o.glow.destroy(); } });
  }
  hit() {
    this.lives--; this.invuln = 90; beep(200);
    this.cameras.main.shake(260, 0.014); this.cameras.main.flash(220, 255, 40, 100);
    this.pink.explode(18, this.p.x, this.p.y);
    if (this.lives <= 0) { this.over = true; this.paused = true; endGame(false); return; }
    this.p.x = this.start.x; this.p.y = this.start.y;
  }
  win() {
    this.over = true; this.paused = true;
    this.gold.explode(40, this.p.x, this.p.y); this.pink.explode(30, this.p.x, this.p.y);
    endGame(true);
  }

  /* ---------- bucle ---------- */
  update(time, dt) {
    if (!this.paused && !this.over) this.step(dt);
    this.render(time);
  }

  step(dt) {
    const f = Math.min(dt, 50) / 16.667, p = this.p, m = this.m;
    this.ms += dt; this.elapsed = Math.floor(this.ms / 1000);
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1;
    if (joy.active) { dx += joy.x; dy += joy.y; }
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    this.dx = dx; this.moving = len > 0.08;
    const wantRun = (keys['shift'] || this.running) && this.moving;
    this.sprint = wantRun && this.stamina > 0;
    this.stamina = wantRun ? Math.max(0, this.stamina - 0.4 * f) : Math.min(100, this.stamina + 0.3 * f);
    const sp = (this.sprint ? 3.6 : 2.2) * f;
    this.move(p, dx * sp, dy * sp, 12);
    if (this.sprint && Math.random() < 0.5) this.dust.emitParticleAt(p.x, p.y + 20, 1);
    if (this.invuln > 0) this.invuln -= f; if (this.invuln < 0) this.invuln = 0;

    this.clues.forEach(c => { if (!c.taken && Math.hypot(c.x - p.x, c.y - p.y) < 24) this.pickup(c, this.gold, 880); });
    this.keysArr.forEach(k => { if (!k.taken && Math.hypot(k.x - p.x, k.y - p.y) < 24) this.pickup(k, this.gold, 660); });

    const dist = Math.hypot(m.x - p.x, m.y - p.y);
    const sees = dist < (this.light ? 190 : 120) && !this.hidden;
    if (sees && !this.chasing) { beep(300); this.cameras.main.shake(150, 0.004); }
    this.chasing = sees;
    document.getElementById('alert').style.display = sees ? 'block' : 'none';
    const ms = (1.5 + this.idx * 0.25 + (sees ? 0.9 : 0)) * f;
    if (sees) {
      this.move(m, (p.x - m.x) / dist * ms, (p.y - m.y) / dist * ms, 13);
    } else {
      if (!m.target || Math.hypot(m.target.x - m.x, m.target.y - m.y) < 20 || m.stuck > 45) {
        m.target = Phaser.Utils.Array.GetRandom(this.floorTiles); m.stuck = 0;
      }
      const d = Math.hypot(m.target.x - m.x, m.target.y - m.y) || 1;
      const moved = this.move(m, (m.target.x - m.x) / d * ms * 0.7, (m.target.y - m.y) / d * ms * 0.7, 13);
      m.stuck = moved ? 0 : m.stuck + 1;
    }
    if (dist < 28 && this.invuln === 0 && !this.hidden) { this.hit(); if (this.over) return; }

    const allDone = this.clues.every(c => c.taken) && this.keysArr.every(k => k.taken);
    if (allDone && !this.exitOpen) {
      this.exitOpen = true; this.door.setAlpha(1); this.exitLabel.setVisible(true); beep(1000);
      this.gold.explode(30, this.exit.x, this.exit.y);
      this.tweens.add({ targets: this.doorGlow, alpha: 0.8, scale: 2.4, duration: 600, yoyo: true, repeat: -1 });
    }
    if (allDone && Math.hypot(this.exit.x - p.x, this.exit.y - p.y) < 30) { this.win(); return; }

    const $ = id => document.getElementById(id);
    const nc = this.clues.filter(c => c.taken).length, nk = this.keysArr.filter(k => k.taken).length;
    $('hudClues').textContent = `${nc}/${this.clues.length}`; $('hudKeys').textContent = `${nk}/${this.keysArr.length}`;
    $('hudLives').textContent = this.lives; $('hudStam').textContent = Math.floor(this.stamina);
    $('hudTime').textContent = String(Math.floor(this.elapsed / 60)).padStart(2, '0') + ':' + String(this.elapsed % 60).padStart(2, '0');
    $('progBar').style.width = ((nc + nk) / (this.clues.length + this.keysArr.length) * 100) + '%';
  }

  render(time) {
    const p = this.p, m = this.m;
    // Helena: rebote al caminar, inclinación, parpadeo al ser golpeada
    this.hc.setPosition(p.x, p.y);
    const run = this.sprint ? 60 : 90;
    this.himg.y = this.moving && !this.paused ? -Math.abs(Math.sin(time / run)) * 4 : Math.sin(time / 400) * 1.5;
    this.himg.angle = this.moving && !this.paused ? (this.dx || 0) * 8 : 0;
    if (Math.abs(this.dx || 0) > 0.1) this.himg.scaleX = this.hbase * Math.sign(this.dx);
    this.hc.alpha = this.hidden ? 0.45 : (this.invuln > 0 && Math.floor(time / 80) % 2 ? 0.3 : 1);
    // pista de escondite
    const near = !this.hidden && !this.paused && this.hides.some(h => Math.hypot(h.x - p.x, h.y - p.y) < 40);
    this.hint.setVisible(near).setPosition(p.x, p.y - 42);

    // Devorador de Sombras: tentáculos animados
    const g = this.mg; g.clear(); g.setPosition(m.x, m.y).setScale(1 + Math.sin(time / 250) * 0.05);
    g.lineStyle(4, 0xff2e88, 1);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + time / 900;
      let x = Math.cos(a) * 14, y = Math.sin(a) * 14, aa = a;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 1; s <= 4; s++) { aa += Math.sin(time / 180 + i * 1.7 + s) * 0.35; x += Math.cos(aa) * 7; y += Math.sin(aa) * 7; g.lineTo(x, y); }
      g.strokePath();
    }
    g.fillStyle(0x1a0b2e, 1).fillCircle(0, 0, 20); g.lineStyle(2, 0xff9ad5, 0.8).strokeCircle(0, 0, 20);
    const ang = Math.atan2(p.y - m.y, p.x - m.x), ex = Math.cos(ang) * 2, ey = Math.sin(ang) * 2;
    g.fillStyle(0xffffff).fillCircle(-6, -4, 5).fillCircle(6, -4, 5);
    g.fillStyle(0xff0000).fillCircle(-6 + ex, -4 + ey, 2.5).fillCircle(6 + ex, -4 + ey, 2.5);
    if (this.chasing) {
      g.lineStyle(2, 0xffffff, 1).beginPath().moveTo(-8, 6);
      for (let k = 1; k <= 4; k++) g.lineTo(-8 + k * 4, k % 2 ? 11 : 5);
      g.strokePath();
    }
    this.mglow.setPosition(m.x, m.y).setScale(1.7 + Math.sin(time / 200) * 0.2).setAlpha(this.chasing ? 0.6 : 0.3);
    // ojos rojos visibles incluso en la oscuridad
    this.eyes.clear().fillStyle(0xff2244, 1).fillCircle(m.x - 6 + ex, m.y - 4 + ey, 2.5).fillCircle(m.x + 6 + ex, m.y - 4 + ey, 2.5);
    this.vig.alpha += ((this.chasing ? 0.5 + 0.15 * Math.sin(time / 90) : 0) - this.vig.alpha) * 0.15;

    // luz de la linterna con parpadeo; pistas/llaves/puerta brillan levemente
    const c = this.dctx;
    c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W / 2, H / 2);
    c.fillStyle = this.light ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0.94)'; c.fillRect(0, 0, W / 2, H / 2);
    c.globalCompositeOperation = 'destination-out';
    const fl = 1 + Math.sin(time / 130) * 0.015 + Math.sin(time / 47) * 0.01;
    hole(c, p.x / 2, p.y / 2, (this.light ? 150 : 60) * fl / 2);
    [...this.clues, ...this.keysArr].forEach(o => { if (!o.taken) hole(c, o.x / 2, o.y / 2, 15, 0.7); });
    hole(c, this.exit.x / 2, this.exit.y / 2, this.exitOpen ? 45 : 16, this.exitOpen ? 1 : 0.6);
    this.dark.refresh();
  }
}
