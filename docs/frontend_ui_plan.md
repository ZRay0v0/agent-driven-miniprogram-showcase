# 前端 UI 实施 Plan（Mockup-First 工作流）

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将校园二手交易微信小程序 28 页全部从 mockup PNG 实现为可运行的 wxml/wxss/js/json，统一使用 Vant Weapp + 自家 design tokens。

**Architecture:** Mockup-First 工作流 —— ① 写 tokens.yaml + pages.yaml → ② 装 Vant + 配置主题 → ③ 用户在 ChatGPT 网页手动生成 mockup PNG → ④ Claude Code 按"一页一 subagent"模式看图写代码 → ⑤ 真机验真 + 一致性 pass → ⑥ mockup 嵌入 03 详细设计报告。

**Tech Stack:** 原生微信小程序（WXML/WXSS/JS/JSON） · Vant Weapp `@vant/weapp` · CSS 变量 design tokens · 微信开发者工具 · GitHub Issues for tracking。

---

## 页面清单（28 页）

V1 既有 18 页 + V2 新增 10 页：

| # | 路径 | 来源 | 类别 |
|---|---|---|---|
| 1 | `pages/auth/login` | V1 | 认证 |
| 2 | `pages/auth/password` | V1 | 认证 |
| 3 | `pages/index` | V1 | 首页 |
| 4 | `pages/category/list` | V1 | 分类 |
| 5 | `pages/goods/detail` | V1 | 商品 |
| 6 | `pages/goods/publish` | V1 | 商品 |
| 7 | `pages/goods/manage` | V1 | 商品 |
| 8 | `pages/order/list` | V1 | 订单 |
| 9 | `pages/order/create` | V1 | 订单 |
| 10 | `pages/order/detail` | V1 | 订单 |
| 11 | `pages/review/submit` | V1 | 评价 |
| 12 | `pages/message/list` | V1 | 消息 |
| 13 | `pages/message/chat` | V1 | 消息 |
| 14 | `pages/user/profile` | V1 | 用户 |
| 15 | `pages/user/edit` | V1 | 用户 |
| 16 | `pages/admin/dashboard` | V1 | 后台 |
| 17 | `pages/admin/users` | V1 | 后台 |
| 18 | `pages/admin/goods-audit` | V1 | 后台 |
| 19 | `pages/coins/wallet` | V2 🆕 | 校园币 |
| 20 | `pages/wants/list` | V2 🆕 | 求购 |
| 21 | `pages/wants/detail` | V2 🆕 | 求购 |
| 22 | `pages/wants/publish` | V2 🆕 | 求购 |
| 23 | `pages/offer/list` | V2 🆕 | 议价 |
| 24 | `pages/favorites/list` | V2 🆕 | 收藏 |
| 25 | `pages/dispute/raise` | V2 🆕 | 争议 |
| 26 | `pages/dispute/detail` | V2 🆕 | 争议 |
| 27 | `pages/admin/disputes` | V2 🆕 | 后台 |
| 28 | `pages/admin/reports` | V2 🆕 | 后台 |

---

## File Structure（待创建 / 修改）

### 新建

- `frontend/design/tokens.yaml` — 设计 token 单一来源
- `frontend/design/pages.yaml` — 28 页信息层级 + ChatGPT prompt
- `doc/mockups/prompts/*.md` — 28 张 prompt 卡片
- `doc/mockups/*.png` — 28-56 张用户手动生成的 mockup
- `doc/screenshots/*.png` — 真机截图
- V2 新增 10 个页面目录 + `wxml/wxss/js/json` 四件套
- `frontend/components/coin-balance/`、`offer-card/`、`verify-badge/` 三个新组件

### 修改

- `frontend/package.json` — 加 `@vant/weapp` 依赖
- `frontend/app.json` — `usingComponents` 全局注册 Vant 组件 + 加 V2 新页面路径
- `frontend/app.wxss` — 覆盖 Vant CSS 变量到 tokens.yaml
- `frontend/pages/**/*.{wxml,wxss,js,json}` — 全部 18 个 V1 页面重做

