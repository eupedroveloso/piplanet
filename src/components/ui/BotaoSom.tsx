"use client";

import { AnimatePresence, motion } from "motion/react";
import { settingsStore, useSettings } from "@/lib/settings";
import { speak, stopSpeaking } from "@/lib/speech";
import { Arte } from "./Arte";
import { BotaoRedondo } from "./BotaoRedondo";
import { MOLA_ENTRADA } from "./movimento";

/** Liga/desliga a voz. Sempre visível no topo das telas. O ícone troca girando de leve. */
export function BotaoSom() {
  const { voz } = useSettings();
  return (
    <BotaoRedondo
      aria-label={voz ? "Desligar voz" : "Ligar voz"}
      aria-pressed={voz}
      fala={false}
      onClick={() => {
        if (voz) stopSpeaking();
        settingsStore.write((s) => ({ ...s, voz: !s.voz }));
        if (!voz) speak("Oba! Agora eu falo com você.");
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={voz ? "on" : "off"}
          initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.1 } }}
          transition={MOLA_ENTRADA}
          className="grid place-items-center"
        >
          <Arte nome={voz ? "ui/som-ligado" : "ui/som-desligado"} className="size-7" />
        </motion.span>
      </AnimatePresence>
    </BotaoRedondo>
  );
}
