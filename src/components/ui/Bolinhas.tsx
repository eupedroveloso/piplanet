"use client";

import { motion } from "motion/react";
import { MOLA_ENTRADA } from "./movimento";

/** Progresso previsível da rodada: feitas (verde), atual (amarela, mais larga), faltando (branca). */
export function Bolinhas({ total, feitas, atualConcluida = false }: { total: number; feitas: number; atualConcluida?: boolean }) {
  return (
    <div className="flex gap-2" aria-label={`${feitas + (atualConcluida ? 1 : 0)} de ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const feita = i < feitas || (i === feitas && atualConcluida);
        const atual = i === feitas && !atualConcluida;
        return (
          <motion.span
            key={i}
            layout
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: feita && i === feitas ? [1, 1.4, 1] : 1 }}
            transition={{ ...MOLA_ENTRADA, scale: { duration: 0.5 }, delay: i * 0.05 }}
            className={`h-4 rounded-full transition-colors duration-300 ${
              feita ? "w-4 bg-verde" : atual ? "w-8 bg-amarelo" : "w-4 bg-branco"
            }`}
          />
        );
      })}
    </div>
  );
}
