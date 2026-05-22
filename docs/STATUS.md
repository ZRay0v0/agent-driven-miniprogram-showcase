# 项目进度交接 — Claude Code 交付清单与后续规划

> **交接对象**：任何接手本项目的 AI 助手（Codex CLI / Claude Code / 其他）或人类协作者
>
> **交接时点**：Phase 1 完成 + 真机 mock 登录通路打通
> **文档版本**：1.0
> **本仓库**：`github.com:ZRay0v0/agent-driven-miniprogram-showcase.git`
> **完整开发 plan**：`~/.claude/plans/abundant-doodling-parasol.md`（本机 Plan agent 输出归档目录）
> **前端实施 plan**：`doc/frontend_ui_plan.md`

---

## 1. 项目概况（30 秒读完）

- **题目**：软件工程课程设计 — 校园二手交易微信小程序
- **评分**：60% 功能实现 + 40% GB/T 8567-2006 四份设计报告
- **团队**：2 人（A 用 Codex CLI 写后端 / B 用 Claude Code 写前端 + 文档）
- **技术栈**：原生微信小程序 + Vant Weapp · Python FastAPI + SQLite · OpenAI gpt-image 出 mockup
- **工作流**：「**Mockup-First**」—— AI 出每页 UI 图 → Claude 看图实现 wxml/wxss

---

## 2. 已完成（commit 链）

### 2.1 V2 文档（之前的会话已交付）

```
6a3e05c  docs(V2): expand 4 design reports + render 20 diagrams
```

四份 docx 已入仓：`doc/01_需求分析报告.docx` / `02_概要设计报告.docx` / `03_详细设计报告.docx` / `04_数据设计报告.docx`。包含 V2 全部 19 个功能（校园币 / 议价 / 求购 / 担保 / 争议等）。

### 2.2 本轮（前端 Mockup-First 工作流）

```
403f932  feat(frontend): integrate Vant Weapp + register 10 V2 page skeletons
178c5d5  feat(design): add tokens.yaml + 28-page spec + ChatGPT mockup prompts
a50350d  docs: add frontend UI plan + backend onboarding kit + collaboration conventions
f5640f8  feat(assets): replace TabBar icons + add app logo set
449207e  feat(ui): Phase 1 — rebuild login/index/publish with Vant + tokens
5523bbc  fix(vant): remove unused van-step registration
838080f  fix(vant): remove van-badge + document component pitfalls
0e9e628  fix(encoding): strip UTF-8 BOM from 40 V2 page skeleton files
938fd86  fix(import): require explicit /index for services/api aggregator
748522e  feat(login): add dev-mode mock login fallback when backend offline
465b0c9  docs: add CLAUDE.md with repo guidance for future Claude Code sessions
44b7f76  feat(automation): add CDP-based UI verification tooling
7e12ecc  feat(ui): B2 — auth/password + user/profile + user/edit (Vant + tokens)
277c300  feat(ui): B3 — category/list + goods/detail + goods/manage (Vant + tokens)
```

**关键产物**：

| 文件/目录 | 用途 |
|---|---|
| `frontend/design/tokens.yaml` | 视觉规约单一来源（颜色 / 字号 / 间距 / 圆角 / Vant 主题映射） |
| `frontend/design/pages.yaml` | 28 页信息层级 + UX copy + ChatGPT prompt + Vant 组件白名单 + 误用提示 |
| `doc/mockups/prompts/ALL_PROMPTS.md` | 用户手动跑 mockup 的总卡片（已用完） |
| `doc/mockups/figure/01-28_*.png` | 28 张 mockup PNG（已生成） |
| `frontend/app.json` | 28 页路径 + 35 个 Vant 组件全局 usingComponents |
| `frontend/app.wxss` | CSS 变量定义 + Vant 主题色覆盖到校园绿 |
| `frontend/images/icons/*.png` | 10 张 TabBar icon（144×144 透明，AI 生成切分） |
| `frontend/images/logo/*.png` | 应用 LOGO 多尺寸（96/144/256/512）+ share_card |
| `frontend/miniprogram_npm/@vant/weapp/` | Vant 组件构建产物（由微信开发者工具「构建 npm」生成） |

