"use client";

import { Album } from "@/components/jornada/Album";
import { TelaEspelho, useEspelho } from "../espelho";

/** ESPELHO DO ÁLBUM (conta Pais, somente leitura): os bichos que a criança já coletou; os que faltam em silhueta. */
export function EspelhoAlbum() {
  const esp = useEspelho();
  return (
    <TelaEspelho titulo="Álbum" icone="ui/album" esp={esp}>
      <div className="flex h-full flex-col">
        <Album progresso={esp.base} />
      </div>
    </TelaEspelho>
  );
}
