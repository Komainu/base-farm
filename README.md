# BASE FARM 🌾

**Farcaster Mini App** — Baseネットワーク上のオンチェーン活動を農場と精霊のビジュアルに変換。

## セットアップ

### 1. `.env.local` にAPIキーを設定

```bash
# .env.local
ETHERSCAN_API_KEY=あなたのAPIキーをここに貼る
```

> APIキーは [https://etherscan.io/myapikey](https://etherscan.io/myapikey) で取得できます。
> Etherscan V2 のキーはBase (chainid=8453) で動作します。

### 2. 開発サーバー起動

```bash
npm install
npm run dev
```

→ http://localhost:3000 にアクセス

## Vercelへのデプロイ

```bash
npx vercel --prod
```

Vercelダッシュボードの **Settings → Environment Variables** に `ETHERSCAN_API_KEY` を追加してください。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **バックエンド**: Vercel Functions (`/api/basescan`)
- **API**: Etherscan V2 API (chainid=8453 = Base)
- **スタイリング**: Vanilla CSS
- **グラフィック**: HTML Canvas API

## セキュリティ

- フロントエンドはAPIキーを一切保持しません
- すべてのEtherscan API呼び出しはサーバーサイド (`/api/basescan`) 経由
- `.env.local` は `.gitignore` でGit管理対象外

## 画面構成

| 画面 | 内容 |
|------|------|
| エントランス | アドレス入力・セキュリティ表示・最近の農場ティッカー |
| ローディング | チェーン読み込み演出 |
| 観測結果 | 精霊 → 農場 → データの縦スクロール |
| シェアモーダル | Canvas生成 → Warpcastへキャスト |
