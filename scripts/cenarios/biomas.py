import sys, random, math
from cenarios import *
from cenarios import _cur

TEMAS = {
    "fazenda": ("#dff2dc", "#c9e9c5", "#74c69d", "#e9f7ea", "#3e8f63"),
    "floresta-tropical": ("#cfe9d9", "#b5dcc4", "#3f9e78", "#d9f0e2", "#2b765a"),
    "floresta-temperada": ("#dcefd9", "#c3e2bf", "#5aa36a", "#e6f5e3", "#38784a"),
    "pradaria": ("#eef3d2", "#dfe8b4", "#a9bf5a", "#f6f9e6", "#6d7f2b"),
    "taiga": ("#d8ebe2", "#bddccd", "#4a8c66", "#e3f2ea", "#2f6b4b"),
    "tundra": ("#e6f1fb", "#cfe2f3", "#ffffff", "#b9d6ee", "#3a7cb0"),
    "bambuzal": ("#e2f2d2", "#cbe6b2", "#7fb84f", "#eef8e4", "#4e8a2a"),
    "deserto": ("#fbefd2", "#f4dfa8", "#e8b45c", "#fff7e3", "#a8742a"),
    "outback": ("#fbe3d2", "#f2c5a3", "#d9783f", "#fdf0e6", "#a24f22"),
    "eucaliptos": ("#e3efe0", "#cbe0c6", "#7aa874", "#eef6ec", "#4a7a45"),
    "savana": ("#fcefc2", "#f8e2a2", "#f2bf4d", "#fff7dc", "#b57c00"),
    "rios": ("#d6eee6", "#bfe3d6", "#4aa58a", "#e2f4ee", "#2c7763"),
    "cerrado": ("#f2ecd0", "#e5dbaa", "#c2a64f", "#f8f4e4", "#86702a"),
    "recife": ("#d8eef9", "#bfe3f5", "#ffffff", "#a9d8f0", "#2f86b5"),
}
SKY = "#bfe3f6"


def novo(nome, seed):
    s = Svg(nome)
    _cur["s"] = s
    return s, random.Random(seed)


def ceu(s, nome, top=None, sunpos=(230, 150)):
    fundo, chao, trilha, faixa, dest = TEMAS[nome]
    sky(s, top or mix(SKY, fundo, 0.35), faixa, mix(faixa, fundo, 0.3))
    if sunpos:
        sun(s, sunpos[0], sunpos[1], 62)


def nuvens(s, rnd, extra=()):
    s.g("nuvens", [cloud(380, 120, 0.9), cloud(1240, 90, 1.1), cloud(1480, 230, 0.6, op=0.75), cloud(90, 300, 0.55, op=0.7)] + list(extra))


def tufos(rnd, pts, col, n=40, hmin=18, hmax=34, center_gap=(560, 1040), ymin=0):
    out = []
    for _ in range(n):
        x = rnd.uniform(-20, W + 20)
        if center_gap[0] < x < center_gap[1] and rnd.random() < 0.7:
            continue
        y = ground_y(pts, x) + rnd.uniform(14, 90) + ymin
        out.append(grass(rnd, x, y, rnd.uniform(hmin, hmax), col if rnd.random() < 0.6 else dark(col, 0.12), n=rnd.randint(5, 8)))
    return out


# ============ FAZENDA (Brasil) ============
def fazenda():
    nome = "fazenda"
    s, rnd = novo(nome, 11)
    ceu(s, nome)
    nuvens(s, rnd, [bird(1100, 190), bird(1135, 175, 0.8)])
    s.g("morros-longe", [hills(s, rnd, 760, 220, "#b9dfb4", n=7), hills(s, rnd, 820, 170, "#a5d39c", n=8)])
    # plantação em faixas no morro do fundo (direita)
    rows = []
    for i in range(7):
        y = 720 + i * 20
        rows.append(f'<path d="M{1240 + i * 6} {y}Q1420 {y - 30} 1620 {y - 10}" fill="none" stroke="#8cc77f" stroke-width="7" stroke-linecap="round" opacity="0.8"/>')
    s.g("plantacao-longe", rows)
    gp, pts = ground(s, 930, "#9fd28f", rnd, amp=120)
    s.g("chao", [gp])
    # celeiro vermelho (esquerda)
    bx, by = 70, ground_y(pts, 170) + 6
    red, rd = "#e2685a", "#a63f35"
    barn = [shadow(bx + 120, by, 150),
            P(f"M{bx} {by}V{by - 170}L{bx + 110} {by - 260}L{bx + 220} {by - 170}V{by}Z", s.lg([(0, "#f07f6e"), (1, red)], 0, 0, 1, 1), rd, 3),
            P(f"M{bx + 150} {by - 220}L{bx + 220} {by - 170}V{by}H{bx + 160}Z", dark(red, 0.12), op=0.7),
            P(f"M{bx - 16} {by - 162}L{bx + 110} {by - 274}L{bx + 236} {by - 162}", "none", "#7a4a3a", 14),
            P(f"M{bx - 16} {by - 162}L{bx + 110} {by - 274}L{bx + 236} {by - 162}", "none", "#9c6650", 8),
            f'<rect x="{bx + 70}" y="{by - 110}" width="80" height="110" fill="#fff4ea" stroke="{rd}" stroke-width="3"/>',
            P(f"M{bx + 74} {by - 106}L{bx + 146} {by - 4}M{bx + 146} {by - 106}L{bx + 74} {by - 4}", "none", "#e8c9b8", 7),
            f'<rect x="{bx + 88}" y="{by - 205}" width="44" height="40" rx="4" fill="#fff4ea" stroke="{rd}" stroke-width="3"/>',
            P(f"M{bx + 110} {by - 205}V{by - 165}M{bx + 88} {by - 185}H{bx + 132}", "none", rd, 2.5),
            P(f"M{bx + 12} {by - 150}V{by - 20}", "none", "#f59a8b", 4)]
    s.g("celeiro", barn)
    # árvore frondosa (mangueira) à esquerda, atrás da cerca
    s.g("arvores", [shadow(330, ground_y(pts, 330) + 10, 90),
                    tree_round(rnd, 330, ground_y(pts, 330) + 10, 330, "#5fae5a", w=260),
                    shadow(1470, ground_y(pts, 1470) + 10, 80),
                    tree_round(rnd, 1470, ground_y(pts, 1470) + 10, 300, "#6cb85e", w=240)])
    # milharal à direita
    corn = []
    for i in range(14):
        x = 1180 + i * 30 + rnd.uniform(-6, 6)
        y = ground_y(pts, x) + 40 + (i % 2) * 14
        hh = rnd.uniform(150, 190)
        corn.append(f'<path d="M{f(x)} {f(y)}V{f(y - hh)}" stroke="#6aa84f" stroke-width="7"/>')
        for j in range(3):
            yy = y - hh * (0.3 + j * 0.22)
            side = 1 if (i + j) % 2 else -1
            corn.append(P(f"M{f(x)} {f(yy)}q{side * 30} -6 {side * 48} 22q{side * -22} -12 {side * -48} -8Z", "#7cc05c" if j % 2 else "#68ad4b", "#3f7a33", 2))
        if i % 2 == 0:
            corn.append(E(x + 7, y - hh * 0.55, 7, 18, "#ffd25a"))
            corn.append(E(x + 5, y - hh * 0.58, 2.5, 8, "#fff1b0"))
            corn.append(f'<path d="M{f(x + 7)} {f(y - hh * 0.55 - 18)}q4 -10 10 -12" fill="none" stroke="#c9a06a" stroke-width="2.5"/>')
    s.g("milharal", corn)
    # fardos de feno
    hay = []
    for hx_, k in [(1130, 1.0), (1060, 0.8)]:
        y = ground_y(pts, hx_) + 50
        hay += [shadow(hx_, y, 60 * k), E(hx_, y - 40 * k, 60 * k, 42 * k, "#f2cf6d"), E(hx_, y - 40 * k, 60 * k, 42 * k, "none")]
        hay.append(f'<ellipse cx="{f(hx_)}" cy="{f(y - 40 * k)}" rx="{f(60 * k)}" ry="{f(42 * k)}" fill="#f2cf6d" stroke="#b88a2c" stroke-width="3"/>')
        hay.append(f'<ellipse cx="{f(hx_ - 34 * k)}" cy="{f(y - 40 * k)}" rx="{f(24 * k)}" ry="{f(40 * k)}" fill="#f7dd8f" stroke="#b88a2c" stroke-width="3"/>')
        hay.append(f'<path d="M{f(hx_ - 34 * k)} {f(y - 40 * k)}m-12 0a12 22 0 1 0 24 0a12 22 0 1 0 -24 0" fill="none" stroke="#d1a54a" stroke-width="2.5"/>')
        hay.append(f'<path d="M{f(hx_ - 10 * k)} {f(y - 78 * k)}h{f(56 * k)}M{f(hx_ - 10 * k)} {f(y - 4 * k)}h{f(56 * k)}" stroke="#d1a54a" stroke-width="2.5"/>')
    s.g("feno", hay)
    # cerca na frente nas laterais
    s.g("cerca", [fence(-20, 470, 978), fence(1150, 1620, 978)])
    fl = tufos(rnd, pts, "#7cc06a", n=30)
    for _ in range(18):
        x = rnd.choice([rnd.uniform(0, 500), rnd.uniform(1100, 1600)])
        fl.append(flower(x, rnd.uniform(940, 975), rnd.choice(["#ffffff", "#ffc935", "#f7a6c4", "#c9a7f2"])))
    # girassóis
    for x in (520, 560, 1090):
        y = 990
        fl.append(f'<path d="M{x} {y}V{y - 110}" stroke="#5a9c4c" stroke-width="6"/>')
        fl.append(P(f"M{x} {y - 50}q-30 -10 -36 10q20 4 36 -10Z", "#6cb05a", "#3f7a33", 2))
        for k in range(12):
            a = k * math.pi / 6
            fl.append(E(x + math.cos(a) * 22, y - 118 + math.sin(a) * 22, 13, 6, "#ffc935"))
        fl.append(C(x, y - 118, 15, "#8a5a2c"))
        fl.append(C(x - 4, y - 122, 4, "#b07a42"))
    s.g("flores", fl)
    return s.save(nome)


