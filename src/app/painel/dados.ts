"use client";

import { ANIMAIS } from "@/content/animais";
import { JOGOS, SEQUENCIA, TERRITORIOS, territorioPorId, type JogoId } from "@/content/jornada";
import type { Progress, Sessao } from "@/lib/progress";

/**
 * Dados do painel dos adultos: carrega o progresso do Pietro (banco e/ou aparelho),
 * calcula as métricas e aplica correções (sempre guardando uma cópia antes).
 */
/**
 * Criança acompanhada no painel (Pietro ou Pérola). O seletor do painel troca com escolherAlvo()
 * e depois recarrega.
 */
let ALVO = "pietro";
export const alvoAtual = () => ALVO;
export function escolherAlvo(id: string) {
  ALVO = id;
}
const CHAVE_LOCAL_DE = () => `pg:progress:v3:${ALVO}`;
const CHAVE_COPIAS_DE = () => `pg:copias:${ALVO}`;

export interface Copia {
  data: number;
  motivo: string;
  dados: Progress;
}

export const VAZIO: Progress = { patinhas: 0, animaisColetados: [], fases: {}, nivelamentos: [], cartas: {}, sessoes: [], atualizadoEm: 0 };

function lerLocal(): Progress | null {
  const raw = localStorage.getItem(CHAVE_LOCAL_DE()) ?? (ALVO === "pietro" ? localStorage.getItem("pg:progress:v3") : null);
  if (!raw) return null;
  try {
    return { ...VAZIO, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

function copiasLocais(): Copia[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_COPIAS_DE()) ?? "[]");
  } catch {
    return [];
  }
}

export interface Carregado {
  dados: Progress | null;
  copias: Copia[];
  temBanco: boolean;
}

export async function carregar(): Promise<Carregado> {
  const local = lerLocal();
  const r = await fetch(`/api/progresso?perfil=${ALVO}`, { cache: "no-store" }).catch(() => null);
  if (!r?.ok) return { dados: local, copias: copiasLocais(), temBanco: false };
  const j = (await r.json()) as { dados: Progress | null; copias: Copia[] };
  const servidor = j.dados ? { ...VAZIO, ...j.dados } : null;
  // com banco, a versão do servidor é a oficial (junta todos os aparelhos)
  const dados = servidor ?? local;
  return { dados, copias: [...(j.copias ?? [])].reverse(), temBanco: true };
}

/** Grava uma correção: no banco (que guarda a cópia anterior) e, se o Pietro joga neste aparelho, aqui também. */
export async function salvar(atual: Progress, novo: Progress, motivo: string) {
  const dados = { ...novo, atualizadoEm: Date.now() };
  const r = await fetch("/api/progresso", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ perfil: ALVO, dados, motivo, anterior: atual }),
  }).catch(() => null);
  if (!r?.ok) {
    // sem banco: cópia fica guardada neste aparelho
    const copias = [...copiasLocais(), { data: Date.now(), motivo, dados: atual }].slice(-30);
    localStorage.setItem(CHAVE_COPIAS_DE(), JSON.stringify(copias));
  }
  if (localStorage.getItem(CHAVE_LOCAL_DE()) !== null || !r?.ok) localStorage.setItem(CHAVE_LOCAL_DE(), JSON.stringify(dados));
  return dados;
}

// ── Correções ────────────────────────────────────────────────────────────────

/** Coloca o Pietro numa fase: tudo antes fica concluído (mantém estrelas já ganhas), dali em diante volta a ficar por fazer. */
export function colocarNaFase(p: Progress, chave: string): Progress {
  const alvo = SEQUENCIA.indexOf(chave);
  const fases: Progress["fases"] = {};
  SEQUENCIA.forEach((k, i) => {
    if (i < alvo) fases[k] = p.fases[k] ?? { estrelas: 1, melhorPontos: 0, vezes: 0 };
  });
  return { ...p, fases };
}

export const zerarCartas = (p: Progress): Progress => ({ ...p, cartas: {} });
export const cartasParaHoje = (p: Progress): Progress => ({
  ...p,
  cartas: Object.fromEntries(Object.entries(p.cartas).map(([id, c]) => [id, { ...c, proxima: 0 }])),
});
/** Recomeça do zero, mas mantém o histórico de sessões e nivelamentos (para não perder o acompanhamento). */
export const zerarTudo = (p: Progress): Progress => ({ ...VAZIO, sessoes: p.sessoes, nivelamentos: p.nivelamentos });

// ── Métricas ─────────────────────────────────────────────────────────────────

export const nomeAnimal = (id: string) => ANIMAIS.find((a) => a.id === id)?.nome ?? id;

export function nomeFase(chave?: string) {
  if (!chave) return "";
  const [t, f] = chave.split("/");
  const terr = territorioPorId(t);
  const fase = terr?.fases[Number(f)];
  return terr && fase ? `${terr.nome} · ${fase.titulo}` : chave;
}

export const nomeJogo = (j?: string) => (j && j in JOGOS ? JOGOS[j as JogoId].nome : j === undefined ? "" : j);

