#!/usr/bin/env python3
"""Fatia os sheets novos do Evertinho (fundo BRANCO) em frames."""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent


def white_key(im: Image.Image, tol: int = 232) -> Image.Image:
    """Remove fundo branco conectado às bordas (preserva branco interno dos brilhos)."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    bg = bytearray(w * h)
    q = deque()

    def near_white(x, y):
        r, g, b, a = px[x, y]
        return r >= tol and g >= tol and b >= tol

    for x in range(w):
        for y in (0, h - 1):
            if near_white(x, y) and not bg[y * w + x]:
                bg[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if near_white(x, y) and not bg[y * w + x]:
                bg[y * w + x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny * w + nx] and near_white(nx, ny):
                bg[ny * w + nx] = 1
                q.append((nx, ny))
    for y in range(h):
        row = y * w
        for x in range(w):
            if bg[row + x]:
                px[x, y] = (0, 0, 0, 0)
    return im


def components(mask: Image.Image, min_area: int = 700):
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
            n = 0
            while stack:
                x, y = stack.pop()
                n += 1
                minx = min(minx, x); maxx = max(maxx, x)
                miny = min(miny, y); maxy = max(maxy, y)
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not seen[j] and px[nx, ny] >= 20:
                            seen[j] = 1
                            stack.append((nx, ny))
            if n >= min_area:
                boxes.append((minx, miny, maxx + 1, maxy + 1))
    return boxes


def tight_box(im: Image.Image, box):
    crop = im.crop(box)
    bbox = crop.split()[-1].getbbox()
    if not bbox:
        return None
    return (box[0] + bbox[0], box[1] + bbox[1], box[0] + bbox[2], box[1] + bbox[3])


def slice_sheet(src: Path, outdir: Path, dilate: int = 25):
    im = white_key(Image.open(src))
    mask = im.split()[-1].point(lambda v: 255 if v > 25 else 0)
    big = mask.filter(ImageFilter.MaxFilter(dilate))
    boxes = components(big)
    # agrupa por linha
    rows: list[list] = []
    for b in sorted(boxes, key=lambda b: (b[1] + b[3]) / 2):
        cy = (b[1] + b[3]) / 2
        for r in rows:
            rcy = sum((x[1] + x[3]) / 2 for x in r) / len(r)
            if abs(cy - rcy) < 130:
                r.append(b)
                break
        else:
            rows.append([b])
    rows = [sorted(r, key=lambda b: b[0]) for r in rows]
    outdir.mkdir(parents=True, exist_ok=True)
    for f in outdir.glob("*.png"):
        f.unlink()
    for ri, r in enumerate(rows):
        for ci, b in enumerate(r):
            tb = tight_box(im, b)
            if tb:
                im.crop(tb).save(outdir / f"r{ri}_c{ci}.png")
    print(f"{src.name}: {len(rows)} linhas -> {[len(r) for r in rows]}")
    return rows


if __name__ == "__main__":
    slice_sheet(ROOT / "assets/raw/evertinho_v2.png", ROOT / "assets/raw/ev2_frames")
    slice_sheet(ROOT / "assets/raw/evertinho_v2_extra.png", ROOT / "assets/raw/ev2_extra")