# ============ FLORESTA TROPICAL (Amazônia) ============
def floresta_tropical():
    nome = "floresta-tropical"
    s, rnd = novo(nome, 22)
    ceu(s, nome, sunpos=(260, 130))
    s.g("nuvens", [cloud(520, 110, 0.8, op=0.8), cloud(1100, 80, 0.9, op=0.8)])
    # dossel distante
    far = []
    for i, x in enumerate(range(-40, 1700, 90)):
        e = edge(x, 1.3)
        far.append(canopy(rnd, x, 850 - 200 * e, 90, 60, "#b4dcc2", n=4, outline="#a9d4b9", texture=False, rmin=0.5, rmax=0.7))
    s.g("dossel-longe", far)
    s.g("bruma", [f'<rect y="700" width="1600" height="300" fill="{s.lg([(0, "#e6f5ec", 0), (0.4, "#e6f5ec", 0.7), (1, "#e6f5ec", 0)])}"/>'])
    gp, pts = ground(s, 940, "#7cc08f", rnd, amp=90)
    # árvores gigantes nas laterais (sumaúma) com sapopemas
    big = []
    for x, h, col in [(110, 900, "#3f9e5f"), (1500, 880, "#46a866"), (330, 640, "#5cb36e"), (1290, 620, "#55ad6c")]:
        y = ground_y(pts, x) + 20
        big.append(trunk(x, y, h * 0.75, h * 0.1, "#9c7a58"))
        big.append(P(f"M{x - h * 0.05} {y}q{-h * 0.06} -10 {-h * 0.09} 2q{h * 0.05} -30 {h * 0.06} -70Z", "#8a6a4a", "#5e4630", 2.5))
        big.append(P(f"M{x + h * 0.05} {y}q{h * 0.06} -10 {h * 0.09} 2q{-h * 0.05} -30 {-h * 0.06} -70Z", "#7a5c40", "#5e4630", 2.5))
        big.append(canopy(rnd, x, y - h * 0.8, h * 0.33, h * 0.2, col, n=16))
    s.g("arvores-gigantes", [gp] + big)
    # cipós pendurados no topo dos cantos
    lianas = []
    for x0, x1 in [(0, 420), (1180, 1600)]:
        for i in range(6):
            x = rnd.uniform(x0, x1)
            L = rnd.uniform(160, 420)
            d = f"M{f(x)} -10Q{f(x + rnd.uniform(-40, 40))} {f(L * 0.5)} {f(x + rnd.uniform(-20, 20))} {f(L)}"
            lianas.append(f'<path d="{d}" fill="none" stroke="#4f8a3c" stroke-width="5"/>')
            for k in range(4):
                t = 0.25 + k * 0.2
                yy = L * t
                lianas.append(P(f"M{f(x)} {f(yy)}q14 -4 20 8q-14 2 -20 -8Z", "#6fbf5a", "#3f7a33", 1.6))
    s.g("cipos", lianas)
    # folhagem de canto superior
    s.g("folhas-topo", [canopy(rnd, 80, 30, 260, 110, "#3f9466", n=14), canopy(rnd, 1540, 20, 260, 110, "#3a8c60", n=14)])
    # plantas do sub-bosque: helicônias, bromélias, samambaias
    under = []

    def leaf_big(x, y, ang, L, col):
        ex, ey = x + math.cos(ang) * L, y + math.sin(ang) * L
        mx, my = (x + ex) / 2, (y + ey) / 2
        nx, ny = -math.sin(ang) * L * 0.28, math.cos(ang) * L * 0.28
        d = f"M{f(x)} {f(y)}Q{f(mx + nx)} {f(my + ny)} {f(ex)} {f(ey)}Q{f(mx - nx)} {f(my - ny)} {f(x)} {f(y)}Z"
        return P(d, col, dark(col, 0.4), 2.5) + f'<path d="M{f(x)} {f(y)}L{f(ex)} {f(ey)}" stroke="{light(col, 0.35)}" stroke-width="2.5"/>'

    for cx in (40, 230, 470, 1130, 1380, 1580):
        y = 1000
        for k in range(7):
            a = -math.pi / 2 + (k - 3) * 0.38 + rnd.uniform(-0.1, 0.1)
            under.append(leaf_big(cx, y, a, rnd.uniform(130, 190), rnd.choice(["#4fa565", "#5cb874", "#3f9459"])))
    # helicônias
    for hx_ in (300, 1240, 1450):
        y = 960
        under.append(f'<path d="M{hx_} {y}V{y - 170}" stroke="#4f8a3c" stroke-width="5"/>')
        for k in range(5):
            yy = y - 60 - k * 24
            side = 1 if k % 2 else -1
            under.append(P(f"M{hx_} {yy}l{side * 26} -8l{side * -8} 18Z", "#f25f5c" if k % 2 else "#ff7a5c", "#a83a36", 2))
            under.append(P(f"M{hx_ + side * 20} {yy - 6}l{side * 6} -2l-{side * 2} 6Z", "#ffc935"))
    # bromélias
    for bx_ in (560, 1060):
        y = 990
        for k in range(7):
            a = -math.pi / 2 + (k - 3) * 0.32
            under.append(leaf_big(bx_, y, a, 70, "#c05a8a" if k == 3 else "#6aa860"))
    s.g("sub-bosque", under)
    s.g("chao-detalhe", tufos(rnd, pts, "#5aa86a", n=36))
    return s.save(nome)


