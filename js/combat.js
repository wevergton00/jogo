import { applySnare, mashEscape } from "./lasso.js";
import { dismount, findHorse } from "./horse.js";

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function hurtbox(p) {
  const extra = p.mounted ? 16 : 0;
  const crouch = p.state === "crouch" ? 18 : 0;
  return {
    x: p.x - (p.char.hurtW + extra) / 2,
    y: p.y - (p.char.hurtH + extra) + crouch,
    w: p.char.hurtW + extra,
    h: p.char.hurtH + extra - crouch,
  };
}

export function worldHitbox(p, hb) {
  if (p.facing === 1) return { x: p.x + hb.x, y: p.y + hb.y, w: hb.w, h: hb.h };
  return { x: p.x - hb.x - hb.w, y: p.y + hb.y, w: hb.w, h: hb.h };
}

export function applyHit(attacker, victim, move, world) {
  if (victim.intangible > 0 || victim.state === "knockedOut" || victim.state === "respawn") return false;
  if (victim.state === "dodge") return false;

  if (victim.state === "shield") {
    victim.shieldHp -= move.shieldDamage ?? 4;
    world.audio.sfx("shield");
    world.spawnFx("burst", victim.x, victim.y - 40, attacker.facing);
    world.burst?.("burst", victim.x, victim.y - 40, attacker.facing);
    if (victim.shieldHp <= 0) {
      victim.enter("hurt", 40);
      victim.vx = 3.5 * attacker.facing;
      victim.percent += 6;
    }
    return true;
  }

  const dmg = move.damage || 0;
  victim.percent += dmg;
  victim.hitBy = attacker.id;

  const comboHits = attacker.lastHitVictim === victim.id ? victim.combo + 1 : 1;
  victim.combo = comboHits;
  attacker.lastHitVictim = victim.id;
  attacker.comboHits = comboHits;
  const scale = Math.max(0.38, 1 - Math.max(0, comboHits - 1) * 0.11);
  const kbScale = Math.max(0.55, 1 - Math.max(0, comboHits - 1) * 0.08);

  world.combo = { owner: attacker.port, count: comboHits, timer: 90 };
  if (world.train) {
    world.train.combo = comboHits;
    world.train.maxCombo = Math.max(world.train.maxCombo, comboHits);
    world.train.lastDamage = dmg;
    world.train.lastMove = move.callout || move.name || "";
  }

  if (move.callout) world.announce?.(move.callout, 48);

  const fxKind = move.fx || (dmg >= 12 ? "explode" : "burst");
  world.burst?.(fxKind, victim.x, victim.y - 46, attacker.facing);
  world.spawnFx?.("burst", victim.x, victim.y - 46, attacker.facing);
  if (fxKind === "explode") world.spawnFx?.("explode", victim.x, victim.y - 40, attacker.facing);
  if (fxKind === "magic") world.spawnFx?.("sparkle", victim.x, victim.y - 48, attacker.facing);
  if (fxKind === "dust") world.spawnFx?.("dust", victim.x, victim.y, attacker.facing);

  if (victim.mounted && (dmg >= 8 || (move.kbBase || 0) > 10)) {
    dismount(victim, world, true);
    findHorse(world, victim.id)?.hit(dmg, attacker.facing);
  }

  if (move.trap) {
    applySnare(attacker, victim, move.trapFrames || 34, world);
    victim.hitlag = move.hitlag ?? 5;
    attacker.hitlag = Math.max(0, (move.hitlag ?? 5) - 2);
    world.audio.sfx(dmg >= 12 ? "strong" : "hit");
    world.shake = Math.min(10, 2 + dmg * 0.25);
    logTrain(world, move, dmg, move.trapFrames || 34, 0);
    return true;
  }

  const kb =
    ((victim.percent / 10 + dmg * 0.55) * (move.kbScale ?? 0.4) + (move.kbBase ?? 8)) *
    (180 / (victim.char.weight + 100)) *
    kbScale;
  const ang = ((move.angle ?? 45) * Math.PI) / 180;
  const dir = attacker.facing;
  victim.vx = Math.cos(ang) * kb * 0.42 * dir;
  victim.vy = -Math.sin(ang) * kb * 0.42;
  if (move.angle === 270) {
    victim.vx = 1.2 * dir;
    victim.vy = Math.max(8, kb * 0.35);
  }
  if (move.pull) {
    victim.x = attacker.x + attacker.facing * 46;
    victim.vx = 3.2 * attacker.facing;
    victim.vy = -4;
    attacker.lassoLock = null;
    victim.snareOwner = null;
    if (victim.state === "snared") victim.enter("hurt", 8);
  }
  if (move.knockdown) {
    victim.vx = 2.2 * dir;
    victim.vy = 7.5;
  }

  const stun = Math.min(64, ((move.hitstun ?? 12) + victim.percent * 0.12) * scale);
  victim.hitlag = move.hitlag ?? 6;
  attacker.hitlag = Math.max(0, (move.hitlag ?? 6) - 2);

  if (move.multihit && move.multihit > 1) {
    victim.shock = {
      hits: move.multihit - 1,
      delay: 7,
      wait: 7,
      dmg: Math.max(2, Math.round(dmg * 0.35)),
      attackerId: attacker.id,
      fx: move.fx || "thunder",
    };
  }

  if (kb > 11 || victim.percent > 70 || move.knockdown) victim.enter("launched", stun);
  else victim.enter("hurt", stun);

  world.audio.sfx(move.sfx || (fxKind === "thunder" ? "thunder" : fxKind === "magic" ? "magic" : dmg >= 12 ? "strong" : "hit"));
  world.shake = Math.min(16, (move.shake || 3) + dmg * 0.35);
  logTrain(world, move, dmg, stun, kb);
  return true;
}

function logTrain(world, move, dmg, stun, kb) {
  if (!world.train) return;
  world.train.lastDamage = dmg;
  world.train.hitstun = Math.floor(stun);
  world.train.launch = Math.abs(kb).toFixed(1);
  world.train.recovery = move.recovery || 0;
  world.train.lastMove = move.callout || move.name || world.train.lastMove;
}

export { mashEscape };
