---
name: ui-design
description: Guia de UI design do Pietro Games (layout, hierarquia, design system, telas infantis acessíveis). Use ao criar, revisar ou melhorar qualquer tela ou componente de interface.
---

# UI design · Pietro Games

Esta skill evolui: registre o retorno recebido em **Aprendizados**. Sempre use junto com a skill **motion** (`.claude/skills/motion/SKILL.md`): a regra dura de micro-interação vale para tudo.

## Contexto

App de alfabetização para uma criança com autismo leve e hiperfoco em animais, usado principalmente em **tablet**, por toque. O visual é infantil, ilustrado e rico em detalhes; o mapa é uma ilha isométrica em tela cheia.

## Fontes da verdade

- Design system: `docs/DESIGN-SYSTEM.md`, tokens em `src/app/globals.css`, componentes em `src/components/ui/` (vitrine viva em `/design-system`).
- Pedagogia e adaptações: `docs/METODOLOGIA.md` (sem punição, previsibilidade, baixa carga sensorial).
- Ilustrações são do agente ilustrador; você não desenha arte, você compõe telas.

## Princípios

0. **A ferramenta é para quem NÃO SABE LER.** Todo botão e toda instrução funcionam sem leitura: ícone grande e claro + fala da Juju ao tocar ou ao aparecer. Rótulos podem existir, mas ícone e voz vêm primeiro; texto nunca é o único meio de entender algo.

1. **Uma ação principal por tela**, grande e óbvia. O resto em segundo plano.
2. **Hierarquia clara**: título roxo Baloo → conteúdo → ação. O que a criança lê usa `font-leitura` (Andika), grande.
3. **Nada amontoado**: respiro generoso, elementos nunca se sobrepõem por acidente. Confira em 1024×768 (tablet deitado), 768×1024 (em pé) e 390×844 (celular) com `maestri portal resize`.
4. **Alvos de toque ≥ 56 px**, espaçados ≥ 12 px.
5. **Previsível**: mesma posição para voltar (topo esquerdo), som (topo direito), progresso (topo centro), ação principal (embaixo/centro).
6. **Só tokens e componentes do design system.** Precisa de algo novo? Crie o componente em `src/components/ui/`, exporte no `index.ts`, documente em `docs/DESIGN-SYSTEM.md` e adicione à vitrine.
7. **Acessível**: `aria-label` em botões só com ícone, contraste suficiente, nada que dependa só de cor.

## Processo

1. Leia o pedido e os arquivos da tela envolvida.
2. Abra a tela no portal do canvas (`maestri portal ...`, app em http://localhost:3100) e tire screenshot antes de mudar.
3. Implemente seguindo o design system e a skill motion.
4. Confira de novo no portal nos três tamanhos, clicando nos elementos para ver as micro-interações.
5. Rode `npx tsc --noEmit` e `npm run lint`.
6. Entregue um resumo curto do que mudou e do que ficou pendente.

## Aprendizados

- 2026-11-26: mapa em tabs e mapa em "quadradinho" foram rejeitados; a ilha é tela cheia com dois níveis de zoom.
- 2026-11-26: o mapa com 9 fases por território ficou "tudo em cima um do outro"; espaçamento entre elementos é prioridade.
- 2026-11-26: o portal "Pietro Games" é compartilhado com o time; outro terminal pode trocar a URL no meio do teste. Para automatizar uma rodada inteira, rode um script curto no `evaluate` e confira o resultado no fim.
- 2026-11-26: o dono achou o rodapé enorme (barra de largura toda, alta, itens longe). Rodapé é pílula flutuante centralizada, só do tamanho do conteúdo (ícone + rótulo lado a lado, 48 px), com safe-area.
- 2026-11-26: CONTRASTE sobre o 3D: placa com texto direto sobre o mapa ficou ilegível (neve, mar, floresta). Toda etiqueta sobre o 3D tem fundo SÓLIDO (`bg-branco`/`bg-amarelo`) + contorno e sombra (`shadow-flutuante`). Confira no planeta escuro e nas ilhas no mar.
- 2026-11-26: neste projeto o `@utility` do Tailwind 4 não foi gerado (a classe saiu sem estilo e as placas ficaram transparentes). Para classes próprias, use `@layer components { .classe {} }` e confira o estilo computado no portal.
- 2026-11-26: PRINCÍPIO NOVO do dono: "essa ferramenta é para quem NÃO SABE LER". Aplicado: placas com bicho como ícone, botões do jogo com ícone (▶, ↻, bandeira, troféu, lupa no lugar de "+"), `BotaoRedondo` fala o aria-label, rodapé/placar/avatar/álbum falam ao tocar, instrução do jogo é falada ao aparecer.
- 2026-11-26: visual refinado = menos peso: superfície `vidro` (branco 90% com desfoque, contorno fino) para o que flutua; relevo grosso só nos botões de ação.
- 2026-11-26 (UX mobile): teste sempre 360x800, 390x844, 768x1024 e 1280x800. Palavra grande de leitura nunca usa tamanho fixo: `fonteQueCabe`/`fonteQueCabeEm` (RI·NO·CE·RON·TE numa linha em 360 px). Peças/casinhas são mobile primeiro (`md`/`sm`/`xs`) e crescem em `sm:`.
- 2026-11-26: no celular, rodapé de 4 itens empilha ícone + rótulo pequeno; cabeçalho esconde a saudação (vem pela voz do avatar) e empilha os botões da direita; placas projetadas sobre o 3D são "presas" na tela (`data-prender`) para não saírem pela borda.
- 2026-11-26: no WebKit (Safari/iPad e o portal) `backface-visibility` falha quando o contexto 3D é achatado e o verso da carta aparece espelhado. Em cartas que viram, escolha a face visível pelo ângulo (useTransform) em vez de depender de backface.
