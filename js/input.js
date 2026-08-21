const ACTIONS = ["left", "right", "up", "down", "light", "special", "strong", "shield", "grab"];

export const DEFAULT_BINDS = {
  p1: {
    left: "KeyA",
    right: "KeyD",
    up: "KeyW",
    down: "KeyS",
    light: "KeyJ",
    strong: "KeyK",
    special: "KeyL",
    shield: "KeyI",
    grab: "KeyU",
  },
  p2: {
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    down: "ArrowDown",
    light: "Digit1",
    strong: "Digit2",
    special: "Digit3",
    shield: "Digit4",
    grab: "Digit0",
  },
};

const PAD_MAP = {
  left: "left",
  right: "right",
  up: "up",
  down: "down",
  light: 2,
  special: 1,
  strong: 3,
  shield: 6,
  grab: 5,
  jump: 0,
};

function emptyState() {
  const s = {};
  for (const a of ACTIONS) {
    s[a] = false;
    s[a + "Pressed"] = false;
    s[a + "Released"] = false;
    s[a + "Hold"] = 0;
  }
  s.jump = false;
  s.jumpPressed = false;
  return s;
}

const STORE_KEY = "aurora-binds-v2";

export class InputManager {
  constructor() {
    this.binds = structuredClone(DEFAULT_BINDS);
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) this.binds = { ...DEFAULT_BINDS, ...JSON.parse(saved) };
    } catch {}
    this.keys = new Set();
    this.prev = new Set();
    this.pressedThisFrame = new Set();
    this.p1 = emptyState();
    this.p2 = emptyState();
    this.anyPressed = false;
    this.waiting = null;
    this.menuUp = false;
    this.menuDown = false;
    this.menuOk = false;
    this.menuBack = false;
    this.pausePressed = false;
    this.virtual = new Set();
    this.enterPressed = false;

    window.addEventListener("keydown", (e) => {
      if (e.code === "Enter" && e.altKey) {
        e.preventDefault();
        return;
      }
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
      if (this.waiting) {
        e.preventDefault();
        const { port, action } = this.waiting;
        this.binds[port][action] = e.code;
        this.save();
        this.waiting = null;
        return;
      }
      this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());
  }

  save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(this.binds));
  }

  remap(port, action) {
    this.waiting = { port, action };
  }

  poll() {
    this.pressedThisFrame = new Set([...this.keys].filter((k) => !this.prev.has(k)));
    this.anyPressed = this.pressedThisFrame.size > 0 || this.virtual.size > 0;
    this.menuUp = this.just("ArrowUp") || this.just("KeyW");
    this.menuDown = this.just("ArrowDown") || this.just("KeyS");
    this.menuLeft = this.just("ArrowLeft") || this.just("KeyA");
    this.menuRight = this.just("ArrowRight") || this.just("KeyD");
    this.menuOk = this.just("Enter") || this.just("Space");
    this.menuBack = this.just("Escape") || this.just("Backspace");
    this.pausePressed = this.just("Escape") || this.just("KeyP");
    this.enterPressed = this.just("Enter");

    this.fillPort("p1", this.p1, 0);
    this.fillPort("p2", this.p2, 1);

    this.prev = new Set(this.keys);
  }

  consume() {
    this.enterPressed = false;
    this.menuOk = false;
    this.menuUp = false;
    this.menuDown = false;
    this.menuLeft = false;
    this.menuRight = false;
    this.menuBack = false;
    this.pausePressed = false;
    this.anyPressed = false;
  }

  just(code) {
    return this.pressedThisFrame.has(code);
  }

  fillPort(port, state, padIndex) {
    const binds = this.binds[port];
    const pad = navigator.getGamepads ? navigator.getGamepads()[padIndex] : null;
    for (const a of ACTIONS) {
      const down =
        this.keys.has(binds[a]) || this.padDown(pad, a) || (port === "p1" && this.virtual.has(a));
      state[a + "Pressed"] = down && !state[a];
      state[a + "Released"] = !down && state[a];
      state[a] = down;
      state[a + "Hold"] = down ? (state[a + "Hold"] || 0) + 1 : 0;
    }
    state.jump = state.up;
    state.jumpPressed = state.upPressed;
  }

  padDown(pad, action) {
    if (!pad) return false;
    const ax = pad.axes[0] || 0;
    const ay = pad.axes[1] || 0;
    if (action === "left") return ax < -0.45 || pad.buttons[14]?.pressed;
    if (action === "right") return ax > 0.45 || pad.buttons[15]?.pressed;
    if (action === "up") return ay < -0.45 || pad.buttons[12]?.pressed || pad.buttons[0]?.pressed;
    if (action === "down") return ay > 0.45 || pad.buttons[13]?.pressed;
    const btn = PAD_MAP[action];
    if (typeof btn === "number") return !!pad.buttons[btn]?.pressed;
    return false;
  }
}

export { ACTIONS };
