import { ANIMAIS, animalPorId, type Animal } from "@/content/animais";
import {
  animaisDaFase,
  BICHOS_POR_FASE,
  JOGOS,
  SEQUENCIA,
  TERRITORIOS,
  territorioPorId,
  type Fase,
  type JogoId,
  type Territorio,
} from "@/content/jornada";
import { nivelDoBicho } from "@/content/niveis";
import type { Progress, Sessao } from "./progress";

/**
 * ESTUDO DIÁRIO
 * Uma trilha curta por dia: 1) exercícios do dia → 2) reforçar as palavras com dificuldade → 3) conquista.
 *
 * Tudo é calculado a partir das sessões já gravadas (cada bicho de cada lição guarda os erros), então funciona
 * em qualquer aparelho e com o progresso antigo, sem dado novo para sincronizar.
 *
 * Palavra PARA REFORÇAR: errou em alguma leitura e, desde o último erro, ainda não leu 2 vezes seguidas sem errar.
 * Palavra SUPERADA: já esteve para reforçar e agora tem 2 leituras seguidas sem erro depois do último erro.
 */

export const ACERTOS_PARA_SUPERAR = 2;
export const PALAVRAS_POR_REFORCO = 5;

export type TipoEstudo = "estudo" | "reforco";

/** Dia local "AAAA-MM-DD". */
export function diaDe(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface Leitura {
  data: number;
  erros: number;
  tipo: Sessao["tipo"];
}

/** Todas as leituras de cada palavra (bicho), em ordem de tempo. */
export function leiturasPorPalavra(p: Progress): Map<string, Leitura[]> {
  const mapa = new Map<string, Leitura[]>();
  const sessoes = [...(p.sessoes ?? [])].sort((a, b) => a.inicio - b.inicio);
  for (const s of sessoes)
    for (const b of s.bichos ?? []) {
      const l = mapa.get(b.id) ?? [];
      l.push({ data: s.inicio, erros: b.erros, tipo: s.tipo });
      mapa.set(b.id, l);
    }
  return mapa;
}

export interface SituacaoPalavra {
  animal: Animal;
  leituras: Leitura[];
  /** Total de erros em todas as leituras. */
  erros: number;
  /** Erros na leitura em que mais errou ANTES de superar (o "antes"). */
  piorAntes: number;
  /** Erros na última leitura (o "agora"). */
  ultima: number;
  /** Leituras seguidas sem erro, contando da última para trás. */
  seguidasSemErro: number;
  estado: "reforcar" | "superada" | "sem-erro";
  /** Quando errou pela última vez (ms). */
  ultimoErro?: number;
}

export function situacaoDasPalavras(p: Progress): SituacaoPalavra[] {
  const out: SituacaoPalavra[] = [];
  for (const [id, leituras] of leiturasPorPalavra(p)) {
    const animal = animalPorId(id);
    if (!animal) continue;
    let seguidas = 0;
    for (let i = leituras.length - 1; i >= 0 && leituras[i].erros === 0; i--) seguidas++;
    const comErro = leituras.filter((l) => l.erros > 0);
    const estado = comErro.length === 0 ? "sem-erro" : seguidas >= ACERTOS_PARA_SUPERAR ? "superada" : "reforcar";
    out.push({
      animal,
      leituras,
      erros: leituras.reduce((t, l) => t + l.erros, 0),
      piorAntes: Math.max(0, ...comErro.map((l) => l.erros)),
      ultima: leituras[leituras.length - 1].erros,
      seguidasSemErro: seguidas,
      estado,
      ultimoErro: comErro[comErro.length - 1]?.data,
    });
  }
  return out;
}

/** Palavras para reforçar, das que mais precisam (mais erros, erro mais antigo primeiro) — no máximo `max`. */
export function palavrasParaReforcar(p: Progress, max = PALAVRAS_POR_REFORCO): SituacaoPalavra[] {
  return situacaoDasPalavras(p)
    .filter((s) => s.estado === "reforcar")
    .sort((a, b) => b.piorAntes - a.piorAntes || (a.ultimoErro ?? 0) - (b.ultimoErro ?? 0))
    .slice(0, max);
}

/** Como está o estudo de um dia: o que já foi feito (sessões concluídas daquele dia). */
export function estudoDoDia(p: Progress, dia = diaDe()) {
  const doDia = (p.sessoes ?? []).filter((s) => s.concluida && s.chave === dia);
  const exercicios = doDia.some((s) => s.tipo === "estudo");
  const reforco = doDia.some((s) => s.tipo === "reforco");
  return { exercicios, reforco, completo: exercicios && reforco, sessoes: doDia };
}

/** Dias seguidos (até hoje ou ontem) com o estudo completo. */
export function diasSeguidos(p: Progress, agora = Date.now()) {
  const completos = new Set<string>();
  const porDia = new Map<string, Set<string>>();
  for (const s of p.sessoes ?? []) {
    if (!s.concluida || (s.tipo !== "estudo" && s.tipo !== "reforco") || !s.chave) continue;
    const set = porDia.get(s.chave) ?? new Set();
    set.add(s.tipo);
    porDia.set(s.chave, set);
  }
  for (const [d, set] of porDia) if (set.size === 2) completos.add(d);
  let n = 0;
  let t = agora;
  if (!completos.has(diaDe(t))) t -= 86400000; // hoje ainda não fez: conta a sequência até ontem
  while (completos.has(diaDe(t))) {
    n++;
    t -= 86400000;
  }
  return n;
}

/** Número pseudoaleatório fixo para o dia (os exercícios do dia não mudam se ele sair e voltar). */
function sementeDoDia(dia: string) {
  let h = 2166136261;
  for (const c of dia) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function embaralharFixo<T>(lista: readonly T[], rnd: () => number): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const JOGOS_DO_ESTUDO: JogoId[] = ["le-e-acha", "monta-o-bicho", "monta-a-silaba"];

export interface PlanoRodada {
  territorio: Territorio;
  fase: Fase;
  fila: Animal[];
}

/** Onde a criança está na jornada (próxima fase a fazer), para o estudo usar o mesmo nível e cenário. */
function ondeEsta(p: Progress) {
  const chave = SEQUENCIA.find((k) => !(k in p.fases)) ?? SEQUENCIA[SEQUENCIA.length - 1];
  const [tid, i] = chave.split("/");
  const territorio = territorioPorId(tid) ?? TERRITORIOS[0];
  return { territorio, fase: territorio.fases[Number(i)] ?? territorio.fases[0] };
}

/**
 * Exercícios do dia: 5 palavras do nível em que ele está (as da fase atual + as que já leu),
 * com o tipo de jogo mudando a cada dia. Fixos para o dia.
 */
export function exerciciosDoDia(p: Progress, dia = diaDe()): PlanoRodada {
  const rnd = sementeDoDia(dia);
  const { territorio, fase } = ondeEsta(p);
  const jogo = JOGOS_DO_ESTUDO[Math.floor(rnd() * JOGOS_DO_ESTUDO.length)];
  const lidas = [...leiturasPorPalavra(p).keys()].map(animalPorId).filter((a): a is Animal => !!a);
  const daFase = animaisDaFase(territorio, fase);
  const pool = [...new Map([...daFase, ...lidas.filter((a) => nivelDoBicho(a) <= fase.nivel)].map((a) => [a.id, a])).values()];
  const fila = embaralharFixo(pool.length >= 3 ? pool : ANIMAIS.filter((a) => nivelDoBicho(a) === 1), rnd).slice(0, BICHOS_POR_FASE);
  return { territorio, fase: { ...fase, jogo, titulo: "Estudo do dia", frase: undefined }, fila };
}

/** Reforço: as palavras com dificuldade, montando sílaba por sílaba (o jogo que mais ajuda a fixar). */
export function reforcoDoDia(p: Progress): PlanoRodada | null {
  const palavras = palavrasParaReforcar(p);
  if (!palavras.length) return null;
  const { territorio, fase } = ondeEsta(p);
  return {
    territorio,
    fase: { ...fase, jogo: "monta-o-bicho", titulo: "Reforçar", frase: undefined },
    fila: palavras.map((s) => s.animal),
  };
}

export const nomeDoJogo = (j: JogoId) => JOGOS[j].nome;

// ── Para os Pais: melhora e o que fazer ──────────────────────────────────────

export interface Melhora {
  /** Palavras que ele superou: errava e agora lê sem errar (antes = pior leitura com erro, agora = 0). */
  superadas: SituacaoPalavra[];
  /** Palavras ainda em reforço, com quantas leituras seguidas sem erro já tem (de ACERTOS_PARA_SUPERAR). */
  emReforco: SituacaoPalavra[];
  /** Dias com estudo completo nos últimos 7. */
  diasDeEstudo7: number;
  diasSeguidos: number;
}

export function melhora(p: Progress, agora = Date.now()): Melhora {
  const sit = situacaoDasPalavras(p);
  const ultimos7 = new Set(Array.from({ length: 7 }, (_, i) => diaDe(agora - i * 86400000)));
  const porDia = new Map<string, Set<string>>();
  for (const s of p.sessoes ?? [])
    if (s.concluida && s.chave && ultimos7.has(s.chave) && (s.tipo === "estudo" || s.tipo === "reforco"))
      porDia.set(s.chave, (porDia.get(s.chave) ?? new Set()).add(s.tipo));
  return {
    superadas: sit.filter((s) => s.estado === "superada").sort((a, b) => b.piorAntes - a.piorAntes),
    emReforco: sit.filter((s) => s.estado === "reforcar").sort((a, b) => b.piorAntes - a.piorAntes),
    diasDeEstudo7: [...porDia.values()].filter((x) => x.size === 2).length,
    diasSeguidos: diasSeguidos(p, agora),
  };
}

export interface Recomendacao {
  /** Ícone de public/arte (ex.: "ui/coracao"). */
  icone: string;
  /** O que fazer, em uma frase direta. */
  acao: string;
  /** Por quê, com o número exato que levou à recomendação. */
  porque: string;
}

/** Sílabas que mais aparecem nas palavras com dificuldade (para treinar junto). */
function silabasDificeis(palavras: SituacaoPalavra[]) {
  const cont = new Map<string, number>();
  for (const s of palavras) for (const sil of new Set(s.animal.silabas.map((x) => x.toLowerCase()))) cont.set(sil, (cont.get(sil) ?? 0) + 1);
  return [...cont.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3);
}

/**
 * O QUE FAZER PARA ERRAR MENOS: até 4 ações concretas, das mais importantes, cada uma com o número que a justifica.
 * Só números exatos (sem médias com vírgula).
 */
export function recomendacoes(p: Progress, nome: string, agora = Date.now()): Recomendacao[] {
  const out: Recomendacao[] = [];
  const m = melhora(p, agora);
  const sessoes = p.sessoes ?? [];
  const nomes = (l: SituacaoPalavra[]) => l.slice(0, 3).map((s) => s.animal.nome.toUpperCase()).join(", ");

  // com o estudo de hoje já feito, a ação passa a ser a de amanhã (não pede de novo o que já foi feito)
  const hojeFeito = estudoDoDia(p, diaDe(agora)).completo;
  if (m.emReforco.length)
    out.push({
      icone: "ui/coracao",
      acao: `${hojeFeito ? "Amanhã, no Estudo do dia" : "Fazer o Estudo do dia"}: o Reforçar revisa ${nomes(m.emReforco)}${m.emReforco.length > 3 ? " e outras" : ""}.`,
      porque: `${m.emReforco.length} ${m.emReforco.length === 1 ? "palavra ainda tem" : "palavras ainda têm"} erro. Cada uma sai da lista depois de ${ACERTOS_PARA_SUPERAR} leituras seguidas sem errar.`,
    });

  const sil = silabasDificeis(m.emReforco);
  if (sil.length)
    out.push({
      icone: "ui/letras",
      acao: `Treinar junto as sílabas ${sil.map(([s]) => s.toUpperCase()).join(", ")}: apontar, falar o som e achar em outras palavras.`,
      porque: `Aparecem em ${sil[0][1]} das palavras em que ${nome} erra.`,
    });

  // jogo com mais erros (em bichos lidos nos últimos 30 dias)
  const desde = agora - 30 * 86400000;
  const porJogo = new Map<string, { bichos: number; comErro: number }>();
  for (const s of sessoes)
    if (s.inicio >= desde && s.jogo)
      for (const b of s.bichos ?? []) {
        const x = porJogo.get(s.jogo) ?? { bichos: 0, comErro: 0 };
        x.bichos++;
        if (b.erros > 0) x.comErro++;
        porJogo.set(s.jogo, x);
      }
  const pior = [...porJogo.entries()].filter(([, x]) => x.bichos >= 5).sort((a, b) => b[1].comErro / b[1].bichos - a[1].comErro / a[1].bichos)[0];
  if (pior && pior[1].comErro / pior[1].bichos >= 0.3) {
    const dica: Record<string, string> = {
      "le-e-acha": "ler a palavra em voz alta junto, sílaba por sílaba, antes de escolher o bicho",
      "monta-o-bicho": "bater palmas a cada sílaba do nome do bicho antes de montar",
      "monta-a-silaba": "falar o som de cada letra (não o nome) e juntar devagar: “vvv-a = va”",
      "monta-a-frase": "ouvir a frase e repetir junto, apontando cada palavra",
    };
    out.push({
      icone: JOGOS[pior[0] as JogoId]?.icone ?? "ui/lupa",
      acao: `No ${JOGOS[pior[0] as JogoId]?.nome ?? pior[0]}: ${dica[pior[0]] ?? "jogar junto e falar cada passo"}.`,
      porque: `Errou em ${pior[1].comErro} de ${pior[1].bichos} bichos nesse jogo (30 dias).`,
    });
  }

  if (m.diasDeEstudo7 < 4)
    out.push({
      icone: "ui/sol",
      acao: "Um Estudo do dia curto todo dia (uns 10 minutos) ajuda mais do que muito tempo de uma vez.",
      porque: `Estudo completo em ${m.diasDeEstudo7} de 7 dias.`,
    });

  const recentes = sessoes.filter((s) => s.inicio >= agora - 14 * 86400000 && s.tipo !== "cartas" && s.tipo !== "nivelamento");
  const largadas = recentes.filter((s) => !s.concluida).length;
  if (recentes.length >= 4 && largadas * 3 >= recentes.length)
    out.push({
      icone: "ui/mao",
      acao: "Ficar perto nas primeiras rodadas e parar no fim de uma rodada, nunca no meio.",
      porque: `Saiu no meio de ${largadas} de ${recentes.length} lições (14 dias).`,
    });

  return out.slice(0, 4);
}