---

## Phase 0: 准备阶段（必须完成才能进入 Phase 1+）

### Task 0.1: 写 design tokens

**Files:**
- Create: `frontend/design/tokens.yaml`

**Steps:**

- [ ] **Step 1: 用 `Skill: design:design-system` 启动设计系统编写流程**

- [ ] **Step 2: 写 `frontend/design/tokens.yaml`，包含以下字段**

```yaml
brand:
  primary: "#1aad19"        # 校园绿
  primary_light: "#39c93c"
  primary_dark: "#0f7a0e"
  accent: "#ee0a24"          # 价格红
  warning: "#ff976a"
  info: "#1989fa"            # Vant 默认蓝

text:
  primary: "#1a1a1a"
  secondary: "#666666"
  tertiary: "#999999"
  disabled: "#c8c9cc"
  inverse: "#ffffff"

bg:
  page: "#f4f5f7"
  card: "#ffffff"
  mask: "rgba(0,0,0,0.5)"

border:
  light: "#ebedf0"
  default: "#dcdee0"

font_size:
  xs: "20rpx"
  sm: "24rpx"
  md: "28rpx"     # base
  lg: "32rpx"
  xl: "36rpx"
  xxl: "44rpx"
  title: "56rpx"

radius:
  sm: "8rpx"
  md: "16rpx"
  lg: "24rpx"
  pill: "999rpx"

spacing:
  xs: "4rpx"
  sm: "8rpx"
  md: "16rpx"
  lg: "24rpx"
  xl: "32rpx"
  xxl: "48rpx"

shadow:
  card: "0 4rpx 16rpx rgba(0,0,0,0.06)"
  modal: "0 8rpx 32rpx rgba(0,0,0,0.12)"

semantic:
  success: "#1aad19"
  warning: "#ff976a"
  danger: "#ee0a24"
  info: "#1989fa"
```

- [ ] **Step 3: 用 `Skill: superpowers:verification-before-completion` 检查所有 V1 已用的颜色（grep `--color-primary` 等）在 tokens 里都有对应**

- [ ] **Step 4: commit**

```bash
git add frontend/design/tokens.yaml
git commit -m "feat(design): add tokens.yaml as single source of truth"
```

---

### Task 0.2: 写 28 页信息层级清单

**Files:**
- Create: `frontend/design/pages.yaml`

**Steps:**

- [ ] **Step 1: 用 `Skill: design:ux-copy` 启动**

- [ ] **Step 2: 按下面模板为 28 页每页写一条 entry**

```yaml
- id: P03_index
  title: 首页 - 商品瀑布流
  vant_components: [van-search, van-tabs, van-card, van-tabbar]
  copy:
    nav_title: "校园二手"
    search_placeholder: "搜索想要的商品"
    sort_tabs: [综合, 最新, 价格]
    empty_state: "暂无商品"
  layout:
    top: 搜索栏 + 筛选 icon
    main: 横向分类 chips + 排序 tabs + 2 列瀑布流
    bottom: TabBar
  states: [loading, empty, error, normal]
  prompt: |
    （英文 prompt，描述页面像真实产品截图，禁用 illustration）
```

- [ ] **Step 3: 用 `Skill: superpowers:verification-before-completion` 检查页数 == 28**

```bash
python -c "import yaml; print(len(yaml.safe_load(open('frontend/design/pages.yaml', encoding='utf-8'))))"
```

Expected: `28`

- [ ] **Step 4: commit**

```bash
git add frontend/design/pages.yaml
git commit -m "feat(design): add 28-page info architecture + ChatGPT prompts"
```

---

### Task 0.3: 拆 28 张 prompt 卡片

**Files:**
- Create: `doc/mockups/prompts/01_login.md` ... `doc/mockups/prompts/28_admin_reports.md`

**Steps:**

- [ ] **Step 1: 用 `Skill: design:ux-copy` 启动**

- [ ] **Step 2: 写一个全局风格前缀（每张卡片头部复用）**

