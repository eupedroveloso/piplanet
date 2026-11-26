"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/** Quadros do ciclo de caminhada (o Nanquim está desenhando). Enquanto não existirem, usa o pietro.svg com balanço. */
const QUADROS = [1, 2, 3, 4].map((n) => `/arte/mascote/pietro-andando-${n}.svg`);
const PARADO = "/arte/mascote/pietro.svg";
const FELIZ = "/arte/mascote/pietro-feliz.svg";

/** Descobre (uma vez por sessão) quais artes opcionais já existem. */
const cache = new Map<string, Promise<boolean>>();
function existe(src: string) {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((ok) => {
        const img = new Image();
        img.onload = () => ok(true);
        img.onerror = () => ok(false);
        img.src = src;
      }),
    );
  }
  return cache.get(src)!;
}

/**
 * O PIETRO EXPLORADOR (sprite).
 * - `andando`: troca os quadros de caminhada a 8 fps (ou balança de leve, se ainda não houver quadros).
 * - `feliz`: mostra o pietro-feliz (ou o parado, se ainda não existir).
 * - `virado`: olha para a esquerda.
 * Com "reduzir movimento", fica parado (quadro 2, sem ciclo nem balanço).
 */
export function Explorador({ andando = false, feliz = false, virado = false, className = "size-10" }: { andando?: boolean; feliz?: boolean; virado?: boolean; className?: string }) {
  const reduzir = useReducedMotion();
  const [temQuadros, setTemQuadros] = useState(false);
  const [temFeliz, setTemFeliz] = useState(false);
  const [quadro, setQuadro] = useState(0);

  useEffect(() => {
    let vivo = true;
    Promise.all(QUADROS.map(existe)).then((oks) => vivo && setTemQuadros(oks.every(Boolean)));
    existe(FELIZ).then((ok) => vivo && setTemFeliz(ok));
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!andando || !temQuadros || reduzir) return;
    const t = setInterval(() => setQuadro((q) => (q + 1) % QUADROS.length), 125);
    return () => clearInterval(t);
  }, [andando, temQuadros, reduzir]);

  // reduzir movimento: só o quadro 2 (passagem) parado, sem ciclo
  const src = feliz && temFeliz ? FELIZ : andando && temQuadros ? (reduzir ? QUADROS[1] : QUADROS[quadro]) : PARADO;
  const balancar = andando && !temQuadros && !reduzir;

  return (
    <motion.img
      src={src}
      alt=""
      draggable={false}
      animate={balancar ? { y: [0, -3, 0], rotate: [-4, 4, -4] } : { y: 0, rotate: 0 }}
      transition={balancar ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      className={`origin-bottom select-none ${virado ? "-scale-x-100" : ""} ${className}`}
    />
  );
}
