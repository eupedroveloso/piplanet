"use client";

import { motion } from "motion/react";
import { Arte } from "./Arte";

/**
 * Tela de carregamento: a Juju voando com uma barrinha que enche.
 * Sem texto obrigatório (o público ainda não lê): a animação diz "espera um pouquinho".
 * `progresso` de 0 a 1; sem valor, a barra fica indo e voltando.
 */
export function TelaCarregando({ progresso, fundo = "claro" }: { progresso?: number; fundo?: "claro" | "escuro" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
      role="status"
      aria-label="Carregando"
      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6"
      style={{
        background:
          fundo === "escuro"
            ? "radial-gradient(ellipse at 50% 40%, #1f2160 0%, #0e0f33 55%, #05061a 100%)"
            : "linear-gradient(180deg, #a9c1ff 0%, #cdd8ff 45%, #f1e8ff 100%)",
      }}
    >
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [0, -4, 4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <Arte nome="mascote/pietro-lendo" className="size-28 drop-shadow-lg" />
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute -right-3 top-2"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4], x: [0, 14 + i * 6, 24 + i * 8], y: [0, -10 - i * 8, -18 - i * 10] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5 }}
          >
            <Arte nome="ui/estrela" className="size-5" />
          </motion.span>
        ))}
      </motion.div>
      <div className="h-4 w-56 overflow-hidden rounded-full bg-branco/70 shadow-suave">
        {progresso === undefined ? (
          <motion.div
            className="h-full w-1/3 rounded-full bg-amarelo"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <motion.div
            className="h-full rounded-full bg-amarelo"
            animate={{ width: `${Math.max(8, Math.min(100, progresso * 100))}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        )}
      </div>
    </motion.div>
  );
}
