const DIFFICULTY = {
  easy: { reaction: 22, aggro: 0.35, shield: 0.08, jump: 0.04 },
  normal: { reaction: 12, aggro: 0.55, shield: 0.16, jump: 0.07 },
  hard: { reaction: 6, aggro: 0.72, shield: 0.28, jump: 0.1 },
  expert: { reaction: 3, aggro: 0.88, shield: 0.4, jump: 0.14 },
};

export function makeCpuInput(self, foe, world, level = "normal") {
  const d = DIFFICULTY[level] || DIFFICULTY.normal;
  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    light: false,
    special: false,
    strong: false,
    shield: false,
    grab: false,
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
    jumpPressed: false,
  };

  if (!foe || !foe.alive) return input;
  self._aiWait = (self._aiWait || 0) + 1;
  if (self._aiWait < d.reaction && Math.random() > 0.2) return input;

  const dx = foe.x - self.x;
  const dist = Math.abs(dx);
  const offstage =
    self.x < world.stage.ground.x + 40 || self.x > world.stage.ground.x + world.stage.ground.w - 40;

  if (offstage || self.y > world.stage.ground.y + 30) {
    const mid = world.stage.ground.x + world.stage.ground.w / 2;
    if (self.x < mid) press(input, "right");
    else press(input, "left");
    if (self.y > world.stage.ground.y && !self.usedUpSpecial) press(input, "special"), press(input, "up");
    else press(input, "jump");
    return input;
  }

  if (dx < -24) press(input, "left");
  else if (dx > 24) press(input, "right");

  if (foe.state === "attack" && Math.random() < d.shield) press(input, "shield");

  if (dist > 280 && Math.random() < d.aggro * 0.4) {
    press(input, "special");
    return input;
  }

  if (dist < 70 && Math.random() < d.aggro) {
    if (Math.random() < 0.2) press(input, "grab");
    else if (Math.random() < 0.35) press(input, "strong");
    else press(input, "light");
  } else if (dist < 140 && Math.random() < d.aggro * 0.5) {
    press(input, "special");
    if (dx !== 0) press(input, dx > 0 ? "right" : "left");
  }

  if (!self.grounded && Math.random() < 0.2) press(input, "light");
  if (Math.random() < d.jump && self.grounded) press(input, "jump");
  return input;
}

function press(input, name) {
  input[name] = true;
  input[name + "Pressed"] = true;
  if (name === "jump") {
    input.up = true;
    input.upPressed = true;
  }
}
