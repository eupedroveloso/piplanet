"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { MOLA_TOQUE } from "./movimento";

const BASE = `grid size-14 shrink-0 place-items-center rounded-full bg-branco
  shadow-[0_5px_0_var(--color-linha)] transition-shadow duration-150
  hover:shadow-[0_7px_0_var(--color-linha)] active:shadow-[0_2px_0_var(--color-linha)]`;

const TOQUE = {
  whileHover: { y: -2, scale: 1.04 },
  whileTap: { y: 3, scale: 0.94 },
  transition: MOLA_TOQUE,
} as const;

const MotionLink = motion.create(Link);

/** Botão circular só com ícone (voltar, som, ouvir). Sempre com aria-label. */
export function BotaoRedondo({
  children,
  className = "",
  ...props
}: { children: ReactNode; "aria-label": string } & Omit<HTMLMotionProps<"button">, "children">) {
  return (
    <motion.button type="button" {...TOQUE} className={`${BASE} ${className}`} {...props}>
      {children}
    </motion.button>
  );
}

export function BotaoRedondoLink({
  children,
  className = "",
  ...props
}: { children: ReactNode; "aria-label": string } & Omit<ComponentProps<typeof MotionLink>, "children">) {
  return (
    <MotionLink {...TOQUE} className={`${BASE} ${className}`} {...props}>
      {children}
    </MotionLink>
  );
}