export function duracao(ms: number) {
  const min = Math.round(ms / 60000);
  if (ms < 60000) return `${Math.max(1, Math.round(ms / 1000))} s`;
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

const dia = (t: number) => new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
export const quando = (t: number) =>
  new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function metricas(p: Progress, agora: number) {
  const sessoes = p.sessoes ?? [];
  const tempo = (s: Sessao) => s.fim - s.inicio;
  const hoje0 = new Date(agora).setHours(0, 0, 0, 0);
  const DIA = 86400000;

  // minutos por dia (14 dias)
  const porDia = Array.from({ length: 14 }, (_, i) => {
    const ini = hoje0 - (13 - i) * DIA;
    const ms = sessoes.filter((s) => s.inicio >= ini && s.inicio < ini + DIA).reduce((t, s) => t + tempo(s), 0);
    return { rotulo: dia(ini), min: Math.round(ms / 60000) };
  });
  const tempoHoje = sessoes.filter((s) => s.inicio >= hoje0).reduce((t, s) => t + tempo(s), 0);
  const tempo7 = sessoes.filter((s) => s.inicio >= hoje0 - 6 * DIA).reduce((t, s) => t + tempo(s), 0);
  const diasAtivos7 = porDia.slice(-7).filter((d) => d.min > 0).length;

  // jornada
  const concluidas = SEQUENCIA.filter((k) => k in p.fases).length;
  const proxima = SEQUENCIA.find((k) => !(k in p.fases));
  const estrelas = Object.values(p.fases).reduce((s, f) => s + f.estrelas, 0);
  const territoriosCompletos = TERRITORIOS.filter((t) => t.fases.every((_, i) => `${t.id}/${i}` in p.fases)).length;

  // lições
  const licoes = sessoes.filter((s) => s.tipo === "fase");
  const bichos = licoes.flatMap((s) => (s.bichos ?? []).map((b) => ({ ...b, jogo: s.jogo, data: s.inicio })));
  const recentes = bichos.slice(-60);
  const semErro = recentes.length ? recentes.filter((b) => b.erros === 0).length / recentes.length : null;
  const comDica = recentes.length ? recentes.filter((b) => b.erros >= 2).length / recentes.length : null;
  const anteriores = bichos.slice(-120, -60);
  const semErroAntes = anteriores.length ? anteriores.filter((b) => b.erros === 0).length / anteriores.length : null;
  const abandonadas = licoes.filter((s) => !s.concluida).length;
  const mediaLicao = licoes.filter((s) => s.concluida).length
    ? licoes.filter((s) => s.concluida).reduce((t, s) => t + tempo(s), 0) / licoes.filter((s) => s.concluida).length
    : 0;

  // por tipo de exercício
  const porJogo = (Object.keys(JOGOS) as JogoId[]).map((j) => {
    const bs = bichos.filter((b) => b.jogo === j);
    return {
      jogo: j,
      nome: JOGOS[j].nome,
      icone: JOGOS[j].icone,
      bichos: bs.length,
      semErro: bs.length ? bs.filter((b) => b.erros === 0).length / bs.length : null,
      tempoMedio: bs.length ? bs.reduce((t, b) => t + b.ms, 0) / bs.length : 0,
    };
  });

  // bichos (palavras) por dificuldade
  const mapa = new Map<string, { id: string; vezes: number; erros: number; ms: number; ultima: number }>();
  for (const b of bichos) {
    const m = mapa.get(b.id) ?? { id: b.id, vezes: 0, erros: 0, ms: 0, ultima: 0 };
    m.vezes++;
    m.erros += b.erros;
    m.ms += b.ms;
    m.ultima = Math.max(m.ultima, b.data);
    mapa.set(b.id, m);
  }
  const palavras = [...mapa.values()].map((m) => ({ ...m, mediaErros: m.erros / m.vezes, mediaMs: m.ms / m.vezes }));
  const dificeis = [...palavras].filter((m) => m.erros > 0).sort((a, b) => b.mediaErros - a.mediaErros || b.vezes - a.vezes);
  const dominadas = palavras.filter((m) => m.vezes >= 2 && m.mediaErros < 0.5).length;

  // por lição (chave)
  const porLicao = SEQUENCIA.filter((k) => k in p.fases || licoes.some((s) => s.chave === k)).map((k) => {
    const ss = licoes.filter((s) => s.chave === k);
    return {
      chave: k,
      nome: nomeFase(k),
      estrelas: p.fases[k]?.estrelas ?? 0,
      liberadaPeloAdulto: p.fases[k]?.vezes === 0,
      vezes: ss.length,
      tempoTotal: ss.reduce((t, s) => t + tempo(s), 0),
      erros: ss.reduce((t, s) => t + s.erros, 0),
    };
  });

  // cartas
  const cartas = Object.entries(p.cartas).map(([id, c]) => ({ id, ...c }));
  const caixas = [1, 2, 3, 4, 5].map((n) => cartas.filter((c) => c.caixa === n).length);
  const paraHoje = cartas.filter((c) => c.proxima <= agora).length;
  const sessoesCartas = sessoes.filter((s) => s.tipo === "cartas");

  // nivelamento
  const nivs = p.nivelamentos ?? [];
  const nivel = nivs[nivs.length - 1];
  const nivelAntes = nivs[nivs.length - 2];

  return {
    porDia, tempoHoje, tempo7, diasAtivos7, concluidas, total: SEQUENCIA.length, proxima, estrelas, territoriosCompletos,
    licoes, semErro, semErroAntes, comDica, abandonadas, mediaLicao, porJogo, palavras, dificeis, dominadas, porLicao,
    cartas, caixas, paraHoje, sessoesCartas, nivs, nivel, nivelAntes, ultima: sessoes[sessoes.length - 1]?.fim,
  };
}
