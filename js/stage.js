export const STAGES = {
  rooftop: {
    id: "rooftop",
    name: "Terraço Neon",
    bg: "stages/rooftop.png",
    width: 1600,
    height: 900,
    ground: { x: 180, y: 560, w: 1240, h: 40 },
    platforms: [
      { x: 390, y: 390, w: 260, h: 18, pass: true },
      { x: 950, y: 390, w: 260, h: 18, pass: true },
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
  },
};

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
