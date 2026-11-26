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
- 2026-11-26 (retorno do dono, print `ref-chao-ruim.png` = "antes"): "parece pixel estourado". Causas: (1) salto de altura na linha d'água (-0,3 → 0,2) amostrado numa grade de 0,15 virava escadinha na costa; (2) cor por vértice misturada e depois média por face = pontilhado/borrão; (3) laterais de areia/terra em degraus quadriculados. **Nunca** crie descontinuidade no relevo (a grade a transforma em serrilhado) e nunca pinte por média de cores de vértice.
- 2026-11-26: receita do chão que funcionou (`geometriaTerreno` em `ilha.ts`): quadtree adaptativa sobre a grade `relevo` (blocos de 1,6 → 0,2, divide por erro bilinear > 0,045, costa/fronteira/trilha no máx. 0,4, equilíbrio 2:1 e leque com pontos do meio = sem rachaduras), jitter determinístico proporcional à menor face que toca o vértice, diagonais alternadas por hash; depois **recorta cada triângulo nas linhas de contorno** (y da plataforma/água/areia molhada/praia, inclinação de terra/rocha, neve, manchas de tom, estratos) e pinta **uma cor sólida por pedaço** decidida no centro. Resultado: 16–24 mil triângulos por país (antes ~150 mil), ~250–400 ms para gerar (ilha + terreno).
- 2026-11-26: perfil de costa "maquete" = fundo contínuo → praia lisa (0 → 0,3) → degrau curto e firme (≥0,4 de altura, para a faixa de terra sair contínua e não em cacos) → platô de grama; falésia onde um ruído de baixa frequência passa de 0,6. Inclinação medida numa janela de 0,4 (contorno mais liso). Limiar de terra 0,95 e rocha 1,6 (0,62 espalhava manchas marrons nas colinas). Trilha: em terra nunca abaixo de NIVEL_PIER+0,04 (senão o trecho vira píer).
- 2026-11-26: espuma = contorno de marching squares **encadeado em linhas** + Chaikin + fita de largura constante (retângulos soltos por segmento davam serrilhado).
- 2026-11-26 (decisão técnica, autorizada pelo dono): ficar em three.js/R3F. O gargalo é asset e desempenho, não o motor; Babylon/PlayCanvas só se surgir limitação real (explicar antes), Unity/Godot web pesam demais no tablet e na integração com os jogos. Assets: modelos prontos CC0 (Quaternius, Kenney) em glTF otimizado, por país e sob demanda, com instancing por tipo e créditos em `public/modelos/CREDITOS.md`.
- 2026-11-26: o mar anima no vertex shader (`onBeforeCompile`, uniform de tempo; com flatShading a normal sai das derivadas). Qualidade adaptativa em `Cena.tsx` (PerformanceMonitor, começa no médio). Em dev, `window.__pgDesempenho()` devolve triângulos/draw calls/dpr para medir no portal.
- 2026-11-26 (retorno do dono, via coordenação): o tablet dele viu o estado intermediário (peças viraram caixas gigantes). **Regra: o app fica SEMPRE funcional entre etapas.** Troca grande vai atrás de uma chave (`USAR_MODELOS` em `modelos.ts`; para testar só no meu navegador, `localStorage pg:modelos=1`, que é isolado por portal; parâmetro na URL não serve, porque o app reescreve a URL ao navegar). Liga só depois de conferir no portal. Use um portal próprio ("Mundo Cinzel") quando outro agente estiver usando o "Mundo".
- 2026-11-26: draw calls vinham de meshes soltos (algas 180, pássaros 28, miudezas do mar, mirantes, trechos da trilha), não da vegetação: 329 meshes → 56 com `fundir()` (`fundir.ts`: junta peças estáticas com cor por vértice) e instancing nos animados. Medir sempre com `window.__pgDesempenho()` (soma todos os passes do quadro; o `renderer.info` zera a cada passe com o pós-processamento).
- 2026-11-26: modelos prontos = Kenney Nature Kit (CC0). Pipeline `scripts/modelos.ts` (fonte em `scripts/modelos-fonte/`): achata cada modelo numa malha só, troca as cores do kit (turquesa/laranja) pela paleta do projeto gravada nos vértices, marca as partes tingíveis em `_TINGE`, normaliza o tamanho por família e grava um .glb por país (quantização + meshopt; 43–87 KB). Na cena, um único **BatchedMesh** (`DecoracaoModelos.tsx`): cor da instância em Vector4, rgb = tinta das partes tingíveis e alfa = desbotado; o shader força `vColor.a = 1` (com o canvas transparente o alfa vazaria o fundo). Cuidado: o StrictMode desmonta e remonta reaproveitando o mesmo BatchedMesh, e um BatchedMesh descartado quebra (`_matricesTexture` nulo), então só descarte na troca ou na desmontagem real.
- 2026-11-26: as árvores frondosas do kit ficaram genéricas e "quadradas" ao lado das procedurais (galhos + cachos). Híbrido: árvores frondosas/tropicais/bétula/eucalipto procedurais; pinheiros, acácia, palmeiras, arbustos, tufos, flores, pedras, cogumelos, troncos, cactos (só EUA) e bambu do kit. O Quaternius (melhores árvores) só se baixa por Google Drive/itch, então ficou pendente.
- 2026-11-26 (espaço, pedido do dono: "asteroides são só bolas"): `rochas.ts` → `geometriaRocha()` = icosaedro + ruído + crateras (fundo afundado, borda levantada), facetado, uma cor por face (manchas, fundo de cratera escuro, borda clara). Serve para asteroides (3 formas instanciadas, escala não uniforme para alongados, eixo de giro próprio), lua e núcleo do cometa. Foguete = Lathe (corpo/bico/bocal) + aletas Extrude + aro/vidro, fundidos numa malha; chama em 3 cones aditivos + brilho; rastro instanciado nas posições passadas da órbita. **Orientação em grupo inclinado**: `lookAt` usa coordenadas do mundo; use `quaternion.setFromUnitVectors(Y, velocidadeLocal)`. **Câmera do planeta orbita até o país**: efeito "de fundo" (cometa) precisa ser posicionado relativo à câmera, senão some atrás dela. Temporários usados no `useFrame` vão em `useRef` (o lint do React Compiler barra mutar `useMemo`); depois de mudar a forma de um `useRef`, recarregue a página (o Fast Refresh mantém o objeto antigo).
- **Progresso que se desenha na trilha (2026-11-26):** UMA fita a mais sobre o piso da trilha inteira, com atributo `aS` (índice da amostra ao longo da trilha) e `discard` no shader quando `vS > uFeito`. A animação só mexe num uniform: custa +1 draw call e zero geometria nova por quadro. Ponta brilha (emissive com `smoothstep` perto de `uFeito`), easing suave (smoothstep) e 1,5 s. A câmera acompanha com `moveTo(alvo + 40% do deslocamento da ponta, true)`; o `smoothTime` do CameraControls suaviza. Uma mãozinha HTML vai na ponta por âncora dinâmica (ref de Vector3 que o 3D copia a cada quadro). "Animar uma vez" = última posição vista no sessionStorage, gravada **só quando a animação começa** (o StrictMode roda o efeito duas vezes: gravar no efeito apaga a animação). O "antes" vem num `useMemo` desde o primeiro quadro, senão o trecho novo pisca pronto. Espere o foco no bioma (ou um fallback de 2,5 s) antes de começar. Com movimento reduzido: sem câmera nem mãozinha viajando, só o preenchimento. Lógica em `caminhada.ts`.
- **Explorador andando sobre o 3D (2026-11-26):** personagem em HTML na âncora dinâmica da ponta do caminho. Quadros trocados por `setInterval` de 125 ms, e o lado detectado comparando o `translate3d` da âncora entre quadros (rAF, sem estado React) para aplicar `scaleX(-1)`. Se os quadros já sobem na passagem, não some outro sobe e desce. O sprite é o `ui/Explorador` (do Faísca, compartilhado com os jogos); a arte nova é detectada sozinha com um `new Image()` (onload/onerror), então o reserva entra sem quebrar nada até o ilustrador entregar. Armadilha: `<img>` com `size-14` dentro de um span `absolute left-full` encolhe para ~12 px por causa do `max-width: 100%` do preflight; use `max-w-none`. Na espera antes de animar, o personagem fica parado no nó ANTIGO (senão aparece no novo e "volta"). A troca do andando para o parado é um pulinho do centro do nó para o lado.

