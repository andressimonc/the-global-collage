# Option 1 cut-outs: Camila's hands and paper scraps lifted off her real cutting mat, so they can sit on the drawn one.
# Recipe: Vision subject lift (tools/bin/cutout) minus every mat-green / grid-yellow pixel, then split into pieces.
# Run from the project root with the Pillow venv:  python docs/option-1/make-cutouts.py <work-dir>
#   <work-dir> must already hold cut-110-all.png and cut-107-all.png, made with:
#   tools/bin/cutout "_source/Cool Collage Photos /bw-110.jpg" <work-dir>/cut-110-all.png all   (same for 107)
import sys
from PIL import Image, ImageChops, ImageFilter, ImageStat, ImageDraw

WORK = sys.argv[1]
OUT = 'public/option-1/img'
SRC = '_source/Cool Collage Photos /bw-%s.jpg'

def find_offset(src, cut):
    """The lift is cropped to the subject's extent: find where it sits in the source."""
    cw, ch = cut.size
    box = (cw // 2 - 150, ch // 2 - 150, cw // 2 + 150, ch // 2 + 150)
    c, best = cut.crop(box).convert('RGB'), None
    for dx in range(0, src.width - cw + 1, 4) if src.width != cw else [0]:
        for dy in range(0, src.height - ch + 1, 4) if src.height != ch else [0]:
            d = sum(ImageStat.Stat(ImageChops.difference(src.crop((box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy)), c)).sum)
            if best is None or d < best[0]: best = (d, dx, dy)
    return best[1], best[2]

def green_mask(src, grow=5):
    """255 where the picture is cutting mat (green) or its printed grid (yellow)."""
    h, s, v = src.convert('HSV').split()
    m = ImageChops.multiply(ImageChops.multiply(h.point(lambda x: 255 if 30 <= x <= 138 else 0), s.point(lambda x: 255 if x >= 56 else 0)), v.point(lambda x: 255 if x >= 22 else 0))
    return m.filter(ImageFilter.MaxFilter(grow))

def tidy(alpha):
    a = alpha.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7))      # drop specks
    a = a.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))          # close pinholes
    return a.filter(ImageFilter.GaussianBlur(2.2)).point(lambda x: 0 if x < 96 else min(255, (x - 96) * 3))

def lift(n, with_subject_mask=True):
    src = Image.open(SRC % n).convert('RGB')
    keep = ImageChops.invert(green_mask(src))
    if with_subject_mask:
        cut = Image.open(f'{WORK}/cut-{n}-all.png').convert('RGBA')
        alpha = Image.new('L', src.size, 0); alpha.paste(cut.getchannel('A'), find_offset(src, cut))
        keep = ImageChops.multiply(alpha, keep)
    out = src.convert('RGBA'); out.putalpha(tidy(keep))
    return out

