/**
 * Hämtar frågornas bilder från Wikimedia Commons/Wikipedia.
 *
 * Arbetsordern står i src/data/quizImages.ts, så att spelets bildlista och
 * hämtningen aldrig kan glida isär. För varje post hämtas antingen en
 * Wikipedia-artikels ledningsbild eller en namngiven Commons-fil, och sparas
 * som public/quiz/<id>.webp (hämtas som jpg, konverteras av
 * compress-quiz-images.py). Upphovsman och licens skrivs till
 * public/quiz/ATTRIBUTION.md.
 *
 * Kör manuellt när en bild läggs till:  node scripts/fetch-quiz-images.mjs
 * Bilder som redan finns hämtas inte om, så skriptet går att köra om.
 * Lägg till --om för att tvinga fram en ny hämtning av allt.
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'quiz');
const ATTRIBUTION_FILE = join(OUT_DIR, 'ATTRIBUTION.md');
const FORCE = process.argv.includes('--om');

const UA =
  'Ryggsackaren/1.0 (https://github.com/martin4eel/ryggsackaren; spelprojekt)';

const server = await createServer({
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
});
const { QUIZ_IMAGES } = await server.ssrLoadModule('/src/data/quizImages.ts');

const paus = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Wikimedia svarar 429 om man frågar för tätt. Då väntar vi och försöker
 * igen, med längre paus för varje gång, i stället för att ge upp bilden.
 */
async function api(url) {
  for (let forsok = 0; ; forsok++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (res.status === 429 && forsok < 5) {
      await paus(3000 * (forsok + 1));
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} för ${url}`);
  }
}

/** Ledningsbilden för en Wikipedia-artikel, i 900 pixlars bredd. */
async function pageImage(article) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1' +
    '&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=900' +
    `&titles=${encodeURIComponent(article)}`;
  const data = await api(url);
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page?.thumbnail?.source) {
    throw new Error(`ingen bild för artikeln "${article}"`);
  }
  return { thumbUrl: page.thumbnail.source, fileName: page.pageimage };
}

/** En namngiven Commons-fil i 900 pixlars bredd. */
async function commonsFile(fileName, bredd = 900) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    `&titles=File:${encodeURIComponent(fileName)}` +
    `&prop=imageinfo&iiprop=url&iiurlwidth=${bredd}`;
  const data = await api(url);
  const thumb = Object.values(data.query?.pages ?? {})[0]?.imageinfo?.[0]?.thumburl;
  if (!thumb) throw new Error(`Commons-filen "${fileName}" hittades inte`);
  return { thumbUrl: thumb, fileName };
}

async function fileCredits(fileName) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    `&titles=File:${encodeURIComponent(fileName)}` +
    '&prop=imageinfo&iiprop=extmetadata%7Curl';
  try {
    const data = await api(url);
    const info = Object.values(data.query?.pages ?? {})[0]?.imageinfo?.[0];
    const meta = info?.extmetadata ?? {};
    const strip = (html) =>
      String(html ?? '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return {
      artist: strip(meta.Artist?.value) || 'okänd',
      license: strip(meta.LicenseShortName?.value) || 'se Commons',
      page: info?.descriptionurl ?? '',
    };
  } catch {
    return { artist: 'okänd', license: 'se Commons', page: '' };
  }
}

async function download(url, dest) {
  for (let forsok = 0; ; forsok++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok && res.body) {
      await pipeline(res.body, createWriteStream(dest));
      return;
    }
    // Samma 429 som API:t ger när man hämtar för tätt. Vänta och försök igen.
    if (res.status === 429 && forsok < 6) {
      await paus(4000 * (forsok + 1));
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} vid hämtning`);
  }
}

mkdirSync(OUT_DIR, { recursive: true });

const credits = [];
let failed = 0;
let hamtade = 0;

/**
 * Krediterna för bilder som redan finns läses ur den befintliga
 * ATTRIBUTION.md i stället för att slås upp igen: med tusen bilder tog
 * uppslagningarna längre tid än hämtningen, och Wikimedia strypte oss.
 */
const gamlaKrediter = new Map();
if (existsSync(ATTRIBUTION_FILE)) {
  for (const rad of readFileSync(ATTRIBUTION_FILE, 'utf8').split('\n')) {
    const m = rad.match(/^- \*\*([a-z0-9-]+)\.webp\*\* .*$/);
    if (m) gamlaKrediter.set(m[1], rad);
  }
}
const radKrediter = [];

for (const bild of QUIZ_IMAGES) {
  // Bilder med egen källa ligger redan i public/quiz och ska inte hämtas om.
  if (bild.lokal) continue;
  const dest = join(OUT_DIR, `${bild.id}.jpg`);
  const klar = join(OUT_DIR, `${bild.id}.webp`);
  if ((existsSync(klar) || existsSync(dest)) && !FORCE && gamlaKrediter.has(bild.id)) {
    radKrediter.push(gamlaKrediter.get(bild.id));
    continue;
  }
  try {
    const { thumbUrl, fileName } = bild.file
      ? await commonsFile(bild.file, bild.bred ? 1400 : 900)
      : await pageImage(bild.article);
    const credit = await fileCredits(fileName);
    credits.push({ id: bild.id, alt: bild.alt, fileName, ...credit });
    if ((existsSync(klar) || existsSync(dest)) && !FORCE) {
      console.log(`= ${bild.id}: finns redan`);
      continue;
    }
    await download(thumbUrl, dest);
    hamtade++;
    // Andrum mellan bilderna, så att vi inte blir strypta i onödan.
    await paus(600);
    console.log(`✓ ${bild.id}: ${bild.file ?? bild.article} -> ${fileName}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${bild.id}: ${err.message}`);
  }
}

/**
 * Manifestet är service workerns lista över vad som ska cachas för offline-
 * spel. Det skrivs härifrån så att listan aldrig kan glida isär från
 * quizImages.ts, och så att ingen behöver underhålla den för hand.
 */
writeFileSync(
  join(OUT_DIR, 'manifest.json'),
  JSON.stringify(QUIZ_IMAGES.map((b) => b.id)) + '\n'
);

if (credits.length > 0 || radKrediter.length > 0) {
  const lines = [
    '# Bildkrediter, frågebilder',
    '',
    'Bilderna i den här mappen kommer från Wikimedia Commons/Wikipedia och',
    'hämtas av `scripts/fetch-quiz-images.mjs`, som också skriver den här',
    'filen. Alla är riktiga fotografier eller avfotograferade konstverk.',
    '',
  ];
  for (const c of credits) {
    radKrediter.push(
      `- **${c.id}.webp** (${c.alt}) – [${c.fileName}](${c.page}) av ${c.artist}, ${c.license}.`
    );
  }
  for (const rad of radKrediter.sort((a, b) => a.localeCompare(b, 'sv'))) lines.push(rad);
  lines.push('');
  writeFileSync(ATTRIBUTION_FILE, lines.join('\n'));
  console.log(`\nAttribution skriven till ${ATTRIBUTION_FILE}`);
}

if (hamtade > 0) {
  console.log('\nKomprimerar ...');
  const py = spawnSync('python3', [join(ROOT, 'scripts', 'compress-quiz-images.py')], {
    stdio: 'inherit',
  });
  if (py.status !== 0) {
    console.error('Komprimeringen misslyckades. Kör den manuellt.');
  }
}

await server.close();

if (failed > 0) {
  console.error(`\n${failed} bilder misslyckades.`);
  process.exit(1);
}
