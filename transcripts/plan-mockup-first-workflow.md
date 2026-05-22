# 校园二手交易微信小程序 — 前端 UI Mockup-First 工作流（Skill-Driven 版）

## Context（背景与动机）

**项目**：软件工程课程设计，校园二手交易微信小程序。考核 60% 功能 + 40% 四份 GB/T 8567 报告。两人分工：A 用 Codex CLI 写 FastAPI 后端，B 用 Claude Code 写原生微信小程序前端 + 文档。仓库 `github.com:ZRay0v0/agent-driven-miniprogram-showcase.git`。

**已完成**：
- 四份 V2 设计报告（01 需求 / 02 概要 / 03 详细 / 04 数据）已 commit & push（commit `6a3e05c`），含 15 张图、84 张表
- 前端骨架：18 页脚手架 + 5 组件 + 11 API 模块 + 4 utils
- 已实现样式的页面：`index / login / publish / detail / create`（5 页，纯自研 CSS 变量风格，未引入第三方 UI 库）
- 未实现样式：剩余 13 页 + V2 新增 7 页（`coins/wallet`、`wants/*`、`offer/list`、`favorites/list`、`dispute/*`、`admin/disputes`、`admin/reports`）

**核心痛点**：~25 页待出视觉。凭文字想象写 wxml/wxss 容易"能跑但难看"，60% 实现分的第一印象拿不到。

**解决方案**：「**AI 生成 UI mockup → Claude Code 看图实现 wxml/wxss**」工作流，叠加 **Skill-Driven 执行范式** —— 每一步开工前先 `Skill` 工具调起对应 skill，由 skill 内容约束动作；并发场景强制走 `superpowers:dispatching-parallel-agents`；任何"完成"声明前强制走 `superpowers:verification-before-completion`。

**预期红利**：
1. 视觉一致性（同批 prompt 出图，风格统一）
2. mockup PNG 同步嵌入 03 详细设计报告 UI 章节，**文档分一并加固**
3. Claude Code 看图实现比凭文字写代码质量高一截
4. Skills 把工作流约束化，避免"差不多得了"

---

## 1. 关键决策

| 决策项 | 选择 | 理由 |
|---|---|---|
| UI 组件库地基 | **Vant Weapp** | 18.4k stars，`submit-bar / goods-action / sku / coupon / rate` 覆盖二手交易场景，电商语义最强 |
| AI 图像生成 | **OpenAI gpt-image-1** | 用户可访问；$0.04/张 × ~50 张 ≈ $2；移动竖屏 1024×1536 标准支持 |
| 已实现 5 页 | **全部重做** | 与新页面共用 Vant + 新 token，保证一致性 |
| Mockup 数量 | 25 页 × 双稿 ≈ **50 张** | 单稿不满意时迭代 |
| 执行范式 | **Skill-Driven** | 每步先 Skill 工具调起对应 skill；并发走 `dispatching-parallel-agents`；完成前走 `verification-before-completion`；卡壳/想偷懒走 `pua` |

**已排除选项**（调研后剔除）：v0.dev / Locofy / Builder.io / abi/screenshot-to-code / Galileo AI —— 全部只输出 React/Tailwind，不支持 wxml，多绕一道反而更慢。

---

## 2. Skill 栈

### 2.1 设计/视觉层（需新装 4 个）

```bash
npx skills add anthropics/skills@frontend-design -g -y               # 401K, Anthropic 官方前端规范
npx skills add vercel-labs/agent-skills@web-design-guidelines -g -y  # 313K, Vercel 设计准则
npx skills add sleekdotdesign/agent-skills@sleek-design-mobile-apps -g -y  # 移动端优先
npx skills add pbakaus/impeccable@polish -g -y                       # 收尾打磨指令集
```

### 2.2 流程/方法论层（已在 session 可用，本工作流强制使用）

