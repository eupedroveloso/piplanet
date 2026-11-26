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
- 2026-11-26 (acervo completo, 76 bichos): todos redesenhados no padrão do piloto. Convenções que surgiram e valem para os próximos: rosto escuro ou listrado (búfalo, gorila, guaxinim, bisão, grilo) leva íris clara/âmbar ou anel claro para o olho não sumir; bicho branco (urso-polar, raposa-do-ártico, cisne) usa branco-creme com sombra azul-acinzentada e contorno cinza-azulado; bicho aquático ou que voa mantém a elipse de sombra em cy 237 (ou faixa de água/areia/pedra embaixo); siri, pinguim, sapo e preguiça ficam de frente porque de perfil perdem a leitura. Sempre conferir em GRADE junto com a vaca (mesmo tamanho na área, contorno, olhos) e em 64 px.

- 2026-11-26: o mascote passou a ser o PIETRO, um garoto explorador de 6 a 8 anos, no lugar da coruja Juju. Arquivos em `public/arte/mascote/`: `pietro.svg` (corpo inteiro acenando), `pietro-rosto.svg` (avatar em círculo, viewBox 128) e `pietro-lendo.svg` (lendo um mapa). O gerador fica em `scripts/mascote/pietro.py`, que recebe a pasta de saída como argumento.
  - Estilo: flat e sem contorno, como foi pedido. Os volumes vêm de formas de sombra (opacidade 0.55 a 0.6) e de brilhos em traço claro. O olho segue a receita dos bichos (pupila #2b1d16 com dois brilhos).
  - Paleta fixa: pele #f6c9a0 (sombra #e3a77c), cabelo #6b3f22, chapéu #e2c487 com faixa #7a4a26 e broche de patinha amarelo, camisa cáqui #c8b27a, bermuda #8a6d45, mochila laranja #e9844a, botas #8a5530.
  - Expressão: o público tem autismo, então nada exagerado. Usar sorriso fechado e suave e sobrancelhas em arco baixo.
  - Para mostrar que ele está olhando para baixo, basta descer as pupilas. Pálpebra pesada ou olho fechado deu cara de desconfiado ou de sono, e foi descartado.
  - No avatar de 32 px, o rosto precisa ocupar cerca de 60% do círculo e o chapéu fica menor. Com o chapéu dominando, o rosto some.
  - Não houve foto de referência, então é um menino genérico de cabelo castanho; o dono ajusta depois.
- 2026-11-26 (Pietro em movimento): fiz o ciclo de caminhada de perfil em 4 quadros (`pietro-andando-1..4.svg`) e o `pietro-feliz.svg`. O gerador é `scripts/mascote/pietro_andando.py`, que reaproveita as partes de `pietro.py`.
  - Para os quadros não pularem: viewBox 256 igual nos quatro e quadril fixo em x=130. Só muda a altura do corpo: nos quadros de passagem ele sobe cerca de 3 px, calculado para o pé de apoio tocar sempre y=236. A sombra no chão fica fixa.
  - Pernas e braços são feitos com segmentos (coxa e canela, braço e antebraço) com ângulos por quadro; a fórmula está no gerador. O lado de longe usa os tons de sombra.
  - Mochila e binóculo balançam 1 a 2 px, atrasados em relação ao corpo.
  - Na ponta da perna da bermuda, usar `stroke-linecap="butt"`. Com ponta redonda, os joelhos viraram bolinhas.
  - Na pose feliz (comemoração), olhos em arco e boca aberta são aceitáveis. No uso geral, manter o sorriso fechado.
- 2026-11-26 (Pérola): fiz a garota exploradora com o mesmo conjunto de arquivos do Pietro (perola, -rosto, -lendo, -andando-1..4, -feliz), para trocar 1:1. O gerador é `scripts/mascote/perola.py`, que roda os geradores do Pietro trocando a paleta e envolvendo `face()` e `cabeca()`, sem duplicar código. Uma mudança na base do Pietro passa para os dois.
  - Para não cair em estereótipo: mesma roupa de explorador, com camisa cáqui-sálvia, mochila verde-azulada e círculo do avatar verde-azulado (o do Pietro é verde). A diferença está no cabelo: trança sobre o ombro com elástico laranja e, de perfil, rabo de cavalo que balança com o passo. Os cílios são discretos, um traço por olho.
  - Na pose lendo, a trança fica mais curta (3 gomos) para não cobrir o mapa.
