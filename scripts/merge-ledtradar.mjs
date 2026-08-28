// Slår ihop skrivna ledtrådar (JSON per batch) till src/data/sparetLedtradar.ts.
import { readFileSync, writeFileSync } from 'node:fs';
const files = process.argv.slice(2);
const alla = {};
for (const f of files) Object.assign(alla, JSON.parse(readFileSync(f, 'utf8')));
const esc = (t) => t.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const p = 'src/data/sparetLedtradar.ts';
let s = readFileSync(p, 'utf8');
const body = Object.keys(alla).sort().map((id) => {
  const rader = [...alla[id]].sort((a, b) => b.niva - a.niva).map((l) => `    { niva: ${l.niva}, text: '${esc(l.text.trim())}' },`).join('\n');
  return `  ${id}: [\n${rader}\n  ],`;
}).join('\n');
s = s.replace(/export const SPARET_LEDTRADAR: Record<string, Ledtrad\[]> = \{[\s\S]*\};\s*$/, `export const SPARET_LEDTRADAR: Record<string, Ledtrad[]> = {\n${body}\n};\n`);
writeFileSync(p, s);
console.log('städer:', Object.keys(alla).length);
