# Ryggsäckaren

Ett webbaserat geografi- och frågesportspel på svenska, inspirerat av
_BackPacker 2_ (1997). Res jorden runt, ta jobb, svara på frågor, handla
souvenirer och kom hem igen med pengar kvar.

Spelet fungerar med både mus och touch, och är byggt för att spelas i
webbläsare på telefon såväl som dator.

## Kom igång

```bash
npm install
npm run dev        # utvecklingsserver, öppna adressen som skrivs ut
```

Dev-servern lyssnar på alla nätverksgränssnitt, så du kan öppna adressen
`http://<din-dators-ip>:5173` i telefonen så länge ni är på samma nätverk.

```bash
npm run build      # typkoll + datavalidering + produktionsbygge till dist/
npm run preview    # kör igenom det byggda resultatet lokalt
npm run validate   # kontrollera bara speldatan
npm run typecheck  # kontrollera bara typerna
```

Bygget i `dist/` är helt statiskt och använder relativa sökvägar, så det kan
läggas rakt upp på GitHub Pages, Netlify eller vilken statisk webbserver som
helst utan konfiguration.

## Så spelas det

1. **Välj svårighetsgrad.** _Turist_ ger lättare frågor, tre svarsalternativ,
   billigare boende och mer startkapital. _Globetrotter_ ger svårare frågor,
   fyra alternativ, högre löner och tuffare ekonomi.
2. **Välj startstad.** Staden blir också ditt slutmål, och dess valuta är den
   som alla belopp visas i under resan.
3. **Turistbyrån.** Svara på frågor om staden. Resultatet blir ett stadsbetyg
   (0–100) som avgör vilka jobb du får söka. Du kan göra om provet för att
   höja betyget, men varje besök kostar en dag.
4. **Tidningen.** Läs platsannonserna och ta ett skift. Varje fråga är en
   arbetsdag: rätt svar ger lön, och boendet dras oavsett. Klarar du minst
   70 procent av skiftet får du ett **certifikat**, som öppnar bättre betalda
   jobb i samma ämne i alla städer.
5. **Souvenirbutiken.** Köp där varan tillverkas och sälj där den är
   eftertraktad. Priserna varierar med region, prisnivå och dag.
6. **Resebyrån.** Välj destination på kartan eller i listan. Varje sträcka har
   tre biljetter: billigt och långsamt, mellanting, eller dyrt och snabbt.
   Tid är också en resurs eftersom boendet kostar varje dag.
7. **Telefonkiosken.** Ringer du hem får du pengar, men skulden växer och dras
   av från slutpoängen. Varje samtal ger dessutom mindre än det förra.
8. **Kom hem.** Besök minst fem städer och återvänd till startstaden för att
   avsluta resan och få poäng.

Går kassan under −1 500 är resan över och ambassaden skickar hem dig.

Spelet sparas automatiskt i webbläsarens `localStorage`, så du kan stänga
fliken och fortsätta senare.

### Poäng

Slutpoängen väger samman kassa, ryggsäckens värde hemma, antal besökta städer,
certifikat, träffsäkerhet på frågorna och hur effektivt du reste (städer per
dag). Skulden dras av.

## Innehåll

- 22 destinationer på sex kontinenter
- 64 yrken i tre löneklasser och 18 ämnesområden
- 441 frågor, uppdelade i två svårighetsgrader
- 41 souvenirer med regional prissättning
- 24 valutor

## Struktur

```
src/
  data/
    types.ts               Typer för städer, jobb, souvenirer och frågor
    cities.ts              Destinationer med koordinater, valuta och prisnivå
    jobs.ts                Yrken, löneklasser och ämneskategorier
    souvenirs.ts           Handelsvaror med billiga och eftertraktade regioner
    currencies.ts          Växelkurser och formatering av belopp
    worldMap.ts            Genererad landmassa som SVG-path (Natural Earth)
    questions/
      cityQuestions.ts     Frågor till turistbyrån, per stad
      categoryQuestions.ts Jobbfrågor, per ämneskategori
  game/
    state.ts               Speltillstånd, sparning och laddning
    rules.ts               Avstånd, priser, löner, poäng och frågeurval
  ui/
    app.ts                 Skärmar och spelloop
    map.ts                 Världskartan som SVG med etikettplacering
    dom.ts                 Små hjälpare för att bygga element
  styles/main.css          All stilsättning
scripts/
  validate-data.mjs        Kontrollerar speldatan, körs vid varje bygge
```

### Att lägga till innehåll

Frågor skrivs med det **rätta svaret först** i `a`-listan; alternativen blandas
när frågan visas. `d: 1` betyder att frågan används på båda svårighetsgraderna,
`d: 2` att den bara dyker upp på Globetrotter.

```ts
{
  q: 'Vilken flod rinner genom Kairo?',
  a: ['Nilen', 'Kongo', 'Niger', 'Eufrat'],
  d: 1,
  info: 'Visas som kuriosa efter att spelaren svarat.',
}
```

Kör `npm run validate` efter ändringar. Den kontrollerar bland annat att varje
stad har minst fem lätta frågor, att varje ämneskategori har nog med frågor för
det längsta skiftet, att varje stad har minst ett jobb i löneklass 1 (så att en
spelare utan stadsbetyg alltid kan tjäna pengar), och att inga frågor är
dubbletter.

Kartans landmassa är genererad från Natural Earths 110m-dataset (public domain)
och ligger färdig i `src/data/worldMap.ts`, så inga kartberoenden behövs vid
körning.

## Om förlagan

Det här är ett nyskrivet hyllningsspel. All text, alla frågor och all grafik är
egna; ingenting är hämtat från originalspelet.
