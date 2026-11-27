"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { arteDoAnimal, ANIMAIS } from "@/content/animais";
import { PAISES } from "@/content/paises";
import { infoNivel } from "@/content/niveis";
import { chaveFase, nivelAtual, TERRITORIOS } from "@/content/jornada";
import { NIVEIS } from "@/games/nivelamento/Nivelamento";
import type { Progress } from "@/lib/progress";
import {
  Arte,
  BotaoRedondo,
  MOLA_ENTRADA,
  MOLA_TOQUE,
  NavInferior,
  Esqueleto,
  Espera,
} from "@/components/ui";
import {
  carregar,
  cartasParaHoje,
  colocarNaFase,
  duracao,
  metricas,
  nomeAnimal,
  nomeFase,
  quando,
  salvar,
  zerarCartas,
  zerarTudo,
  type Copia,
  alvoAtual,
  escolherAlvo,
  useAlvo,
  VAZIO,
} from "./dados";
import { CRIANCAS, noGenero, perfilPorId } from "@/content/perfis";
import {
  Anel,
  BarraEmpilhada,
  BarrasDias,
  BarrasH,
  Cartao,
  RankingPalavras,
  KPI,
  LinhaEvolucao,
  LinhaTempo,
  Secoes,
  useTelaBaixa,
  Tendencia,
} from "./graficos";

/**
 * PAINEL DOS PAIS
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

/** Hora atual, lida só em efeitos e eventos (ao carregar/recarregar), nunca no render. */
const agoraMs = () => Date.now();

