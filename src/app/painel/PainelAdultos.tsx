"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { arteDoAnimal, ANIMAIS } from "@/content/animais";
import { PAISES } from "@/content/paises";
import { infoNivel } from "@/content/niveis";
import { TERRITORIOS, chaveFase, nivelAtual } from "@/content/jornada";
import { NIVEIS } from "@/games/nivelamento/Nivelamento";
import type { Progress } from "@/lib/progress";
import { usePerfil } from "@/lib/perfil";
import { Arte, BotaoRedondo, MOLA_ENTRADA, MOLA_TOQUE, NavInferior } from "@/components/ui";
import {
  carregar, cartasParaHoje, colocarNaFase, duracao, metricas, nomeAnimal, nomeFase, nomeJogo, quando, salvar,
  zerarCartas, zerarTudo, type Copia,
} from "./dados";

/**
 * PAINEL DOS ADULTOS (Pedro e Gabi)
 * Acompanha o aprendizado do Pietro: nível de leitura, tempo, lições, palavras difíceis, cartas.
 * E permite corrigir: colocar numa fase, refazer cartas, recomeçar, voltar a uma cópia anterior.
 * Uma tela só, sem rolagem: abas e listas paginadas.
 */
type Aba = "resumo" | "licoes" | "palavras" | "cartas" | "nivel" | "ajustes";
const ABAS: { id: Aba; nome: string; icone: string }[] = [
  { id: "resumo", nome: "Resumo", icone: "ui/estrela" },
  { id: "licoes", nome: "Lições", icone: "ui/mapa" },
  { id: "palavras", nome: "Palavras", icone: "ui/letras" },
  { id: "cartas", nome: "Cartas", icone: "ui/cartas" },
  { id: "nivel", nome: "Nível", icone: "ui/escada" },
  { id: "ajustes", nome: "Ajustes", icone: "ui/cadeado" },
];

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

