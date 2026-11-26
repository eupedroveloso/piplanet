# Mapa de falas (voz do jogo)

> **Consulte este arquivo antes de criar ou mexer em qualquer fala.** O público ainda não lê:
> tudo que a criança precisa entender é falado. Nenhuma fala pode sair na voz do sistema (robótica).

## Como a voz funciona

1. O app chama `speak(texto)` (`src/lib/speech.ts`).
2. `speak` toca `/api/voz?t=<texto>` (`src/app/api/voz/route.ts`):
   - se a frase já existe no banco (tabela `VozCache`), devolve o MP3 na hora, **sem custo**;
   - senão gera **uma vez** e guarda: **ElevenLabs** (`eleven_flash_v2_5`, o modelo mais barato) quando
     `ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID` existem; senão OpenRouter (`openai/gpt-audio-mini`, voz `verse`).
3. A voz do sistema (Web Speech) só toca se a voz natural **falhar de verdade** (sem internet, sem crédito).
   Se o navegador bloquear o som (antes do primeiro toque), a fala espera e toca no primeiro toque.
4. Um tocador só para o app inteiro (necessário no iPad/iPhone). Velocidade da voz (Ajustes) = `playbackRate`.

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
_Gerado por `scripts/gerar-vozes.mts` em 26/11/2026, 16:50:08. 103 pontos de fala, 1314 falas únicas._

