import { CHARACTERS, CHARACTER_IDS } from "./characters.js";
import { Fighter } from "./player.js";
import { STAGES } from "./stage.js";
import { hurtbox, worldHitbox, aabb, applyHit } from "./combat.js";
import { makeCpuInput } from "./ai.js";

const MENU = ["Versus local", "Treinamento", "Arcade", "Opções"];

export class Game {
  constructor(canvas, sprites, audio, input) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.sprites = sprites;
    this.audio = audio;
    this.input = input;
    this.mode = "title";
    this.menuIndex = 0;
    this.pauseIndex = 0;
    this.resultIndex = 0;
    this.p1Pick = 0;
    this.p2Pick = 1;
    this.p1Ready = false;
    this.p2Ready = false;
    this.p2cpu = false;
    this.aiLevel = "normal";
    this.training = false;
    this.showHitboxes = false;
    this.world = null;
    this.cam = { x: 800, y: 420, z: 1 };
    this.acc = 0;
    this.last = performance.now();
    this.debugCpu = false;
  }

  setMode(mode) {
    this.mode = mode;
    const ids = [
      "screen-load",
      "screen-title",
      "screen-menu",
      "screen-charsel",
      "screen-options",
      "screen-pause",
      "screen-results",
    ];
    for (const id of ids) document.getElementById(id).classList.add("hidden");
    const hud = document.getElementById("hud");
    const help = document.getElementById("help");
    const pads = document.getElementById("pads");
    hud?.classList.add("hidden");
    help?.classList.add("hidden");
    pads?.classList.add("hidden");
    document.body.classList.remove("pvp-fight");
    if (mode === "title") document.getElementById("screen-title").classList.remove("hidden");
    if (mode === "menu") {
      document.getElementById("screen-menu").classList.remove("hidden");
      this.renderMenu();
      this.audio.playMusic("menu");
    }
    if (mode === "charsel") {
      document.getElementById("screen-charsel").classList.remove("hidden");
      this.p1Ready = false;
      this.p2Ready = this.p2cpu;
      this.renderCharSel();
    }
    if (mode === "options") {
      document.getElementById("screen-options").classList.remove("hidden");
      this.renderOptions();
    }
    if (mode === "pause") document.getElementById("screen-pause").classList.remove("hidden");
    if (mode === "results") document.getElementById("screen-results").classList.remove("hidden");
    if (mode === "fight") {
      hud?.classList.remove("hidden");
      help?.classList.add("hidden");
      pads?.classList.add("hidden");
      if (help) help.style.cssText = "display:none!important";
      if (pads) {
        pads.classList.add("hidden");
        pads.setAttribute("hidden", "");
        pads.style.cssText = "display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important";
      }
      try {
        this.audio.playMusic("battle");
      } catch {}
    }
  }

  renderMenu() {
    const btns = document.querySelectorAll("[data-hub]");
    btns.forEach((btn, i) => {
      btn.classList.toggle("active", i === this.menuIndex);
      btn.onmouseenter = () => {
        this.menuIndex = i;
        btns.forEach((b, j) => b.classList.toggle("active", j === this.menuIndex));
      };
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.menuIndex = i;
        this.launch(btn.getAttribute("data-hub"));
      };
    });
  }

  confirmMenu() {
    const choice = MENU[this.menuIndex];
    if (choice === "Opções") this.launch("opcoes");
    else if (choice === "Treinamento") this.launch("treino");
    else if (choice === "Arcade") this.launch("arcade");
    else this.launch("versus");
  }

  launch(kind) {
    try {
      this.audio.sfx("confirm");
    } catch {}
    if (kind === "opcoes") {
      this.setMode("options");
      return;
    }
    this.training = kind === "treino";
    this.debugCpu = kind === "arcade";
    this.p2cpu = kind !== "versus";
    // Todos os modos passam pela seleção de personagem
    this.setMode("charsel");
  }

  renderCharSel() {
    const ids = CHARACTER_IDS;
    const p1 = CHARACTERS[ids[this.p1Pick]];
    const p2 = CHARACTERS[ids[this.p2Pick]];
    document.getElementById("p1-name").textContent = p1.name;
    document.getElementById("p2-name").textContent = p2.name;
    document.getElementById("p1-arch").textContent = p1.archetype;
    document.getElementById("p2-arch").textContent = p2.archetype;
    document.getElementById("p1-portrait").style.backgroundImage = `url(assets/sprites/${p1.portrait})`;
    document.getElementById("p2-portrait").style.backgroundImage = `url(assets/sprites/${p2.portrait})`;
    document.getElementById("slot-p1").classList.toggle("ready", this.p1Ready);
    document.getElementById("slot-p2").classList.toggle("ready", this.p2Ready);
    const cpuBtn = document.getElementById("btn-cpu");
    cpuBtn.textContent = this.p2cpu ? "P2: CPU" : "P2: Humano";
    cpuBtn.onclick = () => {
      this.p2cpu = !this.p2cpu;
      if (this.p2cpu) this.p2Ready = true;
      this.renderCharSel();
    };
    const startBtn = document.getElementById("btn-start");
    if (startBtn) startBtn.onclick = () => this.startFight();
    document.getElementById("p1-portrait").onclick = () => {
      this.p1Pick = (this.p1Pick + 1) % ids.length;
      this.audio.sfx("select");
      this.renderCharSel();
    };
    document.getElementById("p2-portrait").onclick = () => {
      this.p2Pick = (this.p2Pick + 1) % ids.length;
      this.audio.sfx("select");
      this.renderCharSel();
    };
  }

  renderOptions() {
    const body = document.getElementById("options-body");
    const rows = ["left", "right", "up", "down", "light", "special", "strong", "shield", "grab"];
    const labels = {
      left: "Esquerda",
      right: "Direita",
      up: "Pulo / Cima",
      down: "Baixo",
      light: "Leve",
      special: "Especial",
      strong: "Forte",
      shield: "Defesa",
      grab: "Agarrão",
    };
    body.innerHTML = rows
      .map((a) => {
        const b1 = this.input.binds.p1[a];
        const b2 = this.input.binds.p2[a];
        return `<div class="bind-row"><span class="bind-label">${labels[a]}</span>
          <button data-p="p1" data-a="${a}">P1 ${b1}</button>
          <button data-p="p2" data-a="${a}">P2 ${b2}</button></div>`;
      })
      .join("");
    body.querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => {
        body.querySelectorAll("button").forEach((b) => b.classList.remove("waiting"));
        btn.classList.add("waiting");
        btn.textContent = "Pressione…";
        this.input.remap(btn.dataset.p, btn.dataset.a);
        const check = setInterval(() => {
          if (!this.input.waiting) {
            clearInterval(check);
            this.renderOptions();
          }
        }, 80);
      };
    });
  }

  renderPause() {
    const items = this.training
      ? ["Continuar", "Hitboxes", "Resetar", "Menu"]
      : ["Continuar", "Menu"];
    const nav = document.getElementById("pause-nav");
    nav.innerHTML = items
      .map((l, i) => `<button class="menu-item ${i === this.pauseIndex ? "active" : ""}" data-i="${i}">${l}${l === "Hitboxes" ? (this.showHitboxes ? " · ON" : " · OFF") : ""}</button>`)
      .join("");
    nav.querySelectorAll(".menu-item").forEach((btn) => {
      btn.onclick = () => {
        this.pauseIndex = +btn.dataset.i;
        this.confirmPause(items);
      };
    });
    this._pauseItems = items;
  }

  confirmPause(items) {
    const c = items[this.pauseIndex];
    if (c === "Continuar") this.setMode("fight");
    if (c === "Hitboxes") {
      this.showHitboxes = !this.showHitboxes;
      this.renderPause();
    }
    if (c === "Resetar") this.startFight();
    if (c === "Menu") {
      this.world = null;
      this.setMode("menu");
    }
  }

  startFight() {
    const ids = CHARACTER_IDS;
    const stage = structuredClone(STAGES.rooftop);
    const p1 = new Fighter(CHARACTERS[ids[this.p1Pick]], "p1", stage.spawn[0].x, stage.spawn[0].y, 1);
    const p2 = new Fighter(CHARACTERS[ids[this.p2Pick]], "p2", stage.spawn[1].x, stage.spawn[1].y, -1);
    p2.cpu = this.p2cpu;
    if (this.training) {
      p1.stocks = 99;
      p2.stocks = 99;
    }
    this.cam = { x: (p1.x + p2.x) / 2, y: 480, z: 1 };
    this.world = {
      stage,
      fighters: [p1, p2],
      projectiles: [],
      particles: [],
      audio: this.audio,
      shake: 0,
      combo: null,
      frame: 0,
      finished: false,
      spawnFx: (kind, x, y, dir) => this.spawnFx(kind, x, y, dir),
      spawnProjectile: (owner, spec) => this.spawnProjectile(owner, spec),
      onKo: (p) => this.onKo(p),
    };
    this.setMode("fight");
    this.updateHud();
  }

  spawnFx(kind, x, y, dir = 1) {
    const sprite =
      kind === "burst"
        ? "fx/burst.png"
        : kind === "explode"
          ? "fx/explode.png"
          : kind === "dust"
            ? "fx/dust.png"
            : "fx/sparkle.png";
    this.world.particles.push({
      sprite,
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2,
      life: 16,
      max: 16,
      scale: kind === "explode" ? 0.28 : 0.18,
      dir,
    });
  }

  spawnProjectile(owner, spec) {
    this.world.projectiles.push({
      ...spec,
      x: owner.x + owner.facing * 36,
      y: owner.y - 48,
      vx: spec.speed * owner.facing,
      facing: owner.facing,
      ownerId: owner.id,
      age: 0,
    });
  }

  onKo(p) {
    const [a, b] = this.world.fighters;
    if (!a.alive || !b.alive) {
      this.world.finished = true;
      const winner = a.alive ? a : b.alive ? b : null;
      setTimeout(() => this.showResults(winner), 700);
    }
  }

  showResults(winner) {
    this.setMode("results");
    document.getElementById("result-kicker").textContent = "K.O.";
    document.getElementById("result-title").textContent = winner ? `${winner.char.name} vence` : "Empate";
    document.getElementById("result-sub").textContent = winner
      ? `${winner.char.archetype} · ${Math.floor(winner.percent)}% restantes`
      : "Os dois caíram";
    if (winner) winner.enter("win");
    const nav = document.getElementById("result-nav");
    const items = ["Revanche", "Personagens", "Menu"];
    nav.innerHTML = items
      .map((l, i) => `<button class="menu-item ${i === 0 ? "active" : ""}" data-i="${i}">${l}</button>`)
      .join("");
    nav.querySelectorAll(".menu-item").forEach((btn) => {
      btn.onclick = () => this.confirmResult(+btn.dataset.i);
    });
    this.resultIndex = 0;
    this._resultItems = items;
  }

  confirmResult(i) {
    this.audio.sfx("confirm");
    if (i === 0) this.startFight();
    if (i === 1) this.setMode("charsel");
    if (i === 2) this.setMode("menu");
  }

  tick(now) {
    const dt = Math.min(32, now - this.last);
    this.last = now;
    this.acc += dt;
    this.input.poll();
    while (this.acc >= 1000 / 60) {
      this.acc -= 1000 / 60;
      this.step();
    }
    this.draw();
    requestAnimationFrame((t) => this.tick(t));
  }

  step() {
    if (this.mode === "title") {
      if (this.input.anyPressed || this.input.menuOk) {
        this.audio.unlock();
        this.audio.sfx("confirm");
        this.setMode("menu");
      }
      return;
    }
    if (this.mode === "menu") {
      if (this.input.menuUp) {
        this.menuIndex = (this.menuIndex + MENU.length - 1) % MENU.length;
        this.audio.sfx("ui");
        this.renderMenu();
      }
      if (this.input.menuDown) {
        this.menuIndex = (this.menuIndex + 1) % MENU.length;
        this.audio.sfx("ui");
        this.renderMenu();
      }
      if (this.input.menuOk) this.confirmMenu();
      return;
    }
    if (this.mode === "charsel") {
      const ids = CHARACTER_IDS;
      if (this.input.p1.leftPressed && !this.p1Ready) {
        this.p1Pick = (this.p1Pick + ids.length - 1) % ids.length;
        this.audio.sfx("select");
      }
      if (this.input.p1.rightPressed && !this.p1Ready) {
        this.p1Pick = (this.p1Pick + 1) % ids.length;
        this.audio.sfx("select");
      }
      if (this.input.p1.lightPressed) {
        this.p1Ready = !this.p1Ready;
        this.audio.sfx("confirm");
      }
      if (!this.p2cpu) {
        if (this.input.p2.leftPressed && !this.p2Ready) {
          this.p2Pick = (this.p2Pick + ids.length - 1) % ids.length;
          this.audio.sfx("select");
        }
        if (this.input.p2.rightPressed && !this.p2Ready) {
          this.p2Pick = (this.p2Pick + 1) % ids.length;
          this.audio.sfx("select");
        }
        if (this.input.p2.lightPressed) {
          this.p2Ready = !this.p2Ready;
          this.audio.sfx("confirm");
        }
      }
      if (this.input.menuBack) this.setMode("menu");
      this.renderCharSel();
      if (this.p1Ready && this.p2Ready) this.startFight();
      return;
    }
    if (this.mode === "options") {
      if (this.input.menuBack && !this.input.waiting) this.setMode("menu");
      return;
    }
    if (this.mode === "pause") {
      const items = this._pauseItems || ["Continuar", "Menu"];
      if (this.input.menuUp) {
        this.pauseIndex = (this.pauseIndex + items.length - 1) % items.length;
        this.renderPause();
      }
      if (this.input.menuDown) {
        this.pauseIndex = (this.pauseIndex + 1) % items.length;
        this.renderPause();
      }
      if (this.input.menuOk) this.confirmPause(items);
      if (this.input.pausePressed) this.setMode("fight");
      return;
    }
    if (this.mode === "results") {
      const items = this._resultItems || ["Revanche", "Personagens", "Menu"];
      if (this.input.menuUp) this.resultIndex = (this.resultIndex + items.length - 1) % items.length;
      if (this.input.menuDown) this.resultIndex = (this.resultIndex + 1) % items.length;
      const nav = document.getElementById("result-nav");
      if (nav) {
        [...nav.children].forEach((el, i) => el.classList.toggle("active", i === this.resultIndex));
      }
      if (this.input.menuOk) this.confirmResult(this.resultIndex);
      return;
    }
    if (this.mode !== "fight" || !this.world) return;

    if (this.input.pausePressed) {
      this.pauseIndex = 0;
      this.setMode("pause");
      this.renderPause();
      return;
    }
    if (this.training && this.input.just?.("KeyH")) this.showHitboxes = !this.showHitboxes;

    const w = this.world;
    w.frame++;
    const [p1, p2] = w.fighters;
    const i1 = this.input.p1;
    const i2 = p2.cpu ? makeCpuInput(p2, p1, w, this.aiLevel, { dummy: this.training }) : this.input.p2;
    p1.update(i1, w);
    p2.update(i2, w);
    this.separate(p1, p2);
    this.updateProjectiles();
    this.updateParticles();
    if (w.shake > 0) w.shake *= 0.84;
    if (w.combo) {
      w.combo.timer--;
      if (w.combo.timer <= 0) w.combo = null;
    }
    this.updateCamera();
    this.updateHud();
  }

  separate(a, b) {
    if (!a.alive || !b.alive) return;
    const dx = b.x - a.x;
    const overlap = 38 - Math.abs(dx);
    if (overlap > 0 && Math.abs(a.y - b.y) < 70) {
      const push = overlap / 2;
      const dir = dx === 0 ? 1 : Math.sign(dx);
      a.x -= push * dir;
      b.x += push * dir;
    }
  }

  updateProjectiles() {
    const w = this.world;
    w.projectiles = w.projectiles.filter((pr) => {
      pr.age++;
      pr.x += pr.vx;
      const box = { x: pr.x - pr.w / 2, y: pr.y - pr.h / 2, w: pr.w, h: pr.h };
      for (const f of w.fighters) {
        if (f.id === pr.ownerId || !f.alive) continue;
        if (aabb(box, hurtbox(f))) {
          const owner = w.fighters.find((x) => x.id === pr.ownerId);
          if (owner) {
            applyProj(owner, f, pr, w);
          }
          this.spawnFx("burst", pr.x, pr.y, pr.facing);
          return false;
        }
      }
      const b = w.stage.blast;
      return pr.age < pr.life && pr.x > b.l && pr.x < b.r;
    });
  }

  updateParticles() {
    const w = this.world;
    for (const p of w.particles) {
      p.life--;
      p.x += p.vx;
      p.y += p.vy;
    }
    w.particles = w.particles.filter((p) => p.life > 0);
  }

  updateCamera() {
    const [a, b] = this.world.fighters;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - 70;
    const dist = Math.max(220, Math.hypot(a.x - b.x, a.y - b.y));
    const z = Math.max(0.78, Math.min(1.15, 720 / dist));
    this.cam.x += (mx - this.cam.x) * 0.08;
    this.cam.y += (my - this.cam.y) * 0.08;
    this.cam.z += (z - this.cam.z) * 0.06;
  }

  updateHud() {
    const [a, b] = this.world.fighters;
    const set = (n, p) => {
      document.getElementById(`hud-name-${n}`).textContent =
        p.char.name + (p.cpu ? (this.training ? " (dummy)" : " (CPU)") : "");
      const pct = document.getElementById(`hud-pct-${n}`);
      pct.textContent = `${Math.floor(p.percent)}%`;
      pct.style.color = p.percent > 100 ? "#ff4d4d" : p.char.color;
      document.getElementById(`hud-face-${n}`).style.backgroundImage = `url(assets/sprites/${p.char.portrait})`;
      const stocks = document.getElementById(`hud-stocks-${n}`);
      const nStocks = Math.min(8, p.stocks);
      stocks.innerHTML = Array.from({ length: nStocks }, () => `<span class="stock" style="background:${p.char.color}"></span>`).join("");
    };
    set(1, a);
    set(2, b);
    const combo = document.getElementById("hud-combo");
    combo.textContent = this.world.combo && this.world.combo.count > 1 ? `${this.world.combo.count} HIT` : "";
    document.getElementById("hud-timer").textContent = this.training ? "TREINO" : "∞";
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!this.world) {
      this.drawBackdrop();
      return;
    }
    ctx.save();
    const sh = this.world.shake || 0;
    ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    const cam = this.cam;
    ctx.translate(w / 2, h / 2);
    ctx.scale(cam.z, cam.z);
    ctx.translate(-cam.x, -cam.y);

    const bg = this.sprites.img("stages/rooftop.png");
    if (bg) {
      const stage = this.world.stage;
      ctx.drawImage(bg, -80, -40, stage.width + 80, stage.height);
    }

    for (const f of this.world.fighters) {
      if (!f.alive && f.state !== "knockedOut") continue;
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(f.x, this.world.stage.ground.y + 6, 28, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const pr of this.world.projectiles) {
      this.sprites.draw(ctx, pr.sprite, pr.x, pr.y + pr.h / 2, {
        flip: pr.facing < 0,
        scale: pr.scale || 0.25,
        anchorY: 1,
      });
    }

    for (const f of this.world.fighters) {
      if (!f.alive && f.stocks <= 0 && f.state !== "knockedOut" && f.state !== "win") continue;
      const spr = f.currentSprite();
      const alpha = f.intangible > 0 && this.world.frame % 6 < 3 ? 0.45 : 1;
      this.sprites.draw(ctx, spr, f.x, f.y, {
        flip: f.facing < 0,
        scale: f.char.scale,
        alpha,
      });
      if (f.state === "shield") {
        this.sprites.draw(ctx, "fx/shield.png", f.x, f.y - 40, { scale: 0.28, anchorY: 0.5, alpha: 0.75 });
      }
    }

    for (const p of this.world.particles) {
      this.sprites.draw(ctx, p.sprite, p.x, p.y, {
        scale: p.scale,
        alpha: p.life / p.max,
        anchorY: 0.5,
        flip: p.dir < 0,
      });
    }

    if (this.showHitboxes) this.drawBoxes();
    ctx.restore();
  }

  drawBackdrop() {
    const ctx = this.ctx;
    const menu = this.sprites.img("ui/menu_barretos.png") || this.sprites.img("ui/menu_cenario.png");
    const bg = menu || this.sprites.img("stages/rooftop.png");
    if (bg) ctx.drawImage(bg, 0, 0, this.canvas.width, this.canvas.height);
  }

  drawBoxes() {
    const ctx = this.ctx;
    for (const f of this.world.fighters) {
      const h = hurtbox(f);
      ctx.strokeStyle = "rgba(80,220,255,0.85)";
      ctx.strokeRect(h.x, h.y, h.w, h.h);
      if (f.move && f.move.hitbox && f.stateTime >= f.move.startup && f.stateTime < f.move.startup + f.move.active) {
        const hb = worldHitbox(f, f.move.hitbox);
        ctx.fillStyle = "rgba(255,60,80,0.35)";
        ctx.fillRect(hb.x, hb.y, hb.w, hb.h);
      }
    }
  }
}

function applyProj(owner, victim, pr, world) {
  const move = {
    damage: pr.damage,
    kbBase: pr.kbBase,
    kbScale: pr.kbScale,
    angle: pr.angle,
    hitstun: 16,
    hitlag: 6,
    pull: pr.pull,
  };
  owner.facing = pr.facing;
  applyHit(owner, victim, move, world);
}
