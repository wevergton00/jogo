export class SpriteBank {
  constructor() {
    this.images = {};
    this.manifest = {};
  }

  async load(onProgress) {
    try {
      this.manifest = await fetch("assets/sprites/manifest.json").then((r) => r.json());
    } catch {
      this.manifest = {};
    }

    const extras = [
      "ui/menu_barretos.jpg",
      "stages/barretos.jpg",
      "stages/rooftop.jpg",
      "ui/menu_cenario.jpg",
    ];

    const characterKeys = Object.keys(this.manifest);
    const all = [...characterKeys, ...extras];
    let done = 0;
    const mark = () => {
      done++;
      onProgress?.(done / all.length);
    };

    // Primeiro os sprites de luta — o jogo pode abrir sem os fundos pesados
    await Promise.all(characterKeys.map((rel) => this.loadOne(rel).finally(mark)));

    // Fundos e menu em paralelo, sem travar o início
    extras.forEach((rel) => {
      this.loadOne(rel).finally(mark);
    });
  }

  loadOne(rel) {
    if (this.images[rel]) return Promise.resolve(this.images[rel]);
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      const src =
        rel.startsWith("stages/") || rel.startsWith("ui/")
          ? "assets/" + rel
          : "assets/sprites/" + rel;
      const finish = (ok) => {
        if (ok) this.images[rel] = img;
        resolve(ok ? img : null);
      };
      const t = setTimeout(() => finish(false), 4000);
      img.onload = () => {
        clearTimeout(t);
        finish(true);
      };
      img.onerror = () => {
        clearTimeout(t);
        finish(false);
      };
      img.src = src;
    });
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
