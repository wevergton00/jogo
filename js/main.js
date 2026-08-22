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
  if (loadLabel) loadLabel.textContent = "Iniciando o rodeio…";
}

hideLoad();
const game = new Game(canvas, sprites, audio, input);
window.gameInstance = game;

// Inicia no modo título
game.setMode("title");

// Fullscreen
const fsBtn = document.getElementById("btn-fullscreen");
const fsToast = document.getElementById("fs-toast");

function showToast(msg) {
  if (!fsToast) return;
  fsToast.textContent = msg;
  fsToast.classList.add("show");
  setTimeout(() => fsToast.classList.remove("show"), 2200);
}

if (fsBtn) {
  fsBtn.onclick = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        showToast("Tela cheia não suportada neste navegador.");
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };
}

// Inicia loop
requestAnimationFrame((t) => game.tick(t));
