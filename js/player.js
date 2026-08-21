import { applyHit, hurtbox, worldHitbox, aabb } from "./combat.js";
import { collideStage, tryLedge } from "./stage.js";
import { mashEscape } from "./lasso.js";
import { summonHorse, mountHorse, dismount, findHorse } from "./horse.js";

let nextId = 1;

export class Fighter {
  constructor(char, port, x, y, facing) {
    this.id = nextId++;
    this.char = char;
    this.port = port;
    this.x = x;
    this.y = y;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.state = "idle";
    this.stateTime = 0;
    this.stateDur = 0;
    this.grounded = true;
    this.jumpsLeft = char.jumps;
    this.percent = 0;
    this.stocks = 3;
    this.hitlag = 0;
    this.intangible = 0;
    this.shieldHp = 60;
    this.animKey = "idle";
    this.animTime = 0;
    this.move = null;
    this.hitConnected = false;
    this.lastHitVictim = null;
    this.comboHits = 0;
    this.combo = 0;
    this.fastFall = false;
    this.dropThrough = 0;
    this.usedLedge = false;
    this.usedUpSpecial = false;
    this.alive = true;
    this.cpu = false;
    this.grabTarget = null;
    this.lassoLock = null;
    this.snareOwner = null;
    this.mounted = false;
    this.specialCharge = 0;
    this.introPose = false;
    this.shock = null;
    this.buf = { light: 0, strong: 0, special: 0, grab: 0, jump: 0 };
  }

  enter(state, dur = 0) {
    this.state = state;
    this.stateTime = 0;
    this.stateDur = dur;
    if (state === "hurt" || state === "launched") this.move = null;
  }

  startMove(key, world) {
    const mv = this.char.moves[key];
    if (!mv) return false;
    this.move = { ...mv, key, hitDone: false, hitIds: new Set() };
    this.hitConnected = false;
    this.specialCharge = 0;
    this.enter(mv.projectile ? "special" : "attack", mv.startup + mv.active + mv.recovery);
    if (mv.invuln) this.intangible = mv.invuln;
    if (mv.vy) {
      this.vy = mv.vy;
      this.grounded = false;
      if (key === "uspecial") this.usedUpSpecial = true;
    }
    if (mv.summonHorse) {
      summonHorse(this, world, { offscreen: this.grounded });
      if (!this.grounded) mountHorse(this, world);
    }
    if (mv.mountCharge) {
      if (!this.mounted) {
        if (!findHorse(world, this.id)) summonHorse(this, world, { offscreen: true });
        mountHorse(this, world);
      }
    }
    if (mv.callout) world.announce?.(mv.callout, 50);
    if (world.train) {
      world.train.lastMove = mv.callout || mv.name;
      world.train.recovery = mv.recovery;
    }
    world.audio.sfx(mv.sfx || (mv.projectile ? "special" : "whoosh"));
    return true;
  }

  canAct() {
    return ["idle", "walk", "run", "crouch", "fall", "jump"].includes(this.state);
  }

  buffer(input) {
    for (const k of ["light", "strong", "special", "grab", "jump"]) {
      if (input[k + "Pressed"]) this.buf[k] = 7;
      else if (this.buf[k] > 0) this.buf[k]--;
    }
  }

  consume(k) {
    if (this.buf[k] > 0) {
      this.buf[k] = 0;
      return true;
    }
    return false;
  }

