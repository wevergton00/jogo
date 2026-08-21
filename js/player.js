import { applyHit, hurtbox, worldHitbox } from "./combat.js";
import { collideStage, tryLedge } from "./stage.js";

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
  }

  enter(state, dur = 0) {
    this.state = state;
    this.stateTime = 0;
    this.stateDur = dur;
    if (state === "hurt" || state === "launched") this.move = null;
  }

  startMove(key, world) {
    const mv = this.char.moves[key];
    if (!mv) return;
    this.move = { ...mv, key, hitDone: false };
    this.hitConnected = false;
    this.enter(mv.projectile ? "special" : "attack", mv.startup + mv.active + mv.recovery);
    if (mv.invuln) this.intangible = mv.invuln;
    if (mv.vy) {
      this.vy = mv.vy;
      this.grounded = false;
      if (key === "uspecial") this.usedUpSpecial = true;
    }
    world.audio.sfx(mv.projectile ? "special" : "whoosh");
  }

  canAct() {
    return ["idle", "walk", "run", "crouch", "fall", "jump"].includes(this.state);
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
    this.stateTime++;
    this.animTime++;

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
      if (input.left) this.vx -= 0.12;
      if (input.right) this.vx += 0.12;
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

  control(input, world) {
    const c = this.char;
    const left = input.left;
    const right = input.right;
    const dir = (right ? 1 : 0) - (left ? 1 : 0);

    if (this.grounded) {
      if (input.down) {
        this.dropThrough = 12;
        if (this.canAct()) this.enter("crouch");
      }
      if (dir !== 0 && this.canAct()) {
        this.facing = dir;
        const running = Math.abs(this.vx) > c.speed * 0.85;
        this.vx += dir * c.accel;
        const cap = running || input.right && input.left ? c.runSpeed : Math.abs(this.vx) > 3.2 ? c.runSpeed : c.speed;
        this.vx = Math.max(-c.runSpeed, Math.min(c.runSpeed, this.vx));
        this.enter(Math.abs(this.vx) > 5.2 ? "run" : "walk");
      } else {
        this.vx *= c.friction;
        if (this.canAct() && !input.down) this.enter("idle");
      }
      if (input.jumpPressed) {
        this.vy = -c.jump;
        this.grounded = false;
        this.jumpsLeft = c.jumps - 1;
        this.enter("jump");
        world.audio.sfx("jump");
        world.spawnFx("dust", this.x, this.y, this.facing);
      }
    } else {
      if (dir !== 0) {
        this.vx += dir * c.airAccel;
        this.vx = Math.max(-c.airSpeed, Math.min(c.airSpeed, this.vx));
        if (this.canAct()) this.facing = dir;
      }
      this.vy += c.gravity;
      if (input.down && this.vy > 0) {
        this.fastFall = true;
        this.dropThrough = 8;
      }
      if (this.fastFall) this.vy = Math.max(this.vy, c.fastFall * 0.7);
      this.vy = Math.min(this.vy, this.fastFall ? c.fastFall : c.maxFall);
      if (input.jumpPressed && this.jumpsLeft > 0) {
        this.vy = -c.airJump;
        this.jumpsLeft--;
        this.fastFall = false;
        this.enter("jump");
        world.audio.sfx("jump");
      }
      if (this.canAct()) this.enter(this.vy < 0 ? "jump" : "fall");
    }

    if (!this.canAct()) return;

    if (input.shield) {
      this.enter("shield");
      world.audio.sfx("shield");
      return;
    }
    if (input.grabPressed) {
      this.startMove("throw", world);
      this.tryGrab(world);
      return;
    }

    const aerial = !this.grounded;
    if (input.specialPressed) {
      if (input.up && !this.usedUpSpecial) this.startMove("uspecial", world);
      else if (input.down) this.startMove("dspecial", world);
      else if (left || right) this.startMove("sspecial", world);
      else this.startMove("nspecial", world);
      return;
    }
    if (input.strongPressed) {
      this.startMove(aerial ? (input.down ? "dair" : input.up ? "uair" : "nair") : "strong", world);
      return;
    }
    if (input.lightPressed) {
      this.startMove(aerial ? (input.down ? "dair" : input.up ? "uair" : "nair") : "jab", world);
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
    } else this.vx *= this.grounded ? 0.82 : 0.96;
    if (!this.grounded) this.vy += this.char.gravity * 0.85;
    this.integrate();
    this.physics(world);

    if (t === mv.startup && mv.projectile) {
      world.spawnProjectile(this, mv.projectile);
    }

    if (t >= mv.startup && t < mv.startup + mv.active && mv.hitbox && !mv.hitDone) {
      const hb = worldHitbox(this, mv.hitbox);
      for (const other of world.fighters) {
        if (other.id === this.id || !other.alive) continue;
        if (aabbOverlap(hb, hurtbox(other))) {
          applyHit(this, other, mv, world);
          mv.hitDone = true;
        }
      }
    }

    if (mv.hitDone && mv.cancel && input.lightPressed && t > mv.startup + 2) {
      this.startMove(mv.cancel, world);
      return;
    }

    if (t >= mv.startup + mv.active + mv.recovery) {
      this.move = null;
      this.enter(this.grounded ? "idle" : "fall");
    }
    this.checkKo(world);
  }

  tryGrab(world) {
    const box = {
      x: this.facing === 1 ? this.x : this.x - 50,
      y: this.y - 70,
      w: 50,
      h: 40,
    };
    for (const o of world.fighters) {
      if (o.id === this.id) continue;
      const h = hurtbox(o);
      if (aabbOverlap(box, h) && o.state !== "launched") {
        o.x = this.x + this.facing * 42;
        o.y = this.y;
        o.enter("hurt", 20);
        applyHit(this, o, this.char.moves.throw, world);
      }
    }
  }

  physics(world) {
    collideStage(this, world.stage);
    tryLedge(this, world.stage);
    if (this.grounded && this.state === "jump" && this.vy >= 0) {
      this.enter("idle");
      world.audio.sfx("land");
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
      world.audio.sfx("ko");
      world.shake = 16;
      world.spawnFx("explode", this.x, Math.min(this.y, b.b - 20), this.facing);
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
    this.enter("respawn", 70);
    this.intangible = 90;
  }

  currentSprite() {
    const a = this.char.anim;
    if (this.state === "win") return a.win[0];
    if (this.state === "knockedOut") return a.down[0];
    if (this.state === "hurt" || this.state === "launched") return a.hurt[0];
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

function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
