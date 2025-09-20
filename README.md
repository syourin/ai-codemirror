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
1. CodeMirror エディタに初期値が表示され、編集できること。
2. 「AIで推敲」ボタン押下でローディング状態になり、約 0.5 秒後に推敲結果が表示されること。
3. 差分パネルに追加・削除がハイライト付きで表示されること。
4. 差分パネル右上の「ハイライト表示 / Merge View」切り替えで、CodeMirror MergeView による比較ができること。
5. 「全文置換」でエディタ本文が推敲結果に差し替わり、差分パネルがリセットされること。
6. 「不採用」で推敲結果が破棄され、元の本文が維持されること。
7. 本文を空で送るとエラーメッセージが表示されること。

## 実装メモ
- `src/mocks/handlers.ts`: MSW が返すダミーレスポンスを定義しています。
- `app/page.tsx`: クライアントコンポーネントとしてエディタと差分パネルを構築。
- `src/utils/diff.ts`: 差分計算のユーティリティ。
- `src/components/DiffViewer.tsx`: 差分表示コンポーネント。
- `src/components/MergeDiff.tsx`: `@codemirror/merge` を用いた左右比較用ビュー。
- `public/mockServiceWorker.js`: `msw` 用のサービスワーカーファイル（必要に応じて再生成可能）。

## 追加検討事項
- HTMLや差し込み変数のマスキングロジックの実装。
- 差分の粒度制御（段落単位・文単位）と部分適用 UI。
- 推敲結果のレビュー/フィードバック蓄積機構。
- E2E テスト（Playwright など）での差分適用フローの自動確認。
