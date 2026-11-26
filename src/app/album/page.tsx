import type { Metadata } from "next";
import { Album } from "@/components/jornada/Album";
import { Arte, Cabecalho, NavInferior } from "@/components/ui";

export const metadata: Metadata = { title: "Álbum · Pietro Games" };

export default function Page() {
  return (
    <>
      <Cabecalho estreito />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-6">
        <h2 className="mb-4 flex items-center gap-2 text-3xl font-extrabold text-roxo">
          <Arte nome="ui/album" className="size-10" />
          Álbum de Bichos
        </h2>
        <Album />
      </main>
      <NavInferior />
    </>
  );
}