```markdown
# 全局风格前缀（每张卡片顶部复用）

A WeChat Mini Program **screenshot** of an iOS app called "校园二手"
(campus second-hand trading), shown inside an iPhone 15 Pro frame.

Design language: light theme, white card on #f4f5f7 page background.
Primary green #1aad19, accent red #ee0a24 for price.
Rounded corners 12-24px, soft shadows.
Chinese-style typography, system PingFang SC.

The image MUST look like a real production app screenshot,
NOT illustration, NOT mockup wireframe, NOT concept art.
Status bar: iOS 9:41, full signal, full battery.
```

- [ ] **Step 3: 为 28 页各生成一张 markdown 卡片**，每卡片结构：

```markdown
# P03 首页 - 商品瀑布流

## 中文说明
首页展示商品瀑布流，含搜索/分类/排序/TabBar。

## ChatGPT Prompt

[全局风格前缀]

[页面专属描述：layout / copy / 组件 / 配色]

Render at 1024 x 1536 (mobile portrait).

## 期望产物
doc/mockups/03_index_v1.png
```

- [ ] **Step 4: commit**

```bash
git add doc/mockups/prompts/
git commit -m "feat(mockups): add 28 ChatGPT prompt cards"
```

- [ ] **Step 5: 提示用户手动生图**

通知用户：「prompt 卡片已就绪。请打开 https://chat.openai.com，逐张复制 `doc/mockups/prompts/*.md` 里的 prompt 到 ChatGPT（GPT-4o / GPT-Image），生成 → 右键保存为 PNG → 改名按卡片底部"期望产物"路径放到 `doc/mockups/` 下。预计 1-1.5 小时跑完 28 页。」

---

### Task 0.4: 装 Vant Weapp + 改主题色

**Files:**
- Modify: `frontend/package.json`（如不存在则 `npm init -y`）
- Modify: `frontend/app.json`
- Modify: `frontend/app.wxss`

**Steps:**

- [ ] **Step 1: 用 `Skill: wechat-miniprogram-skill` 启动**

- [ ] **Step 2: 装 npm 包**

```bash
cd frontend
npm init -y  # 如无 package.json
npm i @vant/weapp -S --production
```

- [ ] **Step 3: 在微信开发者工具内"工具 → 构建 npm"**

预期：项目根出现 `miniprogram_npm/@vant/weapp/`。

- [ ] **Step 4: 改 `frontend/app.json` 加全局 usingComponents**

```json
{
  "usingComponents": {
    "van-button": "@vant/weapp/button/index",
    "van-cell": "@vant/weapp/cell/index",
    "van-cell-group": "@vant/weapp/cell-group/index",
    "van-search": "@vant/weapp/search/index",
    "van-tabs": "@vant/weapp/tabs/index",
    "van-tab": "@vant/weapp/tab/index",
    "van-card": "@vant/weapp/card/index",
    "van-tabbar": "@vant/weapp/tabbar/index",
    "van-tabbar-item": "@vant/weapp/tabbar-item/index",
    "van-tag": "@vant/weapp/tag/index",
    "van-icon": "@vant/weapp/icon/index",
    "van-field": "@vant/weapp/field/index",
    "van-uploader": "@vant/weapp/uploader/index",
    "van-rate": "@vant/weapp/rate/index",
    "van-empty": "@vant/weapp/empty/index",
    "van-toast": "@vant/weapp/toast/index",
    "van-dialog": "@vant/weapp/dialog/index",
    "van-submit-bar": "@vant/weapp/submit-bar/index",
    "van-goods-action": "@vant/weapp/goods-action/index",
    "van-goods-action-icon": "@vant/weapp/goods-action-icon/index",
    "van-goods-action-button": "@vant/weapp/goods-action-button/index"
  }
}
```

- [ ] **Step 5: 改 `frontend/app.wxss` 覆盖 Vant CSS 变量到 tokens**

