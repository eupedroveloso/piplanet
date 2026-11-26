"use client";

import { animate, motion, useAnimate, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { speak } from "@/lib/speech";
import { Arte } from "./Arte";

/** Último valor que a criança viu em cada placar, para contar só a diferença ao voltar de um jogo. */
const vistos = new Map<string, number>();
const nada = () => () => {};
/** false durante a hidratação (o store ainda devolve o valor inicial do servidor). */
const useHidratado = () => useSyncExternalStore(nada, () => true, () => false);

/** Número que sobe contando até o valor (começa em `de`). */
export function NumeroAnimado({ valor, de }: { valor: number; de?: number }) {
  const mv = useMotionValue(de ?? valor);
  const texto = useTransform(mv, (v) => Math.round(v).toString());
  const pronto = useHidratado();

  useEffect(() => {
    if (!pronto) return;
    const dist = Math.abs(valor - mv.get());
    const c = animate(mv, valor, { duration: Math.min(1.2, 0.3 + dist / 150), ease: "easeOut" });
    return () => c.stop();
  }, [valor, pronto, mv]);

  return <motion.span className="tabular-nums">{texto}</motion.span>;
}

/**
 * Pílula de placar: ícone + número (estrelas, patinhas, figurinhas).
 * O número sobe contando e o ícone dá um pulinho quando o valor aumenta.
 */
export function Contador({
  icone,
  valor,
  total,
  rotulo,
}: {
  icone: string;
  valor: number;
  /** Mostra "valor/total" (ex.: figurinhas). */
  total?: number;
  rotulo: string;
}) {
  const [escopo, animar] = useAnimate<HTMLSpanElement>();
  const [inicio] = useState(() => vistos.get(rotulo));
  const pronto = useHidratado();

  useEffect(() => {
    if (!pronto) return;
    const antes = vistos.get(rotulo);
    if (antes !== undefined && valor > antes) {
      animar(escopo.current, { y: [0, -8, 0], scale: [1, 1.2, 1], rotate: [0, -8, 0] }, { duration: 0.6, ease: "easeOut" });
    }
    vistos.set(rotulo, valor);
  }, [valor, pronto, rotulo, animar, escopo]);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => {
        animar(escopo.current, { y: [0, -6, 0], scale: [1, 1.15, 1] }, { duration: 0.45, ease: "easeOut" });
        speak(`Você tem ${valor}${total !== undefined ? ` de ${total}` : ""} ${rotulo}.`);
      }}
      className="relative inline-flex h-8 items-center gap-1 rounded-full bg-roxo-claro pr-3 pl-1 text-base font-bold text-tinta before:absolute before:-inset-2 before:content-['']"
      aria-label={`${valor}${total !== undefined ? ` de ${total}` : ""} ${rotulo}`}
    >
      <span ref={escopo} className="inline-grid">
        <Arte nome={icone} className="size-6" />
      </span>
      <span aria-hidden>
        <NumeroAnimado valor={valor} de={inicio ?? 0} />
        {total !== undefined && `/${total}`}
      </span>
    </motion.button>
  );
}
