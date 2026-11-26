"use client";

import { useState } from "react";
import { motion } from "motion/react";
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
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-branco px-6 py-4 shadow-[0_8px_0_var(--t-chao)]">
        {animal.silabas.map((s, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-4xl font-bold text-tinta-suave">·</span>
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
              className={`rounded-md px-2 font-leitura text-6xl font-bold uppercase transition-colors duration-300 sm:text-7xl ${
                acertou ? "text-verde-escuro" : "text-roxo"
              } ${lendo === i ? "bg-amarelo-claro" : ""}`}
            >
              {s}
            </motion.button>
          </span>
        ))}
      </div>

      {/* Opções de bicho */}
      <div className="flex flex-wrap justify-center gap-4">
        {opcoes.map((a, n) => {
          const certo = a.id === animal.id;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...MOLA_ENTRADA, delay: 0.15 + n * 0.06 }}
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
                className={`relative grid size-36 place-items-center rounded-xl bg-branco transition-[opacity,box-shadow] duration-300 sm:size-44 ${
                  acertou && certo
                    ? "shadow-[0_8px_0_var(--color-verde-escuro)] ring-4 ring-verde"
                    : dica && certo
                      ? "shadow-[0_8px_0_var(--color-amarelo-escuro)] ring-4 ring-amarelo"
                      : "shadow-[0_8px_0_var(--t-chao)]"
                } ${acertou && !certo ? "opacity-30" : ""}`}
              >
                <Arte src={arteDoAnimal(a)} className="size-24 sm:size-32" />
                {acertou && certo && <Comemoracao raio={130} />}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
