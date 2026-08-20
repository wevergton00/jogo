# Aurora Clash

Protótipo de luta 2D (platform fighter) com elenco original.

## Como jogar

Abra `index.html` por um servidor local (não use `file://` — os módulos ES precisam de HTTP).

```bash
python3 -m http.server 8080
```

### Elenco

- **Fernanda** — lutadora técnica. Especiais com os gatos Didi e Tom e projétil de coração.
- **Evertinho** — peão. Laço giratório, arremesso, laço mágico, ataque montado e laço do trovão.

### Modos

- Versus local (dois no mesmo teclado)
- Treinamento (vidas infinitas, hitboxes na pausa)
- Arcade (P2 controlado pela CPU)
- Opções (remapear teclas)

### Controles padrão

| Ação | P1 | P2 |
| --- | --- | --- |
| Mover / pular | WASD | Setas |
| Ataque leve | J | 1 |
| Especial | K | 2 |
| Ataque forte | L | 3 |
| Defesa / esquiva | I | 4 |
| Agarrão | U | 0 |
| Pausa | Esc | Esc |

Especiais: neutro, para o lado, para cima (recuperação) e para baixo.

Controles USB / gamepad também são lidos pelo Gamepad API.

## Arquitetura

```
js/          motor, input, áudio, IA, combate
characters   definidos em js/characters.js
assets/sprites
assets/stages
```

O combate usa hurtbox/hitbox separados, porcentagem, knockback, pulo duplo, defesa, esquiva, bordas e blast zones.

## Arte

Personagens e palco gerados para este protótipo. Fernanda usa Didi e Tom; Evertinho usa laço e cavalo.
