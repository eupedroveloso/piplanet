import sys,os
OUT=sys.argv[1]
SK="#f6c9a0"; SKS="#e3a77c"; SKD="#c98a62"
HAIR="#6b3f22"; HAIRL="#8f5a33"; HAIRD="#4e2c17"
HAT="#e2c487"; HATS="#c9a462"; HATL="#f1dcaa"; BAND="#7a4a26"
SH="#c8b27a"; SHS="#a8935c"; SHL="#ddc995"
SHORT="#8a6d45"; SHORTS="#6e5534"
BOOT="#8a5530"; BOOTS="#5e3519"; SOLE="#3f2412"
PACK="#e9844a"; PACKS="#c4632f"; PACKL="#f4a874"
BIN="#3d4250"; BINL="#5b6274"; LENS="#8fc3e6"

def hat(cx, top, brim_y, rx, s=1.0):
    k=s
    o=[]
    # aba (parte de baixo e de cima)
    o.append(f'<ellipse cx="{cx}" cy="{brim_y+2*k}" rx="{rx}" ry="{13*k}" fill="{HATS}"/>')
    o.append(f'<ellipse cx="{cx-2*k}" cy="{brim_y-1*k}" rx="{rx-3*k}" ry="{10*k}" fill="{HAT}"/>')
    o.append(f'<path d="M{cx-rx+8*k} {brim_y-4*k} Q{cx-rx*0.4} {brim_y-11*k} {cx} {brim_y-11*k}" fill="none" stroke="{HATL}" stroke-width="{3*k}" stroke-linecap="round"/>')
    # copa
    w=38*k
    o.append(f'<path d="M{cx-w} {brim_y} C{cx-w-2*k} {top+6*k} {cx-18*k} {top} {cx} {top} C{cx+18*k} {top} {cx+w+2*k} {top+6*k} {cx+w} {brim_y} Z" fill="{HAT}"/>')
    o.append(f'<path d="M{cx+8*k} {top+1*k} C{cx+24*k} {top+3*k} {cx+w+2*k} {top+10*k} {cx+w} {brim_y} L{cx+16*k} {brim_y} C{cx+20*k} {top+20*k} {cx+16*k} {top+8*k} {cx+8*k} {top+1*k} Z" fill="{HATS}" opacity="0.55"/>')
    o.append(f'<path d="M{cx} {top+2*k} Q{cx+2*k} {top+12*k} {cx} {top+20*k}" fill="none" stroke="{HATS}" stroke-width="{2.2*k}" stroke-linecap="round"/>')
    o.append(f'<path d="M{cx-28*k} {brim_y-14*k} Q{cx-26*k} {top+10*k} {cx-12*k} {top+5*k}" fill="none" stroke="{HATL}" stroke-width="{3.5*k}" stroke-linecap="round"/>')
    # faixa
    o.append(f'<path d="M{cx-w-0.5*k} {brim_y-10*k} Q{cx} {brim_y-5*k} {cx+w+0.5*k} {brim_y-10*k} L{cx+w+0.5*k} {brim_y-1*k} Q{cx} {brim_y+4*k} {cx-w-0.5*k} {brim_y-1*k} Z" fill="{BAND}"/>')
    # broche de patinha
    bx,by=cx-22*k,brim_y-5*k
    o.append(f'<circle cx="{bx}" cy="{by}" r="{6*k}" fill="#f2c84b"/>')
    o.append(f'<ellipse cx="{bx}" cy="{by+1.4*k}" rx="{2.3*k}" ry="{1.9*k}" fill="#a86a1e"/>')
    for dx,dy in((-2.6,-2),(0,-3.2),(2.6,-2)):
        o.append(f'<circle cx="{bx+dx*k}" cy="{by+dy*k}" r="{1*k}" fill="#a86a1e"/>')
    return '\n'.join(o)

