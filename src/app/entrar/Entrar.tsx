"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { PERFIS, type Perfil } from "@/content/perfis";
import { speak } from "@/lib/speech";
import { Arte, BALANCO, MOLA_ENTRADA, MOLA_TOQUE } from "@/components/ui";

/**
 * TELA DE ENTRADA (escolha de perfil)
 * Pietro entra com um toque. Pedro e Gabi digitam a senha num teclado numérico grande.
 * Tudo com ícone e voz (o Pietro ainda não lê).
 */
export function Entrar() {
  const [escolhido, setEscolhido] = useState<Perfil | null>(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function entrar(p: Perfil, s = "") {
    setEnviando(true);
    const r = await fetch("/api/entrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perfil: p.id, senha: s }),
    }).catch(() => null);
    setEnviando(false);
    if (r?.ok) {
      speak(`Oi, ${p.nome}!`);
      // recarrega a navegação inteira para o progresso do perfil certo ser lido
      window.location.assign("/");
      return;
    }
    setErro(true);
    setSenha("");
    speak("Senha errada. Tente de novo.");
    setTimeout(() => setErro(false), 500);
  }

  function tocarPerfil(p: Perfil) {
    if (!p.temSenha) {
      entrar(p);
      return;
    }
    speak(`${p.nome}. Digite a senha.`);
    setEscolhido(p);
    setSenha("");
  }

  function digitar(d: string) {
    if (!escolhido || enviando) return;
    const nova = (senha + d).slice(0, 8);
    setSenha(nova);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-8" style={{ background: "linear-gradient(180deg, #a9c1ff 0%, #cdd8ff 45%, #f1e8ff 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={MOLA_ENTRADA} className="flex flex-col items-center gap-2">
        <Arte nome="animais/coruja" className="size-24 animate-flutuar" />
        <h1 className="rounded-full bg-branco/90 px-5 py-1 text-3xl font-extrabold text-roxo shadow-suave">Quem vai jogar?</h1>
      </motion.div>

      <AnimatePresence mode="wait">
        {!escolhido ? (
          <motion.div key="perfis" className="flex flex-wrap justify-center gap-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {PERFIS.map((p, i) => (
              <motion.button
                key={p.id}
                type="button"
                aria-label={p.nome}
                onClick={() => tocarPerfil(p)}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: p.temSenha ? 1 : [1, 1.05, 1] }}
                transition={
                  p.temSenha
                    ? { ...MOLA_ENTRADA, delay: i * 0.08 }
                    : { scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" }, default: { ...MOLA_ENTRADA, delay: i * 0.08 } }
                }
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.92 }}
                disabled={enviando}
                className={`flex flex-col items-center gap-2 rounded-xl bg-branco px-6 pt-5 pb-4 shadow-[0_8px_0_rgb(61_53_81/0.15)] ${
                  p.temSenha ? "w-36" : "w-44 ring-4 ring-amarelo"
                }`}
              >
                <span className={`grid place-items-center rounded-full bg-amarelo-claro ${p.temSenha ? "size-20" : "size-28"}`}>
                  <Arte nome={p.avatar} className={p.temSenha ? "size-14" : "size-20"} />
                </span>
                <span className="text-2xl font-extrabold text-roxo">{p.nome}</span>
                {p.temSenha && <Arte nome="ui/cadeado" className="size-5 opacity-60" />}
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="senha"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={erro ? { ...BALANCO, opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={erro ? { duration: 0.4 } : MOLA_ENTRADA}
            className="flex w-full max-w-xs flex-col items-center gap-4 rounded-xl bg-branco p-6 shadow-[0_8px_0_rgb(61_53_81/0.15)]"
          >
            <div className="flex items-center gap-3">
              <Arte nome={escolhido.avatar} className="size-12" />
              <span className="text-2xl font-extrabold text-roxo">{escolhido.nome}</span>
            </div>
            {/* bolinhas da senha */}
            <div className="flex h-6 items-center gap-2" aria-label={`${senha.length} dígitos`}>
              {Array.from({ length: Math.max(4, senha.length) }, (_, i) => (
                <span key={i} className={`size-4 rounded-full ${i < senha.length ? "bg-roxo" : "bg-linha"}`} />
              ))}
            </div>
            <div className="grid w-full grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].map((d) => (
                <motion.button
                  key={d}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  transition={MOLA_TOQUE}
                  disabled={enviando}
                  aria-label={d === "⌫" ? "Apagar" : d === "✓" ? "Entrar" : d}
                  onClick={() => {
                    if (d === "⌫") setSenha((s) => s.slice(0, -1));
                    else if (d === "✓") entrar(escolhido, senha);
                    else digitar(d);
                  }}
                  className={`h-14 rounded-lg text-2xl font-extrabold shadow-[0_4px_0_var(--color-linha)] ${
                    d === "✓" ? "bg-verde text-branco shadow-[0_4px_0_var(--color-verde-escuro)]" : "bg-fundo text-roxo"
                  }`}
                >
                  {d}
                </motion.button>
              ))}
            </div>
            <button type="button" onClick={() => setEscolhido(null)} className="text-sm font-bold text-tinta-suave" aria-label="Voltar">
              ← voltar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
