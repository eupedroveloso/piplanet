"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { MOLA_TOQUE } from "./movimento";

/**
 * Botão "fofinho" com relevo embaixo.
 * Hover: levanta e o relevo cresce. Toque: afunda e o relevo quase some.
 * Variantes de cor seguem os tokens da marca.
 */

const CORES = {
  roxo: "bg-roxo text-branco [--relevo:var(--color-roxo-escuro)]",
  amarelo: "bg-amarelo text-roxo [--relevo:var(--color-amarelo-escuro)]",
  verde: "bg-verde text-branco [--relevo:var(--color-verde-escuro)]",
  coral: "bg-coral text-branco [--relevo:var(--color-coral-escuro)]",
  branco: "bg-branco text-roxo [--relevo:var(--color-linha)]",
} as const;

const TAMANHOS = {
  md: "h-14 px-6 text-xl gap-2",
  lg: "h-18 px-10 text-2xl gap-3",
} as const;

export type CorBotao = keyof typeof CORES;

export function classesBotao(cor: CorBotao = "roxo", tamanho: keyof typeof TAMANHOS = "md") {
  return `inline-flex items-center justify-center rounded-full font-extrabold tracking-wide
    shadow-[0_6px_0_var(--relevo)] transition-shadow duration-150
    hover:shadow-[0_8px_0_var(--relevo)] active:shadow-[0_2px_0_var(--relevo)]
    disabled:opacity-50 disabled:pointer-events-none
    ${CORES[cor]} ${TAMANHOS[tamanho]}`;
}

/** Levantar no hover, afundar no toque (o relevo acompanha via CSS). */
export const TOQUE_RELEVO = {
  whileHover: { y: -2 },
  whileTap: { y: 4, scale: 0.98 },
  transition: MOLA_TOQUE,
} as const;

const MotionLink = motion.create(Link);

type Base = { cor?: CorBotao; tamanho?: keyof typeof TAMANHOS; icone?: ReactNode; children: ReactNode };

export function Botao({
  cor,
  tamanho,
  icone,
  children,
  className = "",
  ...props
}: Base & Omit<HTMLMotionProps<"button">, "children">) {
  return (
    <motion.button type="button" {...TOQUE_RELEVO} className={`${classesBotao(cor, tamanho)} ${className}`} {...props}>
      {icone}
      {children}
    </motion.button>
  );
}

export function BotaoLink({
  cor,
  tamanho,
  icone,
  children,
  className = "",
  ...props
}: Base & Omit<ComponentProps<typeof MotionLink>, "children">) {
  return (
    <MotionLink {...TOQUE_RELEVO} className={`${classesBotao(cor, tamanho)} ${className}`} {...props}>
      {icone}
      {children}
    </MotionLink>
  );
}
