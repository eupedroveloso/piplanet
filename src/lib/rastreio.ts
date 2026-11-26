import { registrarSessao, type BichoSessao, type Sessao } from "./progress";

/**
 * Rastreia uma lição em andamento (tempo total, erros, tempo/erros por bicho) para o painel dos adultos.
 * Fica fora do React (objeto comum) para não ser tratado como estado de render.
 */
export class RastreioLicao {
  private atual: { inicio: number; inicioBicho: number; bichos: BichoSessao[]; erros: number } | null = null;

  constructor(private base: Pick<Sessao, "tipo" | "chave" | "jogo">) {}

  comecar() {
    this.fechar(false);
    const agora = Date.now();
    this.atual = { inicio: agora, inicioBicho: agora, bichos: [], erros: 0 };
  }

  erro() {
    if (this.atual) this.atual.erros++;
  }

  bichoResolvido(id: string, erros: number) {
    if (!this.atual) return;
    const agora = Date.now();
    this.atual.bichos.push({ id, erros, ms: agora - this.atual.inicioBicho });
    this.atual.inicioBicho = agora;
  }

  proximoBicho() {
    if (this.atual) this.atual.inicioBicho = Date.now();
  }

  fechar(concluida: boolean, estrelas?: number) {
    const r = this.atual;
    if (!r) return;
    this.atual = null;
    registrarSessao({ ...this.base, inicio: r.inicio, fim: Date.now(), concluida, erros: r.erros, estrelas, bichos: r.bichos });
  }
}

/** Rastreia uma sessão de cartas. */
export class RastreioCartas {
  private atual: { inicio: number; lidas: number; vistas: number } | null = null;

  comecar() {
    this.fechar();
    this.atual = { inicio: Date.now(), lidas: 0, vistas: 0 };
  }

  carta(leuSozinho: boolean) {
    if (!this.atual) return;
    this.atual.vistas++;
    if (leuSozinho) this.atual.lidas++;
  }

  fechar() {
    const r = this.atual;
    if (!r) return;
    this.atual = null;
    registrarSessao({ tipo: "cartas", inicio: r.inicio, fim: Date.now(), concluida: r.vistas > 0, erros: r.vistas - r.lidas, lidas: r.lidas, vistas: r.vistas });
  }
}
