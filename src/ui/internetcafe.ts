import {
  CafeFel,
  FARSK_MS,
  MAX_FOLJER,
  byggDagbok,
  cachad,
  egenSynk,
  egetId,
  folj,
  foljda,
  formateraId,
  hamta,
  kanskeSynka,
  slutaDela,
  slutaFolja,
  startaDelning,
  tolkaId,
  type HamtadDagbok,
  type Resedagbok,
} from '../game/internetcafe';
import type { GameState } from '../game/state';
import { playSound } from './audio';
import { button, clear, el } from './dom';
import { icon } from './icons';

/**
 * Internetcaféet.
 *
 * Ett rum med ett par datorer där man skriver hem. Här - och bara här - får
 * spelet prata med nätet: man kan lämna ut sin resedagbok och slå upp någon
 * annans.
 *
 * Skärmen sköter sina egna omritningar i stället för att be spelet rita om
 * allt. Ett nätanrop tar en stund, och under tiden ska varken numret man just
 * skrivit in eller rullningen försvinna.
 */

export interface CafeOpts {
  state: GameState;
  onStang: () => void;
}

export function renderInternetcafe(opts: CafeOpts): HTMLElement {
  const { state, onStang } = opts;
  const wrap = el('div', { class: 'stack' });

  const min = el('section', { class: 'panel cafe' });
  const andras = el('section', { class: 'panel cafe' });

  wrap.append(min, andras);
  wrap.append(
    el('div', { class: 'panel actions-panel' },
      button('Tillbaka till staden', onStang, { class: 'btn btn-ghost' })
    )
  );

  ritaMin(min, state);
  ritaAndras(andras);

  /*
   * Numret man är på väg att lämna ut ska peka på något färskt. Den vanliga
   * synken är strypt till var tredje minut, så utan den här raden kan kompisen
   * få se gårdagens stad i samma stund som numret räcks över.
   */
  const id = egetId();
  if (id) {
    void kanskeSynka(state, { tvinga: true }).then(() => {
      // Har spelaren hunnit sluta dela under tiden ska panelen inte ritas om
      // till den delande versionen igen.
      if (egetId() === id && min.isConnected) ritaMin(min, state);
    });
  }

  return wrap;
}

/* ------------------------------------------------------------------ */
/* Min egen resedagbok                                                 */
/* ------------------------------------------------------------------ */

