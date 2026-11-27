"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { arteDoAnimal, type Animal } from "@/content/animais";
import { speak } from "@/lib/speech";
import { Arte, BotaoRedondo, MOLA_ENTRADA } from "@/components/ui";

/**
 * BICHO NA CÂMERA: abre a câmera do aparelho com a figurinha do bicho por cima.
 * Um dedo arrasta o bicho; dois dedos aumentam/diminuem. O botão grande tira a foto (câmera + bicho)
 * e dá para guardar ou compartilhar. Precisa de HTTPS (no endereço da Vercel funciona).
 */
export function CameraBicho({ animal, onFechar }: { animal: Animal; onFechar: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const [frente, setFrente] = useState(false);
  const [erro, setErro] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);
  // posição (centro, em % da tela) e tamanho (fração da largura) do bicho
  const [pos, setPos] = useState({ x: 50, y: 60, tam: 0.45 });
  const toques = useRef(new Map<number, { x: number; y: number }>());
  const inicio = useRef<{ dist: number; tam: number } | null>(null);

  useEffect(() => {
    speak(`Ache um lugar para o ${animal.nome}!`);
  }, [animal.nome]);

  // liga a câmera (traseira por padrão); desliga ao sair ou ao trocar de câmera
  useEffect(() => {
    let fluxo: MediaStream | null = null;
    let vivo = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: frente ? "user" : "environment" }, audio: false })
      .then((s) => {
        if (!vivo) return s.getTracks().forEach((t) => t.stop());
        fluxo = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play().catch(() => {});
        }
      })
      .catch(() => {
        if (!vivo) return;
        setErro(true);
        speak("Não consegui abrir a câmera. Peça ajuda para um adulto.");
      });
    if (!navigator.mediaDevices) queueMicrotask(() => setErro(true));
    return () => {
      vivo = false;
      fluxo?.getTracks().forEach((t) => t.stop());
    };
  }, [frente]);

  function apertar(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    toques.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (toques.current.size === 2) {
      const [a, b] = [...toques.current.values()];
      inicio.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), tam: pos.tam };
    }
  }

  function mover(e: React.PointerEvent) {
    const antes = toques.current.get(e.pointerId);
    const caixa = area.current?.getBoundingClientRect();
    if (!antes || !caixa) return;
    toques.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (toques.current.size >= 2 && inicio.current) {
      const [a, b] = [...toques.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const tam = Math.min(1.2, Math.max(0.15, (inicio.current.tam * dist) / inicio.current.dist));
      setPos((p) => ({ ...p, tam }));
      return;
    }
    const dx = ((e.clientX - antes.x) / caixa.width) * 100;
    const dy = ((e.clientY - antes.y) / caixa.height) * 100;
    setPos((p) => ({ ...p, x: Math.min(100, Math.max(0, p.x + dx)), y: Math.min(100, Math.max(0, p.y + dy)) }));
  }

  function soltar(e: React.PointerEvent) {
    toques.current.delete(e.pointerId);
    if (toques.current.size < 2) inicio.current = null;
  }

  async function tirarFoto() {
    const v = video.current;
    const caixa = area.current?.getBoundingClientRect();
    if (!v || !caixa || !v.videoWidth) return;
    setFlash((f) => f + 1);
    speak("Clique!");
    // a foto tem o tamanho da tela (o vídeo é cortado como na tela: object-cover)
    const escala = 2;
    const W = Math.round(caixa.width * escala);
    const H = Math.round(caixa.height * escala);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const r = Math.max(W / v.videoWidth, H / v.videoHeight);
    const vw = v.videoWidth * r;
    const vh = v.videoHeight * r;
    if (frente) {
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, (W - vw) / 2, (H - vh) / 2, vw, vh);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const img = new Image();
    img.src = arteDoAnimal(animal);
    await img.decode().catch(() => {});
    const lado = pos.tam * W;
    const alto = img.naturalWidth ? (lado * img.naturalHeight) / img.naturalWidth : lado;
    ctx.drawImage(img, (pos.x / 100) * W - lado / 2, (pos.y / 100) * H - alto / 2, lado, alto);
    setFoto(c.toDataURL("image/jpeg", 0.9));
  }

  async function guardar() {
    if (!foto) return;
    const nome = `${animal.id}-pietro-games.jpg`;
    const blob = await (await fetch(foto)).blob();
    const arquivo = new File([blob], nome, { type: "image/jpeg" });
    if (navigator.canShare?.({ files: [arquivo] })) {
      await navigator.share({ files: [arquivo], title: animal.nome }).catch(() => {});
      return;
    }
    const a = document.createElement("a");
    a.href = foto;
    a.download = nome;
    a.click();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] overflow-hidden bg-tinta"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        ref={area}
        className="absolute inset-0 touch-none select-none"
        onPointerDown={apertar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
      >
        <video ref={video} playsInline muted className={`absolute inset-0 size-full object-cover ${frente ? "-scale-x-100" : ""}`} />
        {!erro && (
          <motion.img
            src={arteDoAnimal(animal)}
            alt={animal.nome}
            draggable={false}
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={MOLA_ENTRADA}
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${pos.tam * 100}%` }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_12px_12px_rgb(0_0_0/0.35)]"
          />
        )}
        {erro && (
          <div className="absolute inset-0 grid place-items-center p-8 text-center">
            <div className="flex flex-col items-center gap-3 rounded-xl bg-branco p-6">
              <Arte nome="ui/camera" className="size-16 opacity-60" />
              <p className="text-lg font-bold text-roxo">A câmera não abriu</p>
            </div>
          </div>
        )}
      </div>

      {/* flash da foto */}
      <AnimatePresence>
        {flash > 0 && (
          <motion.div
            key={flash}
            className="pointer-events-none absolute inset-0 bg-branco"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* topo: fechar e trocar de câmera */}
      <div className="absolute inset-x-0 top-0 flex justify-between p-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <BotaoRedondo aria-label="Fechar a câmera" onClick={onFechar}>
          <span className="text-2xl font-extrabold text-roxo">×</span>
        </BotaoRedondo>
        {!erro && (
          <BotaoRedondo aria-label="Trocar de câmera" onClick={() => setFrente((f) => !f)}>
            <span className="text-2xl font-extrabold text-roxo">⇄</span>
          </BotaoRedondo>
        )}
      </div>

      {/* botão de tirar foto */}
      {!erro && !foto && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-[max(env(safe-area-inset-bottom),1.5rem)]">
          <motion.button
            type="button"
            aria-label="Tirar foto"
            onClick={tirarFoto}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
            className="grid size-20 place-items-center rounded-full bg-branco ring-8 ring-branco/40"
          >
            <Arte nome="ui/camera" className="size-11" />
          </motion.button>
        </div>
      )}

      {/* foto tirada: ver, guardar ou tirar outra */}
      <AnimatePresence>
        {foto && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-tinta/80 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.img
              src={foto}
              alt={`Foto com ${animal.nome}`}
              initial={{ scale: 0.8, rotate: -4 }}
              animate={{ scale: 1, rotate: -2 }}
              transition={MOLA_ENTRADA}
              className="max-h-[65dvh] max-w-full rounded-lg border-8 border-branco shadow-2xl"
            />
            <div className="flex gap-4">
              <BotaoRedondo aria-label="Tirar outra" onClick={() => setFoto(null)} className="size-16">
                <span className="text-3xl font-extrabold text-roxo">↻</span>
              </BotaoRedondo>
              <BotaoRedondo aria-label="Guardar a foto" onClick={guardar} className="size-16 ring-4 ring-verde">
                <span className="text-3xl font-extrabold text-verde-escuro">↓</span>
              </BotaoRedondo>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