```css
page {
  --main-bg-color: #f4f5f7;
  --button-primary-background-color: #1aad19;
  --button-primary-border-color: #1aad19;
  --tab-active-text-color: #1aad19;
  --tabbar-item-active-color: #1aad19;
  --search-background-color: #f4f5f7;
  --rate-icon-full-color: #1aad19;
  --tag-success-color: #1aad19;
  --field-input-text-color: #1a1a1a;

  --color-primary: #1aad19;
  --color-danger: #ee0a24;
  --color-text: #1a1a1a;
  --color-text-secondary: #666666;
  --color-bg: #f4f5f7;
  --color-card: #ffffff;

  --radius-sm: 8rpx;
  --radius-md: 16rpx;
  --radius-lg: 24rpx;

  --shadow-card: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
```

- [ ] **Step 6: 验收（用 `Skill: superpowers:verification-before-completion`）**

在 `pages/index/index.json` 临时加一行 `"van-button": "@vant/weapp/button/index"`，wxml 里写 `<van-button type="primary">测试</van-button>`，开发者工具能渲染出绿色按钮。

- [ ] **Step 7: commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/app.json frontend/app.wxss
git commit -m "feat(frontend): integrate Vant Weapp + map CSS vars to design tokens"
```

---

## Phase 1: 关键路径三件套（最先打通流程）

> 选 login / index / publish 作为流程验证页面，三页打通后再批量并发后续 25 页。

### Task 1.1: pages/auth/login 登录页（重做）

**Prereq:** 用户已经把 `doc/mockups/01_login_v1.png` 放到位置。

**Files:**
- Modify: `frontend/pages/auth/login/login.wxml`
- Modify: `frontend/pages/auth/login/login.wxss`
- Modify: `frontend/pages/auth/login/login.js`
- Modify: `frontend/pages/auth/login/login.json`

**Acceptance:**
- 使用 `van-button` 替代自研 button
- 视觉对齐 `doc/mockups/01_login_v1.png` （`design:design-critique` 评分 ≥ 7/10）
- 无写死 hex / px（用 var(--xxx)）
- 真机 iOS + Android 能正常微信登录跳首页

**Steps:**

- [ ] **Step 1: 启用 skill 套件**：`Skill: anthropics-skills:frontend-design` + `Skill: web-design-guidelines` + `Skill: sleek-design-mobile-apps` + `Skill: wechat-miniprogram-skill`

- [ ] **Step 2: 读取上下文**

```
Read: doc/mockups/01_login_v1.png
Read: frontend/design/tokens.yaml
Read: frontend/design/pages.yaml （定位 P01_login 条目）
Read: frontend/pages/auth/login/login.js （保留登录逻辑）
```

- [ ] **Step 3: 重写 wxml**（基于 Vant + 新 token）

- [ ] **Step 4: 重写 wxss**（全部用 `var(--xxx)`）

- [ ] **Step 5: 改 login.json 加 `usingComponents`**（只列本页用到的）

- [ ] **Step 6: 微信开发者工具编译，截屏存 `doc/screenshots/01_login.png`**

- [ ] **Step 7: 用 `Skill: design:design-critique` 把 mockup 和 screenshot 并排打分**

如果 < 7/10 → 回 Step 3 调整。

- [ ] **Step 8: 用 `Skill: design:accessibility-review` 检查色对比度 + 触控热区**

- [ ] **Step 9: commit**

```bash
git add frontend/pages/auth/login/ doc/screenshots/01_login.png
git commit -m "feat(ui): rebuild login page with Vant + new design tokens"
```

---

### Task 1.2: pages/index 首页（重做）

**Prereq:** `doc/mockups/03_index_v1.png` 已就绪。

**Files:**
- Modify: `frontend/pages/index/index.{wxml,wxss,js,json}`

**Acceptance:**
- 用 `van-search` + `van-tabs` + 自研 `goods-card` 组件
- 2 列瀑布流，TabBar 选中态绿色
- 视觉对齐 mockup 评分 ≥ 7/10

**Steps:**

- [ ] **Step 1**: 启用 skill 套件（同 Task 1.1 Step 1）

- [ ] **Step 2**: Read mockup + tokens + pages.yaml(P03_index) + 现有 index.js 逻辑

- [ ] **Step 3**: 重写 wxml（顶部 van-search + 横向分类 scroll-view + van-tabs 排序 + 双列瀑布流）

- [ ] **Step 4**: 重写 wxss（用 token CSS 变量；瀑布流用 `column-count: 2`）

- [ ] **Step 5**: 更新 components/goods-card 以兼容新视觉

- [ ] **Step 6**: 改 json `usingComponents`

- [ ] **Step 7**: 开发者工具截图存 `doc/screenshots/03_index.png`

- [ ] **Step 8**: `design:design-critique` 评分

- [ ] **Step 9**: commit

```bash
git add frontend/pages/index/ frontend/components/goods-card/ doc/screenshots/03_index.png
git commit -m "feat(ui): rebuild index page with Vant search/tabs + waterfall layout"
```

---

### Task 1.3: pages/goods/publish 发布页（重做）

**Prereq:** `doc/mockups/06_goods_publish_v1.png` 已就绪。

**Files:**
- Modify: `frontend/pages/goods/publish/publish.{wxml,wxss,js,json}`

**Acceptance:**
- 用 `van-cell-group` + `van-field` + `van-uploader`
- 顶部 9 宫格图片上传
- 底部固定栏「保存草稿 / AI 标题 / AI 描述 / 立即发布」
- 视觉对齐 mockup 评分 ≥ 7/10

**Steps:**

- [ ] **Step 1**: 启用 skill 套件

- [ ] **Step 2**: Read mockup + tokens + pages.yaml(P06_goods_publish) + 现有 publish.js

- [ ] **Step 3**: 重写 wxml（van-uploader 顶部、van-field 多行表单、底部 van-goods-action）

- [ ] **Step 4**: 重写 wxss

- [ ] **Step 5**: 改 json `usingComponents`

- [ ] **Step 6**: 验证 9 图上传 + AI 增强按钮联调点击不报错

- [ ] **Step 7**: 截图存 `doc/screenshots/06_goods_publish.png`

- [ ] **Step 8**: `design:design-critique` + `design:accessibility-review`

- [ ] **Step 9**: commit

```bash
git add frontend/pages/goods/publish/ doc/screenshots/06_goods_publish.png
git commit -m "feat(ui): rebuild publish page with Vant uploader/field/goods-action"
```

---

## Phase 1 Checkpoint

完成 Task 1.1 - 1.3 后，做一次集中评审：

- [ ] **用 `Skill: superpowers:requesting-code-review`** 跨三页扫一遍
- [ ] **三页视觉一致性**：把 3 张 screenshot 并排，颜色 / 字号 / 圆角应当一致
- [ ] **token 命中率**：grep `frontend/pages/auth/login frontend/pages/index frontend/pages/goods/publish` 查找写死的 `#xxx` 或 `\dpx` —— 应当 ≤ 3 处
- [ ] **决定 Phase 2-7 是否走并发**：流程顺畅 → 用 `superpowers:dispatching-parallel-agents` 一次派 3-4 页

