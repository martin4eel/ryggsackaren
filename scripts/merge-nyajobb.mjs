// Lägger in nya yrken ur JSON (job, fragor, bilder, minigame, stader) i
// jobs.ts, jobQuestions.ts, quizImages.ts och cities.ts.
import { readFileSync, writeFileSync } from 'node:fs';
const esc = (t) => String(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const meta = JSON.parse(process.argv[2]); // { id: { category, huvud, wageClass } }
for (const f of process.argv.slice(3)) {
  const d = JSON.parse(readFileSync(f, 'utf8'));
  const id = d.job.id;
  const m = meta[id];
  if (!m) throw new Error(`saknar meta för ${id}`);
  // ---- jobs.ts
  let s = readFileSync('src/data/jobs.ts', 'utf8');
  const mg = d.minigame;
  // Minispelet: bildval byggs ur JSON; peka och avgör skickas som färdig
  // TypeScript-text i fältet `minigameTs` (indrag fyra blanksteg).
  let mgTs;
  if (d.minigameTs) mgTs = d.minigameTs.replace(/\n$/, '');
  else {
    const bildval = mg.bildval.map((b) => `        { bild: '${esc(b.bild)}', namn: '${esc(b.namn)}' },`).join('\n');
    const kunder = mg.kunder.map((k) => `        { text: '${esc(k.text)}', svar: '${esc(k.svar)}', nastan: [${k.nastan.map((n) => `'${esc(n)}'`).join(', ')}], fel: '${esc(k.fel)}' },`).join('\n');
    mgTs = `    minigame: {
      kind: 'bildval',
      title: '${esc(mg.title)}',
      brief: '${esc(mg.brief)}',
      items: ['${esc(mg.items?.[0] ?? 'Bilder')}'],
      bildval: [
${bildval}
      ],
      kunder: [
${kunder}
      ],
    },`;
  }
  const entry = `  {
    id: '${id}',
    title: '${esc(d.job.title)}',
    employer: '${esc(d.job.employer)}',
    category: '${m.category}',
    huvud: '${m.huvud}',
    wageClass: ${m.wageClass},
    shiftLength: ${d.job.shiftLength},
    ad: '${esc(d.job.ad)}',
${mgTs}
    scene: '${esc(d.job.scene)}',
  },
`;
  const endJobs = s.indexOf('\n];', s.indexOf('export const JOBS'));
  s = s.slice(0, endJobs + 1) + entry + s.slice(endJobs + 1);
  writeFileSync('src/data/jobs.ts', s);
  // ---- jobQuestions.ts
  s = readFileSync('src/data/questions/jobQuestions.ts', 'utf8');
  const qs = d.fragor.map((q) => `    { q: '${esc(q.q)}', bild: '${esc(q.bild)}', a: [${q.a.map((x) => `'${esc(x)}'`).join(', ')}], d: ${q.d}${q.info ? `, info: '${esc(q.info)}'` : ''} },`).join('\n');
  const endQ = s.lastIndexOf('\n};');
  s = s.slice(0, endQ + 1) + `  ${id}: [\n${qs}\n  ],\n` + s.slice(endQ + 1);
  writeFileSync('src/data/questions/jobQuestions.ts', s);
  // ---- quizImages.ts
  s = readFileSync('src/data/quizImages.ts', 'utf8');
  const nya = (d.bilder ?? []).filter((b) => !new RegExp(`id: '${b.id}'`).test(s));
  const rader = nya.map((b) => `  { id: '${b.id}', alt: '${esc(b.alt)}', file: '${esc(b.file)}'${b.altFraga ? `, altFraga: '${esc(b.altFraga)}'` : ''} },`).join('\n');
  const arrStart = s.indexOf('export const QUIZ_IMAGES');
  const arrEnd = s.indexOf('\n];', arrStart);
  s = s.slice(0, arrEnd + 1) + `  // ------------------------------------------------------------ ${id}\n${rader}\n` + s.slice(arrEnd + 1);
  writeFileSync('src/data/quizImages.ts', s);
  // ---- cities.ts
  s = readFileSync('src/data/cities.ts', 'utf8');
  for (const [cityId, arbetsgivare] of Object.entries(d.stader ?? {})) {
    const ci = s.indexOf(`    id: '${cityId}',`);
    if (ci < 0) { console.log('stad saknas:', cityId); continue; }
    const next = s.indexOf('\n  {\n', ci);
    let block = s.slice(ci, next < 0 ? s.length : next);
    if (!block.includes(`'${id}'`)) block = block.replace(/jobs: \[([^\]]*)\]/, (mm, inner) => `jobs: [${inner.trimEnd()}${inner.trim().endsWith(',') ? '' : ','} '${id}']`);
    if (!block.includes(`${id}:`)) block = block.replace(/employers: \{\n/, `employers: {\n      ${id}: '${esc(arbetsgivare)}',\n`);
    s = s.slice(0, ci) + block + s.slice(next < 0 ? s.length : next);
  }
  writeFileSync('src/data/cities.ts', s);
  console.log(`${id}: ${d.fragor.length} frågor, ${nya.length} nya bilder, ${Object.keys(d.stader ?? {}).length} städer`);
}
