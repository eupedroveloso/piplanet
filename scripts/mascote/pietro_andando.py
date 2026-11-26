# Gera o ciclo de caminhada de perfil (4 quadros) e o pietro-feliz.
# Uso: python3 pietro_andando.py <pasta de saída>
import sys, os, math
AQUI = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(AQUI, 'pietro.py')).read()
_src = _src[:_src.index("sombra='<ellipse")].replace("OUT=sys.argv[1] if len(sys.argv)>1 else '.'", "").replace("OUT=sys.argv[1]", "")
exec(_src)
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'

def f(v): return f'{v:.1f}'.rstrip('0').rstrip('.')
def d(a): r = math.radians(a); return math.sin(r), math.cos(r)

CHAO = 236   # y do tornozelo apoiado
HX = 130     # x do quadril (fixo em todos os quadros)
COXA, CANELA = 20, 20
BRACO, ANTEBRACO = 19, 17

def perna(a1, a2, hy):
    s1, c1 = d(a1); s2, c2 = d(a2)
    k = (HX + COXA*s1, hy + COXA*c1)
    t = (k[0] + CANELA*s2, k[1] + CANELA*c2)
    return k, t

def bota(x, y, ang, cor, sola, cano):
    return f'''<g transform="translate({f(x)} {f(y)}) rotate({ang})">
<rect x="-7" y="-11" width="13" height="5" rx="1.5" fill="#f3efe6"/>
<path d="M-7 -7 H6 V-1 Q14 -1 16 4 Q17 8 13 8 H-5 Q-8 8 -8 4 Z" fill="{cor}"/>
<path d="M-8 5 H16.6 Q17 9 13 9 H-5 Q-8 9 -8 5 Z" fill="{sola}"/>
<path d="M-7 -7 H-2 V5 H-8 Z" fill="{cano}" opacity="0.5"/>
<path d="M0 -5 l4 2 M0 -2 l4 -2" stroke="#f0e2c4" stroke-width="1.2" stroke-linecap="round"/>
</g>'''

def desenha_perna(a1, a2, hy, pe, longe):
    k, t = perna(a1, a2, hy)
    pele = SKS if longe else SK
    bc = BOOTS if longe else BOOT
    shc = SHORTS if longe else SHORT
    s1, c1 = d(a1)
    sx, sy = HX + 13*s1, hy + 13*c1
    return '\n'.join([
        f'<path d="M{HX} {f(hy)} L{f(k[0])} {f(k[1])} L{f(t[0])} {f(t[1])}" fill="none" stroke="{pele}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>',
        bota(t[0], t[1], pe, bc, SOLE, BOOTS if not longe else SOLE),
        f'<path d="M{HX} {f(hy-8)} L{f(sx)} {f(sy)}" fill="none" stroke="{shc}" stroke-width="18" stroke-linecap="butt"/>',
        f'<path d="M{f(sx-8*c1)} {f(sy+8*s1)} L{f(sx+8*c1)} {f(sy-8*s1)}" stroke="{SHORTS}" stroke-width="2" opacity="0.6"/>',
    ])

def desenha_braco(a1, a2, dy, longe):
    sx, sy = 133, 149 + dy
    s1, c1 = d(a1); s2, c2 = d(a2)
    e = (sx + BRACO*s1, sy + BRACO*c1)
    w = (e[0] + ANTEBRACO*s2, e[1] + ANTEBRACO*c2)
    pele = SKS if longe else SK
    manga = SHS if longe else SH
    mx, my = sx + 9*s1, sy + 9*c1
    return '\n'.join([
        f'<path d="M{f(e[0]-3*s1)} {f(e[1]-3*c1)} L{f(e[0])} {f(e[1])} L{f(w[0])} {f(w[1])}" fill="none" stroke="{pele}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>',
        f'<circle cx="{f(w[0]+1.5*s2)}" cy="{f(w[1]+1.5*c2)}" r="6.8" fill="{pele}"/>',
        f'<circle cx="{f(w[0]+1.5*s2+4)}" cy="{f(w[1]+1.5*c2-2)}" r="2.8" fill="{pele}"/>',
        f'<path d="M{sx} {f(sy-2)} L{f(mx)} {f(my)}" fill="none" stroke="{manga}" stroke-width="16" stroke-linecap="round"/>',
    ])

