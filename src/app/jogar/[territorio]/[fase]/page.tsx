import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TERRITORIOS, territorioPorId } from "@/content/jornada";
import { TEMAS } from "@/content/paises";
import { LeEAcha } from "@/games/le-e-acha/LeEAcha";
import { MontaOBicho } from "@/games/monta-o-bicho/MontaOBicho";

export const metadata: Metadata = { title: "Jogar · Pietro Games" };

export function generateStaticParams() {
  return TERRITORIOS.flatMap((t) => t.fases.map((_, i) => ({ territorio: t.id, fase: String(i) })));
}

type Params = PageProps<"/jogar/[territorio]/[fase]">["params"];

async function Fase({ params }: { params: Params }) {
  const { territorio: tid, fase } = await params;
  const territorio = territorioPorId(tid);
  const idx = Number(fase);
  if (!territorio || !territorio.fases[idx]) notFound();

  const jogo = territorio.fases[idx].jogo;
  const tema = TEMAS[territorio.tipo];
  const vars = {
    "--t-fundo": tema.fundo,
    "--t-chao": tema.chao,
    "--t-trilha": tema.trilha,
    "--t-faixa": tema.faixa,
    "--t-destaque": tema.destaque,
  } as React.CSSProperties;
  return (
    <div style={vars} className="flex min-h-dvh flex-col bg-t-fundo">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4 sm:px-6">
        {jogo === "le-e-acha" && <LeEAcha territorio={territorio} faseIdx={idx} />}
        {jogo === "monta-o-bicho" && <MontaOBicho territorio={territorio} faseIdx={idx} modo="silabas" />}
        {jogo === "monta-a-silaba" && <MontaOBicho territorio={territorio} faseIdx={idx} modo="letras" />}
      </main>
    </div>
  );
}

export default function Page({ params }: PageProps<"/jogar/[territorio]/[fase]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-t-fundo" />}>
      <Fase params={params} />
    </Suspense>
  );
}
