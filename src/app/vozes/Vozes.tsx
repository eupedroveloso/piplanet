"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Arte, MOLA_TOQUE } from "@/components/ui";

/**
 * APROVAÇÃO DAS VOZES (só a conta Pais) — /vozes
 * Mostra todas as falas do jogo por tipo, com check nas aprovadas. Uma de cada vez: ouvir, aprovar,
 * refazer (gera de novo) ou marcar ruim. Atalhos: A aprova, R refaz, X ruim, espaço ouve, → pula.
 */
type Fala = { texto: string; tipo: string; status: string };
const ORDEM = ["Letras", "Sílabas", "Nomes dos bichos", "Palavras soletradas (cartas)", "Frases dos exercícios", "Instruções dos jogos", "Níveis", "Lugares (países e biomas)", "Curiosidades", "Contagens", "Interface e avisos"];
const st = (f: Fala) => (f.status === "aprovada" || f.status === "ruim" ? f.status : f.status === "nova" ? "nova" : "revisar");
const COR: Record<string, string> = { aprovada: "bg-verde/15 border-verde/40", revisar: "bg-amarelo-claro border-amarelo", ruim: "bg-coral/15 border-coral/50", nova: "bg-branco border-linha" };
const SIMB: Record<string, string> = { aprovada: "✓", revisar: "•", ruim: "✗", nova: "○" };

