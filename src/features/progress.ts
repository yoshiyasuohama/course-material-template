import { ARROW, decorateNode, fromHTML, qs, qsa } from '../lib/dom';
import { fmt, meta, ui } from '../lib/meta';
import { store } from '../lib/store';
import { Track } from '../lib/track';
import { nextStepOf, type Chapter } from './steps';

const INTRO_FLAG = 'intro';
const RING_LENGTH = 100;

export interface ProgressView {
  render(): void;
  replayRoute(): void;
  updateSide(): void;
}

function fillDots(host: HTMLElement, total: number, done: number): void {
  if (host.childElementCount !== total) {
    host.replaceChildren(...Array.from({ length: total }, () => document.createElement('i')));
  }
  Array.from(host.children).forEach((dot, index) => dot.classList.toggle('on', index < done));
}

export function setupProgress(chapters: Chapter[]): ProgressView {
  const checks = qsa<HTMLInputElement>('.checks input');
  const order = ['intro', ...chapters.map((chapter) => chapter.id), 'check'];

  qsa('.side .node, .route .node').forEach(decorateNode);
  qsa('.stop > a').forEach((link) => link.append(fromHTML(ARROW)));

  // 章のページの見出し行と、ロードマップの各行に進捗の点を入れる
  chapters.forEach((chapter) => {
    const dots = document.createElement('span');
    dots.className = 'dots';
    qs('[data-prog]', chapter.el).before(dots);
  });
  chapters.flatMap((chapter) => qsa(`.stop[data-track="${chapter.id}"] [data-status]`)).forEach((status) => {
    const dots = document.createElement('span');
    dots.className = 'dots';
    status.before(dots);
  });

  let currentId = 'intro';
  const activeIndex = () => {
    const index = order.indexOf(currentId);
    return index === -1 ? order.length - 1 : index;
  };
  const routeHost = qs('.route');
  const sideHost = qs('.side ol');
  const routeTrack = new Track(routeHost, () => qsa('.stop .node', routeHost), activeIndex);
  const sideTrack = new Track(sideHost, () => qsa('.node', sideHost), activeIndex);

  const count = qs('#count');
  const bar = qs('#bar');
  const ring = qs<SVGCircleElement & HTMLElement>('#ring-fill');
  const nextKicker = qs('#next-kicker');
  const nextTitle = qs('#next-title');
  const nextButton = qs<HTMLAnchorElement>('#resume');
  const nextLabel = qs('#resume-label');
  const checkProg = qs('#check-prog');
  const checkFinish = qs('#check-finish');

  const track = (id: string) => qsa(`[data-track="${id}"]`);

  function render(): void {
    let total = 0;
    let totalDone = 0;
    let firstOpen: Chapter | undefined;

    chapters.forEach((chapter) => {
      const size = chapter.steps.length;
      const done = chapter.steps.filter((step) => store.has(step.id)).length;
      const complete = done === size;
      total += size;
      totalDone += done;
      if (!complete && !firstOpen) firstOpen = chapter;

      chapter.el.classList.toggle('is-complete', complete);
      qs('[data-prog]', chapter.el).textContent = fmt(ui.stepsProgress, { done, total: size });
      fillDots(qs('.kicker .dots', chapter.el), size, done);
      qs('[data-finish]', chapter.el).hidden = !complete;

      track(chapter.id).forEach((item) => {
        item.classList.toggle('is-done', complete);
        const status = item.querySelector<HTMLElement>('[data-status]');
        if (!status) return;
        status.textContent = complete
          ? ui.complete
          : fmt(done ? ui.stepsProgress : ui.stepsTotal, { done, total: size });
        const dots = item.querySelector<HTMLElement>('.dots');
        if (dots) fillDots(dots, size, done);
      });
    });

    const checksDone = checks.filter((box) => store.has(box.id)).length;
    const checksComplete = checksDone === checks.length;
    const introSeen = store.has(INTRO_FLAG) || totalDone > 0 || checksDone > 0;

    if (!introSeen) currentId = 'intro';
    else if (firstOpen) currentId = firstOpen.id;
    else if (!checksComplete) currentId = 'check';
    else currentId = 'finished';

    order.forEach((id) => track(id).forEach((item) => item.classList.toggle('is-current', id === currentId)));
    track('intro').forEach((item) => item.classList.toggle('is-done', introSeen));

    checks.forEach((box) => {
      box.checked = store.has(box.id);
    });
    checkProg.textContent = fmt(ui.checksProgress, { done: checksDone, total: checks.length });
    checkFinish.hidden = !checksComplete;
    track('check').forEach((item) => {
      item.classList.toggle('is-done', checksComplete);
      const status = item.querySelector<HTMLElement>('[data-status]');
      if (status) {
        status.textContent = fmt(checksDone ? ui.checksProgress : ui.checksTotal, { done: checksDone, total: checks.length });
      }
    });

    count.textContent = `${totalDone}/${total}`;
    const ratio = total ? totalDone / total : 0;
    bar.style.transform = `scaleX(${ratio})`;
    ring.style.strokeDashoffset = String(RING_LENGTH * (1 - ratio));

    if (!introSeen) {
      nextKicker.textContent = ui.firstKicker;
      nextTitle.textContent = ui.firstTitle;
      nextLabel.textContent = ui.firstButton;
      nextButton.setAttribute('href', '#intro');
    } else if (firstOpen) {
      const step = nextStepOf(firstOpen);
      nextKicker.textContent = fmt(ui.nextKicker, { n: firstOpen.no, step: step?.no ?? 1 });
      nextTitle.textContent = step?.title ?? '';
      nextLabel.textContent = totalDone ? ui.continueButton : ui.startButton;
      nextButton.setAttribute('href', `#${firstOpen.id}`);
    } else if (!checksComplete) {
      nextKicker.textContent = ui.allStepsKicker;
      nextTitle.textContent = ui.allStepsTitle;
      nextLabel.textContent = ui.allStepsButton;
      nextButton.setAttribute('href', '#check');
    } else {
      nextKicker.textContent = ui.finishedKicker;
      nextTitle.textContent = fmt(ui.finishedTitle, { chapters: meta.chapterCount });
      nextLabel.textContent = ui.finishedButton;
      nextButton.setAttribute('href', '#check');
    }

    routeTrack.update();
    sideTrack.update();
  }

  return {
    render,
    replayRoute: () => routeTrack.replay(),
    updateSide: () => sideTrack.update(),
  };
}
