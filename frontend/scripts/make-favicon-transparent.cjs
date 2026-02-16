const sharp = require('sharp');
const path = require('path');

async function run() {
  const input = path.join(__dirname, '../public/favicon.png');
  const output = path.join(__dirname, '../public/favicon.png');

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  const isBlue = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    return b > 150 && r < 100 && g < 200;
  };
  const isWhite = (i) => data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245;
  const idx = (x, y) => (y * width + x) * channels;

  let cx = 0, cy = 0, count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      if (isBlue(i)) { cx += x; cy += y; count++; }
    }
  }
  cx = Math.round(cx / count);
  cy = Math.round(cy / count);

  let maxDist = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isBlue(idx(x, y))) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (d > maxDist) maxDist = d;
      }
    }
  }
  const radius = maxDist * 1.02;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (isWhite(i) && dist > radius) {
        data[i + 3] = 0;
      }
    }
  }

  const hasTransparentNeighbor = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ai = idx(nx, ny) + 3;
          if (data[ai] < 128) return true;
        }
      }
    }
    return false;
  };

  const toRemove = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      if (isWhite(i) && data[i + 3] > 0 && hasTransparentNeighbor(x, y)) {
        toRemove.push(i);
      }
    }
  }
  for (const i of toRemove) data[i + 3] = 0;

  await sharp(data, { raw: info })
    .png()
    .toFile(output);

  console.log('Favicon actualizado: fondo transparente, letras blancas conservadas');
}

run().catch((err) => console.error(err));