---

## 3. Phase 1-3 验收（已通过）

### Phase 1（3 页）

| 页面 | 视觉评分 | 状态 |
|---|---|---|
| `pages/auth/login` | 8/10 | ✅ + 已加 mock login 降级 |
| `pages/index` | 8/10 | ✅ 真机渲染验证通过 |
| `pages/goods/publish` | 待真机验 | ✅ subagent 已修 3 个 API 命名 bug |

### Phase 2 B2（3 页，commit `7e12ecc`）

| 页面 | 视觉评分 | 关键 |
|---|---|---|
| `pages/auth/password` | 8.5/10 | 白卡 + 三 van-field + 眼睛切换 + 规则达标变绿 + 不匹配警告 + 吸底绿按钮 |
| `pages/user/profile` | 8.5/10 | 绿色 hero 渐变 + 渐变金币胶囊（TODO[B6] coin-balance 回填）+ 4 宫格 + iOS cell 列表 |
| `pages/user/edit` | 8.5/10 | inset 表单卡 + 头像 uploader + 双 picker + 简介计数 + 学院认证独立卡 + 吸底保存 |

### Phase 3 B3（3 页，commit `277c300`）

| 页面 | 视觉评分 | 关键 |
|---|---|---|
| `pages/category/list` | 8.5/10 | 左 tabs + 右 3 列 emoji 网格 + FALLBACK_TREE + 错误兜底条 + 重试入口 |
| `pages/goods/detail` | 8.5/10 | swiper + 1/N + 红价 hero + verify-badge fallback（TODO[B6] 行号已记） + 卖家卡 + 描述 + 规格 + 出价/收藏/关注/举报/立即购买 |
| `pages/goods/manage` | 8.5/10 | 4 tabs（带 count）+ skeleton + 空态 + 状态角标 + tab 维度差异化操作堆 + 长按 sheet + 下拉刷新 |

**跨 batch 一致性 gate（2026-05-15）**：

- ✅ 全工程 WXSS 写死 hex/px：**0 命中**
- ✅ 全工程禁用组件 van-step / van-badge：**0 命中**
- ✅ 全工程 `require("../services/api")` 隐式路径：**0 命中**

### Phase 1 真机验证记录（2026-05-14）

- ✅ 微信开发者工具编译过
- ✅ 首页正常渲染（搜索栏 / 分类 chips / 排序 tabs / 双列瀑布流 / TabBar）
- ✅ 后端未起时显示空态卡片 + 静态分类兜底（5 项分类 chips 仍可见）
- ✅ login 页能渲染，已加 mock login 降级（点登录 → modal 询问 → 测试账号）
- ⏳ publish 真机截图待补
- ⏳ B2/B3 共 6 页真机截图待补（CDP 自动截图链路有兼容问题，详见 `docs/automation.md`）

---

## 4. 已踩坑 + 已知陷阱（必读）

| # | 坑 | 修复 commit | 后续规避 |
|---|---|---|---|
| 1 | `van-step`（单数）不存在 | `5523bbc` | 用 `van-steps`，steps 数组属性驱动 |
| 2 | `van-badge` 不存在 | `838080f` | 角标用 `<van-icon info="3">` / `<van-tabbar-item info="5">` 属性 |
| 3 | PowerShell 5 写 UTF-8 默认带 BOM 导致小程序 JSON 解析失败 | `0e9e628` | 用 `.NET UTF8Encoding($false)` 或 `Out-File -Encoding utf8NoBOM` |
| 4 | 微信小程序 `require()` 不解析目录到 `index.js` | `938fd86` | 显式写 `require("../../services/api/index")` |
| 5 | 后端未启动时点登录卡住 | `748522e` | 已加 mock login modal 降级 |

`frontend/design/pages.yaml` 顶部「Vant 组件使用注意」段已记录前两条陷阱，后续 subagent 派发时会被读到。

