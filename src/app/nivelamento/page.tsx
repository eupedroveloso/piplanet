import type { Metadata } from "next";
import { Nivelamento } from "@/games/nivelamento/Nivelamento";

export const metadata: Metadata = { title: "Meu nível · Pietro Games" };

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col bg-fundo">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4 sm:px-6">
        <Nivelamento />
      </main>
    </div>
  );
}