---

## Phase 2-7: 批量实现 25 页（subagent 派发）

> 从这里开始，每页一个 subagent dispatch，模板如下：

### 通用 subagent dispatch 模板

```
Skill: superpowers:subagent-driven-development

每页 dispatch 一个 Explore + Plan + 实现三阶段 subagent：

Agent prompt:
"""
你是一个微信小程序前端开发 subagent。任务：实现 `pages/<PATH>/` 这一页。

输入：
- mockup PNG: doc/mockups/<NN>_<PAGE>_v1.png  ← 你必须先 Read 这张图
- design tokens: frontend/design/tokens.yaml
- 页面规约: frontend/design/pages.yaml 中的 P<NN>_<PAGE> 条目
- 现有逻辑: frontend/pages/<PATH>/*.js（保留事件处理与数据获取逻辑）
- 已注册的 Vant 组件: frontend/app.json 的 usingComponents

启用 skill:
- frontend-design
- web-design-guidelines
- sleek-design-mobile-apps
- wechat-miniprogram-skill

输出：
- 重写/补全 frontend/pages/<PATH>/<PAGE>.{wxml,wxss,js,json}
- 保存截图 doc/screenshots/<NN>_<PAGE>.png

验收：
- 用 design:design-critique 把 mockup 和 screenshot 并排打分 ≥ 7/10
- 用 design:accessibility-review 跑一遍
- 不允许写死 hex/px，必须用 var(--xxx)
- 最后跑 superpowers:verification-before-completion

完成后回报：实现总结 + 评分 + 已知问题。
"""
```

