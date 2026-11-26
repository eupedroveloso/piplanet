"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ANIMAIS, arteDoAnimal, type Animal } from "@/content/animais";
import { TERRITORIOS } from "@/content/jornada";
import { avaliarCarta, progressStore, useProgress } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { falarSobre } from "@/lib/falar-bicho";
import { Arte, Botao, BotaoLink, BotaoRedondo, BotaoRedondoLink, BotaoSom, Mascote, MOLA_ENTRADA, MOLA_TOQUE, Painel, fonteQueCabeEm } from "@/components/ui";

/**
 * CARTAS (flashcards com repetição espaçada)
 * Frente: a palavra (em sílabas). Ele tenta ler; se precisar, toca no alto-falante para ouvir.
 * Toque na carta: ela vira e mostra o bicho, fala o nome e uma curiosidade.
 * Depois ele escolhe: ⭐ "li sozinho" (a carta volta mais tarde) ou 🔁 "treinar de novo" (volta logo).
 * Baralho = bichos que ele já conquistou (ou os da primeira fase, para começar).
 */

const POR_SESSAO = 8;

function montarBaralho(coletados: string[], cartas: Record<string, { caixa: number; proxima: number }>): Animal[] {
  let ids = coletados.length >= 4 ? coletados : ANIMAIS.filter((a) => a.territorio === TERRITORIOS[0].id).map((a) => a.id);
  const agora = Date.now();
  ids = ids.filter((id) => (cartas[id]?.proxima ?? 0) <= agora);
  return ids
    .map((id) => ANIMAIS.find((a) => a.id === id)!)
    .filter(Boolean)
    .sort((a, b) => (cartas[a.id]?.caixa ?? 1) - (cartas[b.id]?.caixa ?? 1))
    .slice(0, POR_SESSAO);
}

export function Cartas() {
  const { animaisColetados } = useProgress();
  const [fila, setFila] = useState<Animal[] | null>(null);
  const [virada, setVirada] = useState(false);
  const [ouviu, setOuviu] = useState(false);
  const [lidas, setLidas] = useState(0);
  const [total, setTotal] = useState(0);

  function comecar() {
    const b = montarBaralho(animaisColetados, progressStore.read().cartas);
    setFila(b);
    setTotal(b.length);
    setLidas(0);
    setVirada(false);
    setOuviu(false);
    speak(b.length ? "Tente ler a palavra. Depois toque na carta para virar!" : "Você já revisou todas as cartas de hoje! Volte amanhã.");
  }

  const carta = fila?.[0];

  function virar() {
    if (!carta || virada) return;
    setVirada(true);
    falarSobre(carta);
  }

  function avaliar(leuSozinho: boolean) {
    if (!carta || !fila) return;
    avaliarCarta(carta.id, leuSozinho && !ouviu);
    speak(leuSozinho ? "Muito bem!" : "Vamos treinar de novo!");
    const resto = fila.slice(1);
    // "treinar de novo": a carta volta no fim desta sessão
    setFila(leuSozinho ? resto : [...resto, carta]);
    if (leuSozinho) setLidas((l) => l + 1);
    setVirada(false);
    setOuviu(false);
  }

  const topo = (
    <div className="flex items-center gap-3">
      <BotaoRedondoLink href="/" aria-label="Voltar ao mapa">
        <Arte nome="ui/voltar" className="size-7" />
      </BotaoRedondoLink>
      <div className="flex flex-1 justify-center">
        <span className="flex items-center gap-2 text-xl font-extrabold text-roxo uppercase">
          <Arte nome="ui/cartas" className="size-7" /> Cartas {fila && total > 0 && `· ${lidas}/${total}`}
        </span>
      </div>
      <BotaoSom />
    </div>
  );

  if (!fila || (!carta && total === 0)) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        {topo}
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <Mascote fala={fila ? "Você já revisou todas as cartas de hoje! Volte amanhã." : "Vamos treinar com as cartas dos bichos?"} tamanho="lg" />
          {!fila && (
            <Botao cor="amarelo" tamanho="lg" onClick={comecar} aria-label="Começar" icone={<Arte nome="ui/cartas" className="size-8" />}>
              ▶
            </Botao>
          )}
        </div>
      </div>
    );
  }

  if (!carta) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        {topo}
        <div className="flex flex-1 items-center justify-center">
          <Painel className="flex w-full max-w-lg flex-col items-center gap-5 p-8 text-center">
            <Arte nome="ui/festa" className="size-16" />
            <button type="button" onClick={() => speak(`Você leu ${lidas} cartas sozinho!`)} className="flex items-center gap-2 text-3xl font-extrabold text-roxo">
              <Arte nome="ui/estrela" className="size-9" /> {lidas}
            </button>
            <BotaoLink href="/" cor="verde" tamanho="lg" aria-label="Voltar ao mapa" icone={<Arte nome="ui/mapa" className="size-8" />}>
              ▶
            </BotaoLink>
          </Painel>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {topo}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={carta.id + fila.length}
            initial={{ opacity: 0, y: 30, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -60, rotate: -8 }}
            transition={MOLA_ENTRADA}
            className="[perspective:1200px]"
          >
            <motion.button
              type="button"
              onClick={virar}
              animate={{ rotateY: virada ? 180 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              whileHover={{ y: virada ? 0 : -4 }}
              whileTap={{ scale: 0.97 }}
              aria-label={virada ? carta.nome : "Virar a carta"}
              className="relative h-80 w-64 [transform-style:preserve-3d] sm:h-96 sm:w-72"
            >
              {/* Frente: a palavra */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-branco shadow-[0_10px_0_var(--color-linha)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
                <span
                  style={{ fontSize: fonteQueCabeEm(224, carta.silabas.join("").length, carta.silabas.length - 1, 3.75) }}
                  className="font-leitura font-bold text-roxo uppercase"
                >
                  {carta.silabas.join("·")}
                </span>
                <Arte nome="ui/cartas" className="size-10 opacity-30" />
              </div>
              {/* Verso: o bicho */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-amarelo-claro p-4 shadow-[0_10px_0_var(--color-amarelo)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <Arte src={arteDoAnimal(carta)} className="size-40 sm:size-48" />
                <span style={{ fontSize: fonteQueCabeEm(224, carta.nome.length, 0, 2.25) }} className="font-leitura font-bold text-roxo uppercase">
                  {carta.nome}
                </span>
              </div>
            </motion.button>
          </motion.div>
        </AnimatePresence>

        {!virada ? (
          <BotaoRedondo
            aria-label="Ouvir a palavra"
            onClick={() => {
              setOuviu(true);
              speak(carta.silabas.join(" ") + ". " + carta.nome);
            }}
            className="size-16"
          >
            <Arte nome="ui/som-ligado" className="size-9" />
          </BotaoRedondo>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={MOLA_TOQUE} className="flex gap-4">
            <Botao cor="verde" tamanho="lg" aria-label="Li sozinho" onClick={() => avaliar(true)} icone={<Arte nome="ui/estrela" className="size-9" />}>
              👍
            </Botao>
            <Botao cor="branco" tamanho="lg" aria-label="Treinar de novo" onClick={() => avaliar(false)}>
              🔁
            </Botao>
          </motion.div>
        )}
      </div>
    </div>
  );
}