function ritaMin(panel: HTMLElement, state: GameState): void {
  clear(panel);
  const id = egetId();

  panel.append(
    el('h1', { class: 'title' },
      icon('skylt-internetcafe', 'cafe-titelikon'),
      'Internetcaféet'
    )
  );

  if (!id) {
    panel.append(
      el('p', { class: 'cafe-brod' },
        'Här kan du lämna ut din resedagbok, så att någon annan kan följa resan hemifrån. Du får ett nummer att läsa upp för den du vill dela med.'
      ),
      el('p', { class: 'cafe-brod' }, 'Det enda som lämnar den här enheten är:'),
      el('ul', { class: 'cafe-lista' },
        el('li', {}, 'ditt namn, ', el('strong', {}, state.playerName || 'Resenären')),
        el('li', {}, 'staden och landet du är i'),
        el('li', {}, 'hur många stämplar du har, och vilken som var den senaste'),
        el('li', {}, 'det yrke du senast arbetade ett skift i')
      ),
      el('p', { class: 'cafe-brod cafe-diskret' },
        'Inte pengarna, inte ryggsäcken, inte hur det gick på frågorna. Du kan sluta dela när du vill - då raderas dagboken.'
      )
    );

    const fel = el('p', { class: 'cafe-fel', hidden: true, role: 'alert' });
    const knapp = button(
      'Dela min resedagbok',
      async () => {
        knapp.disabled = true;
        knapp.textContent = 'Kopplar upp...';
        fel.hidden = true;
        try {
          await startaDelning(state);
          playSound('stampla');
          ritaMin(panel, state);
        } catch (err) {
          knapp.disabled = false;
          knapp.textContent = 'Dela min resedagbok';
          visaFel(fel, err, 'Caféets uppkoppling är nere. Försök igen om en stund.');
        }
      },
      { class: 'btn btn-primary btn-big' }
    );
    panel.append(el('div', { class: 'row' }, knapp), fel);
    return;
  }

  /* Delningen är igång: numret först, det är det man kom hit för. */
  panel.append(
    el('p', { class: 'kicker' }, 'Ditt resedagboksnummer'),
    el('p', { class: 'cafe-nummer' }, formateraId(id)),
    el('p', { class: 'cafe-brod' },
      'Läs upp numret för den du vill ska kunna följa dig. Hen skriver in det i sitt eget internetcafé.'
    )
  );

  const kvitto = el('p', { class: 'cafe-diskret' }, synkText(egenSynk()));
  const fel = el('p', { class: 'cafe-fel', hidden: true, role: 'alert' });
  const rad = el('div', { class: 'row cafe-knappar' });

  /*
   * Att dela numret vidare. Web Share finns på telefonerna och öppnar den
   * vanliga dela-menyn; på en dator får man kopiera i stället.
   */
  if (typeof navigator.share === 'function') {
    rad.append(
      button(
        'Skicka numret',
        () => {
          void navigator
            .share({
              title: 'Min resedagbok i Upptäckaren',
              text: `Följ min resa i Upptäckaren! Gå till upptackaren.se, in i internetcaféet och skriv in ${formateraId(id)}.`,
            })
            .catch(() => {
              // Spelaren ångrade sig i delningsmenyn. Inget att säga om.
            });
        },
        { class: 'btn btn-primary' }
      )
    );
  }

  if (navigator.clipboard) {
    const kopiera = button(
      'Kopiera numret',
      () => {
        void navigator.clipboard.writeText(id).then(
          () => {
            kopiera.textContent = 'Kopierat!';
            window.setTimeout(() => (kopiera.textContent = 'Kopiera numret'), 2000);
          },
          () => {
            kopiera.textContent = 'Gick inte att kopiera';
            window.setTimeout(() => (kopiera.textContent = 'Kopiera numret'), 2000);
          }
        );
      },
      { class: 'btn' }
    );
    rad.append(kopiera);
  }

  const uppdatera = button(
    'Uppdatera nu',
    async () => {
      uppdatera.disabled = true;
      uppdatera.textContent = 'Skickar...';
      fel.hidden = true;
      await kanskeSynka(state, { tvinga: true });
      uppdatera.disabled = false;
      uppdatera.textContent = 'Uppdatera nu';
      const nu = egetId();
      if (!nu) {
        // Dagboken fanns inte kvar på servern; kanskeSynka har städat undan.
        ritaMin(panel, state);
        return;
      }
      kvitto.textContent = synkText(egenSynk());
    },
    { class: 'btn' }
  );
  rad.append(uppdatera);

  const sluta = button(
    'Sluta dela',
    async () => {
      sluta.disabled = true;
      sluta.textContent = 'Raderar...';
      try {
        await slutaDela();
      } catch {
        // Numret är redan glömt här. Att servern strulade spelar mindre roll -
        // dagboken städas bort av sig själv när den legat orörd.
      }
      playSound('sida');
      ritaMin(panel, state);
    },
    { class: 'btn btn-ghost' }
  );

  panel.append(rad, kvitto, fel);
  panel.append(
    el('p', { class: 'kicker' }, 'Så här ser den ut för andra'),
    dagbokKort(byggDagbok(state))
  );
  panel.append(el('div', { class: 'row' }, sluta));
}

function synkText(synkad: number): string {
  if (!synkad) return 'Ännu inte skickad.';
  return `Skickad ${sedan(synkad)}. Dagboken uppdateras av sig själv medan du reser.`;
}

/* ------------------------------------------------------------------ */
/* Andras resedagböcker                                                */
/* ------------------------------------------------------------------ */

