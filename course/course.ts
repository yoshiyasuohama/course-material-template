/**
 * 教材の中身はこのファイルだけに書きます。
 * 書き方は README.md の「教材の作り方」を参照してください。
 *
 * 「〇〇」や【】で囲んだところを、作る教材に合わせて書き換えてください。
 * 使える部品：link(), prompt(), copyCode(), sub(), points()（template/index.ts から読み込む）
 */
import { defineCourse } from '../template/index.ts';

export default defineCourse({
  meta: {
    title: '【教材のタイトル】',
    // トップの大見出しを行で分けたいとき。*語* と書くと強調色になります
    // heroLines: ['【1行目】', '*【強調する語】*と', '【3行目】'],
    description: '【検索結果などに出る、教材の短い説明】',
    lead: '【トップの見出しの下に出る、教材の紹介文】',
    publisher: '【発行元】',
    issued: '【発行時期 例：2026年4月】',
    footerNote: '',
    // 教材ごとに必ず別の値にしてください（半角英数字とハイフン）
    storageKey: 'my-course-progress',
  },

  // 強調色を変えるとき
  // theme: { accent: '#00843d', accentPress: '#006b31', soft: '#eef8f2' },

  intro: {
    heading: '【この教材で学ぶこと】',
    summary: '全体の流れと準備するものを確認します。',
    body: '【教材の目的、対象者、進め方などを書きます】',
    prepare: ['【準備するもの】'],
    // warn: { title: '注意', body: '【注意事項】' },
  },

  // ロードマップの区切り。省略すると「導入／本編／確認」の3つになります
  // legs: [
  //   { label: '導入', caption: '教材の全体像をつかむ', items: ['intro'] },
  //   { label: '【区切りの名前】', caption: '【説明】', items: ['ch1'] },
  //   { label: '確認', caption: 'やり残しがないか見直す', items: ['check'] },
  // ],

  chapters: [
    {
      id: 'ch1',
      title: '【第1章の名前】',
      services: ['【使うサービスや道具】'],
      summary: '【ロードマップに出る、この章の1行説明】',
      // lead: '【章の導入文】',
      steps: [
        {
          title: '【手順の見出し】',
          body: '【手順の説明】',
        },
      ],
      points: ['【この章のポイント】'],
    },
  ],

  // 用語集。本文中の最初の出現がタップできる語になります
  glossary: [
    // { term: '【用語】', definition: '【意味】' },
  ],

  // 振り返りチェックリスト
  checklist: [
    { text: '【できるようになったことの確認】', chapter: 'ch1' },
  ],

  references: [
    // { title: '【参考資料の名前】', url: 'https://example.com' },
  ],
});
