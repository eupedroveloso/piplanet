"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ANIMAIS, arteDoAnimal, type Animal } from "@/content/animais";
import { animaisDoTerritorio, type Territorio } from "@/content/jornada";
import { shuffle } from "@/lib/random";
import { speak } from "@/lib/speech";
import {
  Arte,
  BALANCO,
  Comemoracao,
  MOLA_ENTRADA,
  MOLA_TOQUE,
  fonteQueCabe,
} from "@/components/ui";
import { JogoFase, type RodadaProps } from "../comum/JogoFase";

/**
 * LÊ E ACHA
 * A palavra aparece com as sílabas JÁ MONTADAS (GA · TO). Ele lê e toca no bicho certo.
 * Tocar numa sílaba lê só aquela sílaba (apoio à decodificação, sem entregar a palavra).
 * Bicho errado: balança e diz o nome dele ("esse é o pato"). Após 2 erros, o certo pula.
 */

const ERROS_ATE_DICA = 2;

export function LeEAcha({
  territorio,
  faseIdx,
}: {
  territorio: Territorio;
  faseIdx: number;
}) {
  return (
    <JogoFase
      territorio={territorio}
      faseIdx={faseIdx}
      rodada={(p) => <RodadaAchar {...p} />}
    />
  );
}

function montarOpcoes(
  animal: Animal,
  territorio: Territorio,
  n: number,
): Animal[] {
  // nunca duas opções com o mesmo nome ou a mesma ilustração (ex.: boto e golfinho)
  const diferente = (a: Animal) => a.id !== animal.id && a.nome !== animal.nome && arteDoAnimal(a) !== arteDoAnimal(animal);
  let pool = animaisDoTerritorio(territorio.id).filter(diferente);
  if (pool.length < n) pool = ANIMAIS.filter(diferente);
  const escolhidos: Animal[] = [];
  for (const a of shuffle(pool)) {
    if (escolhidos.length >= n) break;
    if (!escolhidos.some((e) => arteDoAnimal(e) === arteDoAnimal(a) || e.nome === a.nome)) escolhidos.push(a);
  }
  return shuffle([animal, ...escolhidos]);
}

function RodadaAchar({
  animal,
  territorio,
  fase,
  acertou,
  errar,
  acertar,
}: RodadaProps) {
  const [opcoes] = useState(() =>
    montarOpcoes(animal, territorio, fase.distratores),
  );
  const [erros, setErros] = useState(0);
  const [balancando, setBalancando] = useState<string | null>(null);
  const [lendo, setLendo] = useState<number | null>(null);

  async function lerSilaba(s: string, i: number) {
    setLendo(i);
    await speak(s);
    setLendo((l) => (l === i ? null : l));
  }

  function escolher(a: Animal) {
    if (acertou) return;
    if (a.id === animal.id) {
      acertar();
      return;
    }
    setErros((e) => e + 1);
    errar();
    setBalancando(a.id);
    setTimeout(() => setBalancando(null), 450);
    speak(`Esse é ${a.nome}.`);
  }

  const dica = erros >= ERROS_ATE_DICA;

  return (
    <>
      {/* Palavra com sílabas prontas */}
      {/* Numa linha só, em qualquer celular: a fonte encolhe com a largura (RI·NO·CE·RON·TE em 360 px) */}
      <div
        style={{ fontSize: fonteQueCabe(animal.silabas.join("").length, animal.silabas.length - 1, 72) }}
        className="flex max-w-full items-center justify-center gap-[0.08em] rounded-xl bg-branco px-3 py-3 font-leitura shadow-[0_8px_0_var(--t-chao)] sm:px-6 sm:py-4"
      >
        {animal.silabas.map((s, i) => (
          <span key={i} className="flex items-center gap-[0.08em]">
            {i > 0 && (
              <span aria-hidden className="text-[0.6em] font-bold text-tinta-suave">·</span>
            )}
            <motion.button
              type="button"
              onClick={() => lerSilaba(s, i)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.92 }}
              animate={
                acertou
                  ? { scale: [1, 1.12, 1] }
                  : { scale: lendo === i ? 1.08 : 1 }
              }
              transition={
                acertou ? { duration: 0.5, delay: i * 0.12 } : MOLA_TOQUE
              }
              className={`min-h-12 rounded-md px-[0.1em] leading-tight font-bold uppercase transition-colors duration-300 ${
                acertou ? "text-verde-escuro" : "text-roxo"
              } ${lendo === i ? "bg-amarelo-claro" : ""}`}
            >
              {s}
            </motion.button>
          </span>
        ))}
      </div>

      {/* Opções de bicho */}
      {/* Sem rolagem no celular: o lado de cada opção cabe na altura (até 6 opções em 3 linhas).
          No acerto, as erradas saem e fica só o bicho certo (um foco por vez, e sobra espaço). */}
      <div
        style={{ "--lado": `min(40vw, 11rem, calc((100dvh - 330px) / ${Math.ceil((acertou ? 1 : opcoes.length) / 2)}))` } as React.CSSProperties}
        className="grid grid-cols-2 justify-items-center gap-3 [&>*:last-child:nth-child(odd)]:col-span-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-4"
      >
        <AnimatePresence initial={false}>
        {opcoes.filter((a) => !acertou || a.id === animal.id).map((a, n) => {
          const certo = a.id === animal.id;
          return (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              transition={{ ...MOLA_ENTRADA, delay: acertou ? 0 : 0.15 + n * 0.06 }}
            >
              <motion.button
                type="button"
                onClick={() => escolher(a)}
                whileHover={acertou ? undefined : { y: -3 }}
                whileTap={acertou ? undefined : { scale: 0.94 }}
                aria-label={acertou && certo ? a.nome : "Opção de bicho"}
                animate={
                  balancando === a.id
                    ? BALANCO
                    : dica && certo && !acertou
                      ? { y: [0, -10, 0] }
                      : acertou && certo
                        ? { scale: [1, 1.18, 1.08] }
                        : { x: 0, y: 0, scale: 1 }
                }
                transition={
                  dica && certo && !acertou
                    ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.4 }
                }
                className={`relative grid size-[var(--lado)] min-h-14 min-w-14 place-items-center rounded-xl bg-branco transition-[opacity,box-shadow] duration-300 sm:size-44 ${
                  acertou && certo
                    ? "shadow-[0_8px_0_var(--color-verde-escuro)] ring-4 ring-verde"
                    : dica && certo
                      ? "shadow-[0_8px_0_var(--color-amarelo-escuro)] ring-4 ring-amarelo"
                      : "shadow-[0_8px_0_var(--t-chao)]"
                } ${acertou && !certo ? "opacity-30" : ""}`}
              >
                <Arte src={arteDoAnimal(a)} className="size-[70%] sm:size-32" />
                {acertou && certo && <Comemoracao raio={130} />}
              </motion.button>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </>
  );
}