function ritaAndras(panel: HTMLElement): void {
  clear(panel);
  panel.append(el('h2', { class: 'title' }, 'Följ en resenär'));

  const falt = el('input', {
    class: 'cafe-falt',
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    maxlength: '7',
    placeholder: '123 456',
    'aria-label': 'Resedagboksnummer, sex siffror',
  }) as HTMLInputElement;

  const fel = el('p', { class: 'cafe-fel', hidden: true, role: 'alert' });

  const slaUpp = button(
    'Slå upp',
    async () => {
      const id = tolkaId(falt.value);
      if (!id) {
        visaText(fel, 'Numret ska vara sex siffror.');
        return;
      }
      if (foljda().includes(id)) {
        visaText(fel, 'Den resenären följer du redan.');
        return;
      }
      slaUpp.disabled = true;
      slaUpp.textContent = 'Letar...';
      fel.hidden = true;
      try {
        await folj(id);
        playSound('stampla');
        falt.value = '';
        ritaAndras(panel);
      } catch (err) {
        slaUpp.disabled = false;
        slaUpp.textContent = 'Slå upp';
        visaFel(
          fel,
          err,
          'Caféets uppkoppling är nere. Försök igen om en stund.',
          'Ingen resedagbok har det numret. Kontrollera siffrorna.'
        );
      }
    },
    { class: 'btn btn-primary' }
  );

  // Enter i fältet ska göra samma sak som knappen.
  falt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      slaUpp.click();
    }
  });

  panel.append(
    el('p', { class: 'cafe-brod' },
      'Har någon gett dig sitt resedagboksnummer? Skriv in det här, så ligger resenären kvar i caféet.'
    ),
    el('div', { class: 'cafe-sokrad' }, falt, slaUpp),
    fel
  );

  const koder = foljda();
  if (koder.length === 0) {
    panel.append(
      el('p', { class: 'cafe-diskret' }, 'Du följer ingen än.')
    );
    return;
  }

  const lista = el('div', { class: 'cafe-vanner' });
  panel.append(lista);
  for (const id of koder) lista.append(vanKort(id, () => ritaAndras(panel)));

  if (koder.length >= MAX_FOLJER) {
    panel.append(
      el('p', { class: 'cafe-diskret' },
        `Caféet rymmer ${MAX_FOLJER} resenärer. Lägger du till en till faller den äldsta bort.`
      )
    );
  }
}

/**
 * Ett kort för en resenär man följer. Det som redan finns i cachen visas
 * omedelbart, och en färsk hämtning läggs ovanpå när den kommer - annars
 * hade caféet stått tomt varje gång man klev in med dålig täckning.
 */
function vanKort(id: string, omRitaOm: () => void): HTMLElement {
  const kort = el('div', { class: 'cafe-van' });
  const cache = cachad(id);

  const innehall = el('div', { class: 'cafe-van-kropp' });
  const status = el('p', { class: 'cafe-diskret' },
    cache ? sedan(cache.uppdaterad) : 'Hämtar...'
  );

  const rita = (h: HamtadDagbok | null) => {
    clear(innehall);
    if (h) {
      innehall.append(dagbokKort(h.dagbok));
      status.textContent = `Resenärens dagbok uppdaterades ${sedan(h.uppdaterad)}.`;
    }
  };

  rita(cache);

  const uppdatera = button(
    'Uppdatera',
    async () => {
      uppdatera.disabled = true;
      status.textContent = 'Hämtar...';
      try {
        rita(await hamta(id));
      } catch (err) {
        status.textContent =
          err instanceof CafeFel && err.status === 404
            ? 'Dagboken finns inte längre. Resenären har slutat dela.'
            : 'Caféets uppkoppling är nere just nu.';
      }
      uppdatera.disabled = false;
    },
    { class: 'btn btn-liten' }
  );

  kort.append(
    innehall,
    el('div', { class: 'cafe-van-fot' },
      el('span', { class: 'cafe-vannummer' }, formateraId(id)),
      uppdatera,
      button(
        'Ta bort',
        () => {
          slutaFolja(id);
          playSound('sida');
          omRitaOm();
        },
        { class: 'btn btn-liten btn-ghost' }
      )
    ),
    status
  );

  /*
   * Hämta om av sig själv när det man har är gammalt. Kortet ska visa något
   * innan anropet är klart, så det sker efter första ritningen.
   */
  if (!cache || Date.now() - cache.hamtad > FARSK_MS) {
    void hamta(id).then(
      (h) => rita(h),
      (err: unknown) => {
        if (cache) return; // Det gamla kortet duger bättre än ett felmeddelande.
        status.textContent =
          err instanceof CafeFel && err.status === 404
            ? 'Dagboken finns inte längre. Resenären har slutat dela.'
            : 'Caféets uppkoppling är nere just nu.';
      }
    );
  }

  return kort;
}