export function Vozes() {
  const [falas, setFalas] = useState<Fala[]>([]);
  const [voz, setVoz] = useState("");
  const [atualTexto, setAtualTexto] = useState<string | null>(null);
  const [puladas, setPuladas] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | "revisar" | "nova" | "ruim" | "aprovada">("todas");
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/vozes?lista=1")
      .then((r) => r.json())
      .then((j) => {
        setFalas(j.falas ?? []);
        setVoz(j.voz?.voz ?? "");
      })
      .catch(() => setMsg("Não consegui carregar a lista."));
  }, []);

  const cont = useMemo(() => {
    const c = { aprovada: 0, revisar: 0, ruim: 0, nova: 0 } as Record<string, number>;
    falas.forEach((f) => c[st(f)]++);
    return c;
  }, [falas]);

  function tocar(f: Fala) {
    if (!audio.current) audio.current = new Audio();
    audio.current.src = `/api/voz?t=${encodeURIComponent(f.texto)}&n=${Date.now()}`;
    audio.current.play().catch(() => setMsg("Toque em Ouvir para tocar."));
  }

  const atual = falas.find((f) => f.texto === atualTexto) ?? null;

  function proxima(menos?: string, puladasAgora = puladas, statusNovo?: [string, string]) {
    for (const tipo of ORDEM) {
      const f = falas.find((x) => {
        const s0 = statusNovo && x.texto === statusNovo[0] ? statusNovo[1] : x.status;
        return x.tipo === tipo && s0 !== "aprovada" && x.texto !== menos && !puladasAgora.has(x.texto);
      });
      if (f) return f;
    }
    return null;
  }

  function atualizar(texto: string, status: string) {
    setFalas((fs) => fs.map((x) => (x.texto === texto ? { ...x, status } : x)));
  }

  async function acao(f: Fala, a: "aprovar" | "ruim" | "refazer") {
    setOcupado(true);
    setMsg(a === "refazer" ? "Gerando a voz de novo…" : "");
    const r = await fetch("/api/vozes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto: f.texto, acao: a }) }).catch(() => null);
    setOcupado(false);
    if (!r?.ok) {
      const j = await r?.json().catch(() => ({}));
      setMsg(`⚠️ ${j?.erro ?? "falhou"}${a === "refazer" ? " (crédito do OpenRouter?)" : ""}`);
      return false;
    }
    setMsg("");
    atualizar(f.texto, a === "aprovar" ? "aprovada" : a === "ruim" ? "ruim" : "revisar");
    return true;
  }

  async function revisar(f: Fala | null) {
    setAtualTexto(f?.texto ?? null);
    if (!f) return;
    if (st(f) === "nova" && !(await acao(f, "refazer"))) return;
    tocar(f);
  }

  async function aprovar() {
    if (atual && (await acao(atual, "aprovar"))) revisar(proxima(atual.texto, puladas, [atual.texto, "aprovada"]));
  }
  async function ruim() {
    if (atual && (await acao(atual, "ruim"))) revisar(proxima(atual.texto));
  }
  async function refazer() {
    if (atual && (await acao(atual, "refazer"))) tocar(atual);
  }
  function pular() {
    if (!atual) return;
    const novas = new Set(puladas).add(atual.texto);
    setPuladas(novas);
    revisar(proxima(atual.texto, novas));
  }

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (!atual || ocupado) return;
      const k = e.key.toLowerCase();
      if (k === "a") aprovar();
      else if (k === "r") refazer();
      else if (k === "x") ruim();
      else if (k === " ") {
        e.preventDefault();
        tocar(atual);
      } else if (e.key === "ArrowRight") pular();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  const total = falas.length || 1;
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-fundo">
      <header className="flex flex-wrap items-center gap-4 border-b border-linha bg-branco px-5 py-3">
        <a href="/painel" className="flex items-center gap-2 font-extrabold text-roxo">
          <Arte nome="ui/som-ligado" className="size-7" /> Vozes do jogo
        </a>
        <div className="min-w-56 flex-1">
          <div className="flex h-3 overflow-hidden rounded-full bg-linha">
            <span className="bg-verde transition-all" style={{ width: `${(cont.aprovada / total) * 100}%` }} />
            <span className="bg-amarelo transition-all" style={{ width: `${(cont.revisar / total) * 100}%` }} />
            <span className="bg-coral transition-all" style={{ width: `${(cont.ruim / total) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-tinta-suave">
            {cont.aprovada} aprovadas de {falas.length} · {cont.revisar} para ouvir · {cont.ruim} ruins · {cont.nova} não geradas · voz: {voz.split(":")[0]}
          </p>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[380px_1fr]">
        {/* Uma fala de cada vez */}
        <section className="flex flex-col items-center justify-center gap-4 rounded-xl bg-branco p-6 text-center shadow-suave">
          {atual ? (
            <>
              <span className="text-xs font-bold tracking-wide text-tinta-suave uppercase">{atual.tipo}</span>
              <p className="text-3xl font-extrabold break-words text-roxo">{atual.texto}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Botao cor="bg-verde text-branco" onClick={aprovar} disabled={ocupado}>✓ Aprovar (A)</Botao>
                <Botao cor="bg-amarelo text-tinta" onClick={refazer} disabled={ocupado}>↻ Refazer (R)</Botao>
                <Botao cor="bg-roxo-claro text-roxo" onClick={() => tocar(atual)} disabled={ocupado}>🔊 Ouvir</Botao>
                <Botao cor="bg-roxo-claro text-roxo" onClick={pular} disabled={ocupado}>Pular →</Botao>
                <Botao cor="bg-coral/15 text-coral-escuro" onClick={ruim} disabled={ocupado}>✗ Ruim (X)</Botao>
              </div>
            </>
          ) : (
            <>
              <p className="text-xl font-extrabold text-roxo">{cont.aprovada === falas.length && falas.length ? "🎉 Tudo aprovado!" : "Uma fala de cada vez"}</p>
              <Botao cor="bg-verde text-branco" onClick={() => revisar(proxima())}>▶ Começar</Botao>
            </>
          )}
          <p className="min-h-5 text-sm text-tinta-suave">{msg}</p>
        </section>

        {/* Mapa de checks */}
        <section className="flex min-h-0 flex-col gap-3 rounded-xl bg-branco p-4 shadow-suave">
          <div className="flex flex-wrap gap-2">
            {([["todas", "Todas"], ["revisar", "Para ouvir"], ["nova", "Não geradas"], ["ruim", "Ruins"], ["aprovada", "Aprovadas"]] as const).map(([k, n]) => (
              <Botao key={k} cor={filtro === k ? "bg-roxo text-branco" : "bg-roxo-claro text-roxo"} onClick={() => setFiltro(k)}>{n}</Botao>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {ORDEM.map((tipo) => {
              const xs = falas.filter((f) => f.tipo === tipo);
              const vis = xs.filter((f) => filtro === "todas" || st(f) === filtro);
              if (!vis.length) return null;
              return (
                <div key={tipo} className="mb-4">
                  <h3 className="mb-2 flex justify-between text-sm font-extrabold text-roxo">
                    {tipo} <span className="font-bold text-tinta-suave">{xs.filter((f) => st(f) === "aprovada").length}/{xs.length} ✓</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {vis.map((f) => (
                      <button
                        key={f.texto}
                        type="button"
                        title={f.texto}
                        onClick={() => revisar(f)}
                        className={`flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-transform active:scale-95 ${COR[st(f)]} ${atualTexto === f.texto ? "ring-2 ring-roxo" : ""}`}
                      >
                        <b>{SIMB[st(f)]}</b>
                        <span className="max-w-72 truncate">{f.texto}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function Botao({ cor, children, onClick, disabled }: { cor: string; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button type="button" onClick={onClick} disabled={disabled} whileTap={{ scale: 0.95 }} transition={MOLA_TOQUE} className={`rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50 ${cor}`}>
      {children}
    </motion.button>
  );
}
