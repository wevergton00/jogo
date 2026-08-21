#!/usr/bin/env python3
"""Fatia o novo sprite sheet do Evertinho (fundo PRETO) em frames individuais.

Uso: python3 tools/slice_evertinho_v2.py assets/raw/evertinho_v2.png

Diferente do slice_sprites.py (fundo magenta), este remove fundo preto
preservando os brilhos do laço (dourado/azul) via alpha por luminância
nas bordas do recorte.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "sprites" / "evertinho"
MANIFEST = ROOT / "assets" / "sprites" / "manifest.json"


def black_key(im: Image.Image, thresh: int = 26) -> Image.Image:
    """Transforma fundo preto em transparente; pixels escuros de borda viram semi-transparentes."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            lum = max(r, g, b)
            if lum <= thresh:
                px[x, y] = (0, 0, 0, 0)
            elif lum <= thresh * 3:
                # borda suave: alpha proporcional à luminância
                alpha = int(255 * (lum - thresh) / (thresh * 2))
                px[x, y] = (r, g, b, min(a, alpha))
    return im


def connected_boxes(mask: Image.Image, min_area: int = 900):
    w, h = mask.size
    px = mask.load()
    seen = bytearray(w * h)
    boxes = []
    for y0 in range(h):
        row = y0 * w
        for x0 in range(w):
            i = row + x0
            if seen[i]:
                continue
            if px[x0, y0] < 20:
                seen[i] = 1
                continue
            stack = [(x0, y0)]
            seen[i] = 1
            minx = maxx = x0
            miny = maxy = y0
            count = 0
            while stack:
                x, y = stack.pop()
                count += 1
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
                for nx, ny in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not seen[j] and px[nx, ny] >= 20:
                            seen[j] = 1
                            stack.append((nx, ny))
            if count >= min_area:
                boxes.append((minx, miny, maxx + 1, maxy + 1))
    return boxes


def rows_of(boxes, gap=40):
    """Agrupa caixas por linha (ordena por y, depois x)."""
    rows: list[list] = []
    for box in sorted(boxes, key=lambda b: (b[1] + b[3]) / 2):
        cy = (box[1] + box[3]) / 2
        placed = False
        for r in rows:
            rcy = sum((b[1] + b[3]) / 2 for b in r) / len(r)
            if abs(cy - rcy) < gap * 2.5:
                r.append(box)
                placed = True
                break
        if not placed:
            rows.append([box])
    return [sorted(r, key=lambda b: b[0]) for r in rows]


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "assets" / "raw" / "evertinho_v2.png"
    im = black_key(Image.open(src))
    mask = im.split()[-1].point(lambda v: 255 if v > 30 else 0)
    mask = mask.filter(ImageFilter.MaxFilter(9))  # une brilhos próximos ao corpo
    rows = rows_of(connected_boxes(mask))
    print(f"{len(rows)} linhas detectadas")
    for i, r in enumerate(rows):
        print(f"  linha {i}: {len(r)} frames -> {[b[0] for b in r]}")
    # O mapeamento frame->animação é feito manualmente depois de inspecionar
    outdir = ROOT / "assets" / "raw" / "evertinho_v2_frames"
    outdir.mkdir(parents=True, exist_ok=True)
    for ri, r in enumerate(rows):
        for ci, (x0, y0, x1, y1) in enumerate(r):
            im.crop((x0, y0, x1, y1)).save(outdir / f"r{ri}_c{ci}.png")
    print(f"frames salvos em {outdir}")


if __name__ == "__main__":
    main()
