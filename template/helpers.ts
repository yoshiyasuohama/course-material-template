/**
 * 本文（HTML）を書くときの小さな部品。course.ts から使います。
 */

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 外部リンク。新しいタブで開きます。label を省略するとURLをそのまま表示します */
export function link(url: string, label: string = url): string {
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
}

/** コピーボタン付きのプロンプト例 */
export function prompt(text: string, label = 'プロンプトの例', copyLabel = 'コピー'): string {
  const id = nextId('prompt');
  return `<div class="prompt">
            <div class="prompt-h"><span>${escapeHtml(label)}</span><button class="copy" type="button" data-copy="#${id}">${escapeHtml(copyLabel)}</button></div>
            <p id="${id}">${escapeHtml(text)}</p>
          </div>`;
}

/** コピーボタン付きの短いコード（設定値の名前など） */
export function copyCode(text: string, copyLabel = 'コピー'): string {
  const id = nextId('code');
  return `<code id="${id}">${escapeHtml(text)}</code><button class="copy" type="button" data-copy="#${id}">${escapeHtml(copyLabel)}</button>`;
}

/** 手順の中の小さな箇条書き */
export function sub(items: string[]): string {
  return `<ul class="sub">\n${items.map((item) => `            <li>${item}</li>`).join('\n')}\n          </ul>`;
}

/** 強調付きの箇条書き（手順の後ろの「ポイント」と同じ見た目） */
export function points(items: string[]): string {
  return `<ul class="points">\n${items.map((item) => `          <li>${item}</li>`).join('\n')}\n        </ul>`;
}