export function PainelAdultos() {
  const perfil = usePerfil();
  const [aba, setAba] = useState<Aba>("resumo");
  const [dados, setDados] = useState<Progress | null>(null);
  const [copias, setCopias] = useState<Copia[]>([]);
  const [temBanco, setTemBanco] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState("");
  const [agora, setAgora] = useState(0);

  function aplicarCarregado(c: Awaited<ReturnType<typeof carregar>>) {
    setDados(c.dados);
    setCopias(c.copias);
    setTemBanco(c.temBanco);
    setAgora(Date.now());
    setCarregando(false);
  }
  async function recarregar() {
    setCarregando(true);
    aplicarCarregado(await carregar());
  }
  useEffect(() => {
    carregar().then(aplicarCarregado);
  }, []);

  async function aplicar(novo: Progress, motivo: string) {
    if (!dados) return;
    setDados(await salvar(dados, novo, motivo));
    setAviso(`Pronto: ${motivo.toLowerCase()}. Uma cópia de antes foi guardada.`);
    setTimeout(() => setAviso(""), 3500);
    const c = await carregar();
    setCopias(c.copias);
  }

  const m = dados ? metricas(dados, agora) : null;

  return (
    <div className="flex h-dvh flex-col gap-2 overflow-hidden px-3 sm:gap-3 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6">
      {/* Topo */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Arte nome="animais/leao" className="hidden size-9 shrink-0 sm:block" />
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-lg font-extrabold text-roxo sm:text-xl">Aprendizado do Pietro</h1>
            <p className="truncate text-xs text-tinta-suave">
              {perfil.nome} · {m?.ultima ? `última atividade ${quando(m.ultima)}` : "sem atividade registrada ainda"}
            </p>
          </div>
        </div>
        <BotaoRedondo aria-label="Atualizar" onClick={recarregar}>
          {/* ↻ diz "atualizar" melhor que um brilho; gira enquanto carrega */}
          <motion.span
            aria-hidden
            animate={carregando ? { rotate: 360 } : { rotate: 0 }}
            transition={carregando ? { repeat: Infinity, duration: 1, ease: "linear" } : MOLA_TOQUE}
            className="grid place-items-center text-2xl leading-none font-extrabold text-roxo"
          >
            ↻
          </motion.span>
        </BotaoRedondo>
      </div>

      {/* Abas */}
      <nav className="grid grid-cols-6 gap-1 rounded-lg bg-branco/70 p-1 shadow-suave">
        {ABAS.map((a) => (
          <motion.button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            aria-current={aba === a.id ? "page" : undefined}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.92 }}
            transition={MOLA_TOQUE}
            className="relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md py-1 text-[11px] font-bold text-roxo sm:flex-row sm:gap-2 sm:text-sm"
          >
            {aba === a.id && <motion.span layoutId="aba-painel" className="absolute inset-0 rounded-md bg-amarelo-claro" transition={MOLA_ENTRADA} />}
            <Arte nome={a.icone} className="relative size-5" />
            <span className="relative">{a.nome}</span>
          </motion.button>
        ))}
      </nav>

      {!temBanco && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOLA_ENTRADA}
          title="Sem conexão com o banco: mostrando só o que o Pietro jogou neste aparelho."
          className="flex items-center gap-1.5 truncate rounded-md bg-amarelo-claro px-2.5 py-1 text-[11px] text-tinta sm:text-xs"
        >
          <Arte nome="ui/cadeado" className="size-4 shrink-0" />
          <span className="truncate">
            Sem banco: só o que o Pietro jogou <b>neste aparelho</b>.
          </span>
        </motion.p>
      )}

      {/* Conteúdo */}
      <div className="relative min-h-0 flex-1">
        {carregando && !dados ? (
          <div className="grid h-full place-items-center text-tinta-suave">Carregando…</div>
        ) : !dados || !m ? (
          <div className="grid h-full place-items-center p-6 text-center text-tinta-suave">
            Ainda não há progresso do Pietro. Ele aparece aqui assim que o Pietro jogar{temBanco ? "" : " neste aparelho"}.
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={aba}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {aba === "resumo" && <Resumo m={m} fases={dados.fases} />}
              {aba === "licoes" && <Licoes m={m} />}
              {aba === "palavras" && <Palavras m={m} />}
              {aba === "cartas" && <CartasAba m={m} agora={agora} />}
              {aba === "nivel" && <NivelAba m={m} />}
              {aba === "ajustes" && <Ajustes dados={dados} copias={copias} aplicar={aplicar} />}
            </motion.div>
          </AnimatePresence>
        )}
        <AnimatePresence>
          {aviso && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 bottom-0 mx-auto w-fit rounded-full bg-verde px-4 py-2 text-sm font-bold text-branco shadow-suave"
            >
              {aviso}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <NavInferior />
    </div>
  );
}

type M = ReturnType<typeof metricas>;

// ── Peças ────────────────────────────────────────────────────────────────────

function Cartao({ titulo, children, className = "" }: { titulo?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`flex min-h-0 flex-col gap-1.5 rounded-lg bg-branco p-2.5 shadow-suave sm:gap-2 sm:p-3 ${className}`}>
      {titulo && <h2 className="text-xs font-extrabold tracking-wide text-tinta-suave uppercase">{titulo}</h2>}
      {children}
    </section>
  );
}

function Numero({ valor, rotulo, icone, extra }: { valor: ReactNode; rotulo: string; icone: string; extra?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-branco p-1.5 shadow-suave sm:p-2.5">
      <Arte nome={icone} className="size-7 shrink-0 sm:size-8" />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-lg font-extrabold text-roxo">{valor}</div>
        <div className="truncate text-[11px] text-tinta-suave">{rotulo}</div>
        {extra}
      </div>
    </div>
  );
}

/** Lista paginada (sem rolagem): mostra `porPagina` itens e setas para trocar. */
/** Altura de uma linha de lista (~44 px) e da barra de páginas (~56 px), para calcular quantas cabem. */
const LINHA_PX = 46;
const PAGINAS_PX = 58;

