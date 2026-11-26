"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Explorador, MOLA_ENTRADA } from "@/components/ui";

/**
 * O EXPLORADOR NO MAPA (HTML sobre o 3D). O sprite é o mesmo dos jogos (ui/Explorador, do Faísca);
 * aqui fica só o que é do mapa: andar na ponta do caminho que se desenha, virar para o lado em que
 * anda e, ao chegar, o pulinho do centro do nó para o lado dele (onde fica parado).
 */

/** Andando sobre a trilha. Fica dentro do elemento-âncora (movido pelo useProjecao). `parado` = esperando começar. */
export function ExploradorAndando({ parado = false }: { parado?: boolean }) {
  const corpo = useRef<HTMLDivElement>(null);
  const [virado, setVirado] = useState(false);

  // Lado em que anda: compara a posição da âncora na tela entre quadros (estado só muda quando vira)
  useEffect(() => {
    let raf = 0;
    let antes: number | null = null;
    const laco = () => {
      const m = corpo.current?.closest<HTMLElement>("[data-ancora]")?.style.transform.match(/translate3d\(([-\d.]+)px/);
      if (m) {
        const x = Number(m[1]);
        if (antes !== null && Math.abs(x - antes) > 0.6) setVirado(x < antes);
        antes = x;
      }
      raf = requestAnimationFrame(laco);
    };
    laco();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.div
      ref={corpo}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={MOLA_ENTRADA}
      // pés na trilha: o centro da âncora fica embaixo do boneco
      className="-translate-y-[26px]"
    >
      <Explorador andando={!parado} virado={!parado && virado} className="size-14 max-w-none drop-shadow" />
    </motion.div>
  );
}

/**
 * Parado ao lado do nó atual (no lugar da mãozinha). `chegou` = o caminho acabou de chegar:
 * pulinho saindo do centro do nó (onde o andando parou) para o lado, com a mesma curva dos jogos
 * (y [0,-10,0,-6,0] em 0,9 s) e a pose feliz por um instante.
 */
export function ExploradorParado({ chegou }: { chegou: boolean }) {
  const reduzir = useReducedMotion();
  const pulo = chegou && !reduzir;
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute bottom-1 left-full -ml-3"
      initial={pulo ? { x: -46, y: -22, opacity: 1 } : { opacity: 0, scale: 0.7 }}
      animate={pulo ? { x: 0, y: [-22, -32, 0, -6, 0], opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={
        pulo
          ? { x: { duration: 0.4, ease: "easeInOut" }, y: { duration: 0.9, ease: "easeInOut", times: [0, 0.2, 0.45, 0.7, 1] } }
          : MOLA_ENTRADA
      }
      style={{ transformOrigin: "bottom center" }}
    >
      {/* respiração leve (parado, previsível) */}
      <motion.span
        className="block"
        animate={reduzir ? undefined : { scaleY: [1, 1.035, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "bottom center" }}
      >
        <Explorador feliz={chegou} className="size-14 max-w-none drop-shadow" />
      </motion.span>
    </motion.span>
  );
}
