/**
 * Internetcaféet: den enda serverdelen i Upptäckaren.
 *
 * Spelet i övrigt bor helt i webbläsaren. Den här arbetaren finns bara för att
 * två spelare på var sin telefon ska kunna titta på varandras resedagböcker,
 * och den vet därför så lite som möjligt: ett namn, var man är, hur många
 * städer man hunnit besöka, hur många stämplar man har, den senaste stämpeln
 * och det senast avklarade yrket.
 * Inga konton, inga lösenord, ingen e-post, ingen spårning.
 *
 * Varje dagbok får ett sexsiffrigt id som spelaren läser upp för en kompis,
 * ungefär som en Kahoot-pin, och en hemlig nyckel som bara ligger i den egna
 * webbläsaren. Id:t räcker för att läsa, nyckeln krävs för att skriva. En
 * dagbok som ingen rört på sextio dagar städas bort av KV:s egen livslängd.
 *
 * Rutter:
 *   POST   /dagbok       -> skapar, svarar { id, nyckel }
 *   GET    /dagbok/:id   -> läser
 *   PUT    /dagbok/:id   -> uppdaterar (kräver x-nyckel)
 *   DELETE /dagbok/:id   -> slutar dela (kräver x-nyckel)
 */

/** Hur länge en orörd dagbok ligger kvar, i sekunder. */
const LIVSLANGD = 60 * 60 * 24 * 60;

/**
 * Största tillåtna kropp. En dagbok är några hundra byte; taket finns för att
 * caféet inte ska gå att använda som gratis fillagring.
 */
const MAX_BYTES = 2048;

/** Hur många gånger vi drar ett nytt id innan vi ger upp på krocken. */
const ID_FORSOK = 8;

export default {
  async fetch(request, env) {
    const ursprung = request.headers.get('Origin');
    const cors = corsRubriker(ursprung);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const delar = url.pathname.split('/').filter(Boolean);

    if (delar[0] !== 'dagbok') {
      return svar({ fel: 'okänd väg' }, 404, cors);
    }

    try {
      if (delar.length === 1 && request.method === 'POST') {
        return await skapa(request, env, cors);
      }
      if (delar.length === 2) {
        const id = delar[1];
        if (!/^\d{6}$/.test(id)) return svar({ fel: 'ogiltigt id' }, 400, cors);
        if (request.method === 'GET') return await las(id, env, cors);
        if (request.method === 'PUT') return await uppdatera(id, request, env, cors);
        if (request.method === 'DELETE') return await tabort(id, request, env, cors);
      }
    } catch (err) {
      // Ett fel här får aldrig bli ett fel i spelet. Caféet säger bara att det
      // inte gick, och resan fortsätter.
      return svar({ fel: 'något gick fel', detalj: String(err && err.message) }, 500, cors);
    }

    return svar({ fel: 'okänd väg' }, 405, cors);
  },
};

async function skapa(request, env, cors) {
  const dagbok = await lasKropp(request);
  if (!dagbok) return svar({ fel: 'ogiltig dagbok' }, 400, cors);

  for (let i = 0; i < ID_FORSOK; i++) {
    const id = nyttId();
    // KV är eventuellt konsistent, så det här är ingen vattentät reservation.
    // Med sexsiffriga id och en handfull spelare räcker det ändå med råge.
    const upptagen = await env.DAGBOK.get(`d:${id}`);
    if (upptagen) continue;
    const nyckel = nyNyckel();
    const nu = Date.now();
    await env.DAGBOK.put(
      `d:${id}`,
      JSON.stringify({ nyckel, dagbok, skapad: nu, uppdaterad: nu }),
      { expirationTtl: LIVSLANGD }
    );
    return svar({ id, nyckel, uppdaterad: nu }, 201, cors);
  }
  return svar({ fel: 'hittade inget ledigt nummer' }, 503, cors);
}

async function las(id, env, cors) {
  const rad = await env.DAGBOK.get(`d:${id}`, 'json');
  if (!rad) return svar({ fel: 'okänt nummer' }, 404, cors);
  // Nyckeln lämnar aldrig servern efter att den skapats.
  return svar({ id, dagbok: rad.dagbok, uppdaterad: rad.uppdaterad }, 200, cors);
}

