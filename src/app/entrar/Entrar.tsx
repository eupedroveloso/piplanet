"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { PERFIS, type Perfil } from "@/content/perfis";
import { speak } from "@/lib/speech";
import { Arte, BALANCO, BotaoRedondo, MOLA_ENTRADA, MOLA_TOQUE } from "@/components/ui";

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

  // Quem não sabe ler ouve a pergunta assim que a tela aparece
  useEffect(() => {
    const t = setTimeout(() => speak("Quem vai jogar? Toque no seu bicho."), 600);
    return () => clearTimeout(t);
  }, []);

  async function entrar(p: Perfil, s = "") {
    setEnviando(true);
    const tentar = () =>
      fetch("/api/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil: p.id, senha: s }),
      }).catch(() => null);
    let r = await tentar();
    // perfil sem senha (Pietro): se falhar (rede/servidor), tenta de novo sem falar em senha
    if (!r?.ok && !p.temSenha) r = await tentar();
    setEnviando(false);
    if (r?.ok) {
      speak(`Oi, ${p.nome}!`);
      // recarrega a navegação inteira para o progresso do perfil certo ser lido
      window.location.assign("/");
      return;
    }
    if (!p.temSenha) {
      speak("Ops! Toque de novo no seu bicho.");
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
    <div className="flex h-dvh flex-col items-center justify-center gap-4 overflow-hidden px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)] sm:gap-8" style={{ background: "linear-gradient(180deg, #a9c1ff 0%, #cdd8ff 45%, #f1e8ff 100%)" }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={MOLA_ENTRADA} className="flex flex-col items-center gap-2">
        <motion.button
          type="button"
          aria-label="Quem vai jogar?"
          onClick={() => speak("Quem vai jogar? Toque no seu bicho.")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={MOLA_TOQUE}
          className="flex flex-col items-center gap-2"
        >
          <Arte nome="animais/coruja" className="size-20 animate-flutuar sm:size-24" />
          <h1 className="rounded-full bg-branco/90 px-5 py-1 text-2xl font-extrabold text-roxo shadow-suave sm:text-3xl">Quem vai jogar?</h1>
        </motion.button>
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
            <div className="flex w-full items-center gap-3">
              <BotaoRedondo aria-label="Voltar" fala="Voltar" onClick={() => setEscolhido(null)}>
                <Arte nome="ui/voltar" className="size-7" />
              </BotaoRedondo>
              <Arte nome={escolhido.avatar} className="size-12" />
              <span className="text-2xl font-extrabold text-roxo">{escolhido.nome}</span>
            </div>
            {/* bolinhas da senha */}
            <div className="flex h-6 items-center gap-2" aria-label={`${senha.length} dígitos`}>
              {Array.from({ length: Math.max(4, senha.length) }, (_, i) => (
                <motion.span
                  key={i}
                  animate={{ scale: i < senha.length ? [1, 1.35, 1] : 1 }}
                  transition={{ duration: 0.25 }}
                  className={`size-4 rounded-full transition-colors duration-200 ${i < senha.length ? "bg-roxo" : "bg-linha"}`}
                />
              ))}
            </div>
            <div className="grid w-full grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].map((d) => (
                <motion.button
                  key={d}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.9, y: 2 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
