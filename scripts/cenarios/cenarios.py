"""Gerador dos cenários de fundo do Pietro Games (viewBox 1600x1000).
Luz de cima à esquerda, paleta pastel, elementos nas bordas, centro calmo."""
import math, random, sys, os

W, H = 1600, 1000
OUT = sys.argv[1] if len(sys.argv) > 1 else "."


def f(v):
    return str(int(round(v)))


def hx(c):
    c = c.lstrip("#")
    return [int(c[i:i + 2], 16) for i in (0, 2, 4)]


def mix(a, b, t):
    A, B = hx(a), hx(b)
    return "#%02x%02x%02x" % tuple(round(A[i] + (B[i] - A[i]) * t) for i in range(3))


def dark(c, t=0.25):
    return mix(c, "#1f2a1c", t)


def light(c, t=0.35):
    return mix(c, "#ffffff", t)


def smooth(pts, close_bottom=None):
    d = f"M{f(pts[0][0])} {f(pts[0][1])}"
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}"
    if close_bottom is not None:
        d += f"L{f(pts[-1][0])} {close_bottom}L{f(pts[0][0])} {close_bottom}Z"
    return d


class Svg:
    def __init__(self, nome):
        self.p = "cen-" + nome
        self.defs, self.body, self.n = [], [], 0

    def gid(self):
        self.n += 1
        return f"{self.p}-{self.n}"

    def lg(self, stops, x1=0, y1=0, x2=0, y2=1):
        i = self.gid()
        s = "".join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{a}"' if a is not None else "") + "/>"
                    for o, c, a in [(st + (None,))[:3] for st in stops])
        self.defs.append(f'<linearGradient id="{i}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{s}</linearGradient>')
        return f"url(#{i})"

    def rg(self, stops, cx=0.5, cy=0.5, r=0.5):
        i = self.gid()
        s = "".join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{a}"' if a is not None else "") + "/>"
                    for o, c, a in [(st + (None,))[:3] for st in stops])
        self.defs.append(f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}">{s}</radialGradient>')
        return f"url(#{i})"

    def add(self, s):
        self.body.append(s)

    def g(self, name, items):
        self.body.append(f'<g id="{name}">' + "".join(items) + "</g>")

    def save(self, nome):
        txt = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice">'
               "<defs>" + "".join(self.defs) + "</defs>" + '<g stroke-linejoin="round" stroke-linecap="round">' + "\n".join(self.body) + "</g></svg>\n")
        path = os.path.join(OUT, nome + ".svg")
        open(path, "w").write(txt)
        return len(txt)


# ---------- peças ----------

def P(d, fill, stroke=None, sw=3, op=None, extra=""):
    s = f'<path d="{d}" fill="{fill}"'
    if stroke:
        s += f' stroke="{stroke}" stroke-width="{sw}"'
    if op is not None:
        s += f' opacity="{op}"'
    return s + extra + "/>"


def C(x, y, r, fill, op=None):
    return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="{fill}"' + (f' opacity="{op}"' if op is not None else "") + "/>"


def E(x, y, rx, ry, fill, op=None):
    return f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(rx)}" ry="{f(ry)}" fill="{fill}"' + (f' opacity="{op}"' if op is not None else "") + "/>"


def sky(s, top, bot, mid=None):
    stops = [(0, top), (0.55, mid or bot), (1, bot)]
    s.add(f'<rect width="1600" height="1000" fill="{s.lg(stops)}"/>')


def sun(s, x, y, r, col="#fff6c9"):
    s.add(C(x, y, r * 3.2, s.rg([(0, col, 0.55), (1, col, 0)])))
    s.add(C(x, y, r, s.rg([(0, "#ffffff"), (1, col)], 0.4, 0.4, 0.6)))


def cloud(x, y, k, col="#ffffff", sh="#dfeaf2", op=0.9):
    parts = [(0, 0, 46), (52, -18, 58), (110, 0, 44), (40, 18, 40), (88, 16, 38)]
    out = [f'<g opacity="{op}">']
    for dx, dy, r in parts:
        out.append(E(x + dx * k + 8 * k, y + dy * k + 10 * k, r * k, r * k * 0.8, sh))
    for dx, dy, r in parts:
        out.append(E(x + dx * k, y + dy * k, r * k, r * k * 0.8, col))
    out.append(E(x + 40 * k, y - 22 * k, 30 * k, 12 * k, "#ffffff", 0.9))
    out.append("</g>")
    return "".join(out)