# ============ FLORESTA TEMPERADA (EUA) ============
def floresta_temperada():
    nome = "floresta-temperada"
    s, rnd = novo(nome, 33)
    ceu(s, nome)
    nuvens(s, rnd, [bird(1000, 200), bird(1030, 185, 0.7)])
    s.g("montanhas", [mountains(s, rnd, [(300, 850, 700, 430), (760, 860, 600, 290), (1300, 850, 760, 450)], "#b7cfe0", snow="#ffffff")])
    s.g("morros-longe", [hills(s, rnd, 820, 160, "#a9d4a6", n=8)])
    # linha de pinheiros distantes
    far = [conifer(x, 840 - 120 * edge(x, 1.5) + rnd.uniform(0, 20), rnd.uniform(90, 140), "#7fb38a", tiers=3, simple=True) for x in range(-20, 1650, 46) if not 520 < x < 1080 or rnd.random() < 0.3]
    s.g("pinheiros-longe", far)
    gp, pts = ground(s, 935, "#a6d79a", rnd, amp=110)
    s.g("chao", [gp])
    trees = []
    cols = ["#5fae5a", "#e8944a", "#f2c14e", "#d9653b", "#6cb85e"]
    for x, h, c in [(70, 640, "#5fae5a"), (300, 470, "#e8944a"), (450, 330, "#f2c14e"), (1540, 620, "#d9653b"), (1330, 480, "#6cb85e"), (1180, 320, "#f2a14e")]:
        y = ground_y(pts, x) + 14
        trees.append(shadow(x, y, h * 0.25))
        trees.append(tree_round(rnd, x, y, h, c, w=h * 0.75))
    for x, h in [(200, 520), (1440, 560)]:
        y = ground_y(pts, x) + 20
        trees.append(conifer(x, y, h, "#3f8a5a"))
    s.g("arvores", trees)
    # tronco caído com cogumelos e samambaias
    det = []
    lx, ly = 470, 975
    det.append(f'<rect x="{lx}" y="{ly - 46}" width="190" height="46" rx="23" fill="#a57850" stroke="#6a4a30" stroke-width="3"/>')
    det.append(f'<ellipse cx="{lx + 190}" cy="{ly - 23}" rx="16" ry="23" fill="#e8c9a0" stroke="#6a4a30" stroke-width="3"/>')
    det.append(f'<ellipse cx="{lx + 190}" cy="{ly - 23}" rx="8" ry="12" fill="none" stroke="#c49a6c" stroke-width="2.5"/>')
    det.append(f'<path d="M{lx + 20} {ly - 34}h120" stroke="#c49a6c" stroke-width="3"/>')
    for mx_ in (lx + 40, lx + 70):
        det.append(f'<rect x="{mx_ - 4}" y="{ly - 66}" width="8" height="22" rx="3" fill="#fff4e6"/>')
        det.append(P(f"M{mx_ - 18} {ly - 62}q18 -30 36 0Z", "#f25f5c", "#a83a36", 2.5))
        det.append(C(mx_ - 6, ly - 72, 3.5, "#ffffff"))
        det.append(C(mx_ + 6, ly - 68, 2.5, "#ffffff"))

    def fern(x, y, L, ang, col="#4f9a54"):
        out = []
        ex, ey = x + math.cos(ang) * L, y + math.sin(ang) * L
        out.append(f'<path d="M{f(x)} {f(y)}Q{f((x + ex) / 2)} {f((y + ey) / 2 - 20)} {f(ex)} {f(ey)}" fill="none" stroke="{dark(col, 0.3)}" stroke-width="3"/>')
        for k in range(1, 7):
            t = k / 7
            px, py = x + (ex - x) * t, y + (ey - y) * t - 20 * 4 * t * (1 - t)
            l = 22 * (1 - t * 0.7)
            out.append(E(px - 6, py - 6, l * 0.5, 5, col))
            out.append(E(px + 6, py + 4, l * 0.5, 5, light(col, 0.1)))
        return "".join(out)

    for fx in (60, 240, 1260, 1500):
        for a in (-2.4, -1.9, -1.2, -0.7):
            det.append(fern(fx, 995, 120, a))
    s.g("detalhes", det + tufos(rnd, pts, "#7cc06a", n=24))
    # folhas caídas
    lv = []
    for _ in range(26):
        x = rnd.choice([rnd.uniform(0, 520), rnd.uniform(1080, 1600)])
        y = rnd.uniform(950, 995)
        c = rnd.choice(["#e8944a", "#f2c14e", "#d9653b"])
        lv.append(E(x, y, 8, 4.5, c))
    s.g("folhas-chao", lv)
    return s.save(nome)


# ============ PRADARIA (EUA) ============
def pradaria():
    nome = "pradaria"
    s, rnd = novo(nome, 44)
    ceu(s, nome, top="#c8e7f5")
    nuvens(s, rnd, [bird(1180, 200), bird(1215, 188, 0.8), bird(420, 240, 0.7)])
    s.g("morros-longe", [hills(s, rnd, 800, 120, "#d6e3a8", n=6, minamp=0.4), hills(s, rnd, 850, 110, "#c8da8e", n=7, minamp=0.3)])
    # bisões bem pequenos ao longe
    s.g("bisoes-longe", [silhouette_bison(240, 805, 0.8, "#7a6040"), silhouette_bison(310, 812, 0.65, "#7a6040"), silhouette_bison(1330, 810, 0.75, "#7a6040")])
    gp, pts = ground(s, 935, "#c3d77c", rnd, amp=80)
    s.g("chao", [gp])
    # árvore solitária (choupo) nas bordas
    s.g("arvores", [shadow(1460, ground_y(pts, 1460) + 10, 70), tree_round(rnd, 1460, ground_y(pts, 1460) + 10, 330, "#8cbf5a", w=230),
                    shadow(150, ground_y(pts, 150) + 10, 50), tree_round(rnd, 150, ground_y(pts, 150) + 10, 230, "#9ac65e", w=170)])
    # capim alto ondulante nas bordas
    tall = []
    for _ in range(90):
        x = rnd.uniform(-20, W + 20)
        if 480 < x < 1120 and rnd.random() < 0.85:
            continue
        y = rnd.uniform(940, 1010)
        h = rnd.uniform(60, 150) * (0.6 + 0.6 * edge(x, 1))
        tall.append(grass(rnd, x, y, h, rnd.choice(["#b5c95f", "#a3ba4e", "#cbd77a", "#c9b45a"]), n=5, spread=1.4))
    # flores da pradaria: equinácea roxa e rudbéquia amarela
    for _ in range(24):
        x = rnd.choice([rnd.uniform(0, 480), rnd.uniform(1120, 1600)])
        y = rnd.uniform(860, 950)
        if rnd.random() < 0.5:
            tall.append(f'<path d="M{f(x)} {f(y)}V{f(y + 90)}" stroke="#6d8a3a" stroke-width="3"/>')
            for k in range(8):
                a = k * math.pi / 4
                tall.append(E(x + math.cos(a) * 11, y + 4 + abs(math.sin(a)) * 6, 9, 3.5, "#c77fc9"))
            tall.append(C(x, y, 7, "#b5602c"))
        else:
            tall.append(flower(x, y, "#ffc935", 8, center="#6a3a1c", stem="#6d8a3a"))
    s.g("capim", tall)
    return s.save(nome)


# ============ TAIGA (Rússia) ============
def taiga():
    nome = "taiga"
    s, rnd = novo(nome, 55)
    ceu(s, nome)
    nuvens(s, rnd)
    s.g("montanhas", [mountains(s, rnd, [(250, 870, 640, 450), (700, 880, 520, 300), (1250, 870, 700, 470), (1560, 880, 400, 330)], "#b3cfd8", snow="#ffffff")])
    s.g("morros-longe", [hills(s, rnd, 840, 130, "#b7d9c4", n=8)])
    far = [conifer(x, 850 - 140 * edge(x, 1.4) + rnd.uniform(0, 16), rnd.uniform(80, 130), "#86b9a0", tiers=3, simple=True) for x in range(-20, 1650, 36) if not 560 < x < 1040 or rnd.random() < 0.25]
    s.g("floresta-longe", far)
    gp, pts = ground(s, 935, "#9fcfa9", rnd, amp=110)
    s.g("chao", [gp])
    trees = []
    spec = [(20, 760), (150, 620), (280, 480), (390, 360), (1580, 780), (1450, 640), (1320, 500), (1210, 370)]
    for x, h in spec:
        y = ground_y(pts, x) + 20
        trees.append(shadow(x, y, h * 0.12))
        trees.append(conifer(x, y, h, rnd.choice(["#2f7a52", "#3a8a5c", "#2b6e4c"]), tiers=5, wfac=0.36))
    # bétulas
    for x, h in [(470, 300), (1120, 280)]:
        y = ground_y(pts, x) + 20
        trees.append(f'<rect x="{x - 9}" y="{y - h * 0.7}" width="18" height="{h * 0.7}" rx="6" fill="#f6f4ef" stroke="#8a8478" stroke-width="3"/>')
        for k in range(6):
            yy = y - 20 - k * h * 0.1
            trees.append(f'<path d="M{x - 9} {f(yy)}h{rnd.randint(6, 12)}" stroke="#3a3a3a" stroke-width="3.5"/>')
        trees.append(canopy(rnd, x, y - h * 0.8, h * 0.28, h * 0.22, "#a6cf5a", n=10))
    s.g("arvores", trees)
    det = tufos(rnd, pts, "#6fae7a", n=34)
    # cogumelos e mirtilos
    for mx_ in (330, 1270, 1500):
        y = 985
        det.append(f'<rect x="{mx_ - 5}" y="{y - 24}" width="10" height="24" rx="4" fill="#fff4e6" stroke="#b9a58a" stroke-width="2"/>')
        det.append(P(f"M{mx_ - 22} {y - 20}q22 -34 44 0Z", "#c9673b", "#7a3a20", 2.5))
    for bx_ in (100, 520, 1150, 1400):
        for k in range(6):
            det.append(C(bx_ + rnd.uniform(-22, 22), 975 + rnd.uniform(-10, 10), 6, "#4a5fb0"))
        det.append(C(bx_ - 4, 970, 2, "#ffffff", 0.8))
    det.append(rock(600, 990, 120, 60, "#b4bcbc"))
    det.append(rock(1000, 995, 90, 44, "#a9b2b2"))
    s.g("detalhes", det)
    return s.save(nome)


