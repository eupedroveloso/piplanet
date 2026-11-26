import type { Metadata } from "next";
import { NavInferior } from "@/components/ui";
import { Ajustes } from "./Ajustes";

export const metadata: Metadata = { title: "Ajustes · Pietro Games" };

export default function Page() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden" style={{ background: "linear-gradient(180deg, #a9c1ff 0%, #cdd8ff 45%, #f1e8ff 100%)" }}>
      <Ajustes />
      <NavInferior />
    </div>
  );
}
