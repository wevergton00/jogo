# Aurora Clash

Protótipo de luta 2D (platform fighter) com elenco original.

## Como jogar

Abra `index.html` por um servidor local (não use `file://` — os módulos ES precisam de HTTP).

```bash
python3 -m http.server 8080
```

### Elenco

- **Fernanda** — lutadora técnica. Especiais com os gatos Didi e Tom e projétil de coração.
- **Evertinho** — peão. Laço (prender, puxar, explodir, trovão, mágico), cavalo e ataque montado.

### Modos

- Versus local (dois no mesmo teclado)
- Treinamento (vidas infinitas, nomes de golpes, hitboxes, reset)
- Arcade (P2 controlado pela CPU)
- Opções (remapear teclas)

A luta só começa com **ENTER**: animação de preparação, 3, 2, 1, **LUTE!**.

ENTER também confirma personagem e arena.

### Controles padrão

| Ação | P1 | P2 |
| --- | --- | --- |
| Mover / pular / abaixar | WASD | Setas |
| Ataque básico | J | 1 |
| Ataque forte | K | 2 |
| Especial | L | 3 |
| Defesa / esquiva | I | 4 |
| Agarrão | U | 0 |
| Pausa | Esc | Esc |
| Começar luta / confirmar | Enter | Enter |

### Evertinho

| Golpe | Comando |
| --- | --- |
| Ataque com Laço (prende) | J |
| Laço Giratório (área) | ↓+J ou segurar L |
| Laço Arremesso (prende à distância) | K |
| Laço Puxão | J/K depois de prender |
| Laço Explosivo | ↓+K |
| Laço do Trovão | ↓+L |
| Ataque Montado | →+L |
| Invocar Cavalo | ↑+L |
| Especial — Laço Mágico | L (toque) |
| Agarrão | U |

No treino: **H** hitboxes · **R** resetar posições.

Combos exemplo: `J → J → K → L` ou `J → laço → puxão → forte`.

Controles USB / gamepad também são lidos pelo Gamepad API.

## Arquitetura

```
js/          motor, input, áudio, IA, combate, laço, cavalo, efeitos
characters   definidos em js/characters.js
assets/sprites
assets/stages
```

O combate usa hurtbox/hitbox separados, porcentagem, knockback, pulo duplo, defesa, esquiva, bordas e blast zones. O laço tem hitbox própria e corda visível. O cavalo é uma entidade (montar, desmontar, dano, queda).

## Arte

Personagens e palco gerados para este protótipo. Fernanda usa Didi e Tom; Evertinho usa laço e cavalo.
