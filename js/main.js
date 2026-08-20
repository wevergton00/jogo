import { SpriteBank } from "./sprites.js";
import { AudioSystem } from "./audio.js";
import { InputManager } from "./input.js";
import { Game } from "./game.js";

const canvas = document.getElementById("game");
const fill = document.getElementById("load-fill");

const sprites = new SpriteBank();
const audio = new AudioSystem();
const input = new InputManager();

try {
  await sprites.load((p) => {
    fill.style.width = `${Math.floor(p * 100)}%`;
  });
} catch (err) {
  console.error(err);
  document.querySelector(".load-bar-label").textContent = "Falha ao carregar assets";
}

document.getElementById("screen-load").classList.add("hidden");
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

game.setMode("menu");
requestAnimationFrame((t) => game.tick(t));

window.addEventListener("pointerdown", () => {
  audio.unlock();
  canvas.focus();
});
window.addEventListener("keydown", () => audio.unlock(), { once: true });
canvas.focus();