def face(cx, cy, r, s=1.0, look='frente', simples=False):
    k=s; o=[]
    # orelhas
    for sx in(-1,1):
        o.append(f'<ellipse cx="{cx+sx*(r-1*k)}" cy="{cy+6*k}" rx="{8*k}" ry="{9*k}" fill="{SK}"/>')
        o.append(f'<ellipse cx="{cx+sx*(r+0.5*k)}" cy="{cy+6*k}" rx="{3.5*k}" ry="{5*k}" fill="{SKS}"/>')
    # rosto (levemente mais largo embaixo)
    o.append(f'<path d="M{cx-r} {cy-4*k} C{cx-r} {cy-r-4*k} {cx+r} {cy-r-4*k} {cx+r} {cy-4*k} C{cx+r} {cy+r*0.75} {cx+r*0.45} {cy+r} {cx} {cy+r} C{cx-r*0.45} {cy+r} {cx-r} {cy+r*0.75} {cx-r} {cy-4*k} Z" fill="{SK}"/>')
    # sombra lateral direita/queixo
    o.append(f'<path d="M{cx+r} {cy-4*k} C{cx+r} {cy+r*0.75} {cx+r*0.45} {cy+r} {cx} {cy+r} C{cx+r*0.5} {cy+r*0.8} {cx+r*0.82} {cy+r*0.4} {cx+r*0.8} {cy-6*k} Z" fill="{SKS}" opacity="0.6"/>')
    # cabelo: franja e costeletas
    o.append(f'<path d="M{cx-r-1*k} {cy+6*k} C{cx-r-3*k} {cy-22*k} {cx-20*k} {cy-30*k} {cx} {cy-29*k} C{cx+20*k} {cy-30*k} {cx+r+3*k} {cy-22*k} {cx+r+1*k} {cy+6*k} Q{cx+r-4*k} {cy-6*k} {cx+r-9*k} {cy-8*k} Q{cx+24*k} {cy-18*k} {cx+14*k} {cy-12*k} Q{cx+6*k} {cy-22*k} {cx-4*k} {cy-14*k} Q{cx-12*k} {cy-22*k} {cx-20*k} {cy-11*k} Q{cx-28*k} {cy-16*k} {cx-r+8*k} {cy-6*k} Q{cx-r+3*k} {cy-4*k} {cx-r-1*k} {cy+6*k} Z" fill="{HAIR}"/>')
    if not simples:
        o.append(f'<path d="M{cx-24*k} {cy-20*k} Q{cx-14*k} {cy-26*k} {cx-2*k} {cy-24*k}" fill="none" stroke="{HAIRL}" stroke-width="{2.5*k}" stroke-linecap="round"/>')
        o.append(f'<path d="M{cx+8*k} {cy-22*k} Q{cx+12*k} {cy-18*k} {cx+14*k} {cy-14*k}" fill="none" stroke="{HAIRD}" stroke-width="{1.8*k}" stroke-linecap="round" opacity="0.7"/>')
    # sobrancelhas suaves
    ex=15*k; ey=cy+4*k
    bw = 2.6*k if not simples else 3.4*k
    up = 4*k if look=='baixo' else 0
    for sx in(-1,1):
        o.append(f'<path d="M{cx+sx*ex-6*k} {ey-10*k-up} Q{cx+sx*ex} {ey-13*k-up} {cx+sx*ex+6*k} {ey-10*k-up}" fill="none" stroke="{HAIRD}" stroke-width="{bw}" stroke-linecap="round"/>')
    # olhos
    erx,ery=(6*k,7*k) if not simples else (7*k,8*k)
    for sx in(-1,1):
        x=cx+sx*ex
        if look=='baixo':
            o.append(f'<ellipse cx="{x}" cy="{ey+2*k}" rx="{erx*0.95}" ry="{ery*0.9}" fill="#2b1d16"/>')
            o.append(f'<ellipse cx="{x+0.4*k}" cy="{ey+4.2*k}" rx="{erx*0.55}" ry="{ery*0.4}" fill="#5a3a26"/>')
            o.append(f'<circle cx="{x-2*k}" cy="{ey+0.2*k}" r="{erx*0.4}" fill="#fff"/>')
            o.append(f'<circle cx="{x+2.2*k}" cy="{ey+4.6*k}" r="{erx*0.18}" fill="#fff"/>')
        else:
            o.append(f'<ellipse cx="{x}" cy="{ey}" rx="{erx}" ry="{ery}" fill="#2b1d16"/>')
            o.append(f'<ellipse cx="{x+0.6*k}" cy="{ey+2.4*k}" rx="{erx*0.62}" ry="{ery*0.5}" fill="#5a3a26"/>')
            o.append(f'<circle cx="{x-2.2*k}" cy="{ey-2.8*k}" r="{erx*0.43}" fill="#fff"/>')
            o.append(f'<circle cx="{x+2.4*k}" cy="{ey+2.8*k}" r="{erx*0.2}" fill="#fff"/>')
    # bochechas
    for sx in(-1,1):
        o.append(f'<ellipse cx="{cx+sx*25*k}" cy="{ey+11*k}" rx="{6.5*k}" ry="{4*k}" fill="#f4908a" opacity="0.5"/>')
    # nariz
    o.append(f'<path d="M{cx-2.5*k} {ey+8*k} Q{cx} {ey+10.5*k} {cx+2.5*k} {ey+8*k}" fill="none" stroke="{SKD}" stroke-width="{2*k}" stroke-linecap="round"/>')
    # sorriso calmo
    mw=8*k
    o.append(f'<path d="M{cx-mw} {ey+15*k} Q{cx} {ey+21*k} {cx+mw} {ey+15*k} Q{cx} {ey+18*k} {cx-mw} {ey+15*k} Z" fill="#9c4a3a"/>')
    o.append(f'<path d="M{cx-mw} {ey+15*k} Q{cx} {ey+21*k} {cx+mw} {ey+15*k}" fill="none" stroke="#9c4a3a" stroke-width="{2.4*k}" stroke-linecap="round"/>')
    if not simples:
        # sardas leves
        for x,y in((-27,7),(-23,9),(-25,11.5),(23,9),(27,7),(25,11.5)):
            o.append(f'<circle cx="{cx+x*k}" cy="{ey+y*k}" r="{0.9*k}" fill="{SKD}" opacity="0.55"/>')
    return '\n'.join(o)

