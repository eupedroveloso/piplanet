/**
 * PAÍSES DO PLANETA
 * Cada país é uma ilha com a silhueta real (contorno do Natural Earth, domínio público).
 * Dentro dele há biomas: os que têm fases são territórios da jornada; os "decorativos"
 * só compõem o cenário (ex.: o Saara no norte da África).
 *
 * Âncoras (u, v): posição do bioma dentro do retângulo da silhueta.
 *   u = 0 oeste … 1 leste · v = 0 norte … 1 sul. Biomas no mar ficam fora do contorno.
 */
import type { NivelJornada } from "./niveis";

export type PaisId = "brasil" | "oceano" | "eua" | "russia" | "china" | "australia" | "africa";

/** Aparência e relevo do bioma no mapa 3D. */
export type TipoBioma =
  | "fazenda"
  | "floresta-tropical"
  | "floresta-temperada"
  | "pradaria"
  | "taiga"
  | "tundra"
  | "bambuzal"
  | "deserto"
  | "outback"
  | "eucaliptos"
  | "savana"
  | "rios"
  | "cerrado"
  | "recife";

export interface BiomaPais {
  id: string;
  nome: string;
  tipo: TipoBioma;
  u: number;
  v: number;
  /** true = fica no mar (fases em deques sobre a água). */
  noMar?: boolean;
  /** Só cenário, sem fases. */
  decorativo?: boolean;
  boasVindas?: string;
  /** Níveis de leitura (cada um vira 3 fases intercaladas). */
  /**
   * Os degraus de leitura do bioma (níveis da jornada, ver content/niveis.ts). Cada degrau vira 3 fases.
   * Ao longo da jornada a sequência nunca desce: o Pietro sempre avança para palavras mais complexas.
   */
  niveis?: NivelJornada[];
}

export interface Pais {
  id: PaisId;
  nome: string;
  /** Ids numéricos (ISO 3166) no world-atlas. A África junta vários. Vazio = destino no mar. */
  iso: string[];
  /** Tamanho da ilha na cena (padrão 26). O Oceano tem só uma ilhota no meio do mar. */
  tamanhoIlha?: number;
  /** Centro aproximado para o globo (graus). */
  lat: number;
  lon: number;
  cor: string;
  biomas: BiomaPais[];
}

const AFRICA_ISO = [
  "012", "024", "072", "108", "120", "140", "148", "178", "180", "204", "226", "231", "232", "262", "266", "270", "288",
  "324", "384", "404", "426", "430", "434", "454", "466", "478", "504", "508", "516", "562", "566", "624", "646", "686",
  "694", "706", "710", "716", "728", "729", "732", "748", "768", "788", "800", "818", "834", "854", "894",
];

export const PAISES: Pais[] = [
  {
    id: "brasil",
    nome: "Brasil",
    iso: ["076"],
    lat: -10,
    lon: -52,
    cor: "#5dbb85",
    biomas: [
      {
        id: "br-fazenda",
        nome: "Fazenda",
        tipo: "fazenda",
        u: 0.62,
        v: 0.72,
        boasVindas: "Boas-vindas à Fazenda! Vamos ler os bichos daqui?",
        niveis: [1, 1, 2],
      },
      {
        id: "br-amazonia",
        nome: "Florestas",
        tipo: "floresta-tropical",
        u: 0.3,
        v: 0.28,
        boasVindas: "Chegamos nas florestas do Brasil: a Amazônia e a Mata Atlântica!",
        niveis: [2, 3, 3],
      },
      { id: "br-cerrado", nome: "Cerrado", tipo: "cerrado", u: 0.55, v: 0.45, decorativo: true },
    ],
  },
  {
    id: "russia",
    nome: "Rússia",
    iso: ["643"],
    lat: 62,
    lon: 95,
    cor: "#b48cff",
    biomas: [
      {
        id: "ru-tundra",
        nome: "Tundra",
        tipo: "tundra",
        u: 0.55,
        v: 0.22,
        boasVindas: "Brrr! Que frio! Boas-vindas à Tundra!",
        niveis: [3, 3],
      },
      {
        id: "ru-taiga",
        nome: "Taiga",
        tipo: "taiga",
        u: 0.35,
        v: 0.68,
        boasVindas: "A Taiga é a maior floresta de pinheiros do mundo!",
        niveis: [3, 3],
      },
    ],
  },
  {
    id: "china",
    nome: "China",
    iso: ["156"],
    lat: 35,
    lon: 104,
    cor: "#f25f5c",
    biomas: [
      {
        id: "cn-bambuzal",
        nome: "Bambuzal",
        tipo: "bambuzal",
        u: 0.5,
        v: 0.72,
        boasVindas: "Boas-vindas ao Bambuzal, a casa do panda!",
        niveis: [3, 3],
      },
      {
        id: "cn-gobi",
        nome: "Deserto de Gobi",
        tipo: "deserto",
        u: 0.55,
        v: 0.3,
        boasVindas: "Que calor! Chegamos no Deserto de Gobi!",
        niveis: [3],
      },
    ],
  },
  {
    id: "oceano",
    nome: "Oceano",
    iso: [],
    tamanhoIlha: 7,
    lat: -28,
    lon: -18,
    cor: "#26c2bd",
    biomas: [
      { id: "oc-ilhota", nome: "Ilhota", tipo: "deserto", u: 0.5, v: 0.5, decorativo: true },
      {
        id: "oc-recife",
        nome: "Recife de Corais",
        tipo: "recife",
        u: 1.75,
        v: 0.45,
        noMar: true,
        boasVindas: "Vamos navegar pelo Recife de Corais!",
        niveis: [3, 4],
      },
      {
        id: "oc-mar",
        nome: "Mar Aberto",
        tipo: "recife",
        u: -0.75,
        v: 0.55,
        noMar: true,
        boasVindas: "Que imensidão! Boas-vindas ao Mar Aberto!",
        niveis: [4],
      },
    ],
  },
  {
    id: "eua",
    nome: "Estados Unidos",
    iso: ["840"],
    lat: 39,
    lon: -98,
    cor: "#4fb0e3",
    biomas: [
      {
        id: "us-florestas",
        nome: "Florestas",
        tipo: "floresta-temperada",
        u: 0.78,
        v: 0.35,
        boasVindas: "Boas-vindas às florestas dos Estados Unidos!",
        niveis: [4, 4],
      },
      {
        id: "us-pradaria",
        nome: "Pradaria",
        tipo: "pradaria",
        u: 0.45,
        v: 0.45,
        boasVindas: "Que campo enorme! É a Pradaria!",
        niveis: [4],
      },
      { id: "us-deserto", nome: "Deserto", tipo: "deserto", u: 0.15, v: 0.7, decorativo: true },
      { id: "us-montanhas", nome: "Montanhas", tipo: "taiga", u: 0.2, v: 0.25, decorativo: true },
    ],
  },
  {
    id: "australia",
    nome: "Austrália",
    iso: ["036"],
    lat: -25,
    lon: 134,
    cor: "#f2a23c",
    biomas: [
      {
        id: "au-outback",
        nome: "Outback",
        tipo: "outback",
        u: 0.42,
        v: 0.5,
        boasVindas: "Boas-vindas ao Outback, o deserto vermelho da Austrália!",
        niveis: [4],
      },
      {
        id: "au-eucaliptos",
        nome: "Eucaliptos",
        tipo: "eucaliptos",
        u: 0.82,
        v: 0.66,
        boasVindas: "Que cheirinho de eucalipto! É a casa do coala!",
        niveis: [4],
      },
    ],
  },
  {
    id: "africa",
    nome: "África",
    iso: AFRICA_ISO,
    lat: 5,
    lon: 20,
    cor: "#ffc935",
    biomas: [
      { id: "af-saara", nome: "Saara", tipo: "deserto", u: 0.4, v: 0.18, decorativo: true },
      {
        id: "af-rios",
        nome: "Rios e Florestas",
        tipo: "rios",
        u: 0.42,
        v: 0.55,
        boasVindas: "Boas-vindas aos rios e florestas da África!",
        niveis: [5],
      },
      {
        id: "af-savana",
        nome: "Savana",
        tipo: "savana",
        u: 0.7,
        v: 0.66,
        boasVindas: "Que calor! Boas-vindas à Savana africana!",
        niveis: [5, 5],
      },
    ],
  },
];

