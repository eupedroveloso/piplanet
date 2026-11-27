import type { Metadata } from "next";
import { EspelhoAlbum } from "./EspelhoAlbum";

export const metadata: Metadata = { title: "Álbum · Pais · Pietro Games" };

/** Espelho do álbum da criança escolhida (conta Pais, somente leitura). */
export default function Page() {
  return <EspelhoAlbum />;
}
