"use client";

import { motion } from "motion/react";
import { Arte } from "./Arte";
import { MOLA_ENTRADA } from "./movimento";

/** Três estrelas; as conquistadas aparecem coloridas. Entram em cascata, uma de cada vez. */
export function Estrelas({
  valor,
  tamanho = "md",
  atraso = 0,
}: {
  valor: number;
  tamanho?: "sm" | "md" | "lg";
  /** Segundos antes da primeira estrela entrar (para esperar o painel abrir). */
  atraso?: number;
}) {
  const cls = { sm: "size-5", md: "size-8", lg: "size-16" }[tamanho];
  const passo = tamanho === "lg" ? 0.25 : 0.1;
  return (
    <span className="inline-flex items-end gap-0.5" aria-label={`${valor} de 3 estrelas`}>
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ ...MOLA_ENTRADA, delay: atraso + (i - 1) * passo }}
          className={`inline-grid ${i === 2 ? "-translate-y-1" : ""}`}
        >
          <Arte nome="ui/estrela" silhueta={i > valor} className={cls} />
        </motion.span>
      ))}
    </span>
  );
}
