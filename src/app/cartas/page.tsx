import type { Metadata } from "next";
import { Cartas } from "@/games/cartas/Cartas";

export const metadata: Metadata = { title: "Cartas · Pietro Games" };

export default function Page() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-fundo">
      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-6 sm:py-4">
        <Cartas />
      </main>
    </div>
  );
}
