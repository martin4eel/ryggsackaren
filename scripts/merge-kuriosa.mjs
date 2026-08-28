// Lägger in info-rader (kuriosa) i jobQuestions.ts från JSON: { jobb: { frågetext: info } }.
// Bara frågor som saknar info rörs.
import { readFileSync, writeFileSync } from 'node:fs';
const p = 'src/data/questions/jobQuestions.ts';
let s = readFileSync(p, 'utf8');
const esc = (t) => t.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
let satta = 0, missade = [], redan = 0;
for (const f of process.argv.slice(2)) {
  const data = JSON.parse(readFileSync(f, 'utf8'));
  for (const [job, m] of Object.entries(data)) {
    for (const [q, info] of Object.entries(m)) {
      if (!info || !info.trim()) continue;
      const needle = `q: '${esc(q)}'`;
      const i = s.indexOf(needle);
      if (i < 0) { missade.push(`${job}: ${q.slice(0, 60)}`); continue; }
      // objektets slut: nästa " }," efter frågan, på samma rad eller de närmaste
      const end = s.indexOf('},', i);
      const obj = s.slice(i, end);
      if (/\binfo:/.test(obj)) { redan++; continue; }
      const trimmed = s.slice(i, end).replace(/\s*$/, '');
      const rest = s.slice(i + trimmed.length, end);
      const sep = trimmed.endsWith(',') ? ' ' : ', ';
      s = s.slice(0, i) + trimmed + `${sep}info: '${esc(info.trim())}'` + rest + s.slice(end);
      satta++;
    }
  }
}
writeFileSync(p, s);
console.log(`satta: ${satta}, redan info: ${redan}, missade: ${missade.length}`);
for (const m of missade) console.log('  ', m);
