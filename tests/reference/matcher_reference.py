"""Executable reference for docs/CONCEPT_MATCHING.md.

This is NOT the product implementation. It exists so the fixtures in
tests/fixtures/matcher-cases.json are provably consistent with the written spec.
The TypeScript implementation (task FM-103) must produce the same results for
every fixture. Once that passes in CI, this file may be kept or deleted.
"""
import json, glob, os, re, unicodedata

MAX_INPUT_LENGTH = 200
FILLER = {"explain","show","me","what","whats","s","is","are","how","does","do","work","works","tell","about",
          "describe","diagram","visual","visualize","of","the","a","an","please","can","you","give","i","want",
          "to","see","and","for","in","with","on"}

def tokens_of(text):
    t = unicodedata.normalize("NFKD", text)
    t = "".join(ch for ch in t if not unicodedata.combining(ch)).lower()
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return t.split()

def content_tokens(text):
    return [t for t in tokens_of(text) if t not in FILLER]

def load_catalog(root):
    cat = []
    for path in sorted(glob.glob(os.path.join(root, "content", "concepts", "*.json"))):
        with open(path, encoding="utf-8") as f:
            c = json.load(f)
        c["_aliases"] = sorted({tuple(content_tokens(a)) for a in c["aliases"] if content_tokens(a)})
        c["_keywords"] = set(content_tokens(" ".join(c["keywords"])))
        cat.append(c)
    return sorted(cat, key=lambda c: c["id"])

def contains(seq, sub):
    n = len(sub)
    return any(seq[i:i+n] == list(sub) for i in range(len(seq) - n + 1))

def match(raw, catalog):
    if raw is None or raw.strip() == "":
        return {"status": "invalid", "reason": "empty"}
    if len(raw) > MAX_INPUT_LENGTH:
        return {"status": "invalid", "reason": "too_long"}
    all_tokens = tokens_of(raw)
    if not all_tokens:
        if any(ch.isalpha() for ch in raw):   # letters we cannot fold to ASCII (e.g. other scripts)
            return {"status": "none", "suggestions": []}
        return {"status": "invalid", "reason": "no_content"}
    toks = [t for t in all_tokens if t not in FILLER]
    if not toks:
        return {"status": "invalid", "reason": "no_content"}

    # Tier 1: exact alias; Tier 2: alias as contiguous whole-word phrase. Longest alias (token count) wins.
    best = {}   # concept id -> (tier, alias_len)
    for c in catalog:
        for alias in c["_aliases"]:
            if list(alias) == toks:
                cand = (1, len(alias))
            elif contains(toks, alias):
                cand = (2, len(alias))
            else:
                continue
            if c["id"] not in best or (cand[0], -cand[1]) < (best[c["id"]][0], -best[c["id"]][1]):
                best[c["id"]] = cand
    if best:
        top_tier = min(v[0] for v in best.values())
        pool = {k: v for k, v in best.items() if v[0] == top_tier}
        top_len = max(v[1] for v in pool.values())
        winners = sorted(k for k, v in pool.items() if v[1] == top_len)
        if len(winners) == 1:
            return {"status": "match", "conceptId": winners[0], "tier": top_tier}
        return {"status": "ambiguous", "candidates": winners}

    # Tier 3: suggestions only (never auto-displayed)
    scored = []
    for c in catalog:
        shared = len(set(toks) & c["_keywords"])
        if shared:
            scored.append((-shared, c["id"]))
    scored.sort()
    return {"status": "none", "suggestions": [cid for _, cid in scored[:3]]}
