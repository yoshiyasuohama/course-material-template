import { setupChecklist } from './features/checklist';
import { setupCopy } from './features/copy';
import { setupGlossary } from './features/glossary';
import { setupProgress } from './features/progress';
import { startRouter } from './features/router';
import { enterChapter, renderChapters, setupSteps } from './features/steps';
import { qs } from './lib/dom';
import { meta, ui } from './lib/meta';
import { store } from './lib/store';

const SITE_TITLE = meta.title;

setupGlossary();
setupCopy();
setupChecklist();

const chapters = setupSteps();
const progress = setupProgress(chapters);

store.subscribe(() => {
  renderChapters(chapters);
  progress.render();
});

renderChapters(chapters);
progress.render();

const crumbHome = qs('#crumb-home');
const crumbCurrent = qs('#crumb-current');

startRouter(({ route, target, first }) => {
  const title = target.dataset.title;
  document.title = title ? `${title}${ui.titleSeparator}${SITE_TITLE}` : SITE_TITLE;
  crumbHome.textContent = route === 'home' ? SITE_TITLE : ui.roadmap;
  crumbCurrent.textContent = title ?? '';

  if (route === 'intro') store.set('intro', true);

  const chapter = chapters.find((item) => item.id === route);
  if (chapter) enterChapter(chapter);

  progress.updateSide();
  if (route === 'home' && first) progress.replayRoute();
});

document.documentElement.classList.add('ready');
