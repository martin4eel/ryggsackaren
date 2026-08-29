/**
 * Service worker för Upptäckaren.
 *
 * Strategi: network-first för sidnavigering, så att spelarna alltid får den
 * senaste versionen när de har täckning, men med cache som reserv så att
 * spelet fungerar offline när det väl laddats en gång. Byggda filresurser
 * har innehållshash i namnet och cachas därför permanent.
 */

const CACHE = 'upptackaren-v57';

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
 * Frågebilderna är många - flera hundra - och listas i quiz/manifest.json,
 * som hämtskriptet skriver. De hämtas inte vid installationen, som skulle
 * ta minuter på mobilnät, utan i bakgrunden efter aktiveringen, i lugn
 * takt, tills allt ligger i cachen. En fråga vars bild inte hunnit dit
 * hämtar den från nätet som vanligt.
 */
async function varmUppFragebilder(cache) {
  try {
    const res = await fetch('./quiz/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const ids = await res.json();
    const urls = ids.map((id) => `./quiz/${id}.webp`);
    const saknas = [];
    for (const url of urls) {
      if (!(await cache.match(url))) saknas.push(url);
    }
    // Några i taget, med paus, så att spelet självt får bandbredden.
    for (let i = 0; i < saknas.length; i += 4) {
      await Promise.all(
        saknas.slice(i, i + 4).map((url) => cache.add(url).catch(() => undefined))
      );
      await new Promise((r) => setTimeout(r, 250));
    }
  } catch {
    // Offline eller avbrutet: nästa aktivering försöker igen.
  }
}


self.addEventListener('install', (event) => {
  // Aktivera den nya versionen direkt istället för att vänta på att alla
  // flikar stängs.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all([
        // Lägg in startsidan så att offline-start fungerar.
        cache.add(new Request('./', { cache: 'reload' })).catch(() => undefined),
        // Fotona får inte stoppa installationen om något saknas – de hämtas
        // då i stället vid första visningen och cachas löpande.
        cache.addAll(CITY_PHOTOS).catch(() => undefined),
        cache.addAll(LJUD).catch(() => undefined),
        cache.addAll(BUTIK).catch(() => undefined),
      ])
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Rensa cacher från tidigare versioner.
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== CACHE).map((n) => caches.delete(n))
      );
      await self.clients.claim();
      // Frågebilderna i bakgrunden, utan att hålla aktiveringen.
      const cache = await caches.open(CACHE);
      varmUppFragebilder(cache);
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Låt allt utom vanliga GET-anrop gå direkt till nätet.
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // Sidnavigering: hämta nytt om möjligt, annars visa cachad startsida.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put('./', fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(CACHE);
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
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      try {
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      } catch {
        return Response.error();
      }
    })()
  );
});
