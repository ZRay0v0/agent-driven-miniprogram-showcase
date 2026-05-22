# 后端开工包 — 致同事 A（Codex CLI）

> 这份文档是给负责后端的同事 A 的一站式入口。读完后你应该能：clone 仓库 → 跑通环境 → 找到所有设计依据 → 知道第一周要做什么。

仓库地址：`git@github.com:ZRay0v0/agent-driven-miniprogram-showcase.git`（SSH） 或 `https://github.com/ZRay0v0/agent-driven-miniprogram-showcase.git`（HTTPS）

---

## 1. 五分钟入门

```bash
# 1) clone
git clone git@github.com:ZRay0v0/agent-driven-miniprogram-showcase.git
cd agent-driven-miniprogram-showcase

# 2) 看必读文档（顺序）
#    a. 任务书：doc/1.jpg, doc/2.jpg —— 课程评分的硬约束
#    b. SETUP.md —— 环境配置
#    c. doc/04_数据设计报告.docx —— 你直接照着建表
#    d. doc/02_概要设计报告.docx §3 接口设计（64 端点） + §2.4 模块结构
#    e. doc/03_详细设计报告.docx §3.x 各模块 service 算法
#    f. doc/01_需求分析报告.docx §4 业务规则 + §5 用例规约

# 3) 自检环境
python scripts/check_env.py
```

---

## 2. 后端你最关心的文档锚点（精准定位）

| 报告 | 你最该读的章节 | 为什么 |
|---|---|---|
| **04 数据设计** | **全篇**（15 实体 DDL + 字段字典 + 状态机 + 校园币审计） | 建模直接照抄，最重要 |
| 02 概要设计 | §3 接口设计（64 端点清单） | API 路由命名/方法/请求体/返回结构都在这 |
| 02 概要设计 | §2.4 模块结构（15 模块） | 你要拆 router 的依据 |
| 02 概要设计 | §2.8 ADR | 7 条架构决策（SQLite/JWT/状态机白名单/校园币等） |
| 02 概要设计 | §7 安全架构 | 认证流程、角色矩阵、密钥管理 |
| 03 详细设计 | §3.12 校园币模块 | CoinService 算法（行锁 + 流水账） |
| 03 详细设计 | §3.13 议价 + §3.15 争议 | 状态机 + 仲裁算法 |
| 03 详细设计 | 附录 D/E 时序图 | 订单 / 校园币 / 争议端到端流程 |
| 01 需求分析 | §4 业务规则（BR-01~BR-15）+ §5 用例规约 | 测试用例的依据 |
| 01 需求分析 | §3.6.7 法律合规 | 涉及个人信息存储要遵守的边界 |

文档源（比 docx 更新、grep 友好）：

- `doc/src/01_requirements.md`
- `doc/src/02_outline_design.md`
- `doc/src/03_detailed_design.md`
- `doc/src/04_data_design.md`

---

## 3. 接口契约：API 命名以「前端调用」为先

**关键约定**：前端 `frontend/services/api/*.js` 已经按业务域写好了 11 个 API 客户端，里面的 URL / 字段名是双方对齐的起点。**你写后端 router 时务必和这里对齐**，避免改名风暴。

```
frontend/services/api/
├── auth.js          → POST /auth/login, /auth/wx-login, PUT /auth/password
├── users.js         → GET /users/me, PUT /users/me, GET /users/{id}
├── goods.js         → CRUD /goods, GET /goods, GET /goods/{id}
├── categories.js    → GET /categories
├── uploads.js       → POST /uploads/image
├── orders.js        → CRUD /orders, /orders/{id}/confirm, /complete, /cancel
├── reviews.js       → POST /orders/{id}/review, GET /users/{id}/reviews
├── messages.js      → /messages
├── stats.js         → /stats/daily, /weekly, /monthly
├── ai.js            → /ai/title, /ai/desc
└── request.js       → 公共请求封装（baseURL、JWT 注入、错误码处理）
```

V2 新增的 API client 还没写，你可以先写后端再发我，前端这边补：

- `coins.js` — 校园币（余额/流水/mock 充值/对账）
- `offers.js` — 议价
- `wants.js` — 求购
- `disputes.js` — 争议
- `favorites.js` — 收藏 + 关注
- `blocks.js` — 拉黑
- `reports.js` — 举报

**契约同步机制**：

