# Gera a Pérola (garota exploradora) reaproveitando os geradores do Pietro.
# Uso: python3 perola.py <pasta de saída>
import sys, os
AQUI = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'

# Diferenças da Pérola (paleta e cabelo); o resto vem do Pietro
EXTRA = r'''
SK="#ebb98f"; SKS="#d49b6f"; SKD="#b97d55"
HAIR="#3e2516"; HAIRL="#64402a"; HAIRD="#2a170d"
SH="#bfc48a"; SHS="#9da266"; SHL="#d8dcae"
PACK="#3fa7a0"; PACKS="#2e8580"; PACKL="#7fd0c8"
LACO="#e9844a"

_face_orig = face
def face(cx, cy, r, s=1.0, look='frente', simples=False):
    k = s
    o = []
    # volume do cabelo atrás do rosto (desce até a altura do queixo)
    o.append(f'<path d="M{cx-r-5*k} {cy+22*k} C{cx-r-8*k} {cy-30*k} {cx+r+8*k} {cy-30*k} {cx+r+5*k} {cy+22*k} Q{cx+r} {cy+30*k} {cx+r-8*k} {cy+24*k} L{cx-r+8*k} {cy+24*k} Q{cx-r} {cy+30*k} {cx-r-5*k} {cy+22*k} Z" fill="{HAIR}"/>')
    # trança sobre o ombro esquerdo (do observador)
    bx = cx - r + 2*k
    gomos = 3 if (simples or look == 'baixo') else 5
    for i in range(gomos):
        y = cy + (26 + i*9)*k
        o.append(f'<ellipse cx="{bx + (i%2)*1.5*k}" cy="{y}" rx="{7.5*k - i*0.4*k}" ry="{6*k}" fill="{HAIR}"/>')
        if not simples:
            o.append(f'<path d="M{bx-5*k} {y-2*k} Q{bx} {y+3*k} {bx+5*k} {y-2*k}" fill="none" stroke="{HAIRD}" stroke-width="{1.4*k}" stroke-linecap="round" opacity="0.7"/>')
    yt = cy + (26 + gomos*9 - 4)*k
    o.append(f'<rect x="{bx-5*k}" y="{yt}" width="{10*k}" height="{4.5*k}" rx="{2*k}" fill="{LACO}"/>')
    o.append(f'<path d="M{bx-4*k} {yt+4*k} Q{bx-6*k} {yt+12*k} {bx} {yt+13*k} Q{bx+6*k} {yt+12*k} {bx+4*k} {yt+4*k} Z" fill="{HAIR}"/>')
    o.append(_face_orig(cx, cy, r, s, look, simples))
    # cílios discretos no canto de fora dos olhos
    ex = 15*k; ey = cy + 4*k
    oy = 2*k if look == 'baixo' else 0
    for sx in (-1, 1):
        x0 = cx + sx*(ex + 5*k); y0 = ey - 4.5*k + oy
        o.append(f'<path d="M{x0} {y0} l{sx*3.2*k} {-2.4*k}" stroke="#2b1d16" stroke-width="{1.8*k}" stroke-linecap="round"/>')
    return '\n'.join(o)
'''

EXTRA_PERFIL = r'''
_cabeca_orig = cabeca
def cabeca(dy):
    sw = -dy * 1.2   # o rabo de cavalo balança um pouco com o passo
    rabo = f"""<g transform="translate(0 {f(dy)})">
<path d="M104 80 C88 84 84 100 86 116 C87 128 {f(90+sw)} 138 {f(96+sw)} 142 C{f(94+sw)} 130 96 118 100 108 C104 98 108 92 112 88 Z" fill="{HAIR}"/>
<path d="M92 104 Q{f(92+sw*0.5)} 120 {f(95+sw)} 134" fill="none" stroke="{HAIRL}" stroke-width="2.4" stroke-linecap="round"/>
<rect x="100" y="80" width="9" height="12" rx="3" transform="rotate(-30 104 86)" fill="{LACO}"/>
</g>"""
    cab = _cabeca_orig(dy)
    cilios = f'<path d="M161.5 97 l3 -2.6 M162.5 100 l3.2 -1.2" stroke="#2b1d16" stroke-width="1.7" stroke-linecap="round" transform="translate(0 {f(dy)})"/>'
    return rabo + '\n' + cab + '\n' + cilios
'''

# ---- frente, rosto e lendo
src = open(os.path.join(AQUI, 'pietro.py')).read()
src = src.replace("OUT=sys.argv[1] if len(sys.argv)>1 else '.'", "").replace("OUT=sys.argv[1]", "")
corte = src.index("sombra='<ellipse")
cab, cauda = src[:corte], src[corte:]
cauda = (cauda.replace("'pietro.svg'", "'perola.svg'")
              .replace("'pietro-lendo.svg'", "'perola-lendo.svg'")
              .replace("'pietro-rosto.svg'", "'perola-rosto.svg'")
              .replace("pietro-rosto-c", "perola-rosto-c")
              .replace('fill="#8fbf6a"', 'fill="#4fb3a9"')
              .replace('fill="#d6edbd"', 'fill="#cdeee9"'))
g = {'__name__': 'perola', 'OUT': OUT}
exec(cab + EXTRA + cauda, g)

# ---- andando e feliz
src2 = open(os.path.join(AQUI, 'pietro_andando.py')).read()
src2 = src2.replace("AQUI = os.path.dirname(os.path.abspath(__file__))", f"AQUI = {AQUI!r}")
marca = "# quadros:"
src2 = src2.replace(marca, EXTRA + EXTRA_PERFIL + "\n" + marca, 1)
src2 = src2.replace("f'pietro-andando-{i}.svg'", "f'perola-andando-{i}.svg'").replace("'pietro-feliz.svg'", "'perola-feliz.svg'")
sys.argv = [sys.argv[0], OUT]
exec(src2, {'__name__': 'perola_andando'})
