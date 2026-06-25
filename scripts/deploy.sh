#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# --- 工具函数 ---

push_with_retry() {
    local max_retries=3
    for attempt in $(seq 1 $max_retries); do
        git -C dist push -f origin dist && return 0
        local wait=$((attempt * attempt * 5))
        echo "推送失败 (attempt $attempt/$max_retries)，${wait}秒后重试..."
        sleep $wait
    done
    echo "❌ 推送全部失败"
    return 1
}

wait_for_site() {
    local url="https://l4place0.github.io/l4p-blog/"
    for i in $(seq 1 30); do
        status=$(curl -sf "$url" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
        if [ "$status" = "200" ]; then
            echo "✅ 站点已上线"
            return 0
        fi
        echo "等待部署... ($i/30)"
        sleep 10
    done
    echo "⚠️ 站点未在 5 分钟内上线"
    return 1
}

# --- 主流程 ---

CURRENT_VERSION=$(jq -r '.version' package.json)
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"

echo "📦 当前版本: v$CURRENT_VERSION → 新版本: v$NEW_VERSION"
echo ""

# Step 1: 测试
echo "🧪 [1/9] 运行测试..."
npm test

# Step 2: 构建
echo "🔨 [2/9] 构建站点..."
rm -rf dist
npm run build

# Step 3: 搜索索引
echo "🔍 [3/9] 生成搜索索引..."
npx pagefind --site dist

# Step 4: 产物验证
echo "📋 [4/9] 验证构建产物..."
test -f dist/.nojekyll || { echo "❌ 缺少 .nojekyll"; exit 1; }
test -f dist/index.html || { echo "❌ 缺少 index.html"; exit 1; }
test -f dist/pagefind/pagefind.js || { echo "❌ 缺少 Pagefind 索引"; exit 1; }
grep -q '/l4p-blog/_astro/' dist/index.html || { echo "❌ CSS 路径缺少 base 前缀"; exit 1; }
echo "  ✅ 产物验证通过"

# Step 5: 版本 bump
echo "📌 [5/9] 版本 bump → v$NEW_VERSION..."
jq ".version = \"$NEW_VERSION\"" package.json > tmp.json && mv tmp.json package.json
git add package.json
git commit -m "release: v$NEW_VERSION"
git tag "v$NEW_VERSION"

# Step 6: 变更日志
echo "📝 [6/9] 生成变更日志..."
PREVIOUS_TAG=$(git tag --list 'v*' --sort=-version:refname | head -n1)
if [ -z "$PREVIOUS_TAG" ]; then
    PREVIOUS_TAG="v0.0.0"
    echo "  无历史 tag，从 v0.0.0 开始"
fi
CHANGES=$(git log "$PREVIOUS_TAG..HEAD" --oneline --no-merges | sed 's/^[a-f0-9]*/-/' || echo "- 初始版本")
CHANGELOG="docs/change/$(date +%Y-%m-%d)-v$NEW_VERSION.md"
cat > "$CHANGELOG" << EOF
# v$NEW_VERSION ($(date +%Y-%m-%d))

$CHANGES
EOF
git add "$CHANGELOG"
git commit -m "docs: 变更日志 v$NEW_VERSION"

# Step 7: 推送 dist
echo "🚀 [7/9] 推送 dist 分支..."
git -C dist add -A
git -C dist commit -m "deploy: v$NEW_VERSION" || true
push_with_retry

# Step 8: 推送 master + tags
echo "📤 [8/9] 推送 master 分支..."
git push origin master --tags

# Step 9: 冒烟测试
wait_for_site
echo "🔥 运行冒烟测试..."
npx playwright test e2e/smoke.spec.ts --reporter=line

echo ""
echo "✅ 部署完成！v$NEW_VERSION"
echo "🌐 https://l4place0.github.io/l4p-blog/"
