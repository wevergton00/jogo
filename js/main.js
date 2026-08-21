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

// Botão de tela cheia (canto inferior direito)
const fsBtn = document.getElementById("btn-fullscreen");
const fsLabel = document.getElementById("fs-label");
const fsToast = document.getElementById("fs-toast");
let fsToastTimer = null;

function fsElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  );
}
function showFsToast(msg) {
  if (!fsToast) return;
  fsToast.textContent = msg;
  fsToast.classList.add("show");
  clearTimeout(fsToastTimer);
  fsToastTimer = setTimeout(() => fsToast.classList.remove("show"), 3500);
}
function updateFsLabel() {
  if (fsLabel) fsLabel.textContent = fsElement() ? "Sair da tela cheia" : "Tela cheia";
}
async function enterFullscreen() {
  const el = document.documentElement;
  const req =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;
  if (!req) throw new Error("API de tela cheia indisponível");
  const r = req.call(el, { navigationUI: "hide" });
  if (r && r.then) await r;
}
async function exitFullscreen() {
  const ex =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen;
  if (ex) {
    const r = ex.call(document);
    if (r && r.then) await r;
  }
}
function fullscreenAllowed() {
  if (document.fullscreenEnabled === false) return false;
  if (document.fullscreenEnabled === undefined && document.webkitFullscreenEnabled === false) return false;
  return true;
}
async function toggleFullscreen() {
  audio.unlock();
  if (fsElement()) {
    try {
      await exitFullscreen();
    } catch {}
    updateFsLabel();
    return;
  }
  // Dentro de iframe (prévia) o navegador costuma bloquear: abre o jogo em aba própria
  if (!fullscreenAllowed()) {
    showFsToast("Tela cheia bloqueada aqui — abrindo o jogo em uma aba própria…");
    window.open(window.location.href, "_blank", "noopener");
    return;
  }
  try {
    await enterFullscreen();
  } catch (err) {
    console.warn("Tela cheia bloqueada:", err);
    showFsToast("Tela cheia bloqueada aqui — abrindo o jogo em uma aba própria…");
    window.open(window.location.href, "_blank", "noopener");
  }
  updateFsLabel();
}
if (fsBtn) {
  fsBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
  fsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFullscreen();
  });
  ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"].forEach((ev) =>
    document.addEventListener(ev, updateFsLabel)
  );
  updateFsLabel();
}

requestAnimationFrame((t) => game.tick(t));

window.addEventListener("pointerdown", () => {
  audio.unlock();
  canvas.focus();
});
window.addEventListener("keydown", () => audio.unlock(), { once: true });
canvas.focus();
