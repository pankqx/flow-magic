"""Reference content validator + fixture runner. Run from repo root:  python tests/reference/validate_content.py
Checks: JSON Schema, semantic rules (docs/CONTENT_AND_VISUALS.md), and tests/fixtures/matcher-cases.json.
Requires: pip install jsonschema
"""
import json, glob, os, sys
from jsonschema import Draft202012Validator
sys.path.insert(0, os.path.dirname(__file__))
import matcher_reference as mr

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
errors = []

def err(msg): errors.append(msg)

schema = json.load(open(os.path.join(ROOT, "schemas", "concept.schema.json"), encoding="utf-8"))
validator = Draft202012Validator(schema)
files = sorted(glob.glob(os.path.join(ROOT, "content", "concepts", "*.json")))
if not files: err("no concept files found")

all_aliases = {}
ids = set()
for path in files:
    name = os.path.basename(path)
    doc = json.load(open(path, encoding="utf-8"))
    for e in validator.iter_errors(doc):
        err(f"{name}: schema: {'/'.join(map(str, e.absolute_path))}: {e.message[:140]}")
    cid = doc.get("id")
    if cid + ".json" != name: err(f"{name}: id '{cid}' must match file name")
    if cid in ids: err(f"{name}: duplicate id")
    ids.add(cid)
    v = doc.get("visual", {})
    t = v.get("type")
    steps = []
    def uniq(items, what):
        s = [i["id"] for i in items]
        if len(s) != len(set(s)): err(f"{name}: duplicate {what} ids")
    if t == "flow":
        nodes, edges = v["nodes"], v["edges"]
        uniq(nodes, "node"); uniq(edges, "edge")
        nid = {n["id"] for n in nodes}
        cells = [(n["col"], n["row"]) for n in nodes]
        if len(cells) != len(set(cells)): err(f"{name}: two nodes share a grid cell")
        for e in edges:
            if e["from"] not in nid or e["to"] not in nid: err(f"{name}: edge {e['id']} references unknown node")
            if e["from"] == e["to"]: err(f"{name}: edge {e['id']} is a self-loop")
        pairs = [frozenset((e["from"], e["to"])) for e in edges]
        if len(pairs) != len(set(pairs)): err(f"{name}: two edges connect the same node pair (not supported in MVP renderer)")
        steps = [i["step"] for i in nodes + edges]
    elif t == "sequence":
        actors, msgs = v["actors"], v["messages"]
        uniq(actors, "actor"); uniq(msgs, "message")
        aid = {a["id"] for a in actors}
        for m in msgs:
            if m["from"] not in aid or m["to"] not in aid: err(f"{name}: message {m['id']} references unknown actor")
            if m["from"] == m["to"]: err(f"{name}: message {m['id']} is a self-message")
        steps = [m["step"] for m in msgs]
        if steps != sorted(steps) or len(set(steps)) != len(steps): err(f"{name}: sequence steps must be strictly increasing")
    elif t == "cycle":
        uniq(v["nodes"], "node"); steps = [n["step"] for n in v["nodes"]]
        if steps != list(range(1, len(steps)+1)): err(f"{name}: cycle steps must be 1..n in order")
    elif t == "layers":
        uniq(v["layers"], "layer"); steps = [n["step"] for n in v["layers"]]
        if steps != list(range(1, len(steps)+1)): err(f"{name}: layer steps must be 1..n in order")
    if steps and sorted(set(steps)) != list(range(1, max(steps)+1)):
        err(f"{name}: steps must be contiguous from 1 (got {sorted(set(steps))})")
    # alias collisions after normalisation
    for a in doc.get("aliases", []):
        key = tuple(mr.content_tokens(a))
        if not key: err(f"{name}: alias '{a}' normalises to nothing")
        elif key in all_aliases and all_aliases[key] != cid: err(f"{name}: alias '{a}' collides with concept '{all_aliases[key]}'")
        else: all_aliases[key] = cid
    for k in doc.get("keywords", []):
        if k in mr.FILLER: err(f"{name}: keyword '{k}' is a filler word and can never match")

# fixtures
catalog = mr.load_catalog(ROOT)
fx = json.load(open(os.path.join(ROOT, "tests", "fixtures", "matcher-cases.json"), encoding="utf-8"))
seen = set()
for case in fx["cases"]:
    cid = case["id"]
    if cid in seen: err(f"fixture {cid}: duplicate id")
    seen.add(cid)
    raw = case["input"] if "input" in case else case["inputRepeat"]["char"] * case["inputRepeat"]["count"]
    got = mr.match(raw, catalog)
    exp = case["expect"]
    for k, v in exp.items():
        if k == "suggestionsInclude":
            if not all(x in got.get("suggestions", []) for x in v): err(f"fixture {cid}: suggestions {got.get('suggestions')} lack {v}")
        elif k == "suggestionsFirst":
            if got.get("suggestions", [None])[:1] != [v]: err(f"fixture {cid}: first suggestion {got.get('suggestions')} != {v}")
        elif k == "suggestionsEmpty":
            if got.get("suggestions") != []: err(f"fixture {cid}: expected no suggestions, got {got.get('suggestions')}")
        elif got.get(k) != v:
            err(f"fixture {cid} ({raw[:40]!r}): expected {k}={v!r}, got {got}")

if errors:
    print(f"FAILED with {len(errors)} problem(s):")
    for e in errors: print("  -", e)
    sys.exit(1)
print(f"OK: {len(files)} concept files valid; {len(fx['cases'])} matcher fixtures pass against the reference matcher.")
