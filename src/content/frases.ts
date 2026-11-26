import type { Animal } from "./animais";

/**
 * FRASES CURTAS (verdadeiras) sobre os bichos.
 *
 * - curta: artigo + nome + ação        → "O GATO MIA"
 * - média: curta + lugar onde vive     → "O SAPO PULA NA FLORESTA"
 *
 * As ações são comportamentos reais de cada bicho. Palavras simples e decodificáveis.
 */

export type TamanhoFrase = "curta" | "media";

/** Ação típica de cada bicho (verbo no presente; o mamute, extinto, no passado). */
const ACAO: Record<string, string> = {
  gato: "mia", pato: "nada", vaca: "muge", galo: "canta", bode: "pula", rato: "come",
  cavalo: "corre", porco: "come", ovelha: "come", coelho: "pula", burro: "anda", abelha: "voa",
  sapo: "pula", mico: "pula", boto: "nada", macaco: "pula", coruja: "voa", jabuti: "anda",
  jacare: "nada", arara: "voa", cobra: "desliza", formiga: "anda", preguica: "dorme", borboleta: "voa",
  lula: "nada", siri: "anda", medusa: "boia", polvo: "nada", tubarao: "nada", baleia: "nada",
  camarao: "nada", lagosta: "anda", peixe: "nada", tartaruga: "nada", pinguim: "nada", golfinho: "pula",
  lobo: "uiva", "urso-pardo": "dorme", castor: "nada", guaxinim: "come", peru: "anda", bisao: "corre",
  aguia: "voa", cascavel: "desliza", foca: "nada", rena: "corre", raposa: "corre", mamute: "andava",
  urso: "nada", javali: "cava", tigre: "corre", alce: "come", esquilo: "pula", ourico: "anda",
  grilo: "canta", cisne: "nada", bufalo: "come", panda: "come", pavao: "anda", camelo: "anda",
  escorpiao: "anda", canguru: "pula", lagarto: "corre", aranha: "tece", coala: "dorme", morcego: "voa",
  crocodilo: "nada", gorila: "come", hipopotamo: "nada", flamingo: "voa", girafa: "come", zebra: "corre",
  leao: "ruge", elefante: "anda", rinoceronte: "corre", leopardo: "sobe",
};

/** Lugar onde a frase "média" acontece, por bioma (com exceções por bicho). */
const LUGAR_BIOMA: Record<string, string> = {
  "br-fazenda": "na fazenda",
  "br-amazonia": "na floresta",
  "oc-recife": "no mar",
  "oc-mar": "no mar",
  "us-florestas": "na floresta",
  "us-pradaria": "no campo",
  "ru-tundra": "na neve",
  "ru-taiga": "na floresta",
  "cn-bambuzal": "no bambuzal",
  "cn-gobi": "no deserto",
  "au-outback": "no deserto",
  "au-eucaliptos": "na mata",
  "af-rios": "no rio",
  "af-savana": "na savana",
};
const LUGAR_BICHO: Record<string, string> = {
  leopardo: "na árvore",
  coala: "na árvore",
  preguica: "na árvore",
  boto: "no rio",
  jacare: "no rio",
  sapo: "no lago",
  castor: "no rio",
  pato: "no lago",
  aranha: "a teia",
  mamute: "na neve",
};

/** Nomes que terminam em "a" mas são masculinos. */
const MASCULINO_A = new Set(["panda", "gorila", "coala"]);
const FEMININO = new Set(["cascavel"]);

export function artigo(a: Animal) {
  if (FEMININO.has(a.id)) return "a";
  if (MASCULINO_A.has(a.id)) return "o";
  return a.nome.endsWith("a") ? "a" : "o";
}

/** Palavras da frase sobre o bicho, em minúsculas, na ordem. */
export function fraseDe(a: Animal, tamanho: TamanhoFrase): string[] {
  const acao = ACAO[a.id] ?? "anda";
  const base = [artigo(a), a.nome, acao];
  if (tamanho === "curta") return base;
  const lugar = LUGAR_BICHO[a.id] ?? LUGAR_BIOMA[a.territorio] ?? "";
  return [...base, ...lugar.split(" ").filter(Boolean)];
}

/** Palavras "intrusas" para as fases mais avançadas. */
export const PALAVRAS_EXTRAS = ["e", "um", "uma", "no", "na", "pula", "voa", "nada", "come", "corre"];