1. 你写完一个 router 后跑 `uvicorn`，把 `/openapi.json` 导出到 `doc/api/openapi.json`，commit
2. 我看 `doc/api/openapi.json` 校对前端 `services/api/*.js`
3. 如果字段名要改，**先开 GitHub issue 打标签 `api-contract` 讨论**，再改

---

## 4. 仓库分支策略

`main` 是保护分支，只能通过 PR 合并。

```
main
├── feat/backend-*    ← 你的工作分支（如 feat/backend-coins、feat/backend-orders）
├── feat/frontend-*   ← 我的工作分支
├── docs/*            ← 文档增量更新
└── chore/*           ← 工具脚本、CI 配置
```

**目录边界**（避免冲突）：

| 目录 | 谁主导 |
|---|---|
| `backend/` | 你独占 |
| `frontend/` | 我独占 |
| `doc/` | 我主导，你只读 |
| `scripts/` | 看脚本属性（`audit_coins.py` 你写、`seed.py` 你写） |
| `.gitignore` / `README.md` / `SETUP.md` | 谁先动谁开 PR |

**PR 流程**：

1. 每个完成的逻辑单元开 PR（不要堆一周的代码在一个 PR）
2. PR 模板：背景 / 改动清单 / 自测过的接口 / 截图（前端必须有）
3. 我至少瞄一眼再 merge（不强制 review，但有 issue 就提）
4. main 提交后双方都 `git pull --rebase` 保持最新

---

## 5. W4 第一周建议任务（按优先级）

| 优先级 | 任务 | 文档锚点 |
|---|---|---|
| P0 | 搭 FastAPI 骨架（`backend/app/main.py` + `config.py` + `database.py`） | 02 §2.4 模块结构 |
| P0 | 按 04 数据设计的 DDL 建 15 张表（ORM models） | 04 §3 全篇 |
| P0 | 写 Alembic 初始迁移 + seed.py 种子数据 | 04 §3.2.1 DDL |
| P0 | 实现 `auth` + `users` 两个 router（依赖最少） | 02 §3.1 / §3.2 |
| P1 | 实现 `goods` + `categories` + `uploads`（前端首页 / 详情依赖） | 02 §3.3 / §3.4 / §3.5 |
| P1 | 跑通 JWT 鉴权 + 启动 `/docs` Swagger | 02 §7 安全 |
| P2 | 写 pytest 基线（auth + users 覆盖率 ≥ 80%） | 详设附录 |

我建议你一开始把 10 个 router 各立一个 GitHub issue，逐个领，方便我看进度。

---

## 6. 沟通节奏

| 节奏 | 内容 | 渠道 |
|---|---|---|
| **每日 standup（5 分钟）** | 昨天做了什么 / 今天做什么 / 卡哪了 | 微信文字 |
| **每周一次同步（30 分钟）** | 联调测试 + 下周计划 + 接口对齐 | 腾讯会议 / 微信语音 |
| **API 字段变更** | 立 issue + at 我 | GitHub |
| **紧急阻塞** | 直接微信 + 立 `urgent` 标签 issue | 微信 + GitHub |

---

## 7. 工具链提醒

- **Codex CLI** 跟 Claude Code 平起平坐，写代码任你折腾，但**不能改 `doc/`** —— 文档是我这边的活
- **commit 信息**用中文 + 描述「为什么」，不用「fix bug」这种
- **永远不要 `git push --force` 到 main**，必要时找我

---

## 8. 当前仓库已有的东西

- ✅ 四份 V2 设计报告（commit `6a3e05c`）
- ✅ 前端骨架：18 页 + 5 组件 + 11 API client + 4 utils
- ✅ 已实现样式的 5 个页面（index/login/publish/detail/create，待按新设计重做）
- ✅ 开发环境检查脚本 `scripts/check_env.py`
- ✅ 微信开发者工具配置 + AppID 已就绪
- ⚪ `backend/` —— **空的，等你来填**
- ⚪ `doc/api/openapi.json` —— 占位，等你第一次启动 backend 后填充

---

## 9. 有问题就开 Issue

GitHub Issues 标签约定：

| 标签 | 用途 |
|---|---|
| `backend` / `frontend` | 谁负责 |
| `api-contract` | 接口字段对不上时立 issue |
| `blocked-by-backend` / `blocked-by-frontend` | 谁卡谁 |
| `bug` / `feature` / `chore` | 标准类型 |
| `urgent` | 当天必须响应 |

---

**祝顺利。准备好就开第一个分支 `feat/backend-scaffold` 把 FastAPI 骨架推上来吧。**
