/**
 * 教材（コース）の定義の型。
 *
 * 文字列の扱い：
 * - 「テキスト」と書いた項目は、そのまま文字として表示します（HTMLは使えません）。
 * - 「HTML」と書いた項目には、<strong> や <code>、helpers の link() などを含められます。
 */

import type { UiText } from './ui.ts';

export interface CourseMeta {
  /** 教材のタイトル（テキスト）。ページタイトルやパンくずに使います */
  title: string;
  /**
   * トップの大見出しを行ごとに分けたもの（テキスト）。*語* と書くと強調色になります。
   * 省略すると title を1行で表示します。
   */
  heroLines?: string[];
  /** 検索結果などに出る説明文（テキスト） */
  description: string;
  /** トップの見出し下に出るリード文（HTML） */
  lead: string;
  /** 発行元（テキスト）。トップの奥付とフッターに使います */
  publisher: string;
  /** 発行時期（テキスト）。例：2026年11月 */
  issued?: string;
  /** フッター左側の注記（HTML） */
  footerNote?: string;
  /**
   * 進捗をブラウザに保存するときのキー。教材ごとに必ず別の値にしてください。
   * 同じ値の教材が同じドメインにあると、進捗が混ざります。
   */
  storageKey: string;
  /** html要素の lang 属性。既定は "ja" */
  lang?: string;
}

export interface Theme {
  /** 強調色。既定は #00843d（緑） */
  accent?: string;
  /** 強調色を押したときの色 */
  accentPress?: string;
  /** 強調色の淡い背景 */
  soft?: string;
}

export interface Warn {
  /** 見出し（テキスト）。省略可 */
  title?: string;
  /** 本文（HTML） */
  body?: string;
  /** 箇条書き（HTML） */
  points?: string[];
}

export interface Step {
  /** 手順の見出し（テキスト） */
  title: string;
  /**
   * 手順の本文（HTML）。"<" で始まらない文字列は <p> で囲みます。
   * 配列にすると、要素ごとに段落（またはブロック）として並べます。
   */
  body: string | string[];
}

export interface Chapter {
  /** URLの #以降と進捗の保存に使うID。既定は ch1, ch2 … 。公開後は変えないでください */
  id?: string;
  /** 章の名前（テキスト）。ロードマップ・はじめにの表・ページタイトルに使います */
  title: string;
  /** 章ページの大見出し（テキスト）。省略すると title */
  heading?: string;
  /** サイドの目次と前へ・次へボタンに使う短い名前（テキスト）。省略すると title */
  navTitle?: string;
  /** この章で使うサービス名（テキスト） */
  services: string[];
  /** ロードマップに出る1行の説明（HTML） */
  summary: string;
  /** 大見出しの下に出る導入文（HTML） */
  lead?: string;
  steps: Step[];
  /** 手順の後ろの見出し（テキスト）。既定は「ポイント」 */
  notesHeading?: string;
  /** 手順の後ろの箇条書き（HTML） */
  points?: string[];
  /** 手順の後ろの注意枠 */
  warn?: Warn;
  /** 全手順完了時のメッセージ（テキスト）。省略すると ui.chapterFinished */
  finishMessage?: string;
}

export interface Intro {
  /** 大見出し（テキスト） */
  heading: string;
  /** 導入文（HTML） */
  body: string;
  /** ロードマップに出る1行の説明（HTML） */
  summary: string;
  /** 「準備するもの」の箇条書き（HTML）。空なら見出しごと出しません */
  prepare?: string[];
  /** 末尾の注意枠 */
  warn?: Warn;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  /**
   * 本文中の最初の出現を、タップで意味が出るボタンにするか。既定は true。
   * 本文に何度も出るサービス名などは false にすると読みやすくなります。
   */
  autoLink?: boolean;
}

export interface CheckItem {
  /** 確認する内容（テキスト） */
  text: string;
  /** 関連する章のID（ch1 など）。右側に章へのリンクが出ます */
  chapter?: string;
}

export interface Reference {
  title: string;
  url: string;
}

/** ロードマップの区切り。items には "intro"、章ID、"check" を並べます */
export interface Leg {
  label: string;
  caption?: string;
  items: string[];
}

export interface Course {
  meta: CourseMeta;
  theme?: Theme;
  /** 画面の決まり文句を差し替えるとき（英語の教材にするときなど）に指定します */
  ui?: Partial<UiText>;
  intro: Intro;
  /** 省略すると、導入・本編（全章）・確認の3区切りになります */
  legs?: Leg[];
  chapters: Chapter[];
  glossary?: GlossaryTerm[];
  /** 振り返りチェックリスト */
  checklist: CheckItem[];
  /** 振り返りページの説明（HTML）。ロードマップに出ます */
  checklistSummary?: string;
  references?: Reference[];
}

/** 型の補完を効かせるための関数。中身はそのまま返します */
export function defineCourse(course: Course): Course {
  return course;
}