def edge(x, power=2.0):
    return abs((x - 800) / 800) ** power


def hills(s, rnd, base, amp, col, n=9, edgep=1.6, minamp=0.15, top_light=True, stroke=None, jitter=0.35):
    pts = []
    for i in range(n + 1):
        x = -60 + i * (W + 120) / n
        e = minamp + (1 - minamp) * edge(x, edgep)
        y = base - amp * e * (1 - jitter + 2 * jitter * rnd.random())
        pts.append((x, y))
    fill = s.lg([(0, light(col, 0.25)), (0.5, col), (1, dark(col, 0.08))]) if top_light else col
    d = smooth(pts, 1010)
    return P(d, fill, stroke, 3) if stroke else P(d, fill)


def canopy(rnd, cx, cy, rx, ry, base, n=11, outline=None, rmin=0.35, rmax=0.55, texture=True):
    """Copa feita de bolotas: contorno, sombra, base, luz (luz de cima à esquerda)."""
    blobs = []
    for _ in range(n):
        a = rnd.uniform(0, 2 * math.pi)
        rr = math.sqrt(rnd.random()) * 0.62
        x = cx + math.cos(a) * rx * rr
        y = cy + math.sin(a) * ry * rr
        r = min(rx, ry) * rnd.uniform(rmin, rmax)
        blobs.append((x, y, r))
    blobs.sort(key=lambda b: b[1])
    oc = outline or dark(base, 0.42)
    sh, li = dark(base, 0.2), light(base, 0.3)
    out = [C(x, y, r + 3, oc) for x, y, r in blobs]
    out += [C(x, y, r, sh) for x, y, r in blobs]
    out += [C(x - r * 0.14, y - r * 0.18, r * 0.8, base) for x, y, r in blobs]
    for x, y, r in blobs:
        if (x - cx) / rx + (y - cy) / ry < 0.15:
            out.append(C(x - r * 0.32, y - r * 0.36, r * 0.36, li, 0.85))
    if texture:
        for x, y, r in blobs[::2]:
            tx, ty = x + r * 0.25, y + r * 0.2
            out.append(f'<path d="M{f(tx-5)} {f(ty-3)}q5 -5 10 0" fill="none" stroke="{sh}" stroke-width="2"/>')
    return "".join(out)


def trunk(x, y, h, w, col, lean=0, top_w=None):
    tw = top_w if top_w is not None else w * 0.55
    d = (f"M{f(x - w / 2)} {f(y)}C{f(x - w / 2)} {f(y - h * 0.5)} {f(x - tw / 2 + lean)} {f(y - h * 0.7)} {f(x - tw / 2 + lean)} {f(y - h)}"
         f"L{f(x + tw / 2 + lean)} {f(y - h)}C{f(x + tw / 2 + lean)} {f(y - h * 0.7)} {f(x + w / 2)} {f(y - h * 0.5)} {f(x + w / 2)} {f(y)}Z")
    out = P(d, col, dark(col, 0.4), 3)
    out += f'<path d="M{f(x + w * 0.18)} {f(y - 4)}C{f(x + w * 0.2)} {f(y - h * 0.5)} {f(x + tw * 0.2 + lean)} {f(y - h * 0.7)} {f(x + tw * 0.2 + lean)} {f(y - h)}" fill="none" stroke="{dark(col, 0.18)}" stroke-width="{f(w * 0.28)}" opacity="0.7"/>'
    out += f'<path d="M{f(x - w * 0.28)} {f(y - h * 0.15)}Q{f(x - w * 0.3)} {f(y - h * 0.45)} {f(x - tw * 0.3 + lean)} {f(y - h * 0.8)}" fill="none" stroke="{light(col, 0.3)}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>'
    return out


def tree_round(rnd, x, y, h, base, wood="#9a6b45", w=None):
    w = w or h * 0.55
    out = trunk(x, y, h * 0.55, h * 0.09, wood)
    # galhos
    out += f'<path d="M{f(x)} {f(y - h * 0.4)}l{f(-h * 0.12)} {f(-h * 0.14)}M{f(x)} {f(y - h * 0.46)}l{f(h * 0.13)} {f(-h * 0.12)}" stroke="{dark(wood, 0.3)}" stroke-width="{f(h * 0.03)}"/>'
    out += canopy(rnd, x, y - h * 0.68, w / 2, h * 0.32, base, n=12)
    return out


