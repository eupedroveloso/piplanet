"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArteMascote } from "./personagem";

/**
 * TELA DE CARREGAMENTO (simples)
 * Uma ilustração só no centro: o rosto do explorador do perfil, balançando de leve, com um anel fino em volta.
 * - Com progresso real (0 a 1): o anel enche como uma barra circular.
 * - Sem progresso: um pedaço do anel gira devagar.
 * Sem texto e sem piscar. Leve no Android (um SVG e transforms). Com "reduzir movimento", fica parado.
 */
export function TelaCarregando({ progresso, fundo = "claro" }: { progresso?: number; fundo?: "claro" | "escuro" }) {
  const reduzir = useReducedMotion();
  const escuro = fundo === "escuro";
  const temProgresso = progresso !== undefined;
  const p = Math.max(0, Math.min(1, progresso ?? 0));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      role="status"
      aria-label={temProgresso ? `Carregando, ${Math.round(p * 100)}%` : "Carregando"}
      className="absolute inset-0 z-40 grid place-items-center"
      style={{
        background: escuro
          ? "radial-gradient(ellipse at 50% 40%, #1f2160 0%, #0e0f33 55%, #05061a 100%)"
          : "linear-gradient(180deg, #a9c1ff 0%, #cdd8ff 45%, #f1e8ff 100%)",
      }}
    >
      <div className="relative size-40">
        {/* anel: trilho fino + arco (enchendo com o progresso, ou girando devagar) */}
        <motion.div
          className="absolute inset-0"
          aria-hidden
          animate={!temProgresso && !reduzir ? { rotate: 360 } : { rotate: 0 }}
          transition={!temProgresso && !reduzir ? { duration: 2.4, repeat: Infinity, ease: "linear" } : { duration: 0 }}
        >
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r="46" fill="none" strokeWidth="3" className={escuro ? "stroke-branco/15" : "stroke-branco/70"} />
            <motion.circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="stroke-amarelo"
              initial={false}
              animate={{ pathLength: temProgresso ? Math.max(0.02, p) : 0.25 }}
              transition={{ duration: reduzir ? 0 : 0.5, ease: "easeOut" }}
            />
          </svg>
        </motion.div>

        {/* o rosto do explorador do perfil (a arte já tem o próprio círculo), balançando de leve */}
        <motion.div
          className="absolute inset-3 grid place-items-center"
          animate={reduzir ? { y: 0, rotate: 0 } : { y: [0, -5, 0], rotate: [-3, 3, -3] }}
          transition={reduzir ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArteMascote sufixo="-rosto" className="size-full drop-shadow-md" />
        </motion.div>
      </div>
    </motion.div>
  );
}
