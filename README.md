# ai-codemirror
# AI推敲アシスト (CodeMirror × Next.js)

## プロジェクト概要
- Next.js (App Router) + React + TypeScript で構成した AI 推敲アシストのモック実装です。
- CodeMirror エディタを利用して本文を編集し、モック化した LLM API（MSW）が推敲結果を返します。
- 差分は `diff-match-patch` を用いて算出し、全文置換か不採用かをユーザーが選択できます。

## セットアップ
```bash
npm install
# 初回のみ（MSW のサービスワーカーを再生成したい場合）
npx msw init public/ --save
```

## 開発サーバーの起動
```bash
npm run dev
```
- `http://localhost:3000` を開くとエディタと推敲パネルが表示されます。
- 開発モードでは `MSW` が自動で起動し、`/api/polish` へのリクエストをモックします。

## 動作確認ポイント
1. エディタ左上の「テキスト編集 / HTML編集」トグルで編集モードを切り替えられること。
2. 「AIで推敲」押下でモードに合わせた推敲結果が返却されること。
3. テキストモードでは差分パネルに追加・削除がハイライト付きで表示され、必要に応じて「テキストプレビュー」で推敲前後を並べて見られること。
4. 差分パネル右上で「ハイライト表示 / Merge View」を切り替えられること（HTMLモード時のみ HTMLプレビューボタンが追加される）。
5. HTMLモードではプレビューがカード型レイアウトで表示されること。
6. 「全文置換」でエディタ本文が推敲結果に差し替わり、差分パネルがリセットされること。
7. 「不採用」で推敲結果が破棄され、元の本文が維持されること。
8. 本文を空で送るとエラーメッセージが表示されること。

## 実装メモ
- `src/mocks/handlers.ts`: MSW が返すダミーレスポンスを定義しています。
- `app/page.tsx`: クライアントコンポーネントとしてエディタと差分パネルを構築。
- `src/utils/diff.ts`: 差分計算のユーティリティ。
- `src/components/DiffViewer.tsx`: 差分表示コンポーネント。
- `src/components/MergeDiff.tsx`: `@codemirror/merge` を用いた左右比較用ビュー。
- `src/components/HtmlDiffPreview.tsx`: HTMLメール向けのカード型レンダリング比較ビュー。
- `src/components/TextPreview.tsx`: テキストモードで推敲前後を並べて確認するプレビュー。
- `src/utils/emailHtml.ts`: テキスト本文を簡易HTMLに変換するユーティリティ。
- `src/mocks/handlers.ts`: テキスト/HTML 両モードの推敲モックを返却。
- `public/mockServiceWorker.js`: `msw` 用のサービスワーカーファイル（必要に応じて再生成可能）。

## 追加検討事項
- HTMLや差し込み変数のマスキングロジックの実装。
- 差分の粒度制御（段落単位・文単位）と部分適用 UI。
- 推敲結果のレビュー/フィードバック蓄積機構。
- E2E テスト（Playwright など）での差分適用フローの自動確認。
