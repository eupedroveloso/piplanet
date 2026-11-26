import type { Progress, Sessao } from "./progress";

/**
 * Junta o progresso de dois aparelhos sem perder nada (usado no servidor a cada sincronização):
 * fases (melhor resultado), figurinhas (união), patinhas (maior), cartas (a revisada por último),
 * sessões e nivelamentos (união, sem repetir).
 */
export function mesclar(a: Partial<Progress>, b: Partial<Progress>): Progress {
  const fases: Progress["fases"] = { ...(a.fases ?? {}) };
  for (const [k, f] of Object.entries(b.fases ?? {})) {
    const x = fases[k];
    fases[k] = x
      ? {
          estrelas: Math.max(x.estrelas, f.estrelas) as 1 | 2 | 3,
          melhorPontos: Math.max(x.melhorPontos, f.melhorPontos),
          vezes: Math.max(x.vezes, f.vezes),
        }
      : f;
  }

  const cartas: Progress["cartas"] = { ...(a.cartas ?? {}) };
  for (const [id, c] of Object.entries(b.cartas ?? {})) {
    const x = cartas[id];
    const tx = x ? (x.ultima ?? 0) : -1;
    const tc = c.ultima ?? 0;
    if (!x || tc > tx || (tc === tx && (c.vistas ?? 0) > (x.vistas ?? 0))) cartas[id] = c;
  }

  const chaveSessao = (s: Sessao) => `${s.tipo}|${s.chave ?? ""}|${s.inicio}`;
  const sessoes = [...new Map([...(a.sessoes ?? []), ...(b.sessoes ?? [])].map((s) => [chaveSessao(s), s])).values()]
    .sort((x, y) => x.inicio - y.inicio)
    .slice(-400);

  const nivelamentos = [...new Map([...(a.nivelamentos ?? []), ...(b.nivelamentos ?? [])].map((n) => [n.data, n])).values()]
    .sort((x, y) => x.data.localeCompare(y.data))
    .slice(-30);

  return {
    patinhas: Math.max(a.patinhas ?? 0, b.patinhas ?? 0),
    animaisColetados: [...new Set([...(a.animaisColetados ?? []), ...(b.animaisColetados ?? [])])],
    fases,
    cartas,
    sessoes,
    nivelamentos,
    atualizadoEm: Math.max(a.atualizadoEm ?? 0, b.atualizadoEm ?? 0),
    corrigidoEm: Math.max(a.corrigidoEm ?? 0, b.corrigidoEm ?? 0) || undefined,
  };
}