export function PainelAdultos() {
  const [aba, setAba] = useState<Aba>("resumo");
  const [dados, setDados] = useState<Progress | null>(null);
  const [copias, setCopias] = useState<Copia[]>([]);
  const [temBanco, setTemBanco] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState("");
  const [agora, setAgora] = useState(0);
  const alvo = useAlvo();
  const crianca = perfilPorId(alvo) ?? CRIANCAS()[0];

  // título da aba acompanha a criança escolhida
  useEffect(() => {
    document.title = `Aprendizado ${noGenero(crianca.genero, "do", "da")} ${crianca.nome} · Pietro Games`;
  }, [crianca]);

  /** Troca a criança acompanhada (Pietro ou Pérola) e recarrega os dados dela. */
  async function trocarCrianca(id: string) {
    if (id === alvo) return;
    escolherAlvo(id);
    setDados(null); // não mostra números da outra criança enquanto carrega
    setCarregando(true);
    aplicarCarregado(await carregar(), agoraMs());
  }

  function aplicarCarregado(
    c: Awaited<ReturnType<typeof carregar>>,
    em: number,
  ) {
    setDados(c.dados);
    setCopias(c.copias);
    setTemBanco(c.temBanco);
    setAgora(em);
    setCarregando(false);
  }
  async function recarregar() {
    setCarregando(true);
    aplicarCarregado(await carregar(), agoraMs());
  }
  useEffect(() => {
    carregar().then((c) => aplicarCarregado(c, agoraMs()));
  }, []);

  async function aplicar(novo: Progress, motivo: string) {
    setDados(await salvar(dados ?? VAZIO, novo, motivo));
    setAviso(
      `Pronto: ${motivo.toLowerCase()}. Uma cópia de antes foi guardada.`,
    );
    setTimeout(() => setAviso(""), 3500);
    const c = await carregar();
    setCopias(c.copias);
  }

  // Sem progresso ainda: os mesmos cartões, com "—" (métricas do progresso vazio)
  const base = dados ?? VAZIO;
  const m = metricas(base, agora);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-6xl flex-col gap-3 overflow-hidden px-4 pt-[max(env(safe-area-inset-top),0.75rem)] sm:gap-3 sm:px-6">
      {/* Topo */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {/* Seletor de criança: os rostos lado a lado; a escolhida fica em destaque */}
          <div
            role="tablist"
            aria-label="Criança"
            className="flex shrink-0 gap-1 rounded-full bg-branco/80 p-1 shadow-suave"
          >
            {CRIANCAS().map((c) => {
              const ativa = c.id === alvo;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={ativa}
                  aria-label={c.nome}
                  onClick={() => trocarCrianca(c.id)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={MOLA_TOQUE}
                  className="relative grid size-12 place-items-center rounded-full"
                >
                  {ativa && (
                    <motion.span
                      layoutId="crianca-painel"
                      transition={MOLA_ENTRADA}
                      className={`absolute inset-0 rounded-full ring-[3px] ${c.personagem === "perola" ? "bg-verde-claro ring-verde" : "bg-amarelo-claro ring-amarelo"}`}
                    />
                  )}
                  <Arte
                    nome={c.avatar}
                    className={`relative size-10 transition-[filter,opacity] duration-300 ${ativa ? "" : "opacity-60 grayscale-[0.5]"}`}
                  />
                </motion.button>
              );
            })}
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-lg font-extrabold text-roxo sm:text-xl">
              <span className="sm:hidden">{crianca.nome}</span>
              <span className="hidden sm:inline">
                Aprendizado {noGenero(crianca.genero, "do", "da")}{" "}
                {crianca.nome}
              </span>
            </h1>
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-tinta-suave">
              {/* curto para caber em 360 sem reticências */}
              <span>
                {m?.ultima
                  ? `última vez ${quando(m.ultima)}`
                  : "sem atividade ainda"}
              </span>
              {/* Só aparece em teste local (o servidor local não grava no banco, de propósito) */}
              {!temBanco && (
                <i
                  role="img"
                  aria-label="Teste local: só dados deste aparelho"
                  title="Teste local: só dados deste aparelho"
                  className="size-2 shrink-0 rounded-full bg-amarelo-escuro"
                />
              )}
            </p>
          </div>
        </div>
        <BotaoRedondo aria-label="Atualizar" onClick={recarregar}>
          {/* ↻ diz "atualizar" melhor que um brilho; gira enquanto carrega */}
          <motion.span
            aria-hidden
            animate={carregando ? { rotate: 360 } : { rotate: 0 }}
            transition={
              carregando
                ? { repeat: Infinity, duration: 1, ease: "linear" }
                : MOLA_TOQUE
            }
            className="grid place-items-center text-2xl leading-none font-extrabold text-roxo"
          >
            ↻
          </motion.span>
        </BotaoRedondo>
      </div>

      {/* Abas */}
      <nav className="grid shrink-0 grid-cols-6 gap-1 rounded-xl bg-branco/80 p-1 shadow-suave">
        {ABAS.map((a) => (
          <motion.button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            aria-current={aba === a.id ? "page" : undefined}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.92 }}
            transition={MOLA_TOQUE}
            className="relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-xs font-bold text-roxo sm:flex-row sm:gap-2 sm:text-sm"
          >
            {aba === a.id && (
              <motion.span
                layoutId="aba-painel"
                className="absolute inset-0 rounded-lg bg-amarelo-claro"
                transition={MOLA_ENTRADA}
              />
            )}
            <Arte nome={a.icone} className="relative size-5" />
            <span className="relative">{a.nome}</span>
          </motion.button>
        ))}
      </nav>

      {/* Conteúdo */}
      <div className="relative min-h-0 flex-1">
        {carregando && !dados ? (
          // Esqueleto dos cartões enquanto os dados chegam (nunca "—" ou vazio pela metade)
          <div
            role="status"
            aria-label="Carregando"
            className="grid content-start gap-3 md:grid-cols-2 md:gap-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Esqueleto key={i} className="h-[5.25rem]" />
              ))}
            </div>
            <Esqueleto className="h-44" />
            <Esqueleto className="hidden h-44 md:block" />
            <Esqueleto className="hidden h-44 md:block" />
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
              {aba === "resumo" && (
                <Resumo m={m} fases={base.fases} agora={agora} />
              )}
              {aba === "licoes" && <Licoes m={m} />}
              {aba === "palavras" && <Palavras m={m} />}
              {aba === "cartas" && <CartasAba m={m} agora={agora} />}
              {aba === "nivel" && <NivelAba m={m} />}
              {aba === "ajustes" && (
                <Ajustes dados={base} copias={copias} aplicar={aplicar} />
              )}
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

/** Altura de uma linha de lista (~44 px) e da barra de páginas (~56 px), para calcular quantas cabem. */
const LINHA_PX = 46;
const PAGINAS_PX = 58;

function Paginado<T>({
  itens,
  porPagina: maximo,
  render,
  vazio,
}: {
  itens: T[];
  porPagina: number;
  render: (t: T, i: number) => ReactNode;
  vazio: string;
}) {
  const [pag, setPag] = useState(0);
  // Sem rolagem: quantos itens cabem na altura disponível (mede o espaço real e recalcula ao girar a tela)
  const [caixa, setCaixa] = useState<HTMLDivElement | null>(null);
  const [cabem, setCabem] = useState(maximo);
  useEffect(() => {
    if (!caixa) return;
    const medir = () => {
      const h = caixa.clientHeight;
      const semBarra = Math.floor(h / LINHA_PX);
      setCabem(
        Math.max(
          1,
          Math.min(
            maximo,
            itens.length <= semBarra
              ? semBarra
              : Math.floor((h - PAGINAS_PX) / LINHA_PX),
          ),
        ),
      );
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(caixa);
    return () => ro.disconnect();
  }, [caixa, maximo, itens.length]);
  const porPagina = cabem;
  const total = Math.max(1, Math.ceil(itens.length / porPagina));
  const p = Math.min(pag, total - 1);
  if (!itens.length)
    return <p className="py-4 text-center text-sm text-tinta-suave">{vazio}</p>;
  return (
    <div
      ref={setCaixa}
      className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden"
    >
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
          <BotaoRedondo
            aria-label="Anterior"
            onClick={() => setPag(Math.max(0, p - 1))}
            className="disabled:opacity-40"
            disabled={p === 0}
          >
            <span className="text-lg font-extrabold text-roxo">‹</span>
          </BotaoRedondo>
          <span className="text-xs font-bold text-tinta-suave">
            {p + 1} / {total}
          </span>
          <BotaoRedondo
            aria-label="Próxima"
            onClick={() => setPag(Math.min(total - 1, p + 1))}
            className="disabled:opacity-40"
            disabled={p >= total - 1}
          >
            <span className="text-lg font-extrabold text-roxo">›</span>
          </BotaoRedondo>
        </div>
      )}
    </div>
  );
}