### iPhone derrubando o WebGL (modo leve) — 2026-11-26
- **Sintoma:** no iPhone (Safari, dpr 3) a ilha caía ao voltar de um jogo e aparecia a tela de proteção. No Mac nada acontecia.
- **Causa provável:** o `PerformanceMonitor` sobe para "alto" num GPU rápido, o que liga N8AO, MSAA 4x e sombra 2048. Com o dpr alto, isso estoura a pouca memória de vídeo do Safari.
- **Regra:**
  - Aparelho de toque (`ehCelular()` em `modoLeve.ts`) nunca passa do "médio" e usa dpr ≤ 1,5.
  - `modoLeve()` (iPhone/iPad com dpr ≥ 3, ou depois de uma queda) fica travado no "baixo", com:
    - dpr 1, sem sombras, sem antialias e sem PerformanceMonitor;
    - sem algas, brilhos e miudezas do mar, nem as pedrinhas e metade dos arbustos;
    - no planeta, globo de 1024 px, sem asteroides, cometa, satélite nem criaturas.
- **Recuperação:**
  - O `ProtecaoCena` liga o modo leve ao perder o contexto e remonta.
  - Cena e Planeta leem `modoLeve()` num `useState` na montagem, então voltam leves sozinhos.
  - O listener de perda ignora canvas já desmontado (`isConnected`), porque o R3F força a perda ao liberar.
