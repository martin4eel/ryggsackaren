/**
 * Kör internetcaféet lokalt, utan Cloudflare och utan konto.
 *
 *   node lokal.mjs            (lyssnar på http://localhost:8787)
 *
 * och starta sedan spelet med caféet pekat hit:
 *
 *   VITE_INTERNETCAFE=http://localhost:8787 npm run dev
 *
 * Dagböckerna ligger bara i minnet och försvinner när servern stängs av. Det
 * här är ett provkök, inte en server att lita på - den riktiga är index.js på
 * Cloudflare.
 */
import { createServer } from 'node:http';
import worker from './index.js';

const PORT = Number(process.env.PORT ?? 8787);

const rader = new Map();
const env = {
  DAGBOK: {
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
  },
};

createServer(async (req, res) => {
  const bitar = [];
  for await (const bit of req) bitar.push(bit);
  const kropp = Buffer.concat(bitar);

  const rubriker = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') rubriker.set(k, v);
  }

  const svar = await worker.fetch(
    new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers: rubriker,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : kropp,
    }),
    env
  );

  res.writeHead(svar.status, Object.fromEntries(svar.headers));
  res.end(Buffer.from(await svar.arrayBuffer()));
}).listen(PORT, () => {
  console.log(`Internetcaféet står på http://localhost:${PORT} (endast i minnet)`);
});