// ── Abas ─────────────────────────────────────────────────────────────────────
// Respiro SEM desperdício: cartões do tamanho do conteúdo, alinhados ao topo; cada página do
// celular é uma tela cheia de informação útil (KPIs compactos + um gráfico); nada de frases.

const DIA_MS = 86400000;

function Resumo({
  m,
  fases,
  agora,
}: {
  m: M;
  fases: Progress["fases"];
  agora: number;
}) {
  const vazio = !m.licoes.length && !m.sessoesCartas.length;
  const nAtual = nivelAtual(fases);
  const nj = infoNivel(nAtual, perfilPorId(alvoAtual())?.genero ?? "m");
  const min7 = m.porDia.slice(-7).reduce((s, d) => s + d.min, 0);
  const minAntes = m.porDia.slice(0, 7).reduce((s, d) => s + d.min, 0);
  const feitasEm = (de: number, ate: number) =>
    m.licoes.filter((s) => s.concluida && s.inicio >= de && s.inicio < ate)
      .length;
  const lic7 = feitasEm(agora - 7 * DIA_MS, agora + 1);
  const licAntes = feitasEm(agora - 14 * DIA_MS, agora - 7 * DIA_MS);
  const evol =
    m.semErro !== null && m.semErroAntes !== null
      ? m.semErro - m.semErroAntes
      : null;

  // em telas baixas o gráfico ganha uma seção própria (não fica espremido sob os 4 indicadores)
  const baixa = useTelaBaixa();
  const grafico = (
    <Cartao
      titulo="Minutos por dia, últimos 14 dias"
      className="min-h-0 flex-1"
    >
      <BarrasDias dados={m.porDia} preencher={!baixa} />
    </Cartao>
  );

  return (
    <Secoes
      secoes={[
        {
          titulo: "Últimos 7 dias",
          conteudo: (
            <>
              <div className="grid grid-cols-2 gap-3">
                <KPI
                  icone="ui/nivel"
                  rotulo="Tempo jogando (7 dias)"
                  valor={min7 ? duracao(min7 * 60000) : "—"}
                  tendencia={
                    vazio ? null : (
                      <Tendencia
                        delta={minAntes || min7 ? min7 - minAntes : null}
                        texto={`${Math.abs(min7 - minAntes)} min`}
                      />
                    )
                  }
                  ajuda="Soma do tempo nas lições e nas cartas nos últimos 7 dias. A seta compara com os 7 dias anteriores."
                />
                <KPI
                  icone="ui/bandeira"
                  rotulo="Dias que jogou (7 dias)"
                  valor={vazio ? "—" : m.diasAtivos7}
                  unidade="de 7"
                />
                <KPI
                  icone="ui/mapa"
                  rotulo="Lições concluídas (7 dias)"
                  valor={vazio ? "—" : lic7}
                  unidade={lic7 === 1 ? "lição" : "lições"}
                  tendencia={
                    vazio ? null : (
                      <Tendencia
                        delta={lic7 - licAntes}
                        texto={String(Math.abs(lic7 - licAntes))}
                      />
                    )
                  }
                  ajuda="Lições terminadas até o fim nos últimos 7 dias. A seta compara com os 7 dias anteriores."
                />
                <KPI
                  icone="ui/sol"
                  rotulo="Tempo jogando hoje"
                  valor={m.tempoHoje >= 60000 ? duracao(m.tempoHoje) : "—"}
                />
              </div>
              {!baixa && grafico}
            </>
          ),
        },
        ...(baixa ? [{ titulo: "Minutos por dia", conteudo: grafico }] : []),
        {
          titulo: "Leitura",
          conteudo: (
            <>
              <Cartao
                titulo="Leitura · últimas 60 palavras"
                ajuda="Cada palavra montada ou encontrada nas lições conta uma vez. Comparamos as 60 mais recentes com as 60 anteriores."
              >
                <div className="flex items-start justify-around gap-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <Anel valor={m.semErro} rotulo="Acertou de primeira" />
                    <Tendencia
                      delta={evol}
                      texto={
                        evol === null
                          ? ""
                          : `${Math.abs(Math.round(evol * 100))} pts`
                      }
                    />
                  </div>
                  {/* a dica automática saiu dos jogos: "com dica" agora é "precisou de 2+ tentativas" */}
                  <Anel
                    valor={m.comDica}
                    rotulo="Precisou de 2+ tentativas"
                    cor="stroke-coral"
                  />
                </div>
              </Cartao>
              <div className="grid grid-cols-2 gap-3">
                <KPI
                  icone="ui/estrela"
                  rotulo="Estrelas ganhas (total)"
                  valor={m.estrelas || "—"}
                  ajuda="Cada lição dá de 1 a 3 estrelas, conforme os erros; vale a melhor vez."
                />
                <KPI
                  icone={nj.icone}
                  rotulo={`Nível da jornada · ${nj.nome}`}
                  valor={nAtual}
                  unidade="de 5"
                  ajuda="Nível das palavras da próxima lição, de 1 (curtinhas) a 5 (gigantes). Veja o caminho na aba Jornada."
                />
              </div>
            </>
          ),
        },
      ]}
    />
  );
}