- **Liberar a GPU:**
  - O R3F 9 já chama `dispose` e `forceContextLoss` ao desmontar o Canvas; não duplique.
  - Descarte o que você mesmo cria com `useMemo` (geometrias, CanvasTexture) num `useEffect` de limpeza.
- **Testar sem iPhone:**
  - `maestri portal ua "<portal>" ios`, depois `resize 393 852`.
  - Force o modo leve com `localStorage.setItem("pg:3d-leve","1")`.
  - Simule a queda com `WEBGL_lose_context.loseContext()` no canvas.
  - Confira com `__pgDesempenho()`, que tem o campo `leve`. No Brasil o modo leve caiu de 136 mil para 74 mil triângulos e de 69 para cerca de 40 draw calls.
- **Canvas vivo em rota escondida (achado pelo Faro):**
  - Com `cacheComponents`, o Next 16 não desmonta a rota `/` ao ir para `/jogar`. Ele a esconde com `<Activity mode="hidden">`.
  - O R3F só desmonta num `useInsertionEffect`, que não roda ao esconder, então o contexto WebGL e a memória de vídeo ficavam presos durante o jogo inteiro.
  - Correção: o `ProtecaoCena` guarda `visivel` num `useLayoutEffect` (true na montagem, false na limpeza) e só renderiza o Canvas quando visível. Ao esconder, o R3F libera a GPU; ao voltar, cria um contexto limpo.
  - Conferência: em `/jogar/...`, `document.querySelectorAll('canvas').length` deve dar 0.
- **Enquadramento do bioma no celular (aprovado pelo Faro, 2026-11-26):**
  - **Cálculo:** o encaixe é feito na TELA, em px. Uma câmera de teste projeta os nós, e a caixa soma os 56 px do nó, as estrelas e a placa "Nível" (~96 px à esquerda da 1ª fase do nível).
  - **Iteração:** a caixa é centrada na área livre (abaixo do placar, acima do "Continuar") e a distância é ajustada em 6 iterações.
  - **Em pé:** encaixe só do nível atual, com a câmera mais de cima (altura 17 em vez de 11,5). Assim a profundidade se abre na tela e os nós não se encavalam.
  - **Armadilha:** a direita da tela no chão é `(dir.z, 0, -dir.x)`, com `dir` = do alvo para a câmera. Com o sinal trocado, o laço diverge e a tela vira só mar. Ponha trava no desvio do alvo e na distância.
- **Carregamento completo e rápido (aprovado pelo Faro, 2026-11-26):**
  - **Sinal de pronto:** a TelaCarregando só sai com o aviso do `AvisarPronto`. Ele fica no MESMO Suspense dos modelos GLB, faz `gl.compileAsync(cena, camera)` com trava de 4 s e espera 2 quadros. Não use polling por `document.querySelector("canvas")` e `useProgress`: esse método deixava pedaços surgirem depois.
  - **Geração e cache:** a ilha é gerada em etapas, cedendo o quadro (`precarregar.ts`), e o terreno tem cache por país.
  - **Pré-carregamento ocioso:** do GLB (`useGLTF.preload` com os MESMOS argumentos do `useGLTF`) e da ilha do próximo país. Só CPU e rede.
  - **Limites:** shaders não dá para pré-compilar entre contextos, porque o programa é por contexto WebGL. A 1ª compilação pode custar ~1,5 s a mais no dev.
  - **Medição:** `window.__pgTempos`. No portal 393 ios, abrir do zero leva ~0,9 a 1,3 s, ir do planeta ao Brasil ~0,8 s, voltar da fase ~0,4 s, e o modo leve ~0,3 s na volta.
