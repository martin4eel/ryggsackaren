// Lägger in altFraga i quizImages.ts från JSON { id: text }.
import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const p = 'src/data/quizImages.ts';
let s = readFileSync(p, 'utf8');
const esc = (t) => t.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
let n = 0, miss = [];
for (const [id, text] of Object.entries(data)) {
  const re = new RegExp(`(\\{ id: '${id}',[^\\n]*?)( \\},?)$`, 'm');
  const m = s.match(re);
  if (!m) { miss.push(id); continue; }
  if (/altFraga:/.test(m[1])) continue;
  s = s.replace(m[0], `${m[1]}, altFraga: '${esc(text.trim().replace(/\.$/, ''))}'${m[2]}`);
  n++;
}
writeFileSync(p, s);
console.log('satta', n, 'saknade', miss);
