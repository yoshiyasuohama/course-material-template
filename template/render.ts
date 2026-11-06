/**
 * course.ts の内容から、index.html の中身を組み立てる。
 * Vite のプラグイン（plugin.ts）から、開発時とビルド時の両方で呼ばれる。
 */
import { escapeHtml as esc } from './helpers.ts';
import type { Chapter, Course, Leg, Warn } from './types.ts';
import { defaultUi, fmt, type UiText } from './ui.ts';

const ARROW = `<svg class="arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h11M9 3.5 13.5 8 9 12.5"/></svg>`;

type ResolvedChapter = Chapter & Required<Pick<Chapter, 'id' | 'heading' | 'navTitle'>> & { no: number };

/** ブラウザ側のスクリプトに渡す情報（src/lib/meta.ts が読む） */
export interface RuntimeMeta {
  title: string;
  storageKey: string;
  chapterCount: number;
  autoLinkSkip: string[];
  ui: UiText;
}

export interface Rendered {
  lang: string;
  head: string;
  body: string;
}

function resolveChapters(course: Course): ResolvedChapter[] {
  return course.chapters.map((chapter, index) => ({
    ...chapter,
    no: index + 1,
    id: chapter.id ?? `ch${index + 1}`,
    heading: chapter.heading ?? chapter.title,
    navTitle: chapter.navTitle ?? chapter.title,
  }));
}

function resolveLegs(course: Course, chapters: ResolvedChapter[], ui: UiText): Leg[] {
  return (
    course.legs ?? [
      { label: ui.legIntro, caption: ui.legIntroCaption, items: ['intro'] },
      { label: ui.legMain, caption: ui.legMainCaption, items: chapters.map((chapter) => chapter.id) },
      { label: ui.legCheck, caption: ui.legCheckCaption, items: ['check'] },
    ]
  );
}

/** 書き間違いを、ビルドの時点でわかりやすいエラーにする */
function validate(course: Course, chapters: ResolvedChapter[], legs: Leg[]): void {
  const problems: string[] = [];
  const ids = chapters.map((chapter) => chapter.id);
  const reserved = ['home', 'intro', 'check'];

  if (!course.meta.storageKey) problems.push('meta.storageKey が空です。教材ごとに別の値を指定してください。');
  if (chapters.length === 0) problems.push('chapters に章が1つもありません。');
  ids.forEach((id, index) => {
    if (reserved.includes(id)) problems.push(`章のID "${id}" は予約語なので使えません。`);
    if (!/^[A-Za-z][\w-]*$/.test(id)) problems.push(`章のID "${id}" には半角英数字・ハイフン・アンダースコアだけを使ってください。`);
    if (ids.indexOf(id) !== index) problems.push(`章のID "${id}" が重複しています。`);
  });
  chapters.forEach((chapter) => {
    if (chapter.steps.length === 0) problems.push(`第${chapter.no}章「${chapter.title}」に手順がありません。`);
  });

  const known = new Set(['intro', ...ids, 'check']);
  const placed = legs.flatMap((leg) => leg.items);
  placed.forEach((item) => {
    if (!known.has(item)) problems.push(`legs に存在しないID "${item}" があります。`);
  });
  ids.forEach((id) => {
    if (!placed.includes(id)) problems.push(`章 "${id}" が legs のどこにも入っていません。`);
  });
  course.checklist.forEach((item, index) => {
    if (item.chapter && !ids.includes(item.chapter)) {
      problems.push(`checklist の${index + 1}番目が、存在しない章 "${item.chapter}" を指しています。`);
    }
  });

  if (problems.length) {
    throw new Error(`course.ts の内容に問題があります：\n- ${problems.join('\n- ')}`);
  }
}

/** ブロック要素で始まる本文はそのまま、文章（リンクや <strong> で始まるものも含む）は段落で囲む */
const BLOCK_START = /^<(p|ul|ol|div|table|h[1-6]|pre|blockquote|dl|figure|img|section)[\s>/]/i;
const isBlock = (html: string) => BLOCK_START.test(html.trimStart());
const block = (html: string) => (isBlock(html) ? html : `<p>${html}</p>`);
const introBlock = (html: string) =>
  isBlock(html) ? `<div class="intro-p">${html}</div>` : `<p class="intro-p">${html}</p>`;

function heroTitle(course: Course): string {
  const lines = course.meta.heroLines ?? [course.meta.title];
  return lines
    .map((line) => {
      const html = esc(line).replace(/\*(.+?)\*/g, '<em>$1</em>');
      return `          <span class="line"><span>${html}</span></span>`;
    })
    .join('\n');
}