---

## 5. 接下来的工作（按优先级）

### 5.1 Phase 2-7 — 实现剩余 25 页（**最大头**）

剩余页面按 batch 分组，每 batch 用 `superpowers:dispatching-parallel-agents` 派 3-4 个 subagent 并发：

| Batch | 页面 | mockup | 状态 |
|---|---|---|---|
| **B2 用户认证** | `auth/password` / `user/profile` / `user/edit` | 02 / 14 / 15 | ✅ 已完成（`7e12ecc`）|
| **B3 商品流程** | `category/list` / `goods/detail` / `goods/manage` | 04 / 05 / 07 | ✅ 已完成（`277c300`）|
| **B4 订单评价** | `order/list` / `order/create` / `order/detail` / `review/submit` | 08-11 | ⏳ 待派 |
| **B5 消息社交** | `message/list` / `message/chat` / `favorites/list` / `offer/list` | 12 / 13 / 24 / 23 | ⏳ 待派 |
| **B6 校园币/求购/争议** | `coins/wallet` / `wants/list` / `wants/detail` / `wants/publish` / `dispute/raise` / `dispute/detail` | 19 / 20-22 / 25-26 | ⏳ 待派（含 V2 三组件 coin-balance / offer-card / verify-badge 创建）|
| **B7 管理员后台** | `admin/dashboard` / `admin/users` / `admin/goods-audit` / `admin/disputes` / `admin/reports` | 16-18 / 27-28 | ⏳ 待派 |

每个 subagent 的 prompt 模板见 `doc/frontend_ui_plan.md` §3 Phase 2-7 Task 部分。**核心要点**：

```
启用 skill: frontend-design + web-design-guidelines + sleek-design-mobile-apps + wechat-miniprogram-skill
读入: doc/mockups/figure/<NN>_<page>_v1.png + frontend/design/tokens.yaml + pages.yaml 该页条目
产出: pages/<path>/<page>.{wxml,wxss,js,json}
约束: 必须用 Vant + 不写死 hex/px + 视觉对齐 mockup 评分 ≥ 7/10
```

**预估工时**：每 batch 6-10 分钟（含 verification），全部 6 个 batch 约 1 小时。

### 5.2 V2 新增组件骨架（Phase 5/6 之前要做）

V2 新页面会用到 3 个还没创建的自研组件：

| 组件 | 用途 | 用在哪页 |
|---|---|---|
| `components/coin-balance/` | 校园币胶囊（金色背景 + 余额数字） | `user/profile` / `coins/wallet` / `order/create` |
| `components/offer-card/` | 议价卡片 | `offer/list` |
| `components/verify-badge/` | 实物认证徽章 | `goods/detail` / `goods/publish` |

可以在 B5/B6 的 subagent 任务里顺手创建，或者单独派一个 batch B5.5。

### 5.3 后端启动 — 同事 A 的任务

后端 FastAPI 项目还是空的（`backend/` 目录未创建）。同事 A 应当读完后才能接手：

1. `doc/coordination/onboarding_backend.md` — 完整开工包
2. `doc/04_数据设计报告.docx` — 15 张表 DDL + 字段字典 + 校园币审计
3. `doc/02_概要设计报告.docx` §3 — 64 个 API 端点清单
4. `doc/03_详细设计报告.docx` §3.12-3.15 — 校园币 / 议价 / 争议 service 算法

W4 第一周建议任务（优先级 P0）：
- FastAPI 骨架（main.py + config.py + database.py）
- 按 04 数据设计建 15 张表的 ORM models
- 实现 `auth` + `users` router（前端 mock login 即可对接联调）
- `/openapi.json` 导出到 `doc/api/openapi.json`，前端据此校对

### 5.4 Phase 8 — 全局收尾

