@AGENTS.md

# Pietro Games

Plataforma de alfabetização com tema de animais para uma criança com autismo leve e hiperfoco em animais. Mapa 3D em três níveis (`src/components/mundo/`): planeta → país (ilha com a silhueta real, Natural Earth) → bioma. Seis países (Brasil, EUA, Rússia, China, Austrália, África), cada um com biomas reais e bichos pela origem real (`src/content/paises.ts`). Começa no Brasil e libera os próximos. Deploy grátis na Vercel.

- Pedagogia: siga `docs/METODOLOGIA.md` (método fônico, sem punição, dica automática, rodadas curtas, gamificação sem perda).
- Visual: siga `docs/DESIGN-SYSTEM.md`. Só tokens de `src/app/globals.css`, componentes de `@/components/ui`, ilustrações de `public/arte/` (Fluent Emoji Flat). Vitrine em `/design-system`.
- **REGRA DURA: todo elemento tocável tem estímulo e resposta visual (micro-interação), e toda mudança de estado é animada.** Siga `.claude/skills/motion/SKILL.md`, com movimentos suaves e previsíveis (autismo).
- Agentes do time (em `.claude/agents/`, terminais no canvas): `ilustrador` / Nanquim (arte, skill `ilustracao`), `ui-designer` / Faísca (telas e motion, skills `ui-design` e `motion`) e `modelador-3d` / Cinzel (mundo 3D e desempenho, skill `modelagem-3d`).
- Jogos novos: `docs/COMO-CRIAR-UM-JOGO.md`.
- Animais vêm sempre de `src/content/animais.ts`, no bioma do país onde vivem de verdade (ex.: pinguim não vive no Ártico). Curiosidades precisam ser verdadeiras.
- Banco: Prisma 7 (versão estável; o "latest" do npm é um RC do 8). Credenciais em `.env`, nunca commitar.
- `cacheComponents` está ligado: params de rota dinâmica são lidos dentro de `<Suspense>`.
- Textos da interface em português do Brasil.
