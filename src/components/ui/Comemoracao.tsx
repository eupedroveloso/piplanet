"use client";

import { motion, useReducedMotion } from "motion/react";
import { Arte } from "./Arte";

/**
 * Brilhos que se abrem em roda, uma vez só, a partir do centro do elemento pai
 * (o pai precisa ser `relative`). Celebração de acerto: suave, sem piscar, 900 ms.
 * Com "reduzir movimento" ligado, não aparece.
 */
export function Comemoracao({ quantidade = 8, raio = 120 }: { quantidade?: number; raio?: number }) {
  const reduzir = useReducedMotion();
  if (reduzir) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {Array.from({ length: quantidade }, (_, i) => {
        const ang = (i / quantidade) * Math.PI * 2 - Math.PI / 2;
        const d = raio * (i % 2 ? 0.8 : 1);
        return (
          <motion.span
            key={i}
            className="col-start-1 row-start-1"
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: Math.cos(ang) * d,
              y: Math.sin(ang) * d,
              scale: [0, 1, 0.6],
              opacity: [0, 1, 0],
              rotate: i % 2 ? 40 : -40,
            }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.05 }}
          >
            <Arte nome={i % 2 ? "ui/estrela" : "ui/brilho"} className="size-7" />
          </motion.span>
        );
      })}
    </span>
  );
}