function Paginado<T>({ itens, porPagina: maximo, render, vazio }: { itens: T[]; porPagina: number; render: (t: T, i: number) => ReactNode; vazio: string }) {
  const [pag, setPag] = useState(0);
  // Sem rolagem: quantos itens cabem na altura disponível (mede o espaço real e recalcula ao girar a tela)
  const [caixa, setCaixa] = useState<HTMLDivElement | null>(null);
  const [cabem, setCabem] = useState(maximo);
  useEffect(() => {
    if (!caixa) return;
    const medir = () => {
      const h = caixa.clientHeight;
      const semBarra = Math.floor(h / LINHA_PX);
      setCabem(Math.max(2, Math.min(maximo, itens.length <= semBarra ? semBarra : Math.floor((h - PAGINAS_PX) / LINHA_PX))));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(caixa);
    return () => ro.disconnect();
  }, [caixa, maximo, itens.length]);
  const porPagina = cabem;
  const total = Math.max(1, Math.ceil(itens.length / porPagina));
  const p = Math.min(pag, total - 1);
  if (!itens.length) return <p className="py-4 text-center text-sm text-tinta-suave">{vazio}</p>;
  return (
    <div ref={setCaixa} className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={p}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12, transition: { duration: 0.12 } }}
          transition={MOLA_ENTRADA}
          className="flex flex-col divide-y divide-linha/60"
        >
          {itens.slice(p * porPagina, (p + 1) * porPagina).map(render)}
        </motion.ul>
      </AnimatePresence>
      {total > 1 && (
        <div className="mt-auto flex items-center justify-center gap-3 pt-1">
          <BotaoRedondo aria-label="Anterior" onClick={() => setPag(Math.max(0, p - 1))} className="disabled:opacity-40" disabled={p === 0}>
            <span className="text-lg font-extrabold text-roxo">‹</span>
          </BotaoRedondo>
          <span className="text-xs font-bold text-tinta-suave">
            {p + 1} / {total}
          </span>
          <BotaoRedondo aria-label="Próxima" onClick={() => setPag(Math.min(total - 1, p + 1))} className="disabled:opacity-40" disabled={p >= total - 1}>
            <span className="text-lg font-extrabold text-roxo">›</span>
          </BotaoRedondo>
        </div>
      )}
    </div>
  );
}

