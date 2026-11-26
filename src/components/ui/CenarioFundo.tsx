"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import type { TipoBioma } from "@/content/paises";

/** Deslocamento máximo do parallax, em px (leve e previsível). */
const PARALLAX = 10;

/**
 * CENÁRIO DE FUNDO das telas de exercício (public/arte/cenarios/<tipo>.svg, do Nanquim).
 * Fica fixo atrás do conteúdo, sem receber toque. O centro do desenho é calmo e claro.
 * Entra com fade + leve subida/escala; acompanha o dedo/mouse com um parallax bem suave.
 * Com "reduzir movimento": só aparece, sem parallax.
 */
export function CenarioFundo({ tipo }: { tipo: TipoBioma }) {
  const reduzir = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(useTransform(px, (v) => v * -PARALLAX), { stiffness: 60, damping: 20 });
  const y = useSpring(useTransform(py, (v) => v * -PARALLAX * 0.6), { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (reduzir) return;
    const mover = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", mover, { passive: true });
    window.addEventListener("pointerdown", mover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerdown", mover);
    };
  }, [reduzir, px, py]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Camada do parallax (segue o dedo) */}
      <motion.div style={reduzir ? undefined : { x, y }} className="absolute -inset-4">
        {/* Camada da entrada (fade + subida + escala) */}
        <motion.img
          key={tipo}
          src={`/arte/cenarios/${tipo}.svg`}
          alt=""
          draggable={false}
          initial={{ opacity: 0, y: 24, scale: 1.06 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="size-full object-cover object-bottom select-none"
        />
      </motion.div>
    </div>
  );
}
