"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { Arte } from "./Arte";
import { MOLA_ENTRADA, MOLA_TOQUE } from "./movimento";

const ITENS = [
  { href: "/", rotulo: "Jornada", icone: "ui/mapa" },
  { href: "/album", rotulo: "Álbum", icone: "ui/album" },
];

const MotionLink = motion.create(Link);

/**
 * Barra de navegação fixa no rodapé, como em app de celular.
 * A pílula do item ativo desliza até o item tocado antes da troca de tela.
 */
export function NavInferior() {
  const path = usePathname();
  const ativoRota = ITENS.find((it) => (it.href === "/" ? path === "/" : path.startsWith(it.href)))?.href;
  const [tocado, setTocado] = useState<{ href: string; em: string } | null>(null);
  // O item tocado só vale enquanto a rota não muda
  const ativo = tocado && tocado.em === path ? tocado.href : ativoRota;

  return (
    <motion.nav
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOLA_ENTRADA}
      className="sticky bottom-0 z-20 mx-auto mt-auto w-full max-w-3xl px-4 pb-4"
    >
      <div className="flex justify-around rounded-xl bg-branco px-4 py-2 shadow-suave">
        {ITENS.map((it) => {
          const eh = ativo === it.href;
          return (
            <MotionLink
              key={it.href}
              href={it.href}
              onClick={() => setTocado({ href: it.href, em: path })}
              aria-current={ativoRota === it.href ? "page" : undefined}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.92 }}
              transition={MOLA_TOQUE}
              className="relative flex flex-col items-center px-6 py-1 font-bold"
            >
              {eh && (
                <motion.span
                  layoutId="nav-ativo"
                  transition={MOLA_ENTRADA}
                  className="absolute inset-0 -z-0 rounded-lg bg-roxo-claro"
                />
              )}
              <motion.span
                animate={eh ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
                transition={MOLA_ENTRADA}
                className={`relative grid place-items-center transition-[filter,opacity] duration-300 ${
                  eh ? "" : "opacity-60 grayscale"
                }`}
              >
                <Arte nome={it.icone} className="size-9" />
              </motion.span>
              <span
                className={`relative text-base transition-colors duration-300 ${eh ? "text-roxo" : "text-tinta-suave"}`}
              >
                {it.rotulo}
              </span>
            </MotionLink>
          );
        })}
      </div>
    </motion.nav>
  );
}