  update(input, world) {
    if (!this.alive) return;
    if (this.hitlag > 0) {
      this.hitlag--;
      return;
    }
    this.prevY = this.y;
    if (this.intangible > 0) this.intangible--;
    if (this.dropThrough > 0) this.dropThrough--;
    if (this.lassoLock) {
      this.lassoLock.timer--;
      if (this.lassoLock.timer <= 0) this.lassoLock = null;
    }
    this.stateTime++;
    this.animTime++;
    this.buffer(input);
    this.tickShock(world);

    if (this.state === "knockedOut") {
      if (this.stateTime > 50) this.respawn(world);
      return;
    }
    if (this.state === "respawn") {
      this.intangible = 90;
      this.vy = 3.2;
      this.y += this.vy;
      if (this.y >= world.stage.ground.y - 80 || this.stateTime > 70) this.enter("idle");
      this.physics(world);
      return;
    }
    if (this.state === "win") return;

    if (this.state === "snared") {
      this.vx *= 0.4;
      this.vy += this.char.gravity * 0.35;
      const owner = world.fighters.find((f) => f.id === this.snareOwner);
      if (owner && owner.lassoLock?.targetId === this.id) {
        const dx = owner.x + owner.facing * 52 - this.x;
        this.x += dx * 0.08;
      }
      this.stateDur -= mashEscape(this, input);
      this.integrate();
      this.physics(world);
      if (this.stateTime >= this.stateDur) {
        this.snareOwner = null;
        this.enter(this.grounded ? "idle" : "fall");
      }
      this.checkKo(world);
      return;
    }

    if (this.state === "hold") {
      const t = world.fighters.find((f) => f.id === this.grabTarget);
      if (!t || !t.alive || this.stateTime > this.stateDur) {
        this.grabTarget = null;
        this.enter("idle");
        return;
      }
      t.x = this.x + this.facing * 44;
      t.y = this.y;
      t.vx = 0;
      t.vy = 0;
      if (this.consume("light") || this.consume("strong") || this.consume("grab")) {
        if (this.char.moves.pull) this.startMove("pull", world);
        else this.startMove("throw", world);
        this.grabTarget = null;
        return;
      }
      if (input.downPressed && this.char.moves.knockdown) {
        this.startMove("knockdown", world);
        this.grabTarget = null;
        return;
      }
      if (input.left || input.right) {
        this.facing = input.left ? -1 : 1;
        this.startMove("throw", world);
        this.grabTarget = null;
      }
      return;
    }

    if (this.state === "ledge") {
      if (input.jumpPressed || input.upPressed) {
        this.vy = -this.char.jump;
        this.jumpsLeft = this.char.jumps - 1;
        this.enter("jump");
      } else if (input.downPressed) {
        this.enter("fall");
      } else if (input.lightPressed) {
        this.y = world.stage.ground.y;
        this.enter("idle");
        this.startMove("jab", world);
      } else if (this.stateTime > 180) this.enter("fall");
      return;
    }

    if (this.state === "hurt") {
      this.vx *= 0.92;
      this.vy += this.char.gravity * 0.7;
      this.integrate();
      this.physics(world);
      if (this.stateTime >= this.stateDur) this.enter(this.grounded ? "idle" : "fall");
      this.checkKo(world);
      return;
    }

    if (this.state === "launched") {
      if (input.left) this.vx -= 0.14;
      if (input.right) this.vx += 0.14;
      this.vy += this.char.gravity * 0.82;
      this.integrate();
      this.physics(world);
      if (this.grounded && this.vy >= 0) {
        if (input.shieldPressed && this.stateTime < this.stateDur) {
          this.vx = 0;
          this.enter("idle");
          world.audio.sfx("shield");
        } else if (Math.abs(this.vx) > 8) {
          this.vy = -6;
          this.vx *= 0.55;
          this.grounded = false;
        } else this.enter("idle");
      }
      if (this.stateTime >= this.stateDur && this.grounded) this.enter("idle");
      this.checkKo(world);
      return;
    }

    if (this.state === "dodge") {
      this.intangible = this.stateTime < 14 ? 1 : 0;
      this.vx *= 0.8;
      this.integrate();
      this.physics(world);
      if (this.stateTime > 22) this.enter("idle");
      return;
    }

    if (this.state === "attack" || this.state === "special") {
      this.advanceAttack(input, world);
      return;
    }

    if (this.state === "shield") {
      this.vx *= 0.7;
      this.shieldHp = Math.max(0, this.shieldHp - 0.25);
      if (input.leftPressed || input.rightPressed) {
        this.vx = 8 * (input.left ? -1 : 1);
        this.enter("dodge", 22);
        this.intangible = 12;
        return;
      }
      if (!input.shield || this.shieldHp <= 0) this.enter("idle");
      this.integrate();
      this.physics(world);
      return;
    }

    this.control(input, world);
    this.integrate();
    this.physics(world);
    this.checkKo(world);
  }

  tickShock(world) {
    if (!this.shock) return;
    this.shock.wait--;
    if (this.shock.wait > 0) return;
    if (this.shock.hits <= 0) {
      this.shock = null;
      return;
    }
    const atk = world.fighters.find((f) => f.id === this.shock.attackerId);
    this.percent += this.shock.dmg;
    this.shock.hits--;
    this.shock.wait = this.shock.delay;
    world.burst?.(this.shock.fx || "thunder", this.x, this.y - 46, this.facing);
    world.audio.sfx("thunder");
    this.hitlag = 3;
    if (atk) atk.hitlag = 2;
    if (world.combo) {
      world.combo.count++;
      world.combo.timer = 90;
    }
    if (this.shock.hits <= 0) this.shock = null;
  }

