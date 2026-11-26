"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Arte } from "./Arte";
import { Explorador } from "./Explorador";
import { MOLA_ENTRADA } from "./movimento";

/** Quanto tempo o Pietro leva para andar de uma parada até a próxima. */
const ANDAR_S = 0.9;

/**
 * TRILHINHA DE PROGRESSO DA FASE (substitui as bolinhas no topo do jogo)
 * Uma trilha com uma parada por bicho e a bandeira no fim. O Pietro explorador anda até a
 * próxima parada a cada bicho resolvido; no último, chega na bandeira e pula de alegria.
 * Previsível: sempre o mesmo caminho, da esquerda para a direita. Com "reduzir movimento",
 * ele só aparece na nova posição.
 */
export function TrilhaProgresso({ total, feitas }: { total: number; feitas: number }) {
  const reduzir = useReducedMotion();
  const pos = Math.min(total, Math.max(0, feitas));
  const anterior = useRef(pos);
  const [andando, setAndando] = useState(false);
  const chegou = pos >= total && total > 0;

  // anda só quando avança (voltar ao começo, ao jogar de novo, é instantâneo)
  useEffect(() => {
    if (pos > anterior.current && !reduzir) {
      setAndando(true);
      const t = setTimeout(() => setAndando(false), ANDAR_S * 1000);
      anterior.current = pos;
      return () => clearTimeout(t);
    }
    anterior.current = pos;
  }, [pos, reduzir]);

  // posição em % ao longo da trilha (0 = início, total = bandeira)
  const pct = (k: number) => (total ? (k / total) * 100 : 0);

  return (
    <div
      className="relative h-12 w-[min(17rem,100%)]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={pos}
      aria-label={`${pos} de ${total} bichos`}
    >
      {/* trilha: tracejado de fundo + parte já andada */}
      <div className="absolute inset-x-3 bottom-2 h-1.5 rounded-full bg-[repeating-linear-gradient(90deg,var(--color-branco)_0_8px,transparent_8px_14px)] opacity-90" />
      <motion.div
        className="absolute bottom-2 left-3 h-1.5 rounded-full bg-verde"
        initial={false}
        animate={{ width: `calc((100% - 1.5rem) * ${pct(pos) / 100})` }}
        transition={reduzir ? { duration: 0 } : { duration: ANDAR_S, ease: "easeInOut" }}
      />

      {/* paradas (uma por bicho); a última é a bandeira */}
      {Array.from({ length: total }, (_, i) => {
        const k = i + 1;
        const feita = k <= pos;
        const ehBandeira = k === total;
        return (
          <div key={k} className="absolute bottom-0.5 -translate-x-1/2" style={{ left: `calc(0.75rem + (100% - 1.5rem) * ${pct(k) / 100})` }}>
            {ehBandeira ? (
              <motion.span
                className="block origin-bottom"
                animate={chegou && !reduzir ? { rotate: [0, -10, 8, 0], scale: [1, 1.2, 1] } : { rotate: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: ANDAR_S }}
              >
                <Arte nome="ui/bandeira" className="mb-1 size-7" />
              </motion.span>
            ) : (
              <motion.span
                className={`mb-[3px] block size-3.5 rounded-full border-2 border-branco ${feita ? "bg-verde" : "bg-branco/70"}`}
                animate={{ scale: feita ? [1, 1.5, 1] : 1 }}
                transition={{ duration: 0.4, delay: feita && !reduzir ? ANDAR_S * 0.9 : 0 }}
              />
            )}
          </div>
        );
      })}

      {/* o explorador */}
      <motion.div
        className="absolute bottom-2 -translate-x-1/2"
        initial={false}
        animate={{ left: `calc(0.75rem + (100% - 1.5rem) * ${pct(pos) / 100})` }}
        transition={reduzir ? { duration: 0 } : { duration: ANDAR_S, ease: "easeInOut" }}
      >
        <motion.div
          animate={chegou && !andando && !reduzir ? { y: [0, -10, 0, -6, 0] } : { y: 0 }}
          transition={chegou ? { duration: 0.9, ease: "easeOut" } : MOLA_ENTRADA}
        >
          <Explorador andando={andando} feliz={chegou && !andando} className="size-10" />
        </motion.div>
      </motion.div>
    </div>
  );
}
