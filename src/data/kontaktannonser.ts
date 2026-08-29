import type { EventEffect } from './events';
import type { Region } from './types';

/**
 * Kontaktannonser på tidningens personliga sida.
 *
 * Varje annons är ett litet val: svara, eller bläddra vidare. Att svara
 * kostar alltid en dag - man ska ju träffas - och vad som sedan händer
 * lottas bland annonsens utfall. Somliga annonser är precis vad de utger
 * sig för att vara, andra är det inte, och det är poängen: en rik änka som
 * söker sällskap i Havanna är sällan rik, sällan änka och ibland inte ens
 * en hon.
 *
 * Tonen är förlagans: torr, lite absurd, aldrig elak. Annonserna är
 * påhittade och ingen person i dem finns på riktigt.
 */
export interface Utfall {
  /** Vad som hände, i andra person. */
  text: string;
  effekt?: EventEffect;
  /** Relativ sannolikhet. Saknas den räknas den som 1. */
  vikt?: number;
}

export interface Kontaktannons {
  id: string;
  /** Annonsens rubrik, som den står i tidningen. */
  rubrik: string;
  text: string;
  /** Signaturen under annonsen. */
  signatur: string;
  /** Regioner där annonsen förekommer. Saknas den finns den överallt. */
  regioner?: Region[];
  utfall: Utfall[];
  /**
   * Annonsen är i själva verket ett ärende till en annan stad. Att svara
   * kostar en dag som vanligt, men i stället för ett utfall får man
   * uppdragskortet: vad som ska bäras, vart, och för hur mycket. Tackar man
   * nej har man ändå lagt en dag på att gå dit och lyssna.
   */
  uppdrag?: boolean;
}

