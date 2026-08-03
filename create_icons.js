// This script creates minimal valid PNG icon files
// Run: node create_icons_simple.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

function crc32(buf) {
  let c = 0xFFFFFFFF;
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xEDB88320 ^ (v >>> 1) : v >>> 1;
    t[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const tb = Buffer.from(type);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const ci = Buffer.concat([tb, data]);
  const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(ci));
  return Buffer.concat([len, tb, data, cr]);
}

function makePNG(size) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  
  const raw = [];
  for (let y = 0; y < size; y++) {
    raw.push(0); // no filter
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);
      const r = Math.round(139 - t * 80);
      const g = Math.round(92 + t * 38);
      const b = Math.round(246);
      const cx = x - size/2, cy = y - size/2;
      const dist = Math.sqrt(cx*cx + cy*cy) / (size * 0.45);
      const a = dist < 1 ? 255 : 0;
      raw.push(r, g, b, a);
    }
  }
  
  const compressed = zlib.deflateSync(Buffer.from(raw));
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

[16, 48, 128].forEach(s => {
  const p = path.join(iconsDir, `icon${s}.png`);
  fs.writeFileSync(p, makePNG(s));
  console.log(`Created ${p} (${fs.statSync(p).size} bytes)`);
});
console.log('Done!');
