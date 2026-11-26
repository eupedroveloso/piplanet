---
name: ilustracao
description: Guia de estilo e processo para criar ilustrações SVG do Pietro Games (animais, cenário, mascote, objetos do mapa). Use sempre que for desenhar, redesenhar ou revisar qualquer ilustração do projeto.
---

# Skill de ilustração · Pietro Games

Esta skill evolui com o retorno do dono do projeto. Ao receber retorno sobre uma ilustração, registre a lição na seção **Aprendizados** no fim deste arquivo.

## Público e propósito

Criança com autismo leve e hiperfoco em animais, aprendendo a ler. Ela conhece MUITAS espécies e seus detalhes: anatomia e marcas características precisam estar corretas (listras da zebra, juba do leão, mancha do mico-leão-dourado). Um animal "genérico" decepciona.

## Estilo (obrigatório)

- **Infantil, ilustrado, rico em detalhes e bem elaborado.** Nunca minimalista nem ícone chapado.
- Base **flat vetorial com volume**: cada cor em pelo menos 3 tons (base, sombra, luz). Luz vindo de cima à esquerda.
- **Detalhes que fazem a diferença:** brilho nos olhos (2 pontos de luz), bochechas rosadas suaves, textura de pelo/penas/escamas com traços curtos, unhas, focinho com reflexo, sombra de contato no chão (elipse suave).
- **Fofo e amigável:** cabeça um pouco maior, olhos grandes e expressivos, expressão alegre. Nada assustador: dentes de predadores aparecem pouco e arredondados.
- **Contorno:** sem traço preto. Use contorno escuro da própria cor (ex.: laranja → marrom-alaranjado), 2–3 px, cantos arredondados (`stroke-linejoin="round"`).
- **Paleta:** cores naturais do animal, levemente pastel e saturação média. Combine com os tokens de `src/app/globals.css` (roxo #5b2a9c, amarelo #ffc935, coral #f25f5c, verde #5dbb85, azul #4fb0e3) sem forçar cores irreais.
- **Pose:** corpo inteiro, 3/4 de perfil, olhando para a frente/esquerda, em pé no chão.
- **Coerência:** todos os bichos parecem da mesma coleção: mesma proporção de olhos, mesma espessura de contorno, mesma luz.

## Formato técnico

- SVG à mão, `viewBox="0 0 256 256"`, sem `width`/`height` fixos, fundo transparente.
- Desenho ocupando ~85% da área, centralizado, base apoiada em y≈236.
- Agrupe em `<g id="...">` (sombra, corpo, cabeça, olhos, detalhes). Use `<defs>` com `linearGradient`/`radialGradient` para volume suave, com ids prefixados pelo nome do arquivo (ex.: `leao-juba`) para não colidir quando vários SVGs estão na mesma página.
- Sem fontes, sem imagens embutidas, sem filtros pesados (`feGaussianBlur` só se pequeno). Alvo: até 25 KB por arquivo.
- Nome do arquivo em português, sem acento: `public/arte/animais/<id>.svg` (o `id` de `src/content/animais.ts`), `public/arte/ui/<nome>.svg` para cenário/objetos.
- Objetos do mapa da ilha (árvores, celeiro, rochas, cactos...) seguem a mesma luz, com sombra projetada para baixo e à direita, combinando com os blocos isométricos (`src/components/ilha/geometria.ts`, `CORES_BIOMA`).

## Processo

1. Leia o pedido e, se for animal, a ficha dele em `src/content/animais.ts` (nome, grupo, curiosidade). Pense nos 3–5 traços que tornam a espécie reconhecível.
2. Desenhe o SVG em camadas: sombra no chão → corpo → patas → cabeça → rosto → detalhes e texturas → brilhos.
3. **Confira o resultado visualmente.** Gere um PNG: `qlmanage -t -s 512 -o /tmp/ilustra <arquivo.svg>` e abra o PNG com a ferramenta Read. Ou abra `http://localhost:3100/design-system` no portal do canvas.
4. Faça pelo menos uma rodada de melhoria olhando o PNG: proporções, legibilidade em tamanho pequeno (64 px) e riqueza de detalhes.
5. Substitua o arquivo antigo mantendo o mesmo nome (o app já aponta para ele). Não mexa em código do app, a menos que seja pedido.
6. Ao terminar, responda com a lista de arquivos criados e uma frase sobre cada um.

## Aprendizados

(Registre aqui o retorno recebido, com data. Ex.: "2026-11-26: olhos estavam pequenos demais; usar olhos com ~18% da largura da cabeça.")

- 2026-11-26: o dono pediu ilustrações "sempre detalhadas, ricas em detalhes e bem elaboradas". O acervo Fluent Emoji Flat atual é simples demais e deve ser substituído aos poucos.
- 2026-11-26 (piloto coruja/gato/pato/vaca, aguardando avaliação do dono): padrões adotados para coerência. Olho: pupila escura `#2b1d16` com rx 9 / ry 10.5 (até r 11.5 na coruja), brilho grande r 4.2 em (-3.5, -4.5) e pequeno r 2 em (+4, +4.5); íris colorida só quando a espécie pede (coruja âmbar, gato verde). Bochechas: elipse `#f4908a` rx 9 ry 5.5, opacidade 0.5. Contorno 2.5 px na cor escura do próprio bicho; detalhes internos 1.5–2 px. Gradientes lineares x1=0 y1=0 → x2=1 y2=1 (claro → base → sombra). Sombra no chão: elipse cy 237, ry 8, `#3b2a1a` a 18%. Patas/pernas que encostam no corpo: desenhar antes do corpo (ou sem traço no topo) para não parecerem coladas. Listras/manchas: recortar com `clipPath` no contorno do corpo.
- 2026-11-26: piloto APROVADO pelo dono ("as ilustrações de animais ficaram boas"). Coruja, gato, pato e vaca são o PADRÃO de referência para todos os bichos: corpo inteiro, 3/4, volume com gradientes, contorno na cor do bicho, olhos com 2 brilhos, bochechas, sombra no chão e marcas reais da espécie. Antes de desenhar um bicho novo, abra um desses 4 arquivos como referência.
- 2026-11-26 (cenários das telas de exercício): fundos 1600x1000 em `public/arte/cenarios/<tipo>.svg`, gerados por `scripts/cenarios/biomas.py` (peças reutilizáveis em `cenarios.py`; rode `python3 biomas.py ../../public/arte/cenarios [tipo]`). Centro calmo e claro, elementos nas bordas e no chão, camadas distantes sem contorno e mais claras (perspectiva atmosférica). qlmanage corta paisagens em quadrado: para conferir, use Chrome headless (`prev.sh`). Peso: números inteiros, `stroke-linejoin/linecap` num `<g>` de fora, caules e elementos de fundo num único path, versões `simple` para o que fica longe.
