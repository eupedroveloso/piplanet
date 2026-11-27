"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { trocarPerfil, usePerfil } from "@/lib/perfil";
import { settingsStore, useSettings } from "@/lib/settings";
import { speak } from "@/lib/speech";
import { Arte, BALANCO, MOLA_ENTRADA, MOLA_TOQUE } from "@/components/ui";

/**
 * AJUSTES
 * - Velocidade da voz (tartaruga ↔ coelho), com amostra falada a cada mudança.
 * - Voz ligada/desligada.
 * - Trocar de conta, protegido por uma continha para adultos (o Pietro ainda não lê, então não sai sem querer).
 */
const VELOCIDADES = [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2];

export function Ajustes() {
  const { voz, velocidadeVoz } = useSettings();
  const perfil = usePerfil();
  const [portao, setPortao] = useState(false);
  const idx = VELOCIDADES.reduce((m, v, i) => (Math.abs(v - velocidadeVoz) < Math.abs(VELOCIDADES[m] - velocidadeVoz) ? i : m), 0);

  function mudarVelocidade(i: number) {
    const v = VELOCIDADES[Math.max(0, Math.min(VELOCIDADES.length - 1, i))];
    settingsStore.write((s) => ({ ...s, velocidadeVoz: v }));
    speak("Oi! É assim que eu falo.", { rate: v });
  }

  function alternarVoz() {
    const nova = !voz;
    settingsStore.write((s) => ({ ...s, voz: nova }));
    if (nova) setTimeout(() => speak("Oba! Agora eu falo com você."), 50);
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 pt-[max(env(safe-area-inset-top),1rem)]">
      <motion.button
        type="button"
        onClick={() => speak("Ajustes")}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.95 }}
        transition={MOLA_ENTRADA}
        className="flex items-center gap-2 rounded-full bg-branco/90 px-5 py-1.5 shadow-suave"
      >
        <Arte nome="ui/ajustes" className="size-8" />
        <span className="text-2xl font-extrabold text-roxo">Ajustes</span>
      </motion.button>

      {/* Velocidade da voz */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...MOLA_ENTRADA, delay: 0.05 }} className="flex w-full max-w-md flex-col gap-3 rounded-xl bg-branco p-4 shadow-suave">
        <button type="button" onClick={() => speak("Velocidade da voz")} className="flex items-center gap-2 self-center">
          <Arte nome="ui/som-ligado" className="size-7" />
          <span className="text-lg font-extrabold text-roxo">Velocidade da voz</span>
        </button>
        <div className="flex items-center gap-2">
          <motion.button type="button" aria-label="Mais devagar" onClick={() => mudarVelocidade(idx - 1)} whileTap={{ scale: 0.88 }} transition={MOLA_TOQUE} className="grid size-16 shrink-0 place-items-center rounded-full bg-verde-claro shadow-[0_4px_0_var(--color-linha)]">
            <Arte nome="animais/tartaruga" className="size-11" />
          </motion.button>
          {/* Um controle só (alvo grande): tocar em qualquer ponto escolhe o nível daquela posição.
              As barrinhas são só indicação visual; as setas do teclado também mudam. */}
          <motion.button
            type="button"
            role="slider"
            aria-label="Velocidade da voz"
            aria-valuemin={1}
            aria-valuemax={VELOCIDADES.length}
            aria-valuenow={idx + 1}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const x = Math.max(0, Math.min(0.999, (e.clientX - r.left) / r.width));
              mudarVelocidade(Math.floor(x * VELOCIDADES.length));
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") mudarVelocidade(idx - 1);
              if (e.key === "ArrowRight" || e.key === "ArrowUp") mudarVelocidade(idx + 1);
            }}
            whileTap={{ scale: 0.97 }}
            transition={MOLA_TOQUE}
            className="flex h-14 min-w-0 flex-1 items-end gap-1 rounded-xl px-1.5 pb-1"
          >
            {VELOCIDADES.map((v, i) => (
              <motion.span
                key={v}
                aria-hidden
                animate={{ height: 14 + i * 5, scale: i === idx ? 1.08 : 1 }}
                transition={MOLA_TOQUE}
                className={`block flex-1 origin-bottom rounded-md transition-colors duration-200 ${i <= idx ? "bg-amarelo" : "bg-linha"} ${i === idx ? "ring-2 ring-roxo" : ""}`}
              />
            ))}
          </motion.button>
          <motion.button type="button" aria-label="Mais rápido" onClick={() => mudarVelocidade(idx + 1)} whileTap={{ scale: 0.88 }} transition={MOLA_TOQUE} className="grid size-16 shrink-0 place-items-center rounded-full bg-amarelo-claro shadow-[0_4px_0_var(--color-linha)]">
            <Arte nome="animais/coelho" className="size-11" />
          </motion.button>
        </div>
      </motion.section>

      {/* Voz ligada/desligada */}
      <motion.button
        type="button"
        aria-label={voz ? "Desligar voz" : "Ligar voz"}
        onClick={alternarVoz}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.96 }}
        transition={{ ...MOLA_ENTRADA, delay: 0.1 }}
        className="flex w-full max-w-md items-center gap-3 rounded-xl bg-branco p-4 shadow-suave"
      >
        <Arte nome={voz ? "ui/som-ligado" : "ui/som-desligado"} className="size-9" />
        <span className="flex-1 text-left text-lg font-extrabold text-roxo">Voz</span>
        <span className={`relative h-9 w-16 rounded-full transition-colors duration-300 ${voz ? "bg-verde" : "bg-linha"}`}>
          <motion.span layout transition={MOLA_TOQUE} className={`absolute top-1 size-7 rounded-full bg-branco shadow ${voz ? "right-1" : "left-1"}`} />
        </span>
      </motion.button>

      {/* Meu nível de leitura (saiu do rodapé para caber no celular): só para as crianças */}
      {!perfil.temSenha && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOLA_ENTRADA, delay: 0.15 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="w-full max-w-md"
        >
          <Link
            href="/nivelamento"
            onClick={() => speak("Meu nível de leitura")}
            aria-label="Meu nível de leitura"
            className="flex w-full items-center gap-3 rounded-xl bg-branco p-4 shadow-suave"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-amarelo-claro">
              <Arte nome="ui/escada" className="size-8" />
            </span>
            <span className="flex-1 text-left text-lg font-extrabold text-roxo">Meu nível</span>
            <Arte nome="ui/play" className="size-8" />
          </Link>
        </motion.div>
      )}

      {/* Trocar de conta (para adultos). O visitante não vê: senão entraria no progresso do Pietro ou da Pérola */}
      {!perfil.visitante && (
      <motion.button
        type="button"
        onClick={() => setPortao(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.96 }}
        className="mt-2 flex items-center gap-2 rounded-full bg-branco/70 px-4 py-2 text-sm font-bold text-tinta-suave"
      >
        <Arte nome={perfil.avatar} className="size-6" />
        Trocar de conta
        <Arte nome="ui/cadeado" className="size-4 opacity-60" />
      </motion.button>
      )}

      <AnimatePresence>{portao && <PortaoAdulto onFechar={() => setPortao(false)} onOk={trocarPerfil} />}</AnimatePresence>
    </main>
  );
}

