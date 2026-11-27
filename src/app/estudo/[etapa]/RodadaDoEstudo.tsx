"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TEMAS } from "@/content/paises";
import { LeEAcha } from "@/games/le-e-acha/LeEAcha";
import { MontaOBicho } from "@/games/monta-o-bicho/MontaOBicho";
import type { ModoEstudo } from "@/games/comum/JogoFase";
import { diaDe, exerciciosDoDia, reforcoDoDia, type PlanoRodada } from "@/lib/estudo";
import { progressStore } from "@/lib/progress";

/**
 * Uma etapa do Estudo diário (exercícios do dia ou reforço), usando os mesmos jogos da jornada.
 * O plano é montado UMA vez ao abrir (não muda no meio da rodada) a partir do progresso do aparelho.
 */
export function RodadaDoEstudo({ etapa }: { etapa: "exercicios" | "reforco" }) {
  const router = useRouter();
  const [plano, setPlano] = useState<{ dia: string; rodada: PlanoRodada | null } | null>(null);

  useEffect(() => {
    // lê o progresso só no navegador (localStorage), depois da montagem
    const p = progressStore.read();
    const dia = diaDe();
    const rodada = etapa === "exercicios" ? exerciciosDoDia(p, dia) : reforcoDoDia(p);
    queueMicrotask(() => setPlano({ dia, rodada }));
  }, [etapa]);

  // nada para reforçar: volta para a trilha
  useEffect(() => {
    if (plano && !plano.rodada) router.replace("/estudo");
  }, [plano, router]);

  if (!plano?.rodada) return <div className="h-dvh bg-fundo" />;
  const { territorio, fase, fila } = plano.rodada;
  const tema = TEMAS[territorio.tipo];
  const vars = {
    "--t-fundo": tema.fundo,
    "--t-chao": tema.chao,
    "--t-trilha": tema.trilha,
    "--t-faixa": tema.faixa,
    "--t-destaque": tema.destaque,
  } as React.CSSProperties;
  const estudo: ModoEstudo = { tipo: etapa === "exercicios" ? "estudo" : "reforco", dia: plano.dia, fase, fila, voltar: "/estudo" };

  return (
    <div style={vars} className="flex h-dvh flex-col overflow-hidden bg-t-fundo">
      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-3 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-6 sm:py-4">
        {fase.jogo === "le-e-acha" && <LeEAcha territorio={territorio} faseIdx={0} estudo={estudo} />}
        {fase.jogo === "monta-o-bicho" && <MontaOBicho territorio={territorio} faseIdx={0} modo="silabas" estudo={estudo} />}
        {fase.jogo === "monta-a-silaba" && <MontaOBicho territorio={territorio} faseIdx={0} modo="letras" estudo={estudo} />}
      </main>
    </div>
  );
}
