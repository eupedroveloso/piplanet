# Design System · Pietro Games

Visual infantil e ilustrado: ilustração flat em tons pastel, formas arredondadas, botões "fofinhos" com relevo e mapa isométrico.

- **Tokens:** `src/app/globals.css`
- **Componentes:** `src/components/ui/` (importar de `@/components/ui`)
- **Vitrine viva:** abra `/design-system` no navegador

## Regras

**REGRA DURA: NENHUMA TELA ROLA (one-page).** Toda tela cabe em 100dvh, em todos os estados (fim de fase, dica, ficha aberta, carta virada, resultados), de 360x640 ao tablet deitado. Página: `h-dvh overflow-hidden flex flex-col`; áreas internas `flex-1 min-h-0`; tamanhos que dependem da altura usam `dvh` (ex.: `size-[min(9rem,22dvh)]`); conteúdo centralizado usa `justify-center-safe`; telas baixas compactam com `sm:[@media(max-height:820px)]:`. Listas longas viram páginas (setas + deslizar + bolinhas), nunca rolagem. Nada de `min-h-dvh`.

**REGRA DURA: RESPIRO E POUCO TEXTO.** Cada cartão tem no máximo um número grande e um rótulo de 1 a 3 palavras; comparação vira chip curto (▲ 56 min), nunca frase. No máximo um título curto por seção, e só quando necessário; sem frases explicativas. Menos itens por tela, mais espaço entre cartões (`gap-3`/`gap-4`) e padding interno generoso (`p-4`/`p-5`). Prefira o gráfico ao texto. Se não couber, pagine ou divida em mais seções, nunca esprema.

**EQUILÍBRIO: respiro ≠ cartão vazio.** Cartão tem o tamanho do conteúdo, alinhado ao topo (nada de `1fr`/`h-full` esticando). Cada página do celular é uma tela cheia de informação útil (ex.: 4 KPIs compactos em 2x2 + um gráfico); só um gráfico pode crescer para ocupar a sobra. Junte seções pequenas em vez de criar páginas meio vazias. Espaço entre cartões de 12 a 16 px e padding interno de 16 px. Estado vazio: os mesmos cartões com "—" e um único aviso curto ("Sem atividade ainda"), sem esticar.

**PRINCÍPIO: a ferramenta é para quem NÃO SABE LER.** Todo botão e toda instrução funcionam sem leitura: ícone grande e claro + fala da Juju ao tocar ou ao aparecer. Texto pode existir, mas nunca é o único meio de entender algo (ícone e voz vêm primeiro).

0. **REGRA DURA: tudo tem micro-interação.** Todo elemento tocável responde a hover, toque e resultado; toda entrada, saída ou mudança de estado é animada. Receitas e limites (suave, previsível, um foco por vez) em `.claude/skills/motion/SKILL.md`.
1. Nunca use cor, raio ou sombra solta. Sempre um token (`bg-roxo`, `rounded-lg`, `shadow-suave`...).
2. Antes de criar algo novo, procure um componente pronto. Se não existir, crie em `src/components/ui/`, exporte no `index.ts` e adicione na vitrine.
3. Ilustrações vêm só do acervo em `public/arte/` (ver "Ilustrações"). Não misture estilos.
4. Fonte **Baloo 2** para interface; **Andika** (`font-leitura`) só para o que a criança lê: letras, sílabas, palavras.
5. Alvos de toque com no mínimo 56 px (`size-14`).
6. Animações suaves e curtas. O CSS e o `ProvedorMovimento` já respeitam "reduzir movimento".

## Tokens

### Cores

| Token | Uso |
|---|---|
| `roxo` / `roxo-escuro` / `roxo-claro` | títulos, botão principal, relevo, fundos suaves |
| `amarelo` / `amarelo-escuro` / `amarelo-claro` | destaque, estrelas, fase atual |
| `coral` / `coral-escuro` | concluído ✓, novidade |
| `verde` / `verde-escuro` / `verde-claro` | acerto, confirmar |
| `azul` / `azul-escuro` / `azul-claro` | apoio |
| `fundo`, `branco`, `tinta`, `tinta-suave`, `linha`, `bloqueado` | neutros |

### Tema por território

Coloque `data-territorio="fazenda|floresta|savana|oceano"` num contêiner e use `bg-t-fundo`, `bg-t-chao`, `bg-t-trilha`, `text-t-destaque`. As telas de jogo usam isso para ganhar a cor do território.

### Raios, sombras e animações

- Raios: `rounded-sm` (12), `rounded-md` (20), `rounded-lg` (28), `rounded-xl` (40), `rounded-full`
- Sombras: `shadow-suave` (flutuante), `shadow-relevo` (bloco), `shadow-flutuante` (contorno fino + sombra macia, para o que fica sobre o 3D).
- Superfície `vidro` (classe em `globals.css`): base de cabeçalho, rodapé e controles sobre o mapa. Em etiquetas com texto, combine com `bg-branco`/`bg-amarelo` sólido para garantir contraste. Botões usam relevo colorido: `shadow-[0_6px_0_var(--cor-escura)]`
- Animações: `animate-flutuar` (mascote), `animate-pulsar` (chamar atenção)

