"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { existeArte as existe, usePersonagem, type Personagem } from "./personagem";

/** Arte do personagem (mascote/<personagem>...). Quadros de caminhada 1..4, parado e feliz. */
const quadros = (p: Personagem) => [1, 2, 3, 4].map((n) => `/arte/mascote/${p}-andando-${n}.svg`);
const parado = (p: Personagem) => `/arte/mascote/${p}.svg`;
const felizSrc = (p: Personagem) => `/arte/mascote/${p}-feliz.svg`;

/**
 * O EXPLORADOR / A EXPLORADORA do perfil atual (sprite): Pietro ou Pérola; a conta Pais usa o Pietro.
 * - `andando`: troca os quadros de caminhada a 8 fps (ou balança de leve, se ainda não houver quadros).
 * - `feliz`: mostra o pietro-feliz (ou o parado, se ainda não existir).
 * - `virado`: olha para a esquerda.
 * Com "reduzir movimento", fica parado (quadro 2, sem ciclo nem balanço).
 */
export function Explorador({ andando = false, feliz = false, virado = false, className = "size-10", personagem }: { andando?: boolean; feliz?: boolean; virado?: boolean; className?: string; personagem?: Personagem }) {
  const reduzir = useReducedMotion();
  const p = usePersonagem(personagem);
  const QUADROS = quadros(p);
  const PARADO = parado(p);
  const FELIZ = felizSrc(p);
  const [temQuadros, setTemQuadros] = useState(false);
  const [temFeliz, setTemFeliz] = useState(false);
  const [quadro, setQuadro] = useState(0);

  useEffect(() => {
    let vivo = true;
    Promise.all(quadros(p).map(existe)).then((oks) => vivo && setTemQuadros(oks.every(Boolean)));
    existe(felizSrc(p)).then((ok) => vivo && setTemFeliz(ok));
    return () => {
      vivo = false;
    };
  }, [p]);

  useEffect(() => {
    if (!andando || !temQuadros || reduzir) return;
    const t = setInterval(() => setQuadro((q) => (q + 1) % 4), 125);
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
      className={`max-w-none origin-bottom select-none ${virado ? "-scale-x-100" : ""} ${className}`}
    />
  );
}
