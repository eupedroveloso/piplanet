import type { Metadata } from "next";
import { Entrar } from "./Entrar";

export const metadata: Metadata = { title: "Quem vai jogar? · Pietro Games" };

export default function Page() {
  return <Entrar />;
}
