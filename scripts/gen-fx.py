"""Procedural FX sprites + seamless textures for Reveal Night.

Pollinations was the planned source, but the connected account has no balance, so every
sprite/texture here is generated from filtered noise (deterministic seeds). No vehicles, no text.
Usage: python3 -I scripts/gen-fx.py <project-root>
"""
import sys
import numpy as np
from PIL import Image

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
rng = np.random.default_rng(2028)


def periodic_noise(h, w, scale, seed):
    """Tileable noise: white noise low-passed in the frequency domain (periodic by construction)."""
    r = np.random.default_rng(seed)
    f = np.fft.fft2(r.standard_normal((h, w)))
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    k = np.exp(-((fx ** 2 + fy ** 2) * (scale ** 2)))
    n = np.real(np.fft.ifft2(f * k))
    n -= n.min()
    return n / (n.max() + 1e-9)


def fbm(h, w, seed, octaves=(256, 96, 40, 16, 6), weights=(0.45, 0.25, 0.15, 0.1, 0.05)):
    acc = np.zeros((h, w))
    for i, (s, wt) in enumerate(zip(octaves, weights)):
        acc += periodic_noise(h, w, s, seed + i * 13) * wt
    return acc / sum(weights)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def save_gray(arr, path, size=None, quality=88):
    img = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), "L").convert("RGB")
    if size:
        img = img.resize(size, Image.LANCZOS)
    img.save(path, quality=quality, optimize=True)


def smoke(seed, n=1024):
    """Cauliflower billows: each puff is a lit sphere; puffs combine with max() so crevices stay darker."""
    r = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:n, 0:n] / n
    warp = fbm(n, n, seed * 3, octaves=(140, 50), weights=(0.7, 0.3)) - 0.5
    wx, wy = xx + warp * 0.05, yy + warp * 0.05
    out = np.zeros((n, n))
    for _ in range(int(r.integers(30, 44))):
        cy = r.uniform(0.3, 0.72)
        spread = 0.14 + (cy - 0.3) * 0.34
        cx = 0.5 + r.normal(0, spread * 0.5)
        R = r.uniform(0.07, 0.15) * (0.85 + (cy - 0.3) * 0.8)
        dx, dy = (wx - cx) / R, (wy - cy) / R
        q = 1 - (dx * dx + dy * dy)
        prof = np.sqrt(np.clip(q, 0, 1))
        light = 0.5 + 0.38 * np.clip(-dy * 0.8 - dx * 0.3, -1, 1) + 0.12 * prof
        out = np.maximum(out, prof ** 0.6 * light)
    detail = fbm(n, n, seed * 7, octaves=(60, 24, 9), weights=(0.5, 0.3, 0.2))
    out = out * (0.78 + 0.4 * detail)
    soft = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).resize((n // 4, n // 4), Image.BILINEAR).resize((n, n), Image.BICUBIC)
    out = np.asarray(soft).astype(float) / 255 * 0.72 + out * 0.28
    edge = smoothstep(0.0, 0.55, out)
    window = smoothstep(0.5, 0.32, np.sqrt((xx - 0.5) ** 2 + (yy - 0.52) ** 2))
    return np.clip(out * edge * window * 1.05, 0, 1)


def vapor_jet(w=512, h=1024):
    yy, xx = np.mgrid[0:h, 0:w]
    v = yy / h
    u = (xx / w - 0.5)
    width = 0.03 + v * 0.22
    core = np.exp(-(u ** 2) / (2 * width ** 2))
    streaks = periodic_noise(h, w, 10, 91)
    streaks = 0.6 + 0.6 * np.repeat(streaks[:1, :], h, axis=0) * 0.5 + 0.3 * fbm(h, w, 33, octaves=(60, 24, 10), weights=(0.5, 0.3, 0.2))
    fade = smoothstep(0.0, 0.06, v) * (1 - smoothstep(0.55, 1.0, v))
    return np.clip(core * streaks * fade * 1.15, 0, 1)


def flare(n=512):
    yy, xx = (np.mgrid[0:n, 0:n] - n / 2) / (n / 2)
    r = np.sqrt(xx ** 2 + yy ** 2)
    core = np.exp(-(r ** 2) / (2 * 0.04 ** 2))
    halo = np.exp(-(r ** 2) / (2 * 0.22 ** 2)) * 0.45
    streak = np.exp(-(yy ** 2) / (2 * 0.012 ** 2)) * np.exp(-(xx ** 2) / (2 * 0.6 ** 2)) * 0.55
    ring = np.exp(-((r - 0.62) ** 2) / (2 * 0.02 ** 2)) * 0.06
    edge = smoothstep(1.0, 0.85, r)
    return np.clip((core + halo + streak + ring) * edge, 0, 1)


def asphalt(n=1024):
    base = fbm(n, n, 501, octaves=(200, 64, 18), weights=(0.5, 0.3, 0.2))
    grain = periodic_noise(n, n, 1.2, 777)
    specks = (periodic_noise(n, n, 0.8, 778) > 0.82).astype(float) * 0.5
    wear = periodic_noise(n, n, 3, 779)
    wear = np.repeat(wear[:, :1], n, axis=1) * 0.0 + periodic_noise(n, n, 140, 780)
    v = 0.055 + base * 0.04 + (grain - 0.5) * 0.05 + specks * 0.05 + smoothstep(0.6, 0.9, wear) * 0.025
    rgb = np.stack([v * 0.98, v, v * 1.05], -1)
    return rgb


def concrete(n=1024):
    base = fbm(n, n, 901, octaves=(260, 90, 30, 10), weights=(0.45, 0.3, 0.15, 0.1))
    grain = periodic_noise(n, n, 1.0, 902)
    pores = (periodic_noise(n, n, 0.9, 903) < 0.12).astype(float)
    v = 0.66 + (base - 0.5) * 0.14 + (grain - 0.5) * 0.06 - pores * 0.08
    rgb = np.stack([v, v * 0.995, v * 0.98], -1)
    return rgb


def save_rgb(arr, path, quality=86):
    Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), "RGB").save(path, quality=quality, optimize=True)


