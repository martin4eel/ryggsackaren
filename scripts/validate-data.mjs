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
import { createServer } from 'vite';

const problems = [];
const server = await createServer({
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const load = (p) => server.ssrLoadModule(p);
  const { CATEGORY_QUESTIONS } = await load(
    '/src/data/questions/categoryQuestions.ts'
  );
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

  for (const [category, questions] of Object.entries(CATEGORY_QUESTIONS)) {
    checkQuestions(`kategori:${category}`, questions);
  }
  for (const [cityId, questions] of Object.entries(CITY_QUESTIONS)) {
    checkQuestions(`stad:${cityId}`, questions);
  }

  const CITY_QUIZ_LENGTH = 5;
  for (const city of CITIES) {
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

  for (const job of JOBS) {
    const pool = CATEGORY_QUESTIONS[job.category] ?? [];
    if (pool.length < job.shiftLength)
      problems.push(
        `jobb ${job.id}: kategorin ${job.category} har ${pool.length} frågor men skiftet är ${job.shiftLength}`
      );
    const easy = pool.filter((q) => q.d === 1).length;
    if (easy < job.shiftLength)
      problems.push(
        `jobb ${job.id} på Turist: ${job.category} har ${easy} lätta frågor men skiftet är ${job.shiftLength}`
      );
  }

  console.log(`Frågor: ${total}`);
  console.log(
    `Kategorier: ${Object.keys(CATEGORY_QUESTIONS).length} · Städer: ${CITIES.length} · Jobb: ${JOBS.length}`
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
