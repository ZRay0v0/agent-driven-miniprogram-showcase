"""
CDP CLI for WeChat DevTools running with --remote-debugging-port=9222.

Uses the browser-level WebSocket with Target.attachToTarget(flatten=true) so we
can multiplex sessions against targets that are already attached internally by
the IDE. This is how chrome-devtools-mcp/puppeteer compatibility is bypassed.

Usage:
  python scripts/cdp.py list
  python scripts/cdp.py screenshot [--target render|appservice|main] [--output FILE]
  python scripts/cdp.py console    [--target render|appservice|main] [--duration SEC]
  python scripts/cdp.py eval "<expr>" [--target render|appservice|main]
  python scripts/cdp.py reload     [--target render|appservice|main]
"""
from __future__ import annotations

import argparse
import asyncio
import base64
import itertools
import json
import sys
from pathlib import Path

import requests
import websockets

CDP_BASE = "http://127.0.0.1:9222"
TARGET_PATTERNS = {
    "render":     "__pageframe__",
    "appservice": "appservice/mainframe",
    "main":       "html/index.html?projectpath",
}


def list_targets() -> list[dict]:
    return requests.get(f"{CDP_BASE}/json/list", timeout=5).json()


def get_browser_ws() -> str:
    return requests.get(f"{CDP_BASE}/json/version", timeout=5).json()["webSocketDebuggerUrl"]


def pick_target(kind: str) -> dict:
    pattern = TARGET_PATTERNS[kind]
    matches = [t for t in list_targets() if pattern in t.get("url", "")]
    if not matches:
        sys.exit(f"[cdp] no target matched '{kind}' (pattern '{pattern}')")
    return matches[0]


class CdpSession:
    """Single browser-level WS, multiplex multiple target sessions via flatten."""

    def __init__(self, ws):
        self.ws = ws
        self._id_seq = itertools.count(start=1)
        self._pending: dict[int, asyncio.Future] = {}
        self._events: list[dict] = []

    async def _reader(self):
        while True:
            try:
                raw = await self.ws.recv()
            except websockets.exceptions.ConnectionClosed:
                return
            msg = json.loads(raw)
            mid = msg.get("id")
            if mid is not None and mid in self._pending:
                self._pending.pop(mid).set_result(msg)
            else:
                self._events.append(msg)

    async def send(self, method: str, params: dict | None = None,
                   session_id: str | None = None, timeout: float = 30.0) -> dict:
        mid = next(self._id_seq)
        payload: dict = {"id": mid, "method": method, "params": params or {}}
        if session_id:
            payload["sessionId"] = session_id
        fut: asyncio.Future = asyncio.get_running_loop().create_future()
        self._pending[mid] = fut
        await self.ws.send(json.dumps(payload))
        msg = await asyncio.wait_for(fut, timeout=timeout)
        if "error" in msg:
            raise RuntimeError(f"CDP {method} failed: {msg['error']}")
        return msg.get("result", {})

    async def attach(self, target_id: str) -> str:
        res = await self.send("Target.attachToTarget", {"targetId": target_id, "flatten": True})
        return res["sessionId"]

    def drain_events(self, predicate=lambda _: True) -> list[dict]:
        kept = [e for e in self._events if predicate(e)]
        self._events = [e for e in self._events if not predicate(e)]
        return kept


async def with_session(target_kind: str, fn):
    """Open browser WS, attach to chosen target, run fn(session, session_id)."""
    target = pick_target(target_kind)
    print(f"[cdp] target: {target['url'][:80]}")
    async with websockets.connect(get_browser_ws(), max_size=64 * 1024 * 1024) as ws:
        sess = CdpSession(ws)
        reader_task = asyncio.create_task(sess._reader())
        try:
            session_id = await sess.attach(target["id"])
            return await fn(sess, session_id)
        finally:
            reader_task.cancel()


