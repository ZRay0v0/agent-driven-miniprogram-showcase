#!/usr/bin/env bash
# evidence-dossier.sh
#
# 一键生成 "Agent / AI 驱动工作流" 证据包。把分散在文件系统各处的可验证证据
# 汇总到 ./evidence/ 目录，每个文件都有清晰命名 + 顶部说明，方便用 Snipping
# Tool（Win+Shift+S）逐个截图，或用 pandoc 一键打成 PDF。
#
# 用法（在 MINGW64 / Git Bash）:
#   bash scripts/evidence-dossier.sh
#
# 可选参数:
#   --out DIR         输出目录（默认 ./evidence）
#   --src PATH        要扫描的主项目路径（默认 ../Software_Project，相对当前仓库）
#   --claude PATH     Claude Code 目录（默认 ~/.claude）

set -euo pipefail

# ── 默认参数 ─────────────────────────────────────────────────────────────
OUT_DIR="./evidence"
SRC_PROJECT="../Software_Project"   # 主项目仓库相对路径，按需 --src 覆盖
CLAUDE_DIR="${HOME}/.claude"

while [[ $# -gt 0 ]]; do
  case $1 in
    --out)    OUT_DIR="$2"; shift 2 ;;
    --src)    SRC_PROJECT="$2"; shift 2 ;;
    --claude) CLAUDE_DIR="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
done

NOW=$(date "+%Y-%m-%d %H:%M:%S")
HOSTNAME=$(hostname)

mkdir -p "$OUT_DIR"
# 转绝对路径，防止后续 pushd 让相对路径失效
OUT_DIR="$(cd "$OUT_DIR" && pwd)"

# ── 通用工具：写文件 header ───────────────────────────────────────────────
write_header() {
  local file="$1" title="$2" what_it_proves="$3"
  {
    echo "════════════════════════════════════════════════════════════════════"
    echo " $title"
    echo "════════════════════════════════════════════════════════════════════"
    echo " 生成时间: $NOW"
    echo " 主机:     $HOSTNAME"
    echo " 证明:     $what_it_proves"
    echo "════════════════════════════════════════════════════════════════════"
    echo ""
  } > "$file"
}

# ── 01. Plan 文件密度 — 证明 /plan 工作流使用频度 ──────────────────────────
F01="$OUT_DIR/01_plan_files.txt"
write_header "$F01" \
  "Claude Code Plan 文件清单（~/.claude/plans/）" \
  "用户高频使用 /plan 模式与长链规划工作流"

if [ -d "$CLAUDE_DIR/plans" ]; then
  total=$(ls -1 "$CLAUDE_DIR/plans" 2>/dev/null | wc -l)
  echo "总数: $total 个 plan 文件" >> "$F01"
  echo "" >> "$F01"
  echo "── 最近 30 个 plan（按时间倒序）──" >> "$F01"
  ls -lt "$CLAUDE_DIR/plans" 2>/dev/null | head -31 | tail -30 >> "$F01" || true
else
  echo "(未找到 $CLAUDE_DIR/plans 目录)" >> "$F01"
fi

# ── 02. 一份真实 Plan 文件内容样本 ─────────────────────────────────────────
F02="$OUT_DIR/02_plan_sample.md"
write_header "$F02" \
  "代表性 Plan 文件内容样本" \
  "Plan agent 真实输出的结构和深度（含 Context / 设计 / 验证段）"

