import { SpriteBank } from "./sprites.js?v=37";
import { AudioSystem } from "./audio.js?v=37";
import { InputManager } from "./input.js?v=37";
import { Game } from "./game.js?v=37";

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
  if (loadLabel) loadLabel.textContent = "Iniciando o rodeio de Barretos…";
}

hideLoad();
const game = new Game(canvas, sprites, audio, input);
window.gameInstance = game;

// Inicia no modo título
game.setMode("title");

// Fullscreen e Janela Cheia
const fsBtn = document.getElementById("btn-fullscreen");
const fsIcon = document.getElementById("fs-icon");
const fsLabel = document.getElementById("fs-label");
const fsToast = document.getElementById("fs-toast");

function showToast(msg) {
  if (!fsToast) return;
  fsToast.textContent = msg;
  fsToast.classList.add("show");
  setTimeout(() => fsToast.classList.remove("show"), 2200);
}

function isFullscreenActive() {
  return (
    document.body.classList.contains("fullscreen-mode") ||
    !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    )
  );
}

function updateFullscreenUI(active) {
  if (fsIcon) fsIcon.textContent = active ? "🗗" : "⛶";
  if (fsLabel) fsLabel.textContent = active ? "Janela" : "Tela cheia";
}

async function toggleFullscreen() {
  audio.unlock();
  const currentlyFs = isFullscreenActive();

  if (!currentlyFs) {
    document.body.classList.add("fullscreen-mode");
    updateFullscreenUI(true);

    try {
      const el = document.documentElement;
      const request =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen;

      if (request) {
        await request.call(el).catch(() => {});
      }
    } catch {}

    showToast("Tela cheia ativada!");
  } else {
    document.body.classList.remove("fullscreen-mode");
    updateFullscreenUI(false);

    try {
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
        const exit =
          document.exitFullscreen ||
          document.webkitExitFullscreen ||
          document.mozCancelFullScreen ||
          document.msExitFullscreen;

        if (exit) {
          await exit.call(document).catch(() => {});
        }
      }
    } catch {}

    showToast("Modo janela restaurado.");
  }
}

if (fsBtn) {
  fsBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFullscreen();
  };
}

document.addEventListener("fullscreenchange", () => {
  const active = !!document.fullscreenElement;
  if (!active) {
    document.body.classList.remove("fullscreen-mode");
  }
  updateFullscreenUI(active || document.body.classList.contains("fullscreen-mode"));
});

document.addEventListener("webkitfullscreenchange", () => {
  const active = !!document.webkitFullscreenElement;
  if (!active) {
    document.body.classList.remove("fullscreen-mode");
  }
  updateFullscreenUI(active || document.body.classList.contains("fullscreen-mode"));
});

window.addEventListener("keydown", (e) => {
  if (e.key === "f" || e.key === "F") {
    if (document.activeElement?.tagName !== "INPUT") {
      e.preventDefault();
      toggleFullscreen();
    }
  }
});

// Inicia loop principal
requestAnimationFrame((t) => game.tick(t));