for i in range(1, 7):
    save_gray(smoke(100 + i * 11), f"{ROOT}/public/fx/smoke-{i}.jpg")
save_gray(vapor_jet(), f"{ROOT}/public/fx/vapor-jet.jpg")
save_gray(flare(), f"{ROOT}/public/fx/flare.jpg")
save_rgb(asphalt(), f"{ROOT}/public/textures/asphalt-dark.jpg")
save_rgb(concrete(), f"{ROOT}/public/textures/concrete-ramp.jpg")

# Brand: the supplied raster (black on white) → white on transparent, cropped. Pixels are not redrawn.
src = sys.argv[2] if len(sys.argv) > 2 else None
if src:
    raw = Image.open(src).convert("RGBA")
    flat = Image.new("RGBA", raw.size, (255, 255, 255, 255))
    flat.alpha_composite(raw)
    im = np.asarray(flat.convert("L")).astype(float) / 255
    alpha = np.clip((1 - im) * 1.15, 0, 1)
    rows = np.where(alpha.max(1) > 0.1)[0]
    gaps = np.where(np.diff(rows) > 8)[0]
    split = rows[gaps[-1]] + 4 if len(gaps) else int(im.shape[0] * 0.75)

    def export(a, path):
        ys, xs = np.where(a > 0.05)
        a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        rgba = np.zeros(a.shape + (4,), np.uint8)
        rgba[..., :3] = 255
        rgba[..., 3] = (a * 255).astype(np.uint8)
        Image.fromarray(rgba, "RGBA").save(path, optimize=True)

    export(alpha[:split], f"{ROOT}/public/brand/tesla-logo.png")
    export(alpha[split:], f"{ROOT}/public/brand/tesla-wordmark.png")
print("fx done")