  control(input, world) {
    const c = this.char;
    const left = input.left;
    const right = input.right;
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    const runCap = this.mounted ? c.runSpeed * 1.38 : c.runSpeed;
    const walkCap = this.mounted ? c.speed * 1.2 : c.speed;
    const jumpPow = this.mounted ? c.jump * 1.08 : c.jump;

    if (this.grounded) {
      if (input.down && this.mounted && this.canAct()) {
        dismount(this, world);
        this.enter("idle");
      } else if (input.down) {
        this.dropThrough = 12;
        if (this.canAct()) this.enter("crouch");
      }
      if (dir !== 0 && this.canAct()) {
        this.facing = dir;
        this.vx += dir * c.accel * (this.mounted ? 1.2 : 1);
        this.vx = Math.max(-runCap, Math.min(runCap, this.vx));
        this.enter(Math.abs(this.vx) > 5.2 ? "run" : "walk");
      } else {
        this.vx *= c.friction;
        if (this.canAct() && !input.down) this.enter("idle");
      }
      if (input.jumpPressed || this.consume("jump")) {
        this.buf.jump = 0;
        this.vy = -jumpPow;
        this.grounded = false;
        this.jumpsLeft = c.jumps - 1;
        this.enter("jump");
        world.audio.sfx("jump");
        world.spawnFx("dust", this.x, this.y, this.facing);
        world.burst?.("dust", this.x, this.y, this.facing);
      }
    } else {
      if (dir !== 0) {
        this.vx += dir * c.airAccel;
        const airCap = this.mounted ? c.airSpeed * 1.15 : c.airSpeed;
        this.vx = Math.max(-airCap, Math.min(airCap, this.vx));
        if (this.canAct()) this.facing = dir;
      }
      this.vy += c.gravity;
      if (input.down && this.vy > 0) {
        this.fastFall = true;
        this.dropThrough = 8;
      }
      if (this.fastFall) this.vy = Math.max(this.vy, c.fastFall * 0.7);
      this.vy = Math.min(this.vy, this.fastFall ? c.fastFall : c.maxFall);
      if ((input.jumpPressed || this.consume("jump")) && this.jumpsLeft > 0) {
        this.vy = -c.airJump;
        this.jumpsLeft--;
        this.fastFall = false;
        this.enter("jump");
        world.audio.sfx("jump");
      }
      if (this.canAct()) this.enter(this.vy < 0 ? "jump" : "fall");
    }

    if (!this.canAct()) return;

    if (this.lassoLock && this.char.moves.pull) {
      if (this.consume("strong") || this.consume("light") || this.consume("grab")) {
        this.startMove("pull", world);
        return;
      }
      if (input.down && this.consume("strong") && this.char.moves.explosive) {
        this.startMove("explosive", world);
        return;
      }
    }

    if (this.specialCharge) {
      this.specialCharge++;
      if (input.up) {
        this.startMove("uspecial", world);
        return;
      }
      if (input.down) {
        this.startMove("dspecial", world);
        return;
      }
      if (left || right) {
        this.startMove("sspecial", world);
        return;
      }
      if (this.specialCharge >= 12) {
        this.startMove(this.char.moves.spin ? "spin" : "nspecial", world);
        return;
      }
      if (!input.special) {
        this.startMove("nspecial", world);
        return;
      }
      return;
    }

    if (input.shield) {
      if (this.mounted) dismount(this, world);
      this.enter("shield");
      world.audio.sfx("shield");
      return;
    }
    if (this.consume("grab")) {
      if (this.tryGrab(world)) {
        this.enter("hold", 48);
        world.announce?.("AGARRÃO!", 36);
      } else this.startMove("throw", world);
      return;
    }

    const aerial = !this.grounded;
    if (this.consume("special") || input.specialPressed) {
      if (input.up && !this.usedUpSpecial) this.startMove("uspecial", world);
      else if (input.down) this.startMove("dspecial", world);
      else if (left || right) this.startMove("sspecial", world);
      else if (this.char.moves.spin) this.specialCharge = 1;
      else this.startMove("nspecial", world);
      return;
    }
    if (this.consume("strong") || input.strongPressed) {
      if (!aerial && input.down && this.char.moves.explosive) this.startMove("explosive", world);
      else this.startMove(aerial ? (input.down ? "dair" : input.up ? "uair" : "nair") : "strong", world);
      return;
    }
    if (this.consume("light") || input.lightPressed) {
      if (!aerial && input.down && this.char.moves.spin) this.startMove("spin", world);
      else this.startMove(aerial ? (input.down ? "dair" : input.up ? "uair" : "nair") : "jab", world);
    }
  }