### Task 2.x - 7.x: 25 个剩余页面

按 Phase 分组，每 Phase 一次 dispatch 3-4 页并发。每个 Task 都用上面模板，仅替换 `<NN>` / `<PAGE>` / `<PATH>`。

#### Phase 2 - 用户与认证（3 页）
- Task 2.1: `auth/password` → mockup `02_auth_password_v1.png`
- Task 2.2: `user/profile` → mockup `14_user_profile_v1.png`（**含校园币余额胶囊**：用新组件 `coin-balance`）
- Task 2.3: `user/edit` → mockup `15_user_edit_v1.png`

#### Phase 3 - 商品流程（3 页 + 1 个已在 Phase 1 完成）
- Task 3.1: `category/list` → mockup `04_category_list_v1.png`
- Task 3.2: `goods/detail` → mockup `05_goods_detail_v1.png`（**含 [出价]/[收藏]/[关注卖家]/[举报]/[实物认证徽章]**：用新组件 `verify-badge`）
- Task 3.3: `goods/manage` → mockup `07_goods_manage_v1.png`

#### Phase 4 - 订单与评价（4 页）
- Task 4.1: `order/list` → mockup `08_order_list_v1.png`
- Task 4.2: `order/create` → mockup `09_order_create_v1.png`（**含余额扣款预览**）
- Task 4.3: `order/detail` → mockup `10_order_detail_v1.png`（**含 [发起争议] 入口**）
- Task 4.4: `review/submit` → mockup `11_review_submit_v1.png`

#### Phase 5 - 消息与社交（4 页）
- Task 5.1: `message/list` → mockup `12_message_list_v1.png`
- Task 5.2: `message/chat` → mockup `13_message_chat_v1.png`（**含违禁词前端拦截**）
- Task 5.3: `favorites/list` → mockup `24_favorites_list_v1.png` 🆕
- Task 5.4: `offer/list` → mockup `23_offer_list_v1.png` 🆕（**用新组件 `offer-card`**）

#### Phase 6 - 校园币 + 求购 + 争议（V2 重点，6 页）
- Task 6.1: `coins/wallet` → mockup `19_coins_wallet_v1.png` 🆕
- Task 6.2: `wants/list` → mockup `20_wants_list_v1.png` 🆕
- Task 6.3: `wants/detail` → mockup `21_wants_detail_v1.png` 🆕
- Task 6.4: `wants/publish` → mockup `22_wants_publish_v1.png` 🆕
- Task 6.5: `dispute/raise` → mockup `25_dispute_raise_v1.png` 🆕
- Task 6.6: `dispute/detail` → mockup `26_dispute_detail_v1.png` 🆕

#### Phase 7 - 管理员后台（5 页）
- Task 7.1: `admin/dashboard` → mockup `16_admin_dashboard_v1.png`（**含校园币流通量、争议处理量等指标**）
- Task 7.2: `admin/users` → mockup `17_admin_users_v1.png`
- Task 7.3: `admin/goods-audit` → mockup `18_admin_goods_audit_v1.png`
- Task 7.4: `admin/disputes` → mockup `27_admin_disputes_v1.png` 🆕
- Task 7.5: `admin/reports` → mockup `28_admin_reports_v1.png` 🆕

**每 Phase 结束做一次 checkpoint**：

- [ ] `Skill: superpowers:requesting-code-review` 跨该 Phase 全页扫一遍
- [ ] `Skill: pbakaus/impeccable@polish` 一致性 pass
- [ ] commit + push

