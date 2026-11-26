"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { arteDoAnimal, type Animal } from "@/content/animais";
import { animaisDoTerritorio, TERRITORIOS } from "@/content/jornada";
import { paisPorId, TEMAS } from "@/content/paises";
import { useProgress } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { FichaBicho } from "./FichaBicho";
import { Arte, BALANCO, MOLA_ENTRADA, MOLA_TOQUE } from "@/components/ui";

/**
 * Álbum de figurinhas: cada bicho lido aparece colorido; os outros, em silhueta.
 * Os cards entram em cascata. Tocar numa figurinha lê o nome e a curiosidade (o card brilha
 * enquanto fala); tocar numa que falta balança de leve e avisa com carinho.
 */
export function Album() {
  const { animaisColetados } = useProgress();
  const [lendo, setLendo] = useState<string | null>(null);
  const [balancando, setBalancando] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Animal | null>(null);

  async function tocar(b: Animal, ok: boolean) {
    if (!ok) {
      setBalancando(b.id);
      setTimeout(() => setBalancando((x) => (x === b.id ? null : x)), 450);
      speak("Essa figurinha ainda vai chegar. Continue jogando!");
      return;
    }
    // abre a ficha com a foto real (a ficha fala o nome e uma curiosidade)
    setLendo(b.id);
    setAberto(b);
    setTimeout(() => setLendo((x) => (x === b.id ? null : x)), 600);
  }

  return (
    <div className="flex flex-col gap-6">
      <FichaBicho animal={aberto} onFechar={() => setAberto(null)} />
      {TERRITORIOS.map((t, ti) => {
        const bichos = animaisDoTerritorio(t.id);
        const tem = bichos.filter((b) => animaisColetados.includes(b.id)).length;
        return (
          <motion.section
            key={t.id}
            style={
              {
                "--t-fundo": TEMAS[t.tipo].fundo,
                "--t-chao": TEMAS[t.tipo].chao,
                "--t-destaque": TEMAS[t.tipo].destaque,
              } as React.CSSProperties
            }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...MOLA_ENTRADA, delay: ti * 0.1 }}
            className="rounded-xl bg-t-fundo p-4 sm:p-5"
          >
            <motion.button
              type="button"
              onClick={() => speak(`${t.nome}. Você tem ${tem} de ${bichos.length} figurinhas.`)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={MOLA_TOQUE}
              className="mb-3 flex w-full items-center justify-between gap-3 rounded-lg px-1 text-left"
            >
              {/* Ícone primeiro: o primeiro bicho do bioma */}
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-branco/70">
                <Arte src={arteDoAnimal(bichos[0])} className="size-9" />
              </span>
              <h2 className="flex flex-1 flex-col text-2xl leading-tight font-extrabold text-t-destaque uppercase">
                <span className="text-sm font-bold tracking-wide opacity-80">{paisPorId(t.pais).nome}</span>
                {t.nome}
              </h2>
              <span className="flex items-center gap-1 text-lg font-bold text-t-destaque">
                <Arte nome="ui/album" className="size-6" />
                {tem}/{bichos.length}
              </span>
            </motion.button>
            <motion.div
              className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5"
              initial="fora"
              animate="dentro"
              variants={{ dentro: { transition: { staggerChildren: 0.04, delayChildren: 0.15 + ti * 0.1 } } }}
            >
              {bichos.map((b) => {
                const ok = animaisColetados.includes(b.id);
                const falando = lendo === b.id;
                return (
                  <motion.div
                    key={b.id}
                    variants={{
                      fora: { opacity: 0, y: 14, scale: 0.9 },
                      dentro: { opacity: 1, y: 0, scale: 1, transition: MOLA_ENTRADA },
                    }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => tocar(b, ok)}
                      whileHover={{ y: -3, rotate: ok ? -1.5 : 0 }}
                      whileTap={{ scale: 0.94 }}
                      animate={balancando === b.id ? BALANCO : falando ? { scale: 1.05 } : { x: 0, scale: 1 }}
                      transition={balancando === b.id ? { duration: 0.4 } : MOLA_TOQUE}
                      className={`flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 rounded-md p-2 ring-amarelo transition-[box-shadow] duration-300 ${
                        ok
                          ? "bg-branco shadow-[0_5px_0_var(--t-chao)] hover:shadow-[0_7px_0_var(--t-chao)]"
                          : "border-4 border-dashed border-branco/80 bg-branco/30"
                      } ${falando ? "ring-4" : "ring-0"}`}
                      aria-label={ok ? b.nome : "Figurinha ainda não conquistada"}
                    >
                      <Arte src={arteDoAnimal(b)} silhueta={!ok} className="size-14 sm:size-16" />
                      <span className="font-leitura text-base font-bold uppercase text-roxo">{ok ? b.nome : "?"}</span>
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>
        );
      })}
    </div>
  );
}
