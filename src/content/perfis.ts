/**
 * PERFIS DA FAMÍLIA
 * O Pietro entra direto (sem senha). A conta Pais tem senha (padrão 0001; pode ser trocada
 * com SENHA_PAIS no ambiente), conferida no servidor.
 * Cada perfil tem o próprio progresso salvo no aparelho.
 */
export type PerfilId = "pietro" | "pais";

export interface Perfil {
  id: PerfilId;
  nome: string;
  /** Ilustração do avatar (public/arte/...). */
  avatar: string;
  temSenha: boolean;
  /** Todos os países, biomas e lições abertos (sem precisar completar a sequência). */
  tudoLiberado?: boolean;
}

export const PERFIS: Perfil[] = [
  { id: "pietro", nome: "Pietro", avatar: "mascote/pietro-rosto", temSenha: false },
  { id: "pais", nome: "Pais", avatar: "animais/coruja", temSenha: true, tudoLiberado: true },
];

export const perfilPorId = (id: string | null | undefined) => PERFIS.find((p) => p.id === id);

/** Nomes dos cookies da sessão. */
export const COOKIE_SESSAO = "pg_sessao";
export const COOKIE_PERFIL = "pg_perfil";
