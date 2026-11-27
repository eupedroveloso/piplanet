"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Arte, BotaoRedondo, MOLA_ENTRADA } from "@/components/ui";

/**
 * GRÁFICOS DO PAINEL DOS ADULTOS
 * Leves (SVG/HTML próprios, sem biblioteca), com tokens do design system e entrada suave.
 * Texto mínimo de 12 px (text-xs). Público adulto: rótulos claros, sem truncar.
 */

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

// ── Moldura ──────────────────────────────────────────────────────────────────

/**
 * "?" discreto que abre uma explicação de 1 frase (toque abre/fecha; tocar fora fecha).
 * Visual de 22 px, mas a área de toque tem 48 px (margem negativa: não empurra o layout).
 */
export function Ajuda({ texto }: { texto: string }) {
  const [aberta, setAberta] = useState(false);
  const raiz = useRef<HTMLSpanElement>(null);
  // fecha ao tocar em qualquer ponto fora (listener no documento: funciona mesmo dentro de elementos com transform)
  useEffect(() => {
    if (!aberta) return;
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberta(false);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberta]);
  return (
    <span ref={raiz} className="relative -m-3 shrink-0">
      <motion.button
        type="button"
        aria-label="O que é isto?"
        aria-expanded={aberta}
        onClick={(e) => {
          e.stopPropagation();
          setAberta((a) => !a);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.88 }}
        className="grid size-12 place-items-center"
      >
        <span className={`grid size-[22px] place-items-center rounded-full text-xs font-extrabold transition-colors duration-200 ${aberta ? "bg-roxo text-branco" : "bg-roxo-claro text-roxo"}`}>?</span>
      </motion.button>
      <AnimatePresence>
        {aberta && (
          <>
            <motion.span
              role="tooltip"
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
              transition={MOLA_ENTRADA}
              onClick={() => setAberta(false)}
              className="absolute top-full right-1 z-40 w-56 rounded-xl bg-tinta px-3 py-2.5 text-left text-xs leading-snug font-semibold text-branco shadow-suave normal-case tracking-normal"
            >
              {texto}
            </motion.span>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}

export function Cartao({ titulo, ajuda, acao, children, className = "" }: { titulo?: string; ajuda?: string; acao?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex min-h-0 flex-col gap-3 rounded-2xl bg-branco p-4 shadow-suave ${className.includes("flex-1") ? "" : "shrink-0"} ${className}`}>
      {(titulo || acao || ajuda) && (
        <div className="flex items-center justify-between gap-2">
          {titulo && <h2 className="text-xs font-extrabold tracking-wide text-tinta-suave uppercase">{titulo}</h2>}
          <span className="flex items-center gap-2">
            {acao}
            {ajuda && <Ajuda texto={ajuda} />}
          </span>
        </div>
      )}
      {children}
    </section>
  );
}

/** Chip curto de tendência (▲ 56 min). Sem frase: o contexto vem do cartão. */
export function Tendencia({ delta, texto, invertido = false }: { delta: number | null; texto: string; invertido?: boolean }) {
  if (delta === null) return null;
  const igual = Math.abs(delta) < 1e-9;
  const bom = invertido ? delta < 0 : delta > 0;
  return (
    <span
      className={`w-fit rounded-full px-2 py-0.5 text-xs font-bold ${
        igual ? "bg-linha/70 text-tinta-suave" : bom ? "bg-verde/15 text-verde-escuro" : "bg-coral/15 text-coral-escuro"
      }`}
    >
      {igual ? "＝" : delta > 0 ? "▲" : "▼"} {texto}
    </span>
  );
}

/**
 * Cartão de indicador: rótulo que diz O QUE é e de QUAL período (pode quebrar em 2 linhas, sem truncar),
 * número grande com a unidade junto, chip de tendência e, se precisar, um "?" com 1 frase de explicação.
 */
export function KPI({
  icone,
  valor,
  unidade,
  rotulo,
  tendencia,
  ajuda,
  className = "",
}: {
  icone: string;
  valor: ReactNode;
  unidade?: string;
  rotulo: string;
  tendencia?: ReactNode;
  ajuda?: string;
  className?: string;
}) {
  const vazio = valor === "—";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={MOLA_ENTRADA}
      className={`flex min-w-0 shrink-0 flex-col gap-1.5 rounded-2xl bg-branco p-4 shadow-suave ${className}`}
    >
      <span className="flex items-start gap-1.5">
        <Arte nome={icone} className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 text-xs leading-snug font-bold text-tinta-suave">{rotulo}</span>
        {ajuda && <Ajuda texto={ajuda} />}
      </span>
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-2xl leading-none font-extrabold text-roxo">
          {valor}
          {unidade && !vazio && <span className="ml-1 text-sm font-bold text-tinta-suave">{unidade}</span>}
        </span>
        {tendencia}
      </span>
    </motion.div>
  );
}

// ── Gráficos ─────────────────────────────────────────────────────────────────

/** Anel (donut) de 0 a 1, com o número no meio. */
export function Anel({ valor, rotulo, cor = "stroke-verde", tamanho = 96 }: { valor: number | null; rotulo: string; cor?: string; tamanho?: number }) {
  const r = 40;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: tamanho, height: tamanho }}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="12" className="stroke-linha" />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            className={cor}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: valor ?? 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-xl font-extrabold text-roxo">{pct(valor)}</span>
      </div>
      <span className="text-center text-sm font-bold text-tinta-suave">{rotulo}</span>
    </div>
  );
}

/** Barras de minutos por dia, com linha de base, valor máximo e média tracejada. */
export function BarrasDias({ dados, preencher = false }: { dados: { rotulo: string; min: number }[]; preencher?: boolean }) {
  const max = Math.max(1, ...dados.map((d) => d.min));
  const ativos = dados.filter((d) => d.min > 0);
  const media = ativos.length ? ativos.reduce((s, d) => s + d.min, 0) / ativos.length : 0;
  const marcas = new Set([0, Math.floor(dados.length / 2), dados.length - 1]);
  return (
    <div className={`flex flex-col gap-1 ${preencher ? "min-h-0 flex-1" : ""}`}>
      <div className={`relative flex items-end gap-1 border-b-2 border-linha pt-4 ${preencher ? "min-h-12 flex-1" : "h-32 [@media(max-height:700px)]:h-[4.5rem]"}`}>
        <span className="absolute top-0 left-0 text-xs text-tinta-suave">{max} min</span>
        {media > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-amarelo-escuro/70"
            style={{ bottom: `calc(${(media / max) * 100}% * (1 - 1rem / 100%))` }}
          >
            <span className="absolute -top-5 right-0 rounded bg-branco/90 px-1 text-xs font-bold text-amarelo-escuro">média {Math.round(media)} min</span>
          </motion.div>
        )}
        {dados.map((d, i) => (
          <div key={i} className="flex h-full flex-1 items-end" title={`${d.rotulo}: ${d.min} min`}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.min / max) * 100}%` }}
              transition={{ ...MOLA_ENTRADA, delay: i * 0.02 }}
              className={`w-full rounded-t ${i === dados.length - 1 ? "bg-amarelo" : d.min ? "bg-roxo/70" : "bg-linha"}`}
              style={{ minHeight: d.min ? 3 : 2 }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {dados.map((d, i) => (
          <span key={i} className="flex-1 text-center text-xs text-tinta-suave">
            {marcas.has(i) ? (i === dados.length - 1 ? "hoje" : d.rotulo.slice(0, 5)) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Barra segmentada por nível: largura de cada nível = nº de lições; preenchimento = lições feitas. */
export function JornadaNiveis({ niveis, atual }: { niveis: { n: number; icone: string; nome: string; total: number; feitas: number }[]; atual: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {niveis.map((nv) => (
          <div key={nv.n} className="flex min-w-0 flex-col items-center gap-1" style={{ flexGrow: Math.sqrt(Math.max(1, nv.total)), flexBasis: 0 }}>
            <Arte nome={nv.icone} className={`size-6 ${nv.n > atual ? "opacity-40 grayscale" : ""}`} />
            <div className={`relative h-3.5 w-full overflow-hidden rounded-full bg-linha ${nv.n === atual ? "ring-2 ring-amarelo ring-offset-1" : ""}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${nv.total ? (nv.feitas / nv.total) * 100 : 0}%` }}
                transition={{ ...MOLA_ENTRADA, delay: nv.n * 0.06 }}
                className={`h-full rounded-full ${nv.feitas >= nv.total && nv.total ? "bg-verde" : "bg-roxo"}`}
              />
            </div>
            <span className={`text-xs font-bold ${nv.n === atual ? "text-roxo" : "text-tinta-suave"}`}>N{nv.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Barras horizontais (ex.: precisão por tipo de exercício). */
export function BarrasH({ itens }: { itens: { chave: string; icone: string; nome: string; valor: number | null; detalhe: string }[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {itens.map((it, i) => (
        <li key={it.chave} className="flex items-center gap-2.5">
          <Arte nome={it.icone} className="size-7 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-bold text-roxo">{it.nome}</span>
              <b className="text-roxo">{pct(it.valor)}</b>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-linha/70">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(it.valor ?? 0) * 100}%` }}
                transition={{ ...MOLA_ENTRADA, delay: i * 0.06 }}
                className="h-full rounded-full bg-verde"
              />
            </div>
            {it.detalhe && <span className="text-xs text-tinta-suave">{it.detalhe}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Mini linha do tempo das últimas sessões: altura = duração, cor = concluída ou deixada no meio. */
export function LinhaTempo({ sessoes }: { sessoes: { inicio: number; fim: number; concluida: boolean; rotulo: string }[] }) {
  if (!sessoes.length) return <p className="text-xs text-tinta-suave">Nenhuma sessão ainda.</p>;
  const max = Math.max(...sessoes.map((s) => s.fim - s.inicio), 1);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-16 items-end gap-1.5 border-b-2 border-linha">
        {sessoes.map((s, i) => (
          <motion.div
            key={i}
            title={s.rotulo}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(12, ((s.fim - s.inicio) / max) * 100)}%` }}
            transition={{ ...MOLA_ENTRADA, delay: i * 0.03 }}
            className={`flex-1 rounded-t ${s.concluida ? "bg-verde" : "bg-coral"}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-tinta-suave">
        <span>{new Date(sessoes[0].inicio).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
        <span>hoje</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-tinta">
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-verde" />concluída</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-coral" />parou no meio</span>
        <span className="ml-auto text-tinta-suave">altura = duração</span>
      </div>
    </div>
  );
}

/** Dispersão tempo × erros (cada ponto é uma palavra). */
export function Dispersao({ pontos, preencher = false }: { pontos: { id: string; x: number; y: number; rotulo: string }[]; preencher?: boolean }) {
  if (!pontos.length) return <p className="text-xs text-tinta-suave">Sem palavras lidas ainda.</p>;
  const mx = Math.max(...pontos.map((p) => p.x), 1);
  const my = Math.max(...pontos.map((p) => p.y), 1);
  return (
    <div className={`flex flex-col gap-1 ${preencher ? "min-h-0 flex-1" : ""}`}>
      <div className={`relative border-b-2 border-l-2 border-linha ${preencher ? "min-h-16 flex-1" : "h-40 [@media(max-height:700px)]:h-32"}`}>
        <span className="absolute top-0 left-1 text-xs text-tinta-suave">erros ↑</span>
        <span className="absolute right-1 bottom-1 z-10 rounded bg-branco/85 px-1 text-xs text-tinta-suave">tempo →</span>
        {pontos.map((p, i) => (
          <motion.span
            key={p.id}
            title={p.rotulo}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...MOLA_ENTRADA, delay: i * 0.01 }}
            className={`absolute size-3 -translate-x-1/2 translate-y-1/2 rounded-full ${p.y / my > 0.66 ? "bg-coral" : p.y / my > 0.33 ? "bg-amarelo" : "bg-verde"}`}
            style={{ left: `${4 + (p.x / mx) * 92}%`, bottom: `${4 + (p.y / my) * 88}%` }}
          />
        ))}
      </div>
    </div>
  );
}

const leituras = (n: number) => `${n} ${n === 1 ? "leitura" : "leituras"}`;

/**
 * Ranking de palavras (bichos): arte + nome, TOTAL de erros "em N leituras" e tempo por leitura em segundos
 * inteiros (sem casas decimais). A ordem e o tamanho da barra usam a proporção erros/leitura.
 */
export function RankingPalavras({
  itens,
  vazio = "Nenhuma ainda",
}: {
  itens: { id: string; nome: string; arte?: string; erros: number; vezes: number; ms: number }[];
  vazio?: string;
}) {
  if (!itens.length) return <p className="text-sm text-tinta-suave">{vazio}</p>;
  const peso = (i: { erros: number; vezes: number }) => i.erros / Math.max(1, i.vezes);
  const max = Math.max(1e-9, ...itens.map(peso));
  return (
    // em telas baixas (celular com barra do navegador) mostra só o top 3, para caber sem rolagem
    <ul className="flex flex-col gap-2.5 [@media(max-height:700px)]:[&>li:nth-child(n+4)]:hidden">
      {itens.map((it, k) => {
        const p = peso(it);
        const cor = p >= 2 ? "coral" : p > 0.5 ? "amarelo" : "verde";
        return (
          <motion.li
            key={it.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...MOLA_ENTRADA, delay: k * 0.05 }}
            className="flex items-center gap-2.5"
          >
            <span className="w-4 shrink-0 text-right text-xs font-extrabold text-tinta-suave">{k + 1}</span>
            {it.arte ? <Arte src={it.arte} className="size-8 shrink-0" /> : <span className="size-8 shrink-0" />}
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-bold text-roxo">{it.nome}</span>
                <span className="shrink-0 text-xs text-tinta-suave">
                  <b className={cor === "coral" ? "text-coral-escuro" : cor === "amarelo" ? "text-amarelo-escuro" : "text-verde-escuro"}>
                    {it.erros} {it.erros === 1 ? "erro" : "erros"}
                  </b>{" "}
                  em {leituras(it.vezes)}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-linha/70">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${(p / max) * 100}%` }}
                    transition={{ ...MOLA_ENTRADA, delay: k * 0.05 }}
                    className={`block h-full rounded-full ${cor === "coral" ? "bg-coral" : cor === "amarelo" ? "bg-amarelo" : "bg-verde"}`}
                  />
                </span>
                <span className="w-16 shrink-0 text-right text-xs text-tinta-suave">{Math.max(1, Math.round(it.ms / 1000))} s/leitura</span>
              </span>
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}

/** Barra empilhada (ex.: cartas por caixa). */
export function BarraEmpilhada({ valores, nomes, cores }: { valores: number[]; nomes: string[]; cores: string[] }) {
  const total = valores.reduce((s, v) => s + v, 0);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-5 overflow-hidden rounded-full bg-linha">
        {total > 0 &&
          valores.map((v, i) => (
            <motion.div
              key={i}
              title={`${nomes[i]}: ${v}`}
              initial={{ width: 0 }}
              animate={{ width: `${(v / total) * 100}%` }}
              transition={{ ...MOLA_ENTRADA, delay: i * 0.06 }}
              className={`h-full ${cores[i]}`}
            />
          ))}
      </div>
      <ul className="grid grid-cols-3 gap-x-3 gap-y-1">
        {valores.map((v, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs text-tinta">
            <i className={`size-3 shrink-0 rounded-sm ${cores[i]}`} />
            <span className="flex-1">{nomes[i]}</span>
            <b className="text-roxo">{v}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Linha de evolução (ex.: nível do nivelamento ao longo do tempo). */
export function LinhaEvolucao({ pontos, max, preencher = false }: { pontos: { rotulo: string; valor: number }[]; max: number; preencher?: boolean }) {
  if (!pontos.length) return <p className="text-xs text-tinta-suave">Nenhum resultado ainda.</p>;
  const n = pontos.length;
  const xy = pontos.map((p, i) => ({ x: n === 1 ? 50 : 6 + (i / (n - 1)) * 88, y: 92 - (p.valor / max) * 80 }));
  return (
    <div className={`flex flex-col gap-1 ${preencher ? "min-h-0 flex-1" : ""}`}>
      <div className={`relative ${preencher ? "min-h-28 flex-1" : "h-36 [@media(max-height:700px)]:h-28"}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
          {Array.from({ length: max }, (_, k) => (
            <line key={k} x1="0" x2="100" y1={92 - ((k + 1) / max) * 80} y2={92 - ((k + 1) / max) * 80} className="stroke-linha" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <motion.polyline
            points={xy.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            className="stroke-roxo"
            strokeWidth="3"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </svg>
        {xy.map((p, i) => (
          <motion.span
            key={i}
            title={`${pontos[i].rotulo}: nível ${pontos[i].valor}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...MOLA_ENTRADA, delay: 0.3 + i * 0.05 }}
            className={`absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xs font-extrabold ${i === n - 1 ? "bg-amarelo text-roxo" : "bg-roxo text-branco"}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {pontos[i].valor}
          </motion.span>
        ))}
      </div>
      <div className="flex justify-between text-xs text-tinta-suave">
        <span>{pontos[0].rotulo}</span>
        {n > 1 && <span>{pontos[n - 1].rotulo}</span>}
      </div>
    </div>
  );
}

// ── Seções: páginas no celular, 2 colunas no tablet/desktop ──────────────────

const assinar = (cb: () => void) => {
  const mq = window.matchMedia("(min-width: 768px) and (min-height: 700px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useLargo = () =>
  useSyncExternalStore(assinar, () => window.matchMedia("(min-width: 768px) and (min-height: 700px)").matches, () => false);

const MQ_BAIXA = "(max-height: 700px)";
const assinarBaixa = (cb: () => void) => {
  const mq = window.matchMedia(MQ_BAIXA);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
/** Tela baixa (celular com a barra do navegador, ~640 px): use para mover blocos para outra seção em vez de espremer. */
export const useTelaBaixa = () => useSyncExternalStore(assinarBaixa, () => window.matchMedia(MQ_BAIXA).matches, () => false);

/**
 * Divide a aba em seções. No celular: uma por vez, com bolinhas, setas e deslizar (sem rolagem).
 * No tablet/desktop: todas lado a lado em 2 colunas.
 */
export function Secoes({ secoes }: { secoes: { titulo: string; conteudo: ReactNode }[] }) {
  const largo = useLargo();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const atual = Math.min(i, secoes.length - 1);

  if (largo || secoes.length === 1) {
    return (
      <div className={`grid h-full min-h-0 content-start items-start gap-4 ${secoes.length > 1 ? "grid-cols-2" : ""} ${secoes.length >= 3 ? "lg:grid-cols-3" : ""}`}>
        {secoes.map((s) => (
          <div key={s.titulo} className="flex h-full min-h-0 flex-col gap-3">
            {s.conteudo}
          </div>
        ))}
      </div>
    );
  }

  const ir = (n: number) => {
    const novo = Math.max(0, Math.min(secoes.length - 1, n));
    if (novo === atual) return;
    setDir(novo > atual ? 1 : -1);
    setI(novo);
  };
  const soltar = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) ir(atual + 1);
    else if (info.offset.x > 60) ir(atual - 1);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={atual}
            custom={dir}
            variants={{
              entra: (d: number) => ({ opacity: 0, x: d * 40 }),
              fica: { opacity: 1, x: 0 },
              sai: (d: number) => ({ opacity: 0, x: d * -40, transition: { duration: 0.15 } }),
            }}
            initial="entra"
            animate="fica"
            exit="sai"
            transition={MOLA_ENTRADA}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={soltar}
            className="absolute inset-0 flex touch-pan-y flex-col gap-3"
          >
            {secoes[atual].conteudo}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <BotaoRedondo aria-label="Seção anterior" fala={false} onClick={() => ir(atual - 1)} disabled={atual === 0} className="disabled:opacity-40">
          <span className="text-lg font-extrabold text-roxo">‹</span>
        </BotaoRedondo>
        <div className="flex min-w-0 flex-col items-center gap-1">
          <span className="truncate text-sm font-extrabold text-roxo">{secoes[atual].titulo}</span>
          <div className="flex gap-1.5">
            {/* só indicador (as setas de 48 px fazem a troca) */}
            {secoes.map((s, k) => (
              <span
                key={s.titulo}
                aria-hidden
                className={`h-2 rounded-full transition-[width,background-color] duration-300 ${k === atual ? "w-5 bg-roxo" : "w-2 bg-roxo/25"}`}
              />
            ))}
          </div>
        </div>
        <BotaoRedondo aria-label="Próxima seção" fala={false} onClick={() => ir(atual + 1)} disabled={atual === secoes.length - 1} className="disabled:opacity-40">
          <span className="text-lg font-extrabold text-roxo">›</span>
        </BotaoRedondo>
      </div>
    </div>
  );
}