def legs():
    return f'''<g id="pernas">
<rect x="102" y="208" width="14" height="22" rx="4" fill="{SK}"/>
<rect x="140" y="208" width="14" height="22" rx="4" fill="{SK}"/>
<rect x="148" y="208" width="6" height="22" rx="3" fill="{SKS}" opacity="0.7"/>
<rect x="110" y="208" width="6" height="22" rx="3" fill="{SKS}" opacity="0.7"/>
<rect x="101" y="221" width="16" height="7" rx="2" fill="#f3efe6"/>
<rect x="139" y="221" width="16" height="7" rx="2" fill="#f3efe6"/>
<path d="M101 224 H117 M139 224 H155" stroke="#d9d3c4" stroke-width="1.4"/>
</g>
<g id="botas">
<path d="M100 226 H118 V238 Q118 242 114 242 H90 Q85 242 86 237 Q88 232 100 231 Z" fill="{BOOT}"/>
<path d="M138 226 H156 V231 Q168 232 170 237 Q171 242 166 242 H142 Q138 242 138 238 Z" fill="{BOOT}"/>
<path d="M86 239 H118 V242 Q118 245 114 245 H89 Q85 245 86 239 Z" fill="{SOLE}"/>
<path d="M138 239 H170 Q171 245 167 245 H142 Q138 245 138 242 Z" fill="{SOLE}"/>
<path d="M112 226 H118 V238 H112 Z M150 226 H156 V238 H150 Z" fill="{BOOTS}" opacity="0.6"/>
<path d="M90 236 Q94 233 100 233" fill="none" stroke="#b07448" stroke-width="2.2" stroke-linecap="round"/>
<path d="M146 233 Q160 233 166 236" fill="none" stroke="#b07448" stroke-width="2.2" stroke-linecap="round"/>
<path d="M103 229 l6 3 M103 233 l6 -3 M141 229 l6 3 M141 233 l6 -3" stroke="#f0e2c4" stroke-width="1.4" stroke-linecap="round"/>
</g>'''