def cmd_list(args):
    for i, t in enumerate(list_targets()):
        title = t.get("title", "")[:30]
        url = t["url"][:100]
        print(f"[{i}] type={t['type']:14s} attached={str(t.get('attached', '?'))[:5]:5s} url={url}")


def cmd_screenshot(args):
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)

    async def shot(sess: CdpSession, sid: str):
        res = await sess.send("Page.captureScreenshot",
                              {"format": "png", "captureBeyondViewport": False},
                              session_id=sid)
        out.write_bytes(base64.b64decode(res["data"]))
        print(f"[cdp] saved -> {out} ({out.stat().st_size} bytes)")

    asyncio.run(with_session(args.target, shot))


def cmd_console(args):
    async def sniff(sess: CdpSession, sid: str):
        await sess.send("Runtime.enable", session_id=sid)
        await sess.send("Log.enable", session_id=sid)
        print(f"[cdp] sniffing for {args.duration}s...")
        await asyncio.sleep(args.duration)
        msgs = []
        for evt in sess.drain_events(lambda e: "method" in e):
            m = evt.get("method", "")
            p = evt.get("params", {})
            if m == "Runtime.consoleAPICalled":
                text = " ".join(_short(a) for a in p.get("args", []))
                msgs.append((p.get("type", "log"), text))
            elif m == "Log.entryAdded":
                e = p["entry"]
                msgs.append((e.get("level", "info"), e.get("text", "")))
            elif m == "Runtime.exceptionThrown":
                ed = p["exceptionDetails"]
                msgs.append(("error",
                             (ed.get("text", "") + " " + ed.get("exception", {}).get("description", "")).strip()))
        for lvl, text in msgs:
            print(f"  [{lvl}] {text}")
        print(f"[cdp] {len(msgs)} message(s)")

    asyncio.run(with_session(args.target, sniff))


def _short(arg: dict) -> str:
    if "value" in arg:
        return str(arg["value"])
    if "description" in arg:
        return arg["description"]
    return arg.get("type", "?")


def cmd_eval(args):
    async def run(sess: CdpSession, sid: str):
        res = await sess.send("Runtime.evaluate",
                              {"expression": args.expr, "returnByValue": True, "awaitPromise": True},
                              session_id=sid)
        r = res.get("result", {})
        print(f"  type:  {r.get('type')}")
        if "value" in r:
            print(f"  value: {json.dumps(r['value'], ensure_ascii=False, indent=2)}")
        else:
            print(f"  desc:  {r.get('description')}")
        if "exceptionDetails" in res:
            print(f"  ERR:   {res['exceptionDetails']}")

    asyncio.run(with_session(args.target, run))


def cmd_reload(args):
    async def reload(sess: CdpSession, sid: str):
        await sess.send("Page.reload", session_id=sid)
        print("[cdp] reloaded")

    asyncio.run(with_session(args.target, reload))


def main():
    p = argparse.ArgumentParser(description="WeChat DevTools CDP CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("list", help="list all CDP targets")

    p_shot = sub.add_parser("screenshot", help="screenshot a target")
    p_shot.add_argument("--target", choices=TARGET_PATTERNS, default="render")
    p_shot.add_argument("--output", default="docs/screenshots/latest.png")

    p_con = sub.add_parser("console", help="sniff console messages")
    p_con.add_argument("--target", choices=TARGET_PATTERNS, default="appservice")
    p_con.add_argument("--duration", type=float, default=2.0)

    p_eval = sub.add_parser("eval", help="evaluate JS expression on target")
    p_eval.add_argument("expr")
    p_eval.add_argument("--target", choices=TARGET_PATTERNS, default="appservice")

    p_rel = sub.add_parser("reload", help="reload a target page")
    p_rel.add_argument("--target", choices=TARGET_PATTERNS, default="render")

    args = p.parse_args()
    {"list": cmd_list, "screenshot": cmd_screenshot, "console": cmd_console,
     "eval": cmd_eval, "reload": cmd_reload}[args.cmd](args)


if __name__ == "__main__":
    main()
