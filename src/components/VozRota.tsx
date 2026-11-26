"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { stopSpeaking } from "@/lib/speech";

/** Trocar de tela é uma interrupção manual: a fala atual e a fila param. */
export function VozRota() {
  const path = usePathname();
  useEffect(() => {
    stopSpeaking();
  }, [path]);
  return null;
}