| Skill | 触发时机 |
|---|---|
| `superpowers:using-superpowers` | 每个 session 开场（自动加载） |
| `superpowers:brainstorming` | Step 1-2 前：确认风格关键词 / 信息层级覆盖度 |
| `superpowers:writing-plans` | Step 0：把本 plan 作为 spec，输出更细的执行 plan |
| `superpowers:dispatching-parallel-agents` | Step 4 批量出图、Step 5 多页并行实现 |
| `superpowers:subagent-driven-development` | Step 5：把"实现一页"作为 subagent 任务派发 |
| `superpowers:executing-plans` | Step 5 后期：按 plan 检查项推进 |
| `superpowers:verification-before-completion` | 每个"完成"声明前必跑 |
| `superpowers:requesting-code-review` | 每完成 5 页提交一次代码评审 |
| `superpowers:test-driven-development` | `gen_mockups.py` 脚本先写测试 |
| `superpowers:systematic-debugging` | 真机出现样式 bug 时 |
| `superpowers:finishing-a-development-branch` | UI 阶段收尾、合并主分支前 |
| `design:design-system` | Step 1：写 tokens.yaml |
| `design:ux-copy` | Step 2：每页 placeholder / 按钮 / 空态文案 |
| `design:design-critique` | Step 6：mockup vs 真机对比 + 评分 |
| `design:accessibility-review` | Step 7：色对比度 / 触控热区 / 字号扫描 |
| `design:design-handoff` | Step 7：mockup 嵌入 03 报告时生成 handoff 文档 |
| `design:research-synthesis` | Step 1 前：把任务书 + 闲鱼/转转截图调研归纳成视觉风格关键词 |
| `engineering:code-review` | 每页代码合入前 |
| `engineering:debug` | Vant 组件踩坑 |
| `engineering:documentation` | Step 7：把 mockup 章节合入 03 文档 |
| `engineering:tech-debt` | 每 10 页扫一次写死的 px / hex / 重复 wxss |
| `wechat-miniprogram-skill` | Step 3 + 全 Step 5 常驻 |
| `claude-code-guide` | 遇到 hooks / skill 安装疑问 |
| `anthropic-skills:pua` | 想偷懒、"差不多得了"、连续 2 次以上交付不达标时主动启用 |
| `anthropic-skills:doc-coauthoring` | Step 7：写 03 报告 UI 章节 |
| `anthropic-skills:canvas-design` | logo / 启动图等静态资产 |
| `update-config` | 把"每写完一页就跑 verification"配成 hook |
| `fewer-permission-prompts` | 工作流跑顺后给高频只读命令加白名单 |

---

## 3. 标准工作流（7 步，每步显式映射 skill）

