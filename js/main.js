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
    // Ativa modo tela cheia
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
    } catch {
      // Fallback para modo janela cheia via CSS
    }

    showToast("Tela cheia ativada!");
  } else {
    // Desativa modo tela cheia
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

// Sincroniza se sair por ESC do navegador
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

// Tecla de atalho F para alternar tela cheia
window.addEventListener("keydown", (e) => {
  if (e.key === "f" || e.key === "F") {
    // Se não estiver em campo de texto
    if (document.activeElement?.tagName !== "INPUT") {
      e.preventDefault();
      toggleFullscreen();
    }
  }
});

// Inicia loop
requestAnimationFrame((t) => game.tick(t));
