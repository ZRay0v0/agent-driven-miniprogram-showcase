# 校园二手交易小程序 · AI UI→代码 工作流调研报告

调研日期：2026-05-13。约束：原生 WXML/WXSS/JS，2 人团队，演示用，课程设计 60% 功能 + 40% 文档。

---

## 一、Skills 调研（skills.sh）

skills.sh 是 vercel-labs 维护的开放 Skills 目录。统一安装命令：
`npx skills add <repo> --skill <name> -a claude-code`

### 1. Frontend / Web / UI 设计 — 强相关
| Skill | 来源 | 安装数 | 一句话用途 |
|---|---|---|---|
| **frontend-design** | anthropics/skills | 401K | 官方前端视觉规范（间距/字号/层级/对比），最强通用底座 |
| **web-design-guidelines** | vercel-labs/agent-skills | 313K | Vercel 内部设计规范，与 frontend-design 互补 |
| **ui-ux-pro-max** | nextlevelbuilder | GitHub 71K star | 67 UI 风格 + 161 配色 + 99 UX 准则，第三方但口碑最好 |
| **vercel-composition-patterns** | vercel-labs/agent-skills | — | React 组合模式（对小程序参考意义有限） |

### 2. Image-to-Code / Design-to-Code
- skills.sh 上**没有**独立的「screenshot-to-code」官方 skill；Claude 自身的多模态读图能力本身就足以替代。
- **figma-to-code** (scoobynko/claude-code-design-skills) — 第三方，依赖 Figma MCP，输出 React/Next。

### 3. Figma 相关
- **Figma 官方 MCP Server**（不是 skill，是 MCP）：`developers.figma.com/docs/figma-mcp-server` —— 让 Claude Code 直接读 Figma 文件结构、变量、截图。2026 年 3 月起 Beta 免费，后续转付费。

### 4. Mobile / Mini-Program / WeChat
- **sleek-design-mobile-apps** (sleekdotdesign) — 移动端优先设计原则（iOS/Android 思路，可类比小程序）。
- skills.sh 上**没有**任何 WeChat / 小程序专用 skill。本地已挂载的 `wechat-miniprogram-skill` 是性能/规范类，不含视觉。

### 5. Design-System / Tokens
- **extract-design-system** (arvindrk) — 从现有代码反推 tokens，对**已有视觉的反推**有用，本项目还没视觉所以暂时不需要。
- **canvas-design** (anthropics) — 52K，画布类视觉生成。

### 6. Mockup / Wireframe
- skills.sh 上**没有**主流 mockup/wireframe skill。pbakaus/impeccable 系列（polish / critique / bolder / delight / distill / quieter）是「设计微调指令集」，做最后一公里打磨用。

### 7. AI 图像生成工作流
- **ai-image-generation** (inference-sh-skills) — 134K，封装多供应商图像 API。
- **gpt_image_2_skill** (wuyoscar) — GitHub，专为 gpt-image-1/2 prompt 库 + CLI。

---

## 二、主流"AI UI → 代码"工作流对比

| 路径 | 优点 | 缺点 | 对原生小程序适配度 |
|---|---|---|---|
| **v0.dev** | 一句话生成可运行 React 页面 | 输出 React+Tailwind，**完全不是 wxml/wxss**，迁移成本高 | ★☆☆☆☆ |
| **abi/screenshot-to-code** | 开源，截图直接出 HTML/Tailwind/React/Vue | 不输出 wxml；自己跑服务，2 人课程项目 ROI 低 | ★★☆☆☆ |
| **Claude 直接看图生成代码** | 零搭建；Claude Code 已支持本地图片输入；Opus 4.7 多模态能力足以读 mockup 给 wxml | 一次性输出，无设计源文件可回改 | ★★★★★ |
| **gpt-image-1 / OpenAI 图像 API** | 程序化批量生成 24 页 mockup；prompt 可版本控制；与 Claude Code 串联简单 | 只出 PNG（无 SVG）；细节文字偶发乱码；按张计费 | ★★★★☆（作为 mockup 上游） |
| **Figma + Dev Mode + Figma MCP** | 工业标准；MCP 让 Claude 直读结构 | Figma 需手工搭页面或先用 AI 灌；MCP 现免费但要 Figma 账号；输出仍是 React 系 | ★★★☆☆ |
| **Locofy / Anima / Builder.io** | 真 design→code 专业工具 | **均不支持 wxml 导出**；Builder.io 输出 React/Vue | ★☆☆☆☆ |
| **Galileo AI / Uizard** | 文字直出 mockup | Galileo 已被 Google 收购变 Stitch；只输出 HTML/Tailwind | ★★☆☆☆（仅作 mockup 来源） |
| **MJ / SD 生成 UI → 手切** | mockup 质感最高 | 文字渲染差，UI 元素扭曲多，几乎不能直读 | ★★☆☆☆ |

