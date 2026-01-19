# 法令検索チャット（Dify Workflow 連携）

日本の法令API（e-Gov）を利用する Dify Workflow アプリと連携するチャットクライアントです。  
APIキーは UI から入力し、ブラウザの SessionStorage に保存します。

## 機能概要
- Dify Workflow API（`/v1/workflows/run`）のストリーミング応答に対応
- APIキーは UI で設定・更新、SessionStorage で保持（ブラウザを閉じると消えます）
- チャットUI（ユーザーは右、アシスタントは左）
- Markdown 描画（`react-markdown` + `remark-gfm`）
- 401 / 400 などのエラーを画面に表示
- 開発時は Vite の proxy（`/dify`）で CORS 回避

## フォルダ構成（主要部分）
```
src/
  components/
    SettingsModal.tsx        # APIキー設定モーダル
  contexts/
    ApiSettingsContext.tsx   # API設定のContext + LocalStorage
  hooks/
    useDifyChat.ts           # Dify Workflow API 呼び出し（SSE対応）
  App.tsx                    # 画面レイアウト
  index.css                  # Tailwind v4 + ベーススタイル
  types.ts                   # 型定義
vite.config.ts               # dev proxy 設定
```

## 実行方法
1) 依存関係をインストール
```
npm install
```

2) 開発サーバー起動
```
npm run dev
```

3) ブラウザで `http://localhost:5174` を開き、右上の「設定⚙️」から APIキーを入力

## Dify 側の前提
- アプリのモードは **Workflow** を使用
- 入力変数名は **`message`** を定義していること
- API は `POST /v1/workflows/run` を使用

## 注意事項
- Base URL は `https://api.dify.ai/v1` に固定されています（UI には表示しません）
- 開発環境では `/dify` を Vite proxy で `https://api.dify.ai/v1` に転送します
- 本番環境では CORS 設定が必要です（Dify 側で許可するか、リバースプロキシを用意してください）
- APIキーは SessionStorage に保存されます
