/**
 * Uppdrag: en person med ett ärende till en annan stad. Dyker upp i stället
 * för var fjärde slumphändelse, betalar bra när man kliver av i rätt stad,
 * och ger stämplar. Tonen är tidningens: bisarr, saklig, utan utropstecken.
 *
 * Inget uppdrag går på tid. Ett ärende man bär på ska dra resan vidare, inte
 * jaga spelaren - och den som väntar har väntat länge nog för att kunna vänta
 * lite till. Vissa ärenden fortsätter i stället: den man lämnar till har
 * något eget att skicka vidare, och då erbjuds nästa steg på plats.
 *
 * `{stad}`, `{land}` och `{belopp}` byts mot mål och ersättning när uppdraget erbjuds.
 */
export interface Uppdrag {
  id: string;
  titel: string;
  /** Vad personen säger */
  text: string;
  /** Det man bär på, som det står i ryggsäcken */
  foremal: string;
  /** Belöning i basenheter (svenska kronor) */
  belopp: number;
  /** Vad som sägs när man lämnar över */
  klar: string;
  /**
   * Uppdraget som erbjuds direkt när det här lämnats över, om ärendet
   * fortsätter. Den som tar emot har något eget att skicka vidare, och
   * kedjan drar spelaren över världen i stället för att ta slut vid dörren.
   *
   * Ett uppdrag som står som `nasta` någonstans lottas aldrig fram på egen
   * hand - det kommer bara som fortsättning.
   */
  nasta?: string;
}

