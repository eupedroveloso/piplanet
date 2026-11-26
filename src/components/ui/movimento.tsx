"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Molas e durações padrão (ver .claude/skills/motion/SKILL.md).
 * Use sempre estas constantes em vez de números soltos.
 */
export const MOLA_TOQUE = { type: "spring", stiffness: 400, damping: 22 } as const;
export const MOLA_ENTRADA = { type: "spring", stiffness: 220, damping: 16 } as const;
/** Balanço gentil de erro (400 ms). */
export const BALANCO = { x: [0, -10, 10, -6, 6, 0] };

/**
 * Liga o "reduzir movimento" do aparelho em todas as animações do Motion:
 * com ele ligado, deslizes e escalas viram só fade.
 */
export function ProvedorMovimento({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={MOLA_TOQUE}>
      {children}
    </MotionConfig>
  );
}