def mochila(dy, bal):
    g = f'translate(0 {f(dy + bal)})'
    return f'''<g id="mochila" transform="{g}">
<path d="M104 140 Q104 130 112 132" fill="none" stroke="{PACKS}" stroke-width="4" stroke-linecap="round"/>
<rect x="88" y="138" width="34" height="56" rx="11" fill="{PACKS}"/>
<rect x="90" y="142" width="24" height="48" rx="9" fill="{PACK}"/>
<path d="M90 156 Q102 162 114 156 V150 Q102 146 90 150 Z" fill="{PACKS}"/>
<rect x="99" y="155" width="6" height="5" rx="1.5" fill="#f2c84b"/>
<rect x="92" y="168" width="20" height="17" rx="5" fill="{PACKS}"/>
<path d="M94 172 H110" stroke="{PACKL}" stroke-width="1.8" stroke-linecap="round"/>
<path d="M93 146 Q94 142 99 142" fill="none" stroke="{PACKL}" stroke-width="2.5" stroke-linecap="round"/>
<rect x="84" y="180" width="38" height="9" rx="4.5" fill="#6aa34a"/>
<path d="M90 180 V189 M114 180 V189" stroke="#4f7d36" stroke-width="2"/>
</g>'''

def tronco(dy):
    return f'''<g id="tronco" transform="translate(0 {f(dy)})">
<rect x="126" y="126" width="15" height="14" rx="4" fill="{SKS}"/>
<path d="M114 196 H150 L151 206 H113 Z" fill="{SHORT}"/>
<path d="M115 146 C115 138 123 134 134 134 C146 134 152 140 152 148 L154 194 H113 Z" fill="{SH}"/>
<path d="M115 146 C115 138 120 135 126 134 C122 150 122 176 124 194 H113 Z" fill="{SHS}" opacity="0.6"/>
<rect x="138" y="152" width="14" height="15" rx="3" fill="{SHS}" opacity="0.55"/>
<path d="M137 151 H153 V156 Q145 159 137 156 Z" fill="{SHS}"/>
<circle cx="145" cy="155.5" r="1.3" fill="#7a6a40"/>
<path d="M150 146 Q152 160 152 176" fill="none" stroke="{SHL}" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
<rect x="113" y="189" width="41" height="7" rx="2" fill="{BAND}"/>
<rect x="145" y="188" width="9" height="9" rx="2" fill="#e0b54a"/>
<path d="M120 137 Q132 138 136 156 L137 190" fill="none" stroke="{PACK}" stroke-width="7" stroke-linecap="round"/>
<rect x="132" y="164" width="9" height="5" rx="1.5" fill="#f2c84b"/>
<path d="M134 134 L146 138 L140 146 Z" fill="{SHL}"/>
<path d="M136 133 L142 136 L139 140 Z" fill="{SKS}"/>
</g>'''

def binoculo(dy, bal):
    x0, y0 = 151 + bal, 160 + dy
    return f'''<g id="binoculo">
<path d="M140 {f(134+dy)} Q{f(150+bal*0.5)} {f(146+dy)} {f(x0+4)} {f(y0)}" fill="none" stroke="#5a3a26" stroke-width="2.2" stroke-linecap="round"/>
<g transform="rotate({f(-bal*3)} {f(x0+4)} {f(y0)})">
<rect x="{f(x0-2)}" y="{f(y0)}" width="13" height="20" rx="5" fill="{BIN}"/>
<rect x="{f(x0)}" y="{f(y0+1.5)}" width="4" height="15" rx="2" fill="{BINL}"/>
<rect x="{f(x0+9)}" y="{f(y0+16)}" width="4" height="5" rx="1.5" fill="{LENS}"/>
<rect x="{f(x0+1)}" y="{f(y0-3)}" width="7" height="4" rx="1.5" fill="{BINL}"/>
</g>
</g>'''

