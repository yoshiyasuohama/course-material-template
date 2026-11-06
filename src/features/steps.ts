import { decorateNode, qs, qsa, scrollBehavior, tick } from '../lib/dom';
import { fmt, ui } from '../lib/meta';
import { store } from '../lib/store';
import { Track } from '../lib/track';

export interface Step {
  id: string;
  no: number;
  title: string;
  li: HTMLLIElement;
  head: HTMLButtonElement;
  got: HTMLButtonElement;
}

export interface Chapter {
  id: string;
  no: number;
  el: HTMLElement;
  steps: Step[];
  track: Track;
  toggleAll: HTMLButtonElement;
}

/** パネルの開閉アニメーションが終わるまでの時間（motion.css と合わせる） */
const PANEL_MS = 380;

const openSteps = new Set<string>();

function isDone(step: Step): boolean {
  return store.has(step.id);
}

export function nextStepOf(chapter: Chapter): Step | undefined {
  return chapter.steps.find((step) => !isDone(step));
}

function buildStep(chapterId: string, li: HTMLLIElement, index: number): Step {
  const no = index + 1;
  const id = `${chapterId}-${no}`;
  const body = qs('.sb', li);
  const heading = qs('h3', body);
  const title = heading.textContent ?? '';

  const node = document.createElement('span');
  node.className = 'node';
  node.textContent = String(no);
  node.setAttribute('aria-hidden', 'true');
  decorateNode(node);
  li.prepend(node);

  const panel = document.createElement('div');
  panel.className = 'step-panel';
  panel.id = `${id}-panel`;
  const inner = document.createElement('div');
  inner.className = 'step-inner';
  panel.append(inner);
  Array.from(body.children)
    .filter((child) => child !== heading)
    .forEach((child) => inner.append(child));

  const head = document.createElement('button');
  head.type = 'button';
  head.className = 'step-head';
  head.setAttribute('aria-controls', panel.id);
  head.textContent = title;
  heading.replaceChildren(head);

  const got = document.createElement('button');
  got.type = 'button';
  got.className = 'got';
  const box = document.createElement('span');
  box.className = 'box';
  box.append(tick());
  const label = document.createElement('span');
  label.className = 'got-label';
  got.append(box, label);
  inner.append(got);
  body.append(panel);

  return { id, no, title, li, head, got };
}

function focusStep(step: Step, chapter: Chapter): void {
  window.setTimeout(() => {
    step.head.focus({ preventScroll: true });
    step.li.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    chapter.track.update();
  }, PANEL_MS);
}

function completeStep(chapter: Chapter, step: Step): void {
  store.set(step.id, true);
  openSteps.delete(step.id);
  step.li.classList.add('just-done');
  window.setTimeout(() => step.li.classList.remove('just-done'), 500);

  const next = nextStepOf(chapter);
  if (next) {
    openSteps.add(next.id);
    renderChapter(chapter);
    focusStep(next, chapter);
    return;
  }
  renderChapter(chapter);
  window.setTimeout(() => {
    qs('.after-steps', chapter.el).scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  }, PANEL_MS);
}

function renderChapter(chapter: Chapter): void {
  const next = nextStepOf(chapter);
  chapter.steps.forEach((step) => {
    const done = isDone(step);
    const open = openSteps.has(step.id);
    const isNext = step === next;
    step.li.classList.toggle('is-done', done);
    step.li.classList.toggle('is-next', isNext);
    step.li.classList.toggle('is-open', open);
    step.head.setAttribute('aria-expanded', String(open));
    step.got.setAttribute('aria-pressed', String(done));
    qs('.got-label', step.got).textContent = done ? ui.stepUndo : ui.stepDone;
    step.got.setAttribute('aria-label', fmt(done ? ui.stepUndoAria : ui.stepDoneAria, { n: step.no }));
  });
  const allOpen = chapter.steps.every((step) => openSteps.has(step.id));
  chapter.toggleAll.textContent = allOpen ? ui.collapseAll : ui.expandAll;
  chapter.toggleAll.setAttribute('aria-expanded', String(allOpen));
  chapter.track.update();
}

export function renderChapters(chapters: Chapter[]): void {
  chapters.forEach(renderChapter);
}

/** 章に入ったとき、次にやる手順を開く。途中からならそこまで移動する */
export function enterChapter(chapter: Chapter): void {
  const next = nextStepOf(chapter);
  const started = chapter.steps.some(isDone);
  if (next) openSteps.add(next.id);
  renderChapter(chapter);
  if (next && started) {
    next.li.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
}

export function setupSteps(): Chapter[] {
  return qsa('[data-chapter]').map((el, index) => {
    const steps = qsa<HTMLLIElement>('.steps > li', el).map((li, i) => buildStep(el.id, li, i));
    const stepList = qs('.steps', el);
    const toggleAll = qs<HTMLButtonElement>('[data-toggle-all]', el);
    const track = new Track(
      stepList,
      () => steps.map((step) => qs('.node', step.li)),
      () => {
        const first = steps.findIndex((step) => !isDone(step));
        return first === -1 ? steps.length - 1 : first;
      },
    );
    const chapter: Chapter = { id: el.id, no: index + 1, el, steps, track, toggleAll };

    steps.forEach((step) => {
      step.head.addEventListener('click', () => {
        if (openSteps.has(step.id)) openSteps.delete(step.id);
        else openSteps.add(step.id);
        renderChapter(chapter);
      });
      step.got.addEventListener('click', () => {
        if (isDone(step)) store.set(step.id, false);
        else completeStep(chapter, step);
      });
    });

    toggleAll.addEventListener('click', () => {
      const allOpen = steps.every((step) => openSteps.has(step.id));
      steps.forEach((step) => openSteps.delete(step.id));
      if (allOpen) {
        const next = nextStepOf(chapter);
        if (next) openSteps.add(next.id);
      } else {
        steps.forEach((step) => openSteps.add(step.id));
      }
      renderChapter(chapter);
    });

    return chapter;
  });
}
