/**
 * Service worker för Upptäckaren.
 *
 * Strategi: network-first för sidnavigering, så att spelarna alltid får den
 * senaste versionen när de har täckning, men med cache som reserv så att
 * spelet fungerar offline när det väl laddats en gång. Byggda filresurser
 * har innehållshash i namnet och cachas därför permanent.
 *
 * Två cacher, inte en. Skalet versioneras och töms vid varje ny utgåva -
 * där ligger startsidan och de hashade bygg-filerna, som ändå byter namn.
 * Mediecachen versioneras inte: fotona heter likadant i alla utgåvor, och
 * ett versionsbyte ska inte tvinga varenda telefon att ladda ner nitton
 * megabyte stadsfoton en gång till bara för att en frågetext rättats.
 */

const SKAL = 'upptackaren-skal-v96';
const MEDIA = 'upptackaren-media-v1';

/**
 * Stadsfotona ligger med stabila namn under cities/ och hämtas in redan vid
 * installationen, så att stadsvyerna fungerar offline även på ställen man
 * inte besökt än. Listan matchar städerna i src/data/cities.ts.
 */
const CITY_PHOTOS = [
  'addisabeba',
  'amman',
  'amsterdam',
  'aten',
  'auckland',
  'bangkok',
  'barcelona',
  'berlin',
  'buenosaires',
  'cusco',
  'dakar',
  'dubai',
  'dublin',
  'goteborg',
  'hanoi',
  'havanna',
  'helsingfors',
  'istanbul',
  'kairo',
  'kapstaden',
  'kathmandu',
  'kopenhamn',
  'koping',
  'lissabon',
  'london',
  'malmo',
  'marrakech',
  'melbourne',
  'mexikocity',
  'moskva',
  'mumbai',
  'nairobi',
  'newyork',
  'oslo',
  'paris',
  'peking',
  'prag',
  'reykjavik',
  'rio',
  'rom',
  'sanfrancisco',
  'seoul',
  'singapore',
  'stockholm',
  'sydney',
  'tokyo',
  'vasteras',
].flatMap((id) => [`./cities/${id}.jpg`, `./cities/${id}-stad.jpg`]);

/**
 * Handlarens röster. Tre korta filer på ett par tiotals kilobyte, som hämtas
 * in vid installationen så att butiken låter likadant offline.
 */
const LJUD = [
  './ljud/handlare-a-1.m4a', './ljud/handlare-a-2.m4a', './ljud/handlare-a-3.m4a',
  './ljud/handlare-b-1.m4a', './ljud/handlare-b-2.m4a', './ljud/handlare-b-3.m4a',
];

/** Butikens ytor: vägg, disk och hyllplan, klippta ur ett träfoto. */
const BUTIK = ['./butik/butik-vagg.webp', './butik/butik-disk.webp', './butik/butik-bracka.webp', './butik/handlare-1.webp', './butik/handlare-2.webp'];

/**
 * Frågebilderna hämtas inte i förväg.
 *
 * Tidigare laddade den här filen ner alla bilder i quiz/manifest.json efter
 * aktiveringen - drygt femtio megabyte i sextonhundra filer. Det var illa
 * tänkt för ett spel som mest spelas i telefon. Nedladdningen slogs om
 * bandbredden med spelets egna bildhämtningar medan man satt och svarade på
 * frågor, och när en sådan hämtning missade försvann fotot ur frågan. På iOS
 * hann den dessutom aldrig bli klar: en overksam service worker stängs av
 * efter någon halvminut, och uppvärmningen behövde långt över hundra
 * sekunder bara i sina egna pauser.
 *
 * Nu cachas frågebilderna i stället när de faktiskt visas, av fetch-hanteraren
 * längre ner. Den som spelar om samma stad får dem ur cachen, och ingen
 * betalar för femtio megabyte hen aldrig fick se.
 */

/**
 * Sant för det som hör hemma i mediecachen: foton, ljud och butiksytor.
 * Allt annat - startsidan och de hashade bygg-filerna - hör till skalet.
 */
function arMedia(url) {
  return /\/(quiz|cities|butik|ljud)\//.test(url.pathname);
}

/**
 * När lagringskvoten är full slutar vi skriva i stället för att låta varje
 * hämtning avslutas med ett avvisat löfte. Spelet fungerar ändå: det som
 * inte får plats i cachen hämtas från nätet.
 */
let kvotenFull = false;

function skrivICachen(cache, request, response) {
  if (kvotenFull) return;
  cache.put(request, response).catch((err) => {
    if (err && err.name === 'QuotaExceededError') kvotenFull = true;
  });
}

/**
 * Ett svar duger att spara bara om det är det som efterfrågades. En
 * felsida eller en kontrollsida från en mellanliggande proxy kan komma med
 * status 200 och HTML i kroppen, och hamnar den under en bildadress är
 * bilden trasig för gott - även när nätet är tillbaka.
 */
function svaretDuger(url, response) {
  if (!response.ok) return false;
  // Adresser med frågetecken är omförsök som gått förbi cachen med flit.
  if (url.search) return false;
  if (!arMedia(url)) return true;
  const typ = response.headers.get('content-type') ?? '';
  return typ.startsWith('image/') || typ.startsWith('audio/');
}

self.addEventListener('install', (event) => {
  // Aktivera den nya versionen direkt istället för att vänta på att alla
  // flikar stängs.
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const skal = await caches.open(SKAL);
      // Lägg in startsidan så att offline-start fungerar.
      await skal.add(new Request('./', { cache: 'reload' })).catch(() => undefined);
      const media = await caches.open(MEDIA);
      // Fotona får inte stoppa installationen om något saknas - de hämtas
      // då i stället vid första visningen och cachas löpande. Det som redan
      // ligger i mediecachen sedan förra utgåvan hämtas inte om.
      for (const grupp of [CITY_PHOTOS, LJUD, BUTIK]) {
        const saknas = [];
        for (const url of grupp) {
          if (!(await media.match(url))) saknas.push(url);
        }
        await media.addAll(saknas).catch(() => undefined);
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Rensa cacher från tidigare versioner. Mediecachen står kvar.
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== SKAL && n !== MEDIA).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Låt allt utom vanliga GET-anrop gå direkt till nätet.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Sidnavigering: hämta nytt om möjligt, annars visa cachad startsida.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SKAL);
          skrivICachen(cache, './', fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(SKAL);
          return (
            (await cache.match('./')) ??
            (await cache.match(request)) ??
            Response.error()
          );
        }
      })()
    );
    return;
  }

  // Övriga resurser: cache först, och fyll på cachen i bakgrunden.
  event.respondWith(
    (async () => {
      const cache = await caches.open(arMedia(url) ? MEDIA : SKAL);
      const hit = await cache.match(request);
      if (hit) return hit;
      try {
        const fresh = await fetch(request);
        if (svaretDuger(url, fresh)) skrivICachen(cache, request, fresh.clone());
        return fresh;
      } catch {
        return Response.error();
      }
    })()
  );
});