def cabeca(dy):
    cx, cy = 138, 98
    o = [f'<g id="cabeca" transform="translate(0 {f(dy)})">']
    # cabelo de trás e nuca
    o.append(f'<circle cx="128" cy="92" r="37" fill="{HAIR}"/>')
    o.append(f'<path d="M98 100 Q98 118 112 124 L124 120 L118 98 Z" fill="{HAIR}"/>')
    # rosto
    o.append(f'<circle cx="{cx}" cy="{cy}" r="37" fill="{SK}"/>')
    o.append(f'<path d="M168 108 Q176 102 177 108 Q178 114 170 114 Z" fill="{SK}"/>')
    o.append(f'<circle cx="172.5" cy="108.5" r="4.6" fill="{SK}"/>')
    o.append(f'<path d="M104 104 C108 126 126 136 146 134 C160 132 168 124 170 118 C160 128 140 132 124 124 C114 118 108 110 104 104 Z" fill="{SKS}" opacity="0.55"/>')
    o.append(f'<path d="M170 106 Q174 104 176 107" fill="none" stroke="{SKS}" stroke-width="1.6" stroke-linecap="round"/>')
    # orelha
    o.append(f'<ellipse cx="125" cy="105" rx="6.5" ry="8" fill="{SK}"/>')
    o.append(f'<path d="M123 101 Q128 104 125 110" fill="none" stroke="{SKS}" stroke-width="2.4" stroke-linecap="round"/>')
    # franja e costeleta
    o.append(f'<path d="M104 86 C106 70 130 62 152 66 C166 68 174 76 175 86 Q168 82 164 88 Q158 80 152 88 Q146 80 138 88 Q134 84 132 92 L133 98 Q128 94 121 95 Q110 92 104 96 Z" fill="{HAIR}"/>')
    o.append(f'<path d="M140 74 Q152 70 162 74" fill="none" stroke="{HAIRL}" stroke-width="2.5" stroke-linecap="round"/>')
    # olho (receita do acervo)
    ex, ey = 157, 102
    o.append(f'<path d="M150 89 Q157 86 163 89" fill="none" stroke="{HAIRD}" stroke-width="2.6" stroke-linecap="round"/>')
    o.append(f'<ellipse cx="{ex}" cy="{ey}" rx="5.4" ry="7" fill="#2b1d16"/>')
    o.append(f'<ellipse cx="{ex+0.6}" cy="{ey+2.4}" rx="3.3" ry="3.5" fill="#5a3a26"/>')
    o.append(f'<circle cx="{ex-1.8}" cy="{ey-2.8}" r="2.4" fill="#fff"/>')
    o.append(f'<circle cx="{ex+2.2}" cy="{ey+2.8}" r="1.1" fill="#fff"/>')
    # bochecha, sardas, sorriso
    o.append(f'<ellipse cx="152" cy="116" rx="6.5" ry="4" fill="#f4908a" opacity="0.5"/>')
    for x, y in ((147, 112), (150, 114.5), (154, 112)):
        o.append(f'<circle cx="{x}" cy="{y}" r="0.9" fill="{SKD}" opacity="0.55"/>')
    o.append(f'<path d="M159 120 Q165 125 170 119 Q165 122 159 120 Z" fill="#9c4a3a"/>')
    o.append(f'<path d="M159 120 Q165 125 170 119" fill="none" stroke="#9c4a3a" stroke-width="2.4" stroke-linecap="round"/>')
    # chapéu de perfil
    o.append(f'<ellipse cx="136" cy="74" rx="64" ry="10" fill="{HATS}"/>')
    o.append(f'<ellipse cx="134" cy="71.5" rx="61" ry="7.5" fill="{HAT}"/>')
    o.append(f'<path d="M80 72 Q100 66 124 66" fill="none" stroke="{HATL}" stroke-width="3" stroke-linecap="round"/>')
    o.append(f'<path d="M102 70 C100 34 120 28 136 28 C154 28 172 34 170 70 Z" fill="{HAT}"/>')
    o.append(f'<path d="M144 29 C160 31 172 38 170 70 L154 70 C158 52 154 38 144 29 Z" fill="{HATS}" opacity="0.55"/>')
    o.append(f'<path d="M110 58 Q110 40 124 34" fill="none" stroke="{HATL}" stroke-width="3.5" stroke-linecap="round"/>')
    o.append(f'<path d="M101.5 59 Q136 64 170.5 59 L170.5 68 Q136 73 101.5 68 Z" fill="{BAND}"/>')
    bx, by = 118, 64
    o.append(f'<circle cx="{bx}" cy="{by}" r="5.5" fill="#f2c84b"/>')
    o.append(f'<ellipse cx="{bx}" cy="{by+1.3}" rx="2.1" ry="1.8" fill="#a86a1e"/>')
    for dx, dyy in ((-2.4, -1.8), (0, -3), (2.4, -1.8)):
        o.append(f'<circle cx="{bx+dx}" cy="{by+dyy}" r="0.95" fill="#a86a1e"/>')
    o.append('</g>')
    return '\n'.join(o)

# quadros: (perna perto, perna longe, pé perto, pé longe, braço perto, braço longe, balanço)
QUADROS = [
    # 1 contato: perna da frente (perto) adiante
    dict(pp=(28, 18), pl=(-22, -40), ap=-12, al=25, bp=(-30, -18), bl=(30, 55), bal=0),
    # 2 passagem: perto apoiada, longe passando
    dict(pp=(0, 0), pl=(30, -35), ap=0, al=22, bp=(-4, 8), bl=(4, 20), bal=-2),
    # 3 contato: perna de trás (longe) adiante
    dict(pp=(-22, -40), pl=(28, 18), ap=25, al=-12, bp=(30, 55), bl=(-30, -18), bal=0),
    # 4 passagem: longe apoiada, perto passando
    dict(pp=(30, -35), pl=(0, 0), ap=22, al=0, bp=(4, 20), bl=(-4, 8), bal=-2),
]

