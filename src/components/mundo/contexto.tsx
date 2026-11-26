"use client";

import { createContext, useContext } from "react";
import type { Ilha } from "./ilha";

/** A ilha (país) que está sendo mostrada. Os seres vivos leem o relevo daqui. */
export const IlhaContexto = createContext<Ilha | null>(null);

export function useIlha() {
  const ilha = useContext(IlhaContexto);
  if (!ilha) throw new Error("useIlha fora do IlhaContexto");
  return ilha;
}
