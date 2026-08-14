type Attrs = Record<string, string | number | boolean | undefined>;
type Child = Node | string | null | undefined | false;

/** Kortfattad elementbyggare. class och dataset stöds via attributnamn. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  applyAttrs(node, attrs);
  append(node, children);
  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svgEl(
  tag: string,
  attrs: Attrs = {},
  ...children: Child[]
): SVGElement {
  const node = document.createElementNS(SVG_NS, tag) as SVGElement;
  applyAttrs(node, attrs);
  append(node, children);
  return node;
}

function applyAttrs(node: Element, attrs: Attrs): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (value === true) {
      node.setAttribute(key, '');
      continue;
    }
    node.setAttribute(key, String(value));
  }
}

function append(node: Element, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Knapp med klickhandlare, förberedd för både touch och mus. */
export function button(
  label: string | Node,
  onClick: () => void,
  attrs: Attrs = {}
): HTMLButtonElement {
  const b = el('button', { type: 'button', ...attrs }, label);
  b.addEventListener('click', (event) => {
    event.preventDefault();
    onClick();
  });
  return b;
}
