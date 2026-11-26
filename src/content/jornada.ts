import { ANIMAIS, type Animal, type TerritorioId } from "./animais";
import { infoNivel, nivelDoBicho, type NivelJornada } from "./niveis";
import type { TamanhoFrase } from "./frases";
import { PAISES, type PaisId, type TipoBioma } from "./paises";

/**
 * A JORNADA
 * Planeta → países → biomas (territórios) → fases. Cada bioma tem bichos, cores e cenário próprios.
 * A leitura sobe numa escada ÚNICA pela jornada inteira (níveis 1 a 5, ver content/niveis.ts):
 * começa com palavras curtinhas na Fazenda e termina com palavras gigantes na África. Nunca volta para trás.
 * As fases se desbloqueiam em sequência, atravessando os territórios.
 */

export type JogoId = "le-e-acha" | "monta-o-bicho" | "monta-a-silaba" | "monta-a-frase";

/** Os três exercícios, intercalados nessa ordem em cada nível de dificuldade. */
export const JOGOS: Record<JogoId, { nome: string; icone: string; instrucao: string }> = {
  "le-e-acha": {
    nome: "Lê e Acha",
    icone: "ui/lupa",
    instrucao: "Leia a palavra e ache o bicho!",
  },
  "monta-o-bicho": {
    nome: "Monta o Bicho",
    icone: "ui/quebra-cabeca",
    instrucao: "Junte as sílabas e monte o nome do bicho!",
  },
  "monta-a-silaba": {
    nome: "Monta a Sílaba",
    icone: "ui/letras",
    instrucao: "Junte as letras e forme as sílabas!",
  },
  "monta-a-frase": {
    nome: "Monta a Frase",
    icone: "ui/frase",
    instrucao: "Ouça a frase e coloque as palavras na ordem!",
  },
};
const ORDEM_JOGOS: JogoId[] = ["le-e-acha", "monta-o-bicho", "monta-a-silaba"];

export interface Fase {
  /** Rótulo curto, ex.: "Fase 4". */
  titulo: string;
  /** Exemplo de leitura da fase. */
  exemplo: string;
  jogo: JogoId;
  /** Nível de leitura da fase (1 a 5). Usa palavras até esse nível, de preferência as do próprio nível. */
  nivel: NivelJornada;
  /** Peças "intrusas" (sílabas, letras ou palavras) ou bichos errados a mais, conforme o jogo. */
  distratores: number;
  /** Só no "Monta a Frase": tamanho da frase. */
  frase?: TamanhoFrase;
}

/** Cada degrau de leitura vira 3 fases: ler pronto → montar sílabas → montar letras. Mais peças intrusas nos níveis altos. */
function fasesIntercaladas(niveis: NivelJornada[]): Fase[] {
  return niveis
    .flatMap((nivel) =>
      ORDEM_JOGOS.map((jogo) => ({
        titulo: "",
        exemplo: infoNivel(nivel).exemplo,
        jogo,
        nivel,
        distratores: jogo === "le-e-acha" ? (nivel >= 4 ? 3 : 2) : nivel === 1 ? 1 : nivel >= 4 ? 3 : 2,
      })),
    )
    .map((f, i) => ({ ...f, titulo: `Fase ${i + 1}` }));
}

export interface Territorio {
  id: TerritorioId;
  nome: string;
  pais: PaisId;
  tipo: TipoBioma;
  /** Fases sobre a água (deques e píer). */
  noMar: boolean;
  /** Frase do mascote ao entrar no território. */
  boasVindas: string;
  fases: Fase[];
}

/**
 * Territórios = biomas com fases, na ordem da jornada:
 * país por país (Brasil primeiro), bioma por bioma.
 */

