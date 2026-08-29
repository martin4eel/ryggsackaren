// Ger ett jobb ett lagval-pass ur JSON { lag: [{id,file,namn}], spelare: [{id,file,alt,namn,lag}], rundor: [{lag,ratt,fel}] }.
// Användning: node scripts/merge-lagval.mjs <jobbid> <json> "<titel>" "<brief>" "<items>"
import { readFileSync, writeFileSync } from 'node:fs';
const [jobId, jsonPath, title, brief, items] = process.argv.slice(2);
const d = JSON.parse(readFileSync(jsonPath, 'utf8'));
const esc = (t) => String(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
// bilder
let q = readFileSync('src/data/quizImages.ts', 'utf8');
const end = q.indexOf('\n];', q.indexOf('export const QUIZ_IMAGES'));
let nya = '';
for (const x of [...d.lag, ...d.spelare]) {
  if (q.includes(`id: '${x.id}'`)) continue;
  nya += `  { id: '${x.id}', alt: '${esc(x.alt ?? x.namn)}', file: '${esc(x.file)}' },\n`;
}
q = q.slice(0, end + 1) + `  // ------------------------------------------------------------ ${jobId} (lagval)\n` + nya + q.slice(end + 1);
writeFileSync('src/data/quizImages.ts', q);
// minigame
let s = readFileSync('src/data/jobs.ts', 'utf8');
const i = s.indexOf(`    id: '${jobId}',`); const a = s.indexOf('    minigame: {', i); const b = s.indexOf('    scene:', i);
const lag = d.lag.map((l) => `          { bild: '${l.id}', namn: '${esc(l.namn)}' },`).join('\n');
const sp = d.spelare.map((p) => `          { bild: '${p.id}', namn: '${esc(p.namn)}', lag: '${p.lag}' },`).join('\n');
const ru = d.rundor.map((r) => `          { lag: '${r.lag}', ratt: '${r.ratt}', fel: [${r.fel.map((f) => `'${f}'`).join(', ')}] },`).join('\n');
const ny = `    minigame: {
      kind: 'lagval',
      title: '${esc(title)}',
      brief: '${esc(brief)}',
      items: ['${esc(items)}'],
      lagval: {
        antal: 8,
        lag: [
${lag}
        ],
        spelare: [
${sp}
        ],
        rundor: [
${ru}
        ],
      },
    },
`;
s = (a > 0 && a < b) ? s.slice(0, a) + ny + s.slice(b) : s.slice(0, b) + ny + s.slice(b);
writeFileSync('src/data/jobs.ts', s);
console.log(jobId, d.lag.length, 'lag', d.spelare.length, 'spelare', d.rundor.length, 'rundor', nya.split('\n').length - 1, 'nya bilder');