| 任务 | 用什么 skill |
|---|---|
| 一致性 pass（搜写死 hex/px，统一字号间距） | `engineering:tech-debt` + `design:design-critique` |
| 真机验真（iOS + Android 跑核心 8 路径） | `superpowers:systematic-debugging`（遇 bug 时） |
| 把 8-10 张 mockup 嵌入 03 详细设计报告 UI 章节 | `engineering:documentation` + `anthropic-skills:doc-coauthoring` |
| Code Review + 合并主干 | `superpowers:requesting-code-review` + `superpowers:finishing-a-development-branch` |

---

## 6. CLI 快速命令（继续工作时用）

```bash
# 进入仓库
cd "$REPO_ROOT"   # 例如：~/Code/Software_Project

# 查最近 commits
git log --oneline -10

# 查工作树状态
git status --short

# 看前端结构
ls frontend/pages/

# 编译/重启微信开发者工具：用工具内 Ctrl+B / Ctrl+R（CLI 无法调用）

# 重新构建 Vant npm（如果 miniprogram_npm 丢了）
cd frontend && npm i @vant/weapp -S
# 然后在微信开发者工具中：工具 → 构建 npm

# 全工程 BOM 扫描（脚本见提交历史）
# 全工程写死 hex / px 扫描
grep -rn "#[0-9a-fA-F]\{6\}" frontend/pages frontend/components | grep -v "var(--"
grep -rn ": [0-9]*px" frontend/pages frontend/components | grep -v "rpx"

# 推送
git push
```

---

## 7. 关键文件索引

| 类别 | 文件路径 |
|---|---|
| **设计规约** | `frontend/design/tokens.yaml` · `frontend/design/pages.yaml` |
| **mockup** | `doc/mockups/figure/01-28_*.png` |
| **prompt 卡片** | `doc/mockups/prompts/ALL_PROMPTS.md` |
| **实施 plan** | `doc/frontend_ui_plan.md`（Phase 0-8 全流程） |
| **后端开工包** | `doc/coordination/onboarding_backend.md` |
| **协作约定** | `README.md` 「协作约定」一节 |
| **GBT 8567 docx** | `doc/0[1-4]_*.docx` |
| **本文档** | `doc/STATUS.md` |
| **全局 plan** | `~/.claude/plans/abundant-doodling-parasol.md`（Plan agent 归档目录） |

---

## 8. 继续工作的入口提示

### 如果你是 CLI agent（Codex / Claude Code CLI）

1. **先读本文档**了解全貌
2. **再读** `doc/frontend_ui_plan.md` §3 看 Phase 2-7 的 subagent 派发模板
3. **再读** `frontend/design/pages.yaml` 顶部「Vant 组件使用注意」避坑
4. 按 §5.1 的 B2 → B7 顺序，每 batch 派 3-4 个并发 subagent
5. 每 batch 结束 commit（小步快走）
6. 全部完成后做 Phase 8 收尾

### 如果你是人类（用户自己）

下一步行动：
1. **截 publish 页面**：在微信开发者工具里 mock login → 点底部「发布」TabBar → 截图发给 AI 助手做 critique
2. **决策是否启动 Phase 2-7**：直接说「启动 Phase 2 B2」就会开始批量实现
3. **同步发开工包给后端同事 A**：把 `doc/coordination/onboarding_backend.md` 发给他，让他在 W4 开始后端

---

## 9. 风险与未解决项

| 风险 | 应对 |
|---|---|
| 后端没起，所有 API 都 fail | 已加 mock login，UI 大部分能预览。但订单创建 / 校园币流转等强后端依赖功能要等 A |
| `pbakaus/impeccable@polish` skill 仓库装不上 | Phase 8 一致性 pass 用 `engineering:tech-debt` + `design:design-critique` 替代 |
| 25 页并发派 subagent 偶发会超 context | 单 batch ≤ 4 页；超时 / 中断的页面用「补齐 X.js + X.json」单独重派（参照 publish 收尾的做法）|
| 真机适配（iPhone X 安全区 / Android 异常） | Phase 8 真机验真阶段处理 |

---

**交接完毕。下游 agent 接手时先 `git log` 看最近 commits，再读本文档，再读 plan，然后就能动手了。**