def conifer(x, y, h, base, wood="#8a5a3a", snow=False, tiers=4, wfac=0.42, simple=False):
    w = h * wfac
    out = [P(f"M{f(x - h * 0.03)} {f(y)}L{f(x - h * 0.03)} {f(y - h * 0.2)}L{f(x + h * 0.03)} {f(y - h * 0.2)}L{f(x + h * 0.03)} {f(y)}Z", wood, dark(wood, 0.4), 2.5)]
    oc, sh, li = dark(base, 0.45), dark(base, 0.18), light(base, 0.25)
    for i in range(tiers):
        t0 = i / tiers
        ty = y - h * 0.12 - (h * 0.88) * t0  # base do andar
        tw = w * (1 - t0 * 0.72)
        th = h * 0.88 / tiers * 1.55
        apex = ty - th
        d = (f"M{f(x)} {f(apex)}Q{f(x - tw * 0.3)} {f(ty - th * 0.45)} {f(x - tw / 2)} {f(ty)}"
             f"q{f(tw * 0.12)} {f(th * 0.1)} {f(tw * 0.25)} 0q{f(tw * 0.12)} {f(th * 0.1)} {f(tw * 0.25)} 0"
             f"q{f(tw * 0.12)} {f(th * 0.1)} {f(tw * 0.25)} 0q{f(tw * 0.12)} {f(th * 0.1)} {f(tw * 0.25)} 0"
             f"Q{f(x + tw * 0.3)} {f(ty - th * 0.45)} {f(x)} {f(apex)}Z")
        if simple:
            out.append(P(d, base))
            continue
        out.append(P(d, base, oc, 3))
        dr = (f"M{f(x)} {f(apex)}Q{f(x + tw * 0.3)} {f(ty - th * 0.45)} {f(x + tw / 2)} {f(ty)}"
              f"q{f(-tw * 0.12)} {f(th * 0.1)} {f(-tw * 0.25)} 0q{f(-tw * 0.12)} {f(th * 0.1)} {f(-tw * 0.25)} 0Z")
        out.append(P(dr, sh, op=0.85))
        out.append(f'<path d="M{f(x - 3)} {f(apex + th * 0.18)}Q{f(x - tw * 0.22)} {f(ty - th * 0.45)} {f(x - tw * 0.38)} {f(ty - th * 0.08)}" fill="none" stroke="{li}" stroke-width="3.5" stroke-linecap="round" opacity="0.9"/>')
        if snow:
            sd = (f"M{f(x)} {f(apex)}Q{f(x - tw * 0.18)} {f(apex + th * 0.35)} {f(x - tw * 0.28)} {f(apex + th * 0.55)}"
                  f"q{f(tw * 0.1)} {f(-th * 0.06)} {f(tw * 0.14)} {f(th * 0.02)}q{f(tw * 0.08)} {f(-th * 0.12)} {f(tw * 0.16)} {f(-th * 0.04)}"
                  f"q{f(tw * 0.08)} {f(-th * 0.1)} {f(tw * 0.14)} 0Q{f(x + tw * 0.14)} {f(apex + th * 0.3)} {f(x)} {f(apex)}Z")
            out.append(P(sd, "#ffffff", "#c9dced", 2))
    return "".join(out)


def grass(rnd, x, y, h, col, n=7, spread=1.0):
    out = []
    for i in range(n):
        dx = (i - n / 2) * 4 * spread
        bend = rnd.uniform(-0.5, 0.5) * h
        hh = h * rnd.uniform(0.6, 1.0)
        c = col if i % 3 else dark(col, 0.15)
        out.append(f'<path d="M{f(x + dx - 3)} {f(y)}Q{f(x + dx + bend * 0.3)} {f(y - hh * 0.5)} {f(x + dx + bend)} {f(y - hh)}Q{f(x + dx + bend * 0.2 + 2)} {f(y - hh * 0.4)} {f(x + dx + 3)} {f(y)}Z" fill="{c}"/>')
    return "".join(out)


def flower(x, y, col, r=7, center="#ffd34d", stem="#5a9c4c"):
    out = f'<path d="M{f(x)} {f(y)}q-3 14 0 26" fill="none" stroke="{stem}" stroke-width="3"/>'
    for k in range(5):
        a = k * 2 * math.pi / 5 - math.pi / 2
        out += C(x + math.cos(a) * r, y + math.sin(a) * r, r * 0.75, col)
    out += C(x, y, r * 0.55, center)
    out += C(x - r * 0.2, y - r * 0.2, r * 0.18, "#ffffff", 0.9)
    return out


