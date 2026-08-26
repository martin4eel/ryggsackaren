import type { Difficulty } from './state';

/**
 * Allt som skiljer Turist från Globetrotter, samlat på ett ställe.
 *
 * Modulen är avsiktligt fri från beroenden åt båda håll: state importerar
 * härifrån, och rules re-exporterar. Skillnaderna ska gå att läsa i klump,
 * annars glider lägena isär utan att någon märker det.
 *
 * Principen är att lägena delar mekanik och bara skiljer sig i krav:
 * frågornas svårighet, hur mycket hjälp man får och hur snävt det sitter.
 */

/** Hur många svarsalternativ som visas. */
export function optionCount(difficulty: Difficulty): number {
  return difficulty === 'turist' ? 3 : 4;
}

/**
 * Hur stor andel av skiftet som krävs för certifikat. Turisten belönas för
 * att ha varit med hela vägen, Globetrottern för att ha kunnat sin sak.
 */
export function certificateThreshold(difficulty: Difficulty): number {
  return difficulty === 'turist' ? 65 : 75;
}

/**
 * Arkadmomentens tempo. Turisten får en femtedel mer tid och något större
 * marginaler; Globetrottern spelar snävare. Samma moment, samma regler - bara
 * olika krav, precis som frågorna.
 */
export function arcadeSlack(difficulty: Difficulty): number {
  return difficulty === 'turist' ? 1.2 : 0.92;
}

/** Presentationen av lägena, på startskärmen och i statusraden. */
export const DIFFICULTY_INFO: Record<
  Difficulty,
  { name: string; tagline: string; bullets: string[] }
> = {
  turist: {
    name: 'Turist',
    tagline: 'För dig som vill upptäcka världen i lagom takt.',
    bullets: [
      'Tre svarsalternativ och de mer välkända frågorna',
      'Mer förlåtande ekonomi och mer pengar att börja med',
      'Lugnare arkadmoment och billigare boende',
      'Certifikat redan vid 65 procent av skiftet',
    ],
  },
  globetrotter: {
    name: 'Globetrotter',
    tagline: 'För dig som kan din geografi – och vill bli utmanad.',
    bullets: [
      'Fyra svarsalternativ och hela frågebanken, även de svåra',
      'Ingen hjälp att få: du står och faller med vad du kan',
      'Snävare arkadmoment och tuffare ekonomi',
      'Certifikat först vid 75 procent, men lönen är högre',
    ],
  },
};
