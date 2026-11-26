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
    <div style={vars} className="flex h-dvh flex-col overflow-hidden bg-t-fundo">
      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-3 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-6 sm:py-4">
        {jogo === "le-e-acha" && <LeEAcha territorio={territorio} faseIdx={idx} />}
        {jogo === "monta-o-bicho" && <MontaOBicho territorio={territorio} faseIdx={idx} modo="silabas" />}
        {jogo === "monta-a-silaba" && <MontaOBicho territorio={territorio} faseIdx={idx} modo="letras" />}
        {jogo === "monta-a-frase" && <MontaOBicho territorio={territorio} faseIdx={idx} modo="frase" />}
      </main>
    </div>
  );
}

export default function Page({ params }: PageProps<"/jogar/[territorio]/[fase]">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-t-fundo" />}>
      <Fase params={params} />
    </Suspense>
  );
}
