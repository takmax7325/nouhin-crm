# 納品管理CRM — Web PWA版

**Mac不要・Xcode不要** — GitHubにpushするだけでVercelに自動デプロイ。
iPhoneのSafariから開いてホーム画面に追加すればネイティブアプリのように使えます。

---

## 技術スタック

| 技術 | 用途 |
|------|------|
| React 18 + TypeScript | UI |
| Vite + vite-plugin-pwa | ビルド & PWA化 |
| TailwindCSS | スタイリング (glass morphism) |
| Supabase JS v2 | Auth / DB / Storage / Realtime |
| React Leaflet + OpenStreetMap | 地図（API Key不要・無料） |
| Supercluster | マーカークラスタリング |
| LocalStorage | オフラインキャッシュ |
| Vercel | ホスティング（無料） |

---

## 🚀 5分でデプロイする手順

### Step 1: GitHubにリポジトリを作成

1. [github.com/new](https://github.com/new) でリポジトリを作成
2. `NouhinCRM-Web` フォルダをGitHubにアップロード（またはgit push）

```bash
cd NouhinCRM-Web
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_NAME/nouhin-crm.git
git push -u origin main
```

### Step 2: Vercelにデプロイ

1. [vercel.com](https://vercel.com) にアクセス（無料・GitHubログインでOK）
2. **New Project** → GitHubリポジトリを選択
3. Framework: **Vite** が自動検出される
4. **Environment Variables** に以下を追加:

| 変数名 | 値 |
|--------|-----|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` |

5. **Deploy** ボタンをクリック → 約1分でデプロイ完了！

### Step 3: iPhoneホーム画面に追加

1. iPhoneのSafariでVercelのURLを開く
2. 画面下の「共有」ボタン（四角から矢印のアイコン）をタップ
3. 「ホーム画面に追加」を選択
4. 「追加」をタップ → アプリとして起動できます 🎉

---

## Supabase セットアップ

### テーブル作成 (SQL Editor でそのまま実行)

```sql
-- 納品先
CREATE TABLE deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    prefecture TEXT NOT NULL,
    product TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    lat DOUBLE PRECISION NOT NULL DEFAULT 35.6762,
    lng DOUBLE PRECISION NOT NULL DEFAULT 139.6503,
    website TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 画像
CREATE TABLE images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'sub'
);

-- メモ
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 納品履歴
CREATE TABLE histories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT NOW(),
    quantity INTEGER NOT NULL DEFAULT 1,
    memo TEXT NOT NULL DEFAULT ''
);

-- 担当者
CREATE TABLE contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    person_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT ''
);

-- Row Level Security（認証済みのみアクセス）
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_only" ON deliveries FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_only" ON images FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_only" ON notes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_only" ON histories FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_only" ON contacts FOR ALL USING (auth.uid() IS NOT NULL);

-- Realtime 有効化
ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;
```

### Storage バケット

1. Supabase Dashboard → Storage → **New bucket**
2. 名前: `delivery-images`
3. **Public** に設定して作成

### テストユーザー作成

Supabase Dashboard → Authentication → Users → **Invite user**
（またはメール確認をオフにして直接ユーザーを作成）

---

## ローカル開発

```bash
# 依存関係インストール
npm install

# .env ファイル作成
cp .env.example .env
# .env を編集して Supabase の URL と Key を入力

# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:5173 を開く
```

---

## PWA の特徴

| 機能 | 説明 |
|------|------|
| ホーム画面アイコン | iOS Safariから追加可能 |
| フルスクリーン表示 | ブラウザバーが非表示になりアプリ風に |
| オフライン対応 | LocalStorageキャッシュで圏外でも閲覧可能 |
| 地図タイルキャッシュ | 一度表示したマップタイルはオフラインでも表示 |
| Realtime同期 | 複数端末でデータが自動同期 |

---

## 機能一覧

- **🔐 認証** — Supabase Auth (メール/パスワード)
- **🗺️ 地図** — 全納品先をマップ表示、クラスタリング対応
- **📋 一覧** — 検索・フィルター・スワイプ削除
- **📦 詳細** — 画像カルーセル・メモCRUD・納品履歴・担当者管理
- **➕ 新規登録** — 住所入力→自動ジオコーディング、画像アップロード
- **📴 オフライン** — キャッシュデータで圏外でも動作
- **⚡ Realtime** — 複数端末でリアルタイム同期

---

## アイコン画像の作成（任意）

`public/icons/` フォルダに以下を配置するとアプリアイコンが適用されます:
- `icon-192.png` (192×192px)
- `icon-512.png` (512×512px)

無料で作成: [realfavicongenerator.net](https://realfavicongenerator.net)

---

## トラブルシューティング

**地図が表示されない**
→ `import 'leaflet/dist/leaflet.css'` が正しくロードされているか確認

**ログインできない**
→ Supabase の `.env` の URL・Key が正しいか確認
→ Supabase → Authentication → URL Configuration に Vercel の URL を追加

**iPhoneのSafariでカメラが使えない**
→ SafariではHTTPSが必要 (Vercelは自動でHTTPS)

**Push後に自動デプロイされない**
→ Vercel → Settings → Git Integration でリポジトリを確認
