# Internetcaféet

Den enda serverdelen i Upptäckaren. Spelet i övrigt bor helt i webbläsaren –
det här är bara en brevlåda där en spelare kan lägga sin resedagbok så att en
kompis kan titta på den.

En dagbok innehåller namn, stad och land, antal stämplar, den senaste stämpeln
och det senast avklarade yrket. Ingenting mer: inte pengarna, inte ryggsäcken,
inte facit på frågorna. Inga konton, inga lösenord, ingen e-post, ingen
spårning. Ingenting skickas i väg förrän spelaren själv tryckt på *Dela min
resedagbok*, och *Sluta dela* raderar dagboken på servern. En dagbok som ingen
rört på sextio dagar städas bort av sig själv.

## Prova utan konto

```bash
node prov.mjs      # 16 prov på rutter, nyckelkontroll och validering
node lokal.mjs     # kör caféet på http://localhost:8787, allt i minnet
```

Med caféet igång startas spelet mot det så här, från repots rot:

```bash
VITE_INTERNETCAFE=http://localhost:8787 npm run dev
```

`lokal.mjs` sparar bara i minnet och tappar allt när den stängs av. Den finns
för att kunna klicka igenom caféet, inte för att köras på riktigt.

## Kontot

Caféet ligger på Cloudflare-kontot **martink.1987@gmail.com** – inte på
Compeas-kontot, som datorn annars är inloggad på i wrangler. De två hålls isär
med `XDG_CONFIG_HOME`: uppgifterna för caféet ligger i
`~/.wrangler-upptackaren`, Compeas ligger kvar på sitt vanliga ställe.

Därför går alla wrangler-kommandon genom npm-skripten här, som sätter den
variabeln åt dig. Kör aldrig `npx wrangler deploy` rakt av i den här mappen –
då hamnar caféet på fel konto.

```bash
npm run whoami     # ska säga martink.1987@gmail.com
npm run deploy     # publicerar
npm run logg       # följer anropen live
npm run login      # bara om inloggningen gått ut
```

## Publicera en ändring

```bash
npm test           # proven först
npm run deploy
```

Uppsättningen är redan gjord och behöver inte göras om: KV-utrymmet finns
(id:t står i `wrangler.toml`), och `cafe.upptackaren.se` är satt som egen
domän. Cloudflare la DNS-posten själv – apex-posten mot GitHub Pages rördes
inte.

Spelet letar efter caféet på `https://cafe.upptackaren.se`, som är
förvalt i `src/game/internetcafe.ts`. Ändras adressen behöver spelet byggas om
med `VITE_INTERNETCAFE=<adressen> npm run build` från repots rot.

Gratisnivån räcker med mycket god marginal: 100 000 anrop och 1 000
skrivningar om dagen, och spelet skriver som mest någon gång var tredje minut
per spelare som delar.

### Om caféet ligger nere

Ingenting går sönder. Skylten står kvar i staden, och den som trycker på
*Dela min resedagbok* får veta att uppkopplingen är nere. Resten av spelet rör
aldrig nätet.

## Rutter

| Metod    | Väg            | Kräver nyckel | Gör                          |
| -------- | -------------- | ------------- | ---------------------------- |
| `POST`   | `/dagbok`      | nej           | Skapar, svarar `{id, nyckel}` |
| `GET`    | `/dagbok/:id`  | nej           | Läser dagboken               |
| `PUT`    | `/dagbok/:id`  | ja            | Uppdaterar                   |
| `DELETE` | `/dagbok/:id`  | ja            | Slutar dela, raderar         |

Id:t är sex siffror och börjar aldrig på noll – ett nummer att läsa upp i
telefon. Nyckeln är sexton slumpade byte, ligger bara i den egna webbläsaren
och lämnar aldrig servern efter att den skapats. Id:t räcker för att läsa,
nyckeln krävs för att skriva.

Servern kopierar aldrig det som kommer in rakt av: den bygger en egen dagbok av
de fält som hör hit, kapar varje fält till en rimlig längd och slänger resten.
Kroppar över 2 kB avvisas. Bara `upptackaren.se` och en utvecklingsserver på
det egna nätet får svar med CORS-huvud.

## Filerna

| Fil             | Vad                                                  |
| --------------- | ---------------------------------------------------- |
| `index.js`      | Hela servern                                          |
| `prov.mjs`      | Proven, körs med Node mot ett låtsas-KV               |
| `lokal.mjs`     | Kör servern lokalt utan Cloudflare                    |
| `wrangler.toml` | Namn, KV-koppling och egen domän                      |
