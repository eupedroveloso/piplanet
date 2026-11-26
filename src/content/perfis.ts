/**
 * PERFIS DA FAMÍLIA
 * O Pietro entra direto (sem senha). Pedro e Gabi têm senha (padrão 0001; pode ser trocada
 * com SENHA_PEDRO / SENHA_GABI no ambiente), conferida no servidor.
 * Cada perfil tem o próprio progresso salvo no aparelho.
 */
export type PerfilId = "pietro" | "pedro" | "gabi";

export interface Perfil {
  id: PerfilId;
  nome: string;
  /** Ilustração do avatar (public/arte/...). */
  avatar: string;
  temSenha: boolean;
}

export const PERFIS: Perfil[] = [
  { id: "pietro", nome: "Pietro", avatar: "animais/leao", temSenha: false },
  { id: "pedro", nome: "Pedro", avatar: "animais/lobo", temSenha: true },
  { id: "gabi", nome: "Gabi", avatar: "animais/raposa", temSenha: true },
];

export const perfilPorId = (id: string | null | undefined) => PERFIS.find((p) => p.id === id);

/** Nomes dos cookies da sessão. */
export const COOKIE_SESSAO = "pg_sessao";
export const COOKIE_PERFIL = "pg_perfil";
