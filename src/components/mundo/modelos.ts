import type { PaisId, TipoBioma } from "@/content/paises";
import { PAISES } from "@/content/paises";

/**
 * MODELOS 3D PRONTOS (Kenney Nature Kit, CC0 — ver public/modelos/CREDITOS.md).
 * O script `scripts/modelos.ts` lê esta tabela, achata cada modelo numa malha só com a cor
 * do material gravada nos vértices (paleta do projeto, sem texturas), marca as partes
 * "tingíveis" (folhas, grama, corpo da pedra: recebem a cor do bioma por instância),
 * normaliza o tamanho e grava UM pacote por país em public/modelos/<pais>.glb (meshopt).
 */

export type Familia = "arvore" | "pinheiro" | "palmeira" | "arbusto" | "tufo" | "flor" | "pedra" | "rocha" | "cogumelo" | "tronco" | "cacto" | "bambu";

/** Tamanho-alvo de cada família (altura, ou largura para pedras e troncos caídos). */
export const FAMILIAS: Record<Familia, { medida: "altura" | "largura"; alvo: number }> = {
  arvore: { medida: "altura", alvo: 2.0 },
  pinheiro: { medida: "altura", alvo: 2.4 },
  palmeira: { medida: "altura", alvo: 1.9 },
  arbusto: { medida: "altura", alvo: 0.5 },
  tufo: { medida: "altura", alvo: 0.28 },
  flor: { medida: "altura", alvo: 0.3 },
  pedra: { medida: "largura", alvo: 0.7 },
  rocha: { medida: "altura", alvo: 0.9 },
  cogumelo: { medida: "altura", alvo: 0.26 },
  tronco: { medida: "largura", alvo: 0.8 },
  cacto: { medida: "altura", alvo: 1.1 },
  bambu: { medida: "altura", alvo: 2.2 },
};

/** Cor fixa por material do kit (as tingíveis viram branco e recebem a cor da instância). */
export const CORES_MATERIAL: Record<string, string> = {
  woodBark: "#7a5236",
  woodBarkDark: "#5e4030",
  woodBirch: "#efe6d6",
  woodInner: "#e3c79b",
  _defaultMat: "#f4efe6",
  colorRed: "#e8524f",
  colorTan: "#d9a066",
  colorPurple: "#a77bea",
  colorYellow: "#ffc935",
  colorWhite: "#ffffff",
  grass: "#5aa84a",
  dirt: "#a39b92",
  stone: "#b8b4ae",
};

/** Materiais tingíveis por família. */
export const TINGIVEIS: Record<Familia, string[]> = {
  arvore: ["leafsGreen", "leafsDark", "leafsFall"],
  pinheiro: ["leafsGreen", "leafsDark"],
  palmeira: ["leafsGreen"],
  arbusto: ["grass"],
  tufo: ["grass"],
  flor: [],
  pedra: ["dirt", "stone"],
  rocha: ["dirt", "stone"],
  cogumelo: [],
  tronco: [],
  cacto: ["leafsGreen"],
  bambu: ["grass"],
};

export const MODELOS = {
  arvores: ["tree_default", "tree_detailed", "tree_oak", "tree_detailed", "tree_default_fall"],
  arvoresAltas: ["tree_tall", "tree_simple", "tree_thin"],
  acacias: ["tree_plateau"],
  pinheiros: ["tree_pineTallA_detailed", "tree_pineTallB_detailed", "tree_pineTallC_detailed", "tree_pineRoundC", "tree_pineRoundE", "tree_pineDefaultA"],
  pinheirosPequenos: ["tree_pineSmallA", "tree_pineSmallB", "tree_pineSmallC"],
  ciprestes: ["tree_cone", "tree_cone_dark"],
  palmeiras: ["tree_palm", "tree_palmBend", "tree_palmTall", "tree_palmDetailedTall", "tree_palmShort"],
  arbustos: ["plant_bush", "plant_bushDetailed", "plant_bushLarge", "plant_bushSmall", "plant_bushTriangle"],
  tufos: ["grass", "grass_large", "grass_leafs"],
  flores: ["flower_redA", "flower_redB", "flower_purpleA", "flower_purpleB", "flower_yellowA", "flower_yellowC"],
  pedras: ["rock_smallA", "rock_smallB", "rock_smallC", "rock_largeA", "rock_largeC", "stone_smallA", "stone_largeA"],
  rochas: ["rock_tallA", "rock_tallC", "stone_tallB"],
  cogumelos: ["mushroom_red", "mushroom_redGroup", "mushroom_tan", "mushroom_tanGroup"],
  troncos: ["log", "log_large", "stump_old", "stump_roundDetailed"],
  cactos: ["cactus_short", "cactus_tall"],
  bambus: ["crops_bambooStageA", "crops_bambooStageB"],
} as const;