# ============ TUNDRA (Rússia) ============
def tundra():
    nome = "tundra"
    s, rnd = novo(nome, 66)
    ceu(s, nome, top="#cfe3f5", sunpos=(240, 170))
    # aurora suave no topo
    s.g("aurora", [P("M-20 120C300 40 500 200 800 110S1300 40 1620 140L1620 60C1300 -20 1000 120 800 50S300 -20 -20 50Z", s.lg([(0, "#9fe3c9", 0.0), (0.3, "#9fe3c9", 0.45), (0.7, "#c7b5f0", 0.4), (1, "#c7b5f0", 0)], 0, 0, 1, 0))])
    nuvens(s, rnd)
    s.g("montanhas", [mountains(s, rnd, [(260, 820, 700, 300), (1300, 820, 800, 320), (800, 830, 500, 170)], "#c4d9ea", snow="#ffffff")])
    s.g("neve-longe", [hills(s, rnd, 840, 120, "#e3eef8", n=7, minamp=0.2)])
    s.g("renas-longe", [silhouette_reindeer(1200, 850, 0.8, "#6a7f95"), silhouette_reindeer(1260, 855, 0.65, "#6a7f95"), silhouette_reindeer(280, 860, 0.7, "#6a7f95")])
    gp, pts = ground(s, 935, "#eef5fc", rnd, amp=90)
    s.g("chao", [gp])
    det = []
    # manchas de vegetação rasteira (salgueiro-anão, musgo, líquen)
    for _ in range(16):
        x = rnd.choice([rnd.uniform(0, 520), rnd.uniform(1080, 1600)])
        y = ground_y(pts, x) + rnd.uniform(20, 70)
        w = rnd.uniform(60, 140)
        det.append(E(x, y, w, w * 0.2, rnd.choice(["#b8c98a", "#c9b07a", "#a9bf8a"]), 0.9))
        for k in range(5):
            det.append(C(x + rnd.uniform(-w * 0.7, w * 0.7), y + rnd.uniform(-6, 4), rnd.uniform(5, 10), rnd.choice(["#9fb36a", "#d08a5a", "#b8a060"])))
    # algodão-do-ártico (pompons brancos)
    for _ in range(26):
        x = rnd.choice([rnd.uniform(0, 500), rnd.uniform(1100, 1600)])
        y = rnd.uniform(900, 990)
        h = rnd.uniform(30, 60)
        det.append(f'<path d="M{f(x)} {f(y)}q-3 {f(-h / 2)} 0 {f(-h)}" fill="none" stroke="#7d8f5a" stroke-width="2.5"/>')
        det.append(C(x, y - h - 4, 9, "#ffffff"))
        det.append(C(x + 3, y - h - 2, 5, "#e3edf6"))
    # pedras com líquen
    for x, w, h in [(120, 240, 80), (1480, 260, 86), (420, 130, 44), (1230, 140, 48)]:
        y = ground_y(pts, x) + 30
        det.append(shadow(x, y, w * 0.5))
        for (ox, ow, oh) in [(-0.22, 0.6, 0.8), (0.2, 0.55, 1.0), (0.42, 0.3, 0.5)]:
            bx_, bw, bh = x + ox * w, ow * w, oh * h
            d = f"M{f(bx_ - bw / 2)} {f(y)}L{f(bx_ - bw * 0.42)} {f(y - bh * 0.6)}L{f(bx_ - bw * 0.15)} {f(y - bh)}L{f(bx_ + bw * 0.25)} {f(y - bh * 0.92)}L{f(bx_ + bw / 2)} {f(y - bh * 0.4)}L{f(bx_ + bw * 0.46)} {f(y)}Z"
            det.append(P(d, "#b7c2cc", "#7f8a96", 3))
            det.append(P(f"M{f(bx_ + bw * 0.05)} {f(y - bh * 0.96)}L{f(bx_ + bw * 0.25)} {f(y - bh * 0.92)}L{f(bx_ + bw / 2)} {f(y - bh * 0.4)}L{f(bx_ + bw * 0.46)} {f(y)}L{f(bx_ + bw * 0.1)} {f(y)}Z", "#9eaab6", op=0.8))
            det.append(P(f"M{f(bx_ - bw * 0.4)} {f(y - bh * 0.62)}L{f(bx_ - bw * 0.15)} {f(y - bh)}L{f(bx_ + bw * 0.1)} {f(y - bh * 0.95)}L{f(bx_ - bw * 0.1)} {f(y - bh * 0.85)}Z", "#ffffff", op=0.95))
        for k in range(4):
            det.append(C(x + rnd.uniform(-w * 0.3, w * 0.3), y - rnd.uniform(10, h * 0.5), rnd.uniform(4, 8), "#e2c35a", 0.85))
    # montinhos de neve brilhando
    for x in (300, 1350, 60, 1560):
        y = ground_y(pts, x) + 60
        det.append(P(f"M{x - 110} {y + 14}C{x - 70} {y - 22} {x + 50} {y - 26} {x + 110} {y + 14}Z", "#ffffff"))
        det.append(f'<path d="M{x - 70} {y + 10}q70 14 140 0" fill="none" stroke="#cfe0f0" stroke-width="3"/>')
    for _ in range(14):
        x, y = rnd.choice([rnd.uniform(0, 500), rnd.uniform(1100, 1600)]), rnd.uniform(880, 990)
        det.append(f'<path d="M{f(x)} {f(y - 6)}v12M{f(x - 6)} {f(y)}h12" stroke="#ffffff" stroke-width="2.5"/>')
    s.g("detalhes", det)
    return s.save(nome)


# ============ BAMBUZAL (China) ============
def bambuzal():
    nome = "bambuzal"
    s, rnd = novo(nome, 77)
    ceu(s, nome, top="#d4ecdf")
    s.g("nuvens", [cloud(560, 140, 0.7, op=0.7), cloud(1120, 110, 0.8, op=0.7)])
    # montanhas em névoa (estilo Sichuan / pinturas chinesas)
    peaks = []
    for (x, y, w, h, c) in [(160, 760, 340, 420, "#c9e0d3"), (420, 780, 280, 300, "#bcd9c8"), (1200, 760, 300, 440, "#c9e0d3"), (1460, 790, 300, 340, "#bcd9c8"), (820, 800, 360, 200, "#d4e8dc")]:
        d = f"M{x - w / 2} {y + 40}C{x - w * 0.35} {y - h * 0.4} {x - w * 0.2} {y - h} {x} {y - h}C{x + w * 0.2} {y - h} {x + w * 0.3} {y - h * 0.4} {x + w / 2} {y + 40}Z"
        peaks.append(P(d, s.lg([(0, light(c, 0.1)), (1, c)])))
        peaks.append(P(f"M{x + 6} {y - h + 6}C{x + w * 0.18} {y - h} {x + w * 0.26} {y - h * 0.4} {x + w * 0.44} {y + 40}H{x + w * 0.1}Z", dark(c, 0.08), op=0.6))
        for k in range(3):
            px = x + rnd.uniform(-w * 0.2, w * 0.2)
            py = y - h * rnd.uniform(0.3, 0.7)
            peaks.append(conifer(px, py, 30, dark(c, 0.15), tiers=3, simple=True))
    s.g("montanhas-nevoa", peaks)
    s.g("nevoa", [f'<rect y="620" width="1600" height="260" fill="{s.lg([(0, "#f2faf4", 0), (0.5, "#f2faf4", 0.85), (1, "#f2faf4", 0.2)])}"/>'])
    gp, pts = ground(s, 940, "#b6dc95", rnd, amp=80)
    s.g("chao", [gp])
    # bambus ao fundo (mais claros) e na frente
    back = []
    for x in list(range(-10, 460, 95)) + list(range(1160, 1640, 95)):
        back.append(bamboo(rnd, x + rnd.uniform(-10, 10), 960, rnd.uniform(700, 1000), w=16, col="#b5d98a", leaf="#a3cf7a", simple=True))
    s.g("bambus-fundo", back)
    front = []
    for x in [30, 170, 330, 1280, 1430, 1570]:
        front.append(bamboo(rnd, x, 1010, rnd.uniform(900, 1100), w=rnd.uniform(24, 30), col=rnd.choice(["#8cc152", "#7db84a", "#9ccb5c"]), leaf="#5fa83a"))
    s.g("bambus-frente", front)
    det = tufos(rnd, pts, "#7cbf5a", n=30)
    det.append(rock(520, 990, 140, 64, "#b9c2b0"))
    det.append(rock(1100, 985, 110, 52, "#c2c9b8"))
    # brotos de bambu
    for bx_ in (470, 600, 1170):
        det.append(P(f"M{bx_ - 14} 990Q{bx_ - 10} 950 {bx_} 930Q{bx_ + 10} 950 {bx_ + 14} 990Z", "#c9b06a", "#7a6a3a", 2.5))
        det.append(f'<path d="M{bx_ - 10} 970q10 -8 20 0M{bx_ - 7} 952q7 -6 14 0" fill="none" stroke="#7a6a3a" stroke-width="2"/>')
    s.g("detalhes", det)
    return s.save(nome)


