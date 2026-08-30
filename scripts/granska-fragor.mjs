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

  const kolla = (etikett, fragor) => {
    for (const q of fragor) {
      if (!q.a || q.a.length < 2) continue;
      const fel = new Set(q.a.slice(1).flatMap((d) => ord(d, 6)));
      // 1. Rätt svar delar ett ord med frågan som inget felsvar har.
      const iFragan = platt(q.q);
      const eko = ord(q.a[0], 6).filter((w) => iFragan.includes(w) && !fel.has(w));
      if (eko.length) textEko.push(`${etikett} | ${eko.join(',')} | ${q.q} -> ${q.a[0]}`);

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
  console.log(`\nFotot kan peka ut svaret: ${bildEko.length} att läsa igenom`);
  for (const r of bildEko) console.log('  ' + r);
  console.log('\nBåda listorna innehåller frågor där ekot är avsikten. Läs, döm, rätta.');
} finally {
  await server.close();
}
