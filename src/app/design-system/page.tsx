import type { Metadata } from "next";
import { Vitrine } from "./Vitrine";

export const metadata: Metadata = { title: "Design System · Pietro Games" };

/** Vitrine viva do design system. Não aparece na navegação da criança. */
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-4xl font-extrabold text-roxo">Design System</h1>
      <p className="mb-8 text-lg text-tinta-suave">Tokens e componentes da plataforma. Fonte: docs/DESIGN-SYSTEM.md</p>
      <Vitrine />
    </main>
  );
}