## Componentes

| Componente | Para quê |
|---|---|
| `Botao` / `BotaoLink` | ação principal; cores `roxo, amarelo, verde, coral, branco`; tamanhos `md, lg`; `icone` (sempre que possível) e `fala` (a Juju lê ao tocar) |
| `BotaoRedondo` / `BotaoRedondoLink` | ícone circular de vidro, 48 px (voltar, zoom); a Juju lê o `aria-label` ao tocar (`fala` troca a frase, `fala={false}` cala) |
| `BotaoSom` | liga/desliga a voz |
| `Arte` | ilustração do acervo; `silhueta` para o que ainda não foi conquistado |
| `Contador` | pílula de placar (ícone + número, `total` opcional); o número sobe contando e o ícone pula quando aumenta; tocar fala o valor |
| `NumeroAnimado` | número que sobe contando até o valor (`de` = valor inicial) |
| `Estrelas` | 0 a 3 estrelas, entram em cascata (`atraso` em segundos) |
| `Bolinhas` | progresso da rodada |
| `Peca` / `Casinha` | bloco de sílaba e encaixe; tamanhos `md`, `sm`, `xs` (5+ sílabas), mobile primeiro; mesmo `layoutId` nas duas faz a peça voar até a casinha |
| `fonteQueCabe` / `fonteQueCabeEm` | font-size que encolhe para a palavra caber numa linha (pela largura da tela ou de uma caixa fixa); use em toda palavra grande de leitura |
| `Comemoracao` | brilhos em roda, uma vez, no centro do pai (`relative`); some com "reduzir movimento" |
| `Mascote` | coruja Juju com balão de fala (toque lê em voz alta) |
| `ArteMascote` / `usePersonagem` | arte do explorador do perfil atual (Pietro ou Pérola; Pais usa o Pietro); cai no Pietro se a arte ainda não existir |
| `Explorador` | sprite do explorador andando/feliz (8 fps), usado na trilha do jogo, no loading, no cartão de nível e no mapa |
| `TrilhaProgresso` | trilha da fase no topo do jogo: o explorador anda até a próxima parada a cada bicho |
| `CenarioFundo` | cenário do bioma atrás das telas de exercício (`public/arte/cenarios/<tipo>.svg`); fade de entrada + parallax leve, sem parallax com reduzir movimento |
| `Painel` | superfície branca arredondada |
| `Cabecalho` | topo: cartão de vidro com avatar (fala ao tocar), saudação e placar; `estreito` para telas de conteúdo |
| `NavInferior` | pílula de vidro flutuante e centralizada (só do tamanho do conteúdo, respeita safe-area); fala ao tocar; pílula do ativo desliza |
| `CLASSE_ETIQUETA` | placas sobre o 3D (país, bioma): ícone de bicho primeiro, 40 px com toque de 48 px |
| `ProvedorMovimento` | no `layout.tsx`: liga `reducedMotion="user"` em todo o Motion |
| `MOLA_TOQUE`, `MOLA_ENTRADA`, `BALANCO`, `TOQUE_RELEVO` | molas e receitas padrão de motion (use em vez de números soltos) |

## Mapa 3D em três níveis

`src/components/mundo/` — three.js + React Three Fiber + drei.

1. **Planeta** (`Planeta.tsx`): globo com o mapa-múndi (Natural Earth via `world-atlas`, domínio público). Os 6 países da jornada aparecem coloridos; trancados ficam cinza. Arrastar gira; tocar no país viaja até ele.
2. **País** (`Cena.tsx` + `ilha.ts`): ilha com a **silhueta real** do país (`geo.ts`), no meio do oceano. Biomas em regiões com fronteiras naturais; relevo suave com função: serras nas fronteiras, passagens onde a trilha cruza, mirantes nas fases, relevo típico de cada bioma (dunas, mesas, morros pontudos do bambuzal…). Biomas no mar têm píer e deques.
3. **Bioma de perto**: a câmera aproxima e mostra as fases da trilha.

- `content/paises.ts`: países, biomas (com âncoras u/v na silhueta), níveis de leitura e temas de cor por tipo de bioma.
- `decoracao.ts`: catálogo low-poly por tipo de bioma (vegetação real de cada lugar; cactos só nas Américas, por exemplo).
- `vida.tsx`: tudo que se mexe (mar, espuma, bichos, barcos, golfinhos, baleia, balão).
- `Rotulos.tsx`: placas e fases em HTML por cima do 3D, com micro-interação.

## Ilustrações

Coleção **Fluent Emoji Flat** (Microsoft, licença MIT), salva em `public/arte/animais/` e `public/arte/ui/`. Para adicionar: baixe o SVG "Flat" do repositório `microsoft/fluentui-emoji` e salve com nome em português.
