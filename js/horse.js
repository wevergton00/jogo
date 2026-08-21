/** Montaria do Evertinho: invocar, montar, correr, atacar, cair. */

export class Horse {
  constructor(owner, stage, fromOffscreen = true) {
    this.ownerId = owner.id;
    this.x = fromOffscreen ? owner.x - owner.facing * 460 : owner.x - owner.facing * 72;
    this.y = stage.ground.y;
    this.vx = fromOffscreen ? owner.facing * 14 : 0;
    this.vy = 0;
    this.facing = owner.facing;
    this.state = fromOffscreen ? "entering" : "idle";
    this.hp = 48;
    this.maxHp = 48;
    this.life = 60 * 16;
    this.stun = 0;
    this.dustTimer = 0;
    this.scale = 0.3;
  }

  owner(world) {
    return world.fighters.find((f) => f.id === this.ownerId);
  }

  update(world) {
    const o = this.owner(world);
    if (this.stun > 0) this.stun--;
    this.life--;
    this.dustTimer++;

    if (this.state === "entering") {
      this.x += this.vx;
      if (this.dustTimer % 3 === 0) {
        world.spawnFx?.("dust", this.x, this.y, this.facing);
        world.burst?.("horse", this.x, this.y - 8, this.facing);
      }
      const dest = o ? o.x - o.facing * 64 : this.x;
      if (Math.abs(this.x - dest) < 22) {
        this.vx = 0;
        this.state = "idle";
        if (o) this.x = dest;
      }
      return;
    }

    if (this.state === "mounted") {
      if (!o || !o.mounted) {
        this.state = "idle";
        return;
      }
      this.x = o.x;
      this.y = o.y;
      this.facing = o.facing;
      return;
    }

    if (this.state === "knocked") {
      this.vy += 0.55;
      this.x += this.vx;
      this.y += this.vy;
      if (this.y >= world.stage.ground.y) {
        this.y = world.stage.ground.y;
        this.vy = 0;
        this.vx *= 0.78;
        if (this.stun <= 0) this.state = "idle";
      }
      return;
    }

    if (!o || !o.alive || this.life <= 0 || this.hp <= 0) this.state = "leaving";

    if (this.state === "leaving") {
      this.facing = this.x < world.stage.width / 2 ? -1 : 1;
      this.vx = this.facing * 11;
      this.x += this.vx;
      return;
    }

    if (o && !o.mounted) {
      const dest = o.x - o.facing * 70;
      const dx = dest - this.x;
      if (Math.abs(dx) > 14) {
        this.facing = Math.sign(dx) || this.facing;
        this.vx = this.facing * 6.2;
        this.x += this.vx;
        this.state = "run";
        if (this.dustTimer % 7 === 0) world.spawnFx?.("dust", this.x, this.y, this.facing);
      } else {
        this.vx = 0;
        this.state = "idle";
        this.facing = o.facing;
      }
      this.y = world.stage.ground.y;
    }
  }

  hit(dmg, dir) {
    this.hp -= dmg;
    this.stun = 28;
    this.vx = dir * 7;
    this.vy = -7;
    this.state = "knocked";
  }

  gone(world) {
    return this.state === "leaving" && (this.x < -240 || this.x > world.stage.width + 240);
  }
}

export function findHorse(world, ownerId) {
  return (world.horses || []).find((h) => h.ownerId === ownerId && h.state !== "leaving");
}

export function summonHorse(owner, world, opts = {}) {
  world.horses = world.horses || [];
  const existing = findHorse(world, owner.id);
  if (existing) {
    existing.life = 60 * 16;
    existing.hp = existing.maxHp;
    if (existing.state === "knocked") {
      existing.state = "idle";
      existing.stun = 0;
    }
    return existing;
  }
  const offscreen = opts.offscreen !== false;
  const h = new Horse(owner, world.stage, offscreen);
  if (!offscreen) {
    h.x = owner.x;
    h.y = owner.y;
    h.state = "idle";
  }
  world.horses.push(h);
  world.spawnFx?.("dust", owner.x, owner.y, owner.facing);
  world.burst?.("horse", owner.x, owner.y, owner.facing);
  world.audio?.sfx("horse");
  world.announce?.("INVOCAR CAVALO!", 50);
  return h;
}

export function mountHorse(owner, world) {
  const h = findHorse(world, owner.id);
  if (!h || h.state === "knocked") return false;
  owner.mounted = true;
  h.state = "mounted";
  if (owner.grounded) owner.y = world.stage.ground.y;
  world.audio?.sfx("horse");
  world.spawnFx?.("dust", owner.x, owner.y, owner.facing);
  world.burst?.("horse", owner.x, owner.y, owner.facing);
  return true;
}

export function dismount(owner, world, knocked = false) {
  if (!owner.mounted) return;
  owner.mounted = false;
  const h = findHorse(world, owner.id);
  if (h) {
    h.x = owner.x - owner.facing * 48;
    h.y = world.stage.ground.y;
    if (knocked) h.hit(8, -owner.facing);
    else h.state = "idle";
  }
}

export function horseNearby(owner, world, dist = 110) {
  const h = findHorse(world, owner.id);
  if (!h) return null;
  if (h.state === "knocked") return null;
  if (Math.abs(h.x - owner.x) > dist) return null;
  return h;
}