/* ------------------------------------------------------------------ */
/* Själva dagbokskortet                                                */
/* ------------------------------------------------------------------ */

function dagbokKort(d: Resedagbok): HTMLElement {
  const kort = el('div', { class: 'cafe-dagbok' });

  kort.append(
    el('p', { class: 'cafe-namn' }, d.namn),
    el('p', { class: 'cafe-plats' },
      el('strong', {}, d.stad),
      d.land ? `, ${d.land}` : ''
    ),
    el('p', { class: 'cafe-dag' }, d.dag === 0 ? 'Första dagen på resan' : `Dag ${d.dag} på resan`)
  );

  const rader = el('ul', { class: 'cafe-rader' });
  rader.append(
    el('li', {},
      el('span', { class: 'cafe-etikett' }, 'Stämplar'),
      el('span', { class: 'cafe-varde' }, String(d.stamplar))
    )
  );
  if (d.senasteStampel) {
    rader.append(
      el('li', {},
        el('span', { class: 'cafe-etikett' }, 'Senaste stämpel'),
        el('span', { class: 'cafe-varde' },
          el('span', { class: 'cafe-tecken', 'aria-hidden': 'true' }, d.senasteStampel.tecken),
          d.senasteStampel.namn
        )
      )
    );
  }
  rader.append(
    el('li', {},
      el('span', { class: 'cafe-etikett' }, 'Senaste yrke'),
      el('span', { class: 'cafe-varde' },
        d.senasteYrke
          ? d.senasteYrke.stad
            ? `${d.senasteYrke.titel} i ${d.senasteYrke.stad}`
            : d.senasteYrke.titel
          : 'Har inte arbetat än'
      )
    )
  );
  kort.append(rader);

  return kort;
}

/* ------------------------------------------------------------------ */
/* Småsaker                                                            */
/* ------------------------------------------------------------------ */

function visaText(nod: HTMLElement, text: string): void {
  nod.textContent = text;
  nod.hidden = false;
}

/**
 * Ett fel i klartext. Ett 404 betyder att numret inte finns, allt annat att
 * caféet inte går att nå - och ingendera är något spelaren kan rätta genom att
 * få se en statuskod.
 */
function visaFel(nod: HTMLElement, err: unknown, nere: string, saknas?: string): void {
  if (saknas && err instanceof CafeFel && err.status === 404) {
    visaText(nod, saknas);
    return;
  }
  visaText(nod, nere);
}

/** "för tolv minuter sedan" och liknande. */
function sedan(tid: number): string {
  const min = Math.round((Date.now() - tid) / 60000);
  if (min < 1) return 'alldeles nyss';
  if (min === 1) return 'för en minut sedan';
  if (min < 60) return `för ${min} minuter sedan`;
  const timmar = Math.round(min / 60);
  if (timmar === 1) return 'för en timme sedan';
  if (timmar < 24) return `för ${timmar} timmar sedan`;
  const dygn = Math.round(timmar / 24);
  return dygn === 1 ? 'för ett dygn sedan' : `för ${dygn} dygn sedan`;
}
