"use client";

import { useEffect } from "react";
import { iniciarSincronia } from "@/lib/sincronia";

/** Liga a sincronização do progresso com o banco (invisível). */
export function Sincronia() {
  useEffect(() => {
    if (!location.pathname.startsWith("/entrar")) iniciarSincronia();
  }, []);
  return null;
}
