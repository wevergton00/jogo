#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageFilter, ImageChops, ImageOps

ROOT = Path("/home/user/jogo")
RAW = ROOT / "assets" / "raw"
OUT = ROOT / "assets" / "sprites"
OUT.mkdir(parents=True, exist_ok=True)


def is_magenta(r: int, g: int, b: int) -> bool:
    return r >= 165 and b >= 165 and g <= 140 and (r + b) / 2 - g >= 60


def chroma_key(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_magenta(r, g, b):
                px[x, y] = (0, 0, 0, 0)
            elif r > 140 and b > 140 and g < 175:
                mag = (r + b) / 2 - g
                if mag > 45:
                    alpha = max(0, min(255, int(255 - mag * 2.4)))
                    r2 = min(r, g + 55)
                    b2 = min(b, g + 55)
                    px[x, y] = (r2, g, b2, alpha)
    return im


def alpha_mask(im: Image.Image, dilate: int = 0) -> Image.Image:
    a = im.split()[-1]
    if dilate > 0:
        # MaxFilter size must be odd
        k = dilate if dilate % 2 == 1 else dilate + 1
        a = a.filter(ImageFilter.MaxFilter(k))
    return a


def connected_boxes_from_mask(mask: Image.Image, min_area: int = 800):
    w, h = mask.size
    px = mask.load()
    seen = bytearray(w * h)
    boxes = []

    def idx(x, y):
        return y * w + x

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
                if x < minx:
                    minx = x
                if x > maxx:
                    maxx = x
                if y < miny:
                    miny = y
                if y > maxy:
                    maxy = y
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                        seen[ny * w + nx] = 1
                        if px[nx, ny] >= 20:
                            stack.append((nx, ny))
            bw, bh = maxx - minx + 1, maxy - miny + 1
            if count >= min_area and bw >= 20 and bh >= 20:
                boxes.append((minx, miny, maxx + 1, maxy + 1, count))
    return boxes


def tight_crop(im: Image.Image, box, pad: int = 6) -> Image.Image:
    x0, y0, x1, y1, *_ = box
    # tighten using original alpha
    region = im.crop((x0, y0, x1, y1))
    a = region.split()[-1]
    bbox = a.getbbox()
    if not bbox:
        return region
    rx0, ry0, rx1, ry1 = bbox
    gx0 = max(0, x0 + rx0 - pad)
    gy0 = max(0, y0 + ry0 - pad)
    gx1 = min(im.width, x0 + rx1 + pad)
    gy1 = min(im.height, y0 + ry1 + pad)
    return im.crop((gx0, gy0, gx1, gy1))


def sort_row_major(boxes, row_height_guess=None):
    if not boxes:
        return boxes
    heights = [b[3] - b[1] for b in boxes]
    avg_h = sum(heights) / len(heights)
    band = max(80, avg_h * 0.45)

    def key(b):
        cy = (b[1] + b[3]) / 2
        return (int(cy // band), b[0])

    return sorted(boxes, key=key)


def save(im: Image.Image, rel: str, manifest: dict, anchor_y: float = 1.0):
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path)
    manifest[rel.replace("\\", "/")] = {
        "w": im.width,
        "h": im.height,
        "anchorX": 0.5,
        "anchorY": anchor_y,
    }
    print(f"  saved {rel:28s} {im.width:4d}x{im.height:<4d}")


def extract(src: Path, names, prefix, manifest, dilate=21, min_area=2000, anchor_y=1.0, order="row"):
    im = chroma_key(Image.open(src))
    mask = alpha_mask(im, dilate=dilate)
    boxes = connected_boxes_from_mask(mask, min_area=min_area)
    if order == "x":
        boxes = sorted(boxes, key=lambda b: b[0])
    else:
        boxes = sort_row_major(boxes)
    print(f"\n{src.name}: {len(boxes)} boxes (want {len(names)})")
    for i, b in enumerate(boxes):
        print(f"  {i}: x={b[0]:4d} y={b[1]:4d} {b[2]-b[0]:4d}x{b[3]-b[1]:<4d}")
    for i, name in enumerate(names):
        if i >= len(boxes):
            print("  MISSING", name)
            continue
        save(tight_crop(im, boxes[i]), f"{prefix}/{name}.png", manifest, anchor_y)
    return boxes


def extract_two_rows(src: Path, top_names, bottom_names, prefix, manifest, dilate=21, min_area=3000):
    im = chroma_key(Image.open(src))
    mid = im.height // 2
    for names, y0, y1 in ((top_names, 0, mid), (bottom_names, mid, im.height)):
        part = im.crop((0, y0, im.width, y1))
        mask = alpha_mask(part, dilate=dilate)
        boxes = sorted(connected_boxes_from_mask(mask, min_area=min_area), key=lambda b: b[0])
        print(f"\n{src.name} row {y0}-{y1}: {len(boxes)} boxes want {len(names)}")
        for i, name in enumerate(names):
            if i >= len(boxes):
                print("  MISSING", name)
                continue
            save(tight_crop(part, boxes[i]), f"{prefix}/{name}.png", manifest, 1.0)


def extract_grid(src: Path, names, prefix, manifest, cols, rows, anchor_y=0.5):
    im = chroma_key(Image.open(src))
    w, h = im.size
    cw, ch = w / cols, h / rows
    print(f"\n{src.name} grid {cols}x{rows}")
    i = 0
    for row in range(rows):
        for col in range(cols):
            x0, y0 = int(col * cw), int(row * ch)
            x1, y1 = int((col + 1) * cw), int((row + 1) * ch)
            cell = im.crop((x0, y0, x1, y1))
            bbox = cell.split()[-1].getbbox()
            if not bbox:
                print("  empty cell", row, col)
                i += 1
                continue
            cropped = cell.crop(bbox)
            # pad
            pad = 4
            canvas = Image.new("RGBA", (cropped.width + pad * 2, cropped.height + pad * 2), (0, 0, 0, 0))
            canvas.paste(cropped, (pad, pad))
            if i < len(names):
                save(canvas, f"{prefix}/{names[i]}.png", manifest, anchor_y)
            i += 1


def main():
    manifest = {}

    extract(
        RAW / "fernanda_sheet.png",
        ["idle_0", "idle_1", "walk_0", "walk_1", "run", "jump", "punch", "hurt"],
        "fernanda",
        manifest,
        dilate=15,
        min_area=8000,
        order="x",
    )
    extract(
        RAW / "fernanda_specials.png",
        ["special", "crouch", "win", "down"],
        "fernanda",
        manifest,
        dilate=31,
        min_area=8000,
        order="x",
    )
    extract(
        RAW / "nox_sheet.png",
        ["idle_0", "idle_1", "walk", "run", "jump", "punch", "charge", "hurt"],
        "nox",
        manifest,
        dilate=15,
        min_area=8000,
        order="x",
    )
    extract_two_rows(
        RAW / "didi_tom.png",
        ["didi_sit", "didi_run", "didi_fire", "tom_sit", "tom_run", "tom_orb"],
        ["didi_sleep", "tom_sleep"],
        "cats",
        manifest,
        dilate=21,
        min_area=3500,
    )
    extract_grid(
        RAW / "fx.png",
        ["heart", "fire", "orb", "burst", "shield", "dust", "sparkle", "explode"],
        "fx",
        manifest,
        cols=4,
        rows=2,
        anchor_y=0.5,
    )

    ref = chroma_key(Image.open(RAW / "fernanda_ref.png"))
    mask = alpha_mask(ref, 9)
    boxes = connected_boxes_from_mask(mask, 8000)
    if boxes:
        save(tight_crop(ref, boxes[0], 10), "fernanda/ref.png", manifest, 1.0)

    portraits = Image.open(RAW / "portraits.png").convert("RGBA")
    w, h = portraits.size
    save(portraits.crop((0, 0, w // 2, h)), "ui/portrait_fernanda.png", manifest, 0.5)
    save(portraits.crop((w // 2, 0, w, h)), "ui/portrait_nox.png", manifest, 0.5)

    arena = Image.open(RAW / "arena_rooftop.png").convert("RGB")
    stage = ROOT / "assets" / "stages"
    stage.mkdir(parents=True, exist_ok=True)
    arena.save(stage / "rooftop.png", quality=92)
    print("\narena", arena.size)

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print("entries", len(manifest))


if __name__ == "__main__":
    main()