function Licoes({ m }: { m: M }) {
  const sessoes = m.licoes.slice(-16).map((s) => ({
    inicio: s.inicio,
    fim: s.fim,
    concluida: s.concluida,
    rotulo: `${nomeFase(s.chave)} · ${duracao(s.fim - s.inicio)}`,
  }));
  const feitas = m.licoes.filter((s) => s.concluida).length;
  return (
    <Secoes
      secoes={[
        {
          titulo: "Visão geral",
          conteudo: (
            <>
              <div className="grid grid-cols-2 gap-3">
                <KPI
                  icone="ui/mapa"
                  rotulo="Lições concluídas (desde o início)"
                  valor={m.licoes.length ? feitas : "—"}
                  unidade={feitas === 1 ? "lição" : "lições"}
                />
                <KPI
                  icone="ui/sol"
                  rotulo="Tempo médio por lição"
                  valor={m.mediaLicao ? duracao(m.mediaLicao) : "—"}
                  ajuda="Média das lições terminadas até o fim (as deixadas no meio não entram)."
                />
              </div>
              <Cartao
                titulo="Acertou de primeira, por tipo de exercício"
                ajuda="Porcentagem das palavras resolvidas sem nenhum erro em cada tipo de exercício, desde o início."
              >
                <BarrasH
                  itens={m.porJogo.map((j) => ({
                    chave: j.jogo,
                    icone: j.icone,
                    nome: j.nome,
                    valor: j.semErro,
                    detalhe: "",
                  }))}
                />
              </Cartao>
            </>
          ),
        },
        {
          titulo: "Histórico",
          conteudo: (
            <>
              <Cartao titulo="Últimas 16 sessões de lição">
                <LinhaTempo sessoes={sessoes} />
              </Cartao>
              <Cartao className="min-h-0 flex-1">
                <Paginado
                  itens={[...m.licoes].reverse()}
                  porPagina={8}
                  vazio="Sem atividade ainda"
                  render={(s, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 py-2 text-sm"
                    >
                      <span
                        className={`size-2.5 shrink-0 rounded-full ${s.concluida ? "bg-verde" : "bg-coral"}`}
                      />
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="truncate font-bold text-roxo">
                          {nomeFase(s.chave)}
                        </div>
                        <div className="truncate text-xs text-tinta-suave">
                          {quando(s.inicio)}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-tinta">
                        {duracao(s.fim - s.inicio)}
                      </span>
                    </li>
                  )}
                />
              </Cartao>
            </>
          ),
        },
        {
          titulo: "Por lição",
          conteudo: (
            <Cartao className="min-h-0 flex-1">
              <Paginado
                itens={m.porLicao}
                porPagina={8}
                vazio="Sem atividade ainda"
                render={(l) => (
                  <li
                    key={l.chave}
                    className="flex items-center gap-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-bold text-roxo">
                      {l.nome}
                    </span>
                    <span className="font-bold text-amarelo-escuro">
                      {"★".repeat(l.estrelas)}
                      {"☆".repeat(3 - l.estrelas)}
                    </span>
                  </li>
                )}
              />
            </Cartao>
          ),
        },
      ]}
    />
  );
}

const corErros = (e: number) =>
  e >= 2
    ? "bg-coral/20 text-coral-escuro"
    : e > 0.5
      ? "bg-amarelo-claro text-amarelo-escuro"
      : "bg-verde/15 text-verde-escuro";

