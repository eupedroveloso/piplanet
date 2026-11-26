import type { Metadata } from "next";
import { PainelAdultos } from "./PainelAdultos";

export const metadata: Metadata = { title: "Aprendizado · Pietro Games" };

export default function Page() {
  return <PainelAdultos />;
}