# ============ DESERTO (Gobi, China) ============
def deserto():
    nome = "deserto"
    s, rnd = novo(nome, 88)
    ceu(s, nome, top="#cfe6f2", sunpos=(240, 140))
    s.g("nuvens", [cloud(1200, 100, 0.8, op=0.75), cloud(420, 160, 0.6, op=0.6)])
    # montanhas Altai ao longe
    s.g("montanhas", [mountains(s, rnd, [(200, 860, 600, 330), (1350, 860, 700, 360), (800, 870, 500, 210)], "#d8c9c0", snow="#ffffff")])
    # penhascos avermelhados (Flaming Cliffs)
    cliffs = []
    for (x0, x1, top, flip) in [(-20, 440, 650, 1), (1160, 1620, 630, -1)]:
        a, b_ = (x0, x1) if flip == 1 else (x1, x0)
        d = f"M{a} 900L{a} {top}C{a + flip * 120} {top - 8} {b_ - flip * 160} {top - 4} {b_ - flip * 90} {top + 30}C{b_ - flip * 60} {top + 50} {b_ - flip * 40} {top + 90} {b_ - flip * 20} {top + 110}C{b_} {top + 160} {b_} {top + 200} {b_ + flip * 20} 900Z"
        cliffs.append(P(d, s.lg([(0, "#f2b984"), (1, "#d98e5c")]), "#a8603a", 3))
        for k in range(4):
            yy = top + 40 + k * 48
            cliffs.append(f'<path d="M{a} {yy}Q{(a + b_) / 2} {yy - 10} {b_ - flip * (60 - k * 12)} {yy + 6}" fill="none" stroke="#c97a4a" stroke-width="4" opacity="0.55"/>')
        cliffs.append(f'<path d="M{a + flip * 20} {top + 12}Q{(a + b_) / 2} {top + 2} {b_ - flip * 120} {top + 14}" fill="none" stroke="#ffd6ae" stroke-width="5"/>')
    s.g("penhascos", cliffs)
    # dunas
    s.g("dunas", [hills(s, rnd, 860, 120, "#f3dba0", n=6, minamp=0.3, jitter=0.2), hills(s, rnd, 900, 90, "#eed08a", n=7, minamp=0.3)])
    s.g("camelos-longe", [silhouette_camel(1000, 865, 0.8, "#8a6a40"), silhouette_camel(1060, 868, 0.65, "#8a6a40"), silhouette_camel(1110, 870, 0.55, "#8a6a40")])
    gp, pts = ground(s, 945, "#f2d898", rnd, amp=70)
    s.g("chao", [gp])
    det = []
    # ondulações de areia
    for _ in range(20):
        x = rnd.choice([rnd.uniform(0, 600), rnd.uniform(1000, 1600)])
        y = rnd.uniform(930, 995)
        det.append(f'<path d="M{f(x)} {f(y)}q30 -8 60 0q30 8 60 0" fill="none" stroke="#dcb870" stroke-width="3" stroke-linecap="round" opacity="0.8"/>')
    # saxaul (arbusto do Gobi) e touceiras de capim
    for x, k in [(150, 1.2), (420, 0.8), (1220, 1.0), (1470, 1.3)]:
        y = ground_y(pts, x) + 40
        det.append(shadow(x, y, 60 * k))
        br = ""
        for a in (-1.2, -0.7, -0.2, 0.3, 0.8):
            ex, ey = x + math.sin(a) * 70 * k, y - math.cos(a) * 80 * k
            br += f"M{f(x)} {f(y)}Q{f(x + math.sin(a) * 20)} {f(y - 40 * k)} {f(ex)} {f(ey)}"
        det.append(f'<path d="{br}" fill="none" stroke="#7a5a3c" stroke-width="{f(7 * k)}"/>')
        det.append(canopy(rnd, x, y - 80 * k, 75 * k, 26 * k, "#a8b878", n=9, rmin=0.4, rmax=0.7, texture=False))
    for _ in range(14):
        x = rnd.choice([rnd.uniform(0, 520), rnd.uniform(1080, 1600)])
        det.append(grass(rnd, x, rnd.uniform(950, 995), rnd.uniform(18, 30), "#c2b46a", n=6))
    for x, w, h in [(560, 110, 50), (1040, 80, 40), (60, 140, 70)]:
        det.append(rock(x, ground_y(pts, x) + 50, w, h, "#d0a888"))
    s.g("detalhes", det)
    return s.save(nome)


# ============ OUTBACK (Austrália) ============
def outback():
    nome = "outback"
    s, rnd = novo(nome, 99)
    ceu(s, nome, top="#c9e4f2", sunpos=(240, 150))
    s.g("nuvens", [cloud(1180, 110, 0.8, op=0.75), cloud(380, 130, 0.6, op=0.7)])
    # monolito vermelho ao longe (direita)
    mono = [P("M1010 820C1020 770 1050 715 1130 706C1210 700 1290 712 1335 748C1360 772 1368 800 1376 820Z", s.lg([(0, "#f09a6a"), (1, "#c9653a")]), "#9a4a28", 3)]
    for k in range(6):
        x = 1060 + k * 48
        mono.append(f'<path d="M{x} {714 + abs(k - 3) * 6}q-6 46 -2 100" fill="none" stroke="#b25a32" stroke-width="3" opacity="0.6"/>')
    mono.append(f'<path d="M1050 752Q1090 716 1150 712" fill="none" stroke="#ffc09a" stroke-width="5"/>')
    s.g("monolito", mono)
    s.g("planicie-longe", [hills(s, rnd, 830, 60, "#eab48c", n=6, minamp=0.5)])
    s.g("cangurus-longe", [silhouette_kangaroo(330, 845, 0.8, "#8a4a2a"), silhouette_kangaroo(395, 850, 0.6, "#8a4a2a")])
    gp, pts = ground(s, 940, "#eaa678", rnd, amp=90)
    s.g("chao", [gp])
    det = []
    # cupinzeiros-catedral
    for x, h in [(120, 260), (230, 170), (1430, 230), (1310, 150)]:
        y = ground_y(pts, x) + 40
        det.append(shadow(x, y, h * 0.3))
        d = f"M{x - h * 0.22} {y}C{x - h * 0.2} {y - h * 0.5} {x - h * 0.12} {y - h * 0.8} {x - h * 0.04} {y - h}Q{x + 4} {y - h - 10} {x + h * 0.06} {y - h * 0.9}C{x + h * 0.1} {y - h * 0.7} {x + h * 0.14} {y - h * 0.6} {x + h * 0.18} {y - h * 0.62}C{x + h * 0.2} {y - h * 0.4} {x + h * 0.24} {y - h * 0.2} {x + h * 0.26} {y}Z"
        det.append(P(d, s.lg([(0, "#e8935c"), (1, "#c86a3c")], 0, 0, 1, 0), "#8e4626", 3))
        det.append(f'<path d="M{x - h * 0.1} {y - 10}Q{x - h * 0.12} {y - h * 0.5} {x - h * 0.04} {y - h * 0.9}" fill="none" stroke="#f6b588" stroke-width="4"/>')
        for k in range(4):
            det.append(f'<path d="M{x + rnd.uniform(-h * 0.1, h * 0.15)} {y - rnd.uniform(10, h * 0.6)}v12" stroke="#a85a32" stroke-width="2.5"/>')
    # árvores esparsas (carvalho-do-deserto / mulga)
    for x, h in [(350, 300), (1560, 300)]:
        y = ground_y(pts, x) + 20
        det.append(shadow(x, y, 70))
        det.append(trunk(x, y, h * 0.6, 18, "#6a4a3a", lean=10))
        det.append(canopy(rnd, x + 10, y - h * 0.72, h * 0.32, h * 0.13, "#8aa86a", n=12, rmin=0.4, rmax=0.65))
    # spinifex (touceiras espinhosas em domo)
    for _ in range(18):
        x = rnd.choice([rnd.uniform(-20, 540), rnd.uniform(1060, 1620)])
        y = rnd.uniform(950, 1000)
        r = rnd.uniform(30, 55)
        det.append(E(x, y, r, r * 0.5, "#c9b86a"))
        sp = ""
        for k in range(11):
            a = math.pi + k * math.pi / 10
            sp += f"M{f(x)} {f(y)}L{f(x + math.cos(a) * r * 1.15)} {f(y + math.sin(a) * r * 0.85)}"
        det.append(f'<path d="{sp}" stroke="#a89a4a" stroke-width="2.5"/>')
        det.append(E(x - r * 0.25, y - r * 0.2, r * 0.4, r * 0.15, "#e2d48a", 0.8))
    for x, w, h in [(560, 120, 52), (1040, 90, 40)]:
        det.append(rock(x, 990, w, h, "#c98a62"))
    s.g("detalhes", det)
    return s.save(nome)


