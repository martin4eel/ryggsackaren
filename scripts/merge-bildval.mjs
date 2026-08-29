// Byter ett jobbs minigame mot ett bildval ur JSON { jobb: { title, brief, roll, bildval, kunder } }.
import { readFileSync, writeFileSync } from 'node:fs';
const esc = (t) => String(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
let s = readFileSync('src/data/jobs.ts', 'utf8');
let n = 0;
for (const f of process.argv.slice(2)) {
  const d = JSON.parse(readFileSync(f, 'utf8'));
  for (const [id, mg] of Object.entries(d)) {
    const i = s.indexOf(`    id: '${id}',`);
    if (i < 0) { console.log('saknas', id); continue; }
    const a = s.indexOf('    minigame: {', i);
    const b = s.indexOf('    scene:', a);
    const ids = new Set(mg.bildval.map((x) => x.bild));
    for (const k of mg.kunder) for (const x of [k.svar, ...k.nastan]) if (!ids.has(x)) console.log(`  ${id}: ${x} finns inte i bildval`);
    const bildval = mg.bildval.map((x) => `        { bild: '${x.bild}', namn: '${esc(x.namn)}' },`).join('\n');
    const kunder = mg.kunder.map((k) => `        { text: '${esc(k.text)}', svar: '${k.svar}', nastan: [${k.nastan.map((x) => `'${x}'`).join(', ')}], fel: '${esc(k.fel)}' },`).join('\n');
    const roll = mg.roll ? `      roll: { en: '${esc(mg.roll.en)}', flera: '${esc(mg.roll.flera)}', klara: '${esc(mg.roll.klara)}' },\n` : '';
    const ny = `    minigame: {
      kind: 'bildval',
      title: '${esc(mg.title)}',
      brief: '${esc(mg.brief)}',
${roll}      items: ['Foton'],
      bildval: [
${bildval}
      ],
      kunder: [
${kunder}
      ],
    },
`;
    s = s.slice(0, a) + ny + s.slice(b);
    n++;
  }
}
writeFileSync('src/data/jobs.ts', s);
console.log('bytta', n);
