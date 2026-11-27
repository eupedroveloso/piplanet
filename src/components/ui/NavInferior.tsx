"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useLayoutEffect, useState } from "react";
import { usePerfil } from "@/lib/perfil";
import { speak } from "@/lib/speech";
import { Arte } from "./Arte";
import { MOLA_ENTRADA, MOLA_TOQUE } from "./movimento";

/** Só para a conta Pais: o painel de acompanhamento, que é a tela inicial deles. */
const PAINEL = { href: "/painel", rotulo: "Painel", icone: "ui/nivel", fala: "Aprendizado do Pietro" };

const AJUSTES = { href: "/ajustes", rotulo: "Ajustes", icone: "ui/ajustes", fala: "Ajustes" };

/** Espelhos somente leitura da criança escolhida (conta Pais). */
const ESPELHOS = [
  { href: "/painel/jornada", rotulo: "Jornada", icone: "ui/mapa", fala: "Jornada da criança" },
  { href: "/painel/cartas", rotulo: "Cartas", icone: "ui/cartas", fala: "Cartas da criança" },
  { href: "/painel/album", rotulo: "Álbum", icone: "ui/album", fala: "Álbum da criança" },
];

const ITENS = [
  { href: "/", rotulo: "Jornada", icone: "ui/mapa", fala: "Mapa" },
  { href: "/estudo", rotulo: "Estudo", icone: "ui/sol", fala: "Estudo do dia" },
  { href: "/cartas", rotulo: "Cartas", icone: "ui/cartas", fala: "Cartas dos bichos" },
  { href: "/album", rotulo: "Álbum", icone: "ui/album", fala: "Álbum de bichos" },
];

const MotionLink = motion.create(Link);

/**
 * Navegação do rodapé: pílula de vidro flutuante, centralizada e só do tamanho do conteúdo.
 * Respeita a safe-area do tablet. A pílula do item ativo desliza até o item tocado.
 */
export function NavInferior() {
  const path = usePathname();
  const perfil = usePerfil();
  // Adultos: só ESPELHOS da criança (não jogam): Painel, Jornada, Cartas e Álbum dela, e Ajustes no fim.
  const itens = perfil.temSenha ? [PAINEL, ...ESPELHOS, AJUSTES] : [...ITENS, AJUSTES];
  const ativoRota = itens.find((it) => (it.href === "/" || it.href === "/painel" ? path === it.href : path.startsWith(it.href)))?.href;
  const [tocado, setTocado] = useState<{ href: string; em: string } | null>(null);
  // A página fica guardada (escondida) pelo <Activity> do Next ao navegar: ao esconder, esquece o item tocado,
  // senão na volta a pílula ficaria na aba de onde se saiu
  useLayoutEffect(() => () => setTocado(null), []);
  // O item tocado só vale enquanto a rota não muda
  const ativo = tocado && tocado.em === path ? tocado.href : ativoRota;

  return (
    <motion.nav
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOLA_ENTRADA}
      aria-label="Navegação"
      className="sticky bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-20 mx-auto mt-auto mb-[max(env(safe-area-inset-bottom),0.75rem)] flex w-fit max-w-[calc(100vw-1rem)] gap-0.5 rounded-[1.75rem] p-1 vidro sm:gap-1 sm:rounded-full"
    >
      {itens.map((it) => {
        const eh = ativo === it.href;
        return (
          <MotionLink
            key={it.href}
            href={it.href}
            onClick={() => {
              setTocado({ href: it.href, em: path });
              speak(it.fala);
            }}
            aria-current={ativoRota === it.href ? "page" : undefined}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.94 }}
            transition={MOLA_TOQUE}
            className="relative flex h-14 min-w-16 flex-col items-center justify-center gap-0.5 rounded-3xl px-2.5 font-bold sm:h-12 sm:min-w-0 sm:flex-row sm:gap-2 sm:rounded-full sm:pr-4 sm:pl-3"
          >
            {eh && (
              <motion.span
                layoutId="nav-ativo"
                transition={MOLA_ENTRADA}
                className="absolute inset-0 rounded-3xl bg-roxo shadow-[0_2px_0_var(--color-roxo-escuro)] sm:rounded-full"
              />
            )}
            <motion.span
              animate={eh ? { scale: 1.06, rotate: -4 } : { scale: 1, rotate: 0 }}
              transition={MOLA_ENTRADA}
              className={`relative grid place-items-center transition-[filter,opacity] duration-300 ${
                eh ? "" : "opacity-70 grayscale-[0.6]"
              }`}
            >
              <Arte nome={it.icone} className="size-7 sm:size-8" />
            </motion.span>
            <span
              className={`relative text-xs leading-none transition-colors duration-300 sm:text-base ${
                eh ? "text-branco" : "text-tinta-suave"
              }`}
            >
              {it.rotulo}
            </span>
          </MotionLink>
        );
      })}
    </motion.nav>
  );
}
