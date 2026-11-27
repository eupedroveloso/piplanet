"use client";

import { CartasAba } from "../PainelAdultos";
import { TelaEspelho, useEspelho } from "../espelho";

/** ESPELHO DAS CARTAS (conta Pais, somente leitura): caixas, para revisar hoje, leu sozinho e a lista. */
export function EspelhoCartas() {
  const esp = useEspelho();
  return (
    <TelaEspelho titulo="Cartas" icone="ui/cartas" esp={esp}>
      <CartasAba m={esp.m} agora={esp.agora} />
    </TelaEspelho>
  );
}
