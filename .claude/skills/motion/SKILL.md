---
name: motion
description: Regras e receitas de motion e micro-interação do Pietro Games (estímulo e resposta visual em tudo). Use sempre que criar ou alterar qualquer elemento interativo, tela, transição ou feedback.
---

# Motion e micro-interação · Pietro Games

## REGRA DURA

**Todo elemento tocável tem estímulo e resposta visual. Toda mudança de estado tem animação.** Sem exceção. Antes de entregar, percorra a tela e confira cada botão, peça, card, nó do mapa, aba e ícone.

Esta skill evolui: registre o retorno recebido em **Aprendizados**.

## O equilíbrio com o autismo (inegociável)

Ele tem autismo leve: a animação precisa **informar e recompensar, sem assustar nem sobrecarregar**.
- Movimentos suaves e previsíveis. Nada de piscar rápido, tremer forte, flash de tela ou som estridente.
- Uma coisa chamando atenção por vez (a dica, a fase atual, o próximo passo).
- Erro = resposta gentil (balanço curto), nunca vermelho piscando nem "X".
- Respeite `prefers-reduced-motion` (o CSS global já reduz; com Motion use `useReducedMotion()` para trocar movimento por fade).

## Os 4 momentos de toda interação

| Momento | Resposta | Receita padrão |
|---|---|---|
| **Repouso** (convite) | sutil, só no que é o próximo passo | flutuar `y ±4–6px` 2–3 s em loop, ou pulso de escala 1→1.05 |
| **Hover** (mouse) | levantar | `y: -2`, sombra/relevo um pouco maior, 150 ms |
| **Toque** (pressionar) | afundar | `scale: 0.94–0.96` ou `translateY(4px)` com relevo diminuindo, 100 ms |
| **Resultado** | celebrar ou corrigir | acerto: mola de escala `1 → 1.15 → 1` + brilho/partículas; erro: balanço `x: [0,-10,10,-6,6,0]` 400 ms |

Mudanças de estado (aparecer, sumir, trocar de tela, abrir painel): entrada com fade + subida/escala de 0.9→1 (mola), saída com fade rápido. Listas entram em cascata (`staggerChildren` 0.04–0.08 s).

## Ferramentas

- **Motion** (`motion/react`): `motion.*`, `AnimatePresence`, `whileHover`, `whileTap`, `layout`, `useReducedMotion`.
- Molas padrão: `MOLA_TOQUE` (400/22) e `MOLA_ENTRADA` (220/16), exportadas de `@/components/ui` junto com `BALANCO` e `TOQUE_RELEVO`. Não repita os números.
- `ProvedorMovimento` (no `layout.tsx`) já liga `reducedMotion="user"`; `Comemoracao` some sozinha com reduzir movimento.
- Atenção: mola só aceita 2 keyframes. Para sequências (`[1, 1.15, 1]`) use `{ duration, ease }`.
- CSS: tokens `animate-flutuar`, `animate-pulsar` em `src/app/globals.css`. No SVG do mapa use `transform-box: fill-box` (ver `.ilha-pular`).
- Durações: toque 100–150 ms · transições 250–400 ms · celebração 600–900 ms · loops de convite 1.4–3 s.

## Receitas do projeto

- **Botões** (`Botao`, `BotaoRedondo`): relevo que afunda no toque + `whileHover` levantar.
- **Peças de sílaba/letra**: toque afunda; acerto voa/encaixa na casinha (layout animation) e a casinha dá "pop"; erro balança; dica pula.
- **Nó do mapa**: fase atual flutua; toque dá squash (scale 0.9) antes de navegar; fase concluída mostra o check com "pop".
- **Placar** (patinhas, estrelas): número sobe com contagem animada; ícone dá pulinho quando ganha.
- **Figurinha nova**: brilho girando + entrada com mola.
- **Troca de tela**: fade + leve deslize.
- **Feedback de voz**: quando algo está sendo lido em voz alta, o elemento lido ganha um destaque suave (glow/pulso) enquanto fala.

## Checklist antes de entregar

- [ ] Todo elemento tocável tem hover, toque e resultado.
- [ ] Toda entrada/saída de elemento é animada.
- [ ] Nada pisca rápido nem treme forte; só um foco de atenção por vez.
- [ ] Funciona com "reduzir movimento" ligado.
- [ ] Conferido no portal do canvas (http://localhost:3100) clicando de verdade.

## Aprendizados

- 2026-11-26: o dono definiu como regra dura que tudo na ferramenta tenha micro-interação, estímulo e resposta visual.
- 2026-11-26 (1ª passada no app inteiro): Tailwind 4 usa a propriedade CSS `translate`, que **soma** com o `transform` do Motion; dá para deixar o relevo/afundar no CSS (`active:translate-y-[4px]`, sombra) e escala/hover no Motion sem conflito.
- 2026-11-26: botão `disabled` não responde a nada e quebra a regra dura. Para "ainda não pode" (fase trancada, figurinha que falta) mantenha tocável e responda com balanço + fala gentil.
- 2026-11-26: valores com `delay` no `transition` atrasam também as animações seguintes; para entrada em cascata use variants com `staggerChildren` ou transição por propriedade.
- 2026-11-26: placar compara com o último valor visto (memória do módulo) para contar só a diferença ao voltar do jogo e não pular na hidratação.
- 2026-11-26: antes de navegar a partir de um toque (nó do mapa), espere ~160 ms para o squash aparecer.
- 2026-11-26: parallax + entrada no mesmo elemento brigam pelo `y`; separe em duas camadas (pai = parallax com useSpring, filho = entrada). Cenário de fundo fica `fixed z-0` e o conteúdo `relative z-10`.
- 2026-11-26: explorador andando = `ui/Explorador` (quadros pietro-andando-1..4 a 125 ms; reduzir movimento = quadro 2 parado; `feliz` ao chegar). Trilhinha do jogo, cartão de nível, loading e mapa usam o mesmo sprite e a mesma curva de pulo y [0,-10,0,-6,0] em 0,9 s.
- 2026-11-26: `pathLength` do Motion não combina com `vectorEffect="non-scaling-stroke"` (o traço sai picotado). Use espessura em unidades do SVG e um quadro com a mesma proporção do viewBox.
- 2026-11-26: sprite em elemento absoluto perto da borda direita encolhe (shrink-to-fit + `max-width:100%` do img). Use `w-max` no wrapper e `max-w-none` no img.
- 2026-11-26: o dono achou o loading da trilha complexo demais. Loading = UMA ilustração (rosto do explorador do perfil) balançando de leve + anel fino (progresso real enche; sem progresso, um arco gira devagar). Menos é mais em telas de espera.