def quadro(q):
    alturas = []
    for a1, a2 in (q['pp'], q['pl']):
        s1, c1 = d(a1); s2, c2 = d(a2)
        alturas.append(COXA*c1 + CANELA*c2)
    hy = CHAO - max(alturas)
    dy = hy - 200
    bal = q['bal']
    partes = [
        '<ellipse cx="132" cy="245" rx="44" ry="6.5" fill="#3b2a1a" opacity="0.18"/>',
        desenha_braco(*q['bl'], dy, True),
        desenha_perna(*q['pl'], hy, q['al'], True),
        mochila(dy, -bal * 0.5),
        desenha_perna(*q['pp'], hy, q['ap'], False),
        tronco(dy),
        binoculo(dy, bal),
        cabeca(dy),
        desenha_braco(*q['bp'], dy, False),
    ]
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">\n' + '\n'.join(partes) + '\n</svg>\n'

for i, q in enumerate(QUADROS, 1):
    open(os.path.join(OUT, f'pietro-andando-{i}.svg'), 'w').write(quadro(q))

# ---- feliz: de frente, pulando, braços para cima
def braco_cima(lado):
    sx = 94 if lado < 0 else 162
    ex, ey = sx + lado*16, 128
    hx, hy = sx + lado*26, 104
    pele = SK if lado < 0 else SKS
    manga = SH if lado < 0 else SHS
    return f'''<path d="M{ex} {ey} L{hx} {hy}" fill="none" stroke="{SK}" stroke-width="11" stroke-linecap="round"/>
<path d="M{ex+lado*1} {ey+2} L{hx} {hy+4}" fill="none" stroke="{SKS}" stroke-width="3.5" stroke-linecap="round" opacity="0.5"/>
<path d="M{sx} 146 L{ex} {ey+4}" fill="none" stroke="{manga}" stroke-width="16" stroke-linecap="round"/>
<g transform="translate({hx+lado*1} {hy-8}) rotate({lado*18})">
<ellipse cx="0" cy="0" rx="9.5" ry="10.5" fill="{SK}"/>
<rect x="-8.5" y="-17" width="5" height="12" rx="2.5" fill="{SK}"/>
<rect x="-3" y="-19" width="5" height="13" rx="2.5" fill="{SK}"/>
<rect x="2.5" y="-17.5" width="5" height="12" rx="2.5" fill="{SK}"/>
<rect x="{-lado*12 - (0 if lado>0 else 0) - 3}" y="-2" width="9" height="5.5" rx="2.75" transform="rotate({-lado*30} {-lado*8} 0)" fill="{SK}"/>
<path d="M-5 5 Q0 8 5 5" fill="none" stroke="{SKS}" stroke-width="1.6" stroke-linecap="round"/>
</g>'''

def rosto_feliz():
    o = [face(128, 98, 40)]
    return '\n'.join(o)

def feliz():
    up = -16
    rosto = face(128, 98, 40)
    # troca olhos por arcos felizes e boca por sorriso aberto
    import re
    rosto = re.sub(r'<ellipse cx="[\d.]+" cy="[\d.]+" rx="6.0" ry="7.0" fill="#2b1d16"/>\s*<ellipse[^>]*fill="#5a3a26"/>\s*<circle[^>]*fill="#fff"/>\s*<circle[^>]*fill="#fff"/>', '', rosto)
    rosto = re.sub(r'<path d="M120.0 117.0[^>]*/>\s*<path d="M120.0 117.0[^>]*/>', '', rosto)
    olhos = '\n'.join(
        f'<path d="M{x-7} 104 Q{x} 95 {x+7} 104" fill="none" stroke="#2b1d16" stroke-width="3.6" stroke-linecap="round"/>'
        for x in (113, 143))
    boca = '''<path d="M117 116 Q128 116 139 116 Q138 129 128 129 Q118 129 117 116 Z" fill="#9c4a3a"/>
<path d="M121.5 124.5 Q128 121 134.5 124.5 Q132 128.5 128 128.5 Q124 128.5 121.5 124.5 Z" fill="#e87a6e"/>
<path d="M119 116.5 H137 V118.5 Q128 119.5 119 118.5 Z" fill="#fff"/>'''
    brilhos = '''<g fill="#f2c84b">
<path d="M48 70 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z"/>
<path d="M210 62 l2.4 6 l6 2.4 l-6 2.4 l-2.4 6 l-2.4 -6 l-6 -2.4 l6 -2.4 Z"/>
<path d="M218 140 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" opacity="0.8"/>
<path d="M38 150 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" opacity="0.8"/>
</g>'''
    partes = [
        '<ellipse cx="128" cy="245" rx="40" ry="5.5" fill="#3b2a1a" opacity="0.13"/>',
        brilhos,
        f'<g transform="translate(0 {up})">',
        legs(), body(), neck(),
        braco_cima(-1), braco_cima(1),
        '<g id="cabeca">', rosto, olhos, boca, hat(128, 26, 70, 64), '</g>',
        '</g>',
    ]
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">\n' + '\n'.join(partes) + '\n</svg>\n'

open(os.path.join(OUT, 'pietro-feliz.svg'), 'w').write(feliz())
