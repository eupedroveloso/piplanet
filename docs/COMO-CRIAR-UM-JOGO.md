# Como criar um jogo novo

Os jogos aparecem como **fases** dentro dos territórios da ilha.

1. **Crie o componente** em `src/games/<slug>/<NomeDoJogo>.tsx` (`"use client"`), recebendo `{ territorio, faseIdx }`, como o `MontaOBicho`.
2. **Registre o tipo** em `JogoId` (`src/content/jornada.ts`).
3. **Ligue na rota** `src/app/jogar/[territorio]/[fase]/page.tsx` (o `switch` pelo `jogo` da fase).
4. **Coloque fases** com esse jogo nos territórios em `TERRITORIOS`. O mapa da ilha se redesenha sozinho.

## Peças prontas

| O que | Onde |
|---|---|
| Animais (sílabas, território, curiosidade, ilustração) | `src/content/animais.ts` |
| Territórios, fases, desbloqueio | `src/content/jornada.ts` |
| Voz | `speak()` em `src/lib/speech.ts` |
| Pontos, estrelas, figurinhas, concluir fase | `src/lib/progress.ts` |
| Componentes visuais | `@/components/ui` (ver docs/DESIGN-SYSTEM.md) |

## Regras de todo jogo

- Seguir `docs/METODOLOGIA.md`: sem punição, erro com balanço e som (sem revelar a resposta), rodadas curtas com fim claro.
- Ao terminar: `concluirFase(chave, estrelas, pontos)` e `ganharPatinhas()`. Cada bicho lido: `coletarAnimal(id)`.
- Embaralhar só dentro de eventos (ex.: botão "Começar"), nunca durante a renderização.
