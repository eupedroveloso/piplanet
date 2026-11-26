"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { speak } from "@/lib/speech";
import { MOLA_TOQUE } from "./movimento";

/** 48 px, vidro leve; o relevo fino afunda no toque. */
const BASE = `grid size-12 shrink-0 place-items-center rounded-full vidro
  transition-shadow duration-150
  active:shadow-[0_0_0_1px_rgb(61_53_81/0.08),0_1px_4px_rgb(20_16_48/0.18)]`;

const TOQUE = {
  whileHover: { y: -2, scale: 1.05 },
  whileTap: { y: 1, scale: 0.92 },
  transition: MOLA_TOQUE,
} as const;

const MotionLink = motion.create(Link);

type Fala = {
  /** O que a Juju fala ao tocar. Padrão: o próprio aria-label. `false` = calado. */
  fala?: string | false;
};

/**
 * Botão circular só com ícone (voltar, som, zoom). Sempre com aria-label,
 * que a Juju lê em voz alta ao tocar: quem não sabe ler ouve o que o botão faz.
 */
export function BotaoRedondo({
  children,
  className = "",
  fala,
  onClick,
  ...props
}: { children: ReactNode; "aria-label": string } & Fala & Omit<HTMLMotionProps<"button">, "children">) {
  return (
    <motion.button
      type="button"
      {...TOQUE}
      className={`${BASE} ${className}`}
      onClick={(e) => {
        if (fala !== false) speak(fala ?? props["aria-label"]);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function BotaoRedondoLink({
  children,
  className = "",
  fala,
  onClick,
  ...props
}: { children: ReactNode; "aria-label": string } & Fala & Omit<ComponentProps<typeof MotionLink>, "children">) {
  return (
    <MotionLink
      {...TOQUE}
      className={`${BASE} ${className}`}
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
        if (fala !== false) speak(fala ?? props["aria-label"]);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </MotionLink>
  );
}