### gpt-image-1 在本项目的可行性
- **成本**：标准 1024×1536（移动竖屏）`quality=medium` 约 $0.04/张；24 页 mockup ≈ $1，连重做 5 次也才 $5。Mini 版 $0.005/张更便宜。
- **调用**：`client.images.generate(model="gpt-image-1", size="1024x1536", quality="medium", prompt=...)`，返回 base64 PNG。
- **Prompt 关键点**：**把页面当作"已上线产品"描述**，给 layout/层级/真实文案，避免"concept art / illustration"语；可加"place in iPhone frame"。
- **输出**：仅 PNG，无 SVG。够给 Claude Code 当视觉输入。
- **与 Claude Code 串联**：写一个 `scripts/gen-mockups.py`，按 `pages.yaml` 批量生成到 `doc/mockups/<page-name>.png`，然后在 Claude Code 里 `请按 doc/mockups/index.png 实现 pages/index/index.wxml,.wxss`。

---

## 三、行业标准「先设计图后代码」流程模板（7 步）

1. **视觉规约清单 (Design Brief)** — 单文件列全局 tokens：主色/辅色/灰阶、字号阶梯（24/18/14/12）、圆角、间距阶（4/8/12/16/24）、阴影、用到的组件清单（list-item、tag、price、button-primary 等）。
2. **页面清单 + 信息层级** — 每页一段 100 字内的"长这样"描述：顶部、列表区、底部 tab、空态。
3. **批量生成 mockup** — 用 gpt-image-1 按 prompt 模板批跑，命名 `mockup_<页码>_<页名>_v<版本>.png`，存 `doc/mockups/`。
4. **人工挑稿 + 局部 edits** — 不满意的页用同 API 的 `images.edits` 局部重画。
5. **Claude Code 看图实现** — 一次一页：`@frontend-design @web-design-guidelines + sleek-design-mobile-apps`，把 mockup + tokens 一起喂入，让 Claude 输出 wxml/wxss。
6. **真机/模拟器验真** — 微信开发者工具跑，截图回贴。
7. **批量打磨 + 一致性 pass** — 用 pbakaus/impeccable 的 polish / distill 对所有页做最后一致性扫描。
8. （可选）**design-handoff doc** — 写一份 GB/T 8567 风格的"详细设计 - UI 设计说明"附录，反查的 mockup 全收进去，正好补 40% 文档分。

---

## 四、本课程项目最终建议

**推荐主路径：Claude 直接看图 + gpt-image-1 批量生成 mockup（双轨）**

理由：
1. **零搭建**，无第三方付费工具锁定，符合「工时有限」。
2. gpt-image-1 单页 $0.04，24 页双稿 $2，对学生项目零成本压力。
3. 输出 wxml/wxss 这件事**没有任何工具支持**，所以无论选哪条路径，最后都得回到 Claude Code 手写。既然如此，**省掉中间的 React/Tailwind 中转层**才是最短路径。
4. mockup 图直接进 `doc/mockups/`，可双用于详细设计文档的 UI 章节，文档分一并解决。

**Skills 安装清单（推荐 4 个，全部免费）**：
```
npx skills add anthropics/skills --skill frontend-design -a claude-code
npx skills add vercel-labs/agent-skills --skill web-design-guidelines -a claude-code
npx skills add sleekdotdesign/agent-skills --skill sleek-design-mobile-apps -a claude-code
npx skills add pbakaus/impeccable --skill polish -a claude-code
```
（前 3 个生成时启用，最后 polish 收尾一致性 pass 时启用。ui-ux-pro-max 可选，体量大、可能噪音多，慎选。）

**备选路径（如果队友会 Figma）**：在 Figma 用 AI 插件（Magician / 自家 AI）拉 24 页 → 接 Figma MCP → Claude Code 读结构出 wxml。优点是有源文件可回改；缺点是多一个工具栈、MCP 后续会收费。**两人团队不建议**。

**不要做**：v0.dev / Locofy / Builder.io / abi/screenshot-to-code —— 全部输出非 wxml 代码，转一道反而更慢。

---

## 参考资料
- [skills.sh Design & UI topic](https://skills.sh/topic/design)
- [vercel-labs/skills GitHub](https://github.com/vercel-labs/skills)
- [Anthropic frontend-design](https://skills.sh/) (401K installs)
- [Figma MCP server docs](https://developers.figma.com/docs/figma-mcp-server/)
- [Figma + Claude Code 设置](https://help.figma.com/hc/en-us/articles/39888612464151)
- [GPT Image prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- [GPT Image 1 model docs](https://developers.openai.com/api/docs/models/gpt-image-1)
- [Galileo→Stitch 转型](https://www.banani.co/blog/galileo-ai-features-and-alternatives)
- [abi/screenshot-to-code](https://github.com/abi/screenshot-to-code)
- [ui-ux-pro-max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
