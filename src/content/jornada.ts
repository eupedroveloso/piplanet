import { ANIMAIS, type Animal, type Dificuldade, type TerritorioId } from "./animais";
import type { TamanhoFrase } from "./frases";
import { PAISES, type PaisId, type TipoBioma } from "./paises";

/**
 * A JORNADA
 * Planeta → países → biomas (territórios) → fases. Cada bioma tem bichos, cores e cenário próprios.
 * Dentro de cada território há fases, em ordem crescente de dificuldade de leitura.
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
  dificuldades: Dificuldade[];
  /** Peças "intrusas" (sílabas, letras ou palavras) ou bichos errados a mais, conforme o jogo. */
  distratores: number;
  /** Só no "Monta a Frase": tamanho da frase. */
  frase?: TamanhoFrase;
}

/** Cada nível de dificuldade vira 3 fases: ler pronto → montar sílabas → montar letras. */
function fasesIntercaladas(niveis: { dificuldades: Dificuldade[]; exemplo: string }[]): Fase[] {
  return niveis
    .flatMap((n) =>
      ORDEM_JOGOS.map((jogo) => ({
        titulo: "",
        exemplo: n.exemplo,
        jogo,
        dificuldades: n.dificuldades,
        distratores: jogo === "le-e-acha" ? 2 : Math.max(...n.dificuldades) === 1 ? 1 : 2,
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
/** Quantos territórios do começo da jornada usam a frase curta; depois, frase com lugar. */
const TERRITORIOS_FRASE_CURTA = 3;

export const TERRITORIOS: Territorio[] = PAISES.flatMap((p) =>
  p.biomas
    .filter((b) => !b.decorativo && b.niveis)
    .map((b) => ({
      id: b.id,
      nome: b.nome,
      pais: p.id,
      tipo: b.tipo,
      noMar: !!b.noMar,
      boasVindas: b.boasVindas ?? `Bem-vindo a ${b.nome}!`,
      fases: fasesIntercaladas(b.niveis!),
    })),
).map((t, i) => {
  // Cada bioma termina com uma fase de frase, que cresce conforme a jornada avança
  const tamanho: TamanhoFrase = i < TERRITORIOS_FRASE_CURTA ? "curta" : "media";
  const frase: Fase = {
    titulo: `Fase ${t.fases.length + 1}`,
    exemplo: tamanho === "curta" ? "o gato mia" : "o sapo pula no lago",
    jogo: "monta-a-frase",
    dificuldades: [1, 2, 3],
    distratores: tamanho === "curta" ? 0 : 1,
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

export function animaisDaFase(t: Territorio, f: Fase): Animal[] {
  return animaisDoTerritorio(t.id).filter((x) => f.dificuldades.includes(x.dificuldade));
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
