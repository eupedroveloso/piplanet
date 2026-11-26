import type { Metadata } from "next";
import { Cartas } from "@/games/cartas/Cartas";

export const metadata: Metadata = { title: "Cartas · Pietro Games" };

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col bg-fundo">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4 sm:px-6">
        <Cartas />
      </main>
    </div>
  );
}
