/**
 * Uppdrag: en person med ett ärende till en annan stad. Dyker upp i stället
 * för var fjärde slumphändelse, betalar bra när man kliver av i rätt stad,
 * och ger stämplar. Tonen är tidningens: bisarr, saklig, utan utropstecken.
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
  /** Dagar man har på sig, om det brådskar */
  dagar?: number;
  /** Vad som sägs när man lämnar över */
  klar: string;
}

export const UPPDRAG: Uppdrag[] = [
  { id: 'dovkatt', titel: 'En döv katt', text: 'Jag vill att du lämnar min döva katt till min syster i {stad}. Hon hör inget, så hon klagar inte. Katten alltså. Du får {belopp} för besväret.', foremal: 'En döv katt i korg', belopp: 5000, dagar: 14, klar: 'Systern tar emot korgen utan ett ord. Katten ser inte förvånad ut. Ingen av dem gör det.' },
  { id: 'surdeg', titel: 'Surdegen', text: 'Min surdeg är från 1987 och måste matas var tredje dag. Min bror i {stad} har mjölet. Ta med den, mata den, lämna den. {belopp}, och du får en bit när den är bakad.', foremal: 'En surdeg från 1987', belopp: 3200, dagar: 12, klar: 'Brodern luktar på burken och nickar. "Hon lever." Du får en brödbit och pengarna, i den ordningen.' },
  { id: 'urna', titel: 'Farfar', text: 'Det här är farfar. Han ville alltid se {stad}, men kom aldrig iväg. Ställ honom på ett café med utsikt och sitt en stund. {belopp}. Han bjuder.', foremal: 'En urna med farfar', belopp: 4000, klar: 'Du sitter en halvtimme med urnan på bordet. Servitrisen frågar inget. Farfar hade gillat det.' },
  { id: 'nyckel', titel: 'Nyckeln', text: 'Den här nyckeln går till en dörr i {stad}. Jag minns inte vilken. Lämna den i receptionen på stadens äldsta hotell, de vet. {belopp}. Fråga inte vad som finns bakom dörren. Jag vet inte heller.', foremal: 'En nyckel till en okänd dörr', belopp: 2800, klar: 'Receptionisten tar nyckeln, tittar på den länge och säger "äntligen". Sedan inget mer.' },
  { id: 'brev', titel: 'Ett brev', text: 'Ett brev till en kvinna i {stad}. Handskrivet, inget frimärke, ingen adress. Hon heter Margit och sitter oftast på bänken vid stationen. {belopp}. Läs det inte. Jag har redan läst det.', foremal: 'Ett brev till Margit', belopp: 3500, dagar: 10, klar: 'Margit sitter på bänken. Hon läser brevet två gånger, viker ihop det och säger "han har alltid stavat fel". Pengarna ligger i ett kuvert under bänken.' },
  { id: 'kaktus', titel: 'Kaktusen', text: 'Min kaktus tål inte klimatet här. Den mår bättre i {stad}, säger min veterinär, som egentligen är tandläkare. Ta den dit. {belopp}. Vattna inte. Vad du än gör: vattna inte.', foremal: 'En kaktus som inte får vatten', belopp: 2400, klar: 'Kaktusen står i ett fönster i {stad} nu. Den ser likadan ut. Det är poängen med kaktusar.' },
  { id: 'schack', titel: 'Draget', text: 'Jag spelar schack per bud med en man i {stad} sedan 1994. Det är hans tur, men han litar inte på posten. Lämna det här draget personligen: springare f3. {belopp}. Han bjuder på te. Tacka nej till teet.', foremal: 'Ett schackdrag, springare f3', belopp: 3000, klar: 'Mannen tittar på lappen i tio minuter, säger "intressant" och bjuder på te. Du tackar nej. Han ser lättad ut.' },
  { id: 'stol', titel: 'Stolen', text: 'Min mormors stol ska tillbaka till {stad}, där hon köpte den 1961. Den går att fälla ihop, nästan. {belopp}, för den är tung och du kommer att svära.', foremal: 'En hopfällbar stol som nästan går att fälla', belopp: 6000, dagar: 16, klar: 'Antikhandlaren i {stad} känner igen stolen. "Den här såldes härifrån 1961", säger han. Han ställer den i skyltfönstret, där den stod från början, och betalar ut vad han lovat.' },
  { id: 'papegoja', titel: 'Papegojan', text: 'Papegojan har lärt sig ett ord jag inte kan ha i huset. Min kusin i {stad} tycker att ordet är roligt. Lämna den där. {belopp}. Täck buren när ni passerar tullen.', foremal: 'En papegoja med ett ord', belopp: 4500, dagar: 12, klar: 'Kusinen lyfter täcket. Papegojan säger ordet. Kusinen skrattar så hen får hosta. Ni är alla överens om att det var värt det.' },
  { id: 'bok', titel: 'Bokens sista exemplar', text: 'Det här är sista exemplaret av min diktsamling. Biblioteket i {stad} har beställt det, sedan 2009. Ta det dit innan de ändrar sig. {belopp}. Läs gärna, men inte högt.', foremal: 'Sista exemplaret av en diktsamling', belopp: 2600, klar: 'Bibliotekarien i {stad} letar i datorn i fem minuter. "Ja. 2009. Vi hade nästan gett upp." Boken får en egen hylla, för den är den enda.' },
  { id: 'paraply', titel: 'Paraplyet', text: 'Jag lånade det här paraplyet av en främling i {stad} för länge sedan. Hon sa "lämna tillbaka det när du kan". Jag kan nu. Hon står i tobaksaffären vid torget. {belopp}, och min nattsömn.', foremal: 'Ett paraply, lånat av en främling', belopp: 2200, klar: 'Kvinnan i tobaksaffären tittar på paraplyet. "Det där är inte mitt." Ni tittar på varandra. Hon tar det ändå, och räcker dig kuvertet som legat bakom kassan i alla år.' },
  { id: 'kortlek', titel: 'Spader dam', text: 'Kortleken saknar spader dam. Den ligger hos en man i {stad} som förlorade den i ett vad. Hämta inte. Lämna resten av leken hos honom, så är den hel igen. {belopp}. Han kommer att erbjuda dig ett vad. Tacka nej.', foremal: 'En kortlek utan spader dam', belopp: 3100, klar: 'Mannen lägger spader dam överst i leken och ler. "Vill du slå vad om något?" Du tackar nej. Han ser ut att ha förväntat sig det.' },
  { id: 'glasogon', titel: 'Läsglasögonen', text: 'Min mans läsglasögon ligger kvar i {stad} sedan vår resa. Han har inte kunnat läsa tidningen på tre veckor, och det märks. Hämta dem inte, de är inte där. Lämna det här nya paret hos hotellet, så att de finns där nästa gång. {belopp}.', foremal: 'Ett par läsglasögon, +2,5', belopp: 2000, klar: 'Hotellet i {stad} lägger glasögonen i hittegodslådan. Där ligger redan tre par med samma styrka. Du säger inget.' },
  { id: 'recept', titel: 'Receptet', text: 'Receptet på min mormors köttbullar får inte skrivas ner. Jag ska berätta det för dig, och du ska berätta det för min dotter i {stad}. Lyssna noga. Muskot. Inte för mycket. {belopp}.', foremal: 'Ett recept i huvudet, med muskot', belopp: 3800, dagar: 9, klar: 'Dottern lyssnar, nickar, och säger "hon sa kryddpeppar till mig". Ni bestämmer er för att mormor sa olika saker till olika barn. Pengarna kommer ändå.' },
  { id: 'sten', titel: 'Stenen', text: 'Jag tog den här stenen med mig från {stad} som barn. Nu drömmer jag om den varje natt. Lägg tillbaka den. Det spelar ingen roll var, men det ska vara i staden. {belopp}.', foremal: 'En sten som ska hem', belopp: 2900, klar: 'Du lägger stenen på marken i {stad}. Den ser ut som alla andra stenar. Det är nog tanken. Kvällen efter sover en människa gott, på annat håll.' },
  { id: 'svar', titel: 'Svaret', text: 'En man i {stad}, {land}, ställde en fråga till mig 1998. Jag har svaret nu. Det är "ja". Säg det till honom. Han heter Bertil och driver kiosken vid hamnen. {belopp}. Säg inget mer än ja.', foremal: 'Ett ja, till Bertil', belopp: 3300, klar: 'Bertil hör ordet, stänger kiosken mitt på dagen och går hem. Du får pengarna av den som skickade dig. Vad frågan var får du aldrig veta.' },
];
