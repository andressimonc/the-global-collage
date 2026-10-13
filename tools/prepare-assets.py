"""Turn Camila's Drive folder (_source/) into web images, fonts, a manifest and a sample catalogue.

    <venv>/bin/python tools/prepare-assets.py [contact-sheet-dir]

Needs Pillow. Safe to re-run: it rewrites public/shared/{img,brand,fonts} and docs/manifest.json.
Every web image records the Drive file it came from, so "where did this picture come from" is
answered by docs/manifest.json, not by memory.
"""
import hashlib, json, re, shutil, sys
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
SRC, PUB = ROOT / "_source", ROOT / "public" / "shared"
SHEETS = Path(sys.argv[1]) if len(sys.argv) > 1 else None
WIDTHS, ZOOM = [480, 960, 1600], 2400  # ZOOM is made for artworks only

# folder in the Drive -> section on the site (order matters: first match wins)
SECTIONS = [
    ("03 — Shop/Originals/framed art", "shop/framed"),
    ("03 — Shop/Originals", "shop/originals"),
    ("03 — Shop/Prints & POD Goods", "shop/prints"),
    ("02 — About/Portraits & Studio", "about/portrait"),
    ("02 — About/Process Shots", "about/process"),
    ("05 — Exhibition/The Local Collage", "exhibition/local-collage"),
    ("05 — Exhibition/Tripping Animals — On The Wall/2024", "exhibition/tripping-animals-2024"),
    ("05 — Exhibition/Tripping Animals — On The Wall/2025", "exhibition/tripping-animals-2025"),
    ("05 — Exhibition/Studio 18 — Kaleidoscope 2026", "exhibition/studio-18"),
    ("05 — Exhibition/Unsin Festival 2025", "exhibition/unsin"),
    ("05 — Exhibition/Coconut Grove Arts Festival 2025", "exhibition/coconut-grove"),
    ("06 — Commissions/Finished Commissions", "commissions/finished"),
    ("06 — Commissions/In Progress", "commissions/in-progress"),
    ("04 — Services/Creative Direction", "services/creative-direction"),
    ("04 — Services/Art Direction & Set Dressing", "services/art-direction"),
    ("04 — Services/Content Creation", "services/content-creation"),
    ("01 — Home/Hero — Statement Piece", "home/hero"),
    ("01 — Home/About Teaser — Portrait", "home/portrait"),
    ("01 — Home/Featured Work (3 to 6 pieces)", "home/featured"),
    ("07 — Contact", "contact"),
    ("Cool Collage Photos ", "collage-photos"),
    ("00 — Brand & Logos/Banner.png", "brand"),
]

# Titles exactly as Camila filed them. Spelling questions go in TO-CONFIRM.md, not here.
ORIGINALS = {
    "001-curiosity": ("Curiosity", 2023), "003-artstract": ("Artstract", 2025),
    "004-modern-love": ("Modern Love", 2024), "005-candy": ("Candy", 2024),
    "006-the-art-of-art": ("The Art of Art", 2025), "007-senor-tigre": ("Senor Tigre", 2025),
    "008-stuck": ("Stuck", 2025), "009-home": ("Home", 2023), "010-zenda-beach": ("Zenda Beach", 2023),
    "011-looking": ("Looking", 2023), "012-society": ("Society", 2025),
    "013-tears-water-the-soul-green": ("Tears Water The Soul - Green", 2025),
    "016-royal-love-story": ("Royal Love Story", 2025), "017-be-you": ("Be You", 2024),
    "018-small-world": ("Small World", 2023), "019-blues": ("Blues", 2025),
    "021-reflections-of-me": ("Reflections of Me", 2024), "022-i-am-the-bad-guy": ("I Am the Bad Guy", 2025),
    "2025_Gaga's Offering_Collage_300dpi": ("Gaga's Offering", 2025),
    "Day # 25 Dibujo Medium": ("Day # 25", None), "Female Cactus": ("Female Cactus", None),
    "Let Out by Camila Castillo": ("Let Out", None), "Lucky Pleasures by Camila Castillo": ("Lucky Pleasures", None),
    "Tears Water The Soul - Pink": ("Tears Water The Soul - Pink", None),
    "Tears Water The Soul - Silver": ("Tears Water The Soul - Silver", None),
}
ARTWORK_SECTIONS = {"shop/originals", "commissions/finished"}
KNOWN = {  # facts written in the file names
    "The Local Collage #3 The Butterfly Effect_30x30 inches_Collage on Canvas_Camila Castillo":
        {"title": "The Local Collage #3: The Butterfly Effect", "dimensions": "30 x 30 in", "medium": "Collage on canvas", "artwork": True},
    "Feet on the ground_12x16 inches_Collage on Paper_Camila Castillo":
        {"title": "Feet on the Ground", "dimensions": "12 x 16 in", "medium": "Collage on paper", "artwork": True},
}


