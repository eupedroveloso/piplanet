---
name: modelagem-3d
description: Game design e modelagem 3D low-poly de alta qualidade e alta performance para o mapa do Pietro Games (three.js + React Three Fiber). Use para criar ou melhorar terreno, relevo, vegetação, água, construções, iluminação e desempenho do mundo 3D.
---

# Modelagem 3D e game design · Pietro Games

Esta skill evolui: registre o retorno recebido em **Aprendizados** (com data).

## Alvo visual (referências aprovadas pelo dono)

- **Low-poly "de maquete" premium**: facetado, mas rico em formas. Árvores com galhos aparentes e muitos cachos de copa facetada; pinheiros com muitos andares levemente tortos; pedras como blocos angulosos chanfrados em grupinhos; chão com camadas (grama em cima, terra/areia nas bordas).
- **Mar turquesa** estilizado, raso mais claro, algas visíveis no fundo, brilhos na superfície, espuma branca na costa; píeres de madeira com estacas, corrimão e lanternas.
- Luz suave de fim de manhã, sombras macias e oclusão de ambiente (cara de diorama).
- **Rejeitado pelo dono**: tudo "redondo e genérico" (smooth shading), chão parecendo "borrões com pixel de baixa resolução", formas quadradas/grade aparente, montanha única no meio, ilhas flutuantes, nuvens em ícone, lagos em forma de colher.

## Princípios de modelagem

1. **Faceta intencional, não ruído.** Cada triângulo visível precisa ter tamanho e cor que façam sentido. Evite pontilhado de cor por face (vira "pixel"). Prefira **regiões de cor contínuas com bordas bem definidas** entre zonas (grama / terra / areia / rocha / neve), com variação de tom suave em manchas grandes.
2. **Triangulação irregular**: desloque levemente os vértices da grade (jitter determinístico) para quebrar o padrão quadriculado; em áreas planas use faces maiores, em encostas e costas faces menores.
3. **Camadas de terreno** como nas maquetes: topo de grama, uma "borda" de terra/areia aparecendo em degraus e falésias, praia larga e lisa, rocha nas encostas íngremes, neve só nos topos.
4. **Silhueta e leitura**: o relevo precisa compor o cenário e servir ao jogo (serras dividem biomas, passagens para a trilha, mirantes nas fases). A trilha e as fases têm que ser legíveis a distância.
5. **Detalhe onde o olho vai**: perto da trilha e das fases (flores, pedrinhas, tufos, cercas), menos detalhe no fundo.

## Desempenho (alvo: TABLET ANDROID intermediário, leve para abrir)

O dono exige que abra leve num tablet Android (GPUs Mali/Adreno intermediárias, 3–4 GB de RAM). Metas:

- **Abrir rápido**: JS inicial do mapa o menor possível (3D carregado sob demanda, já é `dynamic`); assets 3D **por país, sob demanda** (só baixa o país que abriu); total de modelos ≤ ~3 MB comprimidos (glTF com meshopt/Draco, sem texturas: cores por material/vértice).
- **Rodar liso (30–60 fps)**: até ~150 mil triângulos visíveis e ~80 draw calls no país em foco; instancing para tudo que repete; materiais compartilhados (poucos materiais diferentes).
- **Qualidade adaptativa**: comece no "médio" e use `PerformanceMonitor` (drei) para descer ou subir. Níveis: alto = sombras 2048 + N8AO meia resolução + dpr até 2; médio = sombras 1024 + sem AO + dpr 1.5; baixo = sem sombras dinâmicas (ou sombra só do sol estática), sem pós-processamento, dpr 1, menos decoração.
- Geometrias/materiais criados uma vez; `dispose` ao trocar de país; nada de alocação em `useFrame`; nada de recalcular normais de malha grande por quadro (o mar deve animar por shader/vertex shader ou ter poucos vértices).
- Cálculo pesado (relevo, distância à costa) uma vez por país, com cache; se ficar acima de ~300 ms, otimize (grade menor, worker).
- Meça e relate: tamanho dos arquivos baixados, triângulos e draw calls (`renderer.info`), tempo para gerar a ilha. Teste com o portal redimensionado para tablet (`maestri portal resize "Mundo" 1280 800`).

## Onde fica o código

- `src/components/mundo/ilha.ts` — silhueta → biomas → trilha → relevo (`altura`, `relevo` em grade) → `geometriaTerreno`, `geometriaFita`, `geometriaEspuma`. A API pública (`Ilha`) é usada por toda a cena: mantenha os campos.
- `src/components/mundo/formas.ts` — primitivas esculpidas (copa, rocha, pinho).
- `src/components/mundo/decoracao.ts` — catálogo por tipo de bioma e distribuição na ilha.
- `src/components/mundo/vida.tsx` — mar, espuma, algas, brilhos, bichos e objetos animados.
- `src/components/mundo/Cena.tsx` — luzes, câmera, pós-processamento e montagem.
- `src/components/mundo/Planeta.tsx` e `Espaco.tsx` — o nível do planeta.
- Conteúdo: `src/content/paises.ts` (biomas, âncoras, tipos), `VISUAL` em `ilha.ts` (cores por tipo).

## Regras do projeto que não podem quebrar

- Tudo determinístico (sementes fixas): o mesmo país gera sempre o mesmo mundo.
- Fases ficam em mirantes sobre a trilha; a trilha é aplainada; biomas no mar têm píer/deques.
- Biomas trancados ficam desbotados (`liberados`).
- Regra dura de micro-interação (skill `motion`) para qualquer coisa tocável.
- Fidelidade biológica/geográfica (ex.: sem cactos fora das Américas, sem pinguim no Ártico).

## Processo

1. Leia o pedido e os arquivos envolvidos. Tire screenshot do estado atual no portal "Mundo" (`maestri portal screenshot "Mundo"`, app em http://localhost:3100; para abrir um país direto: `localStorage.setItem('pg:settings', JSON.stringify({voz:false, velocidadeVoz:0.8, ultimoPais:'brasil'}))` e recarregar).
2. Planeje a mudança pensando em leitura do jogo + beleza + desempenho.
3. Implemente; rode `npx tsc --noEmit`, `npm run lint` e `npm run build`.
4. Confira no portal de longe (país todo) e de perto (bioma), em pelo menos 2 países diferentes.
5. Entregue resumo do que mudou, números de desempenho (triângulos/draw calls estimados) e pendências.

## Aprendizados

- 2026-11-26: o dono precisa que abra LEVE num tablet Android: qualidade adaptativa, assets por país sob demanda e orçamento de triângulos/draw calls mais baixo.

- 2026-11-26: o dono pediu "mais polígonos" e rejeitou a versão lisa: manter facetado, só mais denso e mais elaborado.
- 2026-11-26: chão com cor por face em grade fina ficou com cara de "borrões com pixel de baixa resolução" — precisa de zonas de cor bem definidas, camadas e triangulação mais intencional.
