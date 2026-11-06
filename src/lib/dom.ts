export function qs<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`Missing element: ${selector}`);
  return found;
}

export function qsa<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

export function fromHTML<T extends Element = HTMLElement>(markup: string): T {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild as T;
}

export function reducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollBehavior(): ScrollBehavior {
  return reducedMotion() ? 'auto' : 'smooth';
}

const TICK = `<svg class="tick" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path pathLength="1" d="M3 8.5 6.5 12 13 4.5"/></svg>`;

export const ARROW = `<svg class="arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h11M9 3.5 13.5 8 9 12.5"/></svg>`;

export function tick(): SVGElement {
  return fromHTML<SVGElement>(TICK);
}

/** ルート上の丸印に、完了時に線が描かれるチェックを仕込む */
export function decorateNode(node: HTMLElement): void {
  const num = document.createElement('span');
  num.className = 'num';
  num.textContent = node.textContent;
  node.replaceChildren(num, tick());
}
