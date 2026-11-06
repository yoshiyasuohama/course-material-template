import { qs, qsa } from '../lib/dom';
import { meta } from '../lib/meta';

/** 本文に頻出する語（course.ts で autoLink: false にしたもの）は、下線だらけになるので自動リンクしない */
const SKIP_TERMS = new Set(meta.autoLinkSkip);
const TEXT_SCOPES = '.steps p, .steps .sub li, .points li, .warn, .intro-p';
const TEXT_EXCLUDE = 'a, code, button, b, .prompt';

function setupDrawer(): void {
  const dialog = qs<HTMLDialogElement>('#terms');
  qs('#terms-body').innerHTML = qs('#terms-src').innerHTML;
  qs('#terms-open').addEventListener('click', () => dialog.showModal());
  qs('#terms-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function linkTerm(scope: Element, term: string): void {
  for (const block of qsa(TEXT_SCOPES, scope)) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let text: Node | null;
    while ((text = walker.nextNode())) {
      if ((text.parentElement as Element).closest(TEXT_EXCLUDE)) continue;
      const at = text.textContent?.indexOf(term) ?? -1;
      if (at === -1) continue;
      const hit = (text as Text).splitText(at);
      hit.splitText(term.length);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'term';
      button.dataset.term = term;
      button.textContent = term;
      hit.replaceWith(button);
      return;
    }
  }
}

function setupInlineTerms(): void {
  const definitions = new Map(
    qsa('#terms-src > div').map((row) => [qs('dt', row).textContent ?? '', qs('dd', row).textContent ?? '']),
  );
  const terms = [...definitions.keys()].filter((term) => !SKIP_TERMS.has(term));
  qsa('[data-chapter]').forEach((chapter) => terms.forEach((term) => linkTerm(chapter, term)));

  const pop = qs('#term-pop');
  const popTitle = qs('strong', pop);
  const popBody = qs('p', pop);
  let openedBy: HTMLElement | null = null;
  let closedAt = 0;

  pop.addEventListener('toggle', (event) => {
    if ((event as ToggleEvent).newState === 'closed') closedAt = performance.now();
  });
  window.addEventListener('scroll', () => pop.matches(':popover-open') && pop.hidePopover(), { passive: true });

  document.addEventListener('click', (event) => {
    const button = (event.target as Element).closest?.<HTMLElement>('.term');
    if (!button) return;
    // 開いているときに同じ語を押したら、閉じたままにする
    if (openedBy === button && performance.now() - closedAt < 250) return;
    const term = button.dataset.term ?? '';
    popTitle.textContent = term;
    popBody.textContent = definitions.get(term) ?? '';
    pop.showPopover();
    openedBy = button;

    const anchor = button.getBoundingClientRect();
    const box = pop.getBoundingClientRect();
    const margin = 16;
    const left = Math.min(Math.max(margin, anchor.left), innerWidth - box.width - margin);
    const below = anchor.bottom + 8;
    const top = below + box.height > innerHeight - margin ? anchor.top - box.height - 8 : below;
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  });
}

export function setupGlossary(): void {
  setupDrawer();
  setupInlineTerms();
}
