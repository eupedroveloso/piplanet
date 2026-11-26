# Metodologia de alfabetização

Base pedagógica de todos os jogos da plataforma.

## 1. Método fônico (base de tudo)

Ensino explícito e sistemático da relação **letra ↔ som**. É o método com mais evidência científica para destravar a leitura, e é o que a Política Nacional de Alfabetização recomenda. Funciona especialmente bem com crianças autistas, porque segue regras claras e uma ordem previsível.

Progressão que os jogos seguem:

| Etapa | Habilidade | Exemplo | Jogo |
|---|---|---|---|
| 1 | Consciência fonológica: perceber sons, rimas, sílabas | "gato" tem 2 pedaços | futuro |
| 2 | Letras e sons: vogais, depois consoantes | **A** de abelha | Som da Letra (em breve) |
| 3 | Sílabas simples (consoante + vogal) | GA · TO | fases de dificuldade 1 |
| 4 | Palavras de 3 sílabas simples | CA · VA · LO | dificuldade 2 |
| 5 | Sílabas complexas (BR, GR, nasais, ão, lh) | ZE · BRA, O · VE · LHA | dificuldade 3 |

Cada nível de dificuldade vira **3 fases intercaladas**, sempre nesta ordem:

1. **Lê e Acha**: a palavra vem com as sílabas já montadas (GA · TO); ele lê e toca no bicho certo. Decodificação → significado.
2. **Monta o Bicho**: junta as sílabas na ordem para formar o nome. Síntese silábica.
3. **Monta a Sílaba**: forma cada sílaba com letras (G + A = GA), uma de cada vez. Letra → som → sílaba (o coração do método fônico).

Ler pronto primeiro dá segurança; montar depois consolida.
| 6 | Frases curtas | "O sapo pula." | futuro |
| 7 | Textos curtos de curiosidades | fichas de animais | futuro |

Ordem sugerida de consoantes: começar pelas que se pode "esticar" o som (**M, S, F, V, L**), depois **P, B, T, D, G, C**.

## 2. Hiperfoco como motor

Os animais não são enfeite, são a recompensa. Cada acerto entrega uma **curiosidade real**, que é o que ele mais gosta. Ele já sabe muito sobre espécies, então:

- Usar nomes que ele já conhece. Ler uma palavra conhecida dá a sensação de "eu sei ler".
- Curiosidades curtas, verdadeiras, lidas em voz alta.
- O **Álbum** guarda todos os bichos que ele já leu, como uma coleção.

## 3. Jornada e gamificação

A jornada é uma viagem pelo planeta: Brasil → Estados Unidos → Rússia → China → Austrália → África. Cada país tem biomas reais com os bichos que vivem lá de verdade. Em cada bioma as fases repetem a progressão de leitura com animais novos: a habilidade se consolida e a novidade (e a geografia) vem do hiperfoco.

- **Patinhas 🐾:** 10 por bicho lido, +5 se montou sem erro, +20 ao terminar a fase. Nunca diminuem.
- **Estrelas ⭐:** 1 a 3 por fase (até 1 erro = 3; até 4 = 2; mais = 1). Terminar sempre dá pelo menos 1. Vale o melhor resultado.
- **Figurinhas:** cada bicho lido entra no Álbum. Os que faltam aparecem em silhueta, o que dá vontade de completar a coleção.
- **Desbloqueio:** fases e territórios abrem em sequência. Territórios fechados ficam cobertos de nuvens (mistério, não castigo).
- **Medalha e troféu:** território completo ganha medalha na placa.

Nada de ranking, tempo, vidas ou perda de pontos.

## 4. Adaptações para autismo leve

- **Para quem ainda não lê:** toda instrução é falada pela Juju e todo botão tem ícone; o texto nunca é o único caminho. Só o exercício de leitura em si depende de ler, e mesmo nele tocar numa peça lê o que está escrito.

- **Sem punição.** Nada de vidas, tempo ou som de erro. A peça errada só balança e a sílaba é lida.
- **Aprendizagem sem erro (errorless):** depois de 2 tentativas erradas, a peça certa brilha. A dica aparece sozinha, sem ele pedir.
- **Previsibilidade:** mesmo layout em todas as telas, rodadas curtas (5 bichos), bolinhas de progresso mostrando quanto falta, fim claro.
- **Carga sensorial baixa:** cores calmas, animações suaves, botão de desligar a voz sempre visível. Respeita "reduzir movimento" do aparelho.
- **Alvos grandes:** botões grandes para o dedo, pensados para tablet.
- **Fonte Andika:** criada para alfabetização, com letras que não se confundem.
- **Letra de forma maiúscula** primeiro, como na maioria das escolas. Minúsculas podem virar opção depois.

## 5. Áudio

Hoje a voz é a do navegador (Web Speech API, grátis). Ela pode errar a pronúncia de sílabas soltas.

Melhoria futura, de alto impacto: **gravar os áudios** (sílabas, nomes, curiosidades) com uma voz conhecida dele, de alguém da família. Os arquivos ficam em `public/audio/` e o `speak()` passa a tocar o arquivo quando existir.

## 6. Como acompanhar

O progresso fica salvo no aparelho (localStorage). O banco (Prisma Postgres) já está conectado, com tabelas `Jogador` e `Progresso`, para sincronizar na nuvem. Futuro: uma área do responsável mostrando quais sílabas ele mais erra, para ajustar os próximos jogos.