def rock(x, y, w, h, col):
    d = f"M{f(x - w / 2)} {f(y)}C{f(x - w / 2)} {f(y - h * 0.7)} {f(x - w * 0.25)} {f(y - h)} {f(x + w * 0.05)} {f(y - h)}C{f(x + w * 0.35)} {f(y - h)} {f(x + w / 2)} {f(y - h * 0.6)} {f(x + w / 2)} {f(y)}Z"
    out = P(d, col, dark(col, 0.4), 3)
    out += P(f"M{f(x + w * 0.1)} {f(y - h * 0.95)}C{f(x + w * 0.38)} {f(y - h * 0.9)} {f(x + w * 0.48)} {f(y - h * 0.5)} {f(x + w * 0.48)} {f(y - 2)}L{f(x + w * 0.15)} {f(y - 2)}Z", dark(col, 0.15), op=0.8)
    out += f'<path d="M{f(x - w * 0.36)} {f(y - h * 0.45)}Q{f(x - w * 0.3)} {f(y - h * 0.85)} {f(x - w * 0.02)} {f(y - h * 0.9)}" fill="none" stroke="{light(col, 0.45)}" stroke-width="4"/>'
    return out


def shadow(x, y, rx, ry=None, op=0.14):
    return E(x + rx * 0.15, y, rx, ry or rx * 0.12, "#2e3a2a", op)


def bird(x, y, k=1, col="#6b7f8c"):
    return f'<path d="M{f(x - 12 * k)} {f(y)}q{f(6 * k)} {f(-7 * k)} {f(12 * k)} 0q{f(6 * k)} {f(-7 * k)} {f(12 * k)} 0" fill="none" stroke="{col}" stroke-width="{f(2.5 * k)}" stroke-linecap="round" opacity="0.7"/>'


def ground(s, base_y, col, rnd, amp=40, n=8):
    pts = []
    for i in range(n + 1):
        x = -60 + i * (W + 120) / n
        y = base_y - amp * edge(x, 1.4) + rnd.uniform(-6, 6)
        pts.append((x, y))
    fill = s.lg([(0, light(col, 0.2)), (0.35, col), (1, dark(col, 0.1))])
    return P(smooth(pts, 1010), fill, dark(col, 0.28), 3), pts


def ground_y(pts, x):
    for i in range(len(pts) - 1):
        if pts[i][0] <= x <= pts[i + 1][0]:
            t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0])
            return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t
    return pts[-1][1]


def sides(rnd, n, inner=320):
    """posições x nas bordas (esquerda e direita)."""
    xs = []
    for i in range(n):
        if i % 2 == 0:
            xs.append(rnd.uniform(-40, inner))
        else:
            xs.append(rnd.uniform(W - inner, W + 40))
    return xs


# ---------- elementos específicos ----------