def slug(s):
    s = s.lower().replace("#", " no ").replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def hexc(rgb):
    return "#%02X%02X%02X" % tuple(int(v) for v in rgb[:3])


def palette(im):
    """Average colour and up to 5 dominant colours, ignoring see-through pixels."""
    t = im.copy(); t.thumbnail((96, 96))
    rgba = t.convert("RGBA")
    px = [p[:3] for p in rgba.get_flattened_data() if p[3] > 128] or [(255, 255, 255)]
    avg = tuple(sum(c[i] for c in px) / len(px) for i in range(3))
    flat = Image.new("RGB", (len(px), 1)); flat.putdata(px)
    q = flat.quantize(colors=5, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[:15]
    ranked = sorted(q.getcolors(), reverse=True)
    return hexc(avg), [hexc(pal[i * 3:i * 3 + 3]) for _, i in ranked]


def has_alpha(im):
    if im.mode not in ("RGBA", "LA", "PA") and "transparency" not in im.info:
        return False
    a = im.convert("RGBA").getchannel("A"); a.thumbnail((200, 200))
    return a.getextrema()[0] < 250


def save_web(im, dest, width, alpha):
    w, h = im.size
    out = im if width >= w else im.resize((width, round(h * width / w)), Image.Resampling.LANCZOS)
    out = out.convert("RGBA" if alpha else "RGB")
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "WEBP", quality=84 if alpha else 80, method=5)


