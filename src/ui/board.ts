import {
  buildBoard,
  dayLabel,
  hhmm,
  rescheduleDeparture,
  statusForMinutes,
  statusText,
  STAND_LABEL,
  type Departure,
} from '../game/departures';
import { CITIES } from '../data/cities';
import { MODE_LABELS, type TransportMode } from '../data/transport';
import type { City } from '../data/types';
import { blockedRoutes } from '../game/travel';
import type { Difficulty } from '../game/state';
import { clear, el } from './dom';
import { playSound, playStation } from './audio';

/**
 * Den elektroniska avgångstavlan.
 *
 * Tavlan äger sitt eget DOM och sin egen takt. Resten av spelet ritar om hela
 * skärmar när något händer; det går inte här, för då skulle en tavla som
 * uppdaterar sig var femte sekund blinka till i sin helhet och tappa både
 * rullning och fokus. I stället byts enskilda celler ut, och bara de som
 * faktiskt ändrat sig.
 *
 * Tiderna kommer från väggklockan, inte från spelets dag. Det är avsiktligt:
 * tavlan ska kännas levande utan att någonsin hindra en spelare från att resa.
 * Trycker man på en avgång som redan gått blir man ombokad, precis som i en
 * riktig biljettlucka.
 */

/** Klockan på väggen, som minuter efter midnatt med decimaler. */
export function wallClock(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export interface BoardHandle {
  node: HTMLElement;
  stop: () => void;
}

export interface BoardOpts {
  from: City;
  mode: TransportMode;
  difficulty: Difficulty;
  /** Formaterar ett belopp i spelarens valuta */
  money: (amount: number) => string;
  /** Vad som händer när en rad trycks */
  onPick: (departure: Departure) => void;
}

/** Hur ofta tavlan ser över sig själv. */
const TICK_MS = 4000;

export function renderBoard(opts: BoardOpts): BoardHandle {
  const { from, mode, difficulty, money, onPick } = opts;
  const start = buildBoard({ from, mode, difficulty, now: wallClock() });
  let rader = start.rows;
  /** Kommande turer att fylla på med. Bara hamnen har en turlista att följa. */
  const reserv = start.reserve;

  const wrap = el('section', { class: 'board', 'data-mode': mode });
  const klocka = el('span', { class: 'board-clock' }, hhmm(wallClock()));
  /**
   * Sökfältet. Tavlan visar hela linjenätet, och på en storflygplats är det
   * fyrtio rader. Utan ett sätt att gallra vore det snabbare att bläddra i en
   * lista, och då hade tavlan varit en meny igen.
   */
  const sok = el('input', {
    class: 'board-sok',
    type: 'search',
    placeholder: 'Sök destination',
    'aria-label': 'Sök destination på tavlan',
  }) as HTMLInputElement;
  const traff = el('span', { class: 'board-traff', hidden: true });
  /** Förklaringen när sökningen inte gav något. */
  const tomtSkal = el('p', { class: 'board-skal', hidden: true });

  wrap.append(
    el('div', { class: 'board-head' },
      el('span', { class: 'board-title' }, 'Avgångar'),
      el('span', { class: 'board-live' },
        el('span', { class: 'board-dot' }),
        'Direkt'
      ),
      klocka
    ),
    el('div', { class: 'board-sokrad' }, sok, traff),
    tomtSkal,
    el('div', { class: 'board-cols', 'aria-hidden': 'true' },
      el('span', {}, 'Tid'),
      el('span', {}, 'Destination'),
      el('span', {}, mode === 'farja' ? 'Fartyg' : 'Linje'),
      el('span', {}, STAND_LABEL[mode]),
      el('span', {}, 'Pris'),
      el('span', {}, 'Status')
    )
  );

  const lista = el('ol', {
    class: 'board-rows',
    'aria-label': 'Avgångar från stationen',
  });
  wrap.append(lista);

  /**
   * Textremsan längst ner. Den säger samma sak som högtalaren, fast läsbart,
   * och är det som gör att tavlan känns bemannad: någon står och skriver in
   * att tåget till Berlin har bytt spår.
   */
  // Remsan säger samma sak som statuskolumnen. En skärmläsare ska inte läsa
  // upp den var tolfte sekund; den som lyssnar har redan hört högtalaren.
  const remsa = el('div', { class: 'board-ticker', 'aria-hidden': 'true' });
  wrap.append(remsa);

  /** Raderna som ligger ute, så att en cell kan bytas i stället för hela raden. */
  const noder = new Map<string, HTMLElement>();

  const nyckel = (t: string) =>
    t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  /** Gallrar tavlan efter sökningen utan att rita om en enda rad. */
  const gallra = (): void => {
    const behov = nyckel(sok.value.trim());
    let synliga = 0;
    for (const d of rader) {
      const li = noder.get(d.id);
      if (!li) continue;
      const med =
        behov === '' ||
        nyckel(d.city.name).includes(behov) ||
        nyckel(d.city.country).includes(behov);
      li.hidden = !med;
      if (med) synliga++;
    }
    traff.hidden = behov === '';
    traff.textContent =
      synliga === 0 ? 'Ingen träff' : `${synliga} av ${rader.length}`;

    /**
     * En sökning utan träff är sällan ett stavfel. Oftast är det en stad som
     * finns, men som inte går att nå med just det här färdsättet - och då är
     * skälet mer värt än ett "ingen träff". Reglerna för vad som går och inte
     * ligger i game/travel.ts, samma regler som sätter upp stadens skyltar.
     */
    tomtSkal.hidden = !(behov !== '' && synliga === 0);
    if (!tomtSkal.hidden) {
      const traffad = CITIES.find(
        (c) =>
          c.id !== from.id &&
          (nyckel(c.name).includes(behov) || nyckel(c.country).includes(behov))
      );
      if (!traffad) {
        tomtSkal.textContent = `Ingen destination heter så. ${MODE_LABELS[mode]} härifrån går till ${rader.length} städer.`;
      } else {
        const skal = blockedRoutes(from, traffad).find((b) => b.mode === mode);
        tomtSkal.textContent = skal
          ? `${traffad.name}: ${skal.reason}`
          : `${traffad.name} går inte att nå med ${MODE_LABELS[mode].toLowerCase()} härifrån.`;
      }
    }
  };
  sok.addEventListener('input', gallra);

  /** Byter text i en cell och blinkar till, men bara när den ändrat sig. */
  const setCell = (row: HTMLElement, cls: string, text: string): void => {
    const cell = row.querySelector<HTMLElement>(`.${cls}`);
    if (!cell) return;
    const nu = cell.dataset['v'] ?? cell.textContent ?? '';
    if (nu === text) return;
    cell.dataset['v'] = text;
    cell.textContent = text;
    // Omstart av animationen kräver att klassen tas bort och läggs på igen
    // efter en reflow, annars händer ingenting andra gången.
    cell.classList.remove('flip');
    void cell.offsetWidth;
    cell.classList.add('flip');
  };

  const buildRow = (d: Departure): HTMLElement => {
    const li = el('li', {
      class: 'board-row board-row-ny',
      'data-status': d.status,
      'data-id': d.id,
    });
    const knapp = el('button', {
      type: 'button',
      class: 'board-pick',
      'data-sound': 'av',
    });
    const cell = (cls: string, text: string, label?: string) =>
      el(
        'span',
        // data-label ger den smala layouten en rubrik framför siffran, så att
        // "7" blir "Spår 7" på en telefonskärm utan en egen kolumnrad.
        { class: `board-cell ${cls}`, 'data-v': text, 'data-label': label },
        text
      );
    /**
     * Dagsmärket sätts bara i hamnen. Där betyder det något: nästa båt går
     * i morgon bitti. På en flygplats sträcker sig tavlan några timmar framåt
     * och passerar midnatt av sig själv, och då blir märket bara brus på
     * trettio rader.
     */
    const dagtext = mode === 'farja' ? dayLabel(d.dag) : undefined;
    knapp.append(
      // Klockslaget ligger i en egen cell inuti tiden, så att dagsmärket
      // ("i morgon") överlever när tiden skrivs om vid en försening.
      el('span', { class: 'board-cell col-time' },
        el('span', { class: 'col-time-h', 'data-v': hhmm(d.time + d.delay) },
          hhmm(d.time + d.delay)),
        dagtext ? el('span', { class: 'col-dag' }, dagtext) : ''
      ),
      el('span', { class: 'board-cell col-dest' },
        el('span', { class: 'col-dest-name', 'data-v': d.city.name }, d.city.name),
        el('span', { class: 'col-dest-land' }, d.city.country)
      ),
      cell('col-code', d.code),
      cell('col-stand', d.stand, STAND_LABEL[mode]),
      cell('col-price', money(d.route.price)),
      cell('col-status', statusText(d))
    );
    knapp.addEventListener('click', () => {
      playSound('valj');
      onPick(d);
    });
    li.append(knapp);
    // Klassen som får raden att glida in tas bort på nästa bildruta, annars
    // ligger den kvar och rader hoppar till vid varje uppdatering.
    requestAnimationFrame(() => li.classList.remove('board-row-ny'));
    return li;
  };

  const paint = (): void => {
    clear(lista);
    noder.clear();
    for (const d of rader) {
      const li = buildRow(d);
      noder.set(d.id, li);
      lista.append(li);
    }
    if (rader.length === 0) {
      lista.append(
        el('li', { class: 'board-tom' }, 'Inga avgångar just nu.')
      );
    }
  };


  /** En knuff på tavlan: förseningar, gatebyten och enstaka inställda turer. */
  const rucka = (): void => {
    if (rader.length === 0) return;
    const d = rader[Math.floor(Math.random() * rader.length)]!;
    const tarning = Math.random();
    if (tarning < 0.35 && d.status === 'itid' && d.delay === 0) {
      d.delay = 5 * (2 + Math.floor(Math.random() * 7));
      d.status = 'forsenad';
      // En försening som ingen berättar om är bara en siffra som ändrat sig.
      nyttUtrop(true);
    } else if (tarning < 0.78) {
      d.stand =
        mode === 'flyg'
          ? `${'ABCDEF'[Math.floor(Math.random() * 6)]}${1 + Math.floor(Math.random() * 42)}`
          : String(1 + Math.floor(Math.random() * (mode === 'tag' ? 18 : 26)));
      nyttUtrop(Math.random() < 0.4);
    } else if (tarning < 0.84 && d.status === 'itid') {
      d.status = 'installd';
      nyttUtrop(true);
    }
  };

  /** Ordet för påstigningsplatsen, böjt så att meningen går att läsa. */
  const platsord = (d: Departure): string =>
    mode === 'flyg'
      ? `gate ${d.stand}`
      : mode === 'tag'
        ? `spår ${d.stand}`
        : mode === 'buss'
          ? `läge ${d.stand}`
          : `kaj ${d.stand}`;

  const fordonsord =
    mode === 'flyg' ? 'Flight' : mode === 'tag' ? 'Tåg' : mode === 'buss' ? 'Buss' : 'Färjan';

  /** En mening ur högtalaren, byggd på det som faktiskt står på tavlan. */
  const utropstext = (): string => {
    if (rader.length === 0) return 'Inga avgångar just nu. Nästa tur anslås senare.';
    const installd = rader.find((d) => d.status === 'installd');
    if (installd && Math.random() < 0.5) {
      return `${fordonsord} ${installd.code} till ${installd.city.name} är inställd. Res med nästa tur på samma biljett.`;
    }
    const forsenad = rader.find((d) => d.delay > 0);
    if (forsenad && Math.random() < 0.5) {
      return `${fordonsord} ${forsenad.code} till ${forsenad.city.name} är ${forsenad.delay} minuter försenad. Vi beklagar förseningen.`;
    }
    const gar = rader.find((d) => d.status === 'sistautrop' || d.status === 'snart');
    if (gar) {
      return `Sista utrop för ${fordonsord.toLowerCase()} ${gar.code} till ${gar.city.name}, ${platsord(gar)}.`;
    }
    const stiger = rader.find((d) => d.status === 'boarding');
    if (stiger) {
      return mode === 'flyg'
        ? `Boarding pågår för ${stiger.code} till ${stiger.city.name}, ${platsord(stiger)}.`
        : `${fordonsord} ${stiger.code} till ${stiger.city.name} står vid ${platsord(stiger)}. Påstigning pågår.`;
    }
    const d = rader[Math.floor(Math.random() * rader.length)]!;
    return `${fordonsord} ${d.code} till ${d.city.name} avgår ${hhmm(d.time + d.delay)} från ${platsord(d)}.`;
  };

  const nyttUtrop = (hogtalare: boolean): void => {
    clear(remsa);
    // Ett nytt element i stället för ny text, så att rullningen börjar om.
    remsa.append(el('span', { class: 'board-ticker-text' }, utropstext()));
    if (hogtalare) playStation(mode, 'utrop');
  };

  let sedanRuck = 0;
  let sedanUtrop = 0;

  const tick = (): void => {
    const now = wallClock();
    klocka.textContent = hhmm(now);

    /**
     * Avgångar som gått. På en station med turlista - hamnen - rullar raden
     * bort och nästa tur glider in underifrån. På övriga stationer skrivs
     * raden i stället om till nästa tur samma dag, så att destinationen aldrig
     * försvinner från tavlan medan någon står och letar efter den.
     */
    const gangna = rader.filter((d) => d.time + d.delay - now <= -3);
    if (gangna.length > 0) {
      const senaste = rader.reduce((m, d) => Math.max(m, d.time), now);
      for (const d of gangna) {
        if (mode === 'farja') {
          const li = noder.get(d.id);
          if (li) {
            li.classList.add('board-row-bort');
            window.setTimeout(() => li.remove(), 420);
            noder.delete(d.id);
          }
          rader = rader.filter((r) => r !== d);
          const nasta = reserv.shift();
          if (nasta) rader.push(nasta);
        } else {
          rescheduleDeparture(from, d, senaste);
        }
      }
      playStation(mode, 'tavla');
    }

    sedanRuck += TICK_MS;
    if (sedanRuck >= 9000 && Math.random() < 0.55) {
      sedanRuck = 0;
      rucka();
    }

    sedanUtrop += TICK_MS;
    if (sedanUtrop >= 12000) {
      sedanUtrop = 0;
      // Var tredje gång går det också ut i högtalaren.
      nyttUtrop(Math.random() < 0.34);
    }

    // Statusen följer klockan, utom för det som är försenat eller inställt.
    for (const d of rader) {
      if (d.status === 'installd') continue;
      const till = d.time + d.delay - now;
      const ny = statusForMinutes(till, mode);
      if (d.delay > 0 && ny === 'itid') continue;
      d.status = ny;
    }

    rader.sort((a, b) => a.time + a.delay - (b.time + b.delay));

    // Nya rader läggs till, gamla uppdateras cell för cell.
    for (const d of rader) {
      let li = noder.get(d.id);
      if (!li) {
        li = buildRow(d);
        noder.set(d.id, li);
        lista.append(li);
      }
      li.dataset['status'] = d.status;
      setCell(li, 'col-time-h', hhmm(d.time + d.delay));
      setCell(li, 'col-code', d.code);
      setCell(li, 'col-stand', d.stand);
      setCell(li, 'col-status', statusText(d));
      const knapp = li.querySelector<HTMLButtonElement>('.board-pick');
      if (knapp) knapp.disabled = false;
    }
    // Ordningen på tavlan följer avgångstiden, även efter en försening.
    for (const d of rader) {
      const li = noder.get(d.id);
      if (li) lista.append(li);
    }
    // En rad som just skrivits om kan ha fallit utanför sökningen.
    gallra();
  };

  paint();
  gallra();
  nyttUtrop(false);
  const timer = window.setInterval(tick, TICK_MS);
  const klockTimer = window.setInterval(() => {
    klocka.textContent = hhmm(wallClock());
  }, 1000);

  return {
    node: wrap,
    stop: () => {
      window.clearInterval(timer);
      window.clearInterval(klockTimer);
    },
  };
}