| Onde | Tipo | O que fala |
|---|---|---|
| `src/app/ajustes/Ajustes.tsx:27` | speak | Oi! É assim que eu falo. |
| `src/app/ajustes/Ajustes.tsx:33` | speak | Oba! Agora eu falo com você. |
| `src/app/ajustes/Ajustes.tsx:40` | speak | Ajustes |
| `src/app/ajustes/Ajustes.tsx:53` | speak | Velocidade da voz |
| `src/app/ajustes/Ajustes.tsx:58` | aria-label (botão fala o rótulo) | Mais devagar |
| `src/app/ajustes/Ajustes.tsx:61` | aria-label (botão fala o rótulo) | Velocidade |
| `src/app/ajustes/Ajustes.tsx:77` | aria-label (botão fala o rótulo) | Mais rápido |
| `src/app/entrar/Entrar.tsx:22` | speak | Quem vai jogar? Toque no seu bicho. |
| `src/app/entrar/Entrar.tsx:39` | speak | `Oi, ${p.nome}!`) (montado na hora) |
| `src/app/entrar/Entrar.tsx:45` | speak | Ops! Toque de novo no seu bicho. |
| `src/app/entrar/Entrar.tsx:50` | speak | Senha errada. Tente de novo. |
| `src/app/entrar/Entrar.tsx:59` | speak | `${p.nome}. Digite a senha.`) (montado na hora) |
| `src/app/entrar/Entrar.tsx:75` | aria-label (botão fala o rótulo) | Quem vai jogar? |
| `src/app/entrar/Entrar.tsx:76` | speak | Quem vai jogar? Toque no seu bicho. |
| `src/app/entrar/Entrar.tsx:149` | fala | Voltar |
| `src/app/entrar/Entrar.tsx:149` | aria-label (botão fala o rótulo) | Voltar |
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
| `src/components/mundo/caminhada.ts:113` | speak | Oba! Caminho novo! |
| `src/components/mundo/Cena.tsx:219` | speak | `${b.nome}. Ainda trancado.`) (montado na hora) |
| `src/components/mundo/MapaMundo.tsx:186` | speak | Vamos continuar! |
| `src/components/mundo/MapaMundo.tsx:202` | aria-label (botão fala o rótulo) | Ver o planeta |
| `src/components/mundo/MapaMundo.tsx:222` | aria-label (botão fala o rótulo) | Onde estou |
| `src/components/mundo/MapaMundo.tsx:240` | aria-label (botão fala o rótulo) | Continuar daqui |
| `src/components/mundo/Planeta.tsx:95` | speak | livre ? p.nome : `${p.nome}. Ainda trancado. Termine o país anterior  (montado na hora) |
| `src/components/mundo/ProtecaoCena.tsx:58` | speak | Vamos tentar de novo! |
| `src/components/mundo/ProtecaoCena.tsx:69` | aria-label (botão fala o rótulo) | Tentar de novo |
| `src/components/mundo/Rotulos.tsx:196` | speak | liberada ? t.nome : `${t.nome}. Ainda trancado. Termine as fases de a (montado na hora) |
| `src/components/mundo/Rotulos.tsx:254` | speak | livre ? info.fala : `${info.fala} Ainda trancado.`) (montado na hora) |
| `src/components/mundo/Rotulos.tsx:323` | speak | Essa fase ainda está trancada. |
| `src/components/mundo/Rotulos.tsx:326` | speak | JOGOS[f.jogo].nome) (montado na hora) |
| `src/components/ui/Botao.tsx:76` | speak | texto) (montado na hora) |
| `src/components/ui/Botao.tsx:104` | speak | texto) (montado na hora) |
| `src/components/ui/BotaoRedondo.tsx:44` | speak | aria-label |
| `src/components/ui/BotaoRedondo.tsx:66` | speak | aria-label |
| `src/components/ui/BotaoSom.tsx:21` | speak | Oba! Agora eu falo com você. |
| `src/components/ui/Cabecalho.tsx:34` | speak | `Oi, ${perfil.nome}! Toque nos bichos do mapa para jogar.`) (montado na hora) |
| `src/components/ui/Cabecalho.tsx:69` | speak | info.fala) (montado na hora) |
| `src/components/ui/Contador.tsx:68` | speak | `Você tem ${valor}${total !== undefined ? ` de ${total}` : ""} ${rotu (montado na hora) |
| `src/components/ui/Mascote.tsx:30` | speak | fala) (montado na hora) |
| `src/components/ui/NavInferior.tsx:45` | aria-label (botão fala o rótulo) | Navegação |
| `src/components/ui/NavInferior.tsx:56` | speak | it.fala) (montado na hora) |
| `src/components/ui/TelaCarregando.tsx:18` | aria-label (botão fala o rótulo) | Carregando |
| `src/games/cartas/Cartas.tsx:54` | speak | Tente ler a palavra. Depois toque na carta para virar! · Você já revisou todas as cartas de hoje! Volte amanhã. |
| `src/games/cartas/Cartas.tsx:69` | speak | Muito bem! · Vamos treinar de novo! |
| `src/games/cartas/Cartas.tsx:81` | aria-label (botão fala o rótulo) | Voltar ao mapa |
| `src/games/cartas/Cartas.tsx:98` | fala | Você já revisou todas as cartas de hoje! Volte amanhã. · Vamos treinar com as cartas dos bichos? |
| `src/games/cartas/Cartas.tsx:100` | aria-label (botão fala o rótulo) | Começar |
| `src/games/cartas/Cartas.tsx:116` | speak | `Você leu ${lidas} cartas sozinho!`) (montado na hora) |
| `src/games/cartas/Cartas.tsx:119` | aria-label (botão fala o rótulo) | Voltar ao mapa |
| `src/games/cartas/Cartas.tsx:147` | aria-label (botão fala o rótulo) | Ouvir a palavra |
| `src/games/cartas/Cartas.tsx:150` | speak | carta.silabas.join(" ") + ". " + carta.nome) (montado na hora) |
| `src/games/cartas/Cartas.tsx:158` | aria-label (botão fala o rótulo) | Li sozinho |
| `src/games/cartas/Cartas.tsx:161` | aria-label (botão fala o rótulo) | Treinar de novo |
| `src/games/comum/JogoFase.tsx:98` | speak | info.instrucao) (montado na hora) |
| `src/games/comum/JogoFase.tsx:118` | speak | animal.nome) (montado na hora) |
| `src/games/comum/JogoFase.tsx:119` | speak | animal.curiosidade, { rate: 0.95 }) (montado na hora) |
| `src/games/comum/JogoFase.tsx:139` | speak | estrela · estrelas |
| `src/games/comum/JogoFase.tsx:140` | speak | `Você subiu de nível! ${infoNivel(novoNivel).fala}`) (montado na hora) |
| `src/games/comum/JogoFase.tsx:146` | aria-label (botão fala o rótulo) | Voltar ao mapa |
| `src/games/comum/JogoFase.tsx:179` | speak | info.instrucao) (montado na hora) |
| `src/games/comum/JogoFase.tsx:221` | speak | a.nome) (montado na hora) |
| `src/games/comum/JogoFase.tsx:303` | speak | a.nome) (montado na hora) |
| `src/games/comum/JogoFase.tsx:323` | fala | Próxima fase! · Voltar para o mapa |
| `src/games/comum/JogoFase.tsx:393` | fala | Próximo bicho! |
| `src/games/comum/JogoFase.tsx:445` | speak | `Você subiu de nível! ${info.fala}`) (montado na hora) |
| `src/games/comum/JogoFase.tsx:499` | speak | texto, { rate: 0.95 }) (montado na hora) |
| `src/games/comum/JogoFase.tsx:526` | speak | Que bicho é esse? |
| `src/games/le-e-acha/LeEAcha.tsx:78` | speak | s) (montado na hora) |
| `src/games/le-e-acha/LeEAcha.tsx:92` | speak | `Esse é ${a.nome}.`) (montado na hora) |
| `src/games/monta-o-bicho/MontaOBicho.tsx:71` | speak | palavras.join(" ")) (montado na hora) |
| `src/games/monta-o-bicho/MontaOBicho.tsx:87` | speak | tile.text) (montado na hora) |
| `src/games/monta-o-bicho/MontaOBicho.tsx:97` | speak | tile.text) (montado na hora) |
| `src/games/monta-o-bicho/MontaOBicho.tsx:103` | speak | animal.silabas[g]) (montado na hora) |
| `src/games/monta-o-bicho/MontaOBicho.tsx:108` | speak | palavras.join(" ")) (montado na hora) |
| `src/games/monta-o-bicho/MontaOBicho.tsx:125` | aria-label (botão fala o rótulo) | Ouvir a frase |
| `src/games/nivelamento/Nivelamento.tsx:78` | speak | Vamos ver como está sua leitura! Não tem certo nem errado.  |
| `src/games/nivelamento/Nivelamento.tsx:88` | speak | Obrigado! · Muito bem! · Vamos para a próxima! |
| `src/games/nivelamento/Nivelamento.tsx:104` | speak | `Prontinho! ${NIVEIS[final - 1].fala}`) (montado na hora) |
| `src/games/nivelamento/Nivelamento.tsx:115` | speak | instrucao(p)) (montado na hora) |
| `src/games/nivelamento/Nivelamento.tsx:121` | aria-label (botão fala o rótulo) | Voltar ao mapa |
| `src/games/nivelamento/Nivelamento.tsx:147` | fala | Vamos ver como está sua leitura? Não tem certo nem errado! |
| `src/games/nivelamento/Nivelamento.tsx:165` | speak | NIVEIS[resultado - 1].fala) (montado na hora) |
| `src/games/nivelamento/Nivelamento.tsx:170` | aria-label (botão fala o rótulo) | Voltar ao mapa |
| `src/games/nivelamento/Nivelamento.tsx:173` | aria-label (botão fala o rótulo) | Fazer de novo |
| `src/games/nivelamento/Nivelamento.tsx:197` | speak | instrucao(p)) (montado na hora) |
| `src/games/nivelamento/Nivelamento.tsx:197` | aria-label (botão fala o rótulo) | Ouvir a instrução de novo |
| `src/games/nivelamento/Nivelamento.tsx:230` | aria-label (botão fala o rótulo) | Opção de bicho |
| `src/games/nivelamento/Nivelamento.tsx:259` | speak | nv.fala) (montado na hora) |
| `src/lib/falar-bicho.ts:23` | speak | a.nome) (montado na hora) |
| `src/lib/falar-bicho.ts:24` | speak | todas[i], { rate: 0.95 }) (montado na hora) |
| `src/lib/speech.ts:49` | speak | u) (montado na hora) |
| `src/lib/speech.ts:107` | speak | p.text, { rate: p.rate }) (montado na hora) |
| `src/lib/speech.ts:175` | speak |  text: string, opts: { rate?: number } = {}, ) (montado na hora) |
<!-- MAPA:FIM -->