def body(binoculo=True):
    b=f'''<g id="mochila">
<rect x="80" y="140" width="96" height="54" rx="14" fill="{PACKS}"/>
<rect x="74" y="160" width="14" height="26" rx="5" fill="{PACK}"/>
<rect x="168" y="160" width="14" height="26" rx="5" fill="{PACKS}"/>
<path d="M74 168 H88 M168 168 H182" stroke="{PACKL}" stroke-width="2"/>
</g>
<g id="bermuda">
<path d="M88 186 H168 L171 214 Q171 216 169 216 H134 Q131 216 130 213 L128 204 L126 213 Q125 216 122 216 H87 Q85 216 85 214 Z" fill="{SHORT}"/>
<path d="M150 190 H168 L171 214 Q171 216 169 216 H150 Z" fill="{SHORTS}" opacity="0.55"/>
<path d="M128 192 V204" stroke="{SHORTS}" stroke-width="1.8" stroke-linecap="round"/>
<path d="M92 196 Q100 200 108 196 M148 196 Q156 200 164 196" fill="none" stroke="{SHORTS}" stroke-width="1.8" stroke-linecap="round"/>
<path d="M87 211 H124 M132 211 H170" stroke="{SHORTS}" stroke-width="2" opacity="0.7"/>
</g>
<g id="camisa">
<path d="M92 148 C92 139 108 135 128 135 C148 135 164 139 164 148 L168 190 H88 Z" fill="{SH}"/>
<path d="M146 137 C156 139 164 142 164 148 L168 190 H150 C154 170 152 150 146 137 Z" fill="{SHS}" opacity="0.6"/>
<path d="M96 146 C98 141 106 139 112 138" fill="none" stroke="{SHL}" stroke-width="3" stroke-linecap="round"/>
<path d="M128 140 V188" stroke="{SHS}" stroke-width="1.6"/>
<circle cx="131" cy="160" r="1.5" fill="{SHS}"/><circle cx="131" cy="176" r="1.5" fill="{SHS}"/>
<!-- bolsos -->
<rect x="102" y="150" width="18" height="18" rx="3" fill="{SHS}" opacity="0.55"/>
<rect x="136" y="150" width="18" height="18" rx="3" fill="{SHS}" opacity="0.55"/>
<path d="M101 149 H121 V155 Q111 159 101 155 Z M135 149 H155 V155 Q145 159 135 155 Z" fill="{SHS}"/>
<circle cx="111" cy="155" r="1.4" fill="#7a6a40"/><circle cx="145" cy="155" r="1.4" fill="#7a6a40"/>
<!-- cinto -->
<rect x="88" y="184" width="80" height="7" rx="2" fill="{BAND}"/>
<rect x="122" y="183" width="12" height="9" rx="2" fill="#e0b54a"/>
<rect x="125" y="185.5" width="6" height="4" rx="1" fill="{BAND}"/>
<!-- alças da mochila -->
<path d="M100 139 Q96 160 98 186" fill="none" stroke="{PACK}" stroke-width="8" stroke-linecap="round"/>
<path d="M156 139 Q160 160 158 186" fill="none" stroke="{PACKS}" stroke-width="8" stroke-linecap="round"/>
<rect x="94" y="164" width="9" height="5" rx="1.5" fill="#f2c84b"/>
<rect x="154" y="164" width="9" height="5" rx="1.5" fill="#d9ad38"/>
<!-- gola -->
<path d="M114 136 L128 150 L120 154 L108 140 Z" fill="{SHL}"/>
<path d="M142 136 L128 150 L136 154 L148 140 Z" fill="{SH}"/>
<path d="M118 136 L128 148 L138 136 Z" fill="{SKS}"/>
</g>'''
    if binoculo:
        b+=f'''
<g id="binoculo">
<path d="M116 138 Q114 156 119 168 M140 138 Q142 156 137 168" fill="none" stroke="#5a3a26" stroke-width="2.2" stroke-linecap="round"/>
<rect x="113" y="166" width="13" height="20" rx="5" fill="{BIN}"/>
<rect x="130" y="166" width="13" height="20" rx="5" fill="{BIN}"/>
<rect x="124" y="170" width="8" height="8" rx="2" fill="{BINL}"/>
<rect x="115" y="167.5" width="4" height="15" rx="2" fill="{BINL}"/>
<rect x="132" y="167.5" width="4" height="15" rx="2" fill="{BINL}"/>
<ellipse cx="119.5" cy="185" rx="5" ry="2.6" fill="{LENS}"/>
<ellipse cx="136.5" cy="185" rx="5" ry="2.6" fill="{LENS}"/>
<circle cx="118" cy="184.4" r="1.2" fill="#fff"/><circle cx="135" cy="184.4" r="1.2" fill="#fff"/>
</g>'''
    return b

