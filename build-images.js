/**
 * Erzeugt optimierte Bildvarianten (WebP + JPG) in mehreren Breiten.
 * Quellen liegen in images/src/, Ergebnisse in images/.
 * Aufruf: node build-images.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'images', 'src');
const OUT = path.join(__dirname, 'images');

// name: Breiten, die erzeugt werden sollen
// Quadratischer Portraitausschnitt (Anteile der Originalmasse),
// damit das runde Bild ohne CSS-Zoom auskommt.
const CROP = {
  christa: { left: 0.171, top: 0.073, size: 0.429 },
};

// Abweichende Qualitaet fuer einzelne Bilder (Standard: jpg 78 / webp 74).
// Das Raumfoto ist grossflaechig hell und vertraegt staerkere Kompression.
const QUALITY = {
  ambiente: { jpeg: 72, webp: 66 },
};

const PLAN = {
  hero:           [768, 1280, 1920],
  ambiente:       [480, 700, 900, 1200],
  methode:        [480, 760, 1200],
  christa:        [280, 480],
  gesicht:        [160],
  augenbrauen:    [160],
  wimpern:        [160],
  haarentfernung: [160],
  fuesse:         [160],
  haende:         [160],
  makeup:         [160],
};

async function build() {
  for (const [name, widths] of Object.entries(PLAN)) {
    const candidates = ['.png', '.jpg'].map(ext => path.join(SRC, name + ext));
    const src = candidates.find(p => fs.existsSync(p));
    if (!src) {
      console.log('SKIP (fehlt):', name);
      continue;
    }
    const meta = await sharp(src).metadata();
    const crop = CROP[name];
    const region = crop ? {
      left: Math.round(meta.width * crop.left),
      top: Math.round(meta.height * crop.top),
      width: Math.round(meta.width * crop.size),
      height: Math.round(meta.width * crop.size),
    } : null;
    const base = () => crop ? sharp(src).extract(region) : sharp(src);

    for (const w of widths) {
      const suffix = widths.length > 1 ? '-' + w : '';
      const q = QUALITY[name] || { jpeg: 78, webp: 74 };
      await base().resize({ width: w, withoutEnlargement: true })
        .jpeg({ quality: q.jpeg, mozjpeg: true, progressive: true })
        .toFile(path.join(OUT, `${name}${suffix}.jpg`));
      await base().resize({ width: w, withoutEnlargement: true })
        .webp({ quality: q.webp })
        .toFile(path.join(OUT, `${name}${suffix}.webp`));
      const jpgKb = Math.round(fs.statSync(path.join(OUT, `${name}${suffix}.jpg`)).size / 1024);
      const webpKb = Math.round(fs.statSync(path.join(OUT, `${name}${suffix}.webp`)).size / 1024);
      console.log(`${name}${suffix}`.padEnd(20), String(w).padStart(5) + 'px', `jpg ${jpgKb}KB  webp ${webpKb}KB`);
    }
  }
}

build().catch(e => { console.error(e); process.exit(1); });
