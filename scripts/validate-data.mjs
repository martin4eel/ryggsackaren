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
/** Varningar stoppar inte bygget, men syns vid varje körning. */
const warnings = [];
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
  const { LAND_ADJACENCY, FERRY_LINKS, FERRY_LINES } = await load(
    '/src/data/transport.ts'
  );
  const { OPERATORS } = await load('/src/data/operators.ts');
  const { COUNTRY_FACTS, CITY_POPULATION } = await load('/src/data/facts.ts');
  const { availableRoutes } = await load('/src/game/travel.ts');

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

  /**
   * Nära-dubbletter inom ett jobb. Exakt lika frågetext fångas redan av
   * kontrollen ovan, men två frågor kan ha samma rätta svar och samma ämne
   * med olika formulering - "Vad kallas de japanska serierna?" och "Vad kallas
   * japanska tryckta serier?" är samma fråga två gånger. Ett skift kan då
   * ställa båda, vilket ser ut som ett fel i spelet.
   */
  const normalisera = (t) =>
    String(t)
      .toLowerCase()
      .replace(/[^a-zåäöé0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const stam = (t) => normalisera(t).replace(/(en|et|na|erna|arna|n|t)$/, '');
  const STOPPORD = new Set(
    'vad kallas vilken vilket vem hur som den det en ett du man i på av för med till och är om vid'.split(' ')
  );
  const nyckelord = (t) =>
    new Set(
      normalisera(t)
        .split(' ')
        .filter((w) => !STOPPORD.has(w) && w.length > 2)
    );

  for (const [jobId, pool] of Object.entries(JOB_QUESTIONS)) {
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        if (stam(pool[i].a[0]) !== stam(pool[j].a[0])) continue;
        const A = nyckelord(pool[i].q);
        const B = nyckelord(pool[j].q);
        const gemensamma = [...A].filter((w) => B.has(w)).length;
        const andel = gemensamma / Math.max(1, Math.min(A.size, B.size));
        if (andel >= 0.34)
          problems.push(
            `jobb ${jobId}: två frågor med samma svar "${pool[i].a[0]}" och samma ämne:\n` +
              `      "${pool[i].q}"\n      "${pool[j].q}"`
          );
      }
    }
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

    // Lokala arbetsgivarnamn måste peka på jobb staden faktiskt erbjuder.
    for (const id of Object.keys(city.employers ?? {})) {
      if (!city.jobs.includes(id))
        problems.push(
          `stad ${city.id} har ett lokalt arbetsgivarnamn för ${id}, som inte finns bland stadens jobb`
        );
    }

    for (const id of city.souvenirs) {
      if (!SOUVENIR_BY_ID[id])
        problems.push(`stad ${city.id} pekar på okänd souvenir ${id}`);
    }
    if (city.souvenirs.length < 3)
      problems.push(
        `stad ${city.id} har bara ${city.souvenirs.length} souvenirer`
      );
  }

  /**
   * Varje arkadmoment behöver olika mycket data. `needed` är minsta antal
   * poster i `items`; utöver det kontrolleras `pool` för sorteringen och
   * `avoid` för träffmomentet, eftersom de spelen blir meningslösa utan.
   */
  const MINIGAME_KINDS = {
    sortering: { needed: 3 },
    instrument: { needed: 3 },
    sekvens: { needed: 3 },
    precision: { needed: 1 },
    vaxel: { needed: 3 },
    traffa: { needed: 2 },
    balans: { needed: 1 },
    takt: { needed: 2 },
  };

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

    /**
     * Marginalen mellan frågebanken och skiftets längd avgör hur mycket ett
     * skift varierar mellan två besök. Med lika många lätta frågor som
     * arbetsdagar får en Turist exakt samma frågor varje gång, bara i ny
     * ordning. Kravet skärps efter hand som banken byggs ut; siffran här är
     * den nivå hela spelet klarar i dag.
     */
    /**
     * Sedan alla åttio yrken byggts ut är kravet blockerande. Med för liten
     * marginal får en Turist nästan samma frågor varje gång jobbet tas om,
     * vilket är precis det som gjorde skiften enformiga tidigare.
     */
    const MIN_MARGINAL = 4;
    if (easy - job.shiftLength < MIN_MARGINAL)
      problems.push(
        `jobb ${job.id}: ${easy} lätta frågor på ett skift om ${job.shiftLength} dagar. ` +
          `Marginalen måste vara minst ${MIN_MARGINAL}, är ${easy - job.shiftLength}`
      );

    // Arkadmomentet måste vara komplett och spelbart.
    const mg = job.minigame;
    if (!mg) {
      problems.push(`jobb ${job.id} saknar minispel`);
    } else {
      const spec = MINIGAME_KINDS[mg.kind];
      if (!spec) problems.push(`jobb ${job.id} har okänd minispelstyp ${mg.kind}`);
      if (!mg.title?.trim()) problems.push(`jobb ${job.id}: minispel utan titel`);
      if (!mg.brief?.trim()) problems.push(`jobb ${job.id}: minispel utan instruktion`);
      const needed = spec?.needed ?? 3;
      if (!Array.isArray(mg.items) || mg.items.length < needed)
        problems.push(
          `jobb ${job.id}: minispelet ${mg.kind} behöver minst ${needed} poster, har ${mg.items?.length ?? 0}`
        );
      if (new Set(mg.items ?? []).size !== (mg.items ?? []).length)
        problems.push(`jobb ${job.id}: minispelet har dubbletter bland posterna`);

      if (mg.kind === 'sortering') {
        // Utan pool visas korgens eget namn som föremål och spelet blir
        // meningslöst - det var precis felet i den första versionen.
        if (!Array.isArray(mg.pool) || mg.pool.length !== (mg.items?.length ?? 0)) {
          problems.push(
            `jobb ${job.id}: sorteringen behöver en pool per korg (${mg.items?.length ?? 0} st)`
          );
        } else {
          mg.pool.forEach((group, i) => {
            if (!Array.isArray(group) || group.length < 3)
              problems.push(
                `jobb ${job.id}: korgen "${mg.items[i]}" har ${group?.length ?? 0} föremål, behöver 3`
              );
          });
          const flat = mg.pool.flat();
          if (new Set(flat).size !== flat.length)
            problems.push(`jobb ${job.id}: samma föremål finns i flera korgar`);
        }
      }

      if (mg.kind === 'traffa') {
        if (!Array.isArray(mg.avoid) || mg.avoid.length < 2)
          problems.push(
            `jobb ${job.id}: träffmomentet behöver minst 2 poster i avoid, har ${mg.avoid?.length ?? 0}`
          );
        const overlap = (mg.avoid ?? []).filter((a) => (mg.items ?? []).includes(a));
        if (overlap.length > 0)
          problems.push(`jobb ${job.id}: ${overlap.join(', ')} finns både i items och avoid`);
      }
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

  /**
   * Transportnätverket. Tre saker kan gå sönder tyst när städer läggs till:
   * en landregion utan grannskap, en färjelänk till en stad som inte finns,
   * och - värst - ett stadspar som inte går att resa mellan alls. Det sista
   * skulle låsa fast en spelare utan att något syns i gränssnittet.
   */
  const cityById = Object.fromEntries(CITIES.map((c) => [c.id, c]));

  for (const [region, grannar] of Object.entries(LAND_ADJACENCY)) {
    for (const granne of grannar) {
      if (!(LAND_ADJACENCY[granne] ?? []).includes(region))
        problems.push(
          `landregionen ${region} gränsar till ${granne}, men inte tvärtom`
        );
    }
  }

  const kändaRegioner = new Set(CITIES.map((c) => c.landRegion));
  for (const region of Object.keys(LAND_ADJACENCY)) {
    if (!kändaRegioner.has(region))
      problems.push(`landregionen ${region} har inga städer`);
  }

  for (const [a, b] of FERRY_LINKS) {
    if (!cityById[a]) problems.push(`färjelänk pekar på okänd stad ${a}`);
    if (!cityById[b]) problems.push(`färjelänk pekar på okänd stad ${b}`);
    if (a === b) problems.push(`färjelänk från ${a} till sig själv`);
  }

  /**
   * Hamnens avgångstavla läser turlistan ur FERRY_LINES. En linje utan
   * avgångstider skulle ge en tom tavla i en hamn som staden ändå skyltar med.
   */
  for (const line of FERRY_LINES) {
    const namn = `färjelinjen ${line.a}-${line.b}`;
    if (!line.rederi?.trim()) problems.push(`${namn} saknar rederi`);
    if (!line.fartyg?.trim()) problems.push(`${namn} saknar fartygsnamn`);
    if (!Array.isArray(line.avgangar) || line.avgangar.length === 0)
      problems.push(`${namn} saknar avgångstider`);
    for (const t of line.avgangar ?? []) {
      if (!Number.isInteger(t) || t < 0 || t >= 1440)
        problems.push(`${namn} har en avgångstid utanför dygnet: ${t}`);
    }
  }

  /**
   * Trafikbolagen. Saknas landet i tabellen faller stationen tillbaka på ett
   * namnlöst reservbolag, och då står det "Continental Wings" på en tavla i
   * Hanoi utan att någon märker det förrän en spelare undrar.
   */
  for (const c of CITIES) {
    const ops = OPERATORS[c.country];
    if (!ops) {
      problems.push(`${c.country} saknar trafikbolag i data/operators.ts`);
      continue;
    }
    if (!ops.air?.name || !/^[A-Z]{2}$/.test(ops.air?.code ?? ''))
      problems.push(`${c.country} saknar flygbolag med tvåbokstavskod`);
    if (!ops.bus?.trim()) problems.push(`${c.country} saknar bussbolag`);
    if (c.rail && !ops.rail)
      problems.push(
        `${c.name} har fjärrtåg men ${c.country} saknar järnvägsbolag`
      );
    if (ops.rail && !(ops.rail.speed > 20 && ops.rail.speed < 400))
      problems.push(`${c.country} har orimlig tåghastighet: ${ops.rail.speed}`);
  }

  /**
   * Atlasens fakta. En stad utan folkmängd visar en tom rad, och ett land utan
   * fakta visar en ursäkt i stället för en uppslagssida - båda ser ut som fel
   * för den som slår upp landet hen just rest till.
   */
  for (const c of CITIES) {
    if (!CITY_POPULATION[c.id])
      problems.push(`${c.name} saknar folkmängd i data/facts.ts`);
    const f = COUNTRY_FACTS[c.country];
    if (!f) {
      problems.push(`${c.country} saknar landsfakta i data/facts.ts`);
      continue;
    }
    for (const falt of ['capital', 'language', 'religion', 'population']) {
      if (!f[falt]?.trim())
        problems.push(`${c.country} saknar ${falt} i landsfakta`);
    }
  }

  /** Två länder får inte dela flygbolagskod - flightnumren blir tvetydiga. */
  const koder = new Map();
  for (const [land, ops] of Object.entries(OPERATORS)) {
    const kod = ops.air?.code;
    if (!kod) continue;
    if (koder.has(kod))
      problems.push(`flygbolagskoden ${kod} används av både ${koder.get(kod)} och ${land}`);
    else koder.set(kod, land);
  }

  /**
   * Alla stadspar behöver inte ha en direktförbindelse - Köping har ingen
   * flygplats, så därifrån går inget flyg alls. Kravet är i stället att varje
   * stad går att nå från varje annan stad genom nätverket, med byten.
   * En stad som inte går att ta sig ifrån skulle låsa fast en spelare.
   */
  const grannar = new Map(
    CITIES.map((c) => [
      c.id,
      CITIES.filter(
        (d) => d.id !== c.id && availableRoutes(c, d, 'globetrotter').length > 0
      ).map((d) => d.id),
    ])
  );
  for (const start of CITIES) {
    const sedda = new Set([start.id]);
    const ko = [start.id];
    while (ko.length > 0) {
      for (const n of grannar.get(ko.shift()) ?? []) {
        if (!sedda.has(n)) {
          sedda.add(n);
          ko.push(n);
        }
      }
    }
    if (sedda.size < CITIES.length) {
      const onadda = CITIES.filter((c) => !sedda.has(c.id)).map((c) => c.name);
      problems.push(
        `från ${start.name} går det inte att nå ${onadda.length} städer ens med byten: ${onadda.slice(0, 4).join(', ')}`
      );
    }
  }

  let utanRutt = 0;
  let landOverTak = 0;
  for (const from of CITIES) {
    for (const to of CITIES) {
      if (from.id === to.id) continue;
      for (const svårighet of ['turist', 'globetrotter']) {
        const rutter = availableRoutes(from, to, svårighet);
        if (rutter.length === 0) utanRutt += 1;
        // Buss eller tåg över 250 mil är inte trovärdigt oavsett nätverk.
        for (const r of rutter) {
          if ((r.mode === 'buss' || r.mode === 'tag') && r.days > 5) {
            landOverTak += 1;
            problems.push(
              `${from.name} -> ${to.name}: ${r.label} tar ${r.days} dagar, orimligt`
            );
          }
        }
      }
    }
  }

  console.log(
    `Transport: ${CITIES.length * (CITIES.length - 1)} stadspar, ` +
      `${utanRutt} utan direktrutt, ${landOverTak} orimliga landrutter, ` +
      `alla städer nåbara med byten`
  );

  console.log(
    `Trafik: ${Object.keys(OPERATORS).length} länder med trafikbolag, ` +
      `${FERRY_LINES.length} färjelinjer, ` +
      `${FERRY_LINES.reduce((n, l) => n + l.avgangar.length, 0)} dagliga färjeturer`
  );
  console.log(
    `Atlas: ${Object.keys(COUNTRY_FACTS).length} länder med fakta, ` +
      `${Object.keys(CITY_POPULATION).length} städer med folkmängd`
  );
  console.log(`Frågor: ${total}`);
  console.log(
    `Städer: ${CITIES.length} · Jobb: ${JOBS.length} · Jobbfrågor: ${Object.values(
      JOB_QUESTIONS
    ).reduce((a, b) => a + b.length, 0)}`
  );
} finally {
  await server.close();
}

if (warnings.length > 0) {
  console.log(
    `\n${warnings.length} jobb har tunn frågebank i förhållande till skiftet.` +
      ' Skiften varierar då lite mellan besöken. Stoppar inte bygget.'
  );
  for (const w of warnings.slice(0, 5)) console.log(`  - ${w}`);
  if (warnings.length > 5) console.log(`  ... och ${warnings.length - 5} till`);
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem hittades:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('Speldatan är giltig.');
