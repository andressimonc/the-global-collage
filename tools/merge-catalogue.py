"""Join the readers' picture descriptions (docs/catalogue/*.json) into docs/catalogue.json,
check them against docs/manifest.json, and copy alt text and framed photos into the sample
catalogue. Plain python3, no dependencies. Re-run any time a description changes.

    python3 tools/merge-catalogue.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
manifest = {e["id"]: e for e in json.loads((ROOT / "docs/manifest.json").read_text())}
entries = {}
for part in sorted((ROOT / "docs/catalogue").glob("*.json")):
    for e in json.loads(part.read_text()):
        entries[e["id"]] = e

wanted = {i for i, e in manifest.items() if e["section"] != "logo"}
missing = sorted(wanted - entries.keys())
extra = sorted(i for i in entries.keys() - wanted if not i.startswith("video/"))
for i, e in entries.items():  # carry the measured facts next to the description
    m = manifest.get(i, {})
    for k in ("section", "sizes", "width", "height", "ratio", "avg", "palette", "lowres", "title", "year", "dimensions", "medium"):
        if k in m:
            e[k] = m[k]
out = sorted(entries.values(), key=lambda e: e["id"])
(ROOT / "docs/catalogue.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))

sample_path = ROOT / "public/shared/shop/products.sample.json"
sample = json.loads(sample_path.read_text())
framed = {}
for e in out:
    if e.get("kind") == "framed" and e.get("shows") and e.get("quality") != "poor":
        framed.setdefault(e["shows"], []).append(e)
handles = {p["handle"] for p in sample["products"]}
for p in sample["products"]:
    art = entries.get(f"shop/originals/{p['handle']}")
    first = p["images"][0]
    if art and art.get("alt"):
        first["alt"] = art["alt"]
    p["images"] = [first] + [
        {"sizes": f["sizes"], "width": f["width"], "height": f["height"], "alt": f.get("alt"), "avg": f["avg"], "lowres": False, "framed": True}
        for f in framed.get(p["handle"], [])[:2]
    ]
sample_path.write_text(json.dumps(sample, indent=1, ensure_ascii=False))

bad_shows = sorted({e["shows"] for e in out if e.get("shows") and e["shows"] not in handles})
print(len(out), "pictures described;", sum(1 for p in sample["products"] if p["images"][0].get("alt")), "of", len(sample["products"]), "products have alt text;",
      sum(len(p["images"]) - 1 for p in sample["products"]), "framed photos attached")
if missing: print("NOT DESCRIBED:", missing)
if extra: print("NOT IN MANIFEST:", extra)
if bad_shows: print("'shows' names no product:", bad_shows)
