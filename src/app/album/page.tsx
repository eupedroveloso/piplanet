import type { Metadata } from "next";
import { Album } from "@/components/jornada/Album";
import { Arte, Cabecalho, NavInferior } from "@/components/ui";

export const metadata: Metadata = { title: "Álbum · Pietro Games" };

/** Uma tela só (sem rolagem): cabeçalho, páginas do álbum e rodapé dividem 100dvh. */
export default function Page() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Cabecalho estreito />
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-3 pb-2 sm:px-4">
        <h2 className="mb-2 hidden items-center gap-2 text-3xl font-extrabold text-roxo sm:flex">
          <Arte nome="ui/album" className="size-10" />
          Álbum de Bichos
        </h2>
        <Album />
      </main>
      <NavInferior />
    </div>
  );
}