def palm(x, y, h, lean, base="#4f9a4a", wood="#a77b4f", fronds=8, rnd=None):
    tx, ty = x + lean, y - h
    out = [f'<path d="M{f(x)} {f(y)}Q{f(x + lean * 0.2)} {f(y - h * 0.6)} {f(tx)} {f(ty)}" fill="none" stroke="{dark(wood, 0.4)}" stroke-width="{f(h * 0.075 + 6)}"/>',
           f'<path d="M{f(x)} {f(y)}Q{f(x + lean * 0.2)} {f(y - h * 0.6)} {f(tx)} {f(ty)}" fill="none" stroke="{wood}" stroke-width="{f(h * 0.075)}"/>']
    for k in range(1, 9):
        t = k / 9
        px = x + (lean * 0.2) * 2 * t * (1 - t) + lean * t * t
        py = y + (-h * 0.6) * 2 * t * (1 - t) + (-h) * t * t
        out.append(f'<path d="M{f(px - h * 0.035)} {f(py)}q{f(h * 0.035)} 6 {f(h * 0.07)} 0" fill="none" stroke="{dark(wood, 0.3)}" stroke-width="2.5"/>')
    for i in range(fronds):
        a = -math.pi + i * math.pi / (fronds - 1) + (rnd.uniform(-0.08, 0.08) if rnd else 0)
        L = h * 0.42
        ex, ey = tx + math.cos(a) * L, ty + math.sin(a) * L * 0.35 + L * 0.5
        mx, my = tx + math.cos(a) * L * 0.55, ty + math.sin(a) * L * 0.55 - L * 0.12
        nx, ny = -math.sin(a) * 16, math.cos(a) * 6 + 10
        col = base if i % 2 else dark(base, 0.12)
        d = f"M{f(tx)} {f(ty)}Q{f(mx - nx)} {f(my - ny)} {f(ex)} {f(ey)}Q{f(mx + nx)} {f(my + ny)} {f(tx)} {f(ty)}Z"
        out.append(P(d, col, dark(base, 0.42), 2.5))
        lf = ""
        for k in range(1, 7):
            t = k / 7
            px = (1 - t) ** 2 * tx + 2 * (1 - t) * t * mx + t * t * ex
            py = (1 - t) ** 2 * ty + 2 * (1 - t) * t * my + t * t * ey
            lf += f"M{f(px)} {f(py)}l{f(-nx * 0.9)} {f(abs(ny) * 0.9 + 4)}M{f(px)} {f(py)}l{f(nx * 0.9)} {f(abs(ny) * 0.9 + 4)}"
        out.append(f'<path d="{lf}" stroke="{dark(base, 0.25)}" stroke-width="2"/>')
        out.append(f'<path d="M{f(tx)} {f(ty)}Q{f(mx)} {f(my)} {f(ex)} {f(ey)}" fill="none" stroke="{light(base, 0.35)}" stroke-width="2.5"/>')
    out.append(C(tx, ty + 6, 9, "#7a5a32"))
    out.append(C(tx + 10, ty + 10, 7, "#6a4a28"))
    return "".join(out)


def acacia(rnd, x, y, h, base="#8fae4a", wood="#7a5a3c", n=16):
    out = [f'<path d="M{f(x)} {f(y)}C{f(x + 4)} {f(y - h * 0.4)} {f(x - h * 0.05)} {f(y - h * 0.6)} {f(x - h * 0.28)} {f(y - h * 0.82)}M{f(x + 2)} {f(y - h * 0.45)}C{f(x + h * 0.1)} {f(y - h * 0.62)} {f(x + h * 0.22)} {f(y - h * 0.7)} {f(x + h * 0.3)} {f(y - h * 0.84)}M{f(x)} {f(y - h * 0.55)}L{f(x + h * 0.02)} {f(y - h * 0.85)}" fill="none" stroke="{dark(wood, 0.4)}" stroke-width="{f(h * 0.05 + 6)}"/>',
           f'<path d="M{f(x)} {f(y)}C{f(x + 4)} {f(y - h * 0.4)} {f(x - h * 0.05)} {f(y - h * 0.6)} {f(x - h * 0.28)} {f(y - h * 0.82)}M{f(x + 2)} {f(y - h * 0.45)}C{f(x + h * 0.1)} {f(y - h * 0.62)} {f(x + h * 0.22)} {f(y - h * 0.7)} {f(x + h * 0.3)} {f(y - h * 0.84)}M{f(x)} {f(y - h * 0.55)}L{f(x + h * 0.02)} {f(y - h * 0.85)}" fill="none" stroke="{wood}" stroke-width="{f(h * 0.05)}"/>']
    # copa achatada em guarda-chuva
    out.append(canopy(rnd, x, y - h * 0.92, h * 0.62, h * 0.13, base, n=n, rmin=0.5, rmax=0.85, texture=n > 8))
    return "".join(out)