async function uppdatera(id, request, env, cors) {
  const rad = await env.DAGBOK.get(`d:${id}`, 'json');
  if (!rad) return svar({ fel: 'okänt nummer' }, 404, cors);
  if (!likaHemligheter(request.headers.get('x-nyckel'), rad.nyckel)) {
    return svar({ fel: 'fel nyckel' }, 403, cors);
  }
  const dagbok = await lasKropp(request);
  if (!dagbok) return svar({ fel: 'ogiltig dagbok' }, 400, cors);
  const nu = Date.now();
  await env.DAGBOK.put(
    `d:${id}`,
    JSON.stringify({ ...rad, dagbok, uppdaterad: nu }),
    { expirationTtl: LIVSLANGD }
  );
  return svar({ id, uppdaterad: nu }, 200, cors);
}

async function tabort(id, request, env, cors) {
  const rad = await env.DAGBOK.get(`d:${id}`, 'json');
  // Att sluta dela något som redan är borta är inte ett fel.
  if (!rad) return svar({ id, borttagen: true }, 200, cors);
  if (!likaHemligheter(request.headers.get('x-nyckel'), rad.nyckel)) {
    return svar({ fel: 'fel nyckel' }, 403, cors);
  }
  await env.DAGBOK.delete(`d:${id}`);
  return svar({ id, borttagen: true }, 200, cors);
}

/**
 * Läser kroppen och bygger en egen, städad dagbok av den. Vi kopierar aldrig
 * det som kom in rakt av: bara de fält som hör hit följer med, och varje fält
 * kapas till en rimlig längd. Då kan caféet varken bli en anslagstavla eller
 * en väg att smuggla in märklig text i en annan spelares skärm.
 */
async function lasKropp(request) {
  const text = await request.text();
  if (text.length > MAX_BYTES) return null;
  let rad;
  try {
    rad = JSON.parse(text);
  } catch {
    return null;
  }
  if (!rad || typeof rad !== 'object') return null;

  const namn = str(rad.namn, 24);
  const stad = str(rad.stad, 40);
  const land = str(rad.land, 40);
  if (!namn || !stad || !land) return null;

  const dagbok = {
    namn,
    stad,
    land,
    stader: heltal(rad.stader, 0, 500),
    stamplar: heltal(rad.stamplar, 0, 500),
    dag: heltal(rad.dag, 0, 5000),
  };

  if (rad.senasteStampel && typeof rad.senasteStampel === 'object') {
    const namnet = str(rad.senasteStampel.namn, 60);
    if (namnet) {
      dagbok.senasteStampel = {
        namn: namnet,
        tecken: str(rad.senasteStampel.tecken, 4) || '*',
        dag: heltal(rad.senasteStampel.dag, 0, 5000),
      };
    }
  }

  if (rad.senasteYrke && typeof rad.senasteYrke === 'object') {
    const titel = str(rad.senasteYrke.titel, 60);
    if (titel) {
      dagbok.senasteYrke = {
        titel,
        stad: str(rad.senasteYrke.stad, 40) || '',
        dag: heltal(rad.senasteYrke.dag, 0, 5000),
      };
    }
  }

  return dagbok;
}

/** Trimmad sträng utan styrtecken, kapad till max tecken. */
function str(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function heltal(v, min, max) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * Ett sexsiffrigt nummer som aldrig börjar på noll - en inledande nolla
 * försvinner så fort någon skriver in numret som ett tal.
 */
function nyttId() {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return String(100000 + (b[0] % 900000));
}

function nyNyckel() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** Jämförelse som tar lika lång tid oavsett var nycklarna börjar skilja sig. */
function likaHemligheter(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Vilka sidor som får prata med caféet. Spelet självt, och en utvecklingsserver
 * på det egna nätet - Vite lyssnar på alla gränssnitt, så en telefon som testar
 * bygget kommer in med maskinens IP som ursprung.
 */
function tillatetUrsprung(ursprung) {
  if (!ursprung) return null;
  if (ursprung === 'https://upptackaren.se' || ursprung === 'https://www.upptackaren.se') {
    return ursprung;
  }
  if (
    /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/.test(
      ursprung
    )
  ) {
    return ursprung;
  }
  return null;
}

function corsRubriker(ursprung) {
  const tillaten = tillatetUrsprung(ursprung);
  const rubriker = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-nyckel',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (tillaten) rubriker['Access-Control-Allow-Origin'] = tillaten;
  return rubriker;
}

function svar(kropp, status, cors) {
  return new Response(JSON.stringify(kropp), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...cors,
    },
  });
}
