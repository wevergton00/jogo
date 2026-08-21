/** Laço do Evertinho: corda, prisão, puxão e variantes. */

export function handPos(p) {
  return { x: p.x + p.facing * 30, y: p.y - 54 };
}

export function drawRope(ctx, x1, y1, x2, y2, opt = {}) {
  const color = opt.color || "#e8b84a";
  const glow = opt.glow || "#ffe56b";
  const sag = opt.sag ?? 26;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = glow;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.stroke();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(x2, y2, opt.loopW || 15, opt.loopH || 11, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawSpinRing(ctx, f, kind = "body") {
  const t = f.stateTime || 0;
  const pulse = 1 + Math.sin(t * 0.45) * 0.06;
  ctx.save();
  ctx.strokeStyle = kind === "magic" ? "#d4b3ff" : "#ffe56b";
  ctx.shadowColor = kind === "magic" ? "#a66bff" : "#ffae00";
  ctx.shadowBlur = 12;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.85;
  if (kind === "head") {
    ctx.beginPath();
    ctx.ellipse(f.x, f.y - 92, 38 * pulse, 14 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(f.x, f.y - 42, 72 * pulse, 48 * pulse, t * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(f.x, f.y - 42, 58 * pulse, 36 * pulse, -t * 0.15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function ropeStyle(kind) {
  if (kind === "thunder") return { color: "#7ec8ff", glow: "#e8f6ff", sag: 18 };
  if (kind === "magic") return { color: "#c9a4ff", glow: "#f0e4ff", sag: 22, loopW: 22, loopH: 16 };
  if (kind === "explode") return { color: "#ff8a4a", glow: "#ffd27a", sag: 20 };
  return { color: "#e8b84a", glow: "#ffe56b", sag: 26 };
}

export function applySnare(attacker, victim, frames, world) {
  if (!victim?.alive) return false;
  if (victim.intangible > 0 || victim.state === "knockedOut" || victim.state === "respawn") return false;
  if (victim.state === "dodge" || victim.state === "shield") return false;
  victim.enter("snared", frames);
  victim.vx = 0;
  victim.vy = 0;
  victim.snareOwner = attacker.id;
  attacker.lassoLock = { targetId: victim.id, timer: frames + 10, kind: "trap" };
  world.audio?.sfx("snare");
  world.burst?.("snare", victim.x, victim.y - 42, attacker.facing);
  world.announce?.("PRESO!", 36);
  return true;
}

export function mashEscape(victim, input) {
  if (!input) return 0;
  let n = 0;
  if (input.leftPressed) n += 5;
  if (input.rightPressed) n += 5;
  if (input.jumpPressed || input.upPressed) n += 5;
  if (input.lightPressed || input.strongPressed) n += 4;
  if (input.shieldPressed) n += 6;
  return n;
}
