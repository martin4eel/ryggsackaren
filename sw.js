/**
 * Service worker för Ryggsäckaren.
 *
 * Strategi: network-first för sidnavigering, så att spelarna alltid får den
 * senaste versionen när de har täckning, men med cache som reserv så att
 * spelet fungerar offline när det väl laddats en gång. Byggda filresurser
 * har innehållshash i namnet och cachas därför permanent.
 */

const CACHE = 'ryggsackaren-v14';

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
].map((id) => `./cities/${id}.jpg`);

/**
 * Frågebilderna. De är små - några tiotal kilobyte styck - och en fråga som
 * visar en bruten bildikon för att man råkar sitta på ett flyg är sämre än
 * några megabyte i cachen. Listan matchar src/data/quizImages.ts, vilket
 * valideringen kontrollerar.
 */
const QUIZ_IMAGES = [
  'ananas',
  'blackfisk',
  'buffel',
  'chili',
  'delfin',
  'durian',
  'elefant',
  'flamingo',
  'flodhast',
  'gepard',
  'giraff',
  'gnu',
  'granatapple',
  'havsabborre',
  'havsorn',
  'havsskoldpadda',
  'hummer',
  'ingefara',
  'kanel',
  'kardemumma',
  'kiwifrukt',
  'knolval',
  'lavendel',
  'lejon',
  'leopard',
  'lotus',
  'makrill',
  'manet',
  'marulk',
  'monalisa',
  'noshorning',
  'orkide',
  'ostron',
  'parlorhange',
  'pelikan',
  'pingvin',
  'protea',
  'saffran',
  'sjostjarna',
  'skriet',
  'solros',
  'station-buss-1',
  'station-buss-2',
  'station-buss-3',
  'station-buss-4',
  'station-farja-1',
  'station-farja-2',
  'station-farja-3',
  'station-farja-4',
  'station-flyg-1',
  'station-flyg-2',
  'station-flyg-3',
  'station-flyg-4',
  'station-tag-1',
  'station-tag-2',
  'station-tag-3',
  'station-tag-4',
  'stjarnenatt',
  'storavagen',
  'svartpeppar',
  'torsk',
  'tulpan',
  'vanilj',
  'venusfodelse',
  'vitlok',
  'zebra',
].map((id) => `./quiz/${id}.jpg`);


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
        cache.addAll(QUIZ_IMAGES).catch(() => undefined),
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
