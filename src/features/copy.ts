import { qs, qsa } from '../lib/dom';
import { ui } from '../lib/meta';

export function setupCopy(): void {
  qsa<HTMLButtonElement>('[data-copy]').forEach((button) => {
    const label = button.textContent ?? '';
    const flash = (message: string) => {
      button.textContent = message;
      button.classList.add('is-copied');
      window.setTimeout(() => {
        button.textContent = label;
        button.classList.remove('is-copied');
      }, 1800);
    };

    button.addEventListener('click', async () => {
      const source = qs(button.dataset.copy ?? '');
      try {
        await navigator.clipboard.writeText(source.textContent ?? '');
        flash(ui.copied);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(source);
        const selection = getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        flash(ui.copySelected);
      }
    });
  });
}