/** Continha para adultos (sem voz, de propósito). */
function PortaoAdulto({ onFechar, onOk }: { onFechar: () => void; onOk: () => void }) {
  const [conta] = useState(() => {
    const a = 3 + Math.floor(Math.random() * 7);
    const b = 3 + Math.floor(Math.random() * 7);
    return { a, b };
  });
  const [resp, setResp] = useState("");
  const [erro, setErro] = useState(false);

  function teclar(d: string) {
    if (d === "⌫") return setResp((r) => r.slice(0, -1));
    if (d === "✓") {
      if (Number(resp) === conta.a + conta.b) onOk();
      else {
        setErro(true);
        setResp("");
        setTimeout(() => setErro(false), 450);
      }
      return;
    }
    setResp((r) => (r + d).slice(0, 3));
  }

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-tinta/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onFechar}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, y: 20 }}
        animate={erro ? { ...BALANCO, scale: 1, y: 0 } : { scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={erro ? { duration: 0.4 } : MOLA_ENTRADA}
        className="flex w-full max-w-xs flex-col items-center gap-3 rounded-xl bg-branco p-5 shadow-suave"
      >
        <p className="text-sm font-bold text-tinta-suave">Só para adultos</p>
        <p className="text-3xl font-extrabold text-roxo">
          {conta.a} + {conta.b} = <span className="inline-block min-w-12 border-b-4 border-linha text-center">{resp || "?"}</span>
        </p>
        <div className="grid w-full grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].map((d) => (
            <motion.button
              key={d}
              type="button"
              whileTap={{ scale: 0.9, y: 2 }}
              transition={MOLA_TOQUE}
              onClick={() => teclar(d)}
              className={`h-12 rounded-lg text-xl font-extrabold ${d === "✓" ? "bg-verde text-branco" : "bg-fundo text-roxo"} shadow-[0_3px_0_var(--color-linha)]`}
            >
              {d}
            </motion.button>
          ))}
        </div>
        <button type="button" onClick={onFechar} className="text-sm font-bold text-tinta-suave">
          cancelar
        </button>
      </motion.div>
    </motion.div>
  );
}