export type NomeModelo = (typeof MODELOS)[keyof typeof MODELOS][number];

export function familiaDe(nome: string): Familia {
  const m = MODELOS;
  const em = (lista: readonly string[]) => lista.includes(nome);
  if (em(m.pinheiros) || em(m.pinheirosPequenos) || em(m.ciprestes)) return "pinheiro";
  if (em(m.palmeiras)) return "palmeira";
  if (em(m.arbustos)) return "arbusto";
  if (em(m.tufos)) return "tufo";
  if (em(m.flores)) return "flor";
  if (em(m.pedras)) return "pedra";
  if (em(m.rochas)) return "rocha";
  if (em(m.cogumelos)) return "cogumelo";
  if (em(m.troncos)) return "tronco";
  if (em(m.cactos)) return "cacto";
  if (em(m.bambus)) return "bambu";
  return "arvore";
}

/** Modelos que cada tipo de bioma usa (o catálogo de decoração sorteia só entre estes). */
export const MODELOS_POR_TIPO: Record<TipoBioma, readonly NomeModelo[]> = {
  fazenda: [...MODELOS.arbustos, ...MODELOS.flores, ...MODELOS.tufos, ...MODELOS.pedras],
  "floresta-tropical": [...MODELOS.palmeiras, ...MODELOS.arbustos, ...MODELOS.flores, ...MODELOS.cogumelos, ...MODELOS.tufos],
  rios: [...MODELOS.palmeiras, ...MODELOS.arbustos, ...MODELOS.flores, ...MODELOS.cogumelos, ...MODELOS.tufos],
  "floresta-temperada": [...MODELOS.pinheiros, ...MODELOS.arbustos, ...MODELOS.cogumelos, ...MODELOS.troncos, ...MODELOS.tufos],
  pradaria: [...MODELOS.tufos, ...MODELOS.flores, ...MODELOS.arbustos, ...MODELOS.pedras],
  taiga: [...MODELOS.pinheiros, ...MODELOS.ciprestes, ...MODELOS.pedras, ...MODELOS.rochas, ...MODELOS.troncos, ...MODELOS.tufos],
  tundra: [...MODELOS.pedras, ...MODELOS.tufos, ...MODELOS.arbustos, ...MODELOS.pinheirosPequenos],
  bambuzal: [...MODELOS.bambus, ...MODELOS.arbustos, ...MODELOS.pedras, ...MODELOS.rochas, ...MODELOS.flores, ...MODELOS.tufos],
  deserto: [...MODELOS.pedras, ...MODELOS.rochas, ...MODELOS.tufos, ...MODELOS.arbustos, ...MODELOS.cactos, ...MODELOS.palmeiras],
  outback: [...MODELOS.pedras, ...MODELOS.rochas, ...MODELOS.arbustos, ...MODELOS.tufos],
  eucaliptos: [...MODELOS.arbustos, ...MODELOS.tufos, ...MODELOS.flores, ...MODELOS.pedras],
  savana: [...MODELOS.acacias, ...MODELOS.pedras, ...MODELOS.rochas, ...MODELOS.arbustos, ...MODELOS.tufos],
  cerrado: [...MODELOS.arbustos, ...MODELOS.tufos, ...MODELOS.flores],
  recife: [],
};

/** Modelos de praia (palmeiras nos tropicais, pedras em todos). */
const PRAIA: readonly NomeModelo[] = [...MODELOS.palmeiras, ...MODELOS.pedras];

/** Lista (sem repetição) dos modelos do pacote de um país. Cactos só nas Américas. */
export function modelosDoPais(pais: PaisId): NomeModelo[] {
  const p = PAISES.find((x) => x.id === pais);
  const nomes = new Set<NomeModelo>(PRAIA);
  for (const b of p?.biomas ?? []) for (const n of MODELOS_POR_TIPO[b.tipo]) nomes.add(n);
  if (pais !== "eua") for (const n of MODELOS.cactos) nomes.delete(n);
  return [...nomes];
}

export const urlModelos = (pais: PaisId) => `/modelos/${pais}.glb`;

/**
 * Chave da troca para modelos prontos. Ligada em 2026-11-26 depois de conferida no portal (Brasil, Rússia, EUA). Desligue para voltar ao procedural;
 * para testar sem afetar ninguém: localStorage.setItem("pg:modelos", "1") no navegador de teste.
 */
export const USAR_MODELOS = true;
export const modelosLigados = () =>
  USAR_MODELOS || (typeof window !== "undefined" && window.localStorage?.getItem("pg:modelos") === "1");
