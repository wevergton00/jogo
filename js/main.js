import { SpriteBank } from "./sprites.js";
import { AudioSystem } from "./audio.js";
import { InputManager } from "./input.js";
import { Game } from "./game.js";

const canvas = document.getElementById("game");
const fill = document.getElementById("load-fill");
const loadLabel = document.querySelector(".load-bar-label");

const sprites = new SpriteBank();
const audio = new AudioSystem();
const input = new InputManager();

function hideLoad() {
  const load = document.getElementById("screen-load");
  if (load) {
    load.classList.add("hidden");
    load.style.display = "none";
  }
}

try {
  await sprites.load((p) => {
    if (fill) fill.style.width = `${Math.floor(p * 100)}%`;
  });
} catch (err) {
  console.error(err);
  if (loadLabel) loadLabel.textContent = "Alguns assets falharam — iniciando mesmo assim";
}

hideLoad();
const game = new Game(canvas, sprites, audio, input);

const pads = document.getElementById("pads");
const hold = (act, down) => {
  if (down) input.virtual.add(act);
  else input.virtual.delete(act);
};
pads.querySelectorAll("button").forEach((btn) => {
  const act = btn.dataset.act;
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    btn.setPointerCapture(e.pointerId);
    audio.unlock();
    hold(act, true);
  });
  btn.addEventListener("pointerup", () => hold(act, false));
  btn.addEventListener("pointercancel", () => hold(act, false));
  btn.addEventListener("lostpointercapture", () => hold(act, false));
});

document.getElementById("screen-title").addEventListener("pointerdown", () => {
  audio.unlock();
  game.setMode("menu");
});

game.p1Pick = 0;
game.p2Pick = 1;
game.setMode("menu");

document.querySelectorAll("[data-hub]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    audio.unlock();
    game.launch(btn.getAttribute("data-hub"));
  });
});
const optBack = document.getElementById("opt-back");
if (optBack) {
  optBack.addEventListener("click", () => {
    audio.unlock();
    game.setMode("menu");
  });
}

requestAnimationFrame((t) => game.tick(t));

window.addEventListener("pointerdown", () => {
  audio.unlock();
  canvas.focus();
});
window.addEventListener("keydown", () => audio.unlock(), { once: true });
canvas.focus();