function Barras({ dados }: { dados: { rotulo: string; min: number }[] }) {
  const max = Math.max(10, ...dados.map((d) => d.min));
  return (
    <div className="flex h-14 items-end gap-1 sm:h-24 [@media(max-height:700px)]:h-11">
      {dados.map((d, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-0.5" title={`${d.rotulo}: ${d.min} min`}>
          <span className="text-[10px] font-bold text-roxo">{d.min > 0 ? d.min : ""}</span>
          <div className="flex min-h-0 w-full flex-1 items-end">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.min / max) * 100}%` }}
            transition={{ ...MOLA_ENTRADA, delay: i * 0.02 }}
            className={`w-full rounded-t ${i === dados.length - 1 ? "bg-amarelo" : "bg-roxo-claro"}`}
          />
          </div>
          <span className="text-[10px] text-tinta-suave">{d.rotulo.slice(0, 2)}</span>
        </div>
      ))}
    </div>
  );
}

function Medidor({ valor, rotulo }: { valor: number | null; rotulo: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-tinta-suave">{rotulo}</span>
        <b className="text-roxo">{pct(valor)}</b>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-linha/60">
        <motion.div initial={{ width: 0 }} animate={{ width: `${(valor ?? 0) * 100}%` }} transition={MOLA_ENTRADA} className="h-full rounded-full bg-verde" />
      </div>
    </div>
  );
}

// ── Abas ─────────────────────────────────────────────────────────────────────

function Resumo({ m, fases }: { m: M; fases: Progress["fases"] }) {
  const nj = infoNivel(nivelAtual(fases));
  const nv = m.nivel ? NIVEIS[m.nivel.nivel - 1] : null;
  const subiu = m.nivel && m.nivelAntes ? m.nivel.nivel - m.nivelAntes.nivel : 0;
  const evol = m.semErro !== null && m.semErroAntes !== null ? m.semErro - m.semErroAntes : null;
  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-1.5 sm:gap-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
        <Numero icone={nv?.icone ?? "ui/escada"} valor={nv?.nome ?? "Sem teste"} rotulo={m.nivel ? `Nível ${m.nivel.nivel} de 6${subiu ? ` (${subiu > 0 ? "+" : ""}${subiu})` : ""}` : "Faça o nivelamento"} />
        <Numero icone="ui/mapa" valor={`${m.concluidas}/${m.total}`} rotulo={`lições · ${m.territoriosCompletos} biomas completos`} />
        <Numero icone="ui/sol" valor={duracao(m.tempoHoje)} rotulo={`hoje · ${duracao(m.tempo7)} em 7 dias`} />
        <Numero icone="ui/estrela" valor={m.estrelas} rotulo={`estrelas · ${m.dominadas} palavras dominadas`} />
      </div>
      <Cartao titulo="Minutos por dia (14 dias)">
        <Barras dados={m.porDia} />
        <p className="text-[11px] text-tinta-suave [@media(max-height:700px)]:hidden">
          Jogou em {m.diasAtivos7} dos últimos 7 dias · lição concluída leva em média {m.mediaLicao ? duracao(m.mediaLicao) : "—"}
          {m.abandonadas ? ` · ${m.abandonadas} lições deixadas no meio` : ""}
        </p>
      </Cartao>
      <div className="grid min-h-0 grid-cols-1 gap-1.5 overflow-hidden sm:grid-cols-2 sm:gap-2">
        <Cartao titulo="Leitura (últimas 60 palavras)">
          <Medidor valor={m.semErro} rotulo="Acertou de primeira" />
          <Medidor valor={m.comDica === null ? null : 1 - m.comDica} rotulo="Sem precisar da dica" />
          {evol !== null && Math.round(evol * 100) !== 0 && (
            <p className={`text-xs font-bold ${evol >= 0 ? "text-verde-escuro" : "text-coral-escuro"}`}>
              {evol >= 0 ? "▲" : "▼"} {Math.abs(Math.round(evol * 100))} pontos vs. as 60 anteriores
            </p>
          )}
        </Cartao>
        <Cartao titulo="Próximo passo" className="text-xs sm:text-sm">
          <p className="flex items-center gap-1.5 text-tinta">
            <Arte nome={nj.icone} className="size-5 shrink-0" />
            <span>
              Nível da jornada: <b>{nj.n} · {nj.nome}</b>
            </span>
          </p>
          <p className="text-tinta">
            {m.proxima ? (
              <>
                Está em <b>{nomeFase(m.proxima)}</b>.
              </>
            ) : (
              "Completou toda a jornada!"
            )}
          </p>
          {m.dificeis[0] && (
            <p className="text-tinta">
              Mais difíceis agora: <b>{m.dificeis.slice(0, 3).map((d) => nomeAnimal(d.id)).join(", ")}</b>.
            </p>
          )}
          <p className="text-tinta">
            {m.paraHoje} {m.paraHoje === 1 ? "carta" : "cartas"} para revisar hoje.
          </p>
        </Cartao>
      </div>
    </div>
  );
}

function Licoes({ m }: { m: M }) {
  const [ver, setVer] = useState<"recentes" | "porLicao" | "tipos">("recentes");
  return (
    <div className="flex h-full flex-col gap-2">
      <Segmentos valor={ver} onChange={setVer} opcoes={[["recentes", "Recentes"], ["porLicao", "Por lição"], ["tipos", "Por exercício"]]} />
      <Cartao className="flex-1">
        {ver === "recentes" && (
          <Paginado
            itens={[...m.licoes].reverse()}
            porPagina={7}
            vazio="Nenhuma lição registrada ainda."
            render={(s, i) => (
              <li key={i} className="flex items-center gap-2 py-1.5 text-sm">
                <span className={`size-2 shrink-0 rounded-full ${s.concluida ? "bg-verde" : "bg-coral"}`} title={s.concluida ? "concluída" : "deixou no meio"} />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate font-bold text-roxo">{nomeFase(s.chave)}</div>
                  <div className="truncate text-[11px] text-tinta-suave">
                    {quando(s.inicio)} · {nomeJogo(s.jogo)} · {s.bichos?.length ?? 0} bichos
                  </div>
                </div>
                <div className="text-right text-xs leading-tight">
                  <div className="font-bold text-tinta">{duracao(s.fim - s.inicio)}</div>
                  <div className="text-tinta-suave">
                    {s.erros} erros{s.estrelas ? ` · ${"★".repeat(s.estrelas)}` : ""}
                  </div>
                </div>
              </li>
            )}
          />
        )}
        {ver === "porLicao" && (
          <Paginado
            itens={m.porLicao}
            porPagina={7}
            vazio="Nenhuma lição feita ainda."
            render={(l) => (
              <li key={l.chave} className="flex items-center gap-2 py-1.5 text-sm">
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate font-bold text-roxo">{l.nome}</div>
                  <div className="truncate text-[11px] text-tinta-suave">
                    {l.liberadaPeloAdulto ? "liberada no painel" : `${l.vezes}× · ${l.erros} erros no total`}
                  </div>
                </div>
                <div className="text-right text-xs leading-tight">
                  <div className="font-bold text-amarelo-escuro">{"★".repeat(l.estrelas)}{"☆".repeat(3 - l.estrelas)}</div>
                  <div className="text-tinta-suave">{l.tempoTotal ? duracao(l.tempoTotal) : "—"}</div>
                </div>
              </li>
            )}
          />
        )}
        {ver === "tipos" && (
          <ul className="flex flex-col gap-3">
            {m.porJogo.map((j) => (
              <li key={j.jogo} className="flex items-center gap-3">
                <Arte nome={j.icone} className="size-8 shrink-0" />
                <div className="flex-1">
                  <Medidor valor={j.semErro} rotulo={`${j.nome} · ${j.bichos} palavras · ${j.tempoMedio ? duracao(j.tempoMedio) : "—"} por palavra`} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}

function Palavras({ m }: { m: M }) {
  const [ver, setVer] = useState<"dificeis" | "todas">("dificeis");
  const itens = ver === "dificeis" ? m.dificeis : [...m.palavras].sort((a, b) => b.ultima - a.ultima);
  return (
    <div className="flex h-full flex-col gap-2">
      <Segmentos valor={ver} onChange={setVer} opcoes={[["dificeis", "Mais difíceis"], ["todas", "Todas"]]} />
      <Cartao className="flex-1">
        <Paginado
          itens={itens}
          porPagina={7}
          vazio={ver === "dificeis" ? "Nenhuma palavra com erro. 🎉" : "Nenhuma palavra lida ainda."}
          render={(w) => {
            const a = ANIMAIS.find((x) => x.id === w.id);
            return (
              <li key={w.id} className="flex items-center gap-2 py-1.5 text-sm">
                {a && <Arte src={arteDoAnimal(a)} className="size-8 shrink-0" />}
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate font-leitura font-bold text-roxo uppercase">{a ? a.silabas.join("·") : w.id}</div>
                  <div className="truncate text-[11px] text-tinta-suave">
                    {w.vezes}× · {duracao(w.mediaMs)} em média
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${w.mediaErros >= 2 ? "bg-coral/20 text-coral-escuro" : w.mediaErros > 0.5 ? "bg-amarelo-claro text-amarelo-escuro" : "bg-verde/15 text-verde-escuro"}`}>
                  {w.mediaErros.toFixed(1)} erros
                </span>
              </li>
            );
          }}
        />
      </Cartao>
    </div>
  );
}

