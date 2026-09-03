import zlib from "zlib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const INK = [33, 25, 15];
const CREAM = [246, 241, 232];
const EMBER = [200, 82, 18];

const J = [
  [0, 0, 0, 0, 1],
  [0, 0, 0, 0, 1],
  [0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0],
];
const P = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
];

function inRoundedRect(x, y, rw, rh, rx, ry, radius) {
  const left = rx, right = rx + rw, top = ry, bottom = ry + rh;
  if (x < left || x > right || y < top || y > bottom) return false;
  const cx = Math.max(left + radius, Math.min(x, right - radius));
  const cy = Math.max(top + radius, Math.min(y, bottom - radius));
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcBuf) >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }
  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c;
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// Fill rounded-rect region with color, overwriting pixels
function fillRR(buf, w, h, rw, rh, rx, ry, radius, color) {
  for (let y = Math.max(0, Math.floor(ry)); y < Math.min(h, Math.ceil(ry + rh)); y++) {
    for (let x = Math.max(0, Math.floor(rx)); x < Math.min(w, Math.ceil(rx + rw)); x++) {
      if (inRoundedRect(x, y, rw, rh, rx, ry, radius)) {
        const i = (y * w + x) * 4;
        buf[i] = color[0]; buf[i + 1] = color[1]; buf[i + 2] = color[2]; buf[i + 3] = 235;
      }
    }
  }
}

function render(size, file) {
  const buf = Buffer.alloc(size * size * 4); // transparent

  const pad = Math.max(1, Math.round(size * 0.06));
  const inner = size - pad * 2;
  const radius = Math.max(2, Math.round(size * 0.18));

  // dark ink rounded square background
  fillRR(buf, size, size, inner, inner, pad, pad, radius, INK);

  // "JP" glyphs, centered, ~46% of icon height
  const glyphH = Math.round(size * 0.28); // total monogram block height ~ 5 rows
  const gpx = Math.max(1, Math.round(glyphH / 5));
  const gap = Math.round(gpx * 1);
  const gw = gpx * 5;
  const totalW = gw * 2 + gap;
  const startX = Math.round((size - totalW) / 2);
  const startY = Math.round((size - glyphH) / 2 - size * 0.02);
  const letters = [J, P];
  for (let li = 0; li < 2; li++) {
    const glyph = letters[li];
    const ox = startX + li * (gw + gap);
    for (let gy = 0; gy < 5; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (!glyph[gy][gx]) continue;
        for (let py = 0; py < gpx; py++) {
          for (let px = 0; px < gpx; px++) {
            const X = ox + gx * gpx + px;
            const Y = startY + gy * gpx + py;
            if (X >= pad && X < size - pad && Y >= pad && Y < size - pad) {
              const i = (Y * size + X) * 4;
              buf[i] = CREAM[0]; buf[i + 1] = CREAM[1]; buf[i + 2] = CREAM[2]; buf[i + 3] = 255;
            }
          }
        }
      }
    }
  }

  // ember pulse at bottom
  const s = (v) => (v / 100) * size;
  const pulse = [
    [s(30), s(82)], [s(40), s(82)], [s(44), s(75)],
    [s(52), s(92)], [s(57), s(82)], [s(70), s(82)],
  ];
  const sw = Math.max(1, Math.round(size * 0.05));
  for (let y = pad; y < size - pad; y++) {
    for (let x = pad; x < size - pad; x++) {
      for (let i = 0; i < pulse.length - 1; i++) {
        const a = pulse[i], b = pulse[i + 1];
        const abx = b[0] - a[0], aby = b[1] - a[1];
        const len2 = abx * abx + aby * aby;
        let tt = len2 === 0 ? 0 : ((x - a[0]) * abx + (y - a[1]) * aby) / len2;
        tt = Math.max(0, Math.min(1, tt));
        const px = a[0] + tt * abx, py = a[1] + tt * aby;
        const d = Math.hypot(x - px, y - py);
        if (d <= sw / 2 + 0.5) {
          const idx = (y * size + x) * 4;
          buf[idx] = EMBER[0]; buf[idx + 1] = EMBER[1]; buf[idx + 2] = EMBER[2]; buf[idx + 3] = 255;
        }
      }
    }
  }

  fs.writeFileSync(file, encodePNG(size, size, buf));
  console.log("wrote", path.basename(file), Buffer.byteLength(fs.readFileSync(file)), "bytes");
}

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
render(16, path.join(outDir, "favicon-16.png"));
render(32, path.join(outDir, "favicon-32.png"));
render(48, path.join(outDir, "favicon-48.png"));
render(180, path.join(outDir, "apple-touch-icon.png"));
console.log("done");