export const TERRITORIOS: Territorio[] = PAISES.flatMap((p) =>
  p.biomas
    .filter((b) => !b.decorativo && b.niveis)
    .map((b) => ({
      id: b.id,
      nome: b.nome,
      pais: p.id,
      tipo: b.tipo,
      noMar: !!b.noMar,
      boasVindas: b.boasVindas ?? `Boas-vindas a ${b.nome}!`,
      fases: fasesIntercaladas(b.niveis!),
    })),
).map((t) => {
  // Cada bioma termina com uma fase de frase, que cresce junto com o nível de leitura:
  // nível 1–2: frase curta; 3: curta com 1 intrusa; 4: com lugar e 1 intrusa; 5: com lugar e 2 intrusas.
  const nivel = t.fases[t.fases.length - 1].nivel;
  const tamanho: TamanhoFrase = nivel <= 3 ? "curta" : "media";
  const frase: Fase = {
    titulo: `Fase ${t.fases.length + 1}`,
    exemplo: tamanho === "curta" ? "o gato mia" : "o sapo pula no lago",
    jogo: "monta-a-frase",
    nivel,
    distratores: nivel <= 2 ? 0 : nivel <= 4 ? 1 : 2,
    frase: tamanho,
  };
  return { ...t, fases: [...t.fases, frase] };
});

export const territoriosDoPais = (pais: PaisId) => TERRITORIOS.filter((t) => t.pais === pais);

export function paisDesbloqueado(concluidas: Record<string, unknown>, pais: PaisId) {
  const primeiro = territoriosDoPais(pais)[0];
  return !!primeiro && territorioDesbloqueado(concluidas, primeiro.id);
}

export const BICHOS_POR_FASE = 5;

export function territorioPorId(id: string): Territorio | undefined {
  return TERRITORIOS.find((t) => t.id === id);
}

export function animaisDoTerritorio(id: TerritorioId): Animal[] {
  return ANIMAIS.filter((x) => x.territorio === id);
}

/**
 * Bichos (palavras) de uma fase: os do bioma até o nível da fase, priorizando os mais próximos do nível
 * (para a fase ter cara de nível novo). Biomas pequenos completam com o que tiverem.
 */
export function animaisDaFase(t: Territorio, f: Fase): Animal[] {
  const todos = animaisDoTerritorio(t.id);
  if (f.jogo === "monta-a-frase") return todos;
  const ate = todos.filter((x) => nivelDoBicho(x) <= f.nivel);
  const perto = ate.filter((x) => nivelDoBicho(x) >= f.nivel - 1);
  if (perto.length >= 3) return perto;
  if (ate.length >= 3) return ate;
  // poucos bichos até o nível: completa com os mais simples acima dele
  return [...ate, ...todos.filter((x) => !ate.includes(x)).sort((a, b) => nivelDoBicho(a) - nivelDoBicho(b))].slice(0, Math.max(3, ate.length));
}

/** Chave única da fase no progresso, ex.: "br-fazenda/0". */
export function chaveFase(territorio: TerritorioId, fase: number) {
  return `${territorio}/${fase}`;
}

/** Lista linear de todas as fases da jornada, na ordem em que se desbloqueiam. */
export const SEQUENCIA = TERRITORIOS.flatMap((t) => t.fases.map((_, i) => chaveFase(t.id, i)));

export function faseDesbloqueada(concluidas: Record<string, unknown>, territorio: TerritorioId, fase: number) {
  const idx = SEQUENCIA.indexOf(chaveFase(territorio, fase));
  return idx <= 0 || SEQUENCIA[idx - 1] in concluidas;
}

export function territorioDesbloqueado(concluidas: Record<string, unknown>, territorio: TerritorioId) {
  return faseDesbloqueada(concluidas, territorio, 0);
}

// ── Mudança de nível ─────────────────────────────────────────────────────────

/** Nível de leitura de uma fase pela chave ("territorio/indice"). */
export function nivelDaFase(chave: string): NivelJornada {
  const [t, i] = chave.split("/");
  return territorioPorId(t)?.fases[Number(i)]?.nivel ?? 1;
}

/** Se esta fase é a PRIMEIRA de um nível novo, devolve esse nível (para marcar no mapa e comemorar). */
export function nivelQueComeca(chave: string): NivelJornada | null {
  const i = SEQUENCIA.indexOf(chave);
  if (i < 0) return null;
  const n = nivelDaFase(chave);
  if (i === 0) return n;
  return n > nivelDaFase(SEQUENCIA[i - 1]) ? n : null;
}

/** Nível em que a criança está agora (o da próxima fase a fazer). */
export function nivelAtual(concluidas: Record<string, unknown>): NivelJornada {
  const prox = SEQUENCIA.find((k) => !(k in concluidas));
  return prox ? nivelDaFase(prox) : 5;
}
