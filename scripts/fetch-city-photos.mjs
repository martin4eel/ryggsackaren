/**
 * Hämtar stadsfoton från Wikimedia Commons/Wikipedia.
 *
 * För varje stad slås en Wikipedia-artikel upp (oftast stadens landmärke),
 * dess ledningsbild hämtas i 1280 pixlars bredd och sparas som
 * public/cities/<stads-id>.jpg. Upphovsman och licens hämtas från Commons
 * och skrivs till public/cities/ATTRIBUTION.md.
 *
 * Kör manuellt när en stad läggs till:  node scripts/fetch-city-photos.mjs
 * Skriptet laddar bara ner foton som saknas, så det går att köra om.
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'cities');
const ATTRIBUTION_FILE = join(OUT_DIR, 'ATTRIBUTION.md');

const UA =
  'Ryggsackaren/1.0 (https://github.com/martin4eel/ryggsackaren; spelprojekt)';

/**
 * Stads-id -> bildkälla. `article` är en Wikipedia-artikel (engelska) vars
 * ledningsbild används. `file` är en specifik Commons-fil – används när
 * ledningsbilden är stående eller missvisande, eftersom höjdpunkterna i
 * spelet beskärs till liggande format.
 */
const CITY_ARTICLES = {
  stockholm: { article: 'Vasa Museum' },
  malmo: { file: '19-07-12-Malmö-DJI 0765-Turning-Torso-RalfR.jpg' },
  goteborg: { article: 'Feskekôrka' },
  reykjavik: { article: 'Hallgrímskirkja' },
  london: { article: 'Tower Bridge' },
  paris: { file: 'Eiffel tower from trocadero.jpg' },
  amsterdam: { article: 'Rijksmuseum' },
  rom: { article: 'Colosseum' },
  istanbul: { article: 'Hagia Sophia' },
  moskva: { file: "Saint Basil's Cathedral, Red Square, Moscow, Russia.jpg" },
  kairo: { article: 'Great Pyramid of Giza' },
  marrakech: { file: 'Marrakech Koutoubia Mosque (54273634927).jpg' },
  nairobi: { article: 'Nairobi National Park' },
  kapstaden: { article: 'Table Mountain' },
  mumbai: { article: 'Gateway of India' },
  bangkok: { article: 'Wat Arun' },
  peking: { article: 'Forbidden City' },
  tokyo: {
    file: 'Tokyo Skytree, view from Kuramae-bashi bridge on Sumida-gawa river. (14555040147).jpg',
  },
  sydney: { article: 'Sydney Opera House' },
  auckland: { file: 'Auckland skyline from harbor bridge, 20 September 2019.jpg' },
  newyork: { file: 'Liberty Island photo Don Ramey Logan.jpg' },
  mexikocity: { article: 'Templo Mayor' },
  cusco: { article: 'Sacsayhuamán' },
  rio: { file: 'Christ the Redeemer - From Above.jpg' },
  kopenhamn: { article: 'Nyhavn' },
  oslo: { article: 'Oslo Opera House' },
  helsingfors: { article: 'Suomenlinna' },
  berlin: { article: 'Brandenburg Gate' },
  barcelona: { article: 'Park Güell' },
  lissabon: { article: 'Belém Tower' },
  aten: { article: 'Parthenon' },
  prag: { article: 'Charles Bridge' },
  dublin: { article: "Ha'penny Bridge" },
  dubai: { article: 'Dubai Marina' },
  amman: { article: 'Amman Citadel' },
  seoul: { article: 'Gyeongbokgung' },
  singapore: { article: 'Gardens by the Bay' },
  hanoi: { article: 'Hoàn Kiếm Lake' },
  kathmandu: { article: 'Boudhanath' },
  buenosaires: { article: 'Caminito' },
  havanna: { article: 'El Capitolio' },
  sanfrancisco: { article: 'Golden Gate Bridge' },
  dakar: { article: 'Gorée' },
  addisabeba: { article: 'Meskel Square' },
  melbourne: { article: 'Flinders Street railway station' },
  vasteras: { article: 'Anundshög' },
  koping: { file: 'Köping 2013-08-23 image01.jpg' },
  belgrad: { file: 'Pobednik monument, Kalemegdan, Belgrade.jpg' },
  hudiksvall: { file: 'Hudiksvall July 2014 05.jpg' },
  brescia: { file: 'Palazzo della Loggia e piazza Brescia.jpg' },
  sansebastian: { file: 'Donosti (112287257).jpeg' },
  oaxaca: { file: 'Monte Alban, Main Plaza, Building J, and the North Platform (20498776500).jpg' },
};

