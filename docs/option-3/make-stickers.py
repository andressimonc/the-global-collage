"""Option 3 "Sticker Pop": turn a cut-out (transparent PNG from tools/bin/cutout) into a die-cut sticker.

  <venv python> docs/option-3/make-stickers.py <cutout.png|.webp> <out-base> [--part N] [--sizes 480,960] [--border 0.034]
                                                [--erode N] [--keyline]

Writes <out-base>-<size>.webp for each size (size = the subject's long side; the white border is added outside it).
--part N keeps only the N-th largest separate island of the cut-out (1 = largest). Prints the islands it found.
--border is a share of the subject's long side: aim for 8 to 12 px at the size it is shown (small scraps need 0.07 to 0.09).
--erode N shaves N pixels off the cut-out first (a backdrop colour riding along the edge, as on Camila's portrait).
--keyline draws a thin ink line between the picture and the white border (a white shirt on a white border needs a contour).
The white border is baked in (smooth, rounded, holes filled, like a real die-cut); the hard shadow is CSS (.sticker).
"""
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

def islands(alpha, cell=6):
    """Separate opaque islands, largest first, as (area, bbox) in full-size pixels."""
    small = alpha.resize((max(1, alpha.width // cell), max(1, alpha.height // cell)), Image.BILINEAR).point(lambda v: 255 if v > 100 else 0)
    found, label, px = [], 1, small.load()
    for y in range(small.height):
        for x in range(small.width):
            if px[x, y] == 255:
                ImageDraw.floodfill(small, (x, y), label)
                box = small.point(lambda v, l=label: 255 if v == l else 0).getbbox()
                area = small.histogram()[label]
                found.append((area, label, box))
                label += 1
                if label >= 250: break
        if label >= 250: break
    found.sort(reverse=True)
    return small, cell, found

def keep_part(im, n):
    alpha = im.getchannel('A')
    small, cell, found = islands(alpha)
    print('islands:', [(a, tuple(v * cell for v in b)) for a, _, b in found[:8]])
    area, label, box = found[n - 1]
    mask = small.point(lambda v: 255 if v == label else 0).filter(ImageFilter.MaxFilter(3)).resize(alpha.size, Image.BILINEAR)
    im.putalpha(ImageChops.multiply(alpha, mask))
    return im

def sticker(im, size, border, keyline=False):
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
    work = min(size * 2, max(im.size))                      # draw at 2x, then shrink: clean edges
    im = im.resize((round(im.width * work / max(im.size)), round(im.height * work / max(im.size))), Image.LANCZOS)
    b = max(4, round(border * work))                        # border thickness at working size
    pad = b * 2
    canvas = Image.new('RGBA', (im.width + pad * 2, im.height + pad * 2), (255, 255, 255, 0))
    canvas.paste(im, (pad, pad))
    alpha = canvas.getchannel('A')
    solid = alpha.point(lambda v: 255 if v > 110 else 0)
    # the border: grow the shape by about b with round corners, then smooth the outline
    grown = solid.filter(ImageFilter.GaussianBlur(b / 1.3)).point(lambda v: 255 if v > 26 else 0)
    thin = solid
    for _ in range(max(1, round(b * 0.5 / 2))):             # thin spikes keep at least half a border
        thin = thin.filter(ImageFilter.MaxFilter(5))
    grown = ImageChops.lighter(grown, thin).filter(ImageFilter.GaussianBlur(b * 0.4)).point(lambda v: 255 if v > 127 else 0)
    outside = grown.copy()
    ImageDraw.floodfill(outside, (0, 0), 128)               # everything not reached from the corner is sticker
    shape = outside.point(lambda v: 0 if v == 128 else 255).filter(ImageFilter.GaussianBlur(1.1))
    # the picture: trim one pixel of fringe so no background colour rides along
    inner = ImageChops.multiply(alpha, solid.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.9)))
    out = Image.new('RGBA', canvas.size, (255, 255, 255, 0))
    out.putalpha(shape)
    if keyline:                                             # ink contour just outside the picture, inside the border
        k = max(3, round(work / 300)) | 1
        out.paste((35, 31, 32), (0, 0), solid.filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.GaussianBlur(0.8)))
    out.paste(canvas.convert('RGB'), (0, 0), inner)
    out.putalpha(shape)
    out = out.crop(shape.point(lambda v: 255 if v > 8 else 0).getbbox())
    scale = size / work
    return out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)

if __name__ == '__main__':
    args = sys.argv[1:]
    opt = lambda name, default: args[args.index(name) + 1] if name in args else default
    src, base = args[0], args[1]
    im = Image.open(src).convert('RGBA')
    if '--part' in args: im = keep_part(im, int(opt('--part', 1)))
    if '--erode' in args:
        im.putalpha(im.getchannel('A').filter(ImageFilter.MinFilter(2 * int(opt('--erode', 1)) + 1)))
    for size in [int(s) for s in opt('--sizes', '480,960').split(',')]:
        out = sticker(im.copy(), size, float(opt('--border', 0.034)), '--keyline' in args)
        out.save(f'{base}-{size}.webp', 'WEBP', quality=86, method=6)
        print(f'{base}-{size}.webp', out.size)
