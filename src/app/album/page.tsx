import type { Metadata } from "next";
import { Album } from "@/components/jornada/Album";
import { Cabecalho, NavInferior } from "@/components/ui";

export const metadata: Metadata = { title: "Álbum · Pietro Games" };

export default function Page() {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-6">
        <h2 className="mb-4 text-3xl font-extrabold text-roxo">Álbum de Bichos</h2>
        <Album />
      </main>
      <NavInferior />
    </>
  );
}
