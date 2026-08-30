/**
 * Letar efter frågor som går att svara på utan att kunna svaret.
 *
 * Två läckor har hittats i skarp drift och båda är lätta att göra om:
 *
 * 1. Frågan bär svaret i sin egen formulering. "Vilken färgflagga på en
 *    Bangkok-expressbåt visar vilken linje den går?" hade svaret "Flaggans
 *    färg anger linjen" - ordet stod i frågan.
 * 2. Fotot pekar ut svaret. "När bör du avstå från massage?" visades med en
 *    febertermometer, och svaret var "Vid feber eller akut inflammation".
 *
 * Skriptet är ett grovt nät, inte en kontroll: det flaggar också frågor där
 * ekot är hela poängen ("Vilken av bilderna visar en marulk?" ska besvaras
 * med Marulk). Därför ingår det inte i npm run validate utan körs för hand
 * när frågebanken byggts ut, och träffarna läses igenom av en människa.
 *
 * Körs med: node scripts/granska-fragor.mjs
 */
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const { QUIZ_IMAGES } = await server.ssrLoadModule('/src/data/quizImages.ts');
  const { JOB_QUESTIONS } = await server.ssrLoadModule('/src/data/questions/jobQuestions.ts');
  const { CITY_QUESTIONS } = await server.ssrLoadModule('/src/data/questions/cityQuestions.ts');
  const BILD = new Map(QUIZ_IMAGES.map((b) => [b.id, b]));

  const platt = (t) =>
    String(t).toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e');
  const ord = (t, minst) => platt(t).split(/[^a-z0-9]+/).filter((w) => w.length >= minst);

  /** Frågor som uttryckligen handlar om fotot. Där ska bilden ge svaret. */
  const HANVISAR =
    /(på bilden|av bilderna|bilden visar|bilden syns|på fotot|på tavlan|som på bilden|bilden på|syns i mikroskop|här på scen|den här|du guidar framför|på satellitbilden|här ovan|bilden är tagen)/i;

  const textEko = [];
  const bildEko = [];
  const talEko = [];

  /*
   * Talord som svar. "Hur många lag fanns i NHL:s Original Six?" hade svaret
   * Sex, och ordet stod i frågan - på engelska, vilket är varför den vanliga
   * ordjämförelsen missade den. Här jämförs själva talet i stället för ordet,
   * på svenska, engelska och som siffra.
   */
  const TAL = {
    1: ['ett', 'en', 'one'],
    2: ['två', 'two'],
    3: ['tre', 'three'],
    4: ['fyra', 'four'],
    5: ['fem', 'five'],
    6: ['sex', 'six'],
    7: ['sju', 'seven'],
    8: ['åtta', 'eight'],
    9: ['nio', 'nine'],
    10: ['tio', 'ten'],
    11: ['elva', 'eleven'],
    12: ['tolv', 'twelve'],
  };
  /** Vilket tal ett svar står för, eller null om det inte är ett tal. */
  const talet = (svar) => {
    const t = platt(svar).trim();
    if (/^\d+$/.test(t)) return Number(t);
    for (const [n, ord] of Object.entries(TAL)) if (ord.includes(t)) return Number(n);
    return null;
  };

  const kolla = (etikett, fragor) => {
    for (const q of fragor) {
      if (!q.a || q.a.length < 2) continue;
      /*
       * Jämförelsen görs på stam, inte på hela ordet. "Vad kallas den
       * valutareserv en centralbank håller?" med svaret Valutareserven slank
       * igenom när orden jämfördes hela: frågan har den obestämda formen och
       * svaret den bestämda. Fem tecken räcker för att fånga böjningen och
       * ger få nya falska träffar.
       */
      /*
       * Bildfrågor av typen "Vilken av blommorna är en lotus?" ska eka - där
       * är igenkänningen hela uppgiften. De sorteras bort ur textnätet av
       * samma skäl som ur bildnätet, annars drunknar de riktiga fynden.
       */
      if (/vilke[nt] av (dem|de |bilderna|blommorna|kryddorna|fiskarna|djuren|frukterna|verken|instrumenten|klubborna)|kunden (ber om|vill ha)|gästen har beställt/i.test(q.q)) {
        // gå vidare till bildkontrollen nedan
      } else {
      const stam = (t) => ord(t, 5).map((w) => w.slice(0, 5));
      const fel = new Set(q.a.slice(1).flatMap(stam));
      // 1. Rätt svar delar en ordstam med frågan som inget felsvar har.
      const iFragan = platt(q.q);
      const eko = stam(q.a[0]).filter((w) => iFragan.includes(w) && !fel.has(w));
      if (eko.length) textEko.push(`${etikett} | ${eko.join(',')} | ${q.q} -> ${q.a[0]}`);
      }

      // 1b. Svaret är ett tal som redan står i frågan, med ord eller siffra.
      const n = talet(q.a[0]);
      if (n !== null) {
        const ord = [String(n), ...(TAL[n] ?? [])];
        const iTexten = ord.some((o) => new RegExp(`(^|[^a-zåäö0-9])${o}([^a-zåäö0-9]|$)`, 'i').test(platt(q.q)));
        if (iTexten) talEko.push(`${etikett} | ${q.q} -> ${q.a[0]}`);
      }

      // 2. Fotot bär svaret, och frågan handlar inte om fotot.
      if (!q.bild || q.bild.startsWith('stad') || HANVISAR.test(q.q)) continue;
      const b = BILD.get(q.bild);
      if (!b) continue;
      const heu = platt(`${b.id} ${b.alt ?? ''}`);
      const traff = (alt) => ord(alt, 5).filter((w) => heu.includes(w));
      if (traff(q.a[0]).length && !q.a.slice(1).some((d) => traff(d).length)) {
        bildEko.push(`${etikett} | ${q.bild} (${b.alt}) | ${q.q} -> ${q.a[0]}`);
      }
    }
  };

  for (const [id, f] of Object.entries(JOB_QUESTIONS)) kolla(`jobb:${id}`, f);
  for (const [id, f] of Object.entries(CITY_QUESTIONS)) kolla(`stad:${id}`, f);

  console.log(`\nSvaret står i frågan: ${textEko.length} att läsa igenom`);
  for (const r of textEko) console.log('  ' + r);
  console.log(`\nTalet står redan i frågan: ${talEko.length} att läsa igenom`);
  for (const r of talEko) console.log('  ' + r);
  console.log(`\nFotot kan peka ut svaret: ${bildEko.length} att läsa igenom`);
  for (const r of bildEko) console.log('  ' + r);
  console.log('\nBåda listorna innehåller frågor där ekot är avsikten. Läs, döm, rätta.');
} finally {
  await server.close();
}
