# Yorizo Frontend

Next.js (App Router) で実装されたフロントエンドです。テストは Jest（unit/UI）と Playwright（E2E）の最小セットを同梱しています。

## セットアップ

```bash
npm install
```

必要に応じて `.env` を `.env.example` から複製してください。

## スクリプト

- `npm run dev` — 開発サーバー (http://localhost:3000)
- `npm run build` — 本番ビルド
- `npm start` — 本番サーバー
- `npm run lint` — ESLint
- `npm test` — Jest + Testing Library（jsdom）
- `npm run test:watch` — Jest ウォッチ
- `npm run test:e2e` — Playwright

## テスト周辺

### Jest

- 設定: `jest.config.cjs`
- セットアップ: `jest.setup.ts`（`@testing-library/jest-dom` 読み込み）
- 置き場: `__tests__/**/*.(test|spec).[jt]s?(x)`

### msw（モック）

- ハンドラ: `src/mocks/handlers.ts`
- ブラウザワーカー: `src/mocks/browser.ts`
- 開発時のみ起動したい場合の例（`app/layout.tsx` などで実行）:

  ```ts
  if (process.env.NEXT_PUBLIC_API_MOCKING === "enabled") {
    import("../mocks/browser").then(({ worker }) => worker.start());
  }
  ```

### Playwright

- 設定: `playwright.config.ts`
- 初期セットアップ: `npx playwright install` を一度実行済み（ブラウザが未インストールなら再実行してください）。

## 型チェック

`tsconfig.json` で `strict: true` を有効化済みです。TypeScript の型エラーはビルド・テスト前に解消してください。