def neck():
    return f'<rect x="119" y="128" width="18" height="12" rx="4" fill="{SKS}"/>'

def svg(inner, vb="0 0 256 256"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">\n{inner}\n</svg>\n'

sombra='<ellipse cx="128" cy="244" rx="56" ry="7" fill="#3b2a1a" opacity="0.18"/>'

# ---- corpo inteiro acenando
braco_baixo=f'''<g id="braco-esquerdo">
<path d="M94 146 Q86 150 84 166" fill="none" stroke="{SH}" stroke-width="16" stroke-linecap="round"/>
<path d="M85 168 Q82 182 84 192" fill="none" stroke="{SK}" stroke-width="11" stroke-linecap="round"/>
<circle cx="85" cy="195" r="7.5" fill="{SK}"/>
<path d="M80 196 Q84 200 89 198" fill="none" stroke="{SKS}" stroke-width="1.8" stroke-linecap="round"/>
</g>'''
braco_aceno=f'''<g id="braco-acenando">
<path d="M160 146 Q170 148 174 158" fill="none" stroke="{SHS}" stroke-width="16" stroke-linecap="round"/>
<path d="M176 158 Q188 140 196 120" fill="none" stroke="{SK}" stroke-width="11" stroke-linecap="round"/>
<path d="M180 154 Q190 138 196 124" fill="none" stroke="{SKS}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
<g transform="rotate(14 200 108)">
<rect x="191" y="92" width="5.5" height="15" rx="2.75" fill="{SK}"/>
<rect x="197" y="89" width="5.5" height="17" rx="2.75" fill="{SK}"/>
<rect x="203" y="90" width="5.5" height="16" rx="2.75" fill="{SK}"/>
<rect x="209" y="94" width="5" height="13" rx="2.5" fill="{SK}"/>
<ellipse cx="200" cy="110" rx="11" ry="10" fill="{SK}"/>
<rect x="185" y="102" width="13" height="6.5" rx="3.25" transform="rotate(-50 192 108)" fill="{SK}"/>
<path d="M195 113 Q200 116 206 113" fill="none" stroke="{SKS}" stroke-width="1.8" stroke-linecap="round"/>
</g>
<path d="M216 86 Q222 92 222 100 M222 80 Q230 89 230 100" fill="none" stroke="#f2c84b" stroke-width="2.6" stroke-linecap="round" opacity="0.8"/>
</g>'''
cab = face(128,96,40) 
full = '\n'.join([sombra,body_parts:='',legs(),body(),neck(),braco_baixo,braco_aceno,
   '<g id="cabeca">',face(128,98,40),hat(128,26,70,64),'</g>'])
open(os.path.join(OUT,'pietro.svg'),'w').write(svg(full))

# ---- lendo mapa
mapa=f'''<g id="mapa">
<path d="M84 150 L106 144 L128 150 L150 144 L172 150 L172 190 L150 184 L128 190 L106 184 L84 190 Z" fill="#f7ecd0"/>
<path d="M106 144 L128 150 L128 190 L106 184 Z M150 144 L172 150 L172 190 L150 184 Z" fill="#e8d7ae"/>
<path d="M90 160 Q98 152 104 158 Q110 166 104 174 Q96 180 90 172 Z" fill="#9ccf6a"/>
<path d="M132 162 Q140 154 148 160 Q152 170 144 176 Q136 178 132 170 Z" fill="#9ccf6a"/>
<path d="M112 152 Q118 164 112 176 Q108 184 116 188" fill="none" stroke="#6fb3e0" stroke-width="3" stroke-linecap="round"/>
<path d="M96 182 Q112 170 128 176 Q146 182 160 166" fill="none" stroke="#e05a4a" stroke-width="2" stroke-dasharray="3 3" stroke-linecap="round"/>
<path d="M156 160 l6 6 M162 160 l-6 6" stroke="#c43c2e" stroke-width="2.4" stroke-linecap="round"/>
<path d="M160 176 l2 -6 l2 6 Z" fill="#7a6a40"/>
</g>'''
maos_mapa=f'''<g id="bracos-mapa">
<path d="M94 146 Q84 156 86 172" fill="none" stroke="{SH}" stroke-width="16" stroke-linecap="round"/>
<path d="M162 146 Q172 156 170 172" fill="none" stroke="{SHS}" stroke-width="16" stroke-linecap="round"/>
<path d="M86 174 Q86 178 88 180" fill="none" stroke="{SK}" stroke-width="11" stroke-linecap="round"/>
<path d="M170 174 Q170 178 168 180" fill="none" stroke="{SK}" stroke-width="11" stroke-linecap="round"/>
</g>'''
maos=f'''<ellipse cx="88" cy="172" rx="7" ry="9" fill="{SK}"/><ellipse cx="168" cy="172" rx="7" ry="9" fill="{SKS}"/>
<path d="M90 166 h5 M90 171 h5 M90 176 h5" stroke="{SKS}" stroke-width="1.4" stroke-linecap="round"/>
<path d="M166 166 h-5 M166 171 h-5 M166 176 h-5" stroke="{SKD}" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>'''
read='\n'.join([sombra,legs(),body(binoculo=True),neck(),maos_mapa,mapa,maos,
   '<g id="cabeca" transform="rotate(-6 128 120)">',face(128,100,40,look='baixo'),hat(128,28,72,64),'</g>'])
open(os.path.join(OUT,'pietro-lendo.svg'),'w').write(svg(read))

# ---- rosto em círculo (viewBox 128)
k=1.15
rosto=f'''<defs><clipPath id="pietro-rosto-c"><circle cx="64" cy="64" r="60"/></clipPath></defs>
<circle cx="64" cy="64" r="64" fill="#8fbf6a"/>
<circle cx="64" cy="64" r="60" fill="#d6edbd"/>
<g clip-path="url(#pietro-rosto-c)">
<path d="M14 132 C14 112 36 104 64 104 C92 104 114 112 114 132 Z" fill="{SH}"/>
<path d="M52 104 L64 118 L76 104 Z" fill="{SKS}"/>
<path d="M28 132 Q30 116 34 110" fill="none" stroke="{PACK}" stroke-width="9" stroke-linecap="round"/>
<path d="M100 132 Q98 116 94 110" fill="none" stroke="{PACKS}" stroke-width="9" stroke-linecap="round"/>
{face(64,80,40,s=1.12,simples=True)}
{hat(64,16,52,54,s=0.82)}
</g>'''
open(os.path.join(OUT,'pietro-rosto.svg'),'w').write(svg(rosto,"0 0 128 128"))
