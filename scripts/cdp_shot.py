"""Single-shot screenshot via browser-level WS + flat session. Bypasses CdpSession class."""
from __future__ import annotations

import asyncio
import base64
import json
import sys
from pathlib import Path

import requests
import websockets


async def shot(target_pattern: str, out_path: str) -> None:
    targets = requests.get("http://127.0.0.1:9222/json/list", timeout=5).json()
    matches = [t for t in targets if target_pattern in t.get("url", "")]
    if not matches:
        sys.exit(f"no target matched '{target_pattern}'")
    target = matches[0]
    print(f"[shot] target: {target['url'][:100]}")

    browser_ws = requests.get("http://127.0.0.1:9222/json/version", timeout=5).json()["webSocketDebuggerUrl"]

    async with websockets.connect(browser_ws, max_size=64 * 1024 * 1024) as ws:
        await ws.send(json.dumps({
            "id": 1,
            "method": "Target.attachToTarget",
            "params": {"targetId": target["id"], "flatten": True},
        }))

        session_id = None
        async with asyncio.timeout(8):
            while True:
                raw = await ws.recv()
                msg = json.loads(raw)
                if msg.get("id") == 1:
                    if "error" in msg:
                        sys.exit(f"attach error: {msg['error']}")
                    session_id = msg["result"]["sessionId"]
                    print(f"[shot] sessionId: {session_id}")
                    break

        await ws.send(json.dumps({
            "id": 2,
            "sessionId": session_id,
            "method": "Page.captureScreenshot",
            "params": {"format": "png", "captureBeyondViewport": False},
        }))

        async with asyncio.timeout(20):
            while True:
                raw = await ws.recv()
                msg = json.loads(raw)
                if msg.get("id") == 2:
                    if "error" in msg:
                        sys.exit(f"screenshot error: {msg['error']}")
                    data = msg["result"]["data"]
                    out = Path(out_path)
                    out.parent.mkdir(parents=True, exist_ok=True)
                    out.write_bytes(base64.b64decode(data))
                    print(f"[shot] saved {out} ({out.stat().st_size} bytes)")
                    return


if __name__ == "__main__":
    asyncio.run(shot(sys.argv[1], sys.argv[2]))
