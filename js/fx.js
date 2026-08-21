/** Impactos e partículas procedurais — não cobrem o lutador. */

export function burst(world, kind, x, y, dir = 1) {
  if (!world.particles) world.particles = [];
  const add = (p) => world.particles.push(p);
  const spray = (count, extra) => {
    for (let i = 0; i < count; i++) {
      const a = extra.angle ?? Math.random() * Math.PI * 2;
      const sp = (extra.spMin ?? 1) + Math.random() * (extra.sp ?? 3.5);
      add({
        type: extra.type || "dot",
        x: x + (extra.ox || 0),
        y: y + (extra.oy || 0),
        vx: Math.cos(a) * sp * (dir || 1),
        vy: Math.sin(a) * sp - (extra.up || 1.2),
        life: extra.life || 16,
        max: extra.life || 16,
        r: extra.r || 2.5 + Math.random() * 3,
        color: extra.color,
        gravity: extra.gravity ?? 0.14,
        dir,
        rot: Math.random() * 6,
        rotv: (Math.random() - 0.5) * 0.4,
      });
    }
  };

  switch (kind) {
    case "dust":
      spray(7, { color: "rgba(196,165,116,0.85)", life: 18, sp: 2.2, type: "dot", gravity: 0.22, up: 0.4 });
      break;
    case "burst":
    case "hit":
      spray(8, { color: "#ffe56b", life: 12, sp: 3.4, type: "spark", up: 1.4 });
      spray(4, { color: "#fff4c8", life: 10, sp: 2.2, type: "dot", r: 2 });
      break;
    case "explode":
      spray(14, { color: "#ff6a3d", life: 20, sp: 5.2, type: "spark", up: 2 });
      spray(8, { color: "#ffd27a", life: 16, sp: 3.4, type: "dot" });
      if (world.shake < 14) world.shake = 14;
      break;
    case "thunder":
      spray(10, { color: "#9ad8ff", life: 16, sp: 4.2, type: "spark", up: 1.6 });
      spray(6, { color: "#eef8ff", life: 12, sp: 2.8, type: "dot", r: 2 });
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        add({
          type: "bolt",
          x,
          y,
          vx: Math.cos(a) * 18,
          vy: Math.sin(a) * 18,
          life: 8,
          max: 8,
          color: "#7ec8ff",
          dir,
        });
      }
      if (world.shake < 8) world.shake = 8;
      break;
    case "magic":
      spray(10, { color: "#d4b3ff", life: 24, sp: 3.2, type: "star", up: 1.8, gravity: 0.04 });
      spray(6, { color: "#ffe56b", life: 20, sp: 2.4, type: "dot", gravity: 0.06 });
      for (let i = 0; i < 4; i++) {
        add({
          type: "rune",
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -0.4 - Math.random(),
          life: 28,
          max: 28,
          r: 7 + Math.random() * 4,
          color: "#c9a4ff",
          gravity: -0.02,
          dir,
        });
      }
      break;
    case "snare":
      spray(6, { color: "#e8b84a", life: 14, sp: 2.6, type: "spark", up: 1 });
      break;
    case "horse":
      spray(10, { color: "rgba(180,140,90,0.9)", life: 20, sp: 3, type: "dot", gravity: 0.25, up: 0.2 });
      break;
    default:
      spray(6, { color: "#ffe56b", life: 12, sp: 2.8, type: "dot" });
  }
}

export function tickParticles(particles) {
  for (const p of particles) {
    p.life--;
    p.x += p.vx || 0;
    p.y += p.vy || 0;
    p.vy = (p.vy || 0) + (p.gravity || 0);
    p.rot = (p.rot || 0) + (p.rotv || 0);
  }
  return particles.filter((p) => p.life > 0);
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    if (p.sprite) continue;
    const a = Math.max(0, p.life / (p.max || 16));
    ctx.save();
    ctx.globalAlpha = Math.min(1, a * 1.15) * 0.9;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot || 0);
    ctx.fillStyle = p.color || "#fff";
    ctx.strokeStyle = p.color || "#fff";
    if (p.type === "spark") {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-p.r, 0);
      ctx.lineTo(p.r * 1.8, 0);
      ctx.stroke();
    } else if (p.type === "star") {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * p.r, Math.sin(ang) * p.r);
      }
      ctx.stroke();
    } else if (p.type === "bolt") {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(p.vx, p.vy);
      ctx.lineTo(p.vx * 0.6 + 4, p.vy * 0.6);
      ctx.stroke();
    } else if (p.type === "rune") {
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-p.r / 2, -p.r / 2, p.r, p.r);
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.25, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.r || 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
