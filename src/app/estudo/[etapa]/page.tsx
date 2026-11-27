import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RodadaDoEstudo } from "./RodadaDoEstudo";

export const metadata: Metadata = { title: "Estudo do dia · Pietro Games" };

export function generateStaticParams() {
  return [{ etapa: "exercicios" }, { etapa: "reforco" }];
}

async function Etapa({ params }: { params: PageProps<"/estudo/[etapa]">["params"] }) {
  const { etapa } = await params;
  if (etapa !== "exercicios" && etapa !== "reforco") notFound();
  return <RodadaDoEstudo etapa={etapa} />;
}

export default function Page({ params }: PageProps<"/estudo/[etapa]">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-fundo" />}>
      <Etapa params={params} />
    </Suspense>
  );
}
