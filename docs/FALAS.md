# Mapa de falas (voz do jogo)

> **Consulte este arquivo antes de criar ou mexer em qualquer fala.** O público ainda não lê:
> tudo que a criança precisa entender é falado. Nenhuma fala pode sair na voz do sistema (robótica).
> Voz: **sempre OpenRouter**, voz neural nativa pt-BR **Caio** (`microsoft/mai-voice-2.1`, voz `pt-BR-Caio:MAI-Voice-2.1`), configurada em `src/content/voz-config.json`. Nunca Magnific. Nunca voz em inglês ("to" virava "two").

## Como a voz funciona

1. O app chama `speak(texto)` (`src/lib/speech.ts`). As falas entram numa **fila**: cada uma espera a anterior
   terminar e toca inteira, na ordem. Só uma interrupção manual corta a fila (`stopSpeaking()`): trocar de tela
   (`VozRota`), passar para o próximo bicho, sair do jogo.
2. `speak` toca `/api/voz?t=<texto>` (`src/app/api/voz/route.ts`):
   - se a frase já existe no banco (tabela `VozCache`), devolve o MP3 na hora, **sem custo**;
   - senão gera **uma vez** e guarda, **sempre pelo OpenRouter** (chave `OPENROUTER_API_KEY`), endpoint
     `/api/v1/audio/speech`, modelo e voz de `src/content/voz-config.json` (hoje **Caio**, MAI-Voice 2.1, pt-BR,
     escolhida pelo dono pela melhor pronúncia em português; custo não é critério).
   - **Controle de qualidade ao gerar:** o modelo ouvinte `google/gemini-2.5-flash-lite` OUVE o áudio e transcreve;
     se não bater com o texto, gera de novo; se continuar errado, marca `suspeita` para revisão.
3. **Nunca** usar modelos de conversa (`openai/gpt-audio*`) para voz: eles inventam palavras e trocam sons
   ("facenda", "EL sobremesa de balé"). Nunca usar o Magnific.
4. Sílabas soltas são faladas com a vogal final aberta (`falaDaSilaba`: "to" → "tó"); letras pelo nome
   (`falaDaLetra`: "l" → "éle", "v" → "vê"). Sons curtos tocam na velocidade natural (não esticar).
5. A voz do sistema (Web Speech) só toca se a voz natural **falhar de verdade**. Som bloqueado antes do primeiro
   toque espera e toca no primeiro toque. Um tocador só para o app inteiro (iPad/iPhone).
6. Falas com gênero usam o perfil (`genero` em `content/perfis.ts`): "Explorador/Exploradora", "sozinho/sozinha".

## Controle de qualidade

- **Aprovação humana:** página `/vozes` (só a conta Pais). Uma fala de cada vez: ouvir, aprovar (A), refazer (R),
  ruim (X); mapa com check por tipo. A lista vem de `src/content/falas-lista.json` (gerada pelo `scripts/gerar-vozes.mts`).

- `npx tsx scripts/gerar-vozes.mts --conferir`: ouve TODAS as falas guardadas; as erradas são refeitas.
- `POST /api/vozes { texto | chave, acao: "conferir" | "refazer" | "aprovar" | "ruim" }` (só conta Pais).
- Status no banco: `conferida` (ouvida e certa), `suspeita` (não bateu), `aprovada`/`ruim` (revisão humana),
  `pendente` (não deu para ouvir).

## Regras

- **Toda fala nova precisa estar pré-gerada**, para a criança nunca esperar nem ouvir a voz do sistema:
  - texto fixo (`speak("...")`, `fala="..."`, `aria-label="..."`, `<Mascote fala="...">`) é encontrado
    sozinho pelo gerador;
  - texto montado na hora (com `${...}`) precisa das variações em `scripts/gerar-vozes.mts`
    (seção "Falas montadas na hora").
- Depois de criar falas: com o servidor rodando, `npx tsx scripts/gerar-vozes.mts`. Ele gera o que faltar
  (as que existem não custam nada) e atualiza a tabela abaixo.
- Botões: `BotaoRedondo`, `Botao` e `BotaoLink` falam o `aria-label` sozinhos (ou a prop `fala`).
  `fala={false}` só quando o próprio `onClick` já fala.