def baobab(rnd, x, y, h, wood="#b89a7a", leaf="#7fa64a"):
    w = h * 0.34
    d = (f"M{f(x - w * 0.6)} {f(y)}C{f(x - w * 0.7)} {f(y - h * 0.3)} {f(x - w * 0.55)} {f(y - h * 0.55)} {f(x - w * 0.3)} {f(y - h * 0.7)}"
         f"L{f(x + w * 0.3)} {f(y - h * 0.7)}C{f(x + w * 0.55)} {f(y - h * 0.55)} {f(x + w * 0.7)} {f(y - h * 0.3)} {f(x + w * 0.6)} {f(y)}Z")
    out = []
    br = ""
    for dx, dy in [(-0.75, -0.95), (-0.3, -1.0), (0.2, -1.02), (0.7, -0.94), (-0.55, -0.82), (0.5, -0.84)]:
        br += f"M{f(x + dx * w * 0.3)} {f(y - h * 0.68)}Q{f(x + dx * w * 0.7)} {f(y - h * 0.8)} {f(x + dx * w)} {f(y + dy * h)}"
    out.append(f'<path d="{br}" fill="none" stroke="{dark(wood, 0.4)}" stroke-width="16"/>')
    out.append(f'<path d="{br}" fill="none" stroke="{wood}" stroke-width="10"/>')
    for dx, dy in [(-0.75, -0.95), (-0.3, -1.0), (0.2, -1.02), (0.7, -0.94)]:
        out.append(canopy(rnd, x + dx * w, y + dy * h - 8, 34, 18, leaf, n=5, rmin=0.6, rmax=0.9, texture=False))
    out.append(P(d, s_grad_wood(wood), dark(wood, 0.4), 3))
    out.append(f'<path d="M{f(x - w * 0.3)} {f(y - 10)}Q{f(x - w * 0.42)} {f(y - h * 0.35)} {f(x - w * 0.2)} {f(y - h * 0.62)}M{f(x + w * 0.1)} {f(y - 6)}Q{f(x + w * 0.05)} {f(y - h * 0.3)} {f(x + w * 0.12)} {f(y - h * 0.6)}" fill="none" stroke="{dark(wood, 0.2)}" stroke-width="3"/>')
    out.append(f'<path d="M{f(x - w * 0.45)} {f(y - h * 0.15)}Q{f(x - w * 0.52)} {f(y - h * 0.4)} {f(x - w * 0.36)} {f(y - h * 0.6)}" fill="none" stroke="{light(wood, 0.4)}" stroke-width="5"/>')
    return "".join(out)


_cur = {}


def s_grad_wood(c):
    s = _cur["s"]
    return s.lg([(0, light(c, 0.2)), (0.6, c), (1, dark(c, 0.15))], 0, 0, 1, 0)


def bamboo(rnd, x, y, h, w=22, col="#8cc152", leaf="#6fae3c", simple=False):
    out = []
    seg = rnd.uniform(70, 95)
    lean = rnd.uniform(-30, 30)
    n = int(h / seg) + 1
    pts = [(x + lean * (k / n) ** 2, y - k * seg) for k in range(n + 1)]
    left = " ".join(f"{f(px - w / 2)} {f(py)}" for px, py in pts)
    right = " ".join(f"{f(px + w / 2)} {f(py)}" for px, py in reversed(pts))
    out.append(P(f"M{left} L{right}Z", col, dark(col, 0.4), 2.5))
    if not simple:
        sh = " ".join(f"{f(px + w * 0.15)} {f(py)}" for px, py in pts)
        shr = " ".join(f"{f(px + w / 2)} {f(py)}" for px, py in reversed(pts))
        out.append(P(f"M{sh} L{shr}Z", dark(col, 0.15), op=0.8))
        hl = "".join(f"M{f(pts[k][0] - w * 0.25)} {f(pts[k][1] - 8)}L{f(pts[k + 1][0] - w * 0.25)} {f(pts[k + 1][1] + 10)}" for k in range(n))
        out.append(f'<path d="{hl}" stroke="{light(col, 0.45)}" stroke-width="3"/>')
    nodes = "".join(f"M{f(px - w / 2 - 2)} {f(py)}h{f(w + 4)}" for px, py in pts[1:])
    out.append(f'<path d="{nodes}" stroke="{dark(col, 0.4)}" stroke-width="7"/><path d="{nodes}" stroke="{dark(col, 0.08)}" stroke-width="3"/>')
    for k in range(1, n + 1):
        xk, yk = pts[k]
        if k >= 2 and (rnd.random() < (0.25 if simple else 0.35) or k == n):
            side = rnd.choice([-1, 1])
            for j in range(rnd.randint(3, 4) + (3 if k == n else 0)):
                sd = side if j % 3 else -side
                a = sd * rnd.uniform(0.5, 1.5)  # 0 = para cima, ±pi/2 = lado
                L = rnd.uniform(70, 105)
                ex, ey = xk + math.sin(a) * L, yk - math.cos(a) * L * 0.5 + L * 0.35
                mx, my = (xk + ex) / 2, (yk + ey) / 2 - 8
                nx, ny = -(ey - yk) / L * 11, (ex - xk) / L * 11
                d = f"M{f(xk)} {f(yk)}Q{f(mx + nx)} {f(my + ny)} {f(ex)} {f(ey)}Q{f(mx - nx)} {f(my - ny)} {f(xk)} {f(yk)}Z"
                lc = leaf if j % 2 else light(leaf, 0.18)
                out.append(P(d, lc, None if simple else dark(leaf, 0.4), 2))
                if not simple:
                    out.append(f'<path d="M{f(xk)} {f(yk)}Q{f(mx)} {f(my)} {f(ex)} {f(ey)}" fill="none" stroke="{dark(leaf, 0.2)}" stroke-width="1.5"/>')
    return "".join(out)


