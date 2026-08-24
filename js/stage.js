export const STAGES = {
  barretos: {
    id: "barretos",
    name: "Parque do Peão de Barretos",
    subtitle: "Arena de Rodeio · Oscar Niemeyer",
    theme: "rodeo",
    bgKey: "stages/barretos.png",
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
      const bg = world.sprites?.img("stages/barretos.png");
      if (bg) {
        ctx.drawImage(bg, -80, -40, stage.width + 80, stage.height);
      } else {
        // Fallback se o PNG não carregar
        const grad = ctx.createLinearGradient(0, -100, 0, 800);
        grad.addColorStop(0, "#2a0c18");
        grad.addColorStop(0.35, "#8a1f14");
        grad.addColorStop(0.7, "#d4531a");
        grad.addColorStop(1, "#9c4826");
        ctx.fillStyle = grad;
        ctx.fillRect(-100, -200, 1800, 1100);
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

      if (!bg) {
        stage.platforms.forEach((p) => {
          ctx.fillStyle = "#d4a446";
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.strokeStyle = "#8a6220";
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = "#593c12";
          ctx.fillRect(p.x + 35, p.y, 6, p.h);
          ctx.fillRect(p.x + p.w - 41, p.y, 6, p.h);
          ctx.fillStyle = "#fae078";
          ctx.fillRect(p.x + 2, p.y, p.w - 4, 3);
        });
      }
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

      // Grande sol poente dourado
      ctx.fillStyle = "#fff4d0";
      ctx.beginPath();
      ctx.arc(800, 380, 110, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(800, 380, 160, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Colinas ao fundo
      ctx.fillStyle = "#5c2438";
      ctx.beginPath();
      ctx.moveTo(-100, 520);
      ctx.quadraticCurveTo(400, 420, 900, 500);
      ctx.quadraticCurveTo(1300, 440, 1700, 520);
      ctx.lineTo(1700, 900);
      ctx.lineTo(-100, 900);
      ctx.fill();

      // Celeiro rústico ao fundo à esquerda
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

      // Moinho de vento à direita com pás giratórias
      const mx = 1250, my = 360;
      ctx.fillStyle = "#4a2d1d";
      ctx.beginPath();
      ctx.moveTo(mx - 30, 560);
      ctx.lineTo(mx - 15, my);
      ctx.lineTo(mx + 15, my);
      ctx.lineTo(mx + 30, 560);
      ctx.closePath();
      ctx.fill();

      // Pás do moinho girando
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(frame * 0.015);
      ctx.fillStyle = "#8a5832";
      ctx.strokeStyle = "#362011";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-6, -110, 12, 110);
        ctx.strokeRect(-6, -110, 12, 110);
      }
      ctx.restore();

      // Vaga-lumes flutuando
      ctx.fillStyle = "#fef08a";
      for (let f = 0; f < 14; f++) {
        const fx = 200 + ((f * 110 + frame * 0.8) % 1200);
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

      ctx.fillStyle = "#a7f3d0";
      ctx.beginPath();
      ctx.arc(800, 200, 75, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#34d399";
      for (let m = 0; m < 5; m++) {
        const mx = 200 + m * 260 + Math.sin(frame * 0.03 + m) * 40;
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

      ctx.save();
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.22;
        const color = i === 0 ? "#67e8f9" : i === 1 ? "#ec4899" : "#a855f7";
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-100, 200 + i * 40);
        for (let x = 0; x <= 1800; x += 100) {
          const y = 200 + i * 50 + Math.sin(frame * 0.025 + x * 0.004 + i) * 60;
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
      ctx.arc(800, 240, 90, Math.PI * 0.2, Math.PI * 0.8, true);
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
  },

  rooftop: {
    id: "rooftop",
    name: "Terraço Neon",
    subtitle: "Metrópole Futurista",
    bgKey: "stages/rooftop.png",
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
      const bg = world.sprites?.img("stages/rooftop.png");
      if (bg) {
        ctx.drawImage(bg, -80, -40, stage.width + 80, stage.height);
      } else {
        ctx.fillStyle = "#0a0a1f";
        ctx.fillRect(-100, -200, 1800, 1100);
        ctx.fillStyle = "#1e1e38";
        ctx.fillRect(180, 560, 1240, 120);
      }
    },
  },
};

export const STAGE_IDS = ["barretos", "fazenda", "cerrado_tempestade", "curral_fantasma", "arena_aurora", "rooftop"];

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
