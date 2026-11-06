import { qs, qsa } from '../lib/dom';
import { store } from '../lib/store';

export function setupChecklist(): void {
  qsa<HTMLInputElement>('.checks input').forEach((box) => {
    box.addEventListener('change', () => store.set(box.id, box.checked));
  });

  const reset = qs('#reset');
  const ask = qs('#reset-ask');
  const showAsk = (on: boolean) => {
    ask.hidden = !on;
    reset.hidden = on;
  };
  reset.addEventListener('click', () => showAsk(true));
  qs('#reset-no').addEventListener('click', () => showAsk(false));
  qs('#reset-yes').addEventListener('click', () => {
    store.clear();
    showAsk(false);
  });
}
