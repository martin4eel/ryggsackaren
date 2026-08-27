/**
 * Hämtar frågornas bilder från Wikimedia Commons/Wikipedia.
 *
 * Arbetsordern står i src/data/quizImages.ts, så att spelets bildlista och
 * hämtningen aldrig kan glida isär. För varje post hämtas antingen en
 * Wikipedia-artikels ledningsbild eller en namngiven Commons-fil, och sparas
 * som public/quiz/<id>.jpg. Upphovsman och licens skrivs till
 * public/quiz/ATTRIBUTION.md.
 *
 * Kör manuellt när en bild läggs till:  node scripts/fetch-quiz-images.mjs
 * Bilder som redan finns hämtas inte om, så skriptet går att köra om.
 * Lägg till --om för att tvinga fram en ny hämtning av allt.
 */

import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
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
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok || !res.body) {
    throw new Error(`${res.status} ${res.statusText} vid hämtning`);
  }
  await pipeline(res.body, createWriteStream(dest));
}

mkdirSync(OUT_DIR, { recursive: true });

const credits = [];
let failed = 0;
let hamtade = 0;

for (const bild of QUIZ_IMAGES) {
  const dest = join(OUT_DIR, `${bild.id}.jpg`);
  try {
    const { thumbUrl, fileName } = bild.file
      ? await commonsFile(bild.file, bild.bred ? 1400 : 900)
      : await pageImage(bild.article);
    const credit = await fileCredits(fileName);
    credits.push({ id: bild.id, alt: bild.alt, fileName, ...credit });
    if (existsSync(dest) && !FORCE) {
      console.log(`= ${bild.id}: finns redan`);
      continue;
    }
    await download(thumbUrl, dest);
    hamtade++;
    console.log(`✓ ${bild.id}: ${bild.file ?? bild.article} -> ${fileName}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${bild.id}: ${err.message}`);
  }
}

if (credits.length > 0) {
  const lines = [
    '# Bildkrediter, frågebilder',
    '',
    'Bilderna i den här mappen kommer från Wikimedia Commons/Wikipedia och',
    'hämtas av `scripts/fetch-quiz-images.mjs`, som också skriver den här',
    'filen. Alla är riktiga fotografier eller avfotograferade konstverk.',
    '',
  ];
  for (const c of credits.sort((a, b) => a.id.localeCompare(b.id, 'sv'))) {
    lines.push(
      `- **${c.id}.jpg** (${c.alt}) – [${c.fileName}](${c.page}) av ${c.artist}, ${c.license}.`
    );
  }
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
