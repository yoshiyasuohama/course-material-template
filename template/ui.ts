/**
 * 画面に出る決まり文句。{n} などの波かっこは、表示するときに数や名前に置き換わります。
 * 教材ごとに変えたいものだけ、course.ts の ui に書いて上書きします。
 */
export const defaultUi = {
  // 共通
  roadmap: 'ロードマップ',
  titleSeparator: '｜',
  glossary: '用語集',
  close: '閉じる',
  meterTitle: '完了した手順の数',
  navLabel: '章の一覧',
  prev: '前へ',
  next: '次へ',
  back: '戻る',
  publisherLabel: '発行元：',
  issuedLabel: '発行：',

  // 章
  chapterLabel: '第{n}章',
  stepLabel: '手順{n}',
  notesHeading: 'ポイント',
  chapterFinished: '第{n}章の手順がすべて完了しました。',
  expandAll: 'すべて開く',
  collapseAll: '閉じる',
  stepDone: 'できた',
  stepUndo: '完了（取り消す）',
  stepDoneAria: '手順{n}ができた',
  stepUndoAria: '手順{n}の完了を取り消す',
  copied: 'コピーしました',
  copySelected: '選択しました。コピーしてください',

  // 進捗
  facts: '全{chapters}章・{steps}手順',
  stepsProgress: '{done} / {total} 手順',
  stepsTotal: '全{total}手順',
  checksProgress: '{done} / {total} 項目',
  checksTotal: '全{total}項目',
  complete: '完了',

  // トップの「次にやること」
  firstKicker: '最初のステップ',
  firstTitle: 'はじめに：全体の流れと準備するものを確認する',
  firstButton: 'はじめる',
  nextKicker: '次の手順　第{n}章・手順{step}',
  continueButton: '続ける',
  startButton: '第1章へ進む',
  allStepsKicker: 'すべての手順が完了しました',
  allStepsTitle: '振り返りチェックリストで最後の確認をする',
  allStepsButton: '振り返りへ',
  finishedKicker: '完走しました',
  finishedTitle: '第1章から第{chapters}章まで、すべて確認済みです',
  finishedButton: '振り返りを見る',

  // はじめに
  introLabel: 'はじめに',
  introNode: '始',
  flowHeading: '全体の流れ',
  flowChapter: '章',
  flowContent: '内容',
  flowServices: '使うサービス',
  glossaryHeading: '用語ミニ解説',
  prepareHeading: '準備するもの',

  // 振り返り
  checkLabel: '振り返りチェックリスト',
  checkKicker: '振り返り',
  checkNode: '振',
  checkSummary: 'やり残しがないか{total}項目で確認します。',
  checkFinished: 'すべての項目を確認しました。お疲れさまでした。',
  referencesHeading: '参考リンク',
  saved: '進捗はお使いのブラウザにだけ保存されます。',
  reset: '進捗をリセット',
  resetAsk: 'すべての進捗を消しますか？',
  resetYes: '消す',
  resetNo: 'やめる',

  // ロードマップの区切り（legs を省略したとき）
  legIntro: '導入',
  legIntroCaption: '教材の全体像をつかむ',
  legMain: '本編',
  legMainCaption: '手順に沿って進める',
  legCheck: '確認',
  legCheckCaption: 'やり残しがないか見直す',
};

export type UiText = typeof defaultUi;

/** "{n}章" の {n} を値で置き換える */
export function fmt(text: string, values: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
}
