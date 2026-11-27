import type { Metadata } from "next";
import { Cabecalho, NavInferior } from "@/components/ui";
import { TrilhaEstudo } from "./TrilhaEstudo";

export const metadata: Metadata = { title: "Estudo do dia · Pietro Games" };

/** Uma tela só (sem rolagem): cabeçalho, trilha do dia e rodapé dividem 100dvh. */
export default function Page() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Cabecalho estreito />
      <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col px-4 pb-2">
        <TrilhaEstudo />
      </main>
      <NavInferior />
    </div>
  );
}
