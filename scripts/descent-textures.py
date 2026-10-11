"""Build the Earth and Moon textures for the descent (public/descent/tex).

Sources (NASA, public domain), downloaded into .textures-src/ (git-ignored):
  Moon  lroc_color_poles_8k.tif, ldem_16.tif   CGI Moon Kit, svs.gsfc.nasa.gov/4720
  Earth world.topo.bathy.200407.3x21600x10800.jpg  Blue Marble NG, topography and bathymetry
        world.200407.3x21600x10800.jpg       Blue Marble NG, plain ocean (for the water mask)
        BlackMarble_2016_3km.jpg             Black Marble 2016, night lights
        cloud_combined_8192.tif              Blue Marble clouds

Writes each map as WebP at 2048, 4096 and 8192 px wide (equirectangular,
north up, longitude -180..180 left to right; the Moon's relief stops at 4096,
the resolution of its elevation data). Run from the repo root:
  python3 scripts/descent-textures.py
"""
import pathlib

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / ".textures-src"
OUT = ROOT / "public" / "descent" / "tex"
SIZES = {"2k": 2048, "4k": 4096, "8k": 8192}
MOON_R_KM = 1737.4


def save(img: Image.Image, name: str, largest=8192):
    for tag, w in SIZES.items():
        if w > largest:
            continue
        out = img if img.width == w else img.resize((w, w // 2), Image.LANCZOS)
        path = OUT / f"{name}-{tag}.webp"
        out.save(path, quality=82, method=6)
        print(f"{path.relative_to(ROOT)}  {path.stat().st_size / 1e6:.1f} MB")


def shrink(img: Image.Image, w=8192):
    # Halve with box filtering first: much faster than one big Lanczos step.
    while img.width >= 2 * w:
        img = img.reduce(2)
    return img.resize((w, w // 2), Image.LANCZOS)


def earth():
    day = Image.open(SRC / "world.topo.bathy.200407.3x21600x10800.jpg").convert("RGB")
    save(shrink(day), "earth-day")

    # Water: open ocean in the plain Blue Marble is (2, 5, 20); lakes are a
    # similar near-black blue. Masked at full size, then averaged down, so
    # coastlines come out antialiased.
    plain = np.asarray(Image.open(SRC / "world.200407.3x21600x10800.jpg").convert("RGB"))
    r, g, b = (plain[..., i].astype(np.int16) for i in range(3))
    water = ((r < 10) & (g < 14) & (b < 30) & (b >= g)).astype(np.uint8) * 255
    del plain, r, g, b
    save(shrink(Image.fromarray(water, "L")), "earth-water")

    # Night lights: the red channel, which separates the warm city lights
    # from the blue-black ground (the shader thresholds it).
    night = Image.open(SRC / "BlackMarble_2016_3km.jpg").convert("RGB").getchannel("R")
    save(shrink(night), "earth-night")

    # This composite is cloudier than the map the design was tuned with, so
    # thin haze is cut and the rest eased down to about the same coverage.
    c = np.asarray(Image.open(SRC / "cloud_combined_8192.tif").convert("L"), dtype=np.float32) / 255
    c = np.clip((c - 0.1) / 0.9, 0, 1) ** 1.6
    save(Image.fromarray(np.round(c * 255).astype(np.uint8), "L"), "earth-clouds")


def moon():
    albedo = Image.open(SRC / "lroc_color_poles_8k.tif").convert("L")
    save(albedo, "moon")

    # Relief: surface normals from the LOLA elevation model (km above the
    # mean radius). Stored as the east and the north tilt of the normal, each
    # in its own greyscale image (128 = flat): WebP keeps grey sharp but would
    # blur two tilts packed into the colour channels.
    h = Image.open(SRC / "ldem_16.tif")
    h = np.asarray(h.resize((4096, 2048), Image.BICUBIC), dtype=np.float64)
    rows, cols = h.shape
    lat = np.deg2rad(90 - (np.arange(rows) + 0.5) * 180 / rows)
    px = np.pi * MOON_R_KM / rows                       # km per pixel north-south
    dx = px * np.maximum(np.cos(lat), 0.02)[:, None]    # and east-west, per row
    east = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) / (2 * dx)
    north = np.zeros_like(h)
    north[1:-1] = (h[:-2] - h[2:]) / (2 * px)           # row 0 is the north edge
    n = np.stack([-east, -north, np.ones_like(h)], axis=-1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    for i, name in enumerate(["moon-tilt-east", "moon-tilt-north"]):
        tilt = np.clip(np.round(n[..., i] * 127.5 + 127.5), 0, 255).astype(np.uint8)
        save(Image.fromarray(tilt, "L"), name, largest=4096)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    moon()
    earth()
