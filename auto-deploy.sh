#!/bin/bash
# ── 自動デプロイスクリプト ──────────────────────────
# このスクリプトをMacのターミナルで一度だけ実行してください
# 新しいコミットを検出するたびに自動でGitHubにプッシュします

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

echo ""
echo "🚀 自動デプロイ監視を開始しました"
echo "   フォルダ: $REPO_DIR"
echo "   Ctrl+C で停止"
echo "──────────────────────────────────────"

while true; do
  # 未プッシュのコミットを確認
  UNPUSHED=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')

  if [ "$UNPUSHED" -gt "0" ]; then
    echo ""
    echo "📦 新しいコミット ${UNPUSHED}件 を検出 → プッシュ中..."
    if git push origin main 2>&1; then
      echo "✅ Vercelへのデプロイ完了！ → https://nouhin-crm.vercel.app"
    else
      echo "❌ プッシュに失敗しました"
    fi
  fi

  sleep 5
done
