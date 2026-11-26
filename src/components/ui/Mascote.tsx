"use client";

import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useState } from "react";
import { NOME_MASCOTE } from "@/config";
import { speak } from "@/lib/speech";
import { Arte } from "./Arte";
import { MOLA_ENTRADA, MOLA_TOQUE } from "./movimento";

/**
 * Mascote (o Pietro explorador) com balão de fala. Tocar nele ou no balão lê a frase em voz alta.
 * Ele dá um pulinho ao ser tocada e o balão brilha enquanto a frase é lida.
 */
export function Mascote({
  fala,
  tamanho = "md",
  lado = "direita",
}: {
  fala?: string;
  tamanho?: "sm" | "md" | "lg";
  lado?: "direita" | "esquerda";
}) {
  const cls = { sm: "size-14", md: "size-20", lg: "size-32" }[tamanho];
  const [escopo, animar] = useAnimate<HTMLButtonElement>();
  const [falando, setFalando] = useState(false);

  async function ler() {
    if (!fala) return;
    setFalando(true);
    await speak(fala);
    setFalando(false);
  }

  function tocarCoruja() {
    animar(escopo.current, { y: [0, -14, 0], rotate: [0, -6, 6, 0], scaleY: [1, 0.92, 1.04, 1] }, { duration: 0.6, ease: "easeOut" });
    ler();
  }

  return (
    <div className={`flex items-end gap-2 ${lado === "esquerda" ? "flex-row-reverse" : ""}`}>
      <motion.button
        ref={escopo}
        type="button"
        onClick={tocarCoruja}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={MOLA_TOQUE}
        aria-label={fala ? `${NOME_MASCOTE}: ${fala}` : NOME_MASCOTE}
        className="shrink-0 origin-bottom"
      >
        <Arte nome="mascote/pietro" alt="" className={`${cls} animate-flutuar`} />
      </motion.button>
      <AnimatePresence mode="wait">
        {fala && (
          <motion.button
            key={fala}
            type="button"
            onClick={ler}
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={MOLA_ENTRADA}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className={`relative mb-4 rounded-lg bg-branco px-4 py-3 text-left text-lg font-semibold text-tinta shadow-suave ring-amarelo transition-[box-shadow] duration-300 ${
              lado === "direita" ? "origin-bottom-left rounded-bl-none" : "origin-bottom-right rounded-br-none"
            } ${falando ? "ring-4" : "ring-0"}`}
          >
            {fala}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
