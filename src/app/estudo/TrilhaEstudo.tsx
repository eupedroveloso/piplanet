"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { arteDoAnimal } from "@/content/animais";
import { Arte, Comemoracao, Explorador, MOLA_ENTRADA, MOLA_TOQUE } from "@/components/ui";
import { diaDe, diasSeguidos, estudoDoDia, exerciciosDoDia, palavrasParaReforcar } from "@/lib/estudo";
import { JOGOS } from "@/content/jornada";
import { progressStore, type Progress } from "@/lib/progress";
import { usePerfil } from "@/lib/perfil";
import { speak } from "@/lib/speech";

const nada = () => () => {};

/**
 * TRILHA DO ESTUDO DO DIA: três paradas em ordem.
 * 1. Exercícios do dia → 2. Reforçar (as palavras em que errou) → 3. Conquista do dia.
 * A parada da vez respira; as feitas ganham ✓; as próximas ficam trancadas. Tudo falado.
 */
export function TrilhaEstudo() {
  const p = progressStore.useStore();
  // o dia só existe no navegador (evita diferença entre servidor e aparelho)
  const dia = useSyncExternalStore(nada, () => diaDe(), () => "");
  const { genero } = usePerfil();
  const pronto = dia !== "" && p.atualizadoEm >= 0;

  const plano = useMemo(() => (dia ? montar(p, dia) : null), [p, dia]);

  useEffect(() => {
    if (!plano) return;
    const t = setTimeout(() => speak(plano.fala), 500);
    return () => clearTimeout(t);
  }, [plano]);

  if (!pronto || !plano) return <div className="flex-1" />;
  const { feito, reforcar, jogoHoje, seguidos } = plano;
  const paradas = [
    {
      id: "exercicios",
      href: "/estudo/exercicios",
      icone: JOGOS[jogoHoje].icone,
      rotulo: "Exercícios do dia",
      fala: `Exercícios do dia: ${JOGOS[jogoHoje].nome}!`,
      feita: feito.exercicios,
      extra: null as React.ReactNode,
    },
    {
      id: "reforco",
      href: "/estudo/reforco",
      icone: "ui/coracao",
      rotulo: "Reforçar",
      fala: reforcar.length
        ? `Vamos reforçar ${reforcar.length === 1 ? "a palavra" : `as ${reforcar.length} palavras`} que ficaram difíceis!`
        : "Nenhuma palavra para reforçar hoje!",
      feita: feito.reforco || (feito.exercicios && reforcar.length === 0),
      extra: reforcar.length ? (
        <span className="flex -space-x-2">
          {reforcar.slice(0, 5).map((s) => (
            <span key={s.animal.id} className="grid size-9 place-items-center rounded-full bg-branco shadow-suave ring-2 ring-coral/40">
              <Arte src={arteDoAnimal(s.animal)} className="size-7" />
            </span>
          ))}
        </span>
      ) : null,
    },
    {
      id: "conquista",
      href: null,
      icone: "ui/trofeu",
      rotulo: "Conquista",
      fala: genero === "f" ? "Estudo do dia completo! Você é uma exploradora incrível!" : "Estudo do dia completo! Você é um explorador incrível!",
      feita: false,
      extra: null,
    },
  ];
  const completo = paradas[0].feita && paradas[1].feita;
  const vez = paradas.findIndex((x) => !x.feita);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center-safe gap-4 sm:gap-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={MOLA_ENTRADA} className="flex items-center gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-roxo sm:text-3xl">
          <Arte nome="ui/sol" className="size-9 sm:size-10" />
          Estudo do dia
        </h1>
        {seguidos > 0 && (
          <button
            type="button"
            onClick={() => speak(`${seguidos} ${seguidos === 1 ? "dia" : "dias"} seguidos de estudo!`)}
            aria-label={`${seguidos} dias seguidos`}
            className="flex items-center gap-1 rounded-full bg-amarelo px-3 py-1 text-lg font-extrabold text-roxo shadow-[0_4px_0_var(--color-amarelo-escuro)] transition-transform active:scale-95"
          >
            <Arte nome="ui/estrela" className="size-6" />
            {seguidos}
          </button>
        )}
      </motion.div>

      {/* Trilha vertical: linha pontilhada ligando as paradas */}
      <ol className="relative flex w-full flex-col gap-4 sm:gap-6">
        <span aria-hidden className="absolute top-10 bottom-10 left-[2.75rem] w-1.5 rounded-full border-l-[6px] border-dotted border-roxo/25 sm:left-[3.25rem]" />
        {paradas.map((x, i) => {
          const daVez = i === vez;
          const trancada = i > vez && vez !== -1;
          const conquista = x.id === "conquista";
          const conteudo = (
            <>
              <motion.span
                animate={daVez && !conquista ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={daVez ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : MOLA_TOQUE}
                className={`relative grid size-[5.5rem] shrink-0 place-items-center rounded-full sm:size-[6.5rem] ${
                  x.feita
                    ? "bg-verde shadow-[0_6px_0_var(--color-verde-escuro)]"
                    : trancada
                      ? "bg-bloqueado shadow-[0_6px_0_var(--color-linha)]"
                      : "bg-amarelo shadow-[0_6px_0_var(--color-amarelo-escuro)]"
                }`}
              >
                <Arte nome={trancada ? "ui/cadeado" : x.icone} className={`size-12 sm:size-14 ${trancada ? "opacity-60" : ""}`} />
                {x.feita && (
                  <span className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full bg-branco text-xl font-extrabold text-verde-escuro shadow-suave">✓</span>
                )}
                {conquista && completo && <Comemoracao raio={90} />}
                {daVez && !conquista && (
                  <span className="absolute -top-9 left-1/2 -translate-x-1/2">
                    <Explorador andando className="size-10" />
                  </span>
                )}
              </motion.span>
              <span className="flex min-w-0 flex-col items-start gap-1.5">
                <span className={`text-xl font-extrabold sm:text-2xl ${trancada ? "text-tinta-suave" : "text-roxo"}`}>{x.rotulo}</span>
                {x.extra}
              </span>
            </>
          );
          const cls = "flex w-full items-center gap-4 rounded-xl p-2 text-left";
          return (
            <motion.li
              key={x.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...MOLA_ENTRADA, delay: 0.1 + i * 0.08 }}
            >
              {x.href && daVez && !(x.id === "reforco" && reforcar.length === 0) ? (
                <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}>
                  <Link href={x.href} onClick={() => speak(x.fala)} aria-label={x.rotulo} className={cls}>
                    {conteudo}
                  </Link>
                </motion.div>
              ) : (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => speak(trancada ? "Primeiro termine a parada de antes!" : x.feita ? `${x.rotulo}: feito!` : x.fala)}
                  aria-label={x.rotulo}
                  className={cls}
                >
                  {conteudo}
                </motion.button>
              )}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

function montar(p: Progress, dia: string) {
  const feito = estudoDoDia(p, dia);
  const reforcar = palavrasParaReforcar(p);
  const jogoHoje = exerciciosDoDia(p, dia).fase.jogo;
  const seguidos = diasSeguidos(p);
  const fala = !feito.exercicios
    ? "Estudo do dia! Primeiro, os exercícios. Toque no círculo amarelo."
    : !feito.reforco && reforcar.length
      ? "Muito bem! Agora vamos reforçar as palavras que ficaram difíceis."
      : "Estudo do dia completo! Volte amanhã para continuar.";
  return { feito, reforcar, jogoHoje, seguidos, fala };
}
