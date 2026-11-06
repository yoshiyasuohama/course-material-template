import { qsa, reducedMotion } from '../lib/dom';

export interface RouteChange {
  route: string;
  target: HTMLElement;
  first: boolean;
}

function parseRoute(): string {
  return location.hash.slice(1) || 'home';
}

export function startRouter(onEnter: (change: RouteChange) => void): void {
  const views = qsa('[data-view]');
  const order = views.map((view) => view.id);
  let current = '';

  function apply(route: string, first: boolean): void {
    const target = views.find((view) => view.id === route) ?? views[0];
    views.forEach((view) => {
      view.hidden = view !== target;
    });
    current = target.id;
    document.body.dataset.route = current;
    qsa('.side a').forEach((link) => {
      if (link.getAttribute('href') === `#${current}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    onEnter({ route: current, target, first });
    if (!first) {
      document.documentElement.classList.add('visited');
      target.querySelector<HTMLElement>('h1[tabindex]')?.focus({ preventScroll: true });
    }
  }

  function go(route: string): void {
    if (route === current) {
      window.scrollTo(0, 0);
      return;
    }
    const known = order.includes(route) ? route : order[0];
    if (!document.startViewTransition || reducedMotion()) {
      apply(known, false);
      return;
    }
    // ロードマップ上で先へ進むなら右から、戻るなら左から入る
    document.documentElement.dataset.direction = order.indexOf(known) >= order.indexOf(current) ? 'forward' : 'back';
    const transition = document.startViewTransition(() => apply(known, false));
    // 連続で移動すると前の演出は打ち切られる。表示は切り替わっているので問題ない
    transition.ready.catch(() => {});
    transition.finished.catch(() => {});
  }

  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    event.preventDefault();
    const route = link.getAttribute('href')!.slice(1);
    const dialog = document.querySelector<HTMLDialogElement>('dialog[open]');
    dialog?.close();
    go(route);
    try {
      history.pushState(null, '', `#${route}`);
    } catch {
      // 履歴を書き換えられない環境では、表示の切り替えだけ行う
    }
  });

  window.addEventListener('popstate', () => go(parseRoute()));
  window.addEventListener('hashchange', () => go(parseRoute()));

  apply(parseRoute(), true);
}
