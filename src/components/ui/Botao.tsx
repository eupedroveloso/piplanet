"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { speak } from "@/lib/speech";
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
  /** Grande no tablet; no celular encolhe para caber sem rolagem (continua ≥ 56 px). */
  lg: "h-14 px-6 text-xl gap-2 sm:h-18 sm:px-10 sm:text-2xl sm:gap-3",
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

type Base = {
  cor?: CorBotao;
  tamanho?: keyof typeof TAMANHOS;
  /** Ícone grande à esquerda: quem não sabe ler entende pelo ícone. */
  icone?: ReactNode;
  /** A Juju fala isto ao tocar (quem não sabe ler ouve o que o botão faz). */
  fala?: string;
  children: ReactNode;
};

export function Botao({
  cor,
  tamanho,
  icone,
  fala,
  children,
  className = "",
  onClick,
  ...props
}: Base & Omit<HTMLMotionProps<"button">, "children">) {
  return (
    <motion.button
      type="button"
      {...TOQUE_RELEVO}
      className={`${classesBotao(cor, tamanho)} ${className}`}
      onClick={(e) => {
        // quem não sabe ler ouve o que o botão faz: a fala explícita ou, se não houver, o rótulo
        const texto = fala ?? (props as { "aria-label"?: string })["aria-label"];
        if (texto) speak(texto);
        onClick?.(e);
      }}
      {...props}
    >
      {icone}
      {children}
    </motion.button>
  );
}

export function BotaoLink({
  cor,
  tamanho,
  icone,
  fala,
  children,
  className = "",
  onClick,
  ...props
}: Base & Omit<ComponentProps<typeof MotionLink>, "children">) {
  return (
    <MotionLink
      {...TOQUE_RELEVO}
      className={`${classesBotao(cor, tamanho)} ${className}`}
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
        // quem não sabe ler ouve o que o botão faz: a fala explícita ou, se não houver, o rótulo
        const texto = fala ?? (props as { "aria-label"?: string })["aria-label"];
        if (texto) speak(texto);
        onClick?.(e);
      }}
      {...props}
    >
      {icone}
      {children}
    </MotionLink>
  );
}
