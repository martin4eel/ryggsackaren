/**
 * Kontrollerar speldatan innan bygge: att alla referenser går att slå upp,
 * att varje stad och varje jobb har tillräckligt med frågor även på den
 * lättare svårighetsgraden, och att inga frågor är dubbletter.
 *
 * Körs med: npm run validate
 */
// Vi laddar TypeScript-datafilerna genom Vites egen modulkörare. Vite är ett
// deklarerat beroende, till skillnad från esbuild som bara följer med
// indirekt, så valideringen kan inte gå sönder av att Vite byter bundlare.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const problems = [];
const server = await createServer({
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const load = (p) => server.ssrLoadModule(p);
  const { JOB_QUESTIONS } = await load('/src/data/questions/jobQuestions.ts');
  const { CITY_QUESTIONS } = await load('/src/data/questions/cityQuestions.ts');
  const { CITIES } = await load('/src/data/cities.ts');
  const { JOBS } = await load('/src/data/jobs.ts');
  const { SOUVENIR_BY_ID } = await load('/src/data/souvenirs.ts');

  const jobById = Object.fromEntries(JOBS.map((j) => [j.id, j]));
  const seen = new Map();
  let total = 0;

  const checkQuestions = (label, questions) => {
    for (const q of questions) {
      total += 1;
      if (!q.q?.trim()) problems.push(`${label}: tom frågetext`);
      if (!Array.isArray(q.a) || q.a.length < 3)
        problems.push(`${label}: färre än 3 alternativ: ${q.q}`);
      if (q.d !== 1 && q.d !== 2)
        problems.push(`${label}: ogiltig svårighetsgrad: ${q.q}`);
      const unique = new Set(q.a.map((a) => a.trim().toLowerCase()));
      if (unique.size !== q.a.length)
        problems.push(`${label}: identiska alternativ: ${q.q}`);
      if (q.a.some((a) => !a?.trim()))
        problems.push(`${label}: tomt alternativ: ${q.q}`);
      // Distraktorer får inte avslöja svaret genom att förklara sig.
      for (const a of q.a.slice(1)) {
        if (
          /\b(är rätt|duger men|kallas det|existerar men|är engelska|är serierna|är filmerna|är vegetationen|är blodbrist)\b/i.test(
            a
          )
        ) {
          problems.push(`${label}: distraktorn "${a}" avslöjar svaret: ${q.q}`);
        }
      }
      const key = q.q.trim().toLowerCase();
      if (seen.has(key))
        problems.push(`dubblett i ${label} och ${seen.get(key)}: ${q.q}`);
      else seen.set(key, label);
    }
  };

  for (const [jobId, questions] of Object.entries(JOB_QUESTIONS)) {
    checkQuestions(`jobb:${jobId}`, questions);
  }
  for (const [cityId, questions] of Object.entries(CITY_QUESTIONS)) {
    checkQuestions(`stad:${cityId}`, questions);
  }

  const CITY_QUIZ_LENGTH = 5;
  for (const city of CITIES) {
    // Stadsvyn visar alltid ett foto; bygget ska inte gå igenom utan det.
    // Saknas filen hämtas den med: node scripts/fetch-city-photos.mjs
    if (!existsSync(join(ROOT, 'public', 'cities', `${city.id}.jpg`)))
      problems.push(`stad ${city.id} saknar foto public/cities/${city.id}.jpg`);

    const questions = CITY_QUESTIONS[city.id];
    if (!questions) {
      problems.push(`stad ${city.id} saknar frågor helt`);
      continue;
    }
    if (questions.length < CITY_QUIZ_LENGTH)
      problems.push(`stad ${city.id} har bara ${questions.length} frågor`);
    const easy = questions.filter((q) => q.d === 1).length;
    if (easy < CITY_QUIZ_LENGTH)
      problems.push(
        `stad ${city.id} har ${easy} lätta frågor, Turist behöver ${CITY_QUIZ_LENGTH}`
      );

    const jobs = city.jobs.map((id) => jobById[id]);
    city.jobs.forEach((id, i) => {
      if (!jobs[i]) problems.push(`stad ${city.id} pekar på okänt jobb ${id}`);
    });
    if (!jobs.some((j) => j?.wageClass === 1))
      problems.push(
        `stad ${city.id} saknar jobb i löneklass 1, en spelare utan betyg kan inte tjäna pengar där`
      );
    if (city.jobs.length < 4)
      problems.push(`stad ${city.id} har bara ${city.jobs.length} jobb`);

    for (const id of city.souvenirs) {
      if (!SOUVENIR_BY_ID[id])
        problems.push(`stad ${city.id} pekar på okänd souvenir ${id}`);
    }
    if (city.souvenirs.length < 3)
      problems.push(
        `stad ${city.id} har bara ${city.souvenirs.length} souvenirer`
      );
  }

  const MINIGAME_KINDS = new Set([
    'sortering',
    'instrument',
    'sekvens',
    'precision',
  ]);

  for (const job of JOBS) {
    // Varje jobb måste ha sin egen frågeuppsättning, aldrig delad med andra.
    const pool = JOB_QUESTIONS[job.id];
    if (!pool) {
      problems.push(`jobb ${job.id} saknar egna frågor`);
      continue;
    }
    if (pool.length < job.shiftLength)
      problems.push(
        `jobb ${job.id} har ${pool.length} frågor men skiftet är ${job.shiftLength}`
      );
    const easy = pool.filter((q) => q.d === 1).length;
    if (easy < job.shiftLength)
      problems.push(
        `jobb ${job.id} på Turist: ${easy} lätta frågor men skiftet är ${job.shiftLength}`
      );

    // Arkadmomentet måste vara komplett och spelbart.
    const mg = job.minigame;
    if (!mg) {
      problems.push(`jobb ${job.id} saknar minispel`);
    } else {
      if (!MINIGAME_KINDS.has(mg.kind))
        problems.push(`jobb ${job.id} har okänd minispelstyp ${mg.kind}`);
      if (!mg.title?.trim()) problems.push(`jobb ${job.id}: minispel utan titel`);
      if (!mg.brief?.trim()) problems.push(`jobb ${job.id}: minispel utan instruktion`);
      const needed = mg.kind === 'precision' ? 1 : 3;
      if (!Array.isArray(mg.items) || mg.items.length < needed)
        problems.push(
          `jobb ${job.id}: minispelet ${mg.kind} behöver minst ${needed} poster, har ${mg.items?.length ?? 0}`
        );
      if (new Set(mg.items ?? []).size !== (mg.items ?? []).length)
        problems.push(`jobb ${job.id}: minispelet har dubbletter bland posterna`);
    }
    if (!job.scene?.trim())
      problems.push(`jobb ${job.id} saknar miljöbeskrivning (scene)`);
  }

  // Inga två jobb får dela frågeuppsättning av misstag.
  const poolIds = Object.keys(JOB_QUESTIONS);
  const jobIds = new Set(JOBS.map((j) => j.id));
  for (const id of poolIds) {
    if (!jobIds.has(id))
      problems.push(`frågeuppsättningen ${id} hör inte till något jobb`);
  }

  console.log(`Frågor: ${total}`);
  console.log(
    `Städer: ${CITIES.length} · Jobb: ${JOBS.length} · Jobbfrågor: ${Object.values(
      JOB_QUESTIONS
    ).reduce((a, b) => a + b.length, 0)}`
  );
} finally {
  await server.close();
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem hittades:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('Speldatan är giltig.');
