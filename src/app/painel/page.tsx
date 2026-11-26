import type { Metadata } from "next";
import { PainelAdultos } from "./PainelAdultos";

export const metadata: Metadata = { title: "Aprendizado do Pietro · Pietro Games" };

export default function Page() {
  return <PainelAdultos />;
}