def fence(x0, x1, y, col="#c98b52", post_gap=90):
    out = []
    oc = dark(col, 0.4)
    for yy in (y - 52, y - 26):
        out.append(f'<rect x="{f(x0)}" y="{f(yy)}" width="{f(x1 - x0)}" height="12" rx="5" fill="{col}" stroke="{oc}" stroke-width="2.5"/>')
        out.append(f'<path d="M{f(x0 + 4)} {f(yy + 3)}H{f(x1 - 4)}" stroke="{light(col, 0.35)}" stroke-width="2.5"/>')
    x = x0 + 10
    while x < x1:
        out.append(P(f"M{f(x - 8)} {f(y)}V{f(y - 66)}L{f(x)} {f(y - 76)}L{f(x + 8)} {f(y - 66)}V{f(y)}Z", col, oc, 2.5))
        out.append(f'<path d="M{f(x - 3)} {f(y - 4)}V{f(y - 64)}" stroke="{light(col, 0.35)}" stroke-width="2.5"/>')
        x += post_gap
    return "".join(out)


def mountains(s, rnd, specs, col, snow=None, stroke=False):
    out = []
    for (x, y, w, h) in specs:
        tip = (x + rnd.uniform(-0.08, 0.08) * w, y - h)
        d = f"M{f(x - w / 2)} {f(y)}L{f(tip[0] - w * 0.06)} {f(tip[1] + h * 0.06)}Q{f(tip[0])} {f(tip[1] - 4)} {f(tip[0] + w * 0.06)} {f(tip[1] + h * 0.06)}L{f(x + w / 2)} {f(y)}Z"
        fill = s.lg([(0, light(col, 0.15)), (1, col)])
        out.append(P(d, fill, dark(col, 0.2) if stroke else None, 2.5))
        # lado de sombra (direita)
        out.append(P(f"M{f(tip[0] + 2)} {f(tip[1] + 4)}L{f(x + w / 2)} {f(y)}L{f(tip[0] + w * 0.08)} {f(y)}Z", dark(col, 0.12), op=0.6))
        if snow:
            sh = h * 0.3
            d2 = (f"M{f(tip[0] - w * 0.06)} {f(tip[1] + h * 0.06)}Q{f(tip[0])} {f(tip[1] - 4)} {f(tip[0] + w * 0.06)} {f(tip[1] + h * 0.06)}"
                  f"L{f(tip[0] + sh * w / h / 2)} {f(tip[1] + sh)}l{f(-w * 0.04)} {f(-sh * 0.2)}l{f(-w * 0.04)} {f(sh * 0.15)}l{f(-w * 0.05)} {f(-sh * 0.25)}l{f(-w * 0.04)} {f(sh * 0.2)}L{f(tip[0] - sh * w / h / 2)} {f(tip[1] + sh)}Z")
            out.append(P(d2, snow, "#c4d8ea", 2))
    return "".join(out)


def silhouette_bison(x, y, k, col):
    d = f"M{f(x)} {f(y)}c{f(-2*k)} {f(-14*k)} {f(4*k)} {f(-26*k)} {f(16*k)} {f(-28*k)}c{f(10*k)} {f(-2*k)} {f(16*k)} {f(4*k)} {f(30*k)} {f(4*k)}c{f(10*k)} 0 {f(16*k)} {f(6*k)} {f(14*k)} {f(14*k)}l{f(-2*k)} {f(10*k)}h{f(-5*k)}l{f(-1*k)} {f(-8*k)}h{f(-20*k)}l{f(-2*k)} {f(8*k)}h{f(-5*k)}l{f(-1*k)} {f(-9*k)}c{f(-6*k)} 0 {f(-10*k)} {f(-2*k)} {f(-12*k)} {f(-6*k)}l{f(-4*k)} {f(6*k)}h{f(-6*k)}z"
    return P(d, col, op=0.55)