  advanceAttack(input, world) {
    const mv = this.move;
    if (!mv) {
      this.enter(this.grounded ? "idle" : "fall");
      return;
    }
    const t = this.stateTime;
    if (mv.vx && t >= mv.startup && t < mv.startup + mv.active) {
      this.vx = mv.vx * this.facing;
      if (this.mounted && t % 4 === 0) world.burst?.("dust", this.x, this.y, this.facing);
    } else this.vx *= this.grounded ? 0.82 : 0.96;
    if (!this.grounded) this.vy += this.char.gravity * 0.85;
    this.integrate();
    this.physics(world);

    if (t === mv.startup && mv.projectile) {
      world.spawnProjectile(this, mv.projectile);
    }

    if (t >= mv.startup && t < mv.startup + mv.active && mv.hitbox) {
      const hb = worldHitbox(this, mv.hitbox);
      for (const other of world.fighters) {
        if (other.id === this.id || !other.alive) continue;
        if (mv.hitIds.has(other.id)) continue;
        if (aabb(hb, hurtbox(other))) {
          applyHit(this, other, mv, world);
          mv.hitDone = true;
          mv.hitIds.add(other.id);
          this.hitConnected = true;
        }
      }
    }

    if (mv.hitDone && mv.cancel && t > mv.startup + 2) {
      if (input.lightPressed && this.char.moves[mv.cancel]) {
        this.startMove(mv.cancel, world);
        return;
      }
      if (input.strongPressed && (mv.cancel === "strong" || mv.cancel === "pull" || mv.cancel === "explosive")) {
        this.startMove(mv.cancel, world);
        return;
      }
      if (input.specialPressed && mv.cancel === "nspecial") {
        this.startMove("nspecial", world);
        return;
      }
    }

    if (t >= mv.startup + mv.active + mv.recovery) {
      this.move = null;
      this.enter(this.grounded ? "idle" : "fall");
    }
    this.checkKo(world);
  }

  tryGrab(world) {
    const box = {
      x: this.facing === 1 ? this.x : this.x - 54,
      y: this.y - 72,
      w: 54,
      h: 44,
    };
    for (const o of world.fighters) {
      if (o.id === this.id || !o.alive) continue;
      if (aabb(box, hurtbox(o)) && o.state !== "launched" && o.state !== "knockedOut") {
        o.x = this.x + this.facing * 42;
        o.y = this.y;
        o.enter("snared", 40);
        o.snareOwner = this.id;
        this.grabTarget = o.id;
        this.lassoLock = { targetId: o.id, timer: 48, kind: "grab" };
        world.audio.sfx("snare");
        world.burst?.("snare", o.x, o.y - 40, this.facing);
        return true;
      }
    }
    return false;
  }

  physics(world) {
    collideStage(this, world.stage);
    tryLedge(this, world.stage);
    if (this.grounded && this.state === "jump" && this.vy >= 0) {
      this.enter("idle");
      world.audio.sfx("land");
      world.burst?.("dust", this.x, this.y, this.facing);
    }
  }

  integrate() {
    this.x += this.vx;
    this.y += this.vy;
  }

  checkKo(world) {
    const b = world.stage.blast;
    if (this.x < b.l || this.x > b.r || this.y > b.b || this.y < b.t) {
      this.stocks--;
      this.enter("knockedOut", 50);
      this.intangible = 999;
      this.mounted = false;
      this.lassoLock = null;
      world.audio.sfx("ko");
      world.shake = 16;
      world.spawnFx("explode", this.x, Math.min(this.y, b.b - 20), this.facing);
      world.burst?.("explode", this.x, Math.min(this.y, b.b - 20), this.facing);
      if (this.stocks <= 0) {
        this.alive = false;
        world.onKo?.(this);
      }
    }
  }

  respawn(world) {
    if (this.stocks <= 0) {
      this.alive = false;
      return;
    }
    const s = world.stage.spawn[this.port === "p1" ? 0 : 1];
    this.x = s.x;
    this.y = 80;
    this.vx = 0;
    this.vy = 0;
    this.percent = 0;
    this.combo = 0;
    this.shieldHp = 60;
    this.usedUpSpecial = false;
    this.mounted = false;
    this.lassoLock = null;
    this.shock = null;
    this.enter("respawn", 70);
    this.intangible = 90;
  }

  currentSprite() {
    const a = this.char.anim;
    if (this.introPose && a.point) return a.point[0];
    if (this.mounted && a.mount) return a.mount[0];
    if (this.state === "win") return a.win[0];
    if (this.state === "knockedOut") return a.down[0];
    if (this.state === "hurt" || this.state === "launched" || this.state === "snared") return a.hurt[0];
    if (this.state === "hold") return (a.throw || a.punch)[0];
    if (this.state === "shield" || this.state === "crouch") return a.crouch[0];
    if (this.state === "dodge") return a.jump[0];
    if (this.state === "ledge") return a.jump[0];
    if (this.move) {
      const key = this.move.sprite || "punch";
      return (a[key] || a.punch)[0];
    }
    if (this.state === "jump" || this.state === "fall" || this.state === "respawn") return a.jump[0];
    if (this.state === "run") return a.run[0];
    if (this.state === "walk") {
      const frames = a.walk;
      return frames[Math.floor(this.animTime / 8) % frames.length];
    }
    const frames = a.idle;
    return frames[Math.floor(this.animTime / 22) % frames.length];
  }
}
