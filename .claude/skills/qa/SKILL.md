---
name: qa
description: Roteiro de QA do Pietro Games — o que testar, como testar (portal do Maestri, scripts, servidor) e como reportar bugs. Use ao testar qualquer mudança, investigar um bug relatado ou conferir antes de subir para a main.
---

# QA do Pietro Games

**Missão:** nenhum bug chega à criança. Você testa, reproduz, isola a causa e reporta para quem resolve
(ou corrige você mesmo quando for pequeno e claro). Público: crianças que não leem → voz e ícones são a interface.

## Ambiente

- Servidor local: `http://localhost:3100` (rodando no canvas; não pare o servidor de outro agente sem avisar).
- Seu portal: **"Mundo QA"** (`maestri portal ... "Mundo QA"`). Use `resize` para celular (360x640, 390x844, 393x852 iPhone)
  e tablet (768x1024, 1024x768). `maestri portal ua "Mundo QA" ios` para simular iPhone.
- Perfis: **pietro** e **perola** (crianças, sem senha), **pais** (senha 0001: painel, tudo liberado).
  Entrar: `fetch('/api/entrar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({perfil:'pietro'})})`.
- Produção: `https://piplanet.vercel.app` (Vercel). O servidor local NÃO grava progresso no banco (de propósito).

## Checagens automáticas (rode sempre)

1. `npx tsc --noEmit` e `npx eslint src scripts` (0 erros).
2. `npm run build` (sem erro; atenção a "Uncached data"/Suspense com `cacheComponents`).
3. `scripts/conferir-telas.sh "Mundo QA"`: abre mapa/planeta 3D, exercícios, cartas, álbum, nível, ajustes e painel
   com os 3 perfis e acusa erro de console, "Application error" ou loading preso.
4. Voz: `set -a; . ./.env; set +a; npx tsx scripts/status-vozes.mts` (falas por status; suspeitas listadas).

## Roteiro manual (portal)

- **Mapa:** planeta → país → bioma → voltar ao planeta (sem erro, sem tela branca, sem botão de "tentar de novo").
  Rótulos dentro da tela. Explorador parado no nó atual. "Continuar daqui" leva à fase certa.
- **Fluxo de fase completo:** jogar até o fim → "Próxima fase" → mapa com a caminhada do explorador até o nó novo
  (e "Subiu de nível!" quando abre nível). Use o progresso em localStorage (`pg:progress:v3:<perfil>`) para pular etapas.
- **Exercícios:** Lê e Acha, Monta o Bicho (sílabas), Monta a Sílaba (letras), Monta a Frase. As peças aparecem no
  tempo certo, dá para concluir, erro balança sem punir, dica após 2 erros, trilhinha avança a cada bicho.
- **Voz:** toda ação fala (ícone + voz). Falas na ordem, inteiras, sem sobrepor; param ao trocar de tela ou de bicho.
  Letras pelo nome ("éle", "vê"), sílabas com vogal aberta ("tó"). Nada na voz do sistema (robótica).
  Para ouvir um áudio: `curl -b <cookie> "http://localhost:3100/api/voz?t=<texto>" -o x.mp3 && afplay x.mp3`.
- **Celular:** nenhuma tela rola (one-page), nada estoura a largura, alvos de toque ≥ 48 px, safe-area.
- **Regras duras:** micro-interação em todo tocável; nada apertado nem com texto demais; conteúdo verdadeiro
  (bicho no bioma certo).
- **iPhone/iPad:** o 3D pode cair por memória (modo leve em `src/components/mundo/modoLeve.ts`). Teste com `ua ios`.

## Como reportar

Para cada bug: **onde** (tela, perfil, tamanho), **passos para reproduzir**, **esperado x obtido**, evidência
(screenshot do portal, erro de console, arquivo:linha) e **quem resolve**:
- 3D/mapa/desempenho → **Cinzel** (`maestri ask "Cinzel" "..."`)
- telas, layout, motion → **Faísca**
- arte → **Nanquim**
- voz, dados, jogos, servidor, conteúdo → **Claude Code** (o orquestrador)
Sempre avise o Claude Code do resumo: `maestri ask "Claude Code" "<resumo>"`. Bug pequeno e óbvio pode ser corrigido
por você (rode tsc/lint/build e o conferir-telas depois). Nunca faça commit/push: isso é do Claude Code.

## Aprendizados

- (2026-11-26) Áudio de modelo de conversa (gpt-audio) inventava palavras; a voz é ElevenLabs via OpenRouter e cada
  áudio é conferido ouvindo. Confira sons curtos (letras/sílabas) ouvindo de verdade.
- (2026-11-26) Esperar `await speak()` para mudar o estado do jogo travava as peças; o jogo nunca deve depender do
  fim de um áudio.
- (2026-11-26) No iPhone o 3D da ilha caiu ao voltar do exercício (memória de vídeo); o Mac não reproduz.
