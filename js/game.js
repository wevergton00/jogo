import { CHARACTERS, CHARACTER_IDS, ROSTER } from "./characters.js";
import { Fighter } from "./player.js";
import { STAGES, STAGE_IDS } from "./stage.js";
import { hurtbox, worldHitbox, aabb, applyHit } from "./combat.js";
import { makeCpuInput } from "./ai.js";
import { burst, tickParticles, drawParticles } from "./fx.js";
import { drawRope, drawSpinRing, handPos, ropeStyle } from "./lasso.js";
import { findHorse } from "./horse.js";

const MENU = [
  { id: "versus", label: "Versus local" },
  { id: "treino", label: "Treinamento" },
  { id: "arcade", label: "Arcade" },
  { id: "opcoes", label: "Opções" },
  { id: "dicas", label: "Dicas" },
  { id: "sair", label: "Sair" },
];

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
    this.p1Pick = 1;
    this.p2Pick = 0;
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
    this.callout = { text: "", timer: 0 };
    this.stageId = "parque";
    this.arenaIndex = 0;
    this.rosterCursor = 0;
    this.charFocus = "p1";
    this.fullscreen = !!document.fullscreenElement;
    this.matchLoad = 0;
    this.previewTick = 0;
    this.autoCount = false;
  }

  setMode(mode) {
    this.mode = mode;
    this.input.consume?.();
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.style.pointerEvents = mode === "fight" ? "none" : "auto";
    const ids = [
      "screen-load",
      "screen-title",
      "screen-menu",
      "screen-dicas",
      "screen-charsel",
      "screen-arena",
      "screen-matchload",
      "screen-options",
      "screen-pause",
      "screen-results",
    ];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    }
    const hud = document.getElementById("hud");
    const help = document.getElementById("help");
    const pads = document.getElementById("pads");
    const train = document.getElementById("train-panel");
    const intro = document.getElementById("intro-banner");
    const callout = document.getElementById("move-callout");
    hud?.classList.add("hidden");
    help?.classList.add("hidden");
    pads?.classList.add("hidden");
    train?.classList.add("hidden");
    intro?.classList.add("hidden");
    callout?.classList.add("hidden");
    document.body.classList.remove("pvp-fight");
    if (mode === "title") document.getElementById("screen-title").classList.remove("hidden");
    if (mode === "menu") {
      document.getElementById("screen-menu").classList.remove("hidden");
      this.renderMenu();
      this.audio.playMusic("menu");
    }
    if (mode === "charsel") {
      const el = document.getElementById("screen-charsel");
      if (el) {
        el.classList.remove("hidden");
        el.style.display = "grid";
      }
      this.p1Ready = false;
      this.p2Ready = this.p2cpu;
      try {
        this.renderCharSel();
      } catch (err) {
        console.error("charsel", err);
      }
    }
    if (mode === "dicas") document.getElementById("screen-dicas")?.classList.remove("hidden");
    if (mode === "arena") {
      document.getElementById("screen-arena")?.classList.remove("hidden");
      this.renderArena();
    }
    if (mode === "matchload") {
      document.getElementById("screen-matchload")?.classList.remove("hidden");
      this.matchLoad = 0;
      const fill = document.getElementById("matchload-fill");
      if (fill) fill.style.width = "6%";
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
      if (this.training) train?.classList.remove("hidden");
      if (help) help.style.cssText = "display:none!important";
      if (pads) {
        pads.classList.add("hidden");
        pads.setAttribute("hidden", "");
        pads.style.cssText =
          "display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important";
      }
      try {
        this.audio.playMusic("battle");
      } catch {}
    }
  }

  renderMenu() {
    document.querySelectorAll("[data-hub]").forEach((btn, i) => {
      btn.classList.toggle("active", i === this.menuIndex);
    });
  }

  confirmMenu() {
    this.launch(MENU[this.menuIndex]?.id || "versus");
  }

  launch(kind) {
    try {
      this.audio.sfx("confirm");
    } catch {}
    if (kind === "opcoes") {
      this.setMode("options");
      return;
    }
    if (kind === "dicas") {
      this.setMode("dicas");
      return;
    }
    if (kind === "sair") {
      this.setMode("title");
      return;
    }
    this.training = kind === "treino";
    this.debugCpu = kind === "arcade";
    this.p2cpu = kind !== "versus";
    this.p1Pick = 1;
    this.p2Pick = 0;
    this.rosterCursor = 0;
    this.charFocus = "p1";
    this.p1Ready = false;
    this.p2Ready = this.p2cpu;
    this.setMode("charsel");
  }

  cyclePick(port, dir) {
    const n = CHARACTER_IDS.length;
    if (port === "p1") this.p1Pick = (this.p1Pick + dir + n) % n;
    else this.p2Pick = (this.p2Pick + dir + n) % n;
    this.audio.sfx("select");
    this.renderCharSel();
  }

  renderCharSel() {
    const ids = CHARACTER_IDS;
    const p1 = CHARACTERS[ids[this.p1Pick]];
    const p2 = CHARACTERS[ids[this.p2Pick]];
    if (!p1 || !p2) return;
    const fill = (prefix, ch) => {
      const name = document.getElementById(`${prefix}-name`);
      const arch = document.getElementById(`${prefix}-arch`);
      const port = document.getElementById(`${prefix}-portrait`);
      if (name) name.textContent = ch.name;
      if (arch) arch.textContent = ch.archetype;
      if (port) port.style.backgroundImage = `url(assets/sprites/${ch.portrait})`;
    };
    fill("p1", p1);
    fill("p2", p2);
    document.getElementById("slot-p1")?.classList.toggle("ready", this.p1Ready);
    document.getElementById("slot-p2")?.classList.toggle("ready", this.p2Ready);
    const cpuBtn = document.getElementById("btn-cpu");
    if (cpuBtn) {
      cpuBtn.textContent = this.p2cpu ? "P2: CPU" : "P2: Humano";
      cpuBtn.onclick = (e) => {
        e.stopPropagation();
        this.p2cpu = !this.p2cpu;
        this.audio.sfx("ui");
        this.renderCharSel();
      };
    }
    const startBtn = document.getElementById("btn-start");
    if (startBtn) startBtn.onclick = () => this.goArena();
    const p1p = document.getElementById("p1-portrait");
    const p2p = document.getElementById("p2-portrait");
    if (p1p) p1p.onclick = () => this.cyclePick("p1", 1);
    if (p2p) p2p.onclick = () => this.cyclePick("p2", 1);
    const soon = document.getElementById("roster-soon");
    if (soon) {
      soon.innerHTML = ROSTER.filter((r) => r.locked)
        .map((r) => {
          const bg = r.portrait ? `assets/sprites/${r.portrait}` : "";
          return `<div class="soon-card" style="background-image:url('${bg}')"><span>EM BREVE</span></div>`;
        })
        .join("");
    }
    this.tickPreview(true);
  }

  tickPreview(force) {
    this.previewTick++;
    if (!force && this.previewTick % 22 !== 0) return;
    const frame = Math.floor(this.previewTick / 22);
    const setIdle = (id, pick) => {
      const img = document.getElementById(id);
      const ch = CHARACTERS[CHARACTER_IDS[pick]];
      const frames = ch?.anim?.idle || [];
      if (!img || !frames.length) return;
      img.src = `assets/sprites/${frames[frame % frames.length]}`;
    };
    setIdle("p1-idle", this.p1Pick);
    setIdle("p2-idle", this.p2Pick);
  }

  goArena() {
    this.audio.sfx("confirm");
    this.setMode("arena");
  }

  renderArena(rebuild = true) {
    const list = document.getElementById("arena-list");
    if (rebuild && list) {
      list.innerHTML = STAGE_IDS.map((id, i) => {
        const s = STAGES[id];
        return `<button type="button" class="arena-thumb ${i === this.arenaIndex ? "active" : ""}" data-i="${i}">
          <i style="background-image:url('assets/${s.thumb}')"></i>
          <span>${s.name}</span>
        </button>`;
      }).join("");
      list.querySelectorAll(".arena-thumb").forEach((btn) => {
        btn.onmouseenter = () => {
          const i = +btn.dataset.i;
          if (i === this.arenaIndex) return;
          this.arenaIndex = i;
          this.renderArena(false);
        };
        btn.onclick = () => {
          this.arenaIndex = +btn.dataset.i;
          this.audio.sfx("select");
          this.renderArena(false);
        };
      });
    } else if (list) {
      list.querySelectorAll(".arena-thumb").forEach((btn, i) => {
        btn.classList.toggle("active", i === this.arenaIndex);
      });
    }
    const s = STAGES[STAGE_IDS[this.arenaIndex]];
    this.stageId = s.id;
    const hero = document.getElementById("arena-hero");
    if (hero) hero.style.backgroundImage = `url(assets/${s.thumb})`;
    const name = document.getElementById("arena-name");
    const desc = document.getElementById("arena-desc");
    if (name) name.textContent = s.name;
    if (desc) desc.textContent = s.desc || "";
  }

  beginMatch() {
    this.audio.sfx("confirm");
    this.autoCount = true;
    this.setMode("matchload");
  }

  toggleFullscreen() {
    const root = document.documentElement;
    const go = !document.fullscreenElement;
    const req = go ? root.requestFullscreen?.() : document.exitFullscreen?.();
    Promise.resolve(req)
      .catch(() => {})
      .finally(() => {
        this.fullscreen = !!document.fullscreenElement;
        document.body.classList.toggle("is-fs", this.fullscreen);
        try {
          localStorage.setItem("aurora-fs", this.fullscreen ? "1" : "0");
        } catch {}
        this.renderOptions();
      });
  }

  syncFullscreenButton() {
    this.fullscreen = !!document.fullscreenElement;
    document.body.classList.toggle("is-fs", this.fullscreen);
    const btn = document.getElementById("opt-fs");
    if (!btn) return;
    btn.classList.toggle("on", this.fullscreen);
    btn.textContent = this.fullscreen ? "☑ ATIVADA" : "☐ DESATIVADA";
  }

  renderOptions() {
    this.syncFullscreenButton();
    const fsBtn = document.getElementById("opt-fs");
    if (fsBtn) fsBtn.onclick = () => this.toggleFullscreen();
    const body = document.getElementById("options-body");
    const rows = ["left", "right", "up", "down", "light", "strong", "special", "shield", "grab"];
    const labels = {
      left: "Esquerda",
      right: "Direita",
      up: "Pulo / Cima",
      down: "Abaixar",
      light: "Básico",
      strong: "Forte",
      special: "Especial",
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
      .map(
        (l, i) =>
          `<button class="menu-item ${i === this.pauseIndex ? "active" : ""}" data-i="${i}">${l}${
            l === "Hitboxes" ? (this.showHitboxes ? " · ON" : " · OFF") : ""
          }</button>`
      )
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
    const stage = structuredClone(STAGES[this.stageId] || STAGES.parque);
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
      horses: [],
      audio: this.audio,
      shake: 0,
      combo: null,
      frame: 0,
      finished: false,
      intro: "wait",
      introTimer: 0,
      introPhase: 0,
      train: this.training
        ? { lastMove: "—", lastDamage: 0, combo: 0, maxCombo: 0, hitstun: 0, recovery: 0, launch: "0" }
        : null,
      spawnFx: (kind, x, y, dir) => this.spawnFx(kind, x, y, dir),
      burst: (kind, x, y, dir) => burst(this.world, kind, x, y, dir),
      spawnProjectile: (owner, spec) => this.spawnProjectile(owner, spec),
      onKo: (p) => this.onKo(p),
      announce: (text, time) => this.announce(text, time),
    };
    this.callout = { text: "", timer: 0 };
    this.setMode("fight");
    this.updateHud();
    if (this.autoCount) {
      this.world.intro = "count";
      this.world.introTimer = 0;
      this.world.fighters[0].introPose = this.world.fighters[0].char.id === "evertinho";
      this.world.fighters[1].introPose = this.world.fighters[1].char.id === "evertinho";
      this.showIntro("");
    } else {
      this.showIntro("PRESSIONE ENTER");
    }
    this.autoCount = false;
  }

  announce(text, time = 48) {
    this.callout = { text, timer: time };
    const el = document.getElementById("move-callout");
    if (el) {
      el.textContent = text;
      el.classList.remove("hidden");
    }
  }

  showIntro(text) {
    const el = document.getElementById("intro-banner");
    if (!el) return;
    el.textContent = text;
    el.classList.remove("hidden");
    el.classList.toggle("lute", text === "LUTE!");
  }

  hideIntro() {
    document.getElementById("intro-banner")?.classList.add("hidden");
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
    this.hideIntro();
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
    if (this.callout.timer > 0) {
      this.callout.timer--;
      if (this.callout.timer <= 0) document.getElementById("move-callout")?.classList.add("hidden");
    }

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
      if (this.input.menuOk || this.input.enterPressed) {
        this.input.consume();
        this.confirmMenu();
      }
      return;
    }
    if (this.mode === "dicas") {
      if (this.input.menuBack) this.setMode("menu");
      return;
    }
    if (this.mode === "charsel") {
      this.tickPreview(false);
      if (this.input.p1.leftPressed) this.cyclePick("p1", -1);
      if (this.input.p1.rightPressed) this.cyclePick("p1", 1);
      if (!this.p2cpu) {
        if (this.input.p2.leftPressed) this.cyclePick("p2", -1);
        if (this.input.p2.rightPressed) this.cyclePick("p2", 1);
      } else {
        if (this.input.menuLeft && !this.input.p1.leftPressed) this.cyclePick("p2", -1);
        if (this.input.menuRight && !this.input.p1.rightPressed) this.cyclePick("p2", 1);
      }
      if (this.input.menuBack) {
        this.input.consume();
        this.setMode("menu");
        return;
      }
      if (this.input.enterPressed) {
        this.input.consume();
        this.goArena();
      }
      return;
    }
    if (this.mode === "arena") {
      if (this.input.menuUp) {
        this.arenaIndex = (this.arenaIndex + STAGE_IDS.length - 1) % STAGE_IDS.length;
        this.audio.sfx("ui");
        this.renderArena(false);
      }
      if (this.input.menuDown) {
        this.arenaIndex = (this.arenaIndex + 1) % STAGE_IDS.length;
        this.audio.sfx("ui");
        this.renderArena(false);
      }
      if (this.input.enterPressed || this.input.menuOk) {
        this.input.consume();
        this.beginMatch();
        return;
      }
      if (this.input.menuBack) {
        this.input.consume();
        this.setMode("charsel");
      }
      return;
    }
    if (this.mode === "matchload") {
      this.matchLoad++;
      const fill = document.getElementById("matchload-fill");
      if (fill) fill.style.width = `${Math.min(100, 8 + this.matchLoad * 1.2)}%`;
      const lab = document.getElementById("matchload-label");
      if (lab) {
        lab.textContent =
          this.matchLoad < 30 ? "Preparando arena…" : this.matchLoad < 60 ? "Posicionando lutadores…" : "Quase lá…";
      }
      if (this.matchLoad >= 85 || this.input.enterPressed) this.startFight();
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
      if (this.input.menuOk || this.input.enterPressed) this.confirmResult(this.resultIndex);
      return;
    }
    if (this.mode !== "fight" || !this.world) return;

    const w = this.world;
    if (w.intro === "wait") {
      for (const f of w.fighters) f.animTime++;
      if (this.input.enterPressed) {
        w.intro = "count";
        w.introTimer = 0;
        w.introPhase = 0;
        w.fighters[0].introPose = w.fighters[0].char.id === "evertinho";
        w.fighters[1].introPose = w.fighters[1].char.id === "evertinho";
        this.audio.sfx("confirm");
        this.showIntro("");
      }
      this.updateCamera();
      return;
    }
    if (w.intro === "count") {
      w.introTimer++;
      for (const f of w.fighters) f.animTime++;
      const phases = [
        { at: 1, text: "", pose: true },
        { at: 48, text: "3", sfx: "countdown", pose: false },
        { at: 96, text: "2", sfx: "countdown" },
        { at: 144, text: "1", sfx: "countdown" },
        { at: 192, text: "LUTE!", sfx: "lute" },
        { at: 250, text: null },
      ];
      for (const p of phases) {
        if (w.introTimer === p.at) {
          if (p.text === null) {
            w.intro = null;
            for (const f of w.fighters) f.introPose = false;
            this.hideIntro();
          } else {
            this.showIntro(p.text);
            if (p.sfx) this.audio.sfx(p.sfx);
            if (p.pose === false) for (const f of w.fighters) f.introPose = false;
          }
        }
      }
      this.updateCamera();
      return;
    }

    if (this.input.pausePressed) {
      this.pauseIndex = 0;
      this.setMode("pause");
      this.renderPause();
      return;
    }
    if (this.training && this.input.just?.("KeyH")) this.showHitboxes = !this.showHitboxes;
    if (this.training && this.input.just?.("KeyR")) {
      this.resetTraining();
      return;
    }

    w.frame++;
    const [p1, p2] = w.fighters;
    const i1 = this.input.p1;
    const i2 = p2.cpu ? makeCpuInput(p2, p1, w, this.aiLevel, { dummy: this.training }) : this.input.p2;
    p1.update(i1, w);
    p2.update(i2, w);
    this.separate(p1, p2);
    this.updateProjectiles();
    this.updateHorses();
    w.particles = tickParticles(w.particles);
    if (w.shake > 0) w.shake *= 0.84;
    if (w.combo) {
      w.combo.timer--;
      if (w.combo.timer <= 0) w.combo = null;
    }
    this.updateCamera();
    this.updateHud();
  }

  resetTraining() {
    if (!this.world) return;
    const stage = this.world.stage;
    const [a, b] = this.world.fighters;
    a.x = stage.spawn[0].x;
    b.x = stage.spawn[1].x;
    a.y = b.y = stage.ground.y;
    a.vx = b.vx = a.vy = b.vy = 0;
    a.percent = b.percent = 0;
    a.combo = b.combo = 0;
    a.facing = 1;
    b.facing = -1;
    a.enter("idle");
    b.enter("idle");
    a.mounted = b.mounted = false;
    a.lassoLock = b.lassoLock = null;
    a.shock = b.shock = null;
    this.world.projectiles = [];
    this.world.horses = [];
    this.world.particles = [];
    this.world.combo = null;
    if (this.world.train) {
      this.world.train.combo = 0;
      this.world.train.lastMove = "RESET";
    }
    this.audio.sfx("ui");
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

  updateHorses() {
    const w = this.world;
    for (const h of w.horses) h.update(w);
    w.horses = w.horses.filter((h) => !h.gone(w));
  }

  updateProjectiles() {
    const w = this.world;
    w.projectiles = w.projectiles.filter((pr) => {
      pr.age++;
      if (pr.linger && pr.age > 20) pr.vx *= 0.86;
      pr.x += pr.vx;
      const box = { x: pr.x - pr.w / 2, y: pr.y - pr.h / 2, w: pr.w, h: pr.h };
      for (const f of w.fighters) {
        if (f.id === pr.ownerId || !f.alive) continue;
        if (aabb(box, hurtbox(f))) {
          const owner = w.fighters.find((x) => x.id === pr.ownerId);
          if (owner) {
            applyHit(owner, f, pr, w);
          }
          const fx = pr.fx || "burst";
          burst(w, fx, pr.x, pr.y, pr.facing);
          this.spawnFx(fx === "explode" ? "explode" : "burst", pr.x, pr.y, pr.facing);
          return false;
        }
      }
      const b = w.stage.blast;
      return pr.age < pr.life && pr.x > b.l && pr.x < b.r;
    });
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
        p.char.name + (p.cpu ? (this.training ? " (dummy)" : " (CPU)") : "") + (p.mounted ? " 🐎" : "");
      const pct = document.getElementById(`hud-pct-${n}`);
      pct.textContent = `${Math.floor(p.percent)}%`;
      pct.style.color = p.percent > 100 ? "#ff4d4d" : p.char.color;
      document.getElementById(`hud-face-${n}`).style.backgroundImage = `url(assets/sprites/${p.char.portrait})`;
      const stocks = document.getElementById(`hud-stocks-${n}`);
      const nStocks = Math.min(8, p.stocks);
      stocks.innerHTML = Array.from(
        { length: nStocks },
        () => `<span class="stock" style="background:${p.char.color}"></span>`
      ).join("");
    };
    set(1, a);
    set(2, b);
    const combo = document.getElementById("hud-combo");
    combo.textContent = this.world.combo && this.world.combo.count > 1 ? `${this.world.combo.count} HIT` : "";
    document.getElementById("hud-timer").textContent = this.training ? "TREINO" : "∞";

    if (this.training && this.world.train) {
      const t = this.world.train;
      const setTxt = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      setTxt("tr-move", t.lastMove || "—");
      setTxt("tr-dmg", t.lastDamage);
      setTxt("tr-combo", t.combo);
      setTxt("tr-max", t.maxCombo);
      setTxt("tr-stun", t.hitstun);
      setTxt("tr-rec", t.recovery);
      setTxt("tr-kb", t.launch);
      const h = findHorse(this.world, a.id);
      setTxt("tr-horse", h ? `${h.state} ${Math.max(0, h.hp)}hp` : "não");
    }
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

    const bg = this.sprites.img(this.world.stage.bg || "stages/rooftop.png");
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

    for (const horse of this.world.horses || []) {
      if (horse.state === "mounted") continue;
      this.sprites.draw(ctx, "evertinho/horse.png", horse.x, horse.y, {
        flip: horse.facing < 0,
        scale: horse.scale,
        anchorY: 1,
        alpha: horse.state === "knocked" ? 0.85 : 1,
      });
    }

    for (const pr of this.world.projectiles) {
      if (pr.rope) {
        const owner = this.world.fighters.find((x) => x.id === pr.ownerId);
        if (owner) {
          const hp = handPos(owner);
          drawRope(ctx, hp.x, hp.y, pr.x, pr.y, ropeStyle(pr.ropeKind || pr.kind));
        }
      }
      this.sprites.draw(ctx, pr.sprite, pr.x, pr.y + pr.h / 2, {
        flip: pr.facing < 0,
        scale: pr.scale || 0.25,
        anchorY: 1,
      });
    }

    for (const f of this.world.fighters) {
      if (f.lassoLock) {
        const t = this.world.fighters.find((x) => x.id === f.lassoLock.targetId);
        if (t && (t.state === "snared" || t.state === "hurt")) {
          const hp = handPos(f);
          drawRope(ctx, hp.x, hp.y, t.x, t.y - 42, ropeStyle("lasso"));
        }
      }
    }

    for (const f of this.world.fighters) {
      if (!f.alive && f.stocks <= 0 && f.state !== "knockedOut" && f.state !== "win") continue;
      const spr = f.currentSprite();
      const alpha = f.intangible > 0 && this.world.frame % 6 < 3 ? 0.45 : 1;
      this.sprites.draw(ctx, spr, f.x, f.y, {
        flip: f.facing < 0,
        scale: f.char.scale * (f.mounted ? 1.08 : 1),
        alpha,
      });
      if (f.state === "shield") {
        this.sprites.draw(ctx, "fx/shield.png", f.x, f.y - 40, { scale: 0.28, anchorY: 0.5, alpha: 0.75 });
      }
      if (f.move?.ring && f.stateTime >= f.move.startup) {
        drawSpinRing(ctx, f, f.move.ring);
      }
      if (f.state === "snared") {
        ctx.save();
        ctx.strokeStyle = "#ffe56b";
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(f.x, f.y - 44, 34, 48, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    for (const p of this.world.particles) {
      if (!p.sprite) continue;
      this.sprites.draw(ctx, p.sprite, p.x, p.y, {
        scale: p.scale,
        alpha: p.life / p.max,
        anchorY: 0.5,
        flip: p.dir < 0,
      });
    }
    drawParticles(ctx, this.world.particles);

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
    for (const pr of this.world.projectiles) {
      ctx.strokeStyle = "rgba(255,200,60,0.85)";
      ctx.strokeRect(pr.x - pr.w / 2, pr.y - pr.h / 2, pr.w, pr.h);
    }
  }
}