# ============ EUCALIPTOS (Austrália) ============
def eucaliptos():
    nome = "eucaliptos"
    s, rnd = novo(nome, 111)
    ceu(s, nome, top="#cde6f0")
    nuvens(s, rnd)
    # serra azulada (Blue Mountains: névoa azul dos eucaliptos)
    s.g("serra-azul", [hills(s, rnd, 760, 230, "#b9d0e0", n=6, minamp=0.3), hills(s, rnd, 820, 170, "#a9c9c8", n=7, minamp=0.25)])
    gp, pts = ground(s, 940, "#b9d6a0", rnd, amp=100)
    s.g("chao", [gp])

    def euca(x, h, lean):
        y = ground_y(pts, x) + 20
        out = [shadow(x, y, h * 0.12)]
        out.append(trunk(x, y, h * 0.8, h * 0.06, "#e9e4d8", lean=lean))
        # casca descascando
        for k in range(5):
            yy = y - h * (0.1 + k * 0.13)
            xx = x + lean * ((y - yy) / (h * 0.8)) ** 2 * 0.6
            out.append(E(xx + rnd.uniform(-6, 6), yy, h * 0.012 + 4, h * 0.03, rnd.choice(["#c9b8a0", "#b9c4b8", "#d9c49a"])))
        # galhos e copas penduradas
        tx = x + lean
        ty = y - h * 0.8
        for a, L in [(-0.9, 0.22), (0.7, 0.2), (-0.2, 0.18), (0.25, 0.16)]:
            ex, ey = tx + math.sin(a) * h * L, ty - math.cos(a) * h * L
            out.append(f'<path d="M{f(tx)} {f(ty + 30)}Q{f(tx + math.sin(a) * 20)} {f(ty)} {f(ex)} {f(ey)}" fill="none" stroke="#cfc6b4" stroke-width="{f(h * 0.022)}"/>')
            out.append(canopy(rnd, ex, ey + 10, h * 0.13, h * 0.08, "#8fb59a", n=5, rmin=0.5, rmax=0.8, texture=False))
            # folhas penduradas
            for k in range(2):
                lx = ex + rnd.uniform(-h * 0.1, h * 0.1)
                ly = ey + h * 0.06
                out.append(P(f"M{f(lx)} {f(ly)}q-4 14 0 26q4 -12 0 -26Z", "#7aa58a"))
        return "".join(out)

    s.g("eucaliptos", [euca(60, 900, 20), euca(250, 700, -10), euca(400, 460, 10), euca(1540, 920, -20), euca(1350, 680, 14), euca(1200, 440, -8)])
    det = tufos(rnd, pts, "#9fbf7a", n=34)
    # árvore-de-grama (Xanthorrhoea): tronco curto e escuro, saia de folhas finas e haste de flor
    for x, k in [(500, 1.0), (1110, 0.9), (180, 0.8)]:
        y = ground_y(pts, x) + 70
        det.append(shadow(x, y, 50 * k))
        det.append(f'<rect x="{x - 14 * k}" y="{y - 60 * k}" width="{28 * k}" height="{60 * k}" rx="8" fill="#4a3a30" stroke="#2a201a" stroke-width="2.5"/>')
        lv = ""
        for j in range(26):
            a = -math.pi / 2 + (j - 12.5) * 0.12
            L = 90 * k
            lv += f"M{f(x)} {f(y - 60 * k)}Q{f(x + math.cos(a) * L * 0.6)} {f(y - 60 * k + math.sin(a) * L * 0.8)} {f(x + math.cos(a) * L * 1.1)} {f(y - 60 * k + math.sin(a) * L * 0.4 + L * 0.5)}"
        det.append(f'<path d="{lv}" fill="none" stroke="#7fa64a" stroke-width="3"/>')
        det.append(f'<path d="M{x} {y - 70 * k}V{y - 230 * k}" stroke="#7a6040" stroke-width="{6 * k}"/>')
        det.append(f'<rect x="{x - 7 * k}" y="{y - 230 * k}" width="{14 * k}" height="{90 * k}" rx="{7 * k}" fill="#c9a86a" stroke="#8a6a3a" stroke-width="2"/>')
        for j in range(6):
            det.append(C(x + rnd.uniform(-4, 4) * k, y - (150 + j * 12) * k, 2.2, "#fff4c9"))
    # flores de acácia-dourada (wattle)
    for x in (620, 1000, 300, 1290):
        y = ground_y(pts, x) + 60
        det.append(canopy(rnd, x, y - 30, 50, 30, "#9fbf6a", n=6, texture=False))
        for _ in range(12):
            det.append(C(x + rnd.uniform(-50, 50), y - 30 + rnd.uniform(-28, 20), 5, "#ffd24a"))
    s.g("detalhes", det)
    return s.save(nome)


# ============ SAVANA (África) ============
def savana():
    nome = "savana"
    s, rnd = novo(nome, 121)
    ceu(s, nome, top="#cde7f2", sunpos=(240, 150))
    nuvens(s, rnd, [bird(1150, 220), bird(1185, 208, 0.7)])
    # montanha com topo nevado (tipo Kilimanjaro) ao longe à direita
    s.g("montanha", [P("M1000 800L1180 640Q1260 600 1340 640L1560 800Z", s.lg([(0, "#c7d3dc"), (1, "#b4c3cc")])),
                     P("M1180 640Q1260 600 1340 640L1310 662l-24 -10l-22 14l-24 -12l-22 12l-18 -10Z", "#ffffff", "#d0dde8", 2)])
    s.g("planicie-longe", [hills(s, rnd, 830, 80, "#efd98e", n=6, minamp=0.4)])
    s.g("acacias-longe", [acacia(rnd, x, 835 - 50 * edge(x), rnd.uniform(70, 100), base="#b3c27a", wood="#a08a6a", n=7) for x in (520, 700, 980, 1100)])
    s.g("girafas-longe", [silhouette_giraffe(760, 840, 0.7, "#a07a40"), silhouette_giraffe(810, 845, 0.55, "#a07a40")])
    gp, pts = ground(s, 940, "#ecd27e", rnd, amp=90)
    s.g("chao", [gp])
    trees = []
    x = 1420
    y = ground_y(pts, x) + 20
    trees += [shadow(x, y, 180), acacia(rnd, x, y, 520, base="#8fae4a")]
    x = 160
    y = ground_y(pts, x) + 20
    trees += [shadow(x, y, 110), baobab(rnd, x, y, 470)]
    x = 420
    y = ground_y(pts, x) + 16
    trees += [shadow(x, y, 100), acacia(rnd, x, y, 300, base="#9cb854")]
    s.g("arvores", trees)
    det = []
    # pedras (kopje)
    for x, w, h in [(1180, 160, 90), (1260, 110, 70), (600, 90, 46)]:
        det.append(shadow(x, ground_y(pts, x) + 50, w * 0.5))
        det.append(rock(x, ground_y(pts, x) + 50, w, h, "#c9b49a"))
    # capim dourado alto
    for _ in range(95):
        x = rnd.uniform(-20, W + 20)
        if 520 < x < 1080 and rnd.random() < 0.85:
            continue
        yv = rnd.uniform(945, 1010)
        h = rnd.uniform(40, 120) * (0.6 + 0.6 * edge(x, 1))
        det.append(grass(rnd, x, yv, h, rnd.choice(["#e2b84a", "#d9a83a", "#f0cc6a", "#c9a24a"]), n=5, spread=1.3))
    s.g("capim", det)
    return s.save(nome)


