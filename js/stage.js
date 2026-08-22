export const STAGES = {
  barretos: {
    id: "barretos",
    name: "Arena de Rodeio Barretos",
    subtitle: "A Maior Festa do Peão",
    bgKey: "stages/rooftop.png",
    theme: "rodeo",
    width: 1600,
    height: 900,
    ground: { x: 140, y: 560, w: 1320, h: 40 },
    platforms: [
      { x: 380, y: 390, w: 240, h: 18, pass: true, label: "Feno Oeste" },
      { x: 980, y: 390, w: 240, h: 18, pass: true, label: "Feno Leste" },
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
      // Céu noturno com holofotes de rodeio
      const grad = ctx.createLinearGradient(0, 0, 0, 900);
      grad.addColorStop(0, "#080614");
      grad.addColorStop(0.5, "#1e1024");
      grad.addColorStop(0.85, "#3d2215");
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -200, 1800, 1100);

      // Fachos de luz de holofote animados
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#ffe8a3";
      const beam1 = Math.sin(frame * 0.02) * 120;
      const beam2 = Math.cos(frame * 0.025) * 140;
      ctx.beginPath();
      ctx.moveTo(120, -100);
      ctx.lineTo(400 + beam1, 600);
      ctx.lineTo(600 + beam1, 600);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(1480, -100);
      ctx.lineTo(1000 + beam2, 600);
      ctx.lineTo(1200 + beam2, 600);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Arquibancadas de madeira ao fundo com torcida
      ctx.fillStyle = "#1d120c";
      ctx.fillRect(80, 180, 1440, 300);
      for (let row = 0; row < 5; row++) {
        const ry = 200 + row * 45;
        ctx.fillStyle = row % 2 === 0 ? "#2a1a11" : "#22140d";
        ctx.fillRect(90, ry, 1420, 40);

        // Pessoas com chapéu na torcida (silhuetas animadas)
        for (let i = 0; i < 28; i++) {
          const px = 110 + i * 50 + (row % 2) * 20;
          const bounce = Math.sin(frame * 0.06 + i * 0.7 + row) * 3;
          ctx.fillStyle = i % 3 === 0 ? "#e5b778" : i % 3 === 1 ? "#d48248" : "#8c5630";
          // Chapéu de peão
          ctx.beginPath();
          ctx.ellipse(px, ry + 16 + bounce, 12, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, ry + 12 + bounce, 5, Math.PI, 0);
          ctx.fill();
          // Cabeça/corpo
          ctx.fillStyle = "#4a2d1d";
          ctx.beginPath();
          ctx.arc(px, ry + 22 + bounce, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Faixa Central de Barretos
      ctx.fillStyle = "#8a1b1b";
      ctx.fillRect(520, 250, 560, 48);
      ctx.strokeStyle = "#ffd27a";
      ctx.lineWidth = 3;
      ctx.strokeRect(520, 250, 560, 48);
      ctx.fillStyle = "#ffe9c9";
      ctx.font = "800 20px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⭐ FESTA DO PEÃO DE BARRETOS ⭐", 800, 282);

      // Cercas e porteiras de madeira nas laterais
      ctx.fillStyle = "#4a2d1d";
      ctx.fillRect(100, 420, 40, 160);
      ctx.fillRect(1460, 420, 40, 160);
      ctx.fillStyle = "#6b422a";
      for (let b = 0; b < 4; b++) {
        ctx.fillRect(60, 440 + b * 32, 120, 12);
        ctx.fillRect(1420, 440 + b * 32, 120, 12);
      }

      // Piso de terra e areia de rodeio
      const groundGrad = ctx.createLinearGradient(0, 560, 0, 680);
      groundGrad.addColorStop(0, "#8a5832");
      groundGrad.addColorStop(0.3, "#6b4123");
      groundGrad.addColorStop(1, "#362011");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(140, 560, 1320, 120);

      ctx.fillStyle = "#a87243";
      ctx.fillRect(140, 560, 1320, 8);

      // Detalhes de terra e poeira no solo
      ctx.fillStyle = "#b88352";
      for (let d = 0; d < 20; d++) {
        const dx = 160 + d * 64;
        ctx.fillRect(dx, 570 + (d % 3) * 6, 24, 4);
      }

      // Plataformas de fardo de feno
      stage.platforms.forEach((p) => {
        ctx.fillStyle = "#c99a42";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "#8a6220";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        // Cordas do fardo de feno
        ctx.fillStyle = "#593c12";
        ctx.fillRect(p.x + 40, p.y, 6, p.h);
        ctx.fillRect(p.x + p.w - 46, p.y, 6, p.h);
      });
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
      // Efeito de relâmpago esporádico
      const flash = frame % 180 > 174;

      // Céu de tempestade
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

      // Raio riscando o céu durante o flash
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

      // Árvores retorcidas do cerrado ao fundo
      ctx.fillStyle = "#0c1524";
      for (let t = 0; t < 6; t++) {
        const tx = 200 + t * 240;
        ctx.beginPath();
        ctx.moveTo(tx, 560);
        ctx.quadraticCurveTo(tx - 30, 440, tx - 10, 350);
        ctx.lineTo(tx + 15, 350);
        ctx.quadraticCurveTo(tx + 20, 440, tx + 30, 560);
        ctx.fill();
        // Folhagem escura
        ctx.beginPath();
        ctx.ellipse(tx, 320, 60, 40, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gotas de chuva caindo
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

      // Solo molhado
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(180, 560, 1240, 120);
      ctx.fillStyle = "#38bdf8";
      ctx.globalAlpha = 0.2;
      ctx.fillRect(180, 560, 1240, 6);
      ctx.globalAlpha = 1.0;

      // Plataformas
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
      // Céu noturno fantasmagórico com luar esmeralda
      const grad = ctx.createLinearGradient(0, 0, 0, 900);
      grad.addColorStop(0, "#041417");
      grad.addColorStop(0.5, "#082f2f");
      grad.addColorStop(1, "#0d4239");
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -200, 1800, 1100);

      // Lua fantasmagórica verde
      ctx.fillStyle = "#a7f3d0";
      ctx.beginPath();
      ctx.arc(800, 200, 75, 0, Math.PI * 2);
      ctx.fill();

      // Névoa espectral ondulante no solo
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

      // Cercas e crânios de gado de rodeio esculpidos
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
      // Céu cósmico da Aurora
      const grad = ctx.createLinearGradient(0, 0, 0, 900);
      grad.addColorStop(0, "#090314");
      grad.addColorStop(0.4, "#240b3b");
      grad.addColorStop(0.75, "#431407");
      grad.addColorStop(1, "#18052e");
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -200, 1800, 1100);

      // Faixas ondulantes de Aurora Borealis cósmica
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

      // Ferradura gigante estelar de luz no céu
      ctx.save();
      ctx.strokeStyle = "rgba(254, 240, 138, 0.45)";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(800, 240, 90, Math.PI * 0.2, Math.PI * 0.8, true);
      ctx.stroke();
      ctx.restore();

      // Chão de cristal estelar
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