export const KONTAKTANNONSER: Kontaktannons[] = [
  /*
   * Ärendeannonser. De ser ut som vilken rad som helst i spalten, men den
   * som svarar får ett uppdrag till en annan stad i stället för ett utfall.
   * Utfallen nedan används bara i nödfall, om ingen stad går att lotta.
   */
  {
    id: 'arende-bud',
    rubrik: 'Bud sökes, betalning kontant',
    text: 'Har en sak som ska till en annan stad och postens försäkring täcker den inte. Du reser ändå. Vi träffas på kaféet vid stationen, jag har paketet med mig.',
    signatur: 'Sitter vid fönstret med en kasse',
    uppdrag: true,
    utfall: [
      { text: 'Kaféet är stängt. Ingen kasse, ingen sak, ingen betalning. Du dricker kaffe på ett annat ställe och tänker på saken.' },
    ],
  },
  {
    id: 'arende-slakt',
    rubrik: 'Släkt söker kontakt via ombud',
    text: 'Min familj bor utspridd över halva världen och telefonen räcker inte längre. Söker någon som är på väg och kan ta med sig något som väger mer än ett brev. Ersättning avtalas.',
    signatur: 'Äldre kvinna med långt minne',
    uppdrag: true,
    utfall: [
      { text: 'Ni sitter en timme och tittar på fotografier. Släkten är stor och ingen av dem behöver något just nu. Kaffet var starkt.' },
    ],
  },
  {
    id: 'arende-loften',
    rubrik: 'Löfte ska infrias, hjälp önskas',
    text: 'Lovade en sak för länge sedan och har inte hållit det. Nu går jag inte längre själv, men du gör det. Jag betalar för besväret och sover bättre efteråt.',
    signatur: 'Den som lovade för mycket',
    uppdrag: true,
    utfall: [
      { text: 'Personen ändrar sig i dörren. "Det var kanske inte ett löfte. Det var mer en tanke." Du får en kaka och går.' },
    ],
  },
  {
    id: 'arende-flyttlass',
    rubrik: 'En enda sak blev kvar',
    text: 'Flyttade härifrån för tre år sedan och glömde en sak som inte går att posta. Den som kan ta den dit jag bor nu får bra betalt och min eviga tacksamhet, i den ordningen.',
    signatur: 'Bor numera långt bort',
    uppdrag: true,
    utfall: [
      { text: 'Saken visar sig redan ha hämtats av en granne, som körde den till en annan stad förra veckan. Ingen har sagt något till annonsören.' },
    ],
  },
  {
    id: 'arende-hemlighet',
    rubrik: 'Diskret ärende, inga frågor',
    text: 'Söker någon som reser och inte är nyfiken. Föremålet är lagligt, lätt och tål inte fukt. Betalning i kontanter när det är framme. Fråga inte vad det är, det gör inte jag heller.',
    signatur: 'Diskret, som sagt',
    uppdrag: true,
    utfall: [
      { text: 'Ni möts vid en bänk. Personen tittar på dig länge, säger "nej, du är för nyfiken" och går. Du hade inte frågat något.' },
    ],
  },
  {
    id: 'arende-forsoning',
    rubrik: 'Försoning sökes, ombud betalas',
    text: 'Vi har inte pratat på elva år och det var mitt fel. Jag kan inte åka själv. Ta med det jag skickar med, säg ingenting mer än det som står på lappen, och kom ihåg pengarna på vägen ut.',
    signatur: 'Storasyster, envis',
    uppdrag: true,
    utfall: [
      { text: 'Hon öppnar dörren, säger "jag har ändrat mig" och stänger den igen. Två minuter senare öppnar hon och säger "nej, jag hade rätt första gången". Sedan stänger hon igen.' },
    ],
  },
  {
    id: 'middag',
    rubrik: 'Sällskap till middag sökes',
    text: 'Reserverat bord för två, en gäst har lämnat återbud. Du får gärna vara tyst, huvudsaken är att stolen är upptagen. Jag bjuder.',
    signatur: 'Bordet vid fönstret',
    utfall: [
      { text: 'En pensionerad kapten som pratar i tre timmar om fyrar. Maten är utmärkt och du betalar ingenting.', effekt: { rykte: 1 }, vikt: 3 },
      { text: 'Det visar sig att "jag bjuder" betydde "jag bjuder in". Notan delas. Din halva är inte liten.', effekt: { money: -400 }, vikt: 2 },
      { text: 'Middagen är på en restaurang som filmas för tv. Du syns i bakgrunden och får ett statistarvode.', effekt: { money: 500 } },
    ],
  },
  {
    id: 'hund',
    rubrik: 'Bortsprungen hund - hittelön',
    text: 'Liten, brun, svarar på namnet Kanel. Försvann i närheten av torget. Hittelön till den som ringer.',
    signatur: 'Familjen på tredje våningen',
    utfall: [
      { text: 'Du hittar Kanel under ett kafébord efter fyra timmar. Familjen gråter, betalar hittelönen och bjuder på kaffe.', effekt: { money: 700, rykte: 1 }, vikt: 2 },
      { text: 'Du letar hela dagen. Kanel har varit hemma sedan lunch. Ingen tänkte på att ta ner lappen.', vikt: 2 },
      { text: 'Du hittar en brun hund. Den är inte Kanel, men den följer dig hem till hotellet och vägrar gå. Hotellet debiterar en djuravgift.', effekt: { money: -250 } },
    ],
  },
  {
    id: 'sprak',
    rubrik: 'Språkutbyte',
    text: 'Vill öva mitt svenska! Byter mot lokala kunskaper och en kopp kaffe. Jag vet var allt ligger.',
    signatur: 'Nyfiken i staden',
    utfall: [
      { text: 'Två timmar på ett kafé. Du lär dig var man äter billigt och hur man säger "för dyrt" med rätt betoning.', effekt: { rating: 8 }, vikt: 3 },
      { text: 'Hens svenska består av "hej" och "Zlatan". Ni tittar på varandra i fyrtio minuter. Sedan visar hen dig ändå staden.', effekt: { rating: 4 }, vikt: 2 },
    ],
  },
  {
    id: 'anka',
    rubrik: 'Förmögen änka söker sällskap',
    text: 'Stilig, ensam, generös. Söker ung resenär för promenader och samtal. Ersättning utgår. Diskretion önskas.',
    signatur: 'Med villa och utsikt',
    utfall: [
      { text: 'Villan finns, utsikten finns, änkan är 91 och vill spela kort. Du förlorar varje giv men hon betalar ändå för sällskapet.', effekt: { money: 600 }, vikt: 2 },
      { text: 'Änkan är en man i fyrtioårsåldern som säljer tidsdelat boende. Det tar hela dagen att komma därifrån, och du har skrivit på något.', effekt: { money: -550 }, vikt: 2 },
      { text: 'Ingen dyker upp. Kaffet du väntade över kostade en förmögenhet i sig.', effekt: { money: -80 } },
    ],
  },
  {
    id: 'ryggsack',
    rubrik: 'Byter ryggsäck',
    text: 'Min är stor och tung. Din är säkert liten och lätt. Vi byter rakt av, inga frågor. Innehållet ingår.',
    signatur: 'Trött på att bära',
    utfall: [
      { text: 'Ryggsäcken innehåller ett tält, en spade och en oöppnad burk surströmming. Du säljer alltihop till en vandrare.', effekt: { money: 350 }, vikt: 2 },
      { text: 'Ryggsäcken är full av sten. Riktig sten. Personen är redan borta. Du får betala för en ny väska.', effekt: { money: -300 }, vikt: 2 },
      { text: 'I ryggsäcken ligger en handsnidad souvenir och ett tackkort. Någon ville bara bli av med den.', effekt: { souvenir: 'trasnideri' } },
    ],
  },
  {
    id: 'statist',
    rubrik: 'Statister sökes till filminspelning',
    text: 'Inspelning i morgon bitti. Vi behöver folk som kan gå förbi i bakgrunden på ett trovärdigt sätt. Frukost ingår.',
    signatur: 'Produktionsbolaget',
    utfall: [
      { text: 'Du går förbi i bakgrunden trettio gånger. Regissören är nöjd med den tjugosjunde. Arvode betalas kontant.', effekt: { money: 450 }, vikt: 3 },
      { text: 'Du går förbi i bakgrunden så trovärdigt att du får en replik. Repliken är "Ursäkta". Arvodet dubblas.', effekt: { money: 900, rykte: 1 } },
      { text: 'Inspelningen ställs in på grund av regn. Frukosten var god.', vikt: 2 },
    ],
  },
  {
    id: 'flytt',
    rubrik: 'Hjälp med flytt - betalar bra',
    text: 'Tre trappor, inga hissar, ett piano. Söker starka armar som inte ställer frågor om pianot.',
    signatur: 'Lgh 4B',
    utfall: [
      { text: 'Pianot går upp. Ryggen håller. Betalningen är precis så bra som utlovat.', effekt: { money: 550 }, vikt: 3 },
      { text: 'Pianot fastnar i trappan i tre timmar. Grannarna klagar. Du får betalt, men något mindre, "för tiden".', effekt: { money: 300 }, vikt: 2 },
      { text: 'Pianot tillhörde inte personen i 4B. Polisen är förstående men tar hela dagen, och du får inget för besväret.', effekt: { rykte: -1 } },
    ],
  },
  {
    id: 'medresenar',
    rubrik: 'Medresenär sökes',
    text: 'Har bil, saknar sällskap. Åker vart som helst så länge någon sköter kartan. Delar bensinen.',
    signatur: 'Ratten',
    utfall: [
      { text: 'Ni kör hela dagen och kommer tillbaka till samma stad, eftersom bilägaren egentligen bara ville prata. Bensinen delades.', effekt: { money: -120 }, vikt: 2 },
      { text: 'Bilen startar inte. Ni tillbringar dagen på en verkstad där bilägaren i alla fall bjuder på lunch och ger dig tips om stadens jobb.', effekt: { rating: 6 }, vikt: 2 },
      { text: 'Bilägaren är på väg till en marknad och köper hela din souvenirhög för att slippa leta själv.', effekt: { money: 400 } },
    ],
  },
  {
    id: 'fragesport',
    rubrik: 'Tävlande sökes till tv-frågesport',
    text: 'Vart är vi på väg? Lokal frågesport i tv söker en tävlande som vet var saker ligger. Prispengar. Inspelning i morgon.',
    signatur: 'Redaktionen',
    utfall: [
      { text: 'Du bromsar på tio poäng och vet svaret. Publiken jublar, programledaren ser förvånad ut, och prispengarna betalas ut.', effekt: { money: 1200, rykte: 2 }, vikt: 2 },
      { text: 'Du bromsar för tidigt och gissar på Köping. Det var inte Köping. Tröstpriset är en kaffemugg.', vikt: 2 },
      { text: 'Inspelningen är på ett språk du inte kan. Du nickar på rätt ställen och får ändå ett deltagararvode.', effekt: { money: 300 } },
    ],
  },
  {
    id: 'planbok',
    rubrik: 'Hittad: plånbok',
    text: 'Brun plånbok upphittad på stationen. Ägaren kan beskriva innehållet och hämta den mot bevis.',
    signatur: 'Ärlig upphittare',
    utfall: [
      { text: 'Det är inte din plånbok. Men upphittaren är trevlig och har en soffa; du sparar en hotellnatt.', effekt: { money: 200 }, vikt: 2 },
      { text: 'Du beskriver innehållet i en plånbok du aldrig ägt, blir avslöjad och får en utskällning inför hela kafét.', effekt: { rykte: -1 }, vikt: 2 },
      { text: 'Upphittaren har hittat sjutton plånböcker den här veckan. Du frågar inte hur. Du går därifrån fort.' },
    ],
  },
  {
    id: 'modell',
    rubrik: 'Modell sökes till konstskola',
    text: 'Kvällskursen behöver någon att teckna. Stilla sittande i två timmar, alla kläder på. Ersättning per pass.',
    signatur: 'Konstskolan, sal 3',
    utfall: [
      { text: 'Du sitter stilla i två timmar. Sjutton teckningar, varav tre liknar dig. Betalt per pass, som utlovat.', effekt: { money: 380 }, vikt: 3 },
      { text: 'Läraren tycker att din näsa är "intressant" och beställer ett extrapass. Dubbel ersättning.', effekt: { money: 760 } },
      { text: 'Du somnar efter tjugo minuter. Eleverna tecknar dig sovande. Halv ersättning.', effekt: { money: 180 }, vikt: 2 },
    ],
  },
  {
    id: 'brollop',
    rubrik: 'Bröllopsgäster sökes',
    text: 'Brudens sida är tunn. Kom, ät, dansa, säg att du är en kusin från utlandet. Klädkod: finkläder eller nästan.',
    signatur: 'Brudens mor',
    utfall: [
      { text: 'Du är kusinen från Sverige hela kvällen. Maten är oändlig, dansen likaså, och brudens far stoppar sedlar i din ficka "till resan".', effekt: { money: 500, rykte: 1 }, vikt: 2 },
      { text: 'Brudgummen har också hyrt gäster. Ni är fyra kusiner från Sverige. Det blir en lång kväll, men en rolig.', effekt: { rykte: 1 }, vikt: 2 },
      { text: 'Bruden ångrar sig vid altaret. Festen hålls ändå. Du får med dig tårta för en vecka.', vikt: 1 },
    ],
  },
  {
    id: 'guide',
    rubrik: 'Turistguide sökes för en dag',
    text: 'Grupp på tolv från en kryssning vill se staden. Vi vet inget, du vet säkert mer. Betalt per person.',
    signatur: 'Däck 7',
    utfall: [
      { text: 'Du hittar på hälften och gruppen märker inget. Tolv nöjda kryssningsgäster betalar per person.', effekt: { money: 650 }, vikt: 2 },
      { text: 'En i gruppen är pensionerad historielärare och rättar dig i tre timmar. Du får betalt, men bara av de andra elva.', effekt: { money: 500 }, vikt: 2 },
      { text: 'Gruppen blir kvar på ett kafé och hinner inte tillbaka till båten. De skyller på dig. Ingen betalar.', effekt: { rykte: -1 } },
    ],
  },
  {
    id: 'karaoke',
    rubrik: 'Duettpartner till karaoke',
    text: 'Finalen på onsdag. Min partner har tappat rösten. Söker någon som kan andrastämman i vad som helst.',
    signatur: 'Sopranen',
    utfall: [
      { text: 'Ni vinner. Priset är en middag och en pokal som inte får plats i ryggsäcken. Middagen tar du.', effekt: { money: 250, rykte: 1 }, vikt: 2 },
      { text: 'Ni kommer sist, men publiken älskar er. Någon bjuder på hela kvällen.', effekt: { rykte: 1 }, vikt: 2 },
      { text: 'Sopranen är en tenor och sjunger allt en oktav för högt. Ni diskas i första omgången.' },
    ],
  },
  {
    id: 'lakare',
    rubrik: 'Frivilliga sökes till läkemedelsstudie',
    text: 'Enkel sömnstudie. Du sover, vi tittar. Ersättning utgår. Inga kända biverkningar, hittills.',
    signatur: 'Kliniken',
    utfall: [
      { text: 'Du sover som en sten och får betalt för det. Bästa jobbet på hela resan.', effekt: { money: 600 }, vikt: 2 },
      { text: 'Du sover inte alls, eftersom sex personer tittar på dig. Ersättningen betalas ut ändå, motvilligt.', effekt: { money: 400 }, vikt: 2 },
      { text: 'Biverkningen visade sig vara att du sover i ett dygn till. Kliniken beklagar.', effekt: { days: 1, money: 500 } },
    ],
  },
  {
    id: 'marknad',
    rubrik: 'Söker någon som kan pruta',
    text: 'Ska köpa en matta men vågar inte förhandla. Du får procent på allt du sparar åt mig.',
    signatur: 'Konflikträdd',
    regioner: ['mellanostern', 'afrika', 'asien'],
    utfall: [
      { text: 'Du prutar ner mattan till hälften. Din procent räcker till flera nätter.', effekt: { money: 550, rykte: 1 }, vikt: 2 },
      { text: 'Du prutar så hårt att handlaren blir förolämpad och stänger butiken. Ingen matta, inga procent, men te.', vikt: 2 },
      { text: 'Du prutar upp priset av misstag. Den konflikträdde betalar utan att säga något. Du får procent på ingenting.', effekt: { rykte: -1 } },
    ],
  },
  {
    id: 'tango',
    rubrik: 'Danspartner sökes',
    text: 'Lektion i kväll, min partner har fått förhinder. Ingen erfarenhet krävs, bara fötter.',
    signatur: 'Salongen vid hörnet',
    regioner: ['latinamerika', 'europa'],
    utfall: [
      { text: 'Du har fötter. Det räcker. Efter lektionen bjuder salongen på vin och en biljett till nästa.', effekt: { rykte: 1 }, vikt: 2 },
      { text: 'Du trampar din partner på foten fjorton gånger. Lektionen slutar tidigt, men du får ett fribrev från läraren: "kom aldrig igen".', vikt: 2 },
      { text: 'Salongen filmar lektionen för sin reklam. Du får arvode för att ha sett tillräckligt vilsen ut.', effekt: { money: 300 } },
    ],
  },
  {
    id: 'bat',
    rubrik: 'Däckshand sökes för en dag',
    text: 'Seglar över bukten och tillbaka. Behöver någon som kan hålla i ett rep när jag säger till. Lunch ombord.',
    signatur: 'Skepparen',
    regioner: ['norden', 'europa', 'oceanien', 'nordamerika'],
    utfall: [
      { text: 'Du håller i repet när skepparen säger till. Sjön ligger blank och lunchen är räkor. Skepparen betalar i kontanter och tips.', effekt: { money: 450, rating: 4 }, vikt: 2 },
      { text: 'Du släpper repet när skepparen säger till. Det var fel rep. Ni ligger still i tre timmar. Ingen lön, men skepparen bjuder ändå på lunch.', vikt: 2 },
      { text: 'Det blåser upp. Du mår illa hela vägen över och hela vägen tillbaka. Skepparen ger dig extra betalt "för att du inte klagade". Du kunde inte.', effekt: { money: 600 } },
    ],
  },
  {
    id: 'brev',
    rubrik: 'Söker någon som kan svenska',
    text: 'Har ett brev från en farbror i Sverige. Har haft det i tolv år. Vill veta vad det står. Betalar i mat.',
    signatur: 'Nyfiken sedan 2014',
    utfall: [
      { text: 'Brevet är ett arv. Ett litet, men ett arv. Farbrorn är död sedan länge, men pengarna finns kvar på banken. Du får en andel för besväret.', effekt: { money: 800, rykte: 1 } },
      { text: 'Brevet är en räkning från Bilprovningen. Du översätter så skonsamt du kan. Middagen är ändå god.', vikt: 3 },
      { text: 'Brevet är ett kärleksbrev. Du läser upp det högt. Alla i rummet gråter. Ingen minns att äta.', effekt: { rykte: 1 }, vikt: 2 },
    ],
  },
  {
    id: 'kanel',
    rubrik: 'Provsmakare sökes',
    text: 'Nytt gatukök behöver ärliga omdömen. Ät allt på menyn, säg vad du tycker. Ingen ersättning, men ingen räkning heller.',
    signatur: 'Kocken',
    utfall: [
      { text: 'Du äter allt på menyn. Allt är gott utom en sak, och kocken tackar dig för just den. Du sparar en hel dags mat.', effekt: { money: 150 }, vikt: 3 },
      { text: 'Du äter allt på menyn. Det borde du inte ha gjort. Nästa dag tillbringas på hotellrummet.', effekt: { days: 1 } },
      { text: 'Kocken är så nöjd att hen sätter ditt namn på en rätt. "Upptäckarens special" står på tavlan när du går.', effekt: { rykte: 2 } },
    ],
  },
];

/** Annonserna som kan förekomma i en region. */
export function annonserFor(region: Region): Kontaktannons[] {
  return KONTAKTANNONSER.filter((a) => !a.regioner || a.regioner.includes(region));
}