function warnBox(warn: Warn): string {
  const parts: string[] = [];
  const title = warn.title ? `<b>${esc(warn.title)}</b>` : '';
  if (title || warn.body) parts.push(`${title}${warn.body ?? ''}`);
  if (warn.points?.length) {
    parts.push(`<ul class="points">\n${warn.points.map((item) => `          <li>${item}</li>`).join('\n')}\n        </ul>`);
  }
  return `      <div class="warn">${parts.join('\n        ')}</div>`;
}

function pointsList(items: string[]): string {
  return `      <ul class="points">\n${items.map((item) => `        <li>${item}</li>`).join('\n')}\n      </ul>`;
}

function pager(prev?: { href: string; label: string }, next?: { href: string; label: string; kind?: string }, ui = defaultUi): string {
  const links: string[] = [];
  if (prev) links.push(`        <a href="#${prev.href}"><small>${esc(ui.prev)}</small>${esc(prev.label)}</a>`);
  if (next) links.push(`        <a class="next" href="#${next.href}"><small>${esc(next.kind ?? ui.next)}</small>${esc(next.label)}</a>`);
  return `      <div class="pager">\n${links.join('\n')}\n      </div>`;
}

export function renderCourse(course: Course): Rendered {
  const ui: UiText = { ...defaultUi, ...course.ui };
  const chapters = resolveChapters(course);
  const legs = resolveLegs(course, chapters, ui);
  validate(course, chapters, legs);

  const { meta } = course;
  const glossary = course.glossary ?? [];
  const totalSteps = chapters.reduce((sum, chapter) => sum + chapter.steps.length, 0);
  const label = (chapter: ResolvedChapter) => fmt(ui.chapterLabel, { n: chapter.no });
  const navName = (chapter: ResolvedChapter) => `${label(chapter)} ${chapter.navTitle}`;
  const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const last = chapters[chapters.length - 1];

  // ---- サイドの目次 ----
  const side = [
    `      <li data-track="intro"><a href="#intro"><span class="node">${esc(ui.introNode)}</span><span class="lbl">${esc(ui.introLabel)}</span></a></li>`,
    ...chapters.map(
      (chapter) =>
        `      <li data-track="${chapter.id}"><a href="#${chapter.id}" aria-label="${esc(label(chapter))}"><span class="node">${chapter.no}</span><span class="lbl">${esc(chapter.navTitle)}</span></a></li>`,
    ),
    `      <li data-track="check"><a href="#check"><span class="node">${esc(ui.checkNode)}</span><span class="lbl">${esc(ui.checkLabel)}</span></a></li>`,
  ].join('\n');

  // ---- ロードマップ ----
  const stop = (item: string): string => {
    if (item === 'intro') {
      return `          <li class="stop" data-track="intro"><a href="#intro">
            <span class="node">${esc(ui.introNode)}</span>
            <span class="stop-b">
              <span class="stop-t">${esc(ui.introLabel)}</span>
              <span class="stop-d">${course.intro.summary}</span>
            </span>
          </a></li>`;
    }
    if (item === 'check') {
      const summary = course.checklistSummary ?? esc(fmt(ui.checkSummary, { total: course.checklist.length }));
      return `          <li class="stop" data-track="check"><a href="#check">
            <span class="node">${esc(ui.checkNode)}</span>
            <span class="stop-b">
              <span class="stop-t">${esc(ui.checkLabel)}</span>
              <span class="stop-d">${summary}</span>
              <span class="stop-m"> <span class="status" data-status></span></span>
            </span>
          </a></li>`;
    }
    const chapter = byId.get(item)!;
    const services = chapter.services.map((service) => `<span class="svc">${esc(service)}</span>`).join('');
    return `          <li class="stop" data-track="${chapter.id}"><a href="#${chapter.id}">
            <span class="node">${chapter.no}</span>
            <span class="stop-b">
              <span class="stop-k">${esc(label(chapter))}</span>
              <span class="stop-t">${esc(chapter.title)}</span>
              <span class="stop-d">${chapter.summary}</span>
              <span class="stop-m">${services}<span class="status" data-status></span></span>
            </span>
          </a></li>`;
  };
  const route = legs
    .map(
      (leg) => `        <section class="leg">
          <div class="leg-label"><b>${esc(leg.label)}</b>${leg.caption ? `<small>${esc(leg.caption)}</small>` : ''}</div>
          <ol>
${leg.items.map(stop).join('\n')}
          </ol>
        </section>`,
    )
    .join('\n');

  const colophon = [
    meta.publisher && `${esc(ui.publisherLabel)}${esc(meta.publisher)}`,
    meta.issued && `${esc(ui.issuedLabel)}${esc(meta.issued)}`,
  ]
    .filter(Boolean)
    .join('　');

  const home = `    <section id="home" data-view>
      <div class="hero">
        <h1>
${heroTitle(course)}
        </h1>
        <p class="lead">${meta.lead}</p>
        <div class="next-card">
          <div class="next-text">
            <span id="next-kicker">${esc(ui.firstKicker)}</span>
            <span id="next-title">${esc(ui.firstTitle)}</span>
            <span class="facts">${esc(fmt(ui.facts, { chapters: chapters.length, steps: totalSteps }))}</span>
          </div>
          <a class="btn" id="resume" href="#intro"><span id="resume-label">${esc(ui.firstButton)}</span>${ARROW}</a>
        </div>
        ${colophon ? `<p class="colophon">${colophon}</p>` : ''}
      </div>

      <div class="route">
${route}
      </div>
    </section>`;

  // ---- はじめに ----
  const flowRows = chapters
    .map(
      (chapter) =>
        `            <tr><td>${chapter.no}</td><td><a href="#${chapter.id}">${esc(chapter.title)}</a></td><td>${esc(chapter.services.join(' / '))}</td></tr>`,
    )
    .join('\n');
  const terms = glossary
    .map((item) => `        <div><dt>${esc(item.term)}</dt><dd>${esc(item.definition)}</dd></div>`)
    .join('\n');
  const intro = course.intro;
  const introSection = `    <section id="intro" class="page" data-view data-title="${esc(ui.introLabel)}">
      <p class="kicker">${esc(ui.introLabel)}</p>
      <h1 tabindex="-1">${esc(intro.heading)}</h1>
      ${introBlock(intro.body)}

      <h2>${esc(ui.flowHeading)}</h2>
      <div class="tbl">
        <table>
          <thead><tr><th scope="col">${esc(ui.flowChapter)}</th><th scope="col">${esc(ui.flowContent)}</th><th scope="col">${esc(ui.flowServices)}</th></tr></thead>
          <tbody>
${flowRows}
          </tbody>
        </table>
      </div>
${glossary.length ? `\n      <h2>${esc(ui.glossaryHeading)}</h2>` : ''}
      <dl class="terms" id="terms-src"${glossary.length ? '' : ' hidden'}>
${terms}
      </dl>
${intro.prepare?.length ? `\n      <h2>${esc(ui.prepareHeading)}</h2>\n${pointsList(intro.prepare)}` : ''}
${intro.warn ? warnBox(intro.warn) : ''}

${pager(undefined, { href: chapters[0].id, label: navName(chapters[0]) }, ui)}
    </section>`;

  // ---- 各章 ----
  const chapterSections = chapters.map((chapter, index) => {
    const prev = index === 0 ? { href: 'intro', label: ui.introLabel } : { href: chapters[index - 1].id, label: navName(chapters[index - 1]) };
    const next = chapters[index + 1] ? { href: chapters[index + 1].id, label: navName(chapters[index + 1]) } : { href: 'check', label: ui.checkLabel };
    const steps = chapter.steps
      .map((step) => {
        const body = (Array.isArray(step.body) ? step.body : [step.body]).map(block).join('\n          ');
        return `        <li><div class="sb"><h3>${esc(step.title)}</h3>${body}</div></li>`;
      })
      .join('\n');
    const notes = [chapter.points?.length ? pointsList(chapter.points) : '', chapter.warn ? warnBox(chapter.warn) : '']
      .filter(Boolean)
      .join('\n');
    const finish = chapter.finishMessage ?? fmt(ui.chapterFinished, { n: chapter.no });
    return `    <section id="${chapter.id}" class="page" data-view data-chapter data-title="${esc(`${label(chapter)} ${chapter.title}`)}">
      <p class="kicker"><span>${esc(label(chapter))}</span><span>${esc(chapter.services.join(' → '))}</span><span class="prog" data-prog></span></p>
      <h1 tabindex="-1">${esc(chapter.heading)}</h1>${chapter.lead ? `\n      ${introBlock(chapter.lead)}` : ''}
      <div class="steps-bar"><button class="btn-quiet" type="button" data-toggle-all>${esc(ui.expandAll)}</button></div>
      <ol class="steps">
${steps}
      </ol>
      <h2 class="after-steps">${esc(chapter.notesHeading ?? ui.notesHeading)}</h2>
${notes}
      <p class="finish" data-finish hidden>${esc(finish)}</p>
${pager(prev, next, ui)}
    </section>`;
  });

  // ---- 振り返り ----
  const checks = course.checklist
    .map((item, index) => {
      const target = item.chapter ? byId.get(item.chapter) : undefined;
      const anchor = target ? `<a href="#${target.id}">${esc(label(target))}</a>` : '';
      return `        <li><label><input type="checkbox" id="c${index + 1}"><span>${esc(item.text)}</span></label>${anchor}</li>`;
    })
    .join('\n');
  const refs = (course.references ?? [])
    .map(
      (ref) =>
        `        <li>${esc(ref.title)}<br><a href="${esc(ref.url)}" target="_blank" rel="noopener">${esc(ref.url)}</a></li>`,
    )
    .join('\n');
  const checkSection = `    <section id="check" class="page" data-view data-title="${esc(ui.checkLabel)}">
      <p class="kicker"><span>${esc(ui.checkKicker)}</span><span class="prog" id="check-prog"></span></p>
      <h1 tabindex="-1">${esc(ui.checkLabel)}</h1>
      <ul class="checks">
${checks}
      </ul>
      <p class="finish" id="check-finish" hidden>${esc(ui.checkFinished)}</p>
${refs ? `\n      <h2>${esc(ui.referencesHeading)}</h2>\n      <ul class="refs">\n${refs}\n      </ul>\n` : ''}
      <div class="saved">
        <span>${esc(ui.saved)}</span>
        <button class="btn-quiet" type="button" id="reset">${esc(ui.reset)}</button>
        <span id="reset-ask" hidden>${esc(ui.resetAsk)}
          <button class="btn-quiet" type="button" id="reset-yes">${esc(ui.resetYes)}</button>
          <button class="btn-quiet" type="button" id="reset-no">${esc(ui.resetNo)}</button>
        </span>
      </div>
${pager({ href: last.id, label: navName(last) }, { href: 'home', label: ui.roadmap, kind: ui.back }, ui)}
    </section>`;

  const footer = [meta.footerNote && `<span>${meta.footerNote}</span>`, meta.publisher && `<span>© ${esc(meta.publisher)}</span>`]
    .filter(Boolean)
    .join('\n  ');

  const body = `<header class="top">
  <div class="top-in">
    <div class="crumbs">
      <a class="crumb" href="#home">
        ${ARROW}
        <span id="crumb-home">${esc(meta.title)}</span>
      </a>
      <span class="crumb-current" id="crumb-current"></span>
    </div>
    <span class="meter" title="${esc(ui.meterTitle)}">
      <svg class="ring" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15.9"/>
        <circle id="ring-fill" cx="18" cy="18" r="15.9" pathLength="100"/>
      </svg>
      <span id="count">0/${totalSteps}</span>
    </span>
    <button class="btn-quiet" type="button" id="terms-open"${glossary.length ? '' : ' hidden'}>${esc(ui.glossary)}</button>
  </div>
  <div class="bar" aria-hidden="true"><i id="bar"></i></div>
</header>

<div class="shell">
  <nav class="side" aria-label="${esc(ui.navLabel)}">
    <ol>
${side}
    </ol>
  </nav>

  <main>

${home}

${introSection}

${chapterSections.join('\n\n')}

${checkSection}

  </main>
</div>

<footer>
  ${footer}
</footer>

<dialog id="terms" aria-labelledby="terms-h">
  <div class="dh">
    <h2 id="terms-h">${esc(ui.glossary)}</h2>
    <button class="btn-quiet" type="button" id="terms-close">${esc(ui.close)}</button>
  </div>
  <dl class="terms" id="terms-body"></dl>
</dialog>

<div id="term-pop" popover="auto" role="tooltip"><strong></strong><p></p></div>`;

  const runtime: RuntimeMeta = {
    title: meta.title,
    storageKey: meta.storageKey,
    chapterCount: chapters.length,
    autoLinkSkip: glossary.filter((item) => item.autoLink === false).map((item) => item.term),
    ui,
  };
  // </script> で途切れないように < を逃がす
  const json = JSON.stringify(runtime).replace(/</g, '\\u003c');

  const theme = course.theme ?? {};
  const vars = [
    theme.accent && `--accent: ${theme.accent};`,
    theme.accentPress && `--accent-press: ${theme.accentPress};`,
    theme.soft && `--soft: ${theme.soft};`,
  ].filter(Boolean);

  const head = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}">`,
    // 開発時はCSSが後から差し込まれるので、詳細度を上げて上書きされないようにする
    vars.length ? `<style>:root:root { ${vars.join(' ')} }</style>` : '',
    `<script type="application/json" id="course-meta">${json}</script>`,
  ]
    .filter(Boolean)
    .join('\n');

  return { lang: meta.lang ?? 'ja', head, body };
}
