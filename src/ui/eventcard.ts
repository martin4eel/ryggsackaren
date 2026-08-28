import type { EventContext, GameEvent } from '../data/events';
import type { EffectLine } from '../game/events';
import type { City } from '../data/types';
import { button, el } from './dom';

/**
 * Händelsekortet.
 *
 * Kortet läggs som ett lager över hela skärmen och inte i flödet, eftersom en
 * händelse kan slå till var som helst: mitt på stadsbilden, i butiken, i
 * väntsalen. Det ska se likadant ut överallt, och det ska inte gå att klicka
 * vidare med en obesvarad fråga bakom sig.
 *
 * Kortet har två lägen. Först frågan med sina val, sedan utfallet med vad det
 * ledde till. En händelse utan val hoppar direkt till det andra läget.
 */

export interface EventCardOptions {
  event: GameEvent;
  city: City;
  ctx: EventContext;
  /** Byter platshållare mot stadens uppgifter. */
  text: (raw: string) => string;
  /** Beloppen skrivna i spelarens valuta. */
  money: (amount: number) => string;
  /** Utfallstexten, när spelaren svarat. */
  outcomeText?: string;
  /** Vad utfallet gjorde. Tom lista betyder att ingenting hände. */
  effects?: EffectLine[];
  /** Tonen på utfallet, om den skiljer sig från händelsens. */
  outcomeTone?: string;
  onChoose: (index: number) => void;
  onClose: () => void;
}

export function renderEventCard(opts: EventCardOptions): HTMLElement {
  const { event, ctx, text, outcomeText, effects, onChoose, onClose } = opts;
  const besvarad = outcomeText !== undefined;
  const ton = besvarad ? (opts.outcomeTone ?? event.tone) : event.tone;

  const kort = el('section', {
    class: `event-card event-${ton}`,
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': text(event.title),
  });

  kort.append(
    el('p', { class: 'event-kicker' }, besvarad ? 'Vad som hände' : 'Något händer'),
    // Också rubriken har platshållare: "{sevardhet} är inbyggd i ställningar".
    el('h2', { class: 'event-title' }, text(event.title)),
    el('p', { class: 'event-text' }, text(event.text))
  );

  if (!besvarad && event.choices) {
    const val = el('div', { class: 'event-choices' });
    event.choices.forEach((choice, i) => {
      const gar = !choice.villkor || choice.villkor(ctx);
      const knapp = button(
        el('span', { class: 'event-choice-body' },
          el('span', { class: 'event-choice-key' }, String.fromCharCode(65 + i)),
          el('span', { class: 'event-choice-label' },
            el('strong', {}, text(choice.label)),
            choice.hint ? el('span', { class: 'event-choice-hint' }, choice.hint) : '',
            !gar && choice.villkorText
              ? el('span', { class: 'event-choice-sparr' }, choice.villkorText)
              : ''
          )
        ),
        () => {
          if (!gar) return;
          onChoose(i);
        },
        {
          class: `event-choice ${gar ? '' : 'event-choice-av'}`,
          disabled: gar ? undefined : true,
        }
      );
      val.append(knapp);
    });
    kort.append(val);
    kort.append(
      el('p', { class: 'event-tangent' }, `Välj med ${event.choices?.length === 2 ? 'A eller B' : 'A, B eller C'}, eller tryck på alternativet.`)
    );
    return kort;
  }

  if (besvarad) {
    kort.append(el('p', { class: 'event-utfall' }, text(outcomeText)));
  }

  /**
   * Följderna skrivs ut var för sig. En rad som bara säger "−650 kr" räcker
   * inte när samma val också kostade en dag och en souvenir.
   */
  const rader = effects ?? [];
  if (rader.length > 0) {
    const lista = el('div', { class: 'event-effekter' });
    for (const rad of rader) {
      lista.append(el('span', { class: `event-effekt event-effekt-${rad.tone}` }, rad.text));
    }
    kort.append(lista);
  } else if (besvarad || !event.choices) {
    kort.append(el('p', { class: 'event-inget' }, 'Ingen skada skedd, och ingen vinst heller.'));
  }

  kort.append(button('Vidare', onClose, { class: 'btn btn-primary event-vidare' }));
  return kort;
}