def piece(img, poly, seed=None):
    """What of img lies inside poly (and, with a seed, only the island of paper the seed sits on), cropped."""
    m = Image.new('L', img.size, 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    a = ImageChops.multiply(img.getchannel('A'), m)
    if seed:
        solid = a.point(lambda x: 255 if x > 40 else 0)
        ImageDraw.floodfill(solid, seed, 128)
        island = solid.point(lambda x: 255 if x == 128 else 0).filter(ImageFilter.MaxFilter(7))
        a = ImageChops.multiply(a, island)
    out = img.copy(); out.putalpha(a)
    box = a.getbbox()
    return out.crop(box), box, a

def erase(img, polys=(), masks=()):
    a = img.getchannel('A'); d = ImageDraw.Draw(a)
    for p in polys: d.polygon(p, fill=0)
    for m in masks: a = ImageChops.multiply(a, ImageChops.invert(m.point(lambda x: 255 if x else 0).filter(ImageFilter.MaxFilter(13))))
    img.putalpha(a)

def save(img, name, width):
    if img.width > width: img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    img.save(f'{OUT}/{name}.webp', quality=84, method=6); print(name, img.size)

# --- bw-110: Camila bent over the mat, both hands, the knife, the pieces -----------------------------------
full = lift('110')
full = full.crop(full.getchannel('A').getbbox())
full = full.resize((1800, round(full.height * 1800 / full.width)), Image.LANCZOS)   # polygons below are in this 1800-wide space
scraps = {   # name: (rough region, a point on the piece)
    'scrap-eye':   ([(785, 1410), (1190, 1410), (1190, 1840), (1100, 1815), (842, 1700), (785, 1560)], (1010, 1585)),
    'scrap-strip': ([(1105, 1482), (1232, 1442), (1338, 1423), (1398, 1368), (1525, 1450), (1525, 1665), (1105, 1665)], (1300, 1500)),
    'scrap-ell':   ([(540, 1560), (785, 1560), (842, 1700), (1100, 1815), (1180, 1840), (1180, 2011), (540, 2011)], (920, 1830)),
}
# a magazine page and a black offcut that the lift kept between her hair and her right arm
junk = [(1040, 772), (1090, 800), (1150, 792), (1220, 782), (1285, 770), (1310, 745), (1335, 715), (1350, 670), (1352, 620), (1385, 575), (1400, 520), (1412, 470), (1430, 470), (1432, 600), (1434, 750), (1438, 870), (1426, 900), (1412, 938), (1395, 965), (1350, 985), (1300, 1005), (1255, 1022), (1215, 1040), (1150, 960), (1100, 920), (1040, 840)]
masks = []
for name, (poly, seed) in scraps.items():
    img, box, mask = piece(full, poly, seed); masks.append(mask); save(img, name, 420)
    print(f'  {name}: left {box[0] / full.width:.4f}  top {box[1] / full.height:.4f}  width {(box[2] - box[0]) / full.width:.4f}  of the hero-hands canvas')
shard = [(1560, 1380), (1612, 1366), (1700, 1380), (1760, 1430), (1760, 1560), (1698, 1560)]   # black offcut jutting out past her little finger
below = [[(0, 1560), (1800, 1560), (1800, 2011), (0, 2011)], [(800, 1500), (1500, 1500), (1500, 1560), (800, 1560)]]   # crumbs left where the pieces were
erase(full, [junk, shard] + below, masks)
print('hero-hands canvas', full.size)
save(full, 'hero-hands-1500', 1500); save(full, 'hero-hands-800', 800)

# --- spare scraps for other sections ----------------------------------------------------------------------
lips, _, _ = piece(lift('119', with_subject_mask=False), [(1528, 1525), (1600, 1560), (1690, 1640), (1696, 1800), (1650, 1905), (1565, 1870), (1498, 1700)], (1600, 1720))
save(lips, 'scrap-lips', 300)
k107 = 3674 / 1800
eye, _, _ = piece(lift('107'), [(x * k107, y * k107) for x, y in [(630, 280), (880, 225), (962, 390), (700, 458)]])
save(eye, 'scrap-eye-square', 420)

# --- drawn parts of the mat: the rulers and the torn-paper edges (plain SVG, no photos) -------------------
import random
LINE = '#F7F0B4'
def ruler(n, vertical):
    """n units of 64px: a tick every 1/8, longer at 1/2 and 1, a number at every unit."""
    L, parts = n * 64, []
    for i in range(n * 8 + 1):
        p, t = i * 8, (14 if i % 8 == 0 else 9 if i % 4 == 0 else 5)
        parts.append(f'M0 {p}h{t}' if vertical else f'M{p} 0v{t}')
    nums = ''.join((f'<text x="18" y="{k * 64 + 4}">{k}</text>' if vertical else f'<text x="{k * 64}" y="27" text-anchor="middle">{k}</text>') for k in range(1, n))
    w, h = (34, L) if vertical else (L, 34)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<path d="{"".join(parts)}" stroke="{LINE}" stroke-width="1.2" fill="none"/>'
            f'<g fill="{LINE}" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" font-weight="700" font-size="11">{nums}</g></svg>')
open(f'{OUT}/ruler-x.svg', 'w').write(ruler(40, False))
open(f'{OUT}/ruler-y.svg', 'w').write(ruler(160, True))

def torn(seed, flip):
    """A 240x12 tile whose one long edge is torn; tiles end to end. Black = paper (used as a CSS mask)."""
    r, pts, x, y = random.Random(seed), [], 0, 5.0
    while x < 240:
        pts.append((x, y)); x += r.choice([2, 3, 3, 4, 6, 9]); y = min(10.5, max(1.5, y + r.uniform(-2.6, 2.6)))
    pts.append((240, pts[0][1]))
    d = 'M0 12L' + ' '.join(f'{px} {py:.1f}' for px, py in pts) + ' 240 12Z'
    t = ' transform="matrix(1 0 0 -1 0 12)"' if flip else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="12" viewBox="0 0 240 12" preserveAspectRatio="none"><path d="{d}"{t}/></svg>'
open(f'{OUT}/torn-top.svg', 'w').write(torn(7, False))
open(f'{OUT}/torn-bottom.svg', 'w').write(torn(19, True))