# ============ RIOS (África: rios e florestas) ============
def rios():
    nome = "rios"
    s, rnd = novo(nome, 131)
    ceu(s, nome)
    nuvens(s, rnd, [bird(1050, 200), bird(1080, 188, 0.7)])
    far = [canopy(rnd, x, 840 - 200 * edge(x, 1.3), 90, 55, "#b9e0c8", n=5, outline="#addabf", texture=False) for x in range(-40, 1700, 100)]
    s.g("floresta-longe", far)
    gp, pts = ground(s, 900, "#8fcf9c", rnd, amp=120)
    s.g("margens", [gp])
    # rio largo atravessando a parte de baixo
    river = P("M-20 920C300 880 500 900 800 890S1300 870 1620 910L1620 1010L-20 1010Z", s.lg([(0, "#bfe6ee"), (0.5, "#8fd0e0"), (1, "#6fbcd2")]), "#5aa6bb", 3)
    rip = []
    for _ in range(22):
        x = rnd.uniform(0, 1600)
        y = rnd.uniform(925, 995)
        w = rnd.uniform(30, 80)
        rip.append(f'<path d="M{f(x)} {f(y)}q{f(w / 2)} -6 {f(w)} 0" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>')
    # vitórias-régias / nenúfares com flor
    for x, y in [(240, 960), (330, 985), (1290, 955), (1380, 980), (560, 990)]:
        rip.append(P(f"M{x} {y}m-34 0a34 11 0 1 0 68 0a34 11 0 1 0 -68 0Z", "#6fbf6a", "#3f8a44", 2.5))
        rip.append(P(f"M{x} {y}l30 -6l0 8Z", "#8fd0e0"))
        if rnd.random() < 0.7:
            for k in range(6):
                a = math.pi + k * math.pi / 5
                rip.append(E(x - 4 + math.cos(a) * 9, y - 8 + math.sin(a) * 6, 7, 4, "#f7a6c4"))
            rip.append(C(x - 4, y - 10, 4, "#ffd34d"))
    s.g("rio", [river] + rip)
    trees = []
    for x, h, col in [(80, 720, "#3f9466"), (1520, 700, "#3a8c60"), (300, 470, "#55a86c")]:
        y = ground_y(pts, x) + 30
        trees.append(shadow(x, y, h * 0.2))
        trees.append(trunk(x, y, h * 0.6, h * 0.08, "#8a6a4a"))
        trees.append(canopy(rnd, x, y - h * 0.72, h * 0.34, h * 0.24, col, n=14))
    # palmeiras-ráfia na margem direita
    for x, h, lean in [(1330, 420, -50), (1220, 330, 30)]:
        y = ground_y(pts, x) + 20
        trees.append(palm(x, y, h, lean, base="#4fa055", rnd=rnd))
    s.g("arvores", trees)
    # papiros nas margens
    pap = []
    for x0, x1 in [(-10, 520), (1080, 1610)]:
        for _ in range(14):
            x = rnd.uniform(x0, x1)
            y = rnd.uniform(905, 945)
            h = rnd.uniform(110, 200)
            tx = x + rnd.uniform(-20, 20)
            pap.append(f'<path d="M{f(x)} {f(y)}Q{f(x)} {f(y - h * 0.6)} {f(tx)} {f(y - h)}" fill="none" stroke="#5a9a4a" stroke-width="3.5"/>')
            um = ""
            for k in range(11):
                a = math.pi + 0.15 + k * (math.pi - 0.3) / 10
                um += f"M{f(tx)} {f(y - h)}l{f(math.cos(a) * 30)} {f(math.sin(a) * 22 + 8)}"
            pap.append(f'<path d="{um}" stroke="#7cbf5a" stroke-width="2.5"/>')
            pap.append(C(tx, y - h, 4, "#9a7a3a"))
    s.g("papiros", pap)
    return s.save(nome)


# ============ CERRADO (Brasil) ============
def cerrado():
    nome = "cerrado"
    s, rnd = novo(nome, 141)
    ceu(s, nome, top="#cfe6f2")
    nuvens(s, rnd, [bird(1120, 200), bird(1150, 188, 0.7)])
    chap = []
    for (a, bb, top, fl) in [(-20, 600, 680, 1), (1620, 1060, 700, -1)]:
        d = f"M{a} 860L{a} {top}C{a + fl * 200} {top - 10} {bb - fl * 160} {top - 6} {bb - fl * 80} {top + 20}C{bb - fl * 40} {top + 34} {bb - fl * 20} {top + 80} {bb} 860Z"
        chap.append(P(d, s.lg([(0, "#e8c49a"), (1, "#cfa076")]), "#a8744a", 3))
        chap.append(f'<path d="M{a} {top + 40}Q{(a + bb) / 2} {top + 30} {bb - fl * 50} {top + 50}M{a} {top + 80}Q{(a + bb) / 2} {top + 70} {bb - fl * 30} {top + 92}" fill="none" stroke="#c08a5e" stroke-width="4" opacity="0.6"/>')
        chap.append(f'<path d="M{a + fl * 20} {top + 10}Q{(a + bb) / 2} {top} {bb - fl * 120} {top + 12}" fill="none" stroke="#f6dcbc" stroke-width="5"/>')
        for k in range(6):
            xx = a + fl * (40 + k * 85)
            chap.append(canopy(rnd, xx, top - 4, 30, 14, "#a9b86a", n=4, texture=False))
    s.g("chapada", chap)
    s.g("morros-longe", [hills(s, rnd, 850, 80, "#d8d49a", n=7, minamp=0.4)])
    gp, pts = ground(s, 940, "#ddd28c", rnd, amp=90)
    s.g("chao", [gp])

    def torta(x, h, col):
        y = ground_y(pts, x) + 20
        d = f"M{x - 12} {y}C{x - 20} {y - h * 0.3} {x + 30} {y - h * 0.4} {x + 10} {y - h * 0.6}C{x - 10} {y - h * 0.75} {x - 30} {y - h * 0.7} {x - 40} {y - h * 0.82}"
        d2 = f"M{x + 10} {y - h * 0.6}C{x + 40} {y - h * 0.7} {x + 50} {y - h * 0.72} {x + 70} {y - h * 0.86}"
        out = [shadow(x, y, h * 0.25),
               f'<path d="{d}{d2}" fill="none" stroke="#5a3e2a" stroke-width="{f(h * 0.07 + 6)}"/>',
               f'<path d="{d}{d2}" fill="none" stroke="#8a6448" stroke-width="{f(h * 0.07)}"/>']
        for k in range(6):  # casca grossa e rachada (cortiça)
            yy = y - h * (0.08 + k * 0.09)
            out.append(f'<path d="M{f(x - 8 + (k % 2) * 10)} {f(yy)}l8 -6" stroke="#5a3e2a" stroke-width="2.5"/>')
        out.append(canopy(rnd, x - 40, y - h * 0.9, h * 0.22, h * 0.13, col, n=8))
        out.append(canopy(rnd, x + 70, y - h * 0.94, h * 0.22, h * 0.13, col, n=8))
        return "".join(out)

    trees = [torta(120, 420, "#8fb24a"), torta(1460, 440, "#9ab84e")]
    # ipê-amarelo florido
    x = 340
    y = ground_y(pts, x) + 20
    trees += [shadow(x, y, 80), trunk(x, y, 220, 22, "#7a5a40", lean=8), canopy(rnd, x + 8, y - 270, 110, 70, "#ffc935", n=14)]
    # buritis (vereda) à direita
    for bx_, h in [(1250, 460), (1160, 380)]:
        trees.append(palm(bx_, ground_y(pts, bx_) + 20, h, 0, base="#6aa84a", wood="#9a8a70", fronds=10, rnd=rnd))
    s.g("arvores", trees)
    det = []
    # cupinzeiro
    for x, h in [(560, 120), (1060, 90)]:
        y = ground_y(pts, x) + 60
        det.append(shadow(x, y, h * 0.5))
        det.append(P(f"M{x - h * 0.45} {y}C{x - h * 0.4} {y - h * 0.8} {x - h * 0.2} {y - h} {x} {y - h}C{x + h * 0.25} {y - h} {x + h * 0.4} {y - h * 0.7} {x + h * 0.45} {y}Z", "#c98a5a", "#8e5636", 3))
        det.append(f'<path d="M{x - h * 0.25} {y - 10}Q{x - h * 0.3} {y - h * 0.6} {x - h * 0.05} {y - h * 0.9}" fill="none" stroke="#e8b080" stroke-width="4"/>')
    for _ in range(80):
        x = rnd.uniform(-20, W + 20)
        if 540 < x < 1060 and rnd.random() < 0.85:
            continue
        det.append(grass(rnd, x, rnd.uniform(945, 1010), rnd.uniform(40, 100), rnd.choice(["#c9b45a", "#b5a84a", "#d8c46a", "#a8b05a"]), n=5, spread=1.3))
    # chuveirinhos e canela-de-ema
    for _ in range(14):
        x = rnd.choice([rnd.uniform(0, 520), rnd.uniform(1080, 1600)])
        y = rnd.uniform(890, 960)
        det.append(f'<path d="M{f(x)} {f(y)}V{f(y + 70)}" stroke="#8a8a4a" stroke-width="2"/>')
        det.append(C(x, y, 6, "#ffffff"))
    s.g("capim", det)
    return s.save(nome)