function CartasAba({ m, agora }: { m: M; agora: number }) {
  const nomes = ["Nova/errou", "1 dia", "2 dias", "4 dias", "Dominada"];
  const ordenadas = [...m.cartas].sort((a, b) => a.caixa - b.caixa || a.proxima - b.proxima);
  const ultimas = m.sessoesCartas.slice(-5);
  const lidas = ultimas.reduce((s, x) => s + (x.lidas ?? 0), 0);
  const vistas = ultimas.reduce((s, x) => s + (x.vistas ?? 0), 0);
  return (
    <div className="flex h-full flex-col gap-2">
      <Cartao titulo={`Caixas (repetição espaçada) · ${m.paraHoje} para hoje`}>
        <div className="grid grid-cols-5 gap-1.5">
          {m.caixas.map((n, i) => (
            <div key={i} className="flex flex-col items-center rounded-md bg-fundo py-1.5">
              <span className="text-lg font-extrabold text-roxo">{n}</span>
              <span className="text-center text-[10px] leading-tight text-tinta-suave">{nomes[i]}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-tinta-suave">
          Últimas {ultimas.length} sessões: leu sozinho {vistas ? `${lidas} de ${vistas} (${pct(lidas / vistas)})` : "—"}
        </p>
      </Cartao>
      <Cartao className="flex-1">
        <Paginado
          itens={ordenadas}
          porPagina={6}
          vazio="Ainda não usou as cartas."
          render={(c) => (
            <li key={c.id} className="flex items-center gap-2 py-1.5 text-sm">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-roxo-claro text-xs font-extrabold text-roxo">{c.caixa}</span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate font-bold text-roxo">{nomeAnimal(c.id)}</div>
                <div className="truncate text-[11px] text-tinta-suave">
                  vista {c.vistas ?? "?"}× · sozinho {c.vistas ? pct((c.sozinho ?? 0) / c.vistas) : "—"}
                </div>
              </div>
              <span className="text-right text-[11px] text-tinta-suave">{c.proxima <= agora ? "revisar hoje" : `volta ${quando(c.proxima).slice(0, 5)}`}</span>
            </li>
          )}
        />
      </Cartao>
    </div>
  );
}

function NivelAba({ m }: { m: M }) {
  return (
    <div className="flex h-full flex-col gap-2">
      <Cartao titulo="Evolução do nível de leitura">
        {m.nivs.length ? (
          <div className="flex h-24 items-end gap-1.5 [@media(max-height:700px)]:h-16">
            {m.nivs.slice(-12).map((n, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-roxo">{n.nivel}</span>
                <div className="flex min-h-0 w-full flex-1 items-end">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(n.nivel / 6) * 100}%` }} transition={{ ...MOLA_ENTRADA, delay: i * 0.03 }} className="w-full rounded-t bg-roxo-claro" />
                </div>
                <span className="text-[10px] text-tinta-suave">{new Date(n.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-tinta-suave">Nenhum nivelamento ainda. Peça para o Pietro tocar em “Nível” no menu.</p>
        )}
      </Cartao>
      <Cartao titulo="Os 6 níveis" className="flex-1">
        <ul className="flex min-h-0 flex-1 flex-col justify-between gap-0.5">
          {NIVEIS.map((nv) => {
            const ac = m.nivel?.acertos[nv.n];
            const atual = m.nivel?.nivel === nv.n;
            return (
              <li key={nv.n} className={`flex items-center gap-2 rounded-md px-2 py-0.5 text-sm transition-colors duration-300 [@media(min-height:701px)]:py-1 ${atual ? "bg-amarelo-claro" : ""}`}>
                <Arte nome={nv.icone} className="size-5 [@media(min-height:701px)]:size-6" />
                <span className="flex-1 font-bold text-roxo">
                  {nv.n}. {nv.nome}
                </span>
                <span className="text-xs text-tinta-suave">{ac ? `${ac[0]}/${ac[1]} no último teste` : "—"}</span>
              </li>
            );
          })}
        </ul>
      </Cartao>
    </div>
  );
}

function Ajustes({ dados, copias, aplicar }: { dados: Progress; copias: Copia[]; aplicar: (p: Progress, motivo: string) => Promise<void> }) {
  const [pais, setPais] = useState(PAISES[0].id as string);
  const terrs = TERRITORIOS.filter((t) => t.pais === pais);
  const [terr, setTerr] = useState(terrs[0]?.id ?? "");
  const [fase, setFase] = useState(0);
  const [confirmar, setConfirmar] = useState<null | { texto: string; acao: () => Promise<void> }>(null);
  const tSel = TERRITORIOS.find((t) => t.id === terr) ?? terrs[0];

  function pedir(texto: string, acao: () => Promise<void>) {
    setConfirmar({ texto, acao });
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `progresso-pietro-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  function importar(f: File) {
    f.text().then((t) => {
      try {
        const p = JSON.parse(t) as Progress;
        if (!p || typeof p !== "object" || !("fases" in p)) throw new Error();
        pedir("Trocar o progresso atual pelo do arquivo?", () => aplicar(p, "Progresso importado de arquivo"));
      } catch {
        alert("Arquivo inválido.");
      }
    });
  }

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-2">
      <Cartao titulo="Colocar o Pietro numa lição">
        <div className="grid grid-cols-3 gap-1.5">
          <Seletor valor={pais} onChange={(v) => { setPais(v); const t = TERRITORIOS.find((x) => x.pais === v); setTerr(t?.id ?? ""); setFase(0); }} opcoes={PAISES.map((p) => [p.id, p.nome])} />
          <Seletor valor={tSel?.id ?? ""} onChange={(v) => { setTerr(v); setFase(0); }} opcoes={terrs.map((t) => [t.id, t.nome])} />
          <Seletor valor={String(fase)} onChange={(v) => setFase(Number(v))} opcoes={(tSel?.fases ?? []).map((f, i) => [String(i), f.titulo])} />
        </div>
        <p className="text-[11px] text-tinta-suave [@media(max-height:700px)]:hidden">As lições antes dela ficam liberadas (estrelas já ganhas são mantidas); dela em diante voltam a ficar por fazer. Figurinhas do álbum não mudam.</p>
        <Acao
          cor="roxo"
          onClick={() => tSel && pedir(`Colocar o Pietro em ${nomeFase(chaveFase(tSel.id, fase))}?`, () => aplicar(colocarNaFase(dados, chaveFase(tSel.id, fase)), `Colocado em ${nomeFase(chaveFase(tSel.id, fase))}`))}
        >
          Colocar nesta lição
        </Acao>
      </Cartao>
      <Cartao titulo="Outros ajustes">
        {/* uma linha só no celular, para sobrar altura com o rodapé */}
        <div className="grid grid-cols-4 gap-1.5 [&>button]:px-1.5 [&>button]:text-[11px] [&>button]:leading-tight sm:[&>button]:px-3 sm:[&>button]:text-sm">
          <Acao onClick={() => pedir("Deixar todas as cartas para revisar hoje?", () => aplicar(cartasParaHoje(dados), "Cartas liberadas para hoje"))}>Cartas para hoje</Acao>
          <Acao onClick={() => pedir("Zerar as cartas (todas voltam para a caixa 1)?", () => aplicar(zerarCartas(dados), "Cartas zeradas"))}>Zerar cartas</Acao>
          <Acao onClick={exportar}>Baixar cópia</Acao>
          <label className="grid cursor-pointer place-items-center rounded-md bg-fundo px-2 py-2 text-center text-xs font-bold text-roxo shadow-[0_3px_0_var(--color-linha)] active:translate-y-0.5">
            Carregar cópia
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])} />
          </label>
        </div>
        <Acao cor="perigo" onClick={() => pedir("Recomeçar do zero? (estrelas, fases, figurinhas e cartas; o histórico de acompanhamento fica)", () => aplicar(zerarTudo(dados), "Progresso recomeçado do zero"))}>
          Recomeçar do zero
        </Acao>
      </Cartao>
      <Cartao titulo="Voltar a um ponto anterior" className="min-h-0">
        <Paginado
          itens={copias}
          porPagina={3}
          vazio="Ainda não há cópias. Uma é guardada antes de cada ajuste e uma por dia."
          render={(c, i) => (
            <li key={i} className="flex items-center gap-2 py-1.5 text-sm">
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate font-bold text-roxo">{quando(c.data)}</div>
                <div className="truncate text-[11px] text-tinta-suave">
                  antes de: {c.motivo} · {Object.keys(c.dados?.fases ?? {}).length} lições · {c.dados?.animaisColetados?.length ?? 0} figurinhas
                </div>
              </div>
              <Acao onClick={() => pedir(`Voltar o progresso para como estava em ${quando(c.data)}?`, () => aplicar(c.dados, `Voltou para ${quando(c.data)}`))}>Voltar</Acao>
            </li>
          )}
        />
      </Cartao>

      <AnimatePresence>
        {confirmar && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-tinta/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmar(null)}>
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={MOLA_ENTRADA}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-branco p-5 text-center shadow-suave"
            >
              <p className="font-bold text-tinta">{confirmar.texto}</p>
              <p className="text-xs text-tinta-suave">Uma cópia do estado atual é guardada antes, para poder voltar.</p>
              <div className="grid grid-cols-2 gap-2">
                <Acao onClick={() => setConfirmar(null)}>Cancelar</Acao>
                <Acao
                  cor="roxo"
                  onClick={async () => {
                    const c = confirmar;
                    setConfirmar(null);
                    await c.acao();
                  }}
                >
                  Confirmar
                </Acao>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Acao({ children, onClick, cor = "neutro" }: { children: ReactNode; onClick: () => void; cor?: "neutro" | "roxo" | "perigo" }) {
  const estilo =
    cor === "roxo"
      ? "bg-roxo text-branco shadow-[0_3px_0_rgb(61_53_81/0.35)]"
      : cor === "perigo"
        ? "bg-coral/15 text-coral-escuro shadow-[0_3px_0_rgb(61_53_81/0.12)]"
        : "bg-fundo text-roxo shadow-[0_3px_0_var(--color-linha)]";
  return (
    <motion.button type="button" onClick={onClick} whileHover={{ y: -1 }} whileTap={{ scale: 0.95, y: 2 }} transition={MOLA_TOQUE} className={`min-h-12 rounded-md px-3 py-1.5 text-xs font-bold sm:text-sm ${estilo}`}>
      {children}
    </motion.button>
  );
}

function Seletor({ valor, onChange, opcoes }: { valor: string; onChange: (v: string) => void; opcoes: [string, string][] }) {
  return (
    <select value={valor} onChange={(e) => onChange(e.target.value)} className="h-12 min-w-0 rounded-md border border-linha bg-fundo px-2 text-xs font-bold text-roxo transition-[box-shadow,translate] duration-150 hover:-translate-y-px hover:shadow-suave focus:ring-2 focus:ring-amarelo focus:outline-none active:translate-y-px sm:text-sm">
      {opcoes.map(([v, n]) => (
        <option key={v} value={v}>
          {n}
        </option>
      ))}
    </select>
  );
}

function Segmentos<T extends string>({ valor, onChange, opcoes }: { valor: T; onChange: (v: T) => void; opcoes: [T, string][] }) {
  return (
    <div className="flex gap-1 rounded-md bg-branco/70 p-1 shadow-suave">
      {opcoes.map(([v, n]) => (
        <motion.button key={v} type="button" onClick={() => onChange(v)} whileTap={{ scale: 0.95 }} className="relative flex-1 rounded py-1 text-xs font-bold text-roxo">
          {valor === v && <motion.span layoutId={`seg-${opcoes[0][0]}`} className="absolute inset-0 rounded bg-amarelo-claro" transition={MOLA_ENTRADA} />}
          <span className="relative">{n}</span>
        </motion.button>
      ))}
    </div>
  );
}