export const UPPDRAG: Uppdrag[] = [
  { id: 'dovkatt', titel: 'En döv katt', text: 'Jag vill att du lämnar min döva katt till min syster i {stad}. Hon hör inget, så hon klagar inte. Katten alltså. Du får {belopp} för besväret.', foremal: 'En döv katt i korg', belopp: 5000, klar: 'Systern tar emot korgen utan ett ord. Katten ser inte förvånad ut. Ingen av dem gör det.' },
  { id: 'surdeg', titel: 'Surdegen', text: 'Min surdeg är från 1987 och måste matas var tredje dag. Min bror i {stad} har mjölet. Ta med den, mata den, lämna den. {belopp}, och du får en bit när den är bakad.', foremal: 'En surdeg från 1987', belopp: 3200, klar: 'Brodern luktar på burken och nickar. "Hon lever." Du får en brödbit och pengarna, i den ordningen.' },
  { id: 'urna', titel: 'Farfar', text: 'Det här är farfar. Han ville alltid se {stad}, men kom aldrig iväg. Ställ honom på ett café med utsikt och sitt en stund. {belopp}. Han bjuder.', foremal: 'En urna med farfar', belopp: 4000, klar: 'Du sitter en halvtimme med urnan på bordet. Servitrisen frågar inget. Farfar hade gillat det.' },
  { id: 'nyckel', titel: 'Nyckeln', text: 'Den här nyckeln går till en dörr i {stad}. Jag minns inte vilken. Lämna den i receptionen på stadens äldsta hotell, de vet. {belopp}. Fråga inte vad som finns bakom dörren. Jag vet inte heller.', foremal: 'En nyckel till en okänd dörr', belopp: 2800, klar: 'Receptionisten tar nyckeln, tittar på den länge och säger "äntligen". Sedan inget mer.' },
  { id: 'brev', titel: 'Ett brev', text: 'Ett brev till en kvinna i {stad}. Handskrivet, inget frimärke, ingen adress. Hon heter Margit och sitter oftast på bänken vid stationen. {belopp}. Läs det inte. Jag har redan läst det.', foremal: 'Ett brev till Margit', belopp: 3500, klar: 'Margit sitter på bänken. Hon läser brevet två gånger, viker ihop det och säger "han har alltid stavat fel". Pengarna ligger i ett kuvert under bänken.' },
  { id: 'kaktus', titel: 'Kaktusen', text: 'Min kaktus tål inte klimatet här. Den mår bättre i {stad}, säger min veterinär, som egentligen är tandläkare. Ta den dit. {belopp}. Vattna inte. Vad du än gör: vattna inte.', foremal: 'En kaktus som inte får vatten', belopp: 2400, klar: 'Kaktusen står i ett fönster i {stad} nu. Den ser likadan ut. Det är poängen med kaktusar.' },
  { id: 'schack', titel: 'Draget', text: 'Jag spelar schack per bud med en man i {stad} sedan 1994. Det är hans tur, men han litar inte på posten. Lämna det här draget personligen: springare f3. {belopp}. Han bjuder på te. Tacka nej till teet.', foremal: 'Ett schackdrag, springare f3', belopp: 3000, klar: 'Mannen tittar på lappen i tio minuter, säger "intressant" och bjuder på te. Du tackar nej. Han ser lättad ut.' },
  { id: 'stol', titel: 'Stolen', text: 'Min mormors stol ska tillbaka till {stad}, där hon köpte den 1961. Den går att fälla ihop, nästan. {belopp}, för den är tung och du kommer att svära.', foremal: 'En hopfällbar stol som nästan går att fälla', belopp: 6000, klar: 'Antikhandlaren i {stad} känner igen stolen. "Den här såldes härifrån 1961", säger han. Han ställer den i skyltfönstret, där den stod från början, och betalar ut vad han lovat.' },
  { id: 'papegoja', titel: 'Papegojan', text: 'Papegojan har lärt sig ett ord jag inte kan ha i huset. Min kusin i {stad} tycker att ordet är roligt. Lämna den där. {belopp}. Täck buren när ni passerar tullen.', foremal: 'En papegoja med ett ord', belopp: 4500, klar: 'Kusinen lyfter täcket. Papegojan säger ordet. Kusinen skrattar så hen får hosta. Ni är alla överens om att det var värt det.' },
  { id: 'bok', titel: 'Bokens sista exemplar', text: 'Det här är sista exemplaret av min diktsamling. Biblioteket i {stad} har beställt det, sedan 2009. Ta det dit innan de ändrar sig. {belopp}. Läs gärna, men inte högt.', foremal: 'Sista exemplaret av en diktsamling', belopp: 2600, klar: 'Bibliotekarien i {stad} letar i datorn i fem minuter. "Ja. 2009. Vi hade nästan gett upp." Boken får en egen hylla, för den är den enda.' },
  { id: 'paraply', titel: 'Paraplyet', text: 'Jag lånade det här paraplyet av en främling i {stad} för länge sedan. Hon sa "lämna tillbaka det när du kan". Jag kan nu. Hon står i tobaksaffären vid torget. {belopp}, och min nattsömn.', foremal: 'Ett paraply, lånat av en främling', belopp: 2200, klar: 'Kvinnan i tobaksaffären tittar på paraplyet. "Det där är inte mitt." Ni tittar på varandra. Hon tar det ändå, och räcker dig kuvertet som legat bakom kassan i alla år.' },
  { id: 'kortlek', titel: 'Spader dam', text: 'Kortleken saknar spader dam. Den ligger hos en man i {stad} som förlorade den i ett vad. Hämta inte. Lämna resten av leken hos honom, så är den hel igen. {belopp}. Han kommer att erbjuda dig ett vad. Tacka nej.', foremal: 'En kortlek utan spader dam', belopp: 3100, klar: 'Mannen lägger spader dam överst i leken och ler. "Vill du slå vad om något?" Du tackar nej. Han ser ut att ha förväntat sig det.' },
  { id: 'glasogon', titel: 'Läsglasögonen', text: 'Min mans läsglasögon ligger kvar i {stad} sedan vår resa. Han har inte kunnat läsa tidningen på tre veckor, och det märks. Hämta dem inte, de är inte där. Lämna det här nya paret hos hotellet, så att de finns där nästa gång. {belopp}.', foremal: 'Ett par läsglasögon, +2,5', belopp: 2000, klar: 'Hotellet i {stad} lägger glasögonen i hittegodslådan. Där ligger redan tre par med samma styrka. Du säger inget.' },
  { id: 'recept', titel: 'Receptet', text: 'Receptet på min mormors köttbullar får inte skrivas ner. Jag ska berätta det för dig, och du ska berätta det för min dotter i {stad}. Lyssna noga. Muskot. Inte för mycket. {belopp}.', foremal: 'Ett recept i huvudet, med muskot', belopp: 3800, klar: 'Dottern lyssnar, nickar, och säger "hon sa kryddpeppar till mig". Ni bestämmer er för att mormor sa olika saker till olika barn. Pengarna kommer ändå.' },
  { id: 'sten', titel: 'Stenen', text: 'Jag tog den här stenen med mig från {stad} som barn. Nu drömmer jag om den varje natt. Lägg tillbaka den. Det spelar ingen roll var, men det ska vara i staden. {belopp}.', foremal: 'En sten som ska hem', belopp: 2900, klar: 'Du lägger stenen på marken i {stad}. Den ser ut som alla andra stenar. Det är nog tanken. Kvällen efter sover en människa gott, på annat håll.' },
  { id: 'svar', titel: 'Svaret', text: 'En man i {stad}, {land}, ställde en fråga till mig 1998. Jag har svaret nu. Det är "ja". Säg det till honom. Han heter Bertil och driver kiosken vid hamnen. {belopp}. Säg inget mer än ja.', foremal: 'Ett ja, till Bertil', belopp: 3300, klar: 'Bertil hör ordet, stänger kiosken mitt på dagen och går hem. Du får pengarna av den som skickade dig. Vad frågan var får du aldrig veta.' },

  // ------------------------------------------------------------- kedjorna
  // Fyra ärenden som fortsätter. Steg två och tre lottas aldrig fram själva;
  // de kommer när föregående steg lämnats över, ur handen på den som tog emot.

  // Ingegerds vykort: sjutton kort skrivna 1961, aldrig skickade.
  { id: 'vykort1', titel: 'Det första vykortet', text: 'Jag skrev sjutton vykort sommaren 1961 och postade inte ett enda. De ligger kvar i lådan. Det här ska till Margareta i {stad}, om hon lever, och det gör hon. Vi var arton då. {belopp}.', foremal: 'Ett vykort från 1961', belopp: 3400, klar: 'Margareta vänder på kortet, läser, och blir sittande. "Sextiofyra år", säger hon. "Han hade kunnat frimärka det." Sedan hämtar hon en penna.', nasta: 'vykort2' },
  { id: 'vykort2', titel: 'Margaretas svar', text: 'Margareta har skrivit på baksidan av samma kort. "Ta det till Sixten i {stad}", säger hon. "Han var med den sommaren och tror att han glömt bort det. Det har han inte." {belopp}, ur en burk i skafferiet.', foremal: 'Vykortet från 1961, nu med två handstilar', belopp: 3900, klar: 'Sixten läser båda sidorna två gånger. "Jag mindes fel om vem som cyklade hem först", säger han. Han tar fram en penna han inte behöver leta efter.', nasta: 'vykort3' },
  { id: 'vykort3', titel: 'Det sista vykortet', text: 'Sixten har skrivit under de andra två. Nu ska kortet till Elsa i {stad}, den sista av dem som var med. "Sedan är det färdigt", säger han. "Sedan har alla sagt sitt." {belopp}.', foremal: 'Ett vykort med tre handstilar', belopp: 4600, klar: 'Elsa läser hela kortet, från 1961 och framåt, och skrattar till på ett ställe. Hon sätter upp det på kylskåpet med en magnet. "Där", säger hon. "Nu är sommaren slut."' },

  // Klockan i Bruno Falks verkstad, som gått fel sedan 1978.
  { id: 'klocka1', titel: 'Fjädern', text: 'Golvuret i min verkstad har gått elva minuter fel sedan 1978. Fjädern är utmattad och den som kan smida en ny finns i {stad}. Ta med den gamla som mått. {belopp}. Ta god tid på dig, uret har haft fel i fyrtiosju år.', foremal: 'En utmattad urfjäder', belopp: 3600, klar: 'Smeden i {stad} håller fjädern mot ljuset och blåser bort damm som legat där sedan sjuttiotalet. "Två veckor", säger hon. "Och du får ta med dig något tillbaka."', nasta: 'klocka2' },
  { id: 'klocka2', titel: 'Pendeln', text: 'Smeden räcker dig en pendel i mässing. "Den här har legat här i tjugo år och väntat på rätt ur. Den ska till en verkstad i {stad} för att balanseras, annars går den lika fel som fjädern gjorde." {belopp}, och hon menar att du gör henne en tjänst.', foremal: 'En obalanserad mässingspendel', belopp: 4200, klar: 'Urmakaren i {stad} hänger pendeln i en tråd och ser den svänga snett. "Där", säger hon och märker ut en punkt med blyerts. "Ett halvt gram." Sedan filar hon i fem minuter och räcker över den igen.', nasta: 'klocka3' },
  { id: 'klocka3', titel: 'Hem till Bruno', text: 'Nu är allt färdigt utom sammansättningen, och den vill Bruno göra själv. Hans bror driver samma slags verkstad i {stad} och har ritningarna. Lämna delarna där, så åker de sista biten på posten. {belopp}, och Bruno hälsar.', foremal: 'En ny fjäder och en balanserad pendel', belopp: 5200, klar: 'Brodern packar delarna i en låda med hyvelspån och skriver Brunos adress med samma handstil som Bruno har. "Han kommer att klaga på att jag packat fel", säger han förnöjt. Uret i hörnet slår, elva minuter för tidigt.' },

  // Doktor Aminas tomma fotoalbum.
  { id: 'album1', titel: 'Den tomma sidan', text: 'Jag har ett fotoalbum med sextiotvå tomma sidor och en handskriven lista på städer jag aldrig hann till. Här är en kamera. Ta ett kort i {stad}, vilket som helst, och lämna det hos framkallaren där. Han vet vad det gäller. {belopp}.', foremal: 'En kamera med en bild kvar på rullen', belopp: 3000, klar: 'Framkallaren i {stad} tittar på kameran och sedan på dig. "Amina", säger han, som om det förklarade allt. Han lägger rullen i en låda där det redan ligger fjorton andra.', nasta: 'album2' },
  { id: 'album2', titel: 'Nästa sida', text: 'Framkallaren räcker dig en ny kamera och ett kuvert. "Samma sak igen, i {stad}. Och ta det här kuvertet till kollegan där - det är bilderna från förra året, och han har väntat." {belopp}. Han säger att Amina betalar i efterskott, men alltid.', foremal: 'En kamera till, och ett kuvert med bilder', belopp: 3700, klar: 'Kollegan i {stad} öppnar kuvertet på disken och går igenom bilderna en och en. "Hon har varit på fler ställen än jag trodde", säger han. "Fast hon har ju inte varit någonstans."', nasta: 'album3' },
  { id: 'album3', titel: 'Sista sidan', text: 'Den här gången är det inget kuvert, bara en adress i {stad} och ett ord: sista. "Hon fyller nittio i höst", säger framkallaren. "Albumet ska vara fullt då." {belopp}.', foremal: 'Den sista bilden till albumet', belopp: 4800, klar: 'Adressen i {stad} är ett bibliotek. Bibliotekarien tar emot bilden, sätter in den på sida sextiotvå och stänger albumet. "Klart", säger hon i telefonen till någon som väntat vid andra änden. Du hör ett skratt genom luren.' },

  // Kappsäcken som ingen vill ha kvar.
  { id: 'kappsack1', titel: 'Kappsäcken', text: 'Den här kappsäcken har stått i min hall i sex år. Den kom med posten, adresserad till en Herr Lindqvist som aldrig bott här. Nu har jag hittat en Lindqvist i {stad}. {belopp}, och jag får hallen tillbaka.', foremal: 'En kappsäck adresserad till Lindqvist', belopp: 3200, klar: 'Lindqvist i {stad} öppnar kappsäcken på trappan, tittar ner i den och säger "nej". Han stänger den igen. "Det är inte min. Men jag vet en Lindqvist till."', nasta: 'kappsack2' },
  { id: 'kappsack2', titel: 'Nästa Lindqvist', text: 'Den här Lindqvist bor i {stad} och är kusin till den förra. "Han samlar på sådant", säger mannen och räcker tillbaka kappsäcken. "Eller så gör han inte det. Vi talas inte vid." {belopp}, som han insisterar på att betala trots att det är hans kappsäck som reser.', foremal: 'Kappsäcken, fortfarande Lindqvists', belopp: 3800, klar: 'Kusinen i {stad} känner igen kappsäcken direkt. "Den där skickade jag i väg 2019", säger han. "Den kommer alltid tillbaka." Han ser inte olycklig ut.', nasta: 'kappsack3' },
  { id: 'kappsack3', titel: 'Vad som ligger i den', text: 'Kusinen har öppnat kappsäcken och lagt något i den. "Nu är det värt att den reser", säger han. "Ta den till adressen i {stad}. Öppna den inte. Den som får den kommer att veta." {belopp}.', foremal: 'Kappsäcken, tyngre än förut', belopp: 5400, klar: 'Kvinnan i {stad} öppnar kappsäcken i dörren, tittar ner i den och blir stående länge. "Han har alltså kvar den", säger hon. Du får aldrig veta vad det var. Hon räknar upp pengarna utan att titta.' },
];