# ============ RECIFE (Oceano) ============
def recife():
    nome = "recife"
    s, rnd = novo(nome, 151)
    s.add(f'<rect width="1600" height="1000" fill="{s.lg([(0, "#bfe6f7"), (0.45, "#d8eef9"), (1, "#a9d8f0")])}"/>')
    # superfície ondulada e raios de luz da esquerda
    s.add(P("M-20 0H1620V40Q1500 60 1400 40T1200 40T1000 40T800 40T600 40T400 40T200 40T0 40Z", "#e9f8ff", op=0.8))
    rays = []
    for x, w in [(120, 120), (330, 80), (520, 140), (900, 90), (1150, 130)]:
        rays.append(P(f"M{x} 0L{x + w} 0L{x + w + 260} 1000L{x + 180} 1000Z", "#ffffff", op=0.18))
    s.g("raios", rays)
    bub = []
    for _ in range(40):
        x = rnd.choice([rnd.uniform(0, 420), rnd.uniform(1180, 1600), rnd.uniform(0, 1600)])
        y = rnd.uniform(80, 900)
        r = rnd.uniform(4, 12)
        bub.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="#ffffff" fill-opacity="0.35" stroke="#ffffff" stroke-width="2" stroke-opacity="0.8"/>')
        bub.append(C(x - r * 0.35, y - r * 0.35, r * 0.25, "#ffffff", 0.9))
    s.g("bolhas", bub)
    # cardume pequeno ao longe (silhuetas)
    fish = []
    for k in range(9):
        x, y = 1080 + (k % 3) * 34 + rnd.uniform(-6, 6), 230 + (k // 3) * 22
        fish.append(P(f"M{f(x)} {f(y)}q12 -9 24 0q-12 9 -24 0Zm24 0l9 -7v14Z", "#6aa8c8", op=0.45))
    s.g("cardume-longe", fish)
    s.g("rochas-longe", [hills(s, rnd, 850, 160, "#9fcde0", n=7, minamp=0.2)])
    gp, pts = ground(s, 940, "#f4e4bc", rnd, amp=90)
    s.g("areia", [gp] + [f'<path d="M{f(x)} {f(y)}q20 -6 40 0" fill="none" stroke="#e2cc98" stroke-width="3"/>' for x, y in [(rnd.uniform(0, 1600), rnd.uniform(940, 995)) for _ in range(18)]])
    cor = []

    def branchy(x, y, h, col):
        out = []
        oc = dark(col, 0.35)

        def br(x0, y0, a, L, d):
            x1, y1 = x0 + math.sin(a) * L, y0 - math.cos(a) * L
            out.append(f'<path d="M{f(x0)} {f(y0)}L{f(x1)} {f(y1)}" stroke="{oc}" stroke-width="{f(6 + d * 4 + 5)}"/>')
            out.append(f'<path d="M{f(x0)} {f(y0)}L{f(x1)} {f(y1)}" stroke="{col}" stroke-width="{f(6 + d * 4)}"/>')
            if d > 0:
                br(x1, y1, a - rnd.uniform(0.3, 0.6), L * 0.72, d - 1)
                br(x1, y1, a + rnd.uniform(0.3, 0.6), L * 0.72, d - 1)
            else:
                out.append(C(x1 - 2, y1 - 2, 3, light(col, 0.5)))
        br(x, y, rnd.uniform(-0.15, 0.15), h * 0.35, 3)
        return "".join(out)

    def brain(x, y, r, col):
        out = [P(f"M{x - r} {y}A{r} {r * 0.8} 0 0 1 {x + r} {y}Z", col, dark(col, 0.35), 3)]
        for k in range(4):
            rr = r * (0.85 - k * 0.2)
            out.append(f'<path d="M{f(x - rr)} {f(y - 2)}q{f(rr * 0.25)} {f(-rr * 0.5)} {f(rr * 0.5)} {f(-rr * 0.3)}t{f(rr * 0.5)} {f(-rr * 0.2)}t{f(rr * 0.5)} {f(rr * 0.2)}t{f(rr * 0.5)} {f(rr * 0.3)}" fill="none" stroke="{dark(col, 0.18)}" stroke-width="3"/>')
        out.append(f'<path d="M{f(x - r * 0.7)} {f(y - r * 0.4)}Q{f(x - r * 0.4)} {f(y - r * 0.75)} {f(x)} {f(y - r * 0.78)}" fill="none" stroke="{light(col, 0.4)}" stroke-width="4"/>')
        return "".join(out)

    def fan(x, y, h, col):
        d = f"M{x} {y}C{x - h * 0.6} {y - h * 0.4} {x - h * 0.55} {y - h} {x} {y - h}C{x + h * 0.55} {y - h} {x + h * 0.6} {y - h * 0.4} {x} {y}Z"
        out = [P(d, col, dark(col, 0.35), 3, op=0.95)]
        net = ""
        for k in range(7):
            a = -1.1 + k * 2.2 / 6
            net += f"M{x} {y}L{f(x + math.sin(a) * h * 0.5)} {f(y - math.cos(a) * h * 0.9)}"
        for k in range(1, 4):
            net += f"M{f(x - h * 0.15 * k)} {f(y - h * 0.25 * k)}Q{x} {f(y - h * 0.3 * k - 20)} {f(x + h * 0.15 * k)} {f(y - h * 0.25 * k)}"
        out.append(f'<path d="{net}" fill="none" stroke="{dark(col, 0.2)}" stroke-width="2.5"/>')
        return "".join(out)

    def weed(x, y, h, col):
        d = f"M{x} {y}"
        pts_ = []
        for k in range(1, 7):
            pts_.append((x + (12 if k % 2 else -12), y - h * k / 6))
        dd = smooth([(x, y)] + pts_)
        return f'<path d="{dd}" fill="none" stroke="{dark(col, 0.35)}" stroke-width="16"/><path d="{dd}" fill="none" stroke="{col}" stroke-width="10"/>'

    # esquerda
    cor.append(weed(30, 1000, 520, "#5fbf8a"))
    cor.append(weed(70, 1000, 380, "#7ccf9a"))
    cor.append(fan(170, 975, 250, "#c58ae0"))
    cor.append(branchy(300, 990, 380, "#f6907a"))
    cor.append(brain(110, 1000, 110, "#f2c14e"))
    cor.append(branchy(440, 1000, 220, "#ff9fb8"))
    cor.append(brain(560, 1005, 60, "#9ad07a"))
    # direita
    cor.append(weed(1580, 1000, 540, "#5fbf8a"))
    cor.append(weed(1530, 1000, 400, "#7ccf9a"))
    cor.append(fan(1430, 980, 260, "#f6907a"))
    cor.append(branchy(1300, 990, 360, "#c58ae0"))
    cor.append(brain(1500, 1005, 120, "#ff9fb8"))
    cor.append(branchy(1170, 1000, 220, "#f2c14e"))
    cor.append(brain(1060, 1005, 56, "#7cc8e8"))
    # anêmonas
    for ax, col in [(230, "#ff9f6a"), (1370, "#ffb3c7")]:
        tent = ""
        for k in range(11):
            a = -1.2 + k * 2.4 / 10
            tent += f"M{ax} 990Q{f(ax + math.sin(a) * 30)} {f(990 - 40)} {f(ax + math.sin(a) * 46)} {f(990 - math.cos(a) * 70)}"
        cor.append(f'<path d="{tent}" fill="none" stroke="{dark(col, 0.25)}" stroke-width="11"/><path d="{tent}" fill="none" stroke="{col}" stroke-width="7"/>')
    # conchas e estrela-do-mar
    cor.append(P("M700 985l8 -18l8 18l-16 -11h16Z", "#ff9f6a", "#b85a3a", 3))
    cor.append(P("M930 990q14 -26 28 0Z", "#ffd8c2", "#c98a6a", 2.5))
    cor.append(f'<path d="M936 988l8 -18M944 988v-20M952 988l-6 -18" stroke="#c98a6a" stroke-width="2"/>')
    s.g("corais", cor)
    return s.save(nome)


ALL = {"fazenda": fazenda, "floresta-tropical": floresta_tropical, "floresta-temperada": floresta_temperada, "pradaria": pradaria,
       "taiga": taiga, "tundra": tundra, "bambuzal": bambuzal, "deserto": deserto, "outback": outback, "eucaliptos": eucaliptos,
       "savana": savana, "rios": rios, "cerrado": cerrado, "recife": recife}

if __name__ == "__main__":
    which = sys.argv[2:] or list(ALL)
    for n in which:
        print(n, ALL[n]())
