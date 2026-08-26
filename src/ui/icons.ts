/**
 * Inline SVG-ikoner i enkel streckstil (24x24). Inga externa ikonbibliotek –
 * varje ikon är ett par handskrivna path-element som ärver textfärgen.
 */

import { svgEl } from './dom';

export type IconName =
  | 'ljud-pa'
  | 'ljud-halv'
  | 'ljud-av'
  | 'pass'
  | 'stampel'
  | 'buss'
  | 'tag'
  | 'farja'
  | 'flyg'
  | 'flyg-profil'
  | 'skylt-info'
  | 'skylt-tidning'
  | 'skylt-souvenir'
  | 'skylt-ryggsack'
  | 'skylt-resa'
  | 'skylt-buss'
  | 'skylt-tag'
  | 'skylt-farja'
  | 'skylt-telefon'
  | 'buss-profil'
  | 'tag-profil'
  | 'farja-profil'
  | 'flagga'
  | 'tidning'
  | 'souvenir'
  | 'ryggsack'
  | 'resa'
  | 'telefon';

interface Part {
  tag: 'path' | 'polygon' | 'line' | 'rect' | 'circle';
  attrs: Record<string, string>;
}

const ICONS: Record<IconName, Part[]> = {
  'ljud-pa': [
    {
      tag: 'polygon',
      attrs: {
        points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5',
        fill: 'currentColor',
        stroke: 'none',
      },
    },
    { tag: 'path', attrs: { d: 'M15.54 8.46a5 5 0 0 1 0 7.07' } },
    { tag: 'path', attrs: { d: 'M19.07 4.93a10 10 0 0 1 0 14.14' } },
  ],
  'ljud-av': [
    {
      tag: 'polygon',
      attrs: {
        points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5',
        fill: 'currentColor',
        stroke: 'none',
      },
    },
    { tag: 'line', attrs: { x1: '23', y1: '9', x2: '17', y2: '15' } },
    { tag: 'line', attrs: { x1: '17', y1: '9', x2: '23', y2: '15' } },
  ],
  'ljud-halv': [
    {
      tag: 'polygon',
      attrs: {
        points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5',
        fill: 'currentColor',
        stroke: 'none',
      },
    },
    { tag: 'path', attrs: { d: 'M15.54 8.46a5 5 0 0 1 0 7.07' } },
  ],
  buss: [
    { tag: 'rect', attrs: { x: '3', y: '5', width: '18', height: '12', rx: '2' } },
    { tag: 'path', attrs: { d: 'M3 10h18' } },
    { tag: 'circle', attrs: { cx: '7.5', cy: '20', r: '1.6' } },
    { tag: 'circle', attrs: { cx: '16.5', cy: '20', r: '1.6' } },
    { tag: 'path', attrs: { d: 'M8 14h.01M16 14h.01' } },
  ],
  tag: [
    { tag: 'rect', attrs: { x: '5', y: '3', width: '14', height: '13', rx: '3' } },
    { tag: 'path', attrs: { d: 'M5 9h14' } },
    { tag: 'path', attrs: { d: 'M8 20l-2 2M16 20l2 2' } },
    { tag: 'path', attrs: { d: 'M9 13h.01M15 13h.01' } },
    { tag: 'path', attrs: { d: 'M7 16h10' } },
  ],
  farja: [
    { tag: 'path', attrs: { d: 'M3 18a3 3 0 0 0 3-1.5 3 3 0 0 1 5 0 3 3 0 0 0 5 0 3 3 0 0 1 5 0' } },
    { tag: 'path', attrs: { d: 'M5 15V9h14v6' } },
    { tag: 'path', attrs: { d: 'M8 9V5h5l3 4' } },
  ],
  flyg: [
    { tag: 'path', attrs: { d: 'M17.8 19.2 16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-1 1.6L8 11l-2 2-2.2-.4a.8.8 0 0 0-.8 1.3l2.2 2.2 2.2 2.2a.8.8 0 0 0 1.3-.8L8 16l2-2 3.2 4.2a1 1 0 0 0 1.6-1z' } },
  ],
  'flyg-profil': [
    {
      tag: 'path',
      attrs: {
        d: 'M2 12h4l3-5h2l-1.5 5H16l2.5-3h2l-1.5 3h2.5a1.5 1.5 0 0 1 0 3H19l1.5 3h-2L16 15H9.5l1.5 5H9l-3-5H2Z',
        fill: 'currentColor',
        stroke: 'none',
      },
    },
  ],
  'buss-profil': [
    { tag: 'rect', attrs: { x: '2', y: '7', width: '18', height: '9', rx: '2', fill: 'currentColor', stroke: 'none' } },
    { tag: 'circle', attrs: { cx: '7', cy: '17', r: '2', fill: 'currentColor', stroke: 'none' } },
    { tag: 'circle', attrs: { cx: '16', cy: '17', r: '2', fill: 'currentColor', stroke: 'none' } },
  ],
  'tag-profil': [
    { tag: 'rect', attrs: { x: '2', y: '7', width: '13', height: '9', rx: '1.5', fill: 'currentColor', stroke: 'none' } },
    { tag: 'path', attrs: { d: 'M15 9h4l2 4v3h-6Z', fill: 'currentColor', stroke: 'none' } },
    { tag: 'circle', attrs: { cx: '6', cy: '17.5', r: '1.6', fill: 'currentColor', stroke: 'none' } },
    { tag: 'circle', attrs: { cx: '17', cy: '17.5', r: '1.6', fill: 'currentColor', stroke: 'none' } },
  ],
  'farja-profil': [
    { tag: 'path', attrs: { d: 'M3 16h18l-2.5 4h-13Z', fill: 'currentColor', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '6', y: '10', width: '10', height: '5', fill: 'currentColor', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '9', y: '6', width: '4', height: '3', fill: 'currentColor', stroke: 'none' } },
  ],
  /**
   * Skyltarna på stadsbilden. De ritas fyllda i stället för i streckstil,
   * eftersom de ligger ovanpå ett fotografi och ska läsas på en centimeter.
   * En tunn kontur klarar inte det; en solid form gör det.
   */
  'skylt-info': [
    { tag: 'circle', attrs: { cx: '12', cy: '5.4', r: '1.9', fill: 'currentColor', stroke: 'none' } },
    { tag: 'path', attrs: { d: 'M9.6 9.6h4.8v9.6a1 1 0 0 1-1 1h-2.8a1 1 0 0 1-1-1z', fill: 'currentColor', stroke: 'none' } },
  ],
  'skylt-tidning': [
    { tag: 'path', attrs: { d: 'M4 3.5h13a1 1 0 0 1 1 1V19a1.5 1.5 0 0 0 1.5 1.5H4a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z', fill: 'currentColor', stroke: 'none' } },
    { tag: 'path', attrs: { d: 'M18 8h2a1 1 0 0 1 1 1v10a1.5 1.5 0 0 1-3 0z', fill: 'currentColor', stroke: 'none', opacity: '0.55' } },
    { tag: 'path', attrs: { d: 'M5.5 6h9v3.5h-9zM5.5 11.5h9v1.4h-9zM5.5 14.6h9v1.4h-9z', class: 'icon-knockout', stroke: 'none' } },
  ],
  'skylt-souvenir': [
    // Markis över en butiksdörr, som i förlagans gatuvyer.
    { tag: 'path', attrs: { d: 'M2.5 8.5 4.5 4h15l2 4.5z', fill: 'currentColor', stroke: 'none' } },
    { tag: 'path', attrs: { d: 'M4 10h16v10.5H4z', fill: 'currentColor', stroke: 'none', opacity: '0.75' } },
    { tag: 'path', attrs: { d: 'M9.5 13h5v7.5h-5z', class: 'icon-knockout', stroke: 'none' } },
  ],
  'skylt-ryggsack': [
    // Bärhandtag, kropp, överfallslock med spänne och ytterficka. Tidigare
    // versioner lästes först som ett hänglås och sedan som en stickkontakt,
    // båda gånger för att detaljerna satt upptill i stället för på locket.
    { tag: 'path', attrs: { d: 'M10 3.2h4a2 2 0 0 1 2 2v1.4h-2.2V5.4h-3.6v1.2H8V5.2a2 2 0 0 1 2-2z', fill: 'currentColor', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '3.4', y: '6.4', width: '17.2', height: '14.2', rx: '3.6', fill: 'currentColor', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '5.2', y: '11.4', width: '13.6', height: '1.3', class: 'icon-knockout', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '10.6', y: '9.8', width: '2.8', height: '4.4', rx: '0.7', class: 'icon-knockout', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '7.4', y: '15', width: '9.2', height: '3.6', rx: '1', class: 'icon-knockout', stroke: 'none' } },
  ],
  'skylt-resa': [
    // Trafikflygplan sett uppifrån, med nosen uppåt.
    {
      tag: 'path',
      attrs: {
        d: 'M12 1.8c.9 0 1.6 1.4 1.9 3.4l.4 3.1 7.2 3.4c.3.2.5.5.5.9v1.5l-7.4-2 .5 4.6 2 1.7v1.3L12 18.9l-5.1.8v-1.3l2-1.7.5-4.6-7.4 2v-1.5c0-.4.2-.7.5-.9l7.2-3.4.4-3.1c.3-2 1-3.4 1.9-3.4z',
        fill: 'currentColor',
        stroke: 'none',
      },
    },
  ],
  'skylt-buss': [
    { tag: 'rect', attrs: { x: '3.4', y: '4', width: '17.2', height: '13', rx: '2.6', fill: 'currentColor', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '5.4', y: '6.4', width: '13.2', height: '4.6', rx: '1', class: 'icon-knockout', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '5.4', y: '13', width: '2.6', height: '2.2', rx: '0.7', class: 'icon-knockout', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '16', y: '13', width: '2.6', height: '2.2', rx: '0.7', class: 'icon-knockout', stroke: 'none' } },
    { tag: 'circle', attrs: { cx: '7.6', cy: '18.6', r: '2.2', fill: 'currentColor', stroke: 'none' } },
    { tag: 'circle', attrs: { cx: '16.4', cy: '18.6', r: '2.2', fill: 'currentColor', stroke: 'none' } },
  ],
  'skylt-tag': [
    { tag: 'rect', attrs: { x: '4.4', y: '3', width: '15.2', height: '14', rx: '3.4', fill: 'currentColor', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '6.4', y: '5.6', width: '11.2', height: '4.6', rx: '1', class: 'icon-knockout', stroke: 'none' } },
    { tag: 'circle', attrs: { cx: '8.6', cy: '13.4', r: '1.3', class: 'icon-knockout', stroke: 'none' } },
    { tag: 'circle', attrs: { cx: '15.4', cy: '13.4', r: '1.3', class: 'icon-knockout', stroke: 'none' } },
    { tag: 'path', attrs: { d: 'M6.6 18h10.8v1.7H6.6zM7.4 20.4l2-1.4h1.9l-2 1.4zM14.7 19h1.9l2 1.4h-1.9z', fill: 'currentColor', stroke: 'none' } },
  ],
  'skylt-farja': [
    { tag: 'path', attrs: { d: 'M2.4 16.4h19.2l-2.6 4.4H5z', fill: 'currentColor', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '5.6', y: '9.6', width: '12.8', height: '5.4', rx: '1', fill: 'currentColor', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '7.6', y: '11.2', width: '3', height: '2.4', class: 'icon-knockout', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '13.4', y: '11.2', width: '3', height: '2.4', class: 'icon-knockout', stroke: 'none' } },
    { tag: 'rect', attrs: { x: '9.4', y: '4.6', width: '5.2', height: '4', rx: '0.8', fill: 'currentColor', stroke: 'none' } },
  ],
  'skylt-telefon': [
    // Telefonkiosk med tak, fönsterspröjs och dörrhandtag.
    { tag: 'path', attrs: { d: 'M5 5.5h14v15.5H5z', fill: 'currentColor', stroke: 'none' } },
    { tag: 'path', attrs: { d: 'M3.8 2.5h16.4a.8.8 0 0 1 .8.8v2.2H3V3.3a.8.8 0 0 1 .8-.8z', fill: 'currentColor', stroke: 'none' } },
    { tag: 'path', attrs: { d: 'M7 8h4v4.5H7zM13 8h4v4.5h-4zM7 14.5h4V19H7zM13 14.5h4V19h-4z', class: 'icon-knockout', stroke: 'none' } },
  ],
  pass: [
    {
      tag: 'path',
      attrs: { d: 'M5 4a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2Z' },
    },
    { tag: 'circle', attrs: { cx: '12', cy: '10', r: '3' } },
    { tag: 'path', attrs: { d: 'M9 17h6' } },
  ],
  stampel: [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '5.5' } },
  ],
  flagga: [
    {
      tag: 'path',
      attrs: {
        d: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z',
      },
    },
    { tag: 'line', attrs: { x1: '4', y1: '22', x2: '4', y2: '15' } },
  ],
  tidning: [
    {
      tag: 'path',
      attrs: {
        d: 'M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V9.5C2 8.67 2.67 8 3.5 8H6',
      },
    },
    { tag: 'path', attrs: { d: 'M18 14h-8' } },
    { tag: 'path', attrs: { d: 'M15 18h-5' } },
    { tag: 'path', attrs: { d: 'M10 6h8v4h-8V6Z' } },
  ],
  souvenir: [
    {
      tag: 'path',
      attrs: { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z' },
    },
    { tag: 'path', attrs: { d: 'M3 6h18' } },
    { tag: 'path', attrs: { d: 'M16 10a4 4 0 0 1-8 0' } },
  ],
  ryggsack: [
    {
      tag: 'path',
      attrs: { d: 'M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z' },
    },
    { tag: 'path', attrs: { d: 'M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2' } },
    { tag: 'path', attrs: { d: 'M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5' } },
    { tag: 'path', attrs: { d: 'M8 10h8' } },
  ],
  resa: [
    { tag: 'path', attrs: { d: 'M22 2 11 13' } },
    { tag: 'path', attrs: { d: 'M22 2 15 22l-4-9-9-4Z' } },
  ],
  telefon: [
    {
      tag: 'path',
      attrs: {
        d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
      },
    },
  ],
};

/**
 * Ikonens banor som en grupp, utan omgivande svg. Används när ikonen ska
 * placeras inuti en annan SVG: en nästlad svg tolkar sina pixelmått som den
 * yttre ritytans användarenheter och blir då absurt stor.
 *
 * `size` är önskad storlek i den yttre ritytans enheter, och gruppen centreras
 * kring sitt eget origo så att den kan roteras på plats.
 */
export function iconGroup(name: IconName, size: number): SVGElement {
  const k = size / 24;
  const g = svgEl('g', {
    transform: `translate(${-size / 2} ${-size / 2}) scale(${k})`,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
  for (const part of ICONS[name]) g.append(svgEl(part.tag, part.attrs));
  return g;
}

/** Bygger en ikon. Dekorativ – dölj den för skärmläsare och sätt text/aria-label på knappen. */
export function icon(name: IconName, cls = ''): SVGElement {
  const svg = svgEl('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: `icon${cls ? ` ${cls}` : ''}`,
    'aria-hidden': 'true',
    focusable: 'false',
  });
  for (const part of ICONS[name]) {
    svg.append(svgEl(part.tag, part.attrs));
  }
  return svg;
}
