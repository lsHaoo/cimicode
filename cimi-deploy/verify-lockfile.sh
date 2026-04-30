#!/usr/bin/env bash
# ============================================================================
# 依赖版本审计脚本
# 用于对比两次构建之间的依赖变化，检测是否存在版本漂移
#
# 用法：
#   ./verify-lockfile.sh [old-lockfile] [new-lockfile]
#   ./verify-lockfile.sh                  # 对比 bun.lock 和 HEAD 的版本
#
# 适用场景：
#   - 构建前检查依赖是否发生变化
#   - CI 中验证依赖版本一致性
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

OLD_LOCK="${1:-}"
NEW_LOCK="${2:-bun.lock}"

cd "$PROJECT_ROOT"

echo "============================================"
echo " Dependency Version Audit"
echo "============================================"

# 提取 lockfile 中的包版本信息（简化版，提取 "pkg-name": "version" 行）
extract_versions() {
  local lockfile="$1"
  if [ ! -f "$lockfile" ]; then
    echo "  ERROR: $lockfile not found" >&2
    return 1
  fi
  # Bun text lockfile 格式：包名后跟版本信息
  # 提取所有 "包名@版本" 格式的条目
  grep -oP '"[^"]+@[^"]+"' "$lockfile" | sort -u || true
}

if [ -n "$OLD_LOCK" ]; then
  echo ""
  echo "Comparing:"
  echo "  Old: $OLD_LOCK"
  echo "  New: $NEW_LOCK"
  echo ""

  TMP_OLD=$(mktemp)
  TMP_NEW=$(mktemp)

  extract_versions "$OLD_LOCK" > "$TMP_OLD"
  extract_versions "$NEW_LOCK" > "$TMP_NEW"

  ADDED=$(comm -13 "$TMP_OLD" "$TMP_NEW" | wc -l)
  REMOVED=$(comm -23 "$TMP_OLD" "$TMP_NEW" | wc -l)
  CHANGED=0

  # 检测版本变化（同名包不同版本）
  while IFS= read -r line; do
    PKG_NAME=$(echo "$line" | sed 's/@[^@]*$//')
    if grep -q "\"$PKG_NAME@" "$TMP_NEW"; then
      NEW_VER=$(grep "\"$PKG_NAME@" "$TMP_NEW" | head -1)
      if [ "$line" != "$NEW_VER" ]; then
        echo "  CHANGED: $line -> $NEW_VER"
        CHANGED=$((CHANGED + 1))
      fi
    fi
  done < "$TMP_OLD"

  echo ""
  echo "Summary:"
  echo "  Added:   $ADDED packages"
  echo "  Removed: $REMOVED packages"
  echo "  Changed: $CHANGED packages"

  rm -f "$TMP_OLD" "$TMP_NEW"
else
  # 无对比模式，只输出当前 lockfile 的统计信息
  echo ""
  echo "Lockfile: $NEW_LOCK"
  echo "Size: $(wc -l < "$NEW_LOCK") lines"
  echo ""

  # 统计关键依赖的版本
  echo "Key dependencies:"
  for pkg in "hono" "@modelcontextprotocol/sdk" "solid-js" "@opentui/core" "ai" "drizzle-orm" "@effect/platform" "zod"; do
    VERSION=$(grep -oP "\"$pkg@[^\"]+\"" "$NEW_LOCK" | head -1 | sed 's/.*@//;s/"$//')
    if [ -n "$VERSION" ]; then
      printf "  %-40s %s\n" "$pkg" "$VERSION"
    fi
  done

  echo ""
  echo "To compare with a previous build:"
  echo "  $0 path/to/old/bun.lock [path/to/new/bun.lock]"
fi

echo ""
echo "============================================"