async function api(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} för ${url}`);
  return res.json();
}

/** Hämtar ledningsbilden för en Wikipedia-artikel. */
async function pageImage(article) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1' +
    `&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=1280` +
    `&titles=${encodeURIComponent(article)}`;
  const data = await api(url);
  const pages = Object.values(data.query?.pages ?? {});
  const page = pages[0];
  if (!page?.thumbnail?.source) {
    throw new Error(`Ingen bild hittades för artikeln "${article}"`);
  }
  return { thumbUrl: page.thumbnail.source, fileName: page.pageimage };
}

/** Hämtar en specifik Commons-fil i 1280 pixlars bredd. */
async function commonsFile(fileName) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    `&titles=File:${encodeURIComponent(fileName)}` +
    '&prop=imageinfo&iiprop=url&iiurlwidth=1280';
  const data = await api(url);
  const pages = Object.values(data.query?.pages ?? {});
  const thumb = pages[0]?.imageinfo?.[0]?.thumburl;
  if (!thumb) {
    throw new Error(`Commons-filen "${fileName}" hittades inte`);
  }
  return { thumbUrl: thumb, fileName };
}

/** Hämtar upphovsman och licens för en Commons-fil. */
async function fileCredits(fileName) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    `&titles=File:${encodeURIComponent(fileName)}` +
    '&prop=imageinfo&iiprop=extmetadata%7Curl';
  try {
    const data = await api(url);
    const pages = Object.values(data.query?.pages ?? {});
    const info = pages[0]?.imageinfo?.[0];
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
    throw new Error(`${res.status} ${res.statusText} vid hämtning av bild`);
  }
  await pipeline(res.body, createWriteStream(dest));
}

mkdirSync(OUT_DIR, { recursive: true });

/**
 * Stadsbilderna: en vy över själva staden - skyline, flygfoto, hustak - som
 * visas i stadsbilden och på startskärmen. Sevärdheten ovan är kvar på
 * frågorna och turistbyrån. Listan ligger i scripts/city-skylines.json.
 */
const SKYLINE_FILE = join(ROOT, 'scripts', 'city-skylines.json');
const CITY_SKYLINES = existsSync(SKYLINE_FILE)
  ? JSON.parse(readFileSync(SKYLINE_FILE, 'utf8'))
  : {};

const credits = [];
let failed = 0;

const jobb = [
  ...Object.entries(CITY_ARTICLES).map(([cityId, source]) => ({ cityId, source, fil: `${cityId}.jpg` })),
  ...Object.entries(CITY_SKYLINES).map(([cityId, source]) => ({ cityId, source, fil: `${cityId}-stad.jpg` })),
];

for (const { cityId, source, fil } of jobb) {
  const dest = join(OUT_DIR, fil);
  try {
    const { thumbUrl, fileName } = source.file
      ? await commonsFile(source.file)
      : await pageImage(source.article);
    const credit = await fileCredits(fileName);
    credits.push({ cityId, fil, source: source.file ?? source.article, fileName, ...credit });
    if (existsSync(dest)) {
      console.log(`= ${fil}: finns redan, uppdaterar bara attribution`);
      continue;
    }
    await download(thumbUrl, dest);
    console.log(`✓ ${fil}: ${source.file ?? source.article} -> ${fileName}`);
    await new Promise((r) => setTimeout(r, 600));
  } catch (err) {
    failed++;
    console.error(`✗ ${cityId}: ${err.message}`);
  }
}

if (credits.length > 0) {
  const lines = [
    '# Fotokrediter',
    '',
    'Stadsfotona i den här mappen kommer från Wikimedia Commons/Wikipedia.',
    'De hämtas av `scripts/fetch-city-photos.mjs`, som också skriver den här',
    'filen. Varje rad visar vilken fil som använts, vem som tagit bilden och',
    'under vilken licens den publicerats.',
    '',
  ];
  for (const c of credits) {
    lines.push(
      `- **${c.fil}** – [${c.fileName}](${c.page}) av ${c.artist}, ${c.license}.`
    );
  }
  lines.push('');
  writeFileSync(ATTRIBUTION_FILE, lines.join('\n'));
  console.log(`\nAttribution skriven till ${ATTRIBUTION_FILE}`);
}

if (failed > 0) {
  console.error(`\n${failed} foton misslyckades.`);
  process.exit(1);
}

// Komprimera nyhämtade foton om Pillow finns installerat.
const compress = spawnSync(
  'python3',
  [join(ROOT, 'scripts', 'compress-city-photos.py')],
  { stdio: 'inherit' }
);
if (compress.error) {
  console.warn('Kunde inte köra komprimeringen (python3/Pillow saknas?).');
}

console.log('\nKlart.');