def silhouette_camel(x, y, k, col):  # camelo-bactriano (duas corcovas)
    d = (f"M{f(x)} {f(y)}l{f(2*k)} {f(-18*k)}c{f(2*k)} {f(-6*k)} {f(6*k)} {f(-8*k)} {f(8*k)} {f(-14*k)}c{f(2*k)} {f(-6*k)} {f(8*k)} {f(-6*k)} {f(9*k)} 0"
         f"c{f(2*k)} {f(-6*k)} {f(8*k)} {f(-6*k)} {f(9*k)} 0c{f(4*k)} {f(2*k)} {f(6*k)} {f(-8*k)} {f(8*k)} {f(-16*k)}l{f(6*k)} {f(1*k)}l{f(1*k)} {f(4*k)}l{f(-4*k)} {f(1*k)}"
         f"c{f(-2*k)} {f(8*k)} {f(-2*k)} {f(16*k)} {f(-6*k)} {f(22*k)}l{f(1*k)} {f(18*k)}h{f(-3*k)}l{f(-2*k)} {f(-14*k)}h{f(-18*k)}l{f(-1*k)} {f(14*k)}h{f(-3*k)}z")
    return P(d, col, op=0.5)


def silhouette_giraffe(x, y, k, col):
    d = (f"M{f(x)} {f(y)}l{f(2*k)} {f(-30*k)}c0 {f(-6*k)} {f(6*k)} {f(-10*k)} {f(14*k)} {f(-10*k)}l{f(10*k)} {f(-36*k)}l{f(-4*k)} {f(-2*k)}l{f(2*k)} {f(-4*k)}l{f(10*k)} {f(2*k)}l{f(-1*k)} {f(5*k)}"
         f"l{f(-8*k)} {f(36*k)}c{f(4*k)} {f(4*k)} {f(4*k)} {f(10*k)} {f(2*k)} {f(14*k)}l{f(1*k)} {f(26*k)}h{f(-3*k)}l{f(-3*k)} {f(-22*k)}h{f(-12*k)}l{f(-2*k)} {f(22*k)}h{f(-3*k)}z")
    return P(d, col, op=0.5)


def silhouette_kangaroo(x, y, k, col):
    d = (f"M{f(x)} {f(y)}c{f(-10*k)} 0 {f(-30*k)} {f(2*k)} {f(-40*k)} {f(4*k)}c{f(10*k)} {f(-4*k)} {f(24*k)} {f(-6*k)} {f(30*k)} {f(-10*k)}c{f(-2*k)} {f(-12*k)} {f(4*k)} {f(-22*k)} {f(10*k)} {f(-28*k)}"
         f"l{f(-2*k)} {f(-6*k)}l{f(3*k)} {f(-2*k)}l{f(3*k)} {f(5*k)}c{f(4*k)} 0 {f(8*k)} {f(2*k)} {f(8*k)} {f(6*k)}l{f(-6*k)} {f(2*k)}c{f(2*k)} {f(8*k)} 0 {f(14*k)} {f(-4*k)} {f(18*k)}"
         f"c{f(4*k)} {f(4*k)} {f(6*k)} {f(10*k)} {f(4*k)} {f(14*k)}l{f(8*k)} {f(2*k)}z")
    return P(d, col, op=0.5)


def silhouette_reindeer(x, y, k, col):
    d = (f"M{f(x)} {f(y)}l{f(1*k)} {f(-16*k)}c0 {f(-6*k)} {f(4*k)} {f(-8*k)} {f(10*k)} {f(-8*k)}h{f(18*k)}l{f(6*k)} {f(-10*k)}l{f(4*k)} {f(1*k)}l{f(-1*k)} {f(5*k)}l{f(-4*k)} {f(8*k)}"
         f"l{f(-2*k)} {f(4*k)}l{f(1*k)} {f(16*k)}h{f(-3*k)}l{f(-2*k)} {f(-12*k)}h{f(-18*k)}l{f(-2*k)} {f(12*k)}h{f(-3*k)}z")
    d += f"M{f(x + 30*k)} {f(y - 33*k)}l{f(-4*k)} {f(-10*k)}m{f(2*k)} {f(5*k)}l{f(-5*k)} {f(-2*k)}M{f(x + 32*k)} {f(y - 33*k)}l{f(4*k)} {f(-10*k)}m{f(-2*k)} {f(5*k)}l{f(5*k)} {f(-2*k)}"
    return f'<g opacity="0.5"><path d="{d}" fill="{col}" stroke="{col}" stroke-width="{f(1.6*k)}"/></g>'
