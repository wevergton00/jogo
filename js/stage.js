/* ==================== ARENAS VIVAS ====================
   Cada arena tem um evento periódico que afeta a luta + parallax.
   O estado do evento mora em world.stageEvent (criado via makeStageEvent)
   e é atualizado por stepStageEvent() no loop do jogo. */

/** Parallax: f=1 move junto com a câmera; f=0 fica "preso" à tela. */
function parallax(world, f) {
  const cx = world?.camX ?? 800;
  const cy = world?.camY ?? 420;
  return { x: (cx - 800) * (1 - f), y: (cy - 420) * (1 - f) * 0.6 };
}

function pushStreak(world, x, y, dir, sprite = "fx/dust.png", life = 22) {
  world.particles.push({
    sprite,
    x,
    y,
    vx: dir * (7 + Math.random() * 5),
    vy: (Math.random() - 0.5) * 1.5,
    life,
    max: life,
    scale: 0.22,
    dir,
  });
}

function windAffects(f) {
  return f.alive && !["launched", "knockedOut", "lassoDuel", "win"].includes(f.state);
}

function applyWindToFighters(world, ev, power) {
  for (const f of world.fighters) {
    if (!windAffects(f)) continue;
    f.vx += ev.dir * power * (f.grounded ? 0.35 : 1);
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Fardos de feno desenhados em cima da plataforma colidível (Arena de Barretos). */
function drawHayBales(ctx, p) {
  ctx.save();
  const n = 3;
  const bw = p.w / n;
  const h = 38;
  const y = p.y;
  for (let i = 0; i < n; i++) {
    const x = p.x + i * bw;
    const cx = x + bw / 2;

    // Sombra no chão da arena
    ctx.fillStyle = "rgba(30, 12, 4, 0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, y + h + 6, bw * 0.46, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo do fardo
    ctx.fillStyle = i % 2 === 0 ? "#d4a446" : "#c8983c";
    roundRectPath(ctx, x + 2, y, bw - 4, h, 9);
    ctx.fill();
    ctx.strokeStyle = "#8a6220";
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, x + 2, y, bw - 4, h, 9);
    ctx.stroke();

    // Textura de palha (linhas levemente onduladas)
    ctx.strokeStyle = "rgba(250, 224, 120, 0.55)";
    ctx.lineWidth = 1.5;
    for (let s = 1; s <= 3; s++) {
      const ty = y + (h / 4) * s;
      ctx.beginPath();
      ctx.moveTo(x + 8, ty);
      ctx.quadraticCurveTo(cx, ty + 3, x + bw - 8, ty);
      ctx.stroke();
    }

    // Amarras de cabo
    ctx.strokeStyle = "#593c12";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.2, y + 2);
    ctx.lineTo(cx - bw * 0.2, y + h - 2);
    ctx.moveTo(cx + bw * 0.2, y + 2);
    ctx.lineTo(cx + bw * 0.2, y + h - 2);
    ctx.stroke();

    // Borda superior (onde o peão pisa)
    ctx.fillStyle = "rgba(250, 224, 120, 0.7)";
    roundRectPath(ctx, x + 4, y, bw - 8, 4, 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Estado inicial do evento de cada arena. */
export function makeStageEvent(stage) {
  switch (stage.id) {
    case "barretos":
      return { kind: "horseshoe", nextIn: 600, item: null };
    case "fazenda":
      return { kind: "windmill", nextIn: 600, warn: 0, active: 0, dir: -1 };
    case "cerrado_tempestade":
      return { kind: "gust", nextIn: 660, warn: 0, active: 0, dir: 1, flashX: 800, flashT: 0 };
    case "curral_fantasma":
      return { kind: "fog", nextIn: 480, active: 0, dur: 330 };
    case "arena_aurora":
      return { kind: "aurora", nextIn: 540, x: -350, dir: 1, active: 0 };
    case "rooftop":
      return { kind: "neon", nextIn: 720, active: 0, beat: 0, beatT: 0 };
    default:
      return null;
  }
}

/** Atualiza o evento da arena a cada frame (chamado pelo game.js). */
export function stepStageEvent(world) {
  const ev = world.stageEvent;
  if (!ev || world.finished || (world.lassoDuel && world.lassoDuel.active)) return;
  const g = world.stage.ground;

  switch (ev.kind) {
    /* --- Barretos: Ferradura da Sorte dourada cai do teto --- */
    case "horseshoe": {
      const it = ev.item;
      if (it) {
        it.age++;
        if (it.y < g.y - 22) {
          it.vy = Math.min(6, it.vy + 0.06);
          it.y += it.vy;
        } else {
          it.y = g.y - 22;
          it.life = (it.life || 0) + 1;
          if (it.life > 320) {
            ev.item = null;
            ev.nextIn = 540 + Math.floor(Math.random() * 360);
            break;
          }
        }
        for (const f of world.fighters) {
          if (!f.alive) continue;
          if (Math.abs(f.x - it.x) < 52 && Math.abs(f.y - 38 - it.y) < 72) {
            f.specialMeter = Math.min(100, (f.specialMeter || 0) + 25);
            world.audio.sfx("cheer");
            world.audio.sfx("super_ready");
            world.spawnFx("sparkle", it.x, it.y, 1);
            world.shake = Math.max(world.shake, 5);
            world.banner(`FERRADURA DA SORTE! ${f.char.name.toUpperCase()} GANHA +25 DE AURORA!`);
            ev.item = null;
            ev.nextIn = 540 + Math.floor(Math.random() * 360);
            break;
          }
        }
      } else {
        ev.nextIn--;
        if (ev.nextIn <= 0) {
          ev.item = {
            x: g.x + 160 + Math.random() * (g.w - 320),
            y: -120,
            vy: 2.5,
            sway: Math.random() * 6.28,
            age: 0,
          };
          world.audio.sfx("berrante");
          world.banner("FERRADURA DA SORTE CAINDO! CORRE, PEÃO!");
        }
      }
      break;
    }

    /* --- Fazenda (moinho) / Cerrado (tempestade): rajadas de vento --- */
    case "windmill":
    case "gust": {
      if (ev.warn > 0) {
        ev.warn--;
        if (ev.warn === 0) {
          ev.active = 110;
          world.shake = Math.max(world.shake, 3);
          if (ev.kind === "gust") {
            world.audio.sfx("thunder");
            ev.flashT = 10;
            world.banner(ev.dir === 1 ? "⚡ RAJADA VEM DA ESQUERDA! ⚡" : "⚡ RAJADA VEM DA DIREITA! ⚡");
          } else {
            world.audio.sfx("whoosh");
            world.banner("O MOINHO SOUPLA UMA RAJADA QUENTE!");
          }
        }
      } else if (ev.active > 0) {
        ev.active--;
        const power = ev.kind === "gust" ? 0.3 : 0.22;
        applyWindToFighters(world, ev, power);
        for (let i = 0; i < 3; i++) {
          pushStreak(world, g.x + Math.random() * g.w, g.y - 40 - Math.random() * 340, ev.dir);
        }
        if (ev.flashT > 0) ev.flashT--;
      } else {
        ev.nextIn--;
        if (ev.nextIn <= 0) {
          ev.warn = 36;
          if (ev.kind === "gust") {
            ev.dir = Math.random() < 0.5 ? -1 : 1;
            ev.flashX = g.x + 100 + Math.random() * (g.w - 200);
            world.audio.sfx("thunder");
          } else {
            world.audio.sfx("whoosh");
          }
        }
      }
      break;
    }

    /* --- Curral Fantasma: mares de névoa espectral --- */
    case "fog": {
      if (ev.active > 0) {
        ev.active--;
      } else {
        ev.nextIn--;
        if (ev.nextIn <= 0) {
          ev.active = ev.dur;
          world.audio.sfx("whoosh");
          world.banner("A NÉVOA ESPECTRAL FECHA O CURRAL!");
        }
      }
      break;
    }

    /* --- Arena da Aurora: onda que restaura as forças --- */
    case "aurora": {
      if (ev.active > 0) {
        ev.active--;
        ev.x += ev.dir * 8;
        let healed = null;
        for (const f of world.fighters) {
          if (!f.alive || f.hp >= f.maxHp) continue;
          if (Math.abs(f.x - ev.x) < 130) {
            f.hp = Math.min(f.maxHp, f.hp + 0.3);
            healed = f;
          }
        }
        if (healed && world.frame % 8 === 0) {
          world.spawnFx("sparkle", healed.x, healed.y - 60, ev.dir);
        }
        if (ev.active <= 0 || ev.x < -420 || ev.x > 2020) {
          ev.active = 0;
          ev.nextIn = 600 + Math.floor(Math.random() * 300);
        }
      } else {
        ev.nextIn--;
        if (ev.nextIn <= 0) {
          ev.dir = Math.random() < 0.5 ? 1 : -1;
          ev.x = ev.dir === 1 ? -350 : 1950;
          ev.active = 320;
          world.audio.sfx("super_ready");
          world.banner("A ONDA DA AURORA RESTAURA AS FORÇAS!");
        }
      }
      break;
    }

    /* --- Terraço Neon: Hora do Show (projéteis acelerados) --- */
    case "neon": {
      if (ev.active > 0) {
        ev.active--;
        ev.beatT++;
        if (ev.beatT >= 14) {
          ev.beatT = 0;
          ev.beat++;
        }
      } else {
        ev.nextIn--;
        if (ev.nextIn <= 0) {
          ev.active = 300;
          ev.beat = 0;
          ev.beatT = 0;
          world.audio.sfx("special");
          world.banner("🎶 HORA DO SHOW! PROJÉTEIS ACELERADOS! 🎶");
        }
      }
      break;
    }
  }
}

export const STAGES = {
  barretos: {
    id: "barretos",
    name: "Parque do Peão de Barretos",
    subtitle: "Arena de Rodeio · Oscar Niemeyer",
    theme: "rodeo",
    bgKey: "stages/barretos.jpg",
    width: 1600,
    height: 900,
    ground: { x: 70, y: 560, w: 1460, h: 40 },
    platforms: [
      { x: 280, y: 430, w: 280, h: 22, pass: true, label: "Feno Oeste (Bretes)" },
      { x: 1040, y: 430, w: 280, h: 22, pass: true, label: "Feno Leste (Juízes)" },
    ],
    ledges: [
      { x: 140, y: 560, dir: -1 },
      { x: 1460, y: 560, dir: 1 },
    ],
    blast: { l: -140, r: 1740, t: -160, b: 830 },
    spawn: [
      { x: 480, y: 560 },
      { x: 1120, y: 560 },
    ],
    draw(ctx, stage, frame, world) {
      const grad = ctx.createLinearGradient(0, -100, 0, 800);
      grad.addColorStop(0, "#2a0c18");
      grad.addColorStop(0.35, "#8a1f14");
      grad.addColorStop(0.7, "#d4531a");
      grad.addColorStop(1, "#9c4826");
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -200, 1800, 1100);

      const bg = world.sprites?.img("stages/barretos.jpg");
      if (bg) {
        const pp = parallax(world, 0.55);
        ctx.drawImage(bg, -280 + pp.x, -70 + pp.y, stage.width + 480, stage.height + 80);
      }

      // Holofotes e fogos por cima do PNG
      ctx.save();
      ctx.globalAlpha = bg ? 0.1 : 0.15;
      const b1 = Math.sin(frame * 0.02) * 160;
      const b2 = Math.cos(frame * 0.024) * 180;
      const b3 = Math.sin(frame * 0.018 + 2) * 140;
      ctx.fillStyle = "#ffd27a";
      ctx.beginPath();
      ctx.moveTo(150, -100);
      ctx.lineTo(450 + b1, 600);
      ctx.lineTo(650 + b1, 600);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff4c8";
      ctx.beginPath();
      ctx.moveTo(1450, -100);
      ctx.lineTo(950 + b2, 600);
      ctx.lineTo(1150 + b2, 600);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(800, -120);
      ctx.lineTo(700 + b3, 600);
      ctx.lineTo(900 + b3, 600);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const fwPhase = frame % 240;
      if (fwPhase > 180) {
        const fwProg = (fwPhase - 180) / 60;
        const fwx = 350 + (frame % 3) * 450;
        const fwy = 90 + (frame % 2) * 60;
        ctx.save();
        ctx.globalAlpha = (1 - fwProg) * 0.75;
        for (let spark = 0; spark < 12; spark++) {
          const ang = (spark * Math.PI * 2) / 12;
          const rad = fwProg * 70;
          ctx.fillStyle = spark % 2 === 0 ? "#ffd700" : "#ff4fa3";
          ctx.beginPath();
          ctx.arc(fwx + Math.cos(ang) * rad, fwy + Math.sin(ang) * rad, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Fardos de feno: desenhados no lugar exato da plataforma colidível
      stage.platforms.forEach((p) => drawHayBales(ctx, p));
    },
    eventDrawFg(ctx, stage, frame, world) {
      const ev = world.stageEvent;
      if (ev?.kind !== "horseshoe" || !ev.item) return;
      const it = ev.item;
      const landed = it.y >= stage.ground.y - 23;
      ctx.save();
      if (landed) {
        const pulse = 0.35 + 0.25 * Math.sin(frame * 0.15);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.ellipse(it.x, stage.ground.y - 4, 46, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.translate(it.x, it.y);
      ctx.rotate(Math.sin(frame * 0.08 + it.sway) * (landed ? 0.06 : 0.3));
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 2, 18, Math.PI * 0.12, Math.PI * 0.88, false);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff2b0";
      for (const a of [0.2, 0.35, 0.5, 0.65, 0.8]) {
        ctx.beginPath();
        ctx.arc(Math.cos(Math.PI * a) * 18, 2 + Math.sin(Math.PI * a) * 18, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let s = 0; s < 3; s++) {
        const sa = frame * 0.1 + (s * Math.PI * 2) / 3;
        ctx.globalAlpha = Math.max(0, 0.4 + 0.4 * Math.sin(frame * 0.2 + s));
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(Math.cos(sa) * 30, 2 + Math.sin(sa) * 30, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  },

  fazenda: {
    id: "fazenda",
    name: "Fazenda ao Pôr do Sol",
    subtitle: "Rancho da Aurora Dourada",
    theme: "sunset",
    width: 1600,
    height: 900,
    ground: { x: 160, y: 560, w: 1280, h: 40 },
    platforms: [
      { x: 340, y: 390, w: 260, h: 18, pass: true, label: "Telhado Celeiro" },
      { x: 1000, y: 390, w: 260, h: 18, pass: true, label: "Cerca Colonial" },
    ],
    ledges: [
      { x: 160, y: 560, dir: -1 },
      { x: 1440, y: 560, dir: 1 },
    ],
    blast: { l: -140, r: 1740, t: -160, b: 830 },
    spawn: [
      { x: 500, y: 560 },
      { x: 1100, y: 560 },
    ],
    draw(ctx, stage, frame, world) {
      // Céu gradiente pôr do sol
      const grad = ctx.createLinearGradient(0, -100, 0, 600);
      grad.addColorStop(0, "#2c0b38");
      grad.addColorStop(0.35, "#80234a");
      grad.addColorStop(0.65, "#d65330");
      grad.addColorStop(0.9, "#f7a440");
      grad.addColorStop(1, "#fde68a");
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -200, 1800, 1100);

      // Grande sol poente dourado (parallax distante)
      const pFar = parallax(world, 0.25);
      ctx.fillStyle = "#fff4d0";
      ctx.beginPath();
      ctx.arc(800 + pFar.x, 380 + pFar.y * 0.5, 110, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(800 + pFar.x, 380 + pFar.y * 0.5, 160, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Colinas ao fundo (parallax médio)
      const pMid = parallax(world, 0.45);
      ctx.fillStyle = "#5c2438";
      ctx.beginPath();
      ctx.moveTo(-100 + pMid.x, 520);
      ctx.quadraticCurveTo(400 + pMid.x, 420, 900 + pMid.x, 500);
      ctx.quadraticCurveTo(1300 + pMid.x, 440, 1700 + pMid.x, 520);
      ctx.lineTo(1900 + pMid.x, 900);
      ctx.lineTo(-300 + pMid.x, 900);
      ctx.fill();

      // Celeiro rústico ao fundo à esquerda (parallax próximo)
      const pNear = parallax(world, 0.55);
      ctx.save();
      ctx.translate(pNear.x, 0);
      ctx.fillStyle = "#7c2222";
      ctx.beginPath();
      ctx.moveTo(220, 560);
      ctx.lineTo(220, 380);
      ctx.lineTo(350, 310);
      ctx.lineTo(480, 380);
      ctx.lineTo(480, 560);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(330, 440, 40, 60);
      ctx.restore();

      // Moinho de vento à direita com pás giratórias (parallax próximo)
      const mx = 1250, my = 360;
      const ev = world.stageEvent;
      const millSpin = ev?.kind === "windmill" && (ev.warn > 0 || ev.active > 0) ? 0.22 : 0.015;
      ctx.save();
      ctx.translate(pNear.x, 0);
      ctx.fillStyle = "#4a2d1d";
      ctx.beginPath();
      ctx.moveTo(mx - 30, 560);
      ctx.lineTo(mx - 15, my);
      ctx.lineTo(mx + 15, my);
      ctx.lineTo(mx + 30, 560);
      ctx.closePath();
      ctx.fill();

      // Pás do moinho girando (aceleram na rajada)
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(frame * millSpin);
      ctx.fillStyle = "#8a5832";
      ctx.strokeStyle = "#362011";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-6, -110, 12, 110);
        ctx.strokeRect(-6, -110, 12, 110);
      }
      ctx.restore();
      ctx.restore();

      // Vaga-lumes flutuando (parallax aéreo)
      const pAir = parallax(world, 0.7);
      ctx.fillStyle = "#fef08a";
      for (let f = 0; f < 14; f++) {
        const fx = 200 + pAir.x + ((f * 110 + frame * 0.8) % 1200);
        const fy = 300 + Math.sin(frame * 0.04 + f) * 60;
        ctx.globalAlpha = 0.5 + Math.sin(frame * 0.08 + f) * 0.4;
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Chão de grama e terra
      const groundGrad = ctx.createLinearGradient(0, 560, 0, 680);
      groundGrad.addColorStop(0, "#4d6b2c");
      groundGrad.addColorStop(0.2, "#365314");
      groundGrad.addColorStop(0.6, "#543821");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(160, 560, 1280, 120);

      // Plataformas
      stage.platforms.forEach((p) => {
        ctx.fillStyle = "#8a5832";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#5c8a32";
        ctx.fillRect(p.x, p.y, p.w, 4);
      });
    },
    eventDrawFg(ctx, stage, frame, world) {
      const ev = world.stageEvent;
      if (ev?.kind !== "windmill" || (ev.active <= 0 && ev.warn <= 0)) return;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineWidth = 3;
      const n = ev.active > 0 ? 10 : 5;
      ctx.strokeStyle = ev.active > 0 ? "rgba(255,214,138,0.55)" : "rgba(255,214,138,0.22)";
      for (let i = 0; i < n; i++) {
        const yy = 140 + i * 52 + Math.sin(frame * 0.2 + i) * 12;
        const sx = 2000 - ((frame * (13 + (i % 4) * 3) + i * 263) % 2100);
        ctx.beginPath();
        ctx.moveTo(sx, yy);
        ctx.lineTo(sx + 100, yy - 8);
        ctx.stroke();
      }
      ctx.restore();
    },
  },

  cerrado_tempestade: {
    id: "cerrado_tempestade",
    name: "Cerrado da Tempestade",
    subtitle: "Terra dos Relâmpagos",
    theme: "storm",
    width: 1600,
    height: 900,
    ground: { x: 180, y: 560, w: 1240, h: 40 },
    platforms: [
      { x: 380, y: 390, w: 250, h: 18, pass: true, label: "Tronco Centenário" },
      { x: 970, y: 390, w: 250, h: 18, pass: true, label: "Penhasco Molhado" },
    ],
    ledges: [
      { x: 180, y: 560, dir: -1 },
      { x: 1420, y: 560, dir: 1 },
    ],
    blast: { l: -140, r: 1740, t: -160, b: 830 },
    spawn: [
      { x: 520, y: 560 },
      { x: 1080, y: 560 },
    ],
    draw(ctx, stage, frame, world) {
      const flash = frame % 180 > 174;

      const grad = ctx.createLinearGradient(0, 0, 0, 900);
      if (flash) {
        grad.addColorStop(0, "#8da4c4");
        grad.addColorStop(0.5, "#4c607a");
        grad.addColorStop(1, "#263242");
      } else {
        grad.addColorStop(0, "#080c14");
        grad.addColorStop(0.5, "#141c2b");
        grad.addColorStop(1, "#1a2538");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -200, 1800, 1100);

      if (flash) {
        ctx.strokeStyle = "#e0f2fe";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(850, -50);
        ctx.lineTo(820, 140);
        ctx.lineTo(870, 220);
        ctx.lineTo(810, 360);
        ctx.lineTo(840, 480);
        ctx.stroke();
      }

      const pTrees = parallax(world, 0.5);
      ctx.save();
      ctx.translate(pTrees.x, 0);
      ctx.fillStyle = "#0c1524";
      for (let t = 0; t < 6; t++) {
        const tx = 200 + t * 240;
        ctx.beginPath();
        ctx.moveTo(tx, 560);
        ctx.quadraticCurveTo(tx - 30, 440, tx - 10, 350);
        ctx.lineTo(tx + 15, 350);
        ctx.quadraticCurveTo(tx + 20, 440, tx + 30, 560);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(tx, 320, 60, 40, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.strokeStyle = "rgba(186, 230, 253, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let r = 0; r < 40; r++) {
        const rx = ((r * 43 + frame * 16) % 1500) + 50;
        const ry = ((r * 29 + frame * 22) % 700) - 50;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 12, ry + 28);
      }
      ctx.stroke();

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(180, 560, 1240, 120);
      ctx.fillStyle = "#38bdf8";
      ctx.globalAlpha = 0.2;
      ctx.fillRect(180, 560, 1240, 6);
      ctx.globalAlpha = 1.0;

      stage.platforms.forEach((p) => {
        ctx.fillStyle = "#334155";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
      });
    },
    eventDrawFg(ctx, stage, frame, world) {
      const ev = world.stageEvent;
      if (ev?.kind !== "gust") return;

      // Relâmpago de aviso no ponto de impacto
      if (ev.warn > 0 || ev.flashT > 0) {
        const a = ev.flashT > 0 ? 0.9 : Math.max(0, 0.35 + 0.3 * Math.sin(frame * 0.8));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = "#e0f2fe";
        ctx.lineWidth = 5;
        ctx.shadowColor = "#7dd3fc";
        ctx.shadowBlur = 24;
        ctx.beginPath();
        let lx = ev.flashX;
        let ly = -60;
        ctx.moveTo(lx, ly);
        let seed = 7;
        for (let s = 0; s < 6; s++) {
          seed = (seed * 31 + 17) % 97;
          lx += (seed - 48) * 1.2;
          ly += 85;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Rajada: rajadas de vento cortando a arena
      if (ev.active > 0) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(186,230,253,0.5)";
        for (let i = 0; i < 12; i++) {
          const yy = 100 + i * 45 + Math.sin(frame * 0.25 + i) * 14;
          const span = 2200;
          const off = (frame * (16 + (i % 5) * 4) + i * 331) % span;
          const sx = ev.dir === 1 ? -200 + off : 2000 - off;
          ctx.beginPath();
          ctx.moveTo(sx, yy);
          ctx.lineTo(sx + ev.dir * 110, yy - 10);
          ctx.stroke();
        }
        ctx.restore();
      }
    },
  },

  curral_fantasma: {
    id: "curral_fantasma",
    name: "Curral Fantasma",
    subtitle: "O Rancho dos Espíritos",
    theme: "ghost",
    width: 1600,
    height: 900,
    ground: { x: 160, y: 560, w: 1280, h: 40 },
    platforms: [
      { x: 360, y: 390, w: 250, h: 18, pass: true, label: "Ferradura Espectral" },
      { x: 990, y: 390, w: 250, h: 18, pass: true, label: "Porteira Assombrada" },
    ],
    ledges: [
      { x: 160, y: 560, dir: -1 },
      { x: 1440, y: 560, dir: 1 },
    ],
    blast: { l: -140, r: 1740, t: -160, b: 830 },
    spawn: [
      { x: 500, y: 560 },
      { x: 1100, y: 560 },
    ],
    draw(ctx, stage, frame, world) {
      const grad = ctx.createLinearGradient(0, 0, 0, 900);
      grad.addColorStop(0, "#041417");
      grad.addColorStop(0.5, "#082f2f");
      grad.addColorStop(1, "#0d4239");
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -200, 1800, 1100);

      const pMoon = parallax(world, 0.2);
      ctx.fillStyle = "#a7f3d0";
      ctx.beginPath();
      ctx.arc(800 + pMoon.x, 200 + pMoon.y * 0.5, 75, 0, Math.PI * 2);
      ctx.fill();

      const pMidG = parallax(world, 0.45);
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#34d399";
      for (let m = 0; m < 5; m++) {
        const mx = 200 + pMidG.x + m * 260 + Math.sin(frame * 0.03 + m) * 40;
        const my = 500 + Math.cos(frame * 0.04 + m) * 20;
        ctx.beginPath();
        ctx.ellipse(mx, my, 140, 45, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.fillStyle = "#134e4a";
      ctx.fillRect(160, 560, 1280, 120);
      ctx.fillStyle = "#6ee7b7";
      ctx.fillRect(160, 560, 1280, 4);

      stage.platforms.forEach((p) => {
        ctx.fillStyle = "#115e59";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "#5eead4";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
      });
    },
    eventDrawFg(ctx, stage, frame, world) {
      const ev = world.stageEvent;
      if (ev?.kind !== "fog" || ev.active <= 0) return;
      const p = 1 - ev.active / ev.dur;
      const inten = Math.sin(p * Math.PI);
      const cx = 800;
      const cy = 400;
      const inner = 760 - inten * 400;
      ctx.save();
      const grad = ctx.createRadialGradient(cx, cy, Math.max(60, inner * 0.5), cx, cy, inner + 420);
      grad.addColorStop(0, "rgba(2,22,24,0)");
      grad.addColorStop(0.65, `rgba(2,26,28,${0.35 * inten})`);
      grad.addColorStop(1, `rgba(1,18,20,${0.9 * inten})`);
      ctx.fillStyle = grad;
      ctx.fillRect(-250, -250, 2300, 1400);

      // Espíritos flutuando na névoa
      ctx.fillStyle = "#6ee7b7";
      for (let i = 0; i < 7; i++) {
        const wx = 160 + i * 210 + Math.sin(frame * 0.03 + i * 1.7) * 70;
        const wy = 560 - ((frame * (0.5 + (i % 3) * 0.25) + i * 130) % 460);
        ctx.globalAlpha = Math.max(0, 0.5 * inten * (0.4 + 0.6 * Math.abs(Math.sin(frame * 0.06 + i))));
        ctx.beginPath();
        ctx.arc(wx, wy, 4 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  },

  arena_aurora: {
    id: "arena_aurora",
    name: "Arena da Aurora",
    subtitle: "O Santuário da Ferradura Mística",
    theme: "aurora",
    width: 1600,
    height: 900,
    ground: { x: 180, y: 560, w: 1240, h: 40 },
    platforms: [
      { x: 390, y: 390, w: 260, h: 18, pass: true, label: "Cristal da Aurora" },
      { x: 950, y: 390, w: 260, h: 18, pass: true, label: "Arco Estelar" },
    ],
    ledges: [
      { x: 180, y: 560, dir: -1 },
      { x: 1420, y: 560, dir: 1 },
    ],
    blast: { l: -140, r: 1740, t: -160, b: 830 },
    spawn: [
      { x: 520, y: 560 },
      { x: 1080, y: 560 },
    ],
    draw(ctx, stage, frame, world) {
      const grad = ctx.createLinearGradient(0, 0, 0, 900);
      grad.addColorStop(0, "#090314");
      grad.addColorStop(0.4, "#240b3b");
      grad.addColorStop(0.75, "#431407");
      grad.addColorStop(1, "#18052e");
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -200, 1800, 1100);

      const pAur = parallax(world, 0.3);
      ctx.save();
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.22;
        const color = i === 0 ? "#67e8f9" : i === 1 ? "#ec4899" : "#a855f7";
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-100, 200 + i * 40);
        for (let x = 0; x <= 1800; x += 100) {
          const y = 200 + i * 50 + Math.sin(frame * 0.025 + (x - pAur.x) * 0.004 + i) * 60;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(1800, 600);
        ctx.lineTo(-100, 600);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = "rgba(254, 240, 138, 0.45)";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(800 + pAur.x * 1.4, 240, 90, Math.PI * 0.2, Math.PI * 0.8, true);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#2e1065";
      ctx.fillRect(180, 560, 1240, 120);
      ctx.fillStyle = "#c084fc";
      ctx.fillRect(180, 560, 1240, 6);

      stage.platforms.forEach((p) => {
        ctx.fillStyle = "#4c1d95";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "#e879f9";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
      });
    },
    eventDrawFg(ctx, stage, frame, world) {
      const ev = world.stageEvent;
      if (ev?.kind !== "aurora" || ev.active <= 0) return;
      const w = 170;
      ctx.save();
      const grad = ctx.createLinearGradient(ev.x - w, 0, ev.x + w, 0);
      grad.addColorStop(0, "rgba(103,232,249,0)");
      grad.addColorStop(0.45, "rgba(103,232,249,0.30)");
      grad.addColorStop(0.55, "rgba(236,72,153,0.32)");
      grad.addColorStop(1, "rgba(168,85,247,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(ev.x - w, -220, w * 2, 1140);

      // Núcleo brilhante da onda
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(frame * 0.2);
      ctx.fillStyle = "#fef9c3";
      ctx.fillRect(ev.x - 4, -220, 8, 1140);

      // Brilho na base
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#a5f3fc";
      ctx.beginPath();
      ctx.ellipse(ev.x, stage.ground.y + 6, 140, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },

  rooftop: {
    id: "rooftop",
    name: "Terraço Neon",
    subtitle: "Metrópole Futurista",
    bgKey: "stages/rooftop.jpg",
    theme: "cyber",
    width: 1600,
    height: 900,
    ground: { x: 180, y: 560, w: 1240, h: 40 },
    platforms: [
      { x: 390, y: 390, w: 260, h: 18, pass: true, label: "Plataforma Oeste" },
      { x: 950, y: 390, w: 260, h: 18, pass: true, label: "Plataforma Leste" },
    ],
    ledges: [
      { x: 180, y: 560, dir: -1 },
      { x: 1420, y: 560, dir: 1 },
    ],
    blast: { l: -120, r: 1720, t: -160, b: 820 },
    spawn: [
      { x: 520, y: 560 },
      { x: 1080, y: 560 },
    ],
    draw(ctx, stage, frame, world) {
      const bg = world.sprites?.img("stages/rooftop.jpg");
      if (bg) {
        const pp = parallax(world, 0.6);
        ctx.drawImage(bg, -280 + pp.x, -70 + pp.y, stage.width + 480, stage.height + 80);
      } else {
        ctx.fillStyle = "#0a0a1f";
        ctx.fillRect(-100, -200, 1800, 1100);
        ctx.fillStyle = "#1e1e38";
        ctx.fillRect(180, 560, 1240, 120);
      }
    },
    eventDrawBg(ctx, stage, frame, world) {
      const ev = world.stageEvent;
      if (ev?.kind !== "neon" || ev.active <= 0) return;
      const g = stage.ground;
      const hue = (ev.beat * 40 + frame) % 360;
      const pulse = 0.55 + 0.45 * Math.sin(frame * 0.25);
      ctx.save();

      // Piso pulsando no beat
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = `hsla(${hue}, 90%, 55%, ${0.16 * pulse})`;
      ctx.fillRect(g.x, g.y, g.w, 40);

      // Grade neon no chão
      ctx.strokeStyle = `hsla(${(hue + 120) % 360}, 95%, 65%, ${0.5 * pulse})`;
      ctx.lineWidth = 2;
      for (let i = 0; i <= 12; i++) {
        const x = g.x + (g.w / 12) * i;
        ctx.beginPath();
        ctx.moveTo(x, g.y);
        ctx.lineTo(x, g.y + 40);
        ctx.stroke();
      }
      for (let j = 1; j < 4; j++) {
        const y = g.y + (40 / 4) * j;
        ctx.beginPath();
        ctx.moveTo(g.x, y);
        ctx.lineTo(g.x + g.w, y);
        ctx.stroke();
      }

      // Colunas de luz
      ctx.globalAlpha = 0.18 * pulse;
      for (let k = 0; k < 4; k++) {
        const cx = g.x + 150 + k * 380 + Math.sin(frame * 0.05 + k) * 40;
        const grd = ctx.createLinearGradient(0, g.y - 500, 0, g.y);
        grd.addColorStop(0, `hsla(${(hue + k * 90) % 360}, 95%, 60%, 0)`);
        grd.addColorStop(1, `hsla(${(hue + k * 90) % 360}, 95%, 60%, 0.5)`);
        ctx.fillStyle = grd;
        ctx.fillRect(cx - 55, g.y - 500, 110, 500);
      }
      ctx.restore();
    },
  },
};

export const STAGE_IDS = ["barretos", "fazenda", "cerrado_tempestade", "curral_fantasma", "arena_aurora", "rooftop"];

for (const stage of Object.values(STAGES)) {
  stage.ground = { x: 40, y: 560, w: 1520, h: 48 };
  stage.ledges = [
    { x: 40, y: 560, dir: -1 },
    { x: 1560, y: 560, dir: 1 },
  ];
}

export function cloneStage(s) {
  return {
    ...s,
    ground: { ...s.ground },
    platforms: s.platforms.map((p) => ({ ...p })),
    ledges: s.ledges.map((l) => ({ ...l })),
    blast: { ...s.blast },
    spawn: s.spawn.map((sp) => ({ ...sp })),
  };
}

/** Impede cair da arena: chão sólido e paredes laterais. */
export function containInArena(p, stage) {
  const g = stage.ground;
  const pad = 22;
  const left = g.x + pad;
  const right = g.x + g.w - pad;
  if (p.x < left) {
    p.x = left;
    if (p.vx < 0) p.vx *= -0.28;
  } else if (p.x > right) {
    p.x = right;
    if (p.vx > 0) p.vx *= -0.28;
  }

  if (p.y > g.y) {
    p.y = g.y;
    if (p.vy > 0) p.vy = 0;
    p.grounded = true;
    p.jumpsLeft = p.char.jumps;
    p.fastFall = false;
    p.usedUpSpecial = false;
  }

  const ceiling = g.y - 430;
  if (p.y < ceiling) {
    p.y = ceiling;
    if (p.vy < 0) p.vy *= -0.15;
  }
}

export function collideStage(p, stage) {
  const boxes = [stage.ground, ...stage.platforms];
  p.grounded = false;
  if (p.vy >= 0) {
    for (const plat of boxes) {
      const wasAbove = p.prevY <= plat.y + 2;
      const drop = plat.pass && p.dropThrough > 0;
      if (drop) continue;
      if (
        wasAbove &&
        p.y >= plat.y &&
        p.prevY <= plat.y &&
        p.x > plat.x + 8 &&
        p.x < plat.x + plat.w - 8
      ) {
        p.y = plat.y;
        p.vy = 0;
        p.grounded = true;
        p.jumpsLeft = p.char.jumps;
        p.fastFall = false;
        p.usedLedge = false;
        p.usedUpSpecial = false;
      }
    }
  }
}

export function tryLedge(p, stage) {
  if (p.grounded || p.vy < -1 || p.usedLedge) return;
  if (["attack", "special", "launched", "hurt", "knockedOut"].includes(p.state)) return;
  for (const l of stage.ledges) {
    if (Math.abs(p.x - l.x) < 28 && p.y > l.y - 10 && p.y < l.y + 70) {
      p.x = l.x + l.dir * 8;
      p.y = l.y + 18;
      p.vx = 0;
      p.vy = 0;
      p.facing = -l.dir;
      p.usedLedge = true;
      p.enter("ledge", 1);
      return;
    }
  }
}