---

## Phase 8: 全局收尾

### Task 8.1: 一致性 pass

**Files:**
- Read: `frontend/pages/**/*.wxss`

**Steps:**

- [ ] **Step 1: `Skill: engineering:tech-debt`** 扫全工程

```bash
# 找写死的 hex
grep -rn "#[0-9a-fA-F]\{3,6\}" frontend/pages/ frontend/components/ | grep -v "var(--" | grep -v "//"
```

Expected: 写死 hex ≤ 10 处。

- [ ] **Step 2: `Skill: pbakaus/impeccable@polish`** 跨页面对齐字号 / 间距 / 圆角

- [ ] **Step 3: commit**

```bash
git add -u
git commit -m "chore(ui): consistency pass — normalize hardcoded values"
```

---

### Task 8.2: 真机验真（iOS + Android）

**Steps:**

- [ ] **Step 1**: 微信开发者工具 → 预览 → 真机扫码

- [ ] **Step 2**: 跑 8 个核心路径
  - 登录 → 首页 → 详情 → 下单 → 钱包 → 评价 → 消息 → 我的

- [ ] **Step 3**: 每路径 iOS + Android 各跑一次，截图入 `doc/screenshots/devices/`

- [ ] **Step 4**: 发现样式错乱 → `Skill: superpowers:systematic-debugging`

---

### Task 8.3: 把 mockup 嵌入 03 详细设计报告

**Files:**
- Modify: `doc/src/03_detailed_design.md`

**Steps:**

- [ ] **Step 1: `Skill: anthropic-skills:doc-coauthoring` + `Skill: engineering:documentation`**

- [ ] **Step 2**: 在 03 报告新增 `§4 用户界面设计` 章节，按"前台 / 后台 / V2 新增"分组嵌 8-10 张 mockup

- [ ] **Step 3**: 跑 `python doc/templates/render_diagrams.py`（如果有图源更新）

- [ ] **Step 4**: 用 pandoc 重新生成 `03_详细设计报告.docx`，跑 `fix_code_font.py`

- [ ] **Step 5**: commit

```bash
git add doc/src/03_detailed_design.md doc/03_详细设计报告.docx doc/mockups/
git commit -m "docs(03): add UI design chapter with 8 mockup screenshots"
```

---

### Task 8.4: 合并到 main + 收尾

**Steps:**

- [ ] **Step 1: `Skill: superpowers:requesting-code-review`** 一次大评审

- [ ] **Step 2: `Skill: superpowers:finishing-a-development-branch`**

- [ ] **Step 3**: 开 PR `feat/frontend-ui-mockup-first` → main

- [ ] **Step 4**: 用户审核 + merge

- [ ] **Step 5**: 跑全部 28 页一次最终 smoke test

---

## 全局验证

- [ ] Vant 组件覆盖率 ≥ 80%：`grep -rn "@vant/weapp" frontend/pages/**/*.json | wc -l` ≥ `22`
- [ ] mockup 入 03 报告 ≥ 8 张
- [ ] 写死 hex/px 全工程 ≤ 10 处
- [ ] 真机 iOS + Android 核心 8 路径全部走通
- [ ] doc/screenshots/ 含 28 张真机截图
- [ ] PR 通过 review，合入 main

---

## 工时

| Phase | 工时 |
|---|---|
| Phase 0（4 task） | 1.5 天 |
| Phase 1（3 task + checkpoint） | 1.5 天 |
| Phase 2-7（25 task，并发派发） | 12-15 天 |
| Phase 8（收尾） | 2-3 天 |
| **合计** | **~20 人天** |

---

## Self-Review 记录

- ✅ Spec coverage: Plan §16 7 步全部映射到 Phase 0-8
- ✅ Placeholder scan: 28 页全部具名引用 mockup 路径与页面路径
- ✅ Type consistency: Vant 组件名、tokens.yaml 字段名、CSS 变量名在所有 task 中保持一致
- ✅ Skill mapping: 每个 task 都标注了启用 skill
