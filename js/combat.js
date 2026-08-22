export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function hurtbox(p) {
  return {
    x: p.x - p.char.hurtW / 2,
    y: p.y - p.char.hurtH,
    w: p.char.hurtW,
    h: p.char.hurtH,
  };
}

export function worldHitbox(p, hb) {
  if (p.facing === 1) return { x: p.x + hb.x, y: p.y + hb.y, w: hb.w, h: hb.h };
  return { x: p.x - hb.x - hb.w, y: p.y + hb.y, w: hb.w, h: hb.h };
}

export function applyHit(attacker, victim, move, world) {
  if (victim.intangible > 0 || victim.state === "knockedOut" || victim.state === "respawn") return false;
  if (victim.state === "dodge") return false;

  // Escudo
  if (victim.state === "shield") {
    victim.shieldHp -= move.shieldDamage ?? 4;
    world.audio.sfx("shield");
    world.spawnFx("burst", victim.x, victim.y - 40, attacker.facing);
    attacker.specialMeter = Math.min(100, (attacker.specialMeter || 0) + 2);
    if (victim.shieldHp <= 0) {
      victim.enter("hurt", 40);
      victim.vx = 3.5 * attacker.facing;
      victim.percent += 6;
    }
    return true;
  }

  // Dano e medidor de especial
  const dmg = move.damage;
  victim.percent += dmg;
  victim.hitBy = attacker.id;

  attacker.specialMeter = Math.min(100, (attacker.specialMeter || 0) + dmg * 0.8 + 3);
  victim.specialMeter = Math.min(100, (victim.specialMeter || 0) + dmg * 0.4 + 2);

  // Knockback e física de lançamento
  const kb =
    ((victim.percent / 10 + dmg * 0.55) * (move.kbScale ?? 0.4) + (move.kbBase ?? 8)) *
    (180 / (victim.char.weight + 100));
  const ang = ((move.angle ?? 45) * Math.PI) / 180;
  const dir = attacker.facing;
  victim.vx = Math.cos(ang) * kb * 0.42 * dir;
  victim.vy = -Math.sin(ang) * kb * 0.42;

  if (move.angle === 270) {
    victim.vx = 1.2 * dir;
    victim.vy = Math.max(8, kb * 0.35);
  }

  if (move.pull) {
    victim.x = attacker.x + attacker.facing * 48;
    victim.vx = 3.2 * attacker.facing;
    victim.vy = -4;
  }

  const stun = Math.min(68, (move.hitstun ?? 12) + victim.percent * 0.12);
  victim.hitlag = move.hitlag ?? (move.superMove ? 14 : 6);
  attacker.hitlag = Math.max(0, (move.hitlag ?? 6) - 2);

  victim.combo = (attacker.lastHitVictim === victim.id ? victim.combo : 0) + 1;
  attacker.lastHitVictim = victim.id;
  attacker.comboHits = victim.combo;
  world.combo = { owner: attacker.port, count: victim.combo, timer: 90 };

  if (kb > 11 || victim.percent > 70 || move.superMove) {
    victim.enter("launched", stun);
  } else {
    victim.enter("hurt", stun);
  }

  world.audio.sfx(move.superMove ? "super_activate" : dmg >= 12 ? "strong" : "hit");
  world.shake = Math.min(18, (move.superMove ? 12 : 3) + dmg * 0.4);
  world.spawnFx("burst", victim.x, victim.y - 46, dir);
  if (dmg >= 12 || move.superMove) {
    world.spawnFx("explode", victim.x, victim.y - 40, dir);
  }

  return true;
}
