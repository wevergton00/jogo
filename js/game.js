import { CHARACTERS, CHARACTER_IDS, ALL_CHARACTER_IDS } from "./characters.js";
import { Fighter } from "./player.js";
import { STAGES, STAGE_IDS } from "./stage.js";
import { hurtbox, worldHitbox, aabb, applyHit } from "./combat.js";
import { makeCpuInput } from "./ai.js";

const MENU = [
  { id: "versus", label: "Versus", icon: "⚔️", sub: "2 jogadores ou vs CPU" },
  { id: "historia", label: "História", icon: "📖", sub: "A Lenda da Aurora" },
  { id: "arcade", label: "Arcade", icon: "🕹️", sub: "Sequência & Chefes" },
  { id: "eight_sec", label: "8 Segundos", icon: "⏱️", sub: "Desafio do Rodeio" },
  { id: "lasso_target", label: "Tiro de Laço", icon: "🎯", sub: "Precisão com Alvos" },
  { id: "treino", label: "Treinamento", icon: "🥊", sub: "Comandos & Combos" },
  { id: "custom", label: "Armário", icon: "🤠", sub: "Chapéus & Laços" },
  { id: "opcoes", label: "Opções", icon: "⚙️", sub: "Controles & Teclas" },
];

const STORY_CHAPTERS = [
  {
    num: 1,
    title: "O Desafio na Arena de Barretos",
    stage: "barretos",
    playerChar: "evertinho",
    enemyChar: "fernanda",
    enemyName: "Fernanda",
    intro: "Everttinho chega a Barretos para a lendária Festa do Peão, mas é desafiado por Fernanda, a maga técnica e guardiã dos felinos místicos!",
    dialogue: [
      { speaker: "Everttinho", text: "Com meu laço firme e a fé no peito, nenhum desafio em Barretos me assusta!" },
      { speaker: "Fernanda", text: "Vamos ver se o seu laço é mais rápido que a velocidade mágica do Didi e do Tom!" },
    ],
    outro: "Fernanda reconhece a perícia de Everttinho com o laço e revela: 'O Touro de Ferro invadiu o Cerrado... Você precisa detê-lo!'",
  },
  {
    num: 2,
    title: "A Força Bruta do Cerrado",
    stage: "fazenda",
    playerChar: "evertinho",
    enemyChar: "nox",
    enemyName: "Nox",
    intro: "Nas colinas da Fazenda ao pôr do sol, Everttinho encontra Nox, o guerreiro brawler de Barretos que bloqueia a passagem para as terras antigas.",
    dialogue: [
      { speaker: "Nox", text: "Nenhum laço segura a força bruta dos meus punhos de aço, peão!" },
      { speaker: "Everttinho", text: "Força sem jeito não laça bezerro! Segura essa puxada!" },
    ],
    outro: "Nox cai de joelhos impressionado com a agilidade do laço de Everttinho: 'Você é digno... mas o verdadeiro Touro de Ferro está à solta!'",
  },
  {
    num: 3,
    title: "A Ira do Touro de Ferro",
    stage: "cerrado_tempestade",
    playerChar: "evertinho",
    enemyChar: "touro_ferro",
    enemyName: "Touro de Ferro (Chefe)",
    intro: "A tempestade cai violenta sobre o Cerrado. Das sombras surge o temível Touro de Ferro, uma besta colossal com blindagem pesada!",
    dialogue: [
      { speaker: "Touro de Ferro", text: "MUUUUU! QUEM OUSA ENFRENTAR A BLINDAGEM DE BARRETOS?!" },
      { speaker: "Everttinho", text: "Vem, Trovão! Hoje é dia de mostrar o poder do rodeio contra esse titã!" },
    ],
    outro: "Com uma laçada precisa no chifre de aço, Everttinho derruba o Touro de Ferro! Uma luz elétrica risca os céus...",
  },
  {
    num: 4,
    title: "O Cavaleiro da Tempestade",
    stage: "curral_fantasma",
    playerChar: "evertinho",
    enemyChar: "cavaleiro_tempestade",
    enemyName: "Cavaleiro da Tempestade (Chefe)",
    intro: "No misterioso Curral Fantasma, relâmpagos descem dos céus revelando o Cavaleiro da Tempestade montado em seu corcel elétrico!",
    dialogue: [
      { speaker: "Cavaleiro da Tempestade", text: "O Barão roubou a Ferradura da Aurora! Você jamais passará pela minha tempestade!" },
      { speaker: "Everttinho", text: "Um laçador de verdade não teme relâmpago! Vou recuperar a Aurora de Barretos!" },
    ],
    outro: "O Cavaleiro da Tempestade dissipa seus raios e saúda Everttinho: 'O portal da Aurora está aberto. Salve o nosso legado!'",
  },
  {
    num: 5,
    title: "O Duelo da Ferradura da Aurora",
    stage: "arena_aurora",
    playerChar: "evertinho",
    enemyChar: "barao_ferradura",
    enemyName: "Barão da Ferradura Negra (Chefe Final)",
    intro: "No santuário cósmico da Aurora, o Barão da Ferradura Negra tenta corromper o poder sagrado de Barretos!",
    dialogue: [
      { speaker: "Barão da Ferradura Negra", text: "Tarde demais, peão! O poder da Ferradura da Aurora agora pertence à escuridão!" },
      { speaker: "Everttinho", text: "A Aurora nasceu no peito de quem luta com honra! Seguuura, peão, esse é o Grande Rodeio da Aurora!" },
    ],
    outro: "Com um golpe definitivo de laço cósmico e o galope triunfal do Cavalo Trovão, Everttinho derrota o Barão e restaura a Ferradura da Aurora para toda Barretos!",
  },
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
    this.stagePick = 0;

    this.p1Pick = 0;
    this.p2Pick = 1;
    this.p1Ready = false;
    this.p2Ready = false;
    this.p2cpu = false;
    this.aiLevel = "normal";

    this.gameSubMode = "versus"; // "versus", "historia", "arcade", "eight_sec", "treino"
    this.storyChapterIndex = 0;
    this.arcadeStageIndex = 0;
    this.arcadeScore = 0;

    // 8 Segundos Mode
    this.eightSecTimer = 8.0;
    this.eightSecSurvived = false;

    // Tiro de Laço Minigame
    this.lassoGame = null;

    // Customizações Cosméticas
    this.customHat = "default";
    this.customLasso = "gold";
    this.customTitle = "Peão de Barretos";

    // Treinamento
    this.training = false;
    this.dummyMode = "neutral";
    this.showHitboxes = false;

    this.world = null;
    this.cam = { x: 800, y: 420, z: 1 };
    this.acc = 0;
    this.last = performance.now();

    this.narratorBanner = "";
    this.narratorTimer = 0;

    this.setupGlobalEvents();
  }

  setupGlobalEvents() {
    const btnEnterTitle = document.getElementById("btn-enter-title");
    if (btnEnterTitle) {
      btnEnterTitle.onclick = (e) => {
        e.preventDefault();
        this.audio.unlock();
        this.audio.sfx("confirm");
        this.setMode("menu");
      };
    }
  }

  setMode(mode) {
    this.mode = mode;
    const ids = [
      "screen-load",
      "screen-title",
      "screen-menu",
      "screen-charsel",
      "screen-story",
      "screen-eight-sec",
      "screen-lasso-game",
      "screen-custom",
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
    const trainingHud = document.getElementById("training-hud");

    hud?.classList.add("hidden");
    help?.classList.add("hidden");
    pads?.classList.add("hidden");
    trainingHud?.classList.add("hidden");

    if (mode === "title") {
      document.getElementById("screen-title")?.classList.remove("hidden");
    } else if (mode === "menu") {
      document.getElementById("screen-menu")?.classList.remove("hidden");
      this.renderMenu();
      this.audio.playMusic("menu");
    } else if (mode === "charsel") {
      document.getElementById("screen-charsel")?.classList.remove("hidden");
      this.p1Ready = false;
      this.p2Ready = this.p2cpu;
      this.renderCharSel();
    } else if (mode === "story_intro" || mode === "story_dialogue") {
      document.getElementById("screen-story")?.classList.remove("hidden");
      this.renderStoryScreen();
    } else if (mode === "eight_sec_intro") {
      document.getElementById("screen-eight-sec")?.classList.remove("hidden");
      this.renderEightSecScreen();
    } else if (mode === "lasso_minigame") {
      document.getElementById("screen-lasso-game")?.classList.remove("hidden");
      this.startLassoMinigame();
    } else if (mode === "custom") {
      document.getElementById("screen-custom")?.classList.remove("hidden");
      this.renderCustomScreen();
    } else if (mode === "options") {
      document.getElementById("screen-options")?.classList.remove("hidden");
      this.renderOptions();
    } else if (mode === "pause") {
      document.getElementById("screen-pause")?.classList.remove("hidden");
      this.renderPause();
    } else if (mode === "results") {
      document.getElementById("screen-results")?.classList.remove("hidden");
    } else if (mode === "fight") {
      hud?.classList.remove("hidden");
      if (this.training) trainingHud?.classList.remove("hidden");
      try {
        const stage = this.world?.stage;
        const track = stage?.theme === "storm" || stage?.id === "arena_aurora" ? "boss" : "rodeo";
        this.audio.playMusic(track);
      } catch {}
    }
  }

  renderMenu() {
    const nav = document.getElementById("main-nav");
    if (!nav) return;
    nav.innerHTML = MENU.map(
      (item, i) => `
      <button type="button" class="hub-btn ${i === this.menuIndex ? "active" : ""}" data-hub="${item.id}">
        <span class="hub-ico">${item.icon}</span>
        <span class="hub-txt"><strong>${item.label}</strong><small>${item.sub}</small></span>
      </button>`
    ).join("");

    nav.querySelectorAll(".hub-btn").forEach((btn, i) => {
      btn.onmouseenter = () => {
        this.menuIndex = i;
        nav.querySelectorAll(".hub-btn").forEach((b, j) => b.classList.toggle("active", j === this.menuIndex));
      };
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.menuIndex = i;
        this.launchMenuChoice(btn.getAttribute("data-hub"));
      };
    });
  }

  confirmMenu() {
    const item = MENU[this.menuIndex];
    if (item) this.launchMenuChoice(item.id);
  }

  launchMenuChoice(id) {
    try {
      this.audio.sfx("confirm");
    } catch {}

    if (id === "opcoes") {
      this.setMode("options");
      return;
    }
    if (id === "custom") {
      this.setMode("custom");
      return;
    }
    if (id === "lasso_target") {
      this.setMode("lasso_minigame");
      return;
    }
    if (id === "eight_sec") {
      this.gameSubMode = "eight_sec";
      this.setMode("eight_sec_intro");
      return;
    }
    if (id === "historia") {
      this.gameSubMode = "historia";
      this.storyChapterIndex = 0;
      this.setMode("story_dialogue");
      return;
    }
    if (id === "arcade") {
      this.gameSubMode = "arcade";
      this.arcadeStageIndex = 0;
      this.arcadeScore = 0;
      this.p2cpu = true;
      this.training = false;
      this.setMode("charsel");
      return;
    }

    // Versus / Treinamento
    this.gameSubMode = id;
    this.training = id === "treino";
    this.p2cpu = id === "treino";
    this.setMode("charsel");
  }

  renderCharSel() {
    const ids = CHARACTER_IDS;
    const p1 = CHARACTERS[ids[this.p1Pick]];
    const p2 = CHARACTERS[ids[this.p2Pick]];

    const p1Name = document.getElementById("p1-name");
    const p2Name = document.getElementById("p2-name");
    const p1Arch = document.getElementById("p1-arch");
    const p2Arch = document.getElementById("p2-arch");
    const p1Port = document.getElementById("p1-portrait");
    const p2Port = document.getElementById("p2-portrait");

    if (p1Name) p1Name.textContent = p1.name;
    if (p2Name) p2Name.textContent = p2.name;
    if (p1Arch) p1Arch.textContent = `${p1.archetype} · ${p1.title}`;
    if (p2Arch) p2Arch.textContent = `${p2.archetype} · ${p2.title}`;

    if (p1Port) p1Port.style.backgroundImage = `url(assets/sprites/${p1.portrait})`;
    if (p2Port) p2Port.style.backgroundImage = `url(assets/sprites/${p2.portrait})`;

    document.getElementById("slot-p1")?.classList.toggle("ready", this.p1Ready);
    document.getElementById("slot-p2")?.classList.toggle("ready", this.p2Ready);

    const stg = STAGES[STAGE_IDS[this.stagePick]];
    const stageNameEl = document.getElementById("stage-name-display");
    const stageSubEl = document.getElementById("stage-sub-display");
    if (stageNameEl) stageNameEl.textContent = stg.name;
    if (stageSubEl) stageSubEl.textContent = stg.subtitle;

    const cpuBtn = document.getElementById("btn-cpu");
    if (cpuBtn) {
      cpuBtn.textContent = this.p2cpu ? "P2: CPU" : "P2: Humano";
      cpuBtn.onclick = (e) => {
        e.preventDefault();
        this.p2cpu = !this.p2cpu;
        if (this.p2cpu) this.p2Ready = true;
        this.audio.sfx("select");
        this.renderCharSel();
      };
    }

    const swapP1 = (e) => {
      e?.preventDefault();
      this.p1Pick = (this.p1Pick + 1) % ids.length;
      this.audio.sfx("select");
      this.renderCharSel();
    };

    const swapP2 = (e) => {
      e?.preventDefault();
      this.p2Pick = (this.p2Pick + 1) % ids.length;
      this.audio.sfx("select");
      this.renderCharSel();
    };

    if (p1Port) p1Port.onclick = swapP1;
    const btnP1Swap = document.getElementById("btn-p1-swap");
    if (btnP1Swap) btnP1Swap.onclick = swapP1;

    if (p2Port) p2Port.onclick = swapP2;
    const btnP2Swap = document.getElementById("btn-p2-swap");
    if (btnP2Swap) btnP2Swap.onclick = swapP2;

    const btnStagePrev = document.getElementById("btn-stage-prev");
    if (btnStagePrev) {
      btnStagePrev.onclick = (e) => {
        e.preventDefault();
        this.stagePick = (this.stagePick + STAGE_IDS.length - 1) % STAGE_IDS.length;
        this.audio.sfx("select");
        this.renderCharSel();
      };
    }

    const btnStageNext = document.getElementById("btn-stage-next");
    if (btnStageNext) {
      btnStageNext.onclick = (e) => {
        e.preventDefault();
        this.stagePick = (this.stagePick + 1) % STAGE_IDS.length;
        this.audio.sfx("select");
        this.renderCharSel();
      };
    }

    const startBtn = document.getElementById("btn-start");
    if (startBtn) {
      startBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.audio.sfx("berrante");
        this.startFight();
      };
    }

    const backBtn = document.getElementById("btn-charsel-back");
    if (backBtn) {
      backBtn.onclick = (e) => {
        e.preventDefault();
        this.setMode("menu");
      };
    }
  }

  renderStoryScreen() {
    const ch = STORY_CHAPTERS[this.storyChapterIndex];
    if (!ch) {
      this.showStoryVictory();
      return;
    }

    const titleEl = document.getElementById("story-title");
    const descEl = document.getElementById("story-desc");
    const dBox = document.getElementById("story-dialogue-box");

    if (titleEl) titleEl.textContent = `Capítulo ${ch.num}: ${ch.title}`;
    if (descEl) descEl.textContent = ch.intro;

    if (dBox) {
      dBox.innerHTML = ch.dialogue
        .map(
          (d) => `
        <div class="dialogue-line ${d.speaker === "Everttinho" ? "player" : "enemy"}">
          <strong>${d.speaker}:</strong> "${d.text}"
        </div>`
        )
        .join("");
    }

    const startBtn = document.getElementById("btn-story-start");
    if (startBtn) {
      startBtn.onclick = (e) => {
        e.preventDefault();
        this.audio.sfx("berrante");
        this.startStoryBattle(ch);
      };
    }

    const backBtn = document.getElementById("btn-story-back");
    if (backBtn) {
      backBtn.onclick = (e) => {
        e.preventDefault();
        this.setMode("menu");
      };
    }
  }

  startStoryBattle(ch) {
    const stage = structuredClone(STAGES[ch.stage] || STAGES.barretos);
    const p1 = new Fighter(CHARACTERS[ch.playerChar], "p1", stage.spawn[0].x, stage.spawn[0].y, 1);
    const p2 = new Fighter(CHARACTERS[ch.enemyChar], "p2", stage.spawn[1].x, stage.spawn[1].y, -1);
    p2.cpu = true;
    this.p2cpu = true;

    this.initWorld(stage, p1, p2);
    this.setMode("fight");
    this.triggerNarratorBanner(`CAPÍTULO ${ch.num}: ${ch.title.toUpperCase()}`);
  }

  renderEightSecScreen() {
    const startBtn = document.getElementById("btn-eight-sec-start");
    if (startBtn) {
      startBtn.onclick = (e) => {
        e.preventDefault();
        this.audio.sfx("eight_seconds_horn");
        this.startEightSecFight();
      };
    }
    const backBtn = document.getElementById("btn-eight-sec-back");
    if (backBtn) {
      backBtn.onclick = (e) => {
        e.preventDefault();
        this.setMode("menu");
      };
    }
  }

  startEightSecFight() {
    const stage = structuredClone(STAGES.barretos);
    const p1 = new Fighter(CHARACTERS.evertinho, "p1", stage.spawn[0].x, stage.spawn[0].y, 1);
    const p2 = new Fighter(CHARACTERS.touro_ferro, "p2", stage.spawn[1].x, stage.spawn[1].y, -1);
    p2.cpu = true;
    this.p2cpu = true;
    p2.percent = 0;

    this.eightSecTimer = 8.0;
    this.eightSecSurvived = false;

    this.initWorld(stage, p1, p2);
    this.setMode("fight");
    this.triggerNarratorBanner("SEGUUURA OS 8 SEGUNDOS, PEÃO!");
  }

  startLassoMinigame() {
    this.lassoGame = {
      score: 0,
      combos: 0,
      timer: 35.0,
      targets: [],
      lastSpawn: 0,
      lassoActive: false,
      lassoX: 300,
      lassoY: 520,
      playerX: 240,
      playerY: 560,
    };
    this.audio.playMusic("rodeo");
    this.triggerNarratorBanner("TIRO DE LAÇO: MIRE E LANCE!");
  }

  renderCustomScreen() {
    const hatBtns = document.querySelectorAll("[data-hat]");
    const lassoBtns = document.querySelectorAll("[data-lasso]");

    hatBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.hat === this.customHat);
      btn.onclick = () => {
        this.customHat = btn.dataset.hat;
        this.audio.sfx("select");
        this.renderCustomScreen();
      };
    });

    lassoBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lasso === this.customLasso);
      btn.onclick = () => {
        this.customLasso = btn.dataset.lasso;
        this.audio.sfx("select");
        this.renderCustomScreen();
      };
    });

    const backBtn = document.getElementById("btn-custom-back");
    if (backBtn) {
      backBtn.onclick = () => this.setMode("menu");
    }
  }

  renderOptions() {
    const body = document.getElementById("options-body");
    const rows = [
      "left",
      "right",
      "up",
      "down",
      "light",
      "special",
      "strong",
      "shield",
      "grab",
      "assist",
      "super",
    ];
    const labels = {
      left: "Esquerda",
      right: "Direita",
      up: "Pulo / Cima",
      down: "Baixo",
      light: "Ataque Leve / Laço",
      special: "Especial",
      strong: "Ataque Forte / Tiro",
      shield: "Defesa / Esquiva",
      grab: "Agarrão",
      assist: "Assistência do Cavalo",
      super: "Super Golpe da Aurora",
    };

    body.innerHTML = rows
      .map((a) => {
        const b1 = this.input.binds.p1[a] || "";
        const b2 = this.input.binds.p2[a] || "";
        return `<div class="bind-row"><span class="bind-label">${labels[a]}</span>
          <button data-p="p1" data-a="${a}">P1: ${b1}</button>
          <button data-p="p2" data-a="${a}">P2: ${b2}</button></div>`;
      })
      .join("");

    body.querySelectorAll("button").forEach((btn) => {
      btn.onclick = () => {
        body.querySelectorAll("button").forEach((b) => b.classList.remove("waiting"));
        btn.classList.add("waiting");
        btn.textContent = "Pressione nova tecla…";
        this.input.remap(btn.dataset.p, btn.dataset.a);
        const check = setInterval(() => {
          if (!this.input.waiting) {
            clearInterval(check);
            this.renderOptions();
          }
        }, 80);
      };
    });

    const backBtn = document.getElementById("opt-back");
    if (backBtn) backBtn.onclick = () => this.setMode("menu");
  }

  renderPause() {
    const items = this.training
      ? ["Continuar", "Simular Duelo de Laço", "Dummy: " + this.dummyMode, "Hitboxes: " + (this.showHitboxes ? "ON" : "OFF"), "Resetar", "Menu"]
      : ["Continuar", "Reiniciar Luta", "Menu"];

    const nav = document.getElementById("pause-nav");
    if (!nav) return;
    nav.innerHTML = items
      .map(
        (l, i) =>
          `<button class="menu-item ${i === this.pauseIndex ? "active" : ""}" data-i="${i}">${l}</button>`
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
    if (c === "Reiniciar Luta") this.startFight();
    if (c === "Resetar") this.startFight();
    if (c.startsWith("Simular Duelo")) {
      if (this.world && this.world.fighters.length >= 2) {
        this.triggerLassoDuel(this.world.fighters[0], this.world.fighters[1]);
        this.setMode("fight");
      }
    }
    if (c.startsWith("Dummy:")) {
      const modes = ["neutral", "jump", "shield", "active"];
      const next = (modes.indexOf(this.dummyMode) + 1) % modes.length;
      this.dummyMode = modes[next];
      this.renderPause();
    }
    if (c.startsWith("Hitboxes:")) {
      this.showHitboxes = !this.showHitboxes;
      this.renderPause();
    }
    if (c === "Menu") {
      this.world = null;
      this.setMode("menu");
    }
  }

  startFight() {
    const ids = CHARACTER_IDS;
    const stageKey = STAGE_IDS[this.stagePick] || "barretos";
    const stage = structuredClone(STAGES[stageKey]);

    const p1Char = CHARACTERS[ids[this.p1Pick]] || CHARACTERS.evertinho;
    const p2Char = CHARACTERS[ids[this.p2Pick]] || CHARACTERS.fernanda;

    const p1 = new Fighter(p1Char, "p1", stage.spawn[0].x, stage.spawn[0].y, 1);
    const p2 = new Fighter(p2Char, "p2", stage.spawn[1].x, stage.spawn[1].y, -1);
    p2.cpu = this.p2cpu;

    if (this.training) {
      p1.stocks = 99;
      p2.stocks = 99;
    }

    this.initWorld(stage, p1, p2);
    this.setMode("fight");
    this.triggerNarratorBanner("LUTEM! SEGUUURA, PEÃO!");
  }

  initWorld(stage, p1, p2) {
    this.cam = { x: (p1.x + p2.x) / 2, y: 480, z: 1 };
    this.world = {
      stage,
      fighters: [p1, p2],
      projectiles: [],
      assists: [],
      particles: [],
      audio: this.audio,
      shake: 0,
      combo: null,
      frame: 0,
      finished: false,
      lassoDuel: null,
      spawnFx: (kind, x, y, dir) => this.spawnFx(kind, x, y, dir),
      spawnProjectile: (owner, spec) => this.spawnProjectile(owner, spec),
      spawnAssist: (owner, spec) => this.spawnAssist(owner, spec),
      triggerLassoDuel: (a, b) => this.triggerLassoDuel(a, b),
      onKo: (p) => this.onKo(p),
    };
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
            : kind === "shield"
              ? "fx/shield.png"
              : "fx/sparkle.png";

    this.world.particles.push({
      sprite,
      x,
      y,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 2.5,
      life: 18,
      max: 18,
      scale: kind === "explode" ? 0.32 : 0.2,
      dir,
    });
  }

  spawnProjectile(owner, spec) {
    this.world.projectiles.push({
      ...spec,
      x: owner.x + owner.facing * 38,
      y: owner.y - 48,
      vx: spec.speed * owner.facing,
      facing: owner.facing,
      ownerId: owner.id,
      age: 0,
      isLasso: spec.isLasso || false,
    });
  }

  spawnAssist(owner, spec) {
    const spawnX = owner.facing === 1 ? -60 : 1660;
    this.world.assists.push({
      ...spec,
      x: spawnX,
      y: this.world.stage.ground.y,
      vx: spec.speed * owner.facing,
      facing: owner.facing,
      ownerId: owner.id,
      age: 0,
      hitDone: false,
    });
    this.audio.sfx("horse_gallop");
    this.triggerNarratorBanner("ASSISTÊNCIA DE MONTARIA!");
  }

  triggerLassoDuel(f1, f2) {
    if (this.world.lassoDuel && this.world.lassoDuel.active) return;
    this.world.lassoDuel = {
      active: true,
      p1: f1,
      p2: f2,
      meter: 0.5,
      timer: 160,
      maxTimer: 160,
      p1Count: 0,
      p2Count: 0,
    };
    f1.enter("lassoDuel", 180);
    f2.enter("lassoDuel", 180);
    this.audio.sfx("lasso_clash");
    this.audio.sfx("berrante");
    this.triggerNarratorBanner("⚡ DUELO DE LAÇOS! ESMAGUE O BOTÃO! ⚡");
  }

  resolveLassoDuel(winner, loser) {
    const w = this.world;
    if (!w || !w.lassoDuel) return;
    w.lassoDuel.active = false;
    w.lassoDuel = null;

    winner.specialMeter = Math.min(100, winner.specialMeter + 40);
    loser.percent += 16;
    loser.x = winner.x + winner.facing * 50;
    loser.enter("launched", 45);
    loser.vy = -8;
    loser.vx = winner.facing * 5;

    winner.enter("idle");
    this.audio.sfx("strong");
    this.audio.sfx("cheer");
    this.spawnFx("explode", loser.x, loser.y - 40, winner.facing);
    this.triggerNarratorBanner("PUXADA PERFEITA! SEGUUURA!");
  }

  triggerNarratorBanner(text) {
    this.narratorBanner = text;
    this.narratorTimer = 110;
  }

  onKo(p) {
    const [a, b] = this.world.fighters;
    if (!a.alive || !b.alive) {
      this.world.finished = true;
      const winner = a.alive ? a : b.alive ? b : null;
      setTimeout(() => this.showResults(winner), 800);
    }
  }

  showResults(winner) {
    this.setMode("results");
    const kicker = document.getElementById("result-kicker");
    const title = document.getElementById("result-title");
    const sub = document.getElementById("result-sub");
    const nav = document.getElementById("result-nav");

    if (kicker) kicker.textContent = "K.O.";
    if (title) title.textContent = winner ? `${winner.char.name} Venceu!` : "Empate!";

    if (this.gameSubMode === "historia") {
      if (winner && winner.port === "p1") {
        const ch = STORY_CHAPTERS[this.storyChapterIndex];
        if (sub) sub.textContent = ch.outro;
        if (nav) {
          nav.innerHTML = `
            <button class="menu-item active" data-res="next">Próximo Capítulo ➔</button>
            <button class="menu-item" data-res="menu">Menu Principal</button>`;
        }
      } else {
        if (sub) sub.textContent = "Everttinho foi derrotado... Tente novamente!";
        if (nav) {
          nav.innerHTML = `
            <button class="menu-item active" data-res="retry">Tentar Novamente</button>
            <button class="menu-item" data-res="menu">Menu Principal</button>`;
        }
      }
    } else if (this.gameSubMode === "eight_sec") {
      if (this.eightSecSurvived) {
        if (sub) sub.textContent = "🏆 8 SEGUNDOS COMPLETOS! VOCÊ É O CAMPEÃO DO RODEIO!";
      } else {
        if (sub) sub.textContent = "Não resistiu aos 8 segundos de rodeio...";
      }
      if (nav) {
        nav.innerHTML = `
          <button class="menu-item active" data-res="retry">Jogar Novamente</button>
          <button class="menu-item" data-res="menu">Menu Principal</button>`;
      }
    } else {
      if (sub) sub.textContent = winner ? `Dano acumulado: ${Math.floor(winner.percent)}%` : "";
      if (nav) {
        nav.innerHTML = `
          <button class="menu-item active" data-res="rematch">Revanche</button>
          <button class="menu-item" data-res="charsel">Trocar Lutadores</button>
          <button class="menu-item" data-res="menu">Menu Principal</button>`;
      }
    }

    nav.querySelectorAll(".menu-item").forEach((btn) => {
      btn.onclick = () => this.confirmResultAction(btn.dataset.res);
    });
  }

  confirmResultAction(action) {
    if (action === "next") {
      this.storyChapterIndex++;
      if (this.storyChapterIndex >= STORY_CHAPTERS.length) {
        this.showStoryVictory();
      } else {
        this.setMode("story_dialogue");
      }
    } else if (action === "retry" || action === "rematch") {
      if (this.gameSubMode === "historia") {
        this.startStoryBattle(STORY_CHAPTERS[this.storyChapterIndex]);
      } else if (this.gameSubMode === "eight_sec") {
        this.startEightSecFight();
      } else {
        this.startFight();
      }
    } else if (action === "charsel") {
      this.setMode("charsel");
    } else {
      this.setMode("menu");
    }
  }

  showStoryVictory() {
    this.setMode("results");
    document.getElementById("result-kicker").textContent = "FIM DA HISTÓRIA";
    document.getElementById("result-title").textContent = "A Lenda da Aurora Restaurada!";
    document.getElementById("result-sub").textContent =
      "Everttinho conquistou a Ferradura da Aurora e se tornou o maior peão da história de Barretos!";
    const nav = document.getElementById("result-nav");
    if (nav) {
      nav.innerHTML = `<button class="menu-item active" data-res="menu">Voltar ao Menu Principal</button>`;
      nav.querySelector("button").onclick = () => this.setMode("menu");
    }
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
      if (this.input.menuLeft) {
        this.menuIndex = (this.menuIndex + MENU.length - 2) % MENU.length;
        this.audio.sfx("ui");
        this.renderMenu();
      }
      if (this.input.menuRight) {
        this.menuIndex = (this.menuIndex + 2) % MENU.length;
        this.audio.sfx("ui");
        this.renderMenu();
      }
      if (this.input.menuOk) this.confirmMenu();
      return;
    }

    if (this.mode === "charsel") {
      const ids = CHARACTER_IDS;
      let changed = false;

      if (this.input.p1.leftPressed && !this.p1Ready) {
        this.p1Pick = (this.p1Pick + ids.length - 1) % ids.length;
        this.audio.sfx("select");
        changed = true;
      }
      if (this.input.p1.rightPressed && !this.p1Ready) {
        this.p1Pick = (this.p1Pick + 1) % ids.length;
        this.audio.sfx("select");
        changed = true;
      }
      if (this.input.p1.upPressed) {
        this.stagePick = (this.stagePick + 1) % STAGE_IDS.length;
        this.audio.sfx("select");
        changed = true;
      }
      if (this.input.p1.downPressed) {
        this.stagePick = (this.stagePick + STAGE_IDS.length - 1) % STAGE_IDS.length;
        this.audio.sfx("select");
        changed = true;
      }

      if (!this.p2cpu) {
        if (this.input.p2.leftPressed && !this.p2Ready) {
          this.p2Pick = (this.p2Pick + ids.length - 1) % ids.length;
          this.audio.sfx("select");
          changed = true;
        }
        if (this.input.p2.rightPressed && !this.p2Ready) {
          this.p2Pick = (this.p2Pick + 1) % ids.length;
          this.audio.sfx("select");
          changed = true;
        }
      }

      if (this.input.menuOk || this.input.p1.lightPressed) {
        this.audio.sfx("berrante");
        this.startFight();
        return;
      }

      if (this.input.menuBack) {
        this.setMode("menu");
        return;
      }

      if (changed) {
        this.renderCharSel();
      }
      return;
    }

    if (this.mode === "lasso_minigame") {
      this.stepLassoMinigame();
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

    if (this.mode !== "fight" || !this.world) return;

    if (this.input.pausePressed) {
      this.pauseIndex = 0;
      this.setMode("pause");
      this.renderPause();
      return;
    }

    const w = this.world;
    w.frame++;

    if (this.narratorTimer > 0) this.narratorTimer--;

    // Atualiza lógica do Modo 8 Segundos
    if (this.gameSubMode === "eight_sec" && !w.finished) {
      if (this.eightSecTimer > 0) {
        this.eightSecTimer = Math.max(0, this.eightSecTimer - 1 / 60);
        if (this.eightSecTimer === 0) {
          this.eightSecSurvived = true;
          this.audio.sfx("eight_seconds_horn");
          this.audio.sfx("cheer");
          w.fighters[0].specialMeter = 100;
          this.triggerNarratorBanner("🏆 8 SEGUNDOS! SUPER CONTRA-ATAQUE LIBERADO!");
        }
      }
    }

    // Atualiza Duelo de Laço
    if (w.lassoDuel && w.lassoDuel.active) {
      this.stepLassoDuel();
      this.updateParticles();
      this.updateHud();
      return;
    }

    const [p1, p2] = w.fighters;
    const i1 = this.input.p1;
    const i2 = p2.cpu
      ? makeCpuInput(p2, p1, w, this.aiLevel, { dummy: this.training, dummyMode: this.dummyMode })
      : this.input.p2;

    p1.update(i1, w);
    p2.update(i2, w);

    this.separate(p1, p2);
    this.updateProjectiles();
    this.updateAssists();
    this.updateParticles();

    if (w.shake > 0) w.shake *= 0.84;
    if (w.combo) {
      w.combo.timer--;
      if (w.combo.timer <= 0) w.combo = null;
    }

    this.updateCamera();
    this.updateHud();
  }

  stepLassoDuel() {
    const duel = this.world.lassoDuel;
    duel.timer--;

    // P1 Pressiona botão
    if (this.input.p1.lightPressed || this.input.p1.strongPressed || this.input.p1.specialPressed) {
      duel.meter = Math.min(1.0, duel.meter + 0.05);
      duel.p1Count++;
      this.audio.sfx("lasso_tug");
      this.spawnFx("sparkle", (duel.p1.x + duel.p2.x) / 2, duel.p1.y - 50, 1);
    }

    // P2 / CPU Pressiona botão
    if (duel.p2.cpu) {
      if (Math.random() < 0.65) {
        duel.meter = Math.max(0.0, duel.meter - 0.04);
        duel.p2Count++;
      }
    } else {
      if (this.input.p2.lightPressed || this.input.p2.strongPressed || this.input.p2.specialPressed) {
        duel.meter = Math.max(0.0, duel.meter - 0.05);
        duel.p2Count++;
        this.audio.sfx("lasso_tug");
        this.spawnFx("sparkle", (duel.p1.x + duel.p2.x) / 2, duel.p2.y - 50, -1);
      }
    }

    // Conclusão do Duelo
    if (duel.timer <= 0 || duel.meter >= 0.98 || duel.meter <= 0.02) {
      const winner = duel.meter >= 0.5 ? duel.p1 : duel.p2;
      const loser = winner === duel.p1 ? duel.p2 : duel.p1;
      this.resolveLassoDuel(winner, loser);
    }
  }

  stepLassoMinigame() {
    const g = this.lassoGame;
    if (!g) return;

    g.timer = Math.max(0, g.timer - 1 / 60);
    g.lastSpawn++;

    // Gera alvos correndo
    if (g.lastSpawn > 45 && Math.random() < 0.08) {
      g.lastSpawn = 0;
      const kind = Math.random() < 0.5 ? "calf" : Math.random() < 0.8 ? "barrel" : "gold_horseshoe";
      g.targets.push({
        kind,
        x: 1350,
        y: 560,
        speed: 7 + Math.random() * 5,
        hit: false,
        size: kind === "gold_horseshoe" ? 30 : 50,
      });
    }

    // Atualiza alvos
    g.targets.forEach((t) => {
      t.x -= t.speed;
    });
    g.targets = g.targets.filter((t) => t.x > -100);

    // Jogador dispara o laço
    if (this.input.p1.lightPressed || this.input.p1.strongPressed) {
      this.audio.sfx("lasso_throw");
      g.lassoActive = true;
      g.lassoX = g.playerX + 50;

      // Verifica acerto em alvos
      for (const t of g.targets) {
        if (!t.hit && Math.abs(t.x - g.lassoX) < 90) {
          t.hit = true;
          const pts = t.kind === "gold_horseshoe" ? 500 : t.kind === "barrel" ? 300 : 150;
          g.score += pts;
          g.combos++;
          this.audio.sfx("berrante");
          this.audio.sfx("cheer");
          this.triggerNarratorBanner(`LAÇOU! +${pts} PTS!`);
          break;
        }
      }
    }

    if (this.input.menuBack || g.timer <= 0) {
      this.showResults({ char: { name: `Everttinho (${g.score} pts)` }, percent: g.score });
    }
  }

  separate(a, b) {
    if (!a.alive || !b.alive) return;
    const dx = b.x - a.x;
    const overlap = 40 - Math.abs(dx);
    if (overlap > 0 && Math.abs(a.y - b.y) < 70) {
      const push = overlap / 2;
      const dir = dx === 0 ? 1 : Math.sign(dx);
      a.x -= push * dir;
      b.x += push * dir;
    }
  }

  updateProjectiles() {
    const w = this.world;

    // Detecção de colisão entre 2 projéteis de laço -> Ativa Duelo de Laço!
    if (w.projectiles.length >= 2) {
      for (let i = 0; i < w.projectiles.length; i++) {
        for (let j = i + 1; j < w.projectiles.length; j++) {
          const pA = w.projectiles[i];
          const pB = w.projectiles[j];
          if (pA.ownerId !== pB.ownerId && (pA.isLasso || pB.isLasso)) {
            const dist = Math.hypot(pA.x - pB.x, pA.y - pB.y);
            if (dist < 45) {
              const f1 = w.fighters.find((f) => f.id === pA.ownerId);
              const f2 = w.fighters.find((f) => f.id === pB.ownerId);
              if (f1 && f2) {
                w.projectiles.splice(j, 1);
                w.projectiles.splice(i, 1);
                this.triggerLassoDuel(f1, f2);
                return;
              }
            }
          }
        }
      }
    }

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

  updateAssists() {
    const w = this.world;
    w.assists = w.assists.filter((as) => {
      as.age++;
      as.x += as.vx;
      const box = { x: as.x - as.w / 2, y: as.y - as.h, w: as.w, h: as.h };

      for (const f of w.fighters) {
        if (f.id === as.ownerId || !f.alive) continue;
        if (aabb(box, hurtbox(f)) && !as.hitDone) {
          const owner = w.fighters.find((x) => x.id === as.ownerId);
          if (owner) {
            applyHit(
              owner,
              f,
              {
                damage: as.damage || 15,
                kbBase: as.kbBase || 14,
                kbScale: as.kbScale || 0.65,
                angle: as.angle || 45,
                hitstun: 25,
                hitlag: 8,
              },
              w
            );
          }
          this.spawnFx("explode", as.x, as.y - 30, as.facing);
          as.hitDone = true;
        }
      }
      return as.age < as.life && as.x > -200 && as.x < 1800;
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
      const nameEl = document.getElementById(`hud-name-${n}`);
      if (nameEl) {
        nameEl.textContent = p.char.name + (p.cpu ? " (CPU)" : "");
      }
      const pct = document.getElementById(`hud-pct-${n}`);
      if (pct) {
        pct.textContent = `${Math.floor(p.percent)}%`;
        pct.style.color = p.percent > 100 ? "#ff4d4d" : p.char.color;
      }
      const face = document.getElementById(`hud-face-${n}`);
      if (face) {
        face.style.backgroundImage = `url(assets/sprites/${p.char.portrait})`;
      }
      const stocks = document.getElementById(`hud-stocks-${n}`);
      if (stocks) {
        const nStocks = Math.min(8, p.stocks);
        stocks.innerHTML = Array.from(
          { length: nStocks },
          () => `<span class="stock" style="background:${p.char.color}"></span>`
        ).join("");
      }

      // Barra de Especial / Aurora
      const meterEl = document.getElementById(`hud-super-${n}`);
      if (meterEl) {
        const m = Math.floor(p.specialMeter || 0);
        meterEl.style.width = `${m}%`;
        meterEl.classList.toggle("full", m >= 100);
      }
    };

    set(1, a);
    set(2, b);

    const combo = document.getElementById("hud-combo");
    if (combo) {
      combo.textContent = this.world.combo && this.world.combo.count > 1 ? `${this.world.combo.count} HITS!` : "";
    }

    const timerEl = document.getElementById("hud-timer");
    if (timerEl) {
      if (this.gameSubMode === "eight_sec") {
        timerEl.textContent = `⏱️ ${this.eightSecTimer.toFixed(2)}s`;
        timerEl.style.color = this.eightSecSurvived ? "#7dff9a" : "#ffd27a";
      } else if (this.training) {
        timerEl.textContent = "TREINO";
      } else {
        timerEl.textContent = "∞";
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (this.mode === "lasso_minigame") {
      this.drawLassoMinigame();
      return;
    }

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

    // Desenha o cenário selecionado
    const stage = this.world.stage;
    if (stage && typeof stage.draw === "function") {
      stage.draw(ctx, stage, this.world.frame, this.world);
    } else {
      const bg = this.sprites.img("stages/rooftop.png");
      if (bg) ctx.drawImage(bg, -80, -40, stage.width + 80, stage.height);
    }

    // Sombras dos lutadores
    for (const f of this.world.fighters) {
      if (!f.alive && f.state !== "knockedOut") continue;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(f.x, this.world.stage.ground.y + 6, 32, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Projéteis
    for (const pr of this.world.projectiles) {
      this.sprites.draw(ctx, pr.sprite, pr.x, pr.y + pr.h / 2, {
        flip: pr.facing < 0,
        scale: pr.scale || 0.25,
        anchorY: 1,
      });
    }

    // Assistências (Cavalo "Trovão", Gatos, Touros)
    for (const as of this.world.assists) {
      this.sprites.draw(ctx, as.sprite, as.x, as.y, {
        flip: as.facing < 0,
        scale: as.scale || 0.32,
        anchorY: 1,
      });
      // Rastro de poeira e relâmpago
      this.spawnFx("dust", as.x - as.facing * 30, as.y - 10, as.facing);
    }

    // Duelo de Laços — Linha de Tensão Conectando Lutadores
    if (this.world.lassoDuel && this.world.lassoDuel.active) {
      this.drawLassoRope(ctx);
    }

    // Lutadores
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
        this.sprites.draw(ctx, "fx/shield.png", f.x, f.y - 40, {
          scale: 0.28,
          anchorY: 0.5,
          alpha: 0.75,
        });
      }

      // Aura de Especial / 8 Segundos
      if (f.specialMeter >= 100 || (this.gameSubMode === "eight_sec" && this.eightSecSurvived && f.port === "p1")) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(this.world.frame * 0.15) * 0.2;
        ctx.strokeStyle = "#ffd27a";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(f.x, f.y - 40, 35, 48, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Partículas de impacto
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

    // Narrador / Banner de Rodeio no topo
    if (this.narratorTimer > 0 && this.narratorBanner) {
      this.drawNarratorBanner(ctx);
    }

    // Duelo de Laço HUD Overlay
    if (this.world.lassoDuel && this.world.lassoDuel.active) {
      this.drawLassoDuelHud(ctx);
    }
  }

  drawLassoRope(ctx) {
    const duel = this.world.lassoDuel;
    const f1 = duel.p1;
    const f2 = duel.p2;

    const midX = (f1.x + f2.x) / 2;
    const midY = (f1.y + f2.y) / 2 - 45 + Math.sin(this.world.frame * 0.3) * 6;

    ctx.save();
    ctx.strokeStyle = "#ffd27a";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#ff9900";
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(f1.x + f1.facing * 20, f1.y - 50);
    ctx.quadraticCurveTo(midX, midY, f2.x + f2.facing * 20, f2.y - 50);
    ctx.stroke();

    // Faíscas elétricas no nó central
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(midX, midY, 8 + Math.sin(this.world.frame * 0.5) * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawLassoDuelHud(ctx) {
    const duel = this.world.lassoDuel;
    const cx = this.canvas.width / 2;
    const cy = 180;

    ctx.save();
    ctx.fillStyle = "rgba(10, 6, 3, 0.85)";
    ctx.strokeStyle = "#ffd27a";
    ctx.lineWidth = 3;
    ctx.fillRect(cx - 240, cy - 50, 480, 100);
    ctx.strokeRect(cx - 240, cy - 50, 480, 100);

    ctx.font = "800 18px Outfit, sans-serif";
    ctx.fillStyle = "#ffd27a";
    ctx.textAlign = "center";
    ctx.fillText("⚡ DISPUTA DE LAÇO: ESMAGUE [J] / [1]! ⚡", cx, cy - 20);

    // Barra de Cabo de Guerra
    ctx.fillStyle = "#221108";
    ctx.fillRect(cx - 180, cy, 360, 24);
    ctx.strokeStyle = "#a5713d";
    ctx.strokeRect(cx - 180, cy, 360, 24);

    const markerX = cx - 180 + duel.meter * 360;
    ctx.fillStyle = duel.meter >= 0.5 ? "#7dff9a" : "#ff6a3d";
    ctx.fillRect(markerX - 10, cy - 4, 20, 32);

    ctx.font = "700 13px Outfit, sans-serif";
    ctx.fillStyle = "#ffe9c9";
    ctx.textAlign = "left";
    ctx.fillText("P1", cx - 210, cy + 18);
    ctx.textAlign = "right";
    ctx.fillText("P2", cx + 210, cy + 18);

    ctx.restore();
  }

  drawNarratorBanner(ctx) {
    const cx = this.canvas.width / 2;
    ctx.save();
    ctx.fillStyle = "rgba(41, 24, 11, 0.92)";
    ctx.strokeStyle = "#ffd27a";
    ctx.lineWidth = 2;
    ctx.fillRect(cx - 320, 40, 640, 46);
    ctx.strokeRect(cx - 320, 40, 640, 46);

    ctx.font = "800 20px Outfit, sans-serif";
    ctx.fillStyle = "#ffe9c9";
    ctx.textAlign = "center";
    ctx.fillText(this.narratorBanner, cx, 70);
    ctx.restore();
  }

  drawLassoMinigame() {
    const ctx = this.ctx;
    const g = this.lassoGame;
    ctx.fillStyle = "#1e1024";
    ctx.fillRect(0, 0, 1280, 720);

    // Cenário de tiro de laço
    ctx.fillStyle = "#6b4123";
    ctx.fillRect(0, 560, 1280, 160);

    // Jogador Everttinho
    this.sprites.draw(ctx, "evertinho/point.png", g.playerX, g.playerY, { scale: 0.38, anchorY: 1 });

    // Laço lançado
    if (g.lassoActive) {
      ctx.strokeStyle = "#ffd27a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(g.playerX + 40, g.playerY - 50);
      ctx.lineTo(g.lassoX, 520);
      ctx.stroke();
    }

    // Alvos móveis
    g.targets.forEach((t) => {
      ctx.fillStyle = t.kind === "gold_horseshoe" ? "#ffd700" : t.kind === "barrel" ? "#8b4513" : "#e5b778";
      ctx.beginPath();
      ctx.arc(t.x, t.y - 30, t.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Placar
    ctx.fillStyle = "#ffe9c9";
    ctx.font = "800 24px Outfit, sans-serif";
    ctx.fillText(`Pontos: ${g.score}`, 40, 60);
    ctx.fillText(`Tempo: ${g.timer.toFixed(1)}s`, 40, 100);
    ctx.fillText(`Acertos em Sequência: ${g.combos}`, 40, 140);
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
      if (
        f.move &&
        f.move.hitbox &&
        f.stateTime >= f.move.startup &&
        f.stateTime < f.move.startup + f.move.active
      ) {
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
    isLasso: pr.isLasso,
  };
  owner.facing = pr.facing;
  applyHit(owner, victim, move, world);
}
