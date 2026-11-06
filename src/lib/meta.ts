import type { RuntimeMeta } from '../../template/render';
import { fmt } from '../../template/ui';

/** ビルド時に index.html へ埋め込まれた教材の情報（template/render.ts が書き出す） */
export const meta: RuntimeMeta = JSON.parse(document.getElementById('course-meta')?.textContent ?? 'null');

export const ui = meta.ui;

export { fmt };