function Palavras({ m }: { m: M }) {
  return (
    <Secoes
      secoes={[
        {
          titulo: "Visão geral",
          conteudo: (
            <>
              <div className="grid grid-cols-2 gap-3">
                <KPI
                  icone="ui/letras"
                  rotulo="Palavras já lidas (desde o início)"
                  valor={m.palavras.length || "—"}
                  unidade={m.palavras.length === 1 ? "palavra" : "palavras"}
                />
                <KPI
                  icone="ui/medalha"
                  rotulo="Palavras dominadas"
                  valor={m.palavras.length ? m.dominadas : "—"}
                  ajuda="Palavras lidas 2 vezes ou mais, quase sem erro (no máximo 1 erro a cada 2 leituras)."
                />
              </div>
              <Cartao
                titulo="Palavras mais difíceis (desde o início)"
                ajuda="Total de tentativas erradas e em quantas leituras a palavra apareceu, com o tempo de cada leitura. Das que mais erram por leitura para as que menos erram."
              >
                <RankingPalavras
                  vazio="Nenhuma palavra com erro ainda"
                  itens={m.dificeis.slice(0, 5).map((w) => {
                    const a = ANIMAIS.find((x) => x.id === w.id);
                    return {
                      id: w.id,
                      nome: nomeAnimal(w.id),
                      arte: a ? arteDoAnimal(a) : undefined,
                      erros: w.erros,
                      vezes: w.vezes,
                      ms: w.mediaMs,
                    };
                  })}
                />
              </Cartao>
            </>
          ),
        },
        {
          titulo: "Já domina e todas",
          conteudo: (
            <>
              <Cartao
                titulo="Já domina"
                ajuda="Palavras lidas 2 vezes ou mais, quase sem erro (no máximo 1 erro a cada 2 leituras)."
              >
                {m.dominadas ? (
                  <ul className="flex flex-wrap gap-2">
                    {m.palavras
                      .filter((w) => w.vezes >= 2 && w.mediaErros < 0.5)
                      .slice(0, 8)
                      .map((w, i) => {
                        const a = ANIMAIS.find((x) => x.id === w.id);
                        return (
                          <motion.li
                            key={w.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ ...MOLA_ENTRADA, delay: i * 0.03 }}
                            className="flex items-center gap-1.5 rounded-full bg-verde/15 py-1 pr-3 pl-1 text-sm font-bold text-verde-escuro"
                          >
                            {a && (
                              <Arte src={arteDoAnimal(a)} className="size-6" />
                            )}
                            {nomeAnimal(w.id)}
                          </motion.li>
                        );
                      })}
                  </ul>
                ) : (
                  <span className="text-2xl font-extrabold text-roxo">—</span>
                )}
              </Cartao>
              <Cartao
                titulo="Todas as palavras lidas"
                className="min-h-0 flex-1"
              >
                <Paginado
                  itens={[...m.palavras].sort(
                    (a, b) => b.mediaErros - a.mediaErros,
                  )}
                  porPagina={8}
                  vazio="Sem atividade ainda"
                  render={(w) => {
                    const a = ANIMAIS.find((x) => x.id === w.id);
                    return (
                      <li
                        key={w.id}
                        className="flex items-center gap-3 py-2 text-sm"
                      >
                        {a && (
                          <Arte
                            src={arteDoAnimal(a)}
                            className="size-8 shrink-0"
                          />
                        )}
                        <span className="min-w-0 flex-1 truncate font-leitura font-bold text-roxo uppercase">
                          {a ? a.silabas.join("·") : w.id}
                        </span>
                        <span className="shrink-0 text-right text-xs leading-tight text-tinta-suave">
                          <b
                            className={`rounded-full px-2 py-0.5 ${corErros(w.mediaErros)}`}
                          >
                            {w.erros} {w.erros === 1 ? "erro" : "erros"}
                          </b>{" "}
                          em {w.vezes} {w.vezes === 1 ? "leitura" : "leituras"}{" "}
                          · {Math.max(1, Math.round(w.mediaMs / 1000))} s
                        </span>
                      </li>
                    );
                  }}
                />
              </Cartao>
            </>
          ),
        },
      ]}
    />
  );
}

const NOMES_CAIXAS = ["Nova", "1 dia", "2 dias", "4 dias", "Dominada"];
const CORES_CAIXAS = [
  "bg-coral",
  "bg-amarelo",
  "bg-azul",
  "bg-roxo",
  "bg-verde",
];

