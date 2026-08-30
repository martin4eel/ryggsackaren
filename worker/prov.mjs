/**
 * Prov för internetcaféet, körs med `node prov.mjs` i den här mappen.
 *
 * Arbetaren är den enda serverdelen i spelet och den enda kod som tar emot
 * något utifrån. Provet kör den i Node mot ett låtsas-KV, så att rutter,
 * nyckelkontroll och städningen av inkommande text går att pröva utan
 * Cloudflare och utan att något publiceras.
 */
import worker from './index.js';
import assert from 'node:assert/strict';

/** Ett KV som räcker för provet: put, get och delete, allt i minnet. */
function fejkKV() {
  const rader = new Map();
  return {
    rader,
    async get(nyckel, typ) {
      const v = rader.get(nyckel);
      if (v === undefined) return null;
      return typ === 'json' ? JSON.parse(v) : v;
    },
    async put(nyckel, varde) {
      rader.set(nyckel, varde);
    },
    async delete(nyckel) {
      rader.delete(nyckel);
    },
  };
}

const URSPRUNG = 'https://upptackaren.se';
let env = { DAGBOK: fejkKV() };

function anrop(vag, { method = 'GET', body, nyckel, ursprung = URSPRUNG } = {}) {
  const rubriker = { Origin: ursprung };
  if (body) rubriker['Content-Type'] = 'application/json';
  if (nyckel) rubriker['x-nyckel'] = nyckel;
  return worker.fetch(
    new Request(`https://cafe.upptackaren.se${vag}`, {
      method,
      headers: rubriker,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env
  );
}

const DAGBOK = {
  namn: 'Elsa',
  stad: 'Kathmandu',
  land: 'Nepal',
  stader: 9,
  stamplar: 7,
  dag: 12,
  senasteStampel: { namn: 'Över molnen', tecken: '⛰', dag: 11 },
  senasteYrke: { titel: 'Bergsguide', stad: 'Kathmandu', dag: 10 },
};

const prov = [];
const test = (namn, fn) => prov.push([namn, fn]);

test('skapar en dagbok och får nummer och nyckel', async () => {
  const svar = await anrop('/dagbok', { method: 'POST', body: DAGBOK });
  assert.equal(svar.status, 201);
  const kropp = await svar.json();
  assert.match(kropp.id, /^\d{6}$/);
  assert.equal(kropp.id[0] === '0', false, 'numret får inte börja på noll');
  assert.equal(typeof kropp.nyckel, 'string');
  assert.equal(kropp.nyckel.length, 32);
  assert.equal(svar.headers.get('Access-Control-Allow-Origin'), URSPRUNG);
});

test('läser dagboken utan nyckel, men får aldrig se nyckeln', async () => {
  const { id } = await (await anrop('/dagbok', { method: 'POST', body: DAGBOK })).json();
  const svar = await anrop(`/dagbok/${id}`);
  assert.equal(svar.status, 200);
  const kropp = await svar.json();
  assert.equal(kropp.dagbok.namn, 'Elsa');
  assert.equal(kropp.dagbok.stad, 'Kathmandu');
  assert.equal(kropp.dagbok.stader, 9);
  assert.equal(kropp.dagbok.senasteYrke.titel, 'Bergsguide');
  assert.equal(kropp.nyckel, undefined, 'nyckeln får inte lämna servern');
});

test('rätt nyckel får uppdatera, fel nyckel avvisas', async () => {
  const { id, nyckel } = await (
    await anrop('/dagbok', { method: 'POST', body: DAGBOK })
  ).json();

  const fel = await anrop(`/dagbok/${id}`, {
    method: 'PUT',
    nyckel: 'f'.repeat(32),
    body: { ...DAGBOK, stad: 'Hanoi' },
  });
  assert.equal(fel.status, 403);

  const utan = await anrop(`/dagbok/${id}`, { method: 'PUT', body: DAGBOK });
  assert.equal(utan.status, 403);

  const ratt = await anrop(`/dagbok/${id}`, {
    method: 'PUT',
    nyckel,
    body: { ...DAGBOK, stad: 'Hanoi', land: 'Vietnam' },
  });
  assert.equal(ratt.status, 200);

  const efter = await (await anrop(`/dagbok/${id}`)).json();
  assert.equal(efter.dagbok.stad, 'Hanoi');
  assert.equal(efter.dagbok.land, 'Vietnam');
});

test('sluta dela raderar dagboken', async () => {
  const { id, nyckel } = await (
    await anrop('/dagbok', { method: 'POST', body: DAGBOK })
  ).json();
  assert.equal((await anrop(`/dagbok/${id}`, { method: 'DELETE', nyckel })).status, 200);
  assert.equal((await anrop(`/dagbok/${id}`)).status, 404);
});

test('okänt nummer ger 404, inte något påhittat', async () => {
  const svar = await anrop('/dagbok/999999');
  assert.equal(svar.status, 404);
});

test('numret måste vara sex siffror', async () => {
  assert.equal((await anrop('/dagbok/12')).status, 400);
  assert.equal((await anrop('/dagbok/abcdef')).status, 400);
});

test('bara de fält som hör hit följer med, och de kapas', async () => {
  const { id } = await (
    await anrop('/dagbok', {
      method: 'POST',
      body: {
        ...DAGBOK,
        namn: 'E'.repeat(200),
        pengar: 999999,
        losenord: 'hemligt',
        senasteYrke: { titel: 'Kock', stad: 'Lima', dag: 3, lon: 4000 },
      },
    })
  ).json();
  const { dagbok } = await (await anrop(`/dagbok/${id}`)).json();
  assert.equal(dagbok.namn.length, 24, 'långa namn ska kapas');
  assert.equal(dagbok.pengar, undefined, 'okända fält ska falla bort');
  assert.equal(dagbok.losenord, undefined);
  assert.equal(dagbok.senasteYrke.lon, undefined);
  assert.equal(dagbok.senasteYrke.titel, 'Kock');
});

test('mellanslag bevaras, styrtecken städas bort', async () => {
  const { id } = await (
    await anrop('/dagbok', {
      method: 'POST',
      body: { ...DAGBOK, namn: '  Karl Erik  ', stad: 'Buenos Aires' },
    })
  ).json();
  const { dagbok } = await (await anrop(`/dagbok/${id}`)).json();
  assert.equal(dagbok.namn, 'Karl Erik');
  assert.equal(dagbok.stad, 'Buenos Aires');
});

test('orimliga tal klipps till spelets värld', async () => {
  const { id } = await (
    await anrop('/dagbok', {
      method: 'POST',
      body: { ...DAGBOK, stamplar: 99999, stader: 99999, dag: -5 },
    })
  ).json();
  const { dagbok } = await (await anrop(`/dagbok/${id}`)).json();
  assert.equal(dagbok.stamplar, 500);
  assert.equal(dagbok.stader, 500);
  assert.equal(dagbok.dag, 0);
});

test('en dagbok utan namn eller plats avvisas', async () => {
  assert.equal(
    (await anrop('/dagbok', { method: 'POST', body: { stamplar: 3 } })).status,
    400
  );
  assert.equal(
    (await anrop('/dagbok', { method: 'POST', body: { namn: 'A', stad: '', land: 'X' } }))
      .status,
    400
  );
});

test('för stor kropp släpps inte in', async () => {
  const svar = await anrop('/dagbok', {
    method: 'POST',
    body: { ...DAGBOK, skrap: 'x'.repeat(4000) },
  });
  assert.equal(svar.status, 400);
});

test('trasig json ger 400, inte 500', async () => {
  const svar = await worker.fetch(
    new Request('https://cafe.upptackaren.se/dagbok', {
      method: 'POST',
      headers: { Origin: URSPRUNG, 'Content-Type': 'application/json' },
      body: '{inte json',
    }),
    env
  );
  assert.equal(svar.status, 400);
});

test('okända vägar och metoder avvisas', async () => {
  assert.equal((await anrop('/')).status, 404);
  assert.equal((await anrop('/allt')).status, 404);
  assert.equal((await anrop('/dagbok')).status, 405);
});

test('bara spelets egna sidor får svar med cors-huvud', async () => {
  const svar = await anrop('/dagbok/123456', { ursprung: 'https://elak.example' });
  assert.equal(svar.headers.get('Access-Control-Allow-Origin'), null);

  const lokalt = await anrop('/dagbok/123456', { ursprung: 'http://localhost:5173' });
  assert.equal(lokalt.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');

  const telefon = await anrop('/dagbok/123456', { ursprung: 'http://192.168.1.42:5173' });
  assert.equal(
    telefon.headers.get('Access-Control-Allow-Origin'),
    'http://192.168.1.42:5173'
  );
});

test('förfrågan om lov besvaras utan kropp', async () => {
  const svar = await anrop('/dagbok/123456', { method: 'OPTIONS' });
  assert.equal(svar.status, 204);
  assert.match(svar.headers.get('Access-Control-Allow-Headers'), /x-nyckel/);
});

test('två dagböcker får olika nummer', async () => {
  const nummer = new Set();
  for (let i = 0; i < 25; i++) {
    const { id } = await (await anrop('/dagbok', { method: 'POST', body: DAGBOK })).json();
    nummer.add(id);
  }
  assert.equal(nummer.size, 25);
});

let fel = 0;
for (const [namn, fn] of prov) {
  env = { DAGBOK: fejkKV() };
  try {
    await fn();
    console.log(`  ok   ${namn}`);
  } catch (err) {
    fel++;
    console.log(`  FEL  ${namn}`);
    console.log(`       ${err.message.split('\n')[0]}`);
  }
}
console.log(
  fel === 0 ? `\nAlla ${prov.length} prov gick igenom.` : `\n${fel} av ${prov.length} prov gick fel.`
);
process.exit(fel === 0 ? 0 : 1);
