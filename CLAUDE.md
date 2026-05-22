# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

Campus second-hand trading WeChat Mini Program — software engineering course project. Graded 60% feature implementation + 40% four GB/T 8567-2006 design reports. Two-person team:

- **A** uses Codex CLI → `backend/` (Python FastAPI + SQLite). The folder does not exist yet.
- **B** (this account) uses Claude Code → `frontend/` (native WeChat Mini Program) + all `doc/` deliverables.

Stay inside the directory you own — `doc/` and `frontend/` are B's; `backend/` belongs to A. See README.md "协作约定" for branch prefixes (`feat/frontend-*`, `docs/*`, etc.) and PR rules.

**Read `doc/STATUS.md` first** when picking up work — it is the live handoff log with the current Phase, what is done, what's next, and a curated list of pitfalls already hit.

## Common commands

```bash
# Environment self-check (Node / npm / Python / pandoc / WeChat DevTools detection)
python scripts/check_env.py

# Re-install Vant after wiping miniprogram_npm
cd frontend && npm i @vant/weapp -S
# then in WeChat DevTools: 工具 → 构建 npm

# Lint for hard-coded hex / px in pages & components (must return zero hits)
grep -rn "#[0-9a-fA-F]\{6\}" frontend/pages frontend/components | grep -v "var(--"
grep -rn ": [0-9]*px" frontend/pages frontend/components | grep -v "rpx"
```

There is no build / test runner — the WeChat Developer Tool is the only way to compile and preview. CLI cannot trigger compile, hot-reload, or preview. Ask the user to run `Ctrl+B` / `Ctrl+R` in the tool and report results.

Backend dev (when it exists): `cd backend && uvicorn app.main:app --reload`, default `http://127.0.0.1:8000`.

## Architecture

### Frontend request stack (top → bottom)

```
pages/<area>/<page>/*.{wxml,wxss,js,json}
   └─ require("../../services/api/index")   ← MUST be explicit /index, see pitfall #4
       └─ services/api/<domain>.js          ← 11 domain modules: auth/users/goods/categories/
                                                uploads/orders/reviews/messages/stats/ai/admin
           └─ utils/request.js              ← JWT injection, 401 → reLaunch login,
                                              response unwrap of {code, data, message}
               └─ utils/config.js           ← single switch: ENV = "dev" | "prod"
                                              API_BASE, STORAGE_KEYS
```

Login state lives in `utils/auth.js` + `wx.getStorageSync` + `getApp().globalData.user`; do not invent a parallel session store. `request.js` already handles 401 globally — pages should not catch and redirect themselves.

Response contract from backend: `{ code: 0, data, message }`. `request.js` resolves with `data` only; non-zero `code` rejects with a toast unless `silent: true`.

### Design system (token-driven, not free-form)

`frontend/design/tokens.yaml` and `frontend/design/pages.yaml` are the single source of truth for visuals and per-page UX. Three hard rules:

1. **No literal hex or px in pages/components.** Use the CSS variables defined in `app.wxss` (sourced from `tokens.yaml`) and `rpx` for sizing.
2. **Vant Weapp components are pre-registered globally in `app.json`.** Use them; don't re-roll basic UI primitives.
3. **Mockup-First workflow.** For each page, the mockup PNG in `doc/mockups/figure/NN_<page>_v1.png` is the visual target. The matching entry in `pages.yaml` lists the allowed Vant components, UX copy, and known pitfalls — read it before writing wxml.

The full per-page implementation queue (Phase 2–7, batches B2–B7) is in `doc/frontend_ui_plan.md`. `doc/STATUS.md` §5 tracks which batch is current.

### Frontend ↔ backend contract

- Backend `/openapi.json` (when it exists) is the single source of truth, mirrored into `doc/api/openapi.json`.
- Field-name changes must go through a GitHub issue tagged `api-contract` before code on either side moves.
- Dev login currently has a mock fallback in `pages/auth/login/login.js` so the UI is usable without backend (`748522e`); do not remove without putting real `code2session` behind it.

## Pitfalls already hit (don't repeat)

| # | Trap | Fix |
|---|------|-----|
| 1 | `<van-step>` (singular) does not exist | Use `<van-steps>` with `steps` array prop |
| 2 | `<van-badge>` does not exist | Use the `info=` attribute on `van-icon` / `van-tabbar-item` |
| 3 | PowerShell 5 writes UTF-8 with BOM, which breaks Mini Program JSON parse | Write with `Out-File -Encoding utf8NoBOM` or .NET `UTF8Encoding($false)` |
| 4 | WeChat `require()` does NOT resolve a directory to `index.js` | Always write the file: `require("../../services/api/index")` |

`frontend/design/pages.yaml` carries the canonical Vant pitfall list at its top — subagents reading it will see them.

## Working with subagents

For multi-page implementation work, dispatch parallel subagents (see `superpowers:dispatching-parallel-agents`). Per-batch prompt template lives in `doc/frontend_ui_plan.md` §3. Required skills to enable on each child: `frontend-design`, `web-design-guidelines`, `sleek-design-mobile-apps`, `wechat-miniprogram-skill`. Keep batches ≤ 4 pages to avoid context overflow.

## File index for first-time pickup

| Need | Path |
|------|------|
| What's the current state | `doc/STATUS.md` |
| Full multi-phase plan | `doc/frontend_ui_plan.md` |
| Visual tokens / per-page spec | `frontend/design/tokens.yaml` · `frontend/design/pages.yaml` |
| Mockup PNGs (visual target) | `doc/mockups/figure/01-28_*.png` |
| GB/T 8567 deliverables | `doc/0[1-4]_*.docx` |
| Backend onboarding kit (give to A) | `doc/coordination/onboarding_backend.md` |
| Dev environment setup | `SETUP.md` |
