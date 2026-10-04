// Usage: node scripts/check-faststart.mjs <file.mp4>
// Reads the top-level MP4 atoms and exits 0 only when `moov` comes before `mdat`.
import { closeSync, fstatSync, openSync, readSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/check-faststart.mjs <file.mp4>");
  process.exit(2);
}
const fd = openSync(file, "r");
const total = fstatSync(fd).size;
const atoms = [];
let pos = 0;
while (pos + 8 <= total) {
  const head = Buffer.alloc(16);
  readSync(fd, head, 0, 16, pos);
  let size = head.readUInt32BE(0);
  const type = head.toString("latin1", 4, 8);
  if (size === 1) size = Number(head.readBigUInt64BE(8));
  else if (size === 0) size = total - pos;
  atoms.push(`${type}@${pos}(${size})`);
  if (size < 8) break;
  pos += size;
}
closeSync(fd);
const types = atoms.map((a) => a.split("@")[0]);
console.log("atoms:", atoms.join(" "));
const moov = types.indexOf("moov");
const mdat = types.indexOf("mdat");
if (moov === -1 || mdat === -1 || moov > mdat) {
  console.error("NOT faststart: moov must come before mdat");
  process.exit(1);
}
console.log("ok: moov before mdat");
