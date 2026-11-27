import type { Metadata } from "next";
import { EspelhoJornada } from "./EspelhoJornada";

export const metadata: Metadata = { title: "Jornada · Pais · Pietro Games" };

/** Espelho da jornada da criança escolhida (conta Pais, somente leitura). */
export default function Page() {
  return <EspelhoJornada />;
}
