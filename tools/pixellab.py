"""Bezpečné generování v PixelLabu (MCP přes HTTPS). Klíč nikde: v cloudu ho přidá síťová proxy (tajemství prostředí pro api.pixellab.ai).

  python tools/pixellab.py balance
  python tools/pixellab.py anim <character_id> <název> <směr> '<json dalších parametrů>' [--max-cost N]
  python tools/pixellab.py wait

POJISTKY PROTI DUPLIKÁTŮM (pravidlo uživatele 13. 11. 2026, generace jsou omezené):
1. Vždy jen JEDEN směr na volání. Animace s více směry = víc volání za sebou (další směry do stejné skupiny: animation_group_id).
2. Před odesláním se zkontroluje postava (get_character): když už má animaci se stejným názvem a tímto směrem, NIC SE NEODEŠLE.
3. Před odesláním se zkontroluje fronta (list_jobs): když je plno, skript skončí s chybou. Nikdy se neopakuje automaticky.
   Žádné smyčky „zkus znovu“: opakovaný pokus po chybě, která mohla část úlohy přijmout, dělá duplikáty.
4. Každé odeslání se zapíše do art/pixellab/ledger.jsonl (postava, název, směr, skupina, cena, čas) a tam se kontroluje taky.
5. --max-cost (výchozí 4): když odpověď hlásí vyšší cenu za směr, skript to vypíše jako varování (cenu už nejde vrátit, příště snížit).
"""
import json, os, re, sys, time, urllib.request

URL = "https://api.pixellab.ai/mcp"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, "art", "pixellab", "ledger.jsonl")
H = {"Authorization": "Bearer proxy-injected", "Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
_sid = None


def _post(body, sid=None):
    h = dict(H)
    if sid:
        h["Mcp-Session-Id"] = sid
    req = urllib.request.Request(URL, json.dumps(body).encode(), h)
    with urllib.request.urlopen(req, timeout=600) as r:
        sid2 = r.headers.get("Mcp-Session-Id")
        raw = r.read().decode()
    out = None
    for line in raw.splitlines():
        if line.startswith("data:"):
            out = json.loads(line[5:])
    if out is None and raw.strip().startswith("{"):
        out = json.loads(raw)
    return out, sid2


def call(tool, args):
    global _sid
    if not _sid:
        _, _sid = _post({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-03-26", "capabilities": {}, "clientInfo": {"name": "fronta", "version": "1"}}})
        if _sid:
            _post({"jsonrpc": "2.0", "method": "notifications/initialized"}, _sid)
    r, _ = _post({"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": tool, "arguments": args}}, _sid)
    c = (r or {}).get("result", {}).get("content") or []
    return "\n".join(x.get("text", "") for x in c if x.get("type") == "text") or json.dumps(r)


def ledger():
    if not os.path.exists(LEDGER):
        return []
    return [json.loads(l) for l in open(LEDGER) if l.strip()]


def existing_dirs(char_id, name):
    """směry, které už postava má v animaci s tímto názvem (i ve skupinách name-xxxx)"""
    text = call("get_character", {"character_id": char_id})
    dirs = set()
    for m in re.finditer(r"^  ([\w-]+) — \d+ dir \(([^)]*)\)", text, re.M):
        nm = m.group(1)
        if nm == name or re.fullmatch(re.escape(name) + r"-[0-9a-f]{8}", nm):
            dirs |= {d.strip() for d in m.group(2).split(",")}
    return dirs


def anim(char_id, name, direction, extra, max_cost):
    for e in ledger():
        if e["character"] == char_id and e["name"] == name and e["direction"] == direction:
            sys.exit(f"STOP: {name}/{direction} už je v ledgeru ({e['time']}, skupina {e.get('group')}). Nic neodesláno.")
    have = existing_dirs(char_id, name)
    if direction in have:
        sys.exit(f"STOP: postava už má {name}/{direction}. Nic neodesláno.")
    jobs = call("list_jobs", {})
    m = re.match(r"(\d+) jobs", jobs.strip())
    if m and int(m.group(1)) >= 8:
        sys.exit("STOP: fronta PixelLabu je plná (8). Počkej (python tools/pixellab.py wait) a spusť znovu ručně.")
    args = dict(extra, character_id=char_id, animation_name=name, directions=[direction])
    out = call("animate_character", args)
    g = re.search(r"group: ([0-9a-f-]{36})", out)
    cost = re.search(r"cost: (\d+) generation", out)
    err = re.search(r"^error: (.*)$", out, re.M)
    entry = {"time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "character": char_id, "name": name, "direction": direction,
             "group": g.group(1) if g else None, "cost": int(cost.group(1)) if cost else None, "error": err.group(1) if err else None}
    if g or not err:  # cokoli, co mohlo být přijato, se zapíše (i s chybou), aby se to znovu neodeslalo
        with open(LEDGER, "a") as f:
            f.write(json.dumps(entry) + "\n")
    print(out)
    if entry["cost"] and entry["cost"] > max_cost:
        print(f"VAROVÁNÍ: cena {entry['cost']} za směr je víc než --max-cost {max_cost}")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a or a[0] == "balance":
        print(call("get_balance", {}))
    elif a[0] == "wait":
        print(call("wait_for_jobs", {"timeout_seconds": 540}))
    elif a[0] == "anim":
        mc = int(a[a.index("--max-cost") + 1]) if "--max-cost" in a else 4
        anim(a[1], a[2], a[3], json.loads(a[4]) if len(a) > 4 and not a[4].startswith("--") else {}, mc)
    else:
        print(call(a[0], json.loads(a[1]) if len(a) > 1 else {}))