def main():
    for d in ("img", "brand", "fonts"):
        shutil.rmtree(PUB / d, ignore_errors=True)
    manifest, seen, sheets = [], {}, {}
    files = sorted(p for p in SRC.rglob("*") if p.suffix.lower() in (".png", ".jpg", ".jpeg") and "FONTS" not in p.parts)
    for path in files:
        rel = path.relative_to(SRC).as_posix()
        section = next((s for prefix, s in SECTIONS if rel.startswith(prefix)), None)
        if "00 — Brand & Logos/LOGO/" in rel:
            if path.suffix.lower() != ".png":
                print("skipped (the PNG of this logo is used):", rel); continue
            section = "logo"
        if section is None:
            print("skipped (not for the site):", rel); continue
        digest = hashlib.md5(path.read_bytes()).hexdigest()
        if digest in seen:
            print("skipped (same file as %s): %s" % (seen[digest], rel)); continue
        seen[digest] = rel

        im = ImageOps.exif_transpose(Image.open(path))
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if has_alpha(im) else "RGB")
        alpha = has_alpha(im)
        w, h = im.size
        stem = path.stem.strip()
        entry = {"section": section, "source": rel, "width": w, "height": h, "ratio": round(w / h, 4), "alpha": alpha}
        entry["avg"], entry["palette"] = palette(im)
        if section != "logo" and w < 1200:
            entry["lowres"] = True  # too small to show large: ask Camila for a bigger file

        if section == "logo":
            name = slug(stem.replace("TGC ", ""))  # icon-black, logo-white-v1, text-only-black-v2 ...
            entry["id"] = "logo/" + name
            bbox = im.getchannel("A").getbbox() if alpha else None
            if bbox: im = im.crop(bbox)  # trim the empty margin so the logo sits where CSS puts it
            entry["width"], entry["height"] = im.size; entry["ratio"] = round(im.size[0] / im.size[1], 4)
            sizes = {}
            for width in (400, 1000):
                dest = PUB / "brand" / f"{name}-{width}.webp"
                out = im.resize((width, round(im.size[1] * width / im.size[0])), Image.Resampling.LANCZOS)
                dest.parent.mkdir(parents=True, exist_ok=True); out.save(dest, "WEBP", lossless=True, method=6)
                sizes[str(width)] = f"shared/brand/{name}-{width}.webp"
            entry["sizes"] = sizes
        else:
            key = next((k for k in ORIGINALS if stem.startswith(k)), None) if section == "shop/originals" else None
            artwork = section in ARTWORK_SECTIONS or stem in KNOWN
            if key:
                title, year = ORIGINALS[key]
                number = key[:3] if key[:3].isdigit() else None
                name = slug(title)
                entry.update({"title": title, "year": year, "number": number, "artwork": True})
            else:
                name = slug(stem)[:60]
            if stem in KNOWN:
                entry.update(KNOWN[stem]); name = slug(KNOWN[stem]["title"])
            entry["id"] = f"{section}/{name}"
            sizes = {}
            widths = [x for x in WIDTHS + ([ZOOM] if artwork else []) if x < w] or [w]
            if w > max(widths) and not artwork and max(widths) < WIDTHS[-1]:
                widths.append(w)
            for width in widths:
                dest = PUB / "img" / section / f"{name}-{width}.webp"
                save_web(im, dest, width, alpha)
                sizes[str(width)] = dest.relative_to(ROOT / "public").as_posix()
            entry["sizes"] = sizes
            thumb = im.copy(); thumb.thumbnail((300, 300)); sheets.setdefault(section, []).append((name, thumb.convert("RGB") if not alpha else thumb))
        manifest.append(entry)
        print("ok", entry["id"], f"{w}x{h}", "alpha" if alpha else "")

    # fonts: Neco is free for commercial web use (Fontshare). TT Interphases Pro here is a TRIAL.
    neco = SRC / "00 — Brand & Logos/FONTS/Neco_Complete/Fonts/WEB/fonts"
    (PUB / "fonts").mkdir(parents=True, exist_ok=True)
    for f in ("Neco-Variable.woff2", "Neco-VariableItalic.woff2"):
        shutil.copy(neco / f, PUB / "fonts" / f)
    tt = SRC / "00 — Brand & Logos/FONTS/tt_interphases_pro"
    for src, dst in (("TT Interphases Pro Trial Variable.ttf", "TTInterphasesProTrial-Variable.ttf"),
                     ("TT Interphases Pro Mono Trial Var Roman.ttf", "TTInterphasesProMonoTrial-Variable.ttf"),
                     ("TT Interphases Pro Mono Trial Var Italic.ttf", "TTInterphasesProMonoTrial-VariableItalic.ttf")):
        shutil.copy(tt / src, PUB / "fonts" / dst)

    manifest.sort(key=lambda e: e["id"])
    (ROOT / "docs").mkdir(exist_ok=True)
    (ROOT / "docs" / "manifest.json").write_text(json.dumps(manifest, indent=1, ensure_ascii=False))

    # Sample catalogue in the shape the shop layer returns. Titles and years are real (file names);
    # prices, sizes and stories are NOT known yet and stay null until Shopify is connected.
    products = []
    for e in manifest:
        if e["section"] != "shop/originals":
            continue
        handle = e["id"].split("/")[-1]
        products.append({
            "handle": handle, "title": e["title"], "type": "original", "year": e["year"], "number": e.get("number"),
            "medium": "Mixed-media collage on paper, recycled magazines and found materials",
            "dimensions": None, "story": None, "available": True,
            # SAMPLE price: her copy says "Originals from $111"; the real price per piece comes from Shopify.
            "price": {"amount": 111, "currency": "USD"}, "sampleFields": ["price"],
            "badge": "Original, 1 of 1", "shipping": "Ships from Miami, insured, US only",
            "variantId": f"sample-{handle}",
            "images": [{"sizes": e["sizes"], "width": e["width"], "height": e["height"], "alt": None, "avg": e["avg"], "lowres": e.get("lowres", False)}],
        })
    products.sort(key=lambda p: (p["number"] is None, p["number"] or "", p["title"]))
    (PUB / "shop").mkdir(parents=True, exist_ok=True)
    (PUB / "shop" / "products.sample.json").write_text(json.dumps({"sample": True, "products": products}, indent=1, ensure_ascii=False))

    if SHEETS:
        SHEETS.mkdir(parents=True, exist_ok=True)
        for section, tiles in sheets.items():
            cols = 5; rows = -(-len(tiles) // cols)
            sheet = Image.new("RGB", (cols * 320, rows * 340), (120, 120, 120))
            d = ImageDraw.Draw(sheet)
            for i, (name, t) in enumerate(tiles):
                x, y = (i % cols) * 320 + 10, (i // cols) * 340 + 10
                if t.mode == "RGBA":
                    sheet.paste(t, (x + (300 - t.width) // 2, y + (300 - t.height) // 2), t)
                else:
                    sheet.paste(t, (x + (300 - t.width) // 2, y + (300 - t.height) // 2))
                d.text((x, y + 304), name[:44], fill=(255, 255, 255))
            sheet.save(SHEETS / f"sheet-{section.replace('/', '_')}.jpg", quality=82)
    print(len(manifest), "images in the manifest;", len(products), "sample products")


if __name__ == "__main__":
    main()