export function CartasAba({ m, agora }: { m: M; agora: number }) {
  const ordenadas = [...m.cartas].sort(
    (a, b) => a.caixa - b.caixa || a.proxima - b.proxima,
  );
  const vistas = m.cartas.reduce((s, c) => s + (c.vistas ?? 0), 0);
  const sozinho = m.cartas.reduce((s, c) => s + (c.sozinho ?? 0), 0);
  const vazio = !m.cartas.length;
  return (
    <Secoes
      secoes={[
        {
          titulo: "Visão geral",
          conteudo: (
            <>
              <div className="grid grid-cols-2 gap-3">
                <KPI
                  icone="ui/cartas"
                  rotulo="Cartas para revisar hoje"
                  valor={vazio ? "—" : m.paraHoje}
                  unidade={m.paraHoje === 1 ? "carta" : "cartas"}
                />
                <KPI
                  icone="ui/medalha"
                  rotulo="Cartas dominadas (caixa 5)"
                  valor={vazio ? "—" : m.caixas[4]}
                  unidade={`de ${m.cartas.length}`}
                  ajuda="Uma carta é dominada quando foi lida certo várias vezes seguidas, em dias diferentes."
                />
                <KPI
                  className="col-span-2"
                  icone="ui/estrela"
                  rotulo="Leu sozinho (sem ouvir antes)"
                  valor={
                    vistas ? `${Math.round((sozinho / vistas) * 100)}%` : "—"
                  }
                  unidade={vistas ? `${sozinho} de ${vistas} vezes` : undefined}
                  ajuda="Vezes em que leu a carta antes de tocar no som, somando todas as cartas vistas até hoje."
                />
              </div>
              <Cartao
                titulo="Cartas por caixa (revisão espaçada)"
                ajuda="Acertou, a carta sobe de caixa e volta mais tarde (1, 2, 4 dias...). Errou, volta para a caixa 1 e aparece de novo logo."
              >
                <BarraEmpilhada
                  valores={m.caixas}
                  nomes={NOMES_CAIXAS}
                  cores={CORES_CAIXAS}
                />
              </Cartao>
            </>
          ),
        },
        {
          titulo: "Lista",
          conteudo: (
            <Cartao className="min-h-0 flex-1">
              <Paginado
                itens={ordenadas}
                porPagina={8}
                vazio="Sem atividade ainda"
                render={(c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 py-2 text-sm"
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold text-branco ${CORES_CAIXAS[c.caixa - 1] ?? "bg-roxo"}`}
                    >
                      {c.caixa}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate font-bold text-roxo">
                        {nomeAnimal(c.id)}
                      </span>
                      <span className="truncate text-xs text-tinta-suave">
                        vista {c.vistas ?? 0}× · leu{" "}
                        {noGenero(
                          perfilPorId(alvoAtual())?.genero ?? "m",
                          "sozinho",
                          "sozinha",
                        )}{" "}
                        {c.sozinho ?? 0}×
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs leading-tight text-tinta-suave">
                      {c.proxima <= agora ? (
                        <b className="text-roxo">revisar hoje</b>
                      ) : (
                        <>volta {quando(c.proxima).slice(0, 5)}</>
                      )}
                    </span>
                  </li>
                )}
              />
            </Cartao>
          ),
        },
      ]}
    />
  );
}

function NivelAba({ m }: { m: M }) {
  const dt = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  const subiu =
    m.nivel && m.nivelAntes ? m.nivel.nivel - m.nivelAntes.nivel : null;
  const nv = m.nivel ? NIVEIS[m.nivel.nivel - 1] : null;
  return (
    <Secoes
      secoes={[
        {
          titulo: "Visão geral",
          conteudo: (
            <>
              <div className="grid grid-cols-2 gap-3">
                <KPI
                  icone={nv?.icone ?? "ui/escada"}
                  rotulo={`Nível no último teste${nv ? ` · ${nv.nome}` : ""}`}
                  valor={m.nivel ? m.nivel.nivel : "—"}
                  unidade="de 6"
                  ajuda="Teste de leitura feito em Nível, no menu da criança. Vai de 1 (sílabas) a 6 (frases inteiras). A seta compara com o teste anterior."
                  tendencia={
                    <Tendencia
                      delta={subiu}
                      texto={subiu === null ? "" : String(Math.abs(subiu))}
                    />
                  }
                />
                <KPI
                  icone="ui/nivel"
                  rotulo="Testes de leitura feitos"
                  valor={m.nivs.length || "—"}
                  unidade={m.nivs.length === 1 ? "teste" : "testes"}
                />
              </div>
              <Cartao
                titulo="Nível em cada teste de leitura"
                className="min-h-0 flex-1"
              >
                <LinhaEvolucao
                  preencher
                  pontos={m.nivs
                    .slice(-10)
                    .map((n) => ({ rotulo: dt(n.data), valor: n.nivel }))}
                  max={6}
                />
              </Cartao>
            </>
          ),
        },
        {
          titulo: "Por nível",
          conteudo: (
            <Cartao titulo="Acertos no último teste, por nível">
              <ul className="flex flex-col gap-1">
                {NIVEIS.map((x) => {
                  const ac = m.nivel?.acertos[x.n];
                  return (
                    <li
                      key={x.n}
                      className={`flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-300 ${m.nivel?.nivel === x.n ? "bg-amarelo-claro" : ""}`}
                    >
                      <Arte nome={x.icone} className="size-7 shrink-0" />
                      <span className="w-6 text-lg font-extrabold text-roxo">
                        {x.n}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-linha">
                        <motion.span
                          initial={{ width: 0 }}
                          animate={{
                            width: `${ac ? (ac[0] / Math.max(1, ac[1])) * 100 : 0}%`,
                          }}
                          transition={{ ...MOLA_ENTRADA, delay: x.n * 0.05 }}
                          className="block h-full rounded-full bg-verde"
                        />
                      </span>
                      <span className="w-10 text-right text-xs font-bold text-tinta-suave">
                        {ac ? `${ac[0]}/${ac[1]}` : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Cartao>
          ),
        },
      ]}
    />
  );
}

function Ajustes({
  dados,
  copias,
  aplicar,
}: {
  dados: Progress;
  copias: Copia[];
  aplicar: (p: Progress, motivo: string) => Promise<void>;
}) {
  const [pais, setPais] = useState(PAISES[0].id as string);
  const terrs = TERRITORIOS.filter((t) => t.pais === pais);
  const [terr, setTerr] = useState(terrs[0]?.id ?? "");
  const [fase, setFase] = useState(0);
  const [confirmar, setConfirmar] = useState<null | {
    texto: string;
    acao: () => Promise<void>;
  }>(null);
  const tSel = TERRITORIOS.find((t) => t.id === terr) ?? terrs[0];
  const [esperando, setEsperando] = useState(false);

  function pedir(texto: string, acao: () => Promise<void>) {
    setConfirmar({ texto, acao });
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: "application/json",
    });
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
        pedir("Trocar o progresso atual pelo do arquivo?", () =>
          aplicar(p, "Progresso importado de arquivo"),
        );
      } catch {
        alert("Arquivo inválido.");
      }
    });
  }

  return (
    <>
      {/* Duas seções: corrigir (lição e outros ajustes) e voltar a uma cópia, com a altura toda para a lista */}
      <Secoes
        secoes={[
          {
            titulo: "Corrigir",
            conteudo: (
              <>
                <Cartao titulo="Colocar o Pietro numa lição">
                  <div className="grid grid-cols-3 gap-1.5">
                    <Seletor
                      valor={pais}
                      onChange={(v) => {
                        setPais(v);
                        const t = TERRITORIOS.find((x) => x.pais === v);
                        setTerr(t?.id ?? "");
                        setFase(0);
                      }}
                      opcoes={PAISES.map((p) => [p.id, p.nome])}
                    />
                    <Seletor
                      valor={tSel?.id ?? ""}
                      onChange={(v) => {
                        setTerr(v);
                        setFase(0);
                      }}
                      opcoes={terrs.map((t) => [t.id, t.nome])}
                    />
                    <Seletor
                      valor={String(fase)}
                      onChange={(v) => setFase(Number(v))}
                      opcoes={(tSel?.fases ?? []).map((f, i) => [
                        String(i),
                        f.titulo,
                      ])}
                    />
                  </div>
                  <p className="text-xs text-tinta-suave [@media(max-height:700px)]:hidden">
                    As lições antes dela ficam liberadas (estrelas já ganhas são
                    mantidas); dela em diante voltam a ficar por fazer.
                    Figurinhas do álbum não mudam.
                  </p>
                  <Acao
                    cor="roxo"
                    onClick={() =>
                      tSel &&
                      pedir(
                        `Colocar o Pietro em ${nomeFase(chaveFase(tSel.id, fase))}?`,
                        () =>
                          aplicar(
                            colocarNaFase(dados, chaveFase(tSel.id, fase)),
                            `Colocado em ${nomeFase(chaveFase(tSel.id, fase))}`,
                          ),
                      )
                    }
                  >
                    Colocar nesta lição
                  </Acao>
                </Cartao>
                <Cartao titulo="Outros ajustes">
                  {/* uma linha só no celular, para sobrar altura com o rodapé */}
                  <div className="grid grid-cols-4 gap-1.5 [&>button]:px-1.5 [&>button]:text-xs [&>button]:leading-tight sm:[&>button]:px-3 sm:[&>button]:text-sm">
                    <Acao
                      onClick={() =>
                        pedir("Deixar todas as cartas para revisar hoje?", () =>
                          aplicar(
                            cartasParaHoje(dados),
                            "Cartas liberadas para hoje",
                          ),
                        )
                      }
                    >
                      Cartas para hoje
                    </Acao>
                    <Acao
                      onClick={() =>
                        pedir(
                          "Zerar as cartas (todas voltam para a caixa 1)?",
                          () => aplicar(zerarCartas(dados), "Cartas zeradas"),
                        )
                      }
                    >
                      Zerar cartas
                    </Acao>
                    <Acao onClick={exportar}>Baixar cópia</Acao>
                    <label className="grid cursor-pointer place-items-center rounded-md bg-fundo px-2 py-2 text-center text-xs font-bold text-roxo shadow-[0_3px_0_var(--color-linha)] active:translate-y-0.5">
                      Carregar cópia
                      <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] && importar(e.target.files[0])
                        }
                      />
                    </label>
                  </div>
                  <Acao
                    cor="perigo"
                    onClick={() =>
                      pedir(
                        "Recomeçar do zero? (estrelas, fases, figurinhas e cartas; o histórico de acompanhamento fica)",
                        () =>
                          aplicar(
                            zerarTudo(dados),
                            "Progresso recomeçado do zero",
                          ),
                      )
                    }
                  >
                    Recomeçar do zero
                  </Acao>
                </Cartao>
              </>
            ),
          },
          {
            titulo: "Voltar a um ponto anterior",
            conteudo: (
              <Cartao
                titulo="Voltar a um ponto anterior"
                className="min-h-0 flex-1"
              >
                <Paginado
                  itens={copias}
                  porPagina={3}
                  vazio="Ainda não há cópias. Uma é guardada antes de cada ajuste e uma por dia."
                  render={(c, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 py-1.5 text-sm"
                    >
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="truncate font-bold text-roxo">
                          {quando(c.data)}
                        </div>
                        <div className="truncate text-xs text-tinta-suave">
                          antes de: {c.motivo} ·{" "}
                          {Object.keys(c.dados?.fases ?? {}).length} lições ·{" "}
                          {c.dados?.animaisColetados?.length ?? 0} figurinhas
                        </div>
                      </div>
                      <Acao
                        onClick={() =>
                          pedir(
                            `Voltar o progresso para como estava em ${quando(c.data)}?`,
                            () =>
                              aplicar(c.dados, `Voltou para ${quando(c.data)}`),
                          )
                        }
                      >
                        Voltar
                      </Acao>
                    </li>
                  )}
                />
              </Cartao>
            ),
          },
        ]}
      />

      <AnimatePresence>
        {confirmar && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-tinta/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !esperando && setConfirmar(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={MOLA_ENTRADA}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-branco p-5 text-center shadow-suave"
            >
              <p className="font-bold text-tinta">{confirmar.texto}</p>
              <p className="text-xs text-tinta-suave">
                Uma cópia do estado atual é guardada antes, para poder voltar.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Acao onClick={() => !esperando && setConfirmar(null)}>
                  Cancelar
                </Acao>
                <Acao
                  cor="roxo"
                  esperando={esperando}
                  onClick={async () => {
                    // fica aberto e desabilitado até terminar (sem toque duplo)
                    if (esperando) return;
                    setEsperando(true);
                    try {
                      await confirmar.acao();
                    } finally {
                      setEsperando(false);
                      setConfirmar(null);
                    }
                  }}
                >
                  Confirmar
                </Acao>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Acao({
  children,
  onClick,
  cor = "neutro",
  esperando = false,
}: {
  children: ReactNode;
  onClick: () => void;
  cor?: "neutro" | "roxo" | "perigo";
  /** Ação assíncrona em andamento: desabilita (sem toque duplo) e mostra o indicador. */
  esperando?: boolean;
}) {
  const estilo =
    cor === "roxo"
      ? "bg-roxo text-branco shadow-[0_3px_0_rgb(61_53_81/0.35)]"
      : cor === "perigo"
        ? "bg-coral/15 text-coral-escuro shadow-[0_3px_0_rgb(61_53_81/0.12)]"
        : "bg-fundo text-roxo shadow-[0_3px_0_var(--color-linha)]";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={esperando}
      aria-busy={esperando}
      whileHover={esperando ? undefined : { y: -1 }}
      whileTap={esperando ? undefined : { scale: 0.95, y: 2 }}
      transition={MOLA_TOQUE}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold disabled:cursor-wait disabled:opacity-80 sm:text-sm ${estilo}`}
    >
      {esperando && <Espera className="size-4" />}
      {children}
    </motion.button>
  );
}

function Seletor({
  valor,
  onChange,
  opcoes,
}: {
  valor: string;
  onChange: (v: string) => void;
  opcoes: [string, string][];
}) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 w-full min-w-0 truncate rounded-md border border-linha bg-fundo px-2 text-xs font-bold text-roxo transition-[box-shadow,translate] duration-150 hover:-translate-y-px hover:shadow-suave focus:ring-2 focus:ring-amarelo focus:outline-none active:translate-y-px sm:text-sm"
    >
      {opcoes.map(([v, n]) => (
        <option key={v} value={v}>
          {n}
        </option>
      ))}
    </select>
  );
}