if [ -d "$CLAUDE_DIR/plans" ]; then
  # 选最大的 plan（最完整的）
  sample=$(ls -S "$CLAUDE_DIR/plans"/*.md 2>/dev/null | head -1 || true)
  if [ -n "$sample" ]; then
    echo "文件: $sample" >> "$F02"
    echo "" >> "$F02"
    echo '```markdown' >> "$F02"
    head -120 "$sample" >> "$F02"
    echo '```' >> "$F02"
  fi
fi

# ── 03. 自动 Memory 内容 — 证明持续会话能力 ──────────────────────────────
F03="$OUT_DIR/03_auto_memory.txt"
write_header "$F03" \
  "Claude Code 自动记忆（MEMORY.md + 子条目）" \
  "用户与 Claude Code 建立了跨会话的长期上下文"

MEM_DIR=$(find "$CLAUDE_DIR/projects" -name MEMORY.md 2>/dev/null | head -1)
if [ -n "${MEM_DIR:-}" ]; then
  echo "MEMORY.md 路径: $MEM_DIR" >> "$F03"
  echo "" >> "$F03"
  cat "$MEM_DIR" >> "$F03"
  echo "" >> "$F03"
  echo "── 同目录下其他 memory 文件 ──" >> "$F03"
  ls -la "$(dirname "$MEM_DIR")" >> "$F03"
fi

# ── 04. 主项目 git 历史 — 证明 Agent 真实推动了 commit ─────────────────────
F04="$OUT_DIR/04_git_history.txt"
write_header "$F04" \
  "主项目 Git 提交历史（Software_Project / Campus_Trade）" \
  "Agent 真实驱动了产品级 commit，含 Co-Authored-By: Claude 标记"

if [ -d "$SRC_PROJECT/.git" ]; then
  pushd "$SRC_PROJECT" > /dev/null

  echo "仓库: $SRC_PROJECT" >> "$F04"
  echo "" >> "$F04"

  echo "── 所有分支 commit 总数 ──" >> "$F04"
  echo "Total: $(git log --all --oneline 2>/dev/null | wc -l)" >> "$F04"
  echo "" >> "$F04"

  echo "── 最近 30 条 commit ──" >> "$F04"
  git log --all --oneline 2>/dev/null | head -30 >> "$F04" || true
  echo "" >> "$F04"

  echo "── 含 Claude Co-Author 的 commit ──" >> "$F04"
  git log --all --grep="Claude" --oneline 2>/dev/null | head -30 >> "$F04" || true
  echo "" >> "$F04"

  echo "── 一条完整 commit message 样本（最新）──" >> "$F04"
  git log -1 --pretty=format:"%H%n%n%B" 2>/dev/null >> "$F04" || true

  popd > /dev/null
else
  echo "(未找到 $SRC_PROJECT/.git)" >> "$F04"
fi

# ── 05. CDP 自研脚本 — 证明 critique-fix 闭环的物理基础 ────────────────────
F05="$OUT_DIR/05_cdp_inventory.txt"
write_header "$F05" \
  "自研 cdp.py 脚本概览" \
  "critique-fix 闭环依赖的自研工具（不是 hello-world，是 220 行实工程）"

if [ -f "$SRC_PROJECT/scripts/cdp.py" ]; then
  echo "── 脚本统计 ──" >> "$F05"
  wc -l "$SRC_PROJECT/scripts/"cdp*.py "$SRC_PROJECT/scripts/"wxdev*.bat 2>/dev/null >> "$F05" || true
  echo "" >> "$F05"

  echo "── cdp.py 前 40 行（含使用说明）──" >> "$F05"
  head -40 "$SRC_PROJECT/scripts/cdp.py" >> "$F05"
fi

# ── 06. Mockup 资产 — 证明 Mockup-First 工作流的视觉真源 ───────────────────
F06="$OUT_DIR/06_mockup_inventory.txt"
write_header "$F06" \
  "Mockup PNG 资产清单（gpt-image-1 生成）" \
  "Mockup-First 工作流的输入资产，subagent 对照实现的视觉真源"

if [ -d "$SRC_PROJECT/doc/mockups/figure" ]; then
  cnt=$(ls -1 "$SRC_PROJECT/doc/mockups/figure" 2>/dev/null | wc -l)
  echo "总数: $cnt 张 mockup PNG" >> "$F06"
  echo "" >> "$F06"
  ls -la "$SRC_PROJECT/doc/mockups/figure" 2>/dev/null | head -40 >> "$F06" || true
fi

# ── 07. Index — 总入口 ─────────────────────────────────────────────────────
F00="$OUT_DIR/00_INDEX.md"
{
  echo "# Agent 工作流证据包"
  echo ""
  echo "> 生成时间: $NOW"
  echo "> 主机:     $HOSTNAME"
  echo "> 用户:     $(git config --global user.name 2>/dev/null || echo '?') · $(git config --global user.email 2>/dev/null || echo '?')"
  echo ""
  echo "本目录所有文件都是从用户真实开发环境提取的可验证证据。"
  echo ""
  echo "## 文件清单与证明力"
  echo ""
  echo "| # | 文件 | 证明 | 推荐截图 |"
  echo "|---|---|---|---|"
  echo "| 01 | [01_plan_files.txt](01_plan_files.txt) | /plan 长链规划工作流使用频度 | ✅ 截顶部 30 行 |"
  echo "| 02 | [02_plan_sample.md](02_plan_sample.md) | Plan agent 输出结构与深度 | ✅ 截 Context 段落 |"
  echo "| 03 | [03_auto_memory.txt](03_auto_memory.txt) | 跨会话长期上下文 | ⚪ 选择性截 |"
  echo "| 04 | [04_git_history.txt](04_git_history.txt) | Agent 真实驱动 commit | ✅ 必截 |"
  echo "| 05 | [05_cdp_inventory.txt](05_cdp_inventory.txt) | 自研 cdp.py 220 行 | ✅ 必截 |"
  echo "| 06 | [06_mockup_inventory.txt](06_mockup_inventory.txt) | Mockup-First 资产 | ⚪ 选择性截 |"
  echo ""
  echo "## 如何使用"
  echo ""
  echo "**方案 A · 单文件 PDF**（推荐）"
  echo '```bash'
  echo 'pandoc evidence/*.md evidence/*.txt -o agent-workflow-evidence.pdf'
  echo '```'
  echo ""
  echo "**方案 B · 截图法**"
  echo "1. 在 Windows Terminal 用大字号打开（设置 → 外观 → 字号 16+）"
  echo '2. `cat evidence/04_git_history.txt` 等命令逐个 `cat`'
  echo "3. 用 Win+Shift+S 截图保存"
  echo ""
  echo "**方案 C · 整目录提交**"
  echo "直接把 evidence/ 整个目录 zip 起来作为附件提交。"
} > "$F00"

# ── 终端摘要 ─────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo " 证据包已生成 → $(realpath "$OUT_DIR" 2>/dev/null || echo "$OUT_DIR")"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
ls -la "$OUT_DIR"
echo ""
echo "下一步:"
echo "  cat $OUT_DIR/00_INDEX.md     # 看索引和使用说明"
echo "  cat $OUT_DIR/04_git_history.txt   # 看最有说服力的一份"
echo ""
