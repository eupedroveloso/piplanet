import type { Metadata } from "next";
import { EspelhoCartas } from "./EspelhoCartas";

export const metadata: Metadata = { title: "Cartas · Pais · Pietro Games" };

/** Espelho das cartas da criança escolhida (conta Pais, somente leitura). */
export default function Page() {
  return <EspelhoCartas />;
}
