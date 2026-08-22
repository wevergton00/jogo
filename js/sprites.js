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
    const extras = ["stages/rooftop.png", "ui/menu_cenario.png", "ui/menu_barretos.png"];
    const keys = [...Object.keys(this.manifest), ...extras];
    let done = 0;
    await Promise.all(
      keys.map(async (rel) => {
        try {
          const img = new Image();
          img.decoding = "async";
          const src =
            rel.startsWith("stages/") || rel.startsWith("ui/")
              ? "assets/" + rel
              : "assets/sprites/" + rel;
          img.src = src;
          await new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error("timeout " + rel)), 8000);
          img.onload = () => {
            clearTimeout(t);
            // Remove o halo claro deixado no recorte dos sprites.
            // Só pixels quase brancos na borda transparente são removidos;
            // áreas brancas internas (roupas, olhos e efeitos) permanecem.
            const c = document.createElement("canvas");
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const cctx = c.getContext("2d", { willReadFrequently: true });
            cctx.drawImage(img, 0, 0);
            const data = cctx.getImageData(0, 0, c.width, c.height);
            const px = data.data;
            const isTransparent = (x, y) => x < 0 || y < 0 || x >= c.width || y >= c.height || px[(y * c.width + x) * 4 + 3] < 24;
            for (let y = 1; y < c.height - 1; y++) {
              for (let x = 1; x < c.width - 1; x++) {
                const i = (y * c.width + x) * 4;
                const nearWhite = px[i] > 220 && px[i + 1] > 220 && px[i + 2] > 220;
                const touchesAlpha = isTransparent(x - 1, y) || isTransparent(x + 1, y) || isTransparent(x, y - 1) || isTransparent(x, y + 1);
                if (nearWhite && touchesAlpha) px[i + 3] = 0;
              }
            }
            cctx.putImageData(data, 0, 0);
            const cleaned = new Image();
            cleaned.src = c.toDataURL("image/png");
            cleaned.onload = () => {
              this.images[rel] = cleaned;
              resolve();
            };
          };
            img.onerror = () => {
              clearTimeout(t);
              reject(new Error("fail " + rel));
            };
          });
        } catch (err) {
          console.warn(err);
        }
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
