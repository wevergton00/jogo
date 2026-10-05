# Revisão técnica — Barretos Clash: A Lenda do Laço

Data: 2026-10-05 · Branch: `arena/01a10c0e-jogo` · Base: `4481e3d`

## Visão geral

Projeto web puro (Canvas 2D + ES modules, sem build/bundler) empacotado para mobile via Capacitor.
~5.700 linhas de JS em 10 módulos + `index.html` (490 linhas) e 2 CSS.

**Pontos fortes:** arquitetura bem separada (input / combat / player / stage / ai / audio / sprites / game),
loop com passo fixo de 60 Hz e acumulador, carregamento de sprites tolerante a falha (timeout + fail-safe de boot),
suporte a teclado, gamepad e toque, 6 personagens com movesets completos, 6 cenários, modos Versus/História/Arcade/
8 Segundos/Tiro de Laço/Treino/Armário/Opções. Para um jogo feito sem framework, a base é sólida e roda.

---

## 🔴 Prioridade alta

### 1. `player.js` carrega uma **segunda cópia** de `combat.js` e `stage.js`
Todos os módulos usam cache-busting `?v=44`, menos `player.js`:

```js
// js/player.js:1-2
import { applyHit, hurtbox, worldHitbox } from "./combat.js";   // sem ?v=44
import { collideStage, containInArena } from "./stage.js";      // sem ?v=44
```

Para o browser, `./combat.js` e `./combat.js?v=44` são **dois módulos distintos**: ambos são baixados,
parseados e instanciados. Hoje não quebra (esses módulos são stateless), mas:
- duplica download/parse de `stage.js` (578 linhas) em todo boot;
- se um dia `stage.js` ganhar estado de módulo (cache de gradientes, contador), vira bug de estado dividido impossível de achar;
- invalida o cache-busting: com `v=45` o jogador pode ficar com `combat.js` antigo em cache.

**Correção:** 1 linha cada, adicionar `?v=44`.

### 2. Versionamento de cache manual e já inconsistente
`index.html` carrega `js/main.js?v=45` e `css/style.css?v=44`; os imports internos estão todos em `v=44`.
Ou seja, subir uma correção em `game.js` **não** invalida o cache dos usuários — é preciso lembrar de
trocar a query em 10 lugares. É a classe de bug que gera "no meu PC funciona".
**Sugestão:** um único `js/version.js` exportando a versão, ou um passo no `scripts/build-web.mjs` que
reescreve as queries automaticamente no build.

### 3. `npm run check` está quebrado
`verify-web.mjs` falha com `ENOENT: www/index.html` porque `check` não roda `build:web` antes.
Como está, o comando de verificação do projeto **sempre** retorna erro em clone limpo.
**Correção:** `"check": "npm run check:js && npm run check:config && npm run build:web && node scripts/verify-web.mjs"`.

### 4. `check:js` não cobre `stage.js`
O script lista 9 arquivos e esquece justamente `js/stage.js` (578 linhas, física de colisão).
Um erro de sintaxe lá passa pelo CI local.

---

## 🟠 Prioridade média

### 5. Peso do repositório: 32,6 MB de pack
- `assets/raw/` (23 MB) — PNGs-fonte das spritesheets, versionados junto do jogo.
- `ChatGPT Image 18 de set. de 2026, 22_31_46.png` (2 MB) na raiz, sem uso no código.
- `tools/__pycache__/` versionado.

Nada disso é servido ao jogador, mas tudo é baixado em todo `git clone` e entra no app Capacitor se o
`build:web` não filtrar. **Sugestão:** `.gitignore` para `__pycache__/`, remover o PNG órfão, e mover
`assets/raw/` para Git LFS ou um repositório/branch de fontes.

### 6. IA (`ai.js`) é puramente aleatória
Toda decisão é `Math.random() < p`. Não há memória de estado, leitura de distância ao longo do tempo,
punição de whiff nem anti-spam. Resultado prático: no `expert` (`reaction: 2`) a CPU só fica mais
rápida, não mais inteligente — o jogador aprende a explorar o mesmo padrão em qualquer dificuldade.
**Sugestão barata:** uma mini máquina de estados (aproximar / pressionar / recuar / punir) com
cooldown por ação, mantendo o `random` apenas como ruído.

### 7. Sem persistência de progresso
Só os keybinds vão para `localStorage` (`aurora-binds`). Capítulos de História concluídos, recordes de
"8 Segundos"/"Tiro de Laço", `arcadeScore` e os itens do Armário se perdem ao recarregar a página —
o que é especialmente ruim no mobile, onde o app é suspenso o tempo todo.

### 8. `game.js` com 1.824 linhas acumula responsabilidades
Menu, telas, HUD em DOM, lógica de modos, câmera e render convivem no mesmo arquivo. Funciona, mas é o
principal gargalo de manutenção. Candidatos óbvios a extração: `ui-menus.js`, `hud.js`, `modes/` (um
arquivo por modo de jogo), `render.js`.

### 9. Números de balanceamento espalhados pelo código
`combat.js` tem constantes mágicas inline (`0.45`, `0.32`, `180 / (weight + 100)`, `shieldHp -= 4`,
medidor `dmg * 0.8 + 3`). Ajustar o feeling do jogo exige caçar literais em vários arquivos.
**Sugestão:** um `js/balance.js` central.

---

## 🟡 Prioridade baixa / polimento

10. **`shieldHp` nunca regenera** (`shieldHp = 60` fixo no construtor) — não achei recarga por frame fora do respawn; vale conferir se é intencional.
11. **`stocks = 99`** hardcoded no setup de treino (game.js:716-717) em vez de uma flag "sem KO".
12. **Sem testes automatizados** — `combat.js` (`applyHit`, `aabb`, `worldHitbox`) é puro e trivial de testar com `node:test`; daria uma rede de segurança real para balanceamento.
13. **Sem CI** — nenhum workflow do GitHub Actions rodando o `npm run check` nos PRs.
14. **Acessibilidade/UX:** não há remapeamento de toque, nem opção de reduzir o screen-shake (`world.shake` até 18), nem controle de volume separado para SFX/música.
15. **Áudio procedural via `setTimeout`** (`audio.js:277`) para a música: o `setTimeout` sofre drift e é limitado em aba de fundo. Agendar pelo relógio do `AudioContext` dá ritmo estável.
16. **`manifest.json` está íntegro** — conferi as 57 entradas, todos os arquivos existem. 👍

---

## Top 5 se for mexer em uma coisa só

1. Corrigir os 2 imports sem `?v=` em `player.js` (1 min, evita bug futuro silencioso).
2. Consertar `npm run check` + incluir `stage.js` no `check:js` (5 min).
3. Centralizar a versão de cache em um único lugar (30 min).
4. Salvar progresso em `localStorage` (1 h, maior ganho percebido pelo jogador).
5. Dar uma máquina de estados simples à IA (2-3 h, maior ganho de qualidade de jogo).