```
╔═══════════════════════════════════════════════════════════════════╗
║ Step 0  写实施 plan                                                ║
║   skills: superpowers:writing-plans                               ║
║   产出:  doc/frontend_ui_plan.md（25 页 × 完成判据 × 责任分组）    ║
╚═══════════════════════════════════════════════════════════════════╝
                              │
╔═══════════════════════════════════════════════════════════════════╗
║ Step 1  视觉规约 tokens.yaml                                       ║
║   skills: design:design-system + superpowers:brainstorming        ║
║           + design:research-synthesis（先看闲鱼/转转参考）          ║
║   产出:  frontend/design/tokens.yaml                              ║
║          - 主色 #1aad19 校园绿 + Vant 默认 #1989fa 备选            ║
║          - 字号 24/18/14/12，圆角 8/16/24 rpx                     ║
║          - 间距 4/8/12/16/24，阴影 3 档，语义色 5 档                ║
║   验收:  verification-before-completion                           ║
║          （所有页面要用的组件都有对应变量）                          ║
╚═══════════════════════════════════════════════════════════════════╝
                              │
╔═══════════════════════════════════════════════════════════════════╗
║ Step 2  页面信息层级清单 pages.yaml                                 ║
║   skills: design:ux-copy + superpowers:brainstorming              ║
║   产出:  frontend/design/pages.yaml                               ║
║          25 页，每页字段：id / 页名 / 顶部 / 主区 / CTA / 空态     ║
║          / 错误态 / 关键文案 / 用到的 Vant 组件 /                  ║
║          100-200 字英文 prompt 块（gpt-image-1 用）                ║
║   验收:  verification-before-completion                           ║
║          （pages.yaml 页数 = frontend/pages/ 目录数 = 25）         ║
╚═══════════════════════════════════════════════════════════════════╝
                              │
╔═══════════════════════════════════════════════════════════════════╗
║ Step 3  装 Vant Weapp + 配置主题色                                  ║
║   skills: wechat-miniprogram-skill + engineering:debug            ║
║   动作:                                                            ║
║     cd frontend && npm i @vant/weapp -S                           ║
║     开发者工具：构建 npm + 勾选 ES6 转 ES5                          ║
║     app.json 添加全局 usingComponents                              ║
║     app.wxss 覆盖 Vant CSS 变量到 tokens.yaml                      ║
║   验收:  verification-before-completion                           ║
║          （`van-button` / `van-cell` 等组件能在空白页渲染）         ║
╚═══════════════════════════════════════════════════════════════════╝
                              │
╔═══════════════════════════════════════════════════════════════════╗
║ Step 4  手动出 mockup（用户在 ChatGPT 官网执行）                    ║
║   skills: design:ux-copy（精修 prompt 文案）                      ║
║   动作（Claude 这边）:                                              ║
║     1) 把 pages.yaml 的 25 个 prompt 拆成单独 markdown 卡片        ║
║        输出到 doc/mockups/prompts/<页码>_<页名>.md                ║
║        每张卡片含：英文 prompt 全文 + 一行中文说明 + 期望产物       ║
║     2) 给一个"全局风格前缀段"在每张卡片顶部复用，保证风格一致        ║
║   动作（用户这边，手动）:                                            ║
║     3) 打开 https://chat.openai.com → GPT-4o / GPT-Image          ║
║     4) 每张卡片复制粘贴 prompt → 生成 → 不满意微调"重画"            ║
║     5) 右键保存 PNG → 改名 doc/mockups/<页码>_<页名>_v<版本>.png   ║
║     6) 一晚约 1-1.5 小时跑完 25 页                                  ║
║   产出:  doc/mockups/*.png ≈ 25-50 张                              ║
║   验收:  verification-before-completion                           ║
║          （25 页每页至少 1 张满意稿；抽 3 张人工评分 ≥ 7/10）       ║
╚═══════════════════════════════════════════════════════════════════╝
                              │
╔═══════════════════════════════════════════════════════════════════╗
║ Step 5  Claude Code 看图实现（最重的一步）                           ║
║   skills 同时启用:                                                  ║
║     • anthropics/skills@frontend-design                           ║
║     • vercel-labs/agent-skills@web-design-guidelines              ║
║     • sleekdotdesign/agent-skills@sleek-design-mobile-apps        ║
║     • wechat-miniprogram-skill                                    ║
║     • superpowers:subagent-driven-development                     ║
║     • superpowers:dispatching-parallel-agents（一次 3-4 页）       ║
║     • superpowers:executing-plans                                 ║
║   动作:                                                            ║
║     • 每页一次 subagent dispatch，输入 = mockup PNG +              ║
║       tokens.yaml + pages.yaml 该页字段 + Vant 组件清单            ║
║     • 产出 pages/<page>/<page>.{wxml,wxss,js,json}                ║
║     • 主会话只派发 + 验收，避免 context 爆                          ║
║   每页验收: verification-before-completion + engineering:code-review║
║            + design:design-critique（mockup vs 实现截图）          ║
║   触发 PUA: 连续 2 页不达标 / 想"差不多"提交时主动启用              ║
╚═══════════════════════════════════════════════════════════════════╝
                              │
╔═══════════════════════════════════════════════════════════════════╗
║ Step 6  真机/模拟器验真                                             ║
║   skills: design:design-critique + design:accessibility-review    ║
║           + superpowers:systematic-debugging                      ║
║   动作:                                                            ║
║     • 微信开发者工具截图每页，与 mockup 并排                         ║
║     • iOS + Android 各跑一次                                       ║
║     • 差异 ≥ 2 处 → 回 Step 5 微调                                 ║
║   验收: verification-before-completion                            ║
║         （每页 doc/screenshots/ 都有真机截图）                     ║
╚═══════════════════════════════════════════════════════════════════╝
                              │
╔═══════════════════════════════════════════════════════════════════╗
║ Step 7  一致性 pass + 文档同步 + 收尾                                ║
║   skills:                                                          ║
║     • pbakaus/impeccable@polish（polish / distill / quieter）     ║
║     • engineering:tech-debt（搜写死 px / hex / 重复 wxss）          ║
║     • design:design-handoff                                       ║
║     • anthropic-skills:doc-coauthoring（嵌入 03 报告 UI 章节）     ║
║     • engineering:documentation                                   ║
║     • superpowers:finishing-a-development-branch                  ║
║     • superpowers:requesting-code-review                          ║
║   产出:                                                            ║
║     • frontend/ 整体一致性达标                                      ║
║     • 8-10 张 mockup 嵌入 doc/src/03_detailed_design.md UI 章节    ║
║     • 真机截图嵌入演示材料                                          ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 4. Prompt 模板（gpt-image-1）

**核心要点**：把页面当作「**已上线的真实产品**」描述，给具体文案 + 层级 + 组件名；禁用 "concept art / illustration / mockup"。

```yaml
# pages.yaml 片段
- id: P01_index
  title: 首页 - 商品瀑布流
  vant_components: [van-search, van-tabs, van-card, van-tabbar]
  copy:
    search_placeholder: "搜索想要的商品"
    sort_tabs: [综合, 最新, 价格]
  prompt: |
    A WeChat Mini Program homepage screenshot of a campus second-hand
    trading app called "校园二手".

    Top: search bar with placeholder "搜索想要的商品", filter icon on right.
    Below: 4 horizontal scrolling category chips (数码/图书/服饰/生活).
    Sort tabs: 综合 | 最新 | 价格 (active on 综合, green underline #1aad19).
    Main: 2-column waterfall product grid, 6 visible cards.
    Each card: square product image on top, title 2 lines max,
    price "¥30" red bold, seller avatar + "西区 3 栋" at bottom.
    Bottom tab bar: 首页(active green) | 分类 | 发布(center floating)
                    | 消息 | 我的.
    Status bar: iOS 9:41, signal, battery.
    Light theme, white bg, green accent #1aad19, rounded 12px.
    Place inside iPhone 15 Pro frame.
    Photorealistic UI screenshot, not illustration.
```

---

## 5. SkillStep 速查表（执行时贴在编辑器边上）

| Step | 必启 skill | 辅助 skill |
|---|---|---|
| 0 准备 | `superpowers:writing-plans` | `superpowers:brainstorming` |
| 1 token | `design:design-system` | `superpowers:brainstorming` / `design:research-synthesis` |
| 2 page spec | `design:ux-copy` | `superpowers:brainstorming` |
| 3 装 Vant | `wechat-miniprogram-skill` | `engineering:debug` |
| 4 出图（手动） | `design:ux-copy`（精修每页 prompt） | — |
| 5 看图实现 | `superpowers:subagent-driven-development` + 设计三连（frontend-design / web-design-guidelines / sleek-design-mobile-apps） + `wechat-miniprogram-skill` | `anthropic-skills:pua` / `engineering:code-review` |
| 6 真机验真 | `design:design-critique` + `design:accessibility-review` | `superpowers:systematic-debugging` |
| 7 收尾 | `pbakaus/impeccable@polish` + `superpowers:finishing-a-development-branch` + `superpowers:requesting-code-review` | `engineering:tech-debt` / `design:design-handoff` / `anthropic-skills:doc-coauthoring` |
| 全局 | `superpowers:using-superpowers` 开场 + `superpowers:verification-before-completion` 每个完成节点 | `update-config` / `fewer-permission-prompts` |

---

## 6. 立即可执行的下一步（退出 Plan 模式后顺序执行）

> 每一步执行前先 `Skill` 工具调起对应 skill。

1. **`Skill: find-skills`** 确认 4 个新 skill 在 skills.sh 可装
2. **安装 4 个 skills**（§2.1 命令块），装到全局 `-g -y`
3. **`Skill: superpowers:writing-plans`** → 输出 `doc/frontend_ui_plan.md`（含 25 页清单 + 每页完成判据）
4. **`Skill: design:research-synthesis`** → 搜集闲鱼/转转/校园部落 3-5 张参考截图归纳风格关键词
5. **`Skill: design:design-system` + `superpowers:brainstorming`** → 写 `frontend/design/tokens.yaml`
6. **`Skill: design:ux-copy`** → 写 `frontend/design/pages.yaml`（25 页全量 prompt + 文案）
7. **`Skill: wechat-miniprogram-skill`** → 装 Vant Weapp + 改 `app.json` / `app.wxss`
8. **`Skill: design:ux-copy`** → Claude 把 25 页 prompt 拆成 `doc/mockups/prompts/<页码>_<页名>.md` 卡片
9. **用户手动**：打开 ChatGPT 官网（GPT-4o / GPT-Image），逐张复制 prompt → 生成 → 保存 PNG 到 `doc/mockups/`
10. **从 `index` 单页打通 Step 5-6-7 全流程**，验证工作流
11. **`Skill: superpowers:subagent-driven-development`** → 每次派 3-4 页 subagent，分批吃完 24 页
12. **每 5 页一次 `Skill: superpowers:requesting-code-review` + `pbakaus/impeccable@polish`** 一致性 pass
13. **全部页完成 → `Skill: superpowers:finishing-a-development-branch`** 合并主分支
14. **`Skill: anthropic-skills:doc-coauthoring` + `engineering:documentation`** → mockup 嵌入 `doc/src/03_detailed_design.md` UI 章节

---

## 7. 关键文件

| 文件 | 状态 | 用途 |
|---|---|---|
| `frontend/design/tokens.yaml` | 🆕 | 视觉规约 |
| `frontend/design/pages.yaml` | 🆕 | 25 页信息层级 + ChatGPT prompt |
| `doc/mockups/prompts/*.md` | 🆕 | 25 张 prompt 卡片（用户复制贴 ChatGPT） |
| `doc/mockups/*.png` | 🆕 | 用户手动下载的 mockup PNG（git 入仓，03 报告引用） |
| `doc/screenshots/` | 🆕 | 真机截图（Step 6 产出） |
| `doc/frontend_ui_plan.md` | 🆕 | Step 0 产出的执行 plan |
| `frontend/app.json` | 改 | `usingComponents` 全局注册 Vant 组件 |
| `frontend/app.wxss` | 改 | 覆盖 Vant CSS 变量到 tokens.yaml |
| `frontend/pages/**/*.{wxml,wxss,js,json}` | 改 | 25 页全部重写/补全 |
| `doc/src/03_detailed_design.md` | 改 | 新增 UI 章节，嵌 8-10 张 mockup |

---

## 8. 工时与成本

| 项 | 工时/费用 |
|---|---|
| Step 0（写实施 plan） | 0.25 天 |
| Step 1-2（tokens + pages） | 0.5 天 |
| Step 3（装 Vant + 主题） | 0.5 天 |
| Step 4（Claude 拆 prompt + 用户手动出图） | Claude 0.25 天 + 用户手动 1.5 小时 |
| Step 5（25 页逐页实现） | **15-20 人天**（与后端联调并行） |
| Step 6（真机验真 + 微调） | 2 天 |
| Step 7（一致性 + 文档 + 合并） | 1.5 天 |
| ChatGPT 订阅 | 已有则免费；否则 Plus $20/月 |
| **合计** | **~20-25 人天 / $0**（已订阅情况下） |

---

## 9. 风险与应对

| 风险 | 应对 | 兜底 skill |
|---|---|---|
| ChatGPT 出图中文文字乱码 | prompt 用英文 placeholder，文字由 Claude 实现时换中文 | `design:ux-copy` 调 prompt |
| ChatGPT 网页限速 / 网络断流 | 失败页面记 `failed.md` 单独重跑；分批次跑（每 5 页休 5 分钟） | — |
| Vant 与已实现 5 页冲突 | 重做策略已定，先全换 Vant 再调色 | `engineering:tech-debt` |
| mockup 风格漂移 | 固定 system style 段 + seed 参数 | `design:design-critique` 抽查 |
| Claude 看图实现偏离 | subagent 完成后自截图回贴并排对比 | `superpowers:verification-before-completion` |
| 自己想偷懒"差不多得了" | 主动启用 PUA 模式 + 强制 verification | `anthropic-skills:pua` |
| Skill 太多在 session 里互相干扰 | 严格按 §5 速查表，只启用当前步必需 skill | — |

---

## 10. 验证

### 10.1 每页验收清单（`verification-before-completion` 跑过才算完）

- [ ] mockup vs 实现截图：`design:design-critique` 评分 ≥ 7/10
- [ ] Vant 组件已使用，不再纯自研堆 wxml
- [ ] `tokens.yaml` 中变量全部命中（无写死 hex / px）
- [ ] iOS + Android 真机各一遍，无样式错乱
- [ ] `design:accessibility-review`：色对比度 ≥ 4.5:1，触控热区 ≥ 88rpx
- [ ] 该页 wxml/wxss 通过 `engineering:code-review`

### 10.2 全局验收

- [ ] Vant 组件覆盖率 ≥ 80%（grep `usingComponents`）
- [ ] `doc/src/03_detailed_design.md` UI 章节至少嵌 8 张 mockup
- [ ] `engineering:tech-debt` 扫描：写死的 px / hex 在全工程 ≤ 10 处
- [ ] 答辩演示视频里至少 5 页能看出"做了 UI"
- [ ] 端到端真机走通：登录 → 首页 → 详情 → 下单 → 钱包 → 评价

---

## 11. 与主开发计划的衔接

| 主计划阶段 | 本工作流插入点 |
|---|---|
| W4 后端启动 | Step 0-4 并行（B 出 mockup，不阻塞 A） |
| W5-W7 后端 router + 联调 | Step 5 逐页实现（A 提供 mock API） |
| W8-W9 加分项 + 管理员 | Step 5 续 + Step 6 验真 |
| W10 联调测试 | Step 7 一致性 pass |
| W11 文档定稿 + 演示 | mockup 入 03 报告 UI 章节 + 真机截图入演示材料 |

---

## 12. 与后端同事（A，Codex CLI）的协作

仓库：`github.com:ZRay0v0/agent-driven-miniprogram-showcase.git`

### 12.1 发给后端的"开工包"（一次性）

后端同事需要拿到的全部资料：

| 类别 | 文件/位置 | 用途 |
|---|---|---|
| **设计文档（最重要）** | `doc/01_需求分析报告.docx`<br>`doc/02_概要设计报告.docx`<br>`doc/03_详细设计报告.docx`<br>`doc/04_数据设计报告.docx` | 完整的功能 / 架构 / API / 数据需求 |
| 文档源 | `doc/src/01_requirements.md`<br>`doc/src/02_outline_design.md`<br>`doc/src/03_detailed_design.md`<br>`doc/src/04_data_design.md` | 比 docx 更新，方便 Codex 用 grep 索引 |
| 任务书原件 | `doc/1.jpg` `doc/2.jpg` | 课程评分依据，不能跑偏 |
| **本 plan** | `~/.claude/plans/abundant-doodling-parasol.md` | 让他知道前端这边节奏（手动 mockup、Vant 等） |
| 主开发 plan | Git 仓库 commit log + README | 总体里程碑 W4-W11 |
| 前端 API 调用约定 | `frontend/services/api/*.js` | **关键**：后端 endpoint 命名/请求体/返回结构必须与这些 JS 文件一致 |
| 前端环境配置 | `SETUP.md`、`check_env.py`、`.editorconfig` | 让他对项目工程基线有概念 |

**重点：发文档时请按下表强调给他**

| 报告 | 后端最关心的章节 |
|---|---|
| 04 数据设计 | **全篇**（15 实体 DDL + 字段字典 + 状态机 + 校园币审计） |
| 02 概要设计 | §3 接口设计（64 端点）+ §2.4 模块结构（15 模块）+ §2.8 ADR + §7 安全架构 |
| 03 详细设计 | §3.x 各模块的 service 算法（特别是 §3.12 校园币、§3.13 议价、§3.15 争议）+ 附录 D/E 时序图 |
| 01 需求分析 | §4 业务规则 + §5 用例规约 + §3.6.7 法律合规 + 附录 E 状态转换图 |

### 12.2 GitHub 协作工作流

**仓库分支策略**：

```
main                  ← 保护分支，仅通过 PR 合并
├── feat/backend-*    ← A 的工作分支（如 feat/backend-coins、feat/backend-orders）
├── feat/frontend-*   ← B 的工作分支（如 feat/frontend-wallet、feat/frontend-publish）
├── docs/*            ← 文档增量更新（mockup 入 03 报告等）
└── chore/*           ← 工具脚本、CI 配置
```

**目录边界**（避免冲突）：

| 目录 | 谁主导 |
|---|---|
| `backend/` | A 独占 |
| `frontend/` | B 独占 |
| `doc/` | B 主导，A 只读 |
| `scripts/` | 看脚本属性（`audit_coins.py` A 写、`gen_mockups.*` B 不再需要） |
| `.gitignore`、`README.md`、`SETUP.md` | 谁先动谁负责 + PR |

**PR 流程**：

1. 每个完成的逻辑单元开 PR（不要堆一周的代码在一个 PR）
2. PR 描述用模板：背景 / 改动清单 / 自测过的接口 / 截图（前端必须有）
3. 另一方至少瞄一眼再 merge（不强制 review，但有 issue 就提）
4. main 提交后双方都 `git pull --rebase` 保持最新

### 12.3 API 契约同步

接口约定是后端 / 前端协作的命门。两条强制约束：

1. **后端 = 权威**：以后端 FastAPI 启动后的 `/docs`（Swagger UI）为唯一 source of truth
2. **每周末**：A 把 `/openapi.json` 导出 commit 到 `doc/api/openapi.json`，B 据此校对前端 `services/api/*.js`

**联调期约定**：

- A 在写每个 router 前 30 分钟 ping B 一下，确认 endpoint 命名 / 字段名最终敲定
- B 写前端 API 调用时如果发现需要新字段，提一个 issue（标签 `api-contract`），不要直接改前端假装等后端跟
- 前端 mock 数据：B 自己造 `frontend/services/mock/*.js`，发请求时如果 URL 命中 mock 就走假数据，便于不依赖后端先做 UI

### 12.4 Issue 管理（轻量）

GitHub Issues 设三类标签：

| 标签 | 用途 |
|---|---|
| `backend` / `frontend` | 谁负责 |
| `api-contract` | 接口字段对不上时立 issue |
| `blocked-by-backend` / `blocked-by-frontend` | 谁卡谁 |
| `bug` / `feature` / `chore` | 标准类型 |

**强烈建议**：把 plan §12.1 的"开工包"打包发给 A 的当天，立 ~10 个高优 issue：每个 router（auth / users / goods / orders / coins / offers / wants / disputes / messages / stats）一个，方便他领任务。

### 12.5 沟通节奏

| 节奏 | 内容 | 渠道 |
|---|---|---|
| **每日 standup（5 分钟）** | 昨天做了什么 / 今天做什么 / 卡哪了 | 微信文字 |
| **每周一次同步（30 分钟）** | 联调测试 + 下周计划 + 接口对齐 | 腾讯会议 / 微信语音 |
| **API 字段变更** | 立 issue + at 对方 | GitHub |
| **紧急阻塞** | 直接微信 + 立 `urgent` 标签 issue | 微信 + GitHub |

### 12.6 立即可执行的协作动作（在主会话退出 Plan 模式后）

1. **给 A 发"开工包"**：四份 V2 docx + plan 文件 + 仓库 SSH 地址 + 强调 §12.1 表里的重点章节
2. **GitHub 仓库设置**：开启 main 分支保护（必须 PR 才能合并），勾选"PR 必须 up to date with base"
3. **立 10 个 router issue**：每个 issue 引用对应的 02/03/04 文档章节锚点
4. **建 `doc/api/openapi.json` 空文件**：占位，等 A 第一次启动 backend 后填充
5. **README.md 补一段「协作约定」**：把 §12.2-12.5 精简成 README 一节，让任何后来者都看得懂
6. **微信发起一次 30 分钟 kickoff**：确认双方对计划无歧义，A 当晚开始 W4 后端骨架
