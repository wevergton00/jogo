const DIFFICULTY = {
  easy: { reaction: 24, aggro: 0.35, shield: 0.08, jump: 0.04, duelMash: 0.4, superFreq: 0.4 },
  normal: { reaction: 12, aggro: 0.6, shield: 0.2, jump: 0.08, duelMash: 0.65, superFreq: 0.7 },
  hard: { reaction: 6, aggro: 0.78, shield: 0.32, jump: 0.12, duelMash: 0.85, superFreq: 0.9 },
  expert: { reaction: 2, aggro: 0.92, shield: 0.45, jump: 0.16, duelMash: 0.95, superFreq: 0.98 },
};

export function emptyInput() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    light: false,
    special: false,
    strong: false,
    shield: false,
    grab: false,
    assist: false,
    super: false,
    jump: false,
    leftPressed: false,
    rightPressed: false,
    upPressed: false,
    downPressed: false,
    lightPressed: false,
    specialPressed: false,
    strongPressed: false,
    shieldPressed: false,
    grabPressed: false,
    assistPressed: false,
    superPressed: false,
    jumpPressed: false,
  };
}

function press(input, key) {
  input[key] = true;
  input[key + "Pressed"] = true;
}

export function makeCpuInput(self, foe, world, level = "normal", opts = {}) {
  const input = emptyInput();
  if (!foe || !foe.alive) return input;

  // Modo Duelo de Laço
  if (world.lassoDuel && world.lassoDuel.active) {
    const d = DIFFICULTY[level] || DIFFICULTY.normal;
    if (Math.random() < d.duelMash) {
      press(input, "light");
    }
    return input;
  }

  // Modo Treinamento (Dummy)
  if (opts.dummy) {
    if (opts.dummyMode === "jump") {
      if (self.grounded && Math.random() < 0.1) press(input, "jump");
    } else if (opts.dummyMode === "shield") {
      input.shield = true;
    }
    const offstage =
      self.x < world.stage.ground.x + 40 || self.x > world.stage.ground.x + world.stage.ground.w - 40;
    if (offstage || self.y > world.stage.ground.y + 40) {
      const mid = world.stage.ground.x + world.stage.ground.w / 2;
      press(input, self.x < mid ? "right" : "left");
      press(input, "jump");
    }
    return input;
  }

  const d = DIFFICULTY[level] || DIFFICULTY.normal;
  self._aiWait = (self._aiWait || 0) + 1;
  if (self._aiWait < d.reaction && Math.random() > 0.25) return input;
  self._aiWait = 0;

  const dx = foe.x - self.x;
  const dy = foe.y - self.y;
  const dist = Math.hypot(dx, dy);
  const dir = Math.sign(dx);

  // Recuperação quando fora do palco
  const offstage =
    self.x < world.stage.ground.x - 20 ||
    self.x > world.stage.ground.x + world.stage.ground.w + 20 ||
    self.y > world.stage.ground.y + 20;

  if (offstage) {
    const mid = world.stage.ground.x + world.stage.ground.w / 2;
    press(input, self.x < mid ? "right" : "left");
    if (self.y > world.stage.ground.y - 40) {
      if (self.jumpsLeft > 0) press(input, "jump");
      else if (!self.usedUpSpecial) {
        press(input, "up");
        press(input, "special");
      }
    }
    return input;
  }

  // Super Golpe da Aurora quando barra cheia
  if (self.specialMeter >= 100 && dist < 220 && Math.random() < d.superFreq) {
    press(input, "super");
    press(input, "strong");
    press(input, "special");
    return input;
  }

  // Invocação da Assistência do Cavalo em média distância
  if (self.assistCooldown === 0 && dist > 140 && dist < 480 && Math.random() < 0.4) {
    press(input, "assist");
    press(input, "down");
    press(input, "special");
    return input;
  }

  // Defesa / Esquiva se oponente atacar próximo
  if (foe.state === "attack" && dist < 90 && Math.random() < d.shield) {
    input.shield = true;
    if (Math.random() < 0.3) {
      press(input, dir > 0 ? "left" : "right");
    }
    return input;
  }

  // Movimento em direção ao oponente
  if (dist > 110) {
    press(input, dir > 0 ? "right" : "left");
    if (Math.random() < d.jump && self.grounded) press(input, "jump");
  } else if (dist < 40 && Math.random() < 0.3) {
    press(input, dir > 0 ? "left" : "right");
  }

  // Combate e seleção de golpes
  if (dist < 80) {
    const r = Math.random();
    if (r < 0.4) {
      press(input, "light");
    } else if (r < 0.7) {
      press(input, "strong");
    } else if (r < 0.88) {
      press(input, "grab");
    } else {
      press(input, "special");
    }
  } else if (dist < 260) {
    // Distância de Laço / Projéteis
    const r = Math.random();
    if (r < 0.4) {
      press(input, "special"); // Laço Mágico ou Projétil
    } else if (r < 0.7) {
      press(input, dir > 0 ? "right" : "left");
      press(input, "special"); // Laço do Trovão
    } else if (r < 0.9) {
      press(input, "strong"); // Tiro de Laço
    }
  }

  return input;
}