- Sem voz de propósito: teclado da senha dos Pais e a continha "Só para adultos" em Ajustes.
- Trocar a voz ou o modelo muda a chave do cache: rode o gerador de novo para gerar tudo com a voz nova.

## Pontos de fala no código

<!-- MAPA:INICIO -->
_Gerado por `scripts/gerar-vozes.mts` em 26/11/2026, 18:52:16. 98 pontos de fala, 1383 falas únicas._

| Onde | Tipo | O que fala |
|---|---|---|
| `src/app/ajustes/Ajustes.tsx:27` | speak | Oi! É assim que eu falo. |
| `src/app/ajustes/Ajustes.tsx:33` | speak | Oba! Agora eu falo com você. |
| `src/app/ajustes/Ajustes.tsx:40` | speak | Ajustes |
| `src/app/ajustes/Ajustes.tsx:53` | speak | Velocidade da voz |
| `src/app/ajustes/Ajustes.tsx:58` | aria-label (botão fala o rótulo) | Mais devagar |
| `src/app/ajustes/Ajustes.tsx:61` | aria-label (botão fala o rótulo) | Velocidade |
| `src/app/ajustes/Ajustes.tsx:77` | aria-label (botão fala o rótulo) | Mais rápido |
| `src/app/entrar/Entrar.tsx:29` | speak | Quem vai jogar? Toque no seu explorador. |
| `src/app/entrar/Entrar.tsx:48` | speak | `Oi, ${p.nome}!`) (montado na hora) |
| `src/app/entrar/Entrar.tsx:54` | speak | Ops! Toque de novo no seu explorador. |
| `src/app/entrar/Entrar.tsx:59` | speak | Senha errada. Tente de novo. |
| `src/app/entrar/Entrar.tsx:68` | speak | `${p.nome}. Digite a senha.`) (montado na hora) |
| `src/app/entrar/Entrar.tsx:95` | aria-label (botão fala o rótulo) | Quem vai jogar? |
| `src/app/entrar/Entrar.tsx:96` | speak | Quem vai jogar? Toque no seu explorador. |
| `src/app/entrar/Entrar.tsx:211` | aria-label (botão fala o rótulo) | Voltar |
| `src/app/entrar/Entrar.tsx:212` | fala | Voltar |
| `src/app/error.tsx:11` | speak | Ops! Toque no botão para tentar de novo. |
| `src/app/error.tsx:18` | aria-label (botão fala o rótulo) | Tentar de novo |
| `src/components/jornada/Album.tsx:46` | speak | `${tt.nome}. Você tem ${n} de ${bs.length} figurinhas.`) (montado na hora) |
| `src/components/jornada/Album.tsx:65` | speak | Essa figurinha ainda vai chegar. Continue jogando! |
| `src/components/jornada/Album.tsx:183` | aria-label (botão fala o rótulo) | Território anterior |
| `src/components/jornada/Album.tsx:196` | aria-label (botão fala o rótulo) | Próximo território |
| `src/components/jornada/FichaBicho.tsx:77` | speak | animal.nome) (montado na hora) |
| `src/components/jornada/FichaBicho.tsx:94` | speak | animal.nome) (montado na hora) |
| `src/components/jornada/FichaBicho.tsx:94` | aria-label (botão fala o rótulo) | Ouvir o nome |
| `src/components/jornada/FichaBicho.tsx:98` | aria-label (botão fala o rótulo) | Ouvir outra curiosidade |
| `src/components/jornada/FichaBicho.tsx:123` | aria-label (botão fala o rótulo) | Fechar |
| `src/components/mundo/caminhada.ts:115` | speak | Oba! Caminho novo! |
| `src/components/mundo/Cena.tsx:300` | speak | `${b.nome}. Ainda trancado.`) (montado na hora) |
| `src/components/mundo/MapaMundo.tsx:186` | speak | Vamos continuar! |
| `src/components/mundo/MapaMundo.tsx:202` | aria-label (botão fala o rótulo) | Ver o planeta |
| `src/components/mundo/MapaMundo.tsx:222` | aria-label (botão fala o rótulo) | Onde estou |
| `src/components/mundo/MapaMundo.tsx:240` | aria-label (botão fala o rótulo) | Continuar daqui |
| `src/components/mundo/Planeta.tsx:100` | speak | livre ? p.nome : `${p.nome}. Ainda trancado. Termine o país anterior  (montado na hora) |
| `src/components/mundo/ProtecaoCena.tsx:74` | speak | Vamos tentar de novo! |
| `src/components/mundo/ProtecaoCena.tsx:85` | aria-label (botão fala o rótulo) | Tentar de novo |
| `src/components/mundo/Rotulos.tsx:198` | speak | liberada ? t.nome : `${t.nome}. Ainda trancado. Termine as fases de a (montado na hora) |
| `src/components/mundo/Rotulos.tsx:257` | speak | livre ? info.fala : `${info.fala} Ainda trancado.`) (montado na hora) |
| `src/components/mundo/Rotulos.tsx:326` | speak | Essa fase ainda está trancada. |
| `src/components/mundo/Rotulos.tsx:329` | speak | JOGOS[f.jogo].nome) (montado na hora) |
| `src/components/ui/Botao.tsx:76` | speak | texto) (montado na hora) |
| `src/components/ui/Botao.tsx:104` | speak | texto) (montado na hora) |
| `src/components/ui/BotaoRedondo.tsx:44` | speak | fala ?? props["aria-label"]) (montado na hora) |
| `src/components/ui/BotaoRedondo.tsx:66` | speak | fala ?? props["aria-label"]) (montado na hora) |
| `src/components/ui/BotaoSom.tsx:21` | speak | Oba! Agora eu falo com você. |
| `src/components/ui/Cabecalho.tsx:34` | speak | `Oi, ${perfil.nome}! Toque nos bichos do mapa para jogar.`) (montado na hora) |
| `src/components/ui/Cabecalho.tsx:70` | speak | info.fala) (montado na hora) |
| `src/components/ui/Contador.tsx:68` | speak | `Você tem ${valor}${total !== undefined ? ` de ${total}` : ""} ${rotu (montado na hora) |
| `src/components/ui/Mascote.tsx:30` | speak | fala) (montado na hora) |
| `src/components/ui/NavInferior.tsx:45` | aria-label (botão fala o rótulo) | Navegação |
| `src/components/ui/NavInferior.tsx:56` | speak | it.fala) (montado na hora) |
| `src/games/cartas/Cartas.tsx:58` | speak | Tente ler a palavra. Depois toque na carta para virar! · Você já revisou todas as cartas de hoje! Volte amanhã. |
| `src/games/cartas/Cartas.tsx:73` | speak | Muito bem! · Vamos treinar de novo! |
| `src/games/cartas/Cartas.tsx:85` | aria-label (botão fala o rótulo) | Voltar ao mapa |
| `src/games/cartas/Cartas.tsx:102` | fala | Você já revisou todas as cartas de hoje! Volte amanhã. · Vamos treinar com as cartas dos bichos? |
| `src/games/cartas/Cartas.tsx:104` | aria-label (botão fala o rótulo) | Começar |
| `src/games/cartas/Cartas.tsx:120` | speak | sozinho · sozinha |
| `src/games/cartas/Cartas.tsx:123` | aria-label (botão fala o rótulo) | Voltar ao mapa |
| `src/games/cartas/Cartas.tsx:151` | aria-label (botão fala o rótulo) | Ouvir a palavra |
| `src/games/cartas/Cartas.tsx:154` | speak | carta.silabas.map(falaDaSilaba).join(", ") + ". " + carta.nome) (montado na hora) |
| `src/games/cartas/Cartas.tsx:165` | aria-label (botão fala o rótulo) | Treinar de novo |
| `src/games/comum/JogoFase.tsx:109` | speak | info.instrucao) (montado na hora) |
| `src/games/comum/JogoFase.tsx:151` | speak | estrela · estrelas |
| `src/games/comum/JogoFase.tsx:152` | speak | `Você subiu de nível! ${infoNivel(novoNivel, genero).fala}`) (montado na hora) |
| `src/games/comum/JogoFase.tsx:158` | aria-label (botão fala o rótulo) | Voltar ao mapa |
| `src/games/comum/JogoFase.tsx:191` | speak | info.instrucao) (montado na hora) |
| `src/games/comum/JogoFase.tsx:233` | speak | a.nome) (montado na hora) |
| `src/games/comum/JogoFase.tsx:315` | speak | a.nome) (montado na hora) |
| `src/games/comum/JogoFase.tsx:340` | fala | Próxima fase! · Voltar para o mapa |
| `src/games/comum/JogoFase.tsx:410` | fala | Próximo bicho! |
| `src/games/comum/JogoFase.tsx:471` | speak | `Você subiu de nível! ${info.fala}`) (montado na hora) |
| `src/games/comum/JogoFase.tsx:561` | speak | Que bicho é esse? |
| `src/games/le-e-acha/LeEAcha.tsx:79` | speak | falaDaSilaba(s)) (montado na hora) |
| `src/games/le-e-acha/LeEAcha.tsx:93` | speak | `Esse é ${a.nome}.`) (montado na hora) |
| `src/games/monta-o-bicho/MontaOBicho.tsx:72` | speak | palavras.join(" ")) (montado na hora) |
| `src/games/monta-o-bicho/MontaOBicho.tsx:88` | speak | letras · silabas |
| `src/games/monta-o-bicho/MontaOBicho.tsx:100` | speak | letras · silabas |
| `src/games/monta-o-bicho/MontaOBicho.tsx:106` | speak | falaDaSilaba(animal.silabas[g])) (montado na hora) |
| `src/games/monta-o-bicho/MontaOBicho.tsx:114` | speak | palavras.join(" ")) (montado na hora) |
| `src/games/monta-o-bicho/MontaOBicho.tsx:131` | aria-label (botão fala o rótulo) | Ouvir a frase |
| `src/games/nivelamento/Nivelamento.tsx:79` | speak | Vamos ver como está sua leitura! Não tem certo nem errado.  |
| `src/games/nivelamento/Nivelamento.tsx:89` | speak | Obrigado! · Muito bem! · Vamos para a próxima! |
| `src/games/nivelamento/Nivelamento.tsx:105` | speak | `Prontinho! ${NIVEIS[final - 1].fala}`) (montado na hora) |
| `src/games/nivelamento/Nivelamento.tsx:116` | speak | instrucao(p)) (montado na hora) |
| `src/games/nivelamento/Nivelamento.tsx:122` | aria-label (botão fala o rótulo) | Voltar ao mapa |
| `src/games/nivelamento/Nivelamento.tsx:148` | fala | Vamos ver como está sua leitura? Não tem certo nem errado! |
| `src/games/nivelamento/Nivelamento.tsx:166` | speak | NIVEIS[resultado - 1].fala) (montado na hora) |
| `src/games/nivelamento/Nivelamento.tsx:171` | aria-label (botão fala o rótulo) | Voltar ao mapa |
| `src/games/nivelamento/Nivelamento.tsx:174` | aria-label (botão fala o rótulo) | Fazer de novo |
| `src/games/nivelamento/Nivelamento.tsx:198` | speak | instrucao(p)) (montado na hora) |
| `src/games/nivelamento/Nivelamento.tsx:198` | aria-label (botão fala o rótulo) | Ouvir a instrução de novo |
| `src/games/nivelamento/Nivelamento.tsx:231` | aria-label (botão fala o rótulo) | Opção de bicho |
| `src/games/nivelamento/Nivelamento.tsx:260` | speak | nv.fala) (montado na hora) |
| `src/lib/speech.ts:49` | speak | u) (montado na hora) |
| `src/lib/speech.ts:107` | speak | p.text, { rate: p.rate }) (montado na hora) |
| `src/lib/speech.ts:189` | speak | text: string, opts: { rate?: number } = {}) (montado na hora) |
| `src/lib/speech.ts:235` | speak | f) (montado na hora) |
| `src/lib/speech.ts:235` | speak | f.texto, { rate: f.rate }) (montado na hora) |
<!-- MAPA:FIM -->
