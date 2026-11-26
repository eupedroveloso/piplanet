import { MapaMundo } from "@/components/mundo/MapaMundo";
import { Cabecalho, NavInferior } from "@/components/ui";

/** Tela principal: o mundo das ilhas flutuantes em tela cheia, com placar e navegação flutuando por cima. */
export default function Home() {
  return (
    <div className="relative h-dvh overflow-hidden">
      <MapaMundo />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 [&>*]:pointer-events-auto">
        <Cabecalho />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 [&_nav]:pointer-events-auto">
        <NavInferior />
      </div>
    </div>
  );
}
