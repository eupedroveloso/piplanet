/**
 * PERFIS DA FAMÍLIA
 * As crianças (Pietro e Pérola) entram direto, sem senha. A conta Pais tem senha (padrão 0001; pode ser trocada
 * com SENHA_PAIS no ambiente), conferida no servidor.
 * Cada perfil tem o próprio progresso salvo no aparelho.
 */
export type PerfilId = "pietro" | "perola" | "pais" | "visitante";

export interface Perfil {
  id: PerfilId;
  nome: string;
  /** Ilustração do avatar (public/arte/...). */
  avatar: string;
  temSenha: boolean;
  /** Personagem explorador do perfil (arte em public/arte/mascote/<personagem>*.svg). */
  personagem: "pietro" | "perola";
  /** Gênero das falas e títulos ("Explorador" / "Exploradora", "sozinho" / "sozinha"). */
  genero: "m" | "f";
  /** Todos os países, biomas e lições abertos (sem precisar completar a sequência). */
  tudoLiberado?: boolean;
  /**
   * Visitante: só entra pelo link /visitante (não aparece na tela de entrada nem no painel dos Pais)
   * e o progresso fica só no aparelho (não vai para o banco).
   */
  visitante?: boolean;
}

export const PERFIS: Perfil[] = [
  { id: "pietro", nome: "Pietro", avatar: "mascote/pietro-rosto", temSenha: false, personagem: "pietro", genero: "m" },
  { id: "perola", nome: "Pérola", avatar: "mascote/perola-rosto", temSenha: false, personagem: "perola", genero: "f" },
  { id: "visitante", nome: "Visitante", avatar: "mascote/pietro-rosto", temSenha: false, personagem: "pietro", genero: "m", visitante: true, tudoLiberado: true },
  { id: "pais", nome: "Pais", avatar: "animais/coruja", temSenha: true, personagem: "pietro", genero: "m", tudoLiberado: true },
];

/** As crianças (perfis sem senha), acompanhadas pelos Pais no painel. */
export const CRIANCAS = () => PERFIS.filter((p) => !p.temSenha && !p.visitante);

/** Palavra no gênero do perfil: sozinho/sozinha, Explorador/Exploradora. */
export const noGenero = (g: "m" | "f", masc: string, fem: string) => (g === "f" ? fem : masc);

export const perfilPorId = (id: string | null | undefined) => PERFIS.find((p) => p.id === id);

/** Nomes dos cookies da sessão. */
export const COOKIE_SESSAO = "pg_sessao";
export const COOKIE_PERFIL = "pg_perfil";
