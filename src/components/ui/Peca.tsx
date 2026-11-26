"use client";

import { motion } from "motion/react";
import { BALANCO, MOLA_ENTRADA, MOLA_TOQUE } from "./movimento";

/**
 * PEÇA: bloco de sílaba, como um brinquedo de madeira.
 * CASINHA: o encaixe vazio onde a peça entra.
 * Sempre em fonte de leitura (Andika), caixa alta.
 *
 * Encaixe animado: dê o mesmo `layoutId` à peça e à casinha que ela preenche;
 * a peça "voa" até a casinha e a casinha dá um pop com uma onda suave.
 */

/** Mobile primeiro: cabe em 360 px; cresce no tablet (sm). Toque sempre ≥ 56 px. */
const BLOCOS = {
  md: "grid h-20 min-w-20 place-items-center rounded-md px-3 font-leitura text-4xl font-bold uppercase sm:h-28 sm:min-w-28 sm:px-4 sm:text-6xl sm:[@media(max-height:820px)]:h-22 sm:[@media(max-height:820px)]:min-w-22 sm:[@media(max-height:820px)]:text-5xl",
  sm: "grid h-16 min-w-14 place-items-center rounded-md px-2 font-leitura text-3xl font-bold uppercase sm:h-24 sm:min-w-20 sm:px-3 sm:text-5xl sm:[@media(max-height:820px)]:h-18 sm:[@media(max-height:820px)]:min-w-16 sm:[@media(max-height:820px)]:text-4xl",
  /** Palavras de 5+ sílabas (RI·NO·CE·RON·TE): cabem numa linha em 360 px. */
  xs: "grid h-16 min-w-12 place-items-center rounded-md px-1.5 font-leitura text-[1.6rem] font-bold uppercase sm:h-24 sm:min-w-20 sm:px-3 sm:text-5xl sm:[@media(max-height:820px)]:h-18 sm:[@media(max-height:820px)]:min-w-16 sm:[@media(max-height:820px)]:text-4xl",
};

export type TamanhoBloco = keyof typeof BLOCOS;

export function Peca({
  texto,
  onToque,
  estado = "normal",
  usada = false,
  tamanho = "md",
  layoutId,
  indice = 0,
}: {
  texto: string;
  onToque?: () => void;
  estado?: "normal" | "balancar" | "dica";
  usada?: boolean;
  tamanho?: TamanhoBloco;
  layoutId?: string;
  /** Posição na fila: as peças entram em cascata. */
  indice?: number;
}) {
  const BLOCO = BLOCOS[tamanho];
  // Usada: guarda o lugar (sem layoutId) para a fila não pular; a peça "viva" já voou para a casinha.
  if (usada) {
    return (
      <div aria-hidden className={`${BLOCO} invisible`}>
        {texto}
      </div>
    );
  }
  const atraso = indice * 0.06;
  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      onClick={onToque}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        ...(estado === "balancar" ? BALANCO : estado === "dica" ? { y: [0, -8, 0] } : { x: 0, y: 0 }),
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        opacity: { duration: 0.25, delay: atraso },
        scale: { ...MOLA_TOQUE, delay: 0 },
        x: { duration: 0.4 },
        y: estado === "dica" ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 },
        layout: MOLA_ENTRADA,
      }}
      className={`${BLOCO} bg-branco text-roxo transition-[box-shadow,translate] duration-100 active:translate-y-[4px] ${
        estado === "dica"
          ? "shadow-[0_6px_0_var(--color-amarelo-escuro)] ring-4 ring-amarelo"
          : "shadow-[0_6px_0_var(--color-linha)] hover:shadow-[0_8px_0_var(--color-linha)] active:shadow-[0_2px_0_var(--color-linha)]"
      }`}
    >
      {texto}
    </motion.button>
  );
}

export function Casinha({
  texto,
  estado,
  tamanho = "md",
  layoutId,
}: {
  texto?: string;
  estado: "vazia" | "proxima" | "cheia";
  tamanho?: TamanhoBloco;
  /** O mesmo da peça que entrou aqui (encaixe animado). */
  layoutId?: string;
}) {
  const BLOCO = BLOCOS[tamanho];
  if (estado === "cheia") {
    return (
      <motion.div
        layoutId={layoutId}
        initial={layoutId ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ ...MOLA_ENTRADA, layout: MOLA_ENTRADA }}
        className={`${BLOCO} relative bg-verde text-branco shadow-[0_6px_0_var(--color-verde-escuro)]`}
      >
        {texto}
        {/* Onda suave de "encaixou!" */}
        <motion.span
          aria-hidden
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 1.35 }}
          transition={{ duration: 0.6, delay: layoutId ? 0.3 : 0.1, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 rounded-md ring-4 ring-verde"
        />
      </motion.div>
    );
  }
  return (
    <motion.div
      animate={{ scale: estado === "proxima" ? 1.04 : 1 }}
      transition={MOLA_ENTRADA}
      className={`${BLOCO} border-4 border-dashed transition-colors duration-300 ${
        estado === "proxima" ? "border-amarelo bg-amarelo-claro" : "border-branco/80 bg-branco/40"
      }`}
    />
  );
}