export const paisPorId = (id: PaisId) => PAISES.find((p) => p.id === id)!;

/** Cores das telas de jogo por tipo de bioma (variáveis --t-*). */
export const TEMAS: Record<TipoBioma, { fundo: string; chao: string; trilha: string; faixa: string; destaque: string }> = {
  fazenda: { fundo: "#dff2dc", chao: "#c9e9c5", trilha: "#74c69d", faixa: "#e9f7ea", destaque: "#3e8f63" },
  "floresta-tropical": { fundo: "#cfe9d9", chao: "#b5dcc4", trilha: "#3f9e78", faixa: "#d9f0e2", destaque: "#2b765a" },
  "floresta-temperada": { fundo: "#dcefd9", chao: "#c3e2bf", trilha: "#5aa36a", faixa: "#e6f5e3", destaque: "#38784a" },
  pradaria: { fundo: "#eef3d2", chao: "#dfe8b4", trilha: "#a9bf5a", faixa: "#f6f9e6", destaque: "#6d7f2b" },
  taiga: { fundo: "#d8ebe2", chao: "#bddccd", trilha: "#4a8c66", faixa: "#e3f2ea", destaque: "#2f6b4b" },
  tundra: { fundo: "#e6f1fb", chao: "#cfe2f3", trilha: "#ffffff", faixa: "#b9d6ee", destaque: "#3a7cb0" },
  bambuzal: { fundo: "#e2f2d2", chao: "#cbe6b2", trilha: "#7fb84f", faixa: "#eef8e4", destaque: "#4e8a2a" },
  deserto: { fundo: "#fbefd2", chao: "#f4dfa8", trilha: "#e8b45c", faixa: "#fff7e3", destaque: "#a8742a" },
  outback: { fundo: "#fbe3d2", chao: "#f2c5a3", trilha: "#d9783f", faixa: "#fdf0e6", destaque: "#a24f22" },
  eucaliptos: { fundo: "#e3efe0", chao: "#cbe0c6", trilha: "#7aa874", faixa: "#eef6ec", destaque: "#4a7a45" },
  savana: { fundo: "#fcefc2", chao: "#f8e2a2", trilha: "#f2bf4d", faixa: "#fff7dc", destaque: "#b57c00" },
  rios: { fundo: "#d6eee6", chao: "#bfe3d6", trilha: "#4aa58a", faixa: "#e2f4ee", destaque: "#2c7763" },
  cerrado: { fundo: "#f2ecd0", chao: "#e5dbaa", trilha: "#c2a64f", faixa: "#f8f4e4", destaque: "#86702a" },
  recife: { fundo: "#d8eef9", chao: "#bfe3f5", trilha: "#ffffff", faixa: "#a9d8f0", destaque: "#2f86b5" },
};
