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
