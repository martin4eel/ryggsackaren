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
import { existsSync, readFileSync } from 'node:fs';
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
  const { CITY_FACTS } = await load('/src/data/cityFacts.ts');
  const { COIN_QUESTIONS } = await load('/src/data/questions/coinQuestions.ts');
  const { CITY_CLIMATE } = await load('/src/data/climate.ts');
  const { CITY_HEADLINES } = await load('/src/data/headlines.ts');
  const { CITY_PAPERS } = await load('/src/data/newspapers.ts');
  const { CITIES } = await load('/src/data/cities.ts');
  const { QUIZ_IMAGES } = await load('/src/data/quizImages.ts');
  const bildManifest = new Set(QUIZ_IMAGES.map((b) => b.id));
  const { JOBS } = await load('/src/data/jobs.ts');
  const { SOUVENIR_BY_ID } = await load('/src/data/souvenirs.ts');
  const { LAND_ADJACENCY, FERRY_LINKS, FERRY_LINES } = await load(
    '/src/data/transport.ts'
  );
  const { OPERATORS } = await load('/src/data/operators.ts');
  const { COUNTRY_FACTS, CITY_POPULATION } = await load('/src/data/facts.ts');
  const { EVENTS } = await load('/src/data/events.ts');
  const { mysterySpotCount } = await load('/src/game/events.ts');
  const { availableRoutes } = await load('/src/game/travel.ts');

  const jobById = Object.fromEntries(JOBS.map((j) => [j.id, j]));
  /** Alla bild-id:n som frågorna hänvisar till, med var de stod. */
  const bildIdn = new Set();
  const seen = new Map();
  let total = 0;

  const checkQuestions = (label, questions) => {
    for (const q of questions) {
      total += 1;
      if (!q.q?.trim()) problems.push(`${label}: tom frågetext`);
      /**
       * En reglagefråga har inga alternativ att välja bland - svaret dras
       * fram på en skala. `a[0]` bär det rätta svaret skrivet i klartext, för
       * facittexten efteråt.
       */
      if (q.reglage) {
        if (!Array.isArray(q.a) || q.a.length !== 1)
          problems.push(`${label}: reglagefråga ska ha exakt ett svar i a: ${q.q}`);
        const r = q.reglage;
        if (!(r.max > r.min)) problems.push(`${label}: reglagets max är inte större än min: ${q.q}`);
        if (!(r.steg > 0)) problems.push(`${label}: reglaget saknar steglängd: ${q.q}`);
        if (r.svar < r.min || r.svar > r.max)
          problems.push(`${label}: reglagets svar ligger utanför skalan: ${q.q}`);
        if (!(r.tolerans >= 0)) problems.push(`${label}: reglaget saknar tolerans: ${q.q}`);
        // En tolerans som täcker halva skalan gör frågan gratis.
        if (r.tolerans * 2 > (r.max - r.min) * 0.25)
          problems.push(`${label}: reglagets tolerans är för generös: ${q.q}`);
        if (q.bilder) problems.push(`${label}: reglagefråga kan inte ha bildalternativ: ${q.q}`);
        continue;
      }
      if (!Array.isArray(q.a) || q.a.length < 3)
        problems.push(`${label}: färre än 3 alternativ: ${q.q}`);
      /** Bildfrågor: lika många bilder som alternativ, och alla ska finnas. */
      if (q.bilder) {
        if (q.bilder.length !== q.a.length)
          problems.push(`${label}: ${q.bilder.length} bilder men ${q.a.length} alternativ: ${q.q}`);
        for (const id of q.bilder) bildIdn.add(`${label}|${id}`);
      }
      if (q.bild) bildIdn.add(`${label}|${q.bild}`);
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

  const banker = [
    ...Object.entries(JOB_QUESTIONS).map(([id, pool]) => [`jobb ${id}`, pool]),
    ...Object.entries(CITY_QUESTIONS).map(([id, pool]) => [`stad ${id}`, pool]),
  ];
  for (const [jobId, pool] of banker) {
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        if (stam(pool[i].a[0]) !== stam(pool[j].a[0])) continue;
        const A = nyckelord(pool[i].q);
        const B = nyckelord(pool[j].q);
        const gemensamma = [...A].filter((w) => B.has(w)).length;
        const andel = gemensamma / Math.max(1, Math.min(A.size, B.size));
        if (andel >= 0.34)
          problems.push(
            `${jobId}: två frågor med samma svar "${pool[i].a[0]}" och samma ämne:\n` +
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
    if (!existsSync(join(ROOT, 'public', 'cities', `${city.id}-stad.jpg`)))
      problems.push(`stad ${city.id} saknar stadsbild public/cities/${city.id}-stad.jpg – kör node scripts/fetch-city-photos.mjs`);

    const fakta = CITY_FACTS[city.id] ?? [];
    if (fakta.length < 4)
      problems.push(`stad ${city.id} har bara ${fakta.length} faktastycken i broschyren, minst 4 behövs`);

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
    sortering: { needed: 2 },
    instrument: { needed: 3 },
    sekvens: { needed: 3 },
    precision: { needed: 1 },
    vaxel: { needed: 3 },
    traffa: { needed: 2 },
    balans: { needed: 1 },
    takt: { needed: 2 },
    bildval: { needed: 1 },
  };

  /**
   * Huvudkategorierna: varje jobb hör till en, varje kategori måste ha minst
   * ett jobb i löneklass 1 (annars går det inte att börja där), och de bör
   * finnas i tillräckligt många städer för att stegen ska gå att klättra.
   */
  const HUVUD = ['vetenskap', 'konst', 'praktiskt', 'aventyr', 'sport', 'mat'];
  for (const h of HUVUD) {
    const klass1 = JOBS.filter((j) => j.huvud === h && j.wageClass === 1);
    const stader = new Set(CITIES.filter((c) => c.jobs.some((id) => klass1.some((j) => j.id === id))).map((c) => c.id));
    if (klass1.length === 0) problems.push(`huvudkategori ${h} saknar jobb i löneklass 1`);
    else if (stader.size < 3)
      problems.push(`huvudkategori ${h} har klass 1-jobb i bara ${stader.size} städer, minst 3 behövs`);
    if (!JOBS.some((j) => j.huvud === h && j.wageClass === 3))
      problems.push(`huvudkategori ${h} saknar jobb i löneklass 3`);
  }

  for (const job of JOBS) {
    if (!HUVUD.includes(job.huvud))
      problems.push(`jobb ${job.id} har okänd huvudkategori ${job.huvud}`);
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

    /**
     * Arkadmomentet. Löneklass 1 har inget; klass 2 och 3 ska ha ett moment
     * som bygger på foton (bildval, eller sortering med foton på bandet),
     * med några namngivna undantag som är bra på egna meriter.
     */
    const mg = job.minigame;
    const UNDANTAG = { skateboardinstruktor: 'balans', hockeytranare: 'sortering' };
    if (!mg) {
      if (job.wageClass >= 2) problems.push(`jobb ${job.id} (klass ${job.wageClass}) saknar minispel`);
    } else {
      if (job.wageClass === 1)
        problems.push(`jobb ${job.id} är klass 1 och ska inte ha något minispel`);
      const fotoSortering =
        mg.kind === 'sortering' && (mg.pool ?? []).flat().every((x) => typeof x === 'object');
      const okej = mg.kind === 'bildval' || fotoSortering || UNDANTAG[job.id] === mg.kind;
      if (job.wageClass >= 2 && !okej)
        problems.push(`jobb ${job.id}: minispelet ${mg.kind} bygger inte på foton`);
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

      if (mg.kind === 'bildval') {
        const katalog = new Set((mg.bildval ?? []).map((b) => b.bild));
        if (katalog.size < 6)
          problems.push(`jobb ${job.id}: bildvalet behöver minst 6 foton i katalogen, har ${katalog.size}`);
        const finnsBild = (id) =>
          bildManifest.has(id) || (id.startsWith('stad:') && CITIES.some((c) => c.id === id.slice(5)));
        for (const b of mg.bildval ?? []) {
          if (!finnsBild(b.bild))
            problems.push(`jobb ${job.id}: bildvalet pekar på okänd bild ${b.bild}`);
        }
        if (!Array.isArray(mg.kunder) || mg.kunder.length < 8)
          problems.push(`jobb ${job.id}: bildvalet behöver minst 8 kunder, har ${mg.kunder?.length ?? 0}`);
        for (const k of mg.kunder ?? []) {
          if (!katalog.has(k.svar))
            problems.push(`jobb ${job.id}: kunden "${k.text}" vill ha ${k.svar}, som inte finns i katalogen`);
          for (const n of k.nastan ?? [])
            if (!katalog.has(n))
              problems.push(`jobb ${job.id}: lockbetet ${n} finns inte i katalogen`);
        }
      }

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
          const flat = mg.pool.flat().map((x) => (typeof x === 'string' ? x : x.bild));
          for (const x of mg.pool.flat()) {
            if (typeof x === 'object' && !(bildManifest.has(x.bild) || (x.bild.startsWith('stad:') && CITIES.some((c) => c.id === x.bild.slice(5)))))
              problems.push(`jobb ${job.id}: sorteringen pekar på okänd bild ${x.bild}`);
            if (typeof x === 'object' && !x.namn?.trim())
              problems.push(`jobb ${job.id}: fotot ${x.bild} på bandet saknar namn`);
          }
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

  /**
   * Frågebilderna. En fråga som pekar på en bild som inte finns visar en
   * bruten bildikon mitt i ett arbetsskift, och en bild i manifestet utan fil
   * på disken gör samma sak. Båda ska stoppa bygget.
   */
  for (const b of QUIZ_IMAGES) {
    if (!b.alt?.trim()) problems.push(`bilden ${b.id} saknar alt-text`);
    if (!b.article && !b.file)
      problems.push(`bilden ${b.id} saknar både artikel och Commons-fil`);
    if (!existsSync(join(ROOT, 'public', 'quiz', `${b.id}.webp`)))
      problems.push(
        `bilden ${b.id} saknar fil i public/quiz/ – kör node scripts/fetch-quiz-images.mjs`
      );
  }
  /**
   * Service workern cachar bilderna ur quiz/manifest.json, som hämtskriptet
   * skriver. Saknas en bild där får den som sitter på ett flyg en bruten
   * bildikon mitt i ett skift, och det märks aldrig under utveckling.
   */
  const manifestFil = join(ROOT, 'public', 'quiz', 'manifest.json');
  const manifest = new Set(
    existsSync(manifestFil) ? JSON.parse(readFileSync(manifestFil, 'utf8')) : []
  );
  for (const b of QUIZ_IMAGES) {
    if (!manifest.has(b.id))
      problems.push(`bilden ${b.id} saknas i public/quiz/manifest.json – kör node scripts/fetch-quiz-images.mjs`);
  }

  for (const post of bildIdn) {
    const [label, id] = post.split('|');
    if (id.startsWith('stad:') || id.startsWith('stadsbild:')) {
      const stad = id.slice(id.indexOf(':') + 1);
      if (!cityById[stad])
        problems.push(`${label}: bilden pekar på okänd stad: ${id}`);
      continue;
    }
    if (!bildManifest.has(id))
      problems.push(`${label}: bilden ${id} saknas i data/quizImages.ts`);
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

  /** Väder och tidning: varje stad behöver ett klimat och minst två rubriker. */
  for (const c of CITIES) {
    if (!CITY_CLIMATE[c.id]) problems.push(`${c.name} saknar klimat i data/climate.ts`);
    if ((CITY_HEADLINES[c.id]?.length ?? 0) < 2)
      problems.push(`${c.name} har färre än två rubriker i data/headlines.ts`);
    const t = CITY_PAPERS[c.id];
    if (!t) problems.push(`${c.name} saknar tidning i data/newspapers.ts`);
    else {
      if ((t.artiklar?.length ?? 0) < 3)
        problems.push(`${c.name}: tidningen har färre än tre artiklar`);
      if ((t.notiser?.length ?? 0) < 4)
        problems.push(`${c.name}: tidningen har färre än fyra notiser`);
    }
  }

  /**
   * Myntfrågorna: en per stad, alla med en bild. En stad utan myntfråga får en
   * bricka som inte går att lösa ut, och en fråga utan bild är inte den sorts
   * fråga brickan lovar.
   */
  for (const c of CITIES) {
    const f = COIN_QUESTIONS[c.id];
    if (!f) {
      problems.push(`${c.name} saknar myntfråga i questions/coinQuestions.ts`);
      continue;
    }
    if (!f.bild && !f.bilder)
      problems.push(`myntfrågan för ${c.name} saknar bild`);
  }
  checkQuestions('myntfrågor', Object.values(COIN_QUESTIONS));

  /**
   * Atlasens fakta. En stad utan folkmängd visar en tom rad, och ett land utan
   * fakta visar en ursäkt i stället för en uppslagssida - båda ser ut som fel
   * för den som slår upp landet hen just rest till.
   */
  for (const c of CITIES) {
    if (!CITY_POPULATION[c.id])
      problems.push(`${c.name} saknar folkmängd i data/facts.ts`);
    /**
     * Varje stad måste ha minst en mystikbricka. En stad utan blir en stad där
     * ingenting kan hittas, och det är inte en stad man vill komma till.
     */
    if (mysterySpotCount(c.id) < 1)
      problems.push(`${c.name} har inga mystikbrickor på stadsbilden`);
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

  /**
   * Händelserna. En trasig händelse märks först när den slår till, kanske
   * timmar in i en resa, och då är det för sent att göra något åt den.
   */
  const TRIGGERS = new Set([
    'resa',
    'boende',
    'arbete',
    'sevardhet',
    'stad',
    'handel',
    'mote',
    'vantan',
  ]);
  const TONER = new Set(['bra', 'daligt', 'blandat', 'absurd', 'allvar', 'stamning']);
  const PLATSHALLARE = /\{(\w+)\}/g;
  const KANDA_PLATSHALLARE = new Set(['stad', 'land', 'sevardhet']);
  const eventIds = new Set();
  const perTrigger = new Map();

  for (const e of EVENTS) {
    const namn = `händelsen ${e.id}`;
    if (eventIds.has(e.id)) problems.push(`${namn} har samma id som en annan`);
    eventIds.add(e.id);
    if (!e.title?.trim()) problems.push(`${namn} saknar rubrik`);
    if (!e.text?.trim()) problems.push(`${namn} saknar text`);
    if (!TONER.has(e.tone)) problems.push(`${namn} har okänd ton: ${e.tone}`);
    if (!(e.weight > 0)) problems.push(`${namn} har ingen vikt`);
    if (!Array.isArray(e.triggers) || e.triggers.length === 0)
      problems.push(`${namn} hör inte till något tillfälle`);
    for (const t of e.triggers ?? []) {
      if (!TRIGGERS.has(t)) problems.push(`${namn} har okänt tillfälle: ${t}`);
      perTrigger.set(t, (perTrigger.get(t) ?? 0) + 1);
    }
    // Platshållare som inte fylls i skulle skrivas ut som {stad} i klartext.
    const texter = [
      e.title,
      e.text,
      ...(e.choices ?? []).flatMap((c) => [c.label, c.hint, ...c.outcomes.map((o) => o.text)]),
    ].filter(Boolean);
    for (const text of texter) {
      for (const m of String(text ?? '').matchAll(PLATSHALLARE)) {
        if (!KANDA_PLATSHALLARE.has(m[1]))
          problems.push(`${namn} har okänd platshållare: {${m[1]}}`);
      }
    }
    if (e.choices) {
      if (e.choices.length < 2) problems.push(`${namn} har bara ett val`);
      if (e.choices.length > 3)
        problems.push(`${namn} har fler än tre val, och tangenterna räcker till A-C`);
      if (e.effect)
        problems.push(`${namn} har både val och en egen effekt; effekten skulle aldrig gå fram`);
      for (const [i, c] of e.choices.entries()) {
        if (!c.label?.trim()) problems.push(`${namn}, val ${i + 1}: saknar text`);
        if (!Array.isArray(c.outcomes) || c.outcomes.length === 0)
          problems.push(`${namn}, val ${i + 1}: saknar utfall`);
        for (const o of c.outcomes ?? []) {
          if (!o.text?.trim()) problems.push(`${namn}, val ${i + 1}: utfall utan text`);
          if (o.tone && !TONER.has(o.tone))
            problems.push(`${namn}, val ${i + 1}: okänd ton ${o.tone}`);
          for (const id of [o.effect?.souvenir].filter(Boolean)) {
            if (!SOUVENIR_BY_ID[id])
              problems.push(`${namn} delar ut en souvenir som inte finns: ${id}`);
          }
        }
      }
    } else if (!e.effect) {
      problems.push(`${namn} har varken val eller effekt`);
    }
  }

  /**
   * Varje tillfälle behöver ett djup som räcker. Med bara ett par händelser
   * per tillfälle ser en spelare samma sak andra gången hen går ut på stan.
   */
  for (const t of TRIGGERS) {
    const n = perTrigger.get(t) ?? 0;
    if (n < 5) problems.push(`tillfället ${t} har bara ${n} händelser, minst 5 krävs`);
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
  console.log(
    `Händelser: ${EVENTS.length} stycken, ` +
      `${EVENTS.filter((e) => e.choices).length} med val, ` +
      `${EVENTS.reduce((n, e) => n + (e.choices?.length ?? 0), 0)} valmöjligheter, ` +
      `${EVENTS.reduce((n, e) => n + (e.choices ?? []).reduce((m, c) => m + c.outcomes.length, 0), 0)} utfall`
  );
  console.log(
    `Stadsbilder: ${CITIES.reduce((n, c) => n + mysterySpotCount(c.id), 0)} ` +
      `mystikbrickor totalt, ${Math.min(...CITIES.map((c) => mysterySpotCount(c.id)))}-` +
      `${Math.max(...CITIES.map((c) => mysterySpotCount(c.id)))} per stad`
  );
  console.log(
    `Bilder: ${QUIZ_IMAGES.length} frågefoton, ` +
      `${[...bildIdn].length} bildhänvisningar i frågorna`
  );
  console.log(
    `Myntfrågor: ${Object.keys(COIN_QUESTIONS).length} stycken, en per stad, alla med foto`
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
