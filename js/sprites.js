export class SpriteBank {
  constructor() {
    this.images = {};
    this.manifest = {};
  }

  async load(onProgress) {
    this.manifest = await fetch("assets/sprites/manifest.json").then((r) => r.json());
    const extras = ["stages/rooftop.png", "ui/menu_cenario.png"];
    const keys = [...Object.keys(this.manifest), ...extras];
    let done = 0;
    await Promise.all(
      keys.map(async (rel) => {
        const img = new Image();
        const src =
          rel.startsWith("stages/") || rel.startsWith("ui/")
            ? "assets/" + rel
            : "assets/sprites/" + rel;
        img.src = src;
        await img.decode();
        this.images[rel] = img;
        done++;
        onProgress?.(done / keys.length);
      })
    );
  }

  img(rel) {
    return this.images[rel];
  }

  draw(ctx, rel, x, y, { flip = false, scale = 1, anchorX, anchorY, alpha = 1 } = {}) {
    const image = this.images[rel];
    if (!image) return;
    const m = this.manifest[rel] || {};
    const ax = anchorX ?? m.anchorX ?? 0.5;
    const ay = anchorY ?? m.anchorY ?? 1;
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(image, -w * ax, -h * ay, w, h);
    ctx.restore();
  }
}
