import * as THREE from "three";
import type { TipoBioma } from "@/content/paises";
import { NIVEL_PIER, prng, type Ilha } from "./ilha";
import { MODELOS, modelosLigados, type NomeModelo } from "./modelos";

/**
 * DECORAÇÃO DO MUNDO
 * Tudo vira "peças" de primitivas low-poly (cilindro, cone, icosaedro...), agrupadas por
 * forma para desenhar com instancing (centenas de elementos sem pesar no tablet).
 *
 * Árvores de vários tipos e tamanhos, arbustos, grama, flores, pedras, cogumelos,
 * troncos, cactos, cupinzeiros, feno, cercas, icebergs, celeiro, casinha...
 */

import type { Forma } from "./formas";
export type { Forma };

export interface Peca {
  f: Forma;
  /** Modelo pronto (modelos.ts). Quando presente, `f` é ignorado e a peça vira instância do modelo. */
  m?: NomeModelo;
  /** Desbotada (bioma trancado): o shader dos modelos clareia e tira a cor. */
  d?: boolean;
  p: [number, number, number];
  s: [number, number, number];
  r?: [number, number, number];
  c: string;
}

/** Objetos com animação própria (moinho, fumaça...) ficam de fora do instancing. */
export interface Especial {
  tipo: "moinho" | "fumaca";
  bioma: string;
  p: [number, number, number]; // mundo
}

type R = () => number;
const entre = (rnd: R, a: number, b: number) => a + rnd() * (b - a);
const escolha = <T,>(rnd: R, lista: T[]) => lista[Math.floor(rnd() * lista.length)];

// ── Árvores (estilo maquete: galhos aparentes e muitas copas facetadas) ──────

const TRONCO = ["#7a5236", "#6b4a33", "#86603f"];
const copaF = (rnd: R): Forma => (["copa0", "copa1", "copa2", "copa3"] as const)[Math.floor(rnd() * 4)];
const giro = (rnd: R): [number, number, number] => [rnd() * 6, rnd() * 6, rnd() * 6];
/** Escolhe um verde mais claro para as copas mais altas (luz vinda de cima). */
const tom = (rnd: R, verdes: string[], altura01: number) => verdes[Math.min(verdes.length - 1, Math.floor(altura01 * verdes.length * 0.7 + rnd() * verdes.length * 0.5))];

/** Galho do ponto (x0,y0,z0) inclinado: devolve a peça e a ponta. */
function galho(x0: number, y0: number, z0: number, comp: number, ang: number, incl: number, esp: number, cor: string) {
  const dx = Math.sin(incl) * Math.cos(ang);
  const dz = Math.sin(incl) * Math.sin(ang);
  const dy = Math.cos(incl);
  const meio: [number, number, number] = [x0 + (dx * comp) / 2, y0 + (dy * comp) / 2, z0 + (dz * comp) / 2];
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz));
  const e = new THREE.Euler().setFromQuaternion(q);
  const peca: Peca = { f: "cilindro", p: meio, s: [esp, comp, esp], r: [e.x, e.y, e.z], c: cor };
  return { peca, ponta: [x0 + dx * comp, y0 + dy * comp, z0 + dz * comp] as [number, number, number] };
}

/** Árvore frondosa: tronco que se divide em galhos, cada um com um cacho de copas facetadas. */
function arvoreRedondaProc(rnd: R, x: number, z: number, s: number, verdes: string[]): Peca[] {
  const cor = escolha(rnd, TRONCO);
  const alt = (0.85 + rnd() * 0.35) * s;
  const out: Peca[] = [{ f: "cilindro", p: [x, alt / 2, z], s: [0.13 * s, alt, 0.13 * s], c: cor }];
  const nGalhos = 2 + Math.floor(rnd() * 3);
  const pontas: [number, number, number][] = [[x, alt + 0.15 * s, z]];
  for (let i = 0; i < nGalhos; i++) {
    const g = galho(x, alt * (0.6 + rnd() * 0.3), z, (0.45 + rnd() * 0.35) * s, (i / nGalhos) * Math.PI * 2 + rnd(), 0.5 + rnd() * 0.45, 0.07 * s, cor);
    out.push(g.peca);
    pontas.push(g.ponta);
  }
  for (const [px, py, pz] of pontas) {
    const n = 2 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const t = (0.42 + rnd() * 0.3) * s;
      const oy = (rnd() - 0.2) * 0.3 * s;
      out.push({
        f: copaF(rnd),
        p: [px + (rnd() - 0.5) * 0.4 * s, py + oy, pz + (rnd() - 0.5) * 0.4 * s],
        s: [t, t * (0.8 + rnd() * 0.3), t],
        r: giro(rnd),
        c: tom(rnd, verdes, (py - alt * 0.5) / (alt * 0.9)),
      });
    }
  }
  return out;
}

/** Pinheiro em vários andares, levemente tortos. */
function pinheiroProc(rnd: R, x: number, z: number, s: number, verdes: string[], neve = false): Peca[] {
  const out: Peca[] = [{ f: "cilindro", p: [x, 0.22 * s, z], s: [0.12 * s, 0.44 * s, 0.12 * s], c: escolha(rnd, TRONCO) }];
  const andares = 5 + Math.floor(rnd() * 4);
  const altura = (1.6 + rnd() * 0.8) * s;
  for (let i = 0; i < andares; i++) {
    const t = i / (andares - 1);
    const largura = (1.05 - t * 0.78) * s;
    const y = 0.35 * s + t * altura * 0.78;
    out.push({
      f: rnd() > 0.5 ? "pinho0" : "pinho1",
      p: [x + (rnd() - 0.5) * 0.05 * s, y + 0.18 * s, z + (rnd() - 0.5) * 0.05 * s],
      s: [largura, 0.42 * s, largura],
      r: [(rnd() - 0.5) * 0.08, rnd() * 6, (rnd() - 0.5) * 0.08],
      c: verdes[Math.min(verdes.length - 1, Math.floor((1 - t) * 0.3 * verdes.length + rnd() * 2))],
    });
    if (neve && i % 2 === 1) out.push({ f: "pinho0", p: [x, y + 0.27 * s, z], s: [largura * 0.7, 0.18 * s, largura * 0.7], r: [0, rnd() * 6, 0], c: "#ffffff" });
  }
  out.push({ f: "cone", p: [x, 0.35 * s + altura * 0.8 + 0.22 * s, z], s: [0.22 * s, 0.4 * s, 0.22 * s], c: neve ? "#ffffff" : verdes[0] });
  return out;
}

function cipresteProc(rnd: R, x: number, z: number, s: number, verdes: string[]): Peca[] {
  const out: Peca[] = [{ f: "cilindro", p: [x, 0.15 * s, z], s: [0.1 * s, 0.3 * s, 0.1 * s], c: escolha(rnd, TRONCO) }];
  for (let i = 0; i < 4; i++)
    out.push({ f: copaF(rnd), p: [x, (0.45 + i * 0.38) * s, z], s: [(0.55 - i * 0.08) * s, 0.6 * s, (0.55 - i * 0.08) * s], r: giro(rnd), c: escolha(rnd, verdes) });
  return out;
}

/** Bétula: tronco branco com marcas e copas amareladas em cachos. */
function betulaProc(rnd: R, x: number, z: number, s: number): Peca[] {
  const verdes = ["#a9cf5a", "#bcd86a", "#d6dd72", "#93c254"];
  const out = arvoreRedonda(rnd, x, z, s * 0.9, verdes).map((p) => (TRONCO.includes(p.c) ? { ...p, c: "#efe9df" } : p));
  for (let i = 0; i < 3; i++) out.push({ f: "caixa", p: [x, (0.2 + i * 0.22) * s, z], s: [0.125 * s, 0.03 * s, 0.125 * s], c: "#4a4253" });
  return out;
}

function acaciaProc(rnd: R, x: number, z: number, s: number): Peca[] {
  const cor = "#7a4e33";
  const out: Peca[] = [{ f: "cilindro", p: [x, 0.45 * s, z], s: [0.12 * s, 0.9 * s, 0.12 * s], c: cor }];
  const verdes = ["#8fb04a", "#7fa340", "#9cbc52", "#a8c65e"];
  for (let i = 0; i < 3; i++) {
    const g = galho(x, 0.85 * s, z, (0.55 + rnd() * 0.25) * s, (i / 3) * Math.PI * 2 + rnd(), 0.75, 0.07 * s, cor);
    out.push(g.peca);
    for (let k = 0; k < 3; k++)
      out.push({ f: copaF(rnd), p: [g.ponta[0] + (rnd() - 0.5) * 0.5 * s, g.ponta[1] + 0.05 * s, g.ponta[2] + (rnd() - 0.5) * 0.5 * s], s: [0.6 * s, 0.22 * s, 0.6 * s], r: [0, rnd() * 6, 0], c: escolha(rnd, verdes) });
  }
  return out;
}

function palmeiraProc(rnd: R, x: number, z: number, s: number): Peca[] {
  const out: Peca[] = [];
  const inc = entre(rnd, 0.1, 0.3);
  for (let i = 0; i < 5; i++)
    out.push({ f: "cilindro", p: [x + i * inc * 0.2 * s, (0.17 + i * 0.3) * s, z], s: [(0.14 - i * 0.012) * s, 0.32 * s, (0.14 - i * 0.012) * s], c: i % 2 ? "#a0703f" : "#8a5d33" });
  const topo: [number, number, number] = [x + 5 * inc * 0.2 * s, 1.55 * s, z];
  // folhas largas em dois tons, caindo em arco (duas partes por folha)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rnd() * 0.3;
    const cor = i % 2 ? "#3fae4f" : "#5fc85e";
    out.push({ f: "caixa", p: [topo[0] + Math.cos(a) * 0.32 * s, topo[1] + 0.02 * s, topo[2] + Math.sin(a) * 0.32 * s], s: [0.6 * s, 0.05 * s, 0.34 * s], r: [0, -a, -0.2], c: cor });
    out.push({ f: "caixa", p: [topo[0] + Math.cos(a) * 0.78 * s, topo[1] - 0.18 * s, topo[2] + Math.sin(a) * 0.78 * s], s: [0.5 * s, 0.05 * s, 0.28 * s], r: [0, -a, -0.75], c: cor });
  }
  out.push({ f: "esfera", p: [topo[0], topo[1] - 0.1 * s, topo[2]], s: [0.18 * s, 0.18 * s, 0.18 * s], c: "#7a4e33" });
  return out;
}

// ── Plantas, pedras e miudezas ──────────────────────────────────────────────

const arbustoProc = (rnd: R, x: number, z: number, s: number, verdes: string[]): Peca[] => [
  { f: "icosa", p: [x, 0.22 * s, z], s: [0.55 * s, 0.42 * s, 0.55 * s], r: [rnd(), rnd(), rnd()], c: escolha(rnd, verdes) },
  { f: "icosa", p: [x + 0.25 * s, 0.16 * s, z + 0.1 * s], s: [0.35 * s, 0.3 * s, 0.35 * s], r: [rnd(), rnd(), rnd()], c: escolha(rnd, verdes) },
];

const tufoProc = (rnd: R, x: number, z: number, cor: string): Peca[] =>
  [0, 1, 2].map((i) => ({
    f: "cone" as const,
    p: [x + (i - 1) * 0.06, 0.08, z + (rnd() - 0.5) * 0.06] as [number, number, number],
    s: [0.06, 0.18 + rnd() * 0.08, 0.06] as [number, number, number],
    r: [(i - 1) * 0.25, 0, 0] as [number, number, number],
    c: cor,
  }));

const florProc = (rnd: R, x: number, z: number): Peca[] => [
  { f: "cilindro", p: [x, 0.08, z], s: [0.015, 0.16, 0.015], c: "#4f9a45" },
  { f: "esfera", p: [x, 0.18, z], s: [0.09, 0.07, 0.09], c: escolha(rnd, ["#ff8fb1", "#ffffff", "#ffd34d", "#b48cff", "#ff7a6b"]) },
  { f: "esfera", p: [x, 0.19, z], s: [0.04, 0.04, 0.04], c: "#ffc935" },
];

/** Grupinho de pedras angulosas (2 a 4 tamanhos), como nas maquetes. */
function pedraProc(rnd: R, x: number, z: number, s: number, cores: string[]): Peca[] {
  const n = 1 + Math.floor(rnd() * 3);
  const out: Peca[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i === 0 ? 0.55 : 0.25 + rnd() * 0.25) * s;
    const a = rnd() * Math.PI * 2;
    const d = i === 0 ? 0 : (0.3 + rnd() * 0.2) * s;
    out.push({
      f: (["rocha0", "rocha1", "rocha2"] as const)[Math.floor(rnd() * 3)],
      p: [x + Math.cos(a) * d, t * 0.32, z + Math.sin(a) * d],
      s: [t, t, t],
      r: [rnd() * 0.4, rnd() * 6, rnd() * 0.4],
      c: escolha(rnd, cores),
    });
  }
  return out;
}

const cogumeloProc = (rnd: R, x: number, z: number, s: number): Peca[] => [
  { f: "cilindro", p: [x, 0.1 * s, z], s: [0.08 * s, 0.2 * s, 0.08 * s], c: "#fff3e0" },
  { f: "esfera", p: [x, 0.22 * s, z], s: [0.26 * s, 0.14 * s, 0.26 * s], c: escolha(rnd, ["#e85d5d", "#f08a3c"]) },
  { f: "esfera", p: [x + 0.06 * s, 0.28 * s, z], s: [0.05 * s, 0.03 * s, 0.05 * s], c: "#ffffff" },
];

const troncoProc = (rnd: R, x: number, z: number): Peca[] => [
  { f: "cilindro", p: [x, 0.1, z], s: [0.18, 0.7, 0.18], r: [Math.PI / 2, rnd() * 3, 0], c: "#8a5a3b" },
  { f: "disco", p: [x, 0.1, z], s: [0.3, 0.02, 0.3], r: [Math.PI / 2, 0, 0], c: "#d9b07a" },
];

const cactoProc = (rnd: R, x: number, z: number, s: number): Peca[] => [
  { f: "cilindro", p: [x, 0.4 * s, z], s: [0.18 * s, 0.8 * s, 0.18 * s], c: "#5fa85a" },
  { f: "cilindro", p: [x + 0.16 * s, 0.45 * s, z], s: [0.1 * s, 0.32 * s, 0.1 * s], c: "#5fa85a" },
  { f: "cilindro", p: [x - 0.15 * s, 0.55 * s, z], s: [0.1 * s, 0.26 * s, 0.1 * s], c: "#6cb866" },
  ...(rnd() > 0.5 ? [{ f: "esfera" as const, p: [x, 0.82 * s, z] as [number, number, number], s: [0.1 * s, 0.08 * s, 0.1 * s] as [number, number, number], c: "#ff8fb1" }] : []),
];

const cupinzeiro = (rnd: R, x: number, z: number, s: number): Peca[] => [
  { f: "cone", p: [x, 0.35 * s, z], s: [0.5 * s, 0.7 * s, 0.5 * s], r: [0, rnd() * 3, 0], c: "#c98a4b" },
  { f: "cone", p: [x + 0.18 * s, 0.25 * s, z], s: [0.28 * s, 0.5 * s, 0.28 * s], c: "#b8793f" },
];

const feno = (rnd: R, x: number, z: number): Peca[] => [
  { f: "cilindro", p: [x, 0.2, z], s: [0.4, 0.38, 0.4], r: [Math.PI / 2, rnd() * 3, 0], c: "#f2c14e" },
];

const iceberg = (rnd: R, x: number, z: number, s: number): Peca[] => [
  { f: "icosa", p: [x, 0.2 * s, z], s: [0.7 * s, 0.9 * s, 0.6 * s], r: [rnd(), rnd() * 3, rnd() * 0.3], c: escolha(rnd, ["#ffffff", "#e8f6ff", "#d6efff"]) },
];

const concha = (rnd: R, x: number, z: number): Peca[] => [
  { f: "esfera", p: [x, 0.03, z], s: [0.14, 0.06, 0.11], r: [0, rnd() * 3, 0], c: escolha(rnd, ["#ffd6e7", "#fff3e0", "#ffc9a8", "#ffffff"]) },
];

function guardaSol(rnd: R, x: number, z: number): Peca[] {
  const cor = escolha(rnd, ["#f25f5c", "#4fb0e3", "#ffc935"]);
  return [
    { f: "cilindro", p: [x, 0.36, z], s: [0.03, 0.72, 0.03], c: "#ffffff" },
    { f: "cone", p: [x, 0.76, z], s: [0.75, 0.2, 0.75], r: [0, rnd() * 3, 0], c: cor },
    { f: "caixa", p: [x + 0.32, 0.05, z + 0.14], s: [0.34, 0.03, 0.62], r: [0, rnd(), 0], c: escolha(rnd, ["#ffffff", "#ffc935", "#ff8fb1"]) },
  ];
}

function cerca(x1: number, z1: number, x2: number, z2: number): Peca[] {
  const out: Peca[] = [];
  const n = Math.max(2, Math.round(Math.hypot(x2 - x1, z2 - z1) / 0.4));
  const ang = Math.atan2(z2 - z1, x2 - x1);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push({ f: "caixa", p: [x1 + (x2 - x1) * t, 0.18, z1 + (z2 - z1) * t], s: [0.07, 0.36, 0.07], c: "#f5efe3" });
  }
  for (const y of [0.13, 0.27])
    out.push({
      f: "caixa",
      p: [(x1 + x2) / 2, y, (z1 + z2) / 2],
      s: [Math.hypot(x2 - x1, z2 - z1), 0.04, 0.03],
      r: [0, -ang, 0],
      c: "#f5efe3",
    });
  return out;
}

function celeiro(x: number, z: number, giro: number): Peca[] {
  return [
    { f: "caixa", p: [x, 0.45, z], s: [1.1, 0.9, 0.9], r: [0, giro, 0], c: "#e05a47" },
    { f: "prisma", p: [x, 1.05, z], s: [0.62, 1.15, 0.62], r: [0, giro, Math.PI / 2], c: "#8b4a3c" },
    { f: "caixa", p: [x + Math.sin(giro) * 0.46, 0.32, z + Math.cos(giro) * 0.46], s: [0.36, 0.6, 0.02], r: [0, giro, 0], c: "#ffffff" },
    { f: "caixa", p: [x + Math.sin(giro) * 0.47, 0.32, z + Math.cos(giro) * 0.47], s: [0.3, 0.52, 0.02], r: [0, giro, 0], c: "#b5402f" },
  ];
}

function casinha(x: number, z: number, giro: number): Peca[] {
  return [
    { f: "caixa", p: [x, 0.3, z], s: [0.7, 0.6, 0.6], r: [0, giro, 0], c: "#fff3e0" },
    { f: "prisma", p: [x, 0.75, z], s: [0.46, 0.8, 0.46], r: [0, giro, Math.PI / 2], c: "#f25f5c" },
    { f: "caixa", p: [x + 0.15, 0.85, z - 0.1], s: [0.12, 0.3, 0.12], c: "#9b7654" },
    { f: "caixa", p: [x + Math.sin(giro) * 0.31, 0.22, z + Math.cos(giro) * 0.31], s: [0.16, 0.3, 0.02], r: [0, giro, 0], c: "#8a5a3b" },
    { f: "caixa", p: [x + Math.sin(giro) * 0.31 + Math.cos(giro) * 0.2, 0.38, z + Math.cos(giro) * 0.31 - Math.sin(giro) * 0.2], s: [0.14, 0.14, 0.02], r: [0, giro, 0], c: "#9fd8f5" },
  ];
}

// ── Plantas extras ──────────────────────────────────────────────────────────

/** Touceira de bambu: hastes altas com nós e folhinhas no topo. */
function bambuProc(rnd: R, x: number, z: number, s: number): Peca[] {
  const out: Peca[] = [];
  const n = 4 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rnd() * 0.22 * s;
    const h = (1.3 + rnd() * 1.1) * s;
    const bx = x + Math.cos(a) * d;
    const bz = z + Math.sin(a) * d;
    const inc: [number, number, number] = [(rnd() - 0.5) * 0.15, 0, (rnd() - 0.5) * 0.15];
    out.push({ f: "cilindro", p: [bx, h / 2, bz], s: [0.07 * s, h, 0.07 * s], r: inc, c: escolha(rnd, ["#8fc94f", "#7fb84a", "#9ad25a"]) });
    for (let k = 1; k < 4; k++) out.push({ f: "cilindro", p: [bx, (h * k) / 4, bz], s: [0.085 * s, 0.03, 0.085 * s], r: inc, c: "#6e9e3c" });
    out.push({ f: "icosa", p: [bx, h + 0.05, bz], s: [0.35 * s, 0.22 * s, 0.35 * s], r: [rnd(), rnd(), 0], c: escolha(rnd, ["#5fae46", "#6cbb52"]) });
  }
  return out;
}



/** Árvore tropical: tronco alto e copas largas em vários cachos, verde-escuro. */
function arvoreTropicalProc(rnd: R, x: number, z: number, s: number): Peca[] {
  return arvoreRedonda(rnd, x, z, s * 1.15, ["#2f8a4f", "#3a9a5a", "#277a45", "#48a865"]);
}

/** Eucalipto: tronco claro e alto, cachos de copa azulados e ralos. */
function eucaliptoProc(rnd: R, x: number, z: number, s: number): Peca[] {
  return arvoreRedonda(rnd, x, z, s, ["#7fa88e", "#8fb8a0", "#9cc4a8", "#86ae95"]).map((p) =>
    TRONCO.includes(p.c) ? { ...p, c: "#e9e2d4" } : p,
  );
}

// ── Versão com modelos prontos (Kenney Nature Kit, CC0; chave USAR_MODELOS em modelos.ts) ──
// Cada gerador devolve UMA peça com `m` (nome do modelo): desenhada num BatchedMesh,
// girada ao acaso e tingida com `c` nas partes tingíveis (folhas, grama, corpo da pedra).

const mod = (rnd: R, lista: readonly NomeModelo[], x: number, z: number, s: number, cor = "#ffffff"): Peca[] => {
  const v = entre(rnd, 0.9, 1.12);
  return [{ f: "caixa", m: escolha(rnd, [...lista]), p: [x, 0, z], s: [s, s * v, s], r: [0, rnd() * Math.PI * 2, 0], c: cor }];
};
// Árvores frondosas ficam procedurais (galhos + muitos cachos de copa, como na referência
// aprovada); as do kit pareciam genéricas e "quadradas".
const COM_MODELO = {
  arvoreRedonda: arvoreRedondaProc,
  pinheiro: (rnd: R, x: number, z: number, s: number, verdes: string[], neve = false) =>
    neve ? mod(rnd, MODELOS.pinheirosPequenos, x, z, s, "#dcefe8") : mod(rnd, MODELOS.pinheiros, x, z, s * 0.9, escolha(rnd, verdes)),
  cipreste: (rnd: R, x: number, z: number, s: number, verdes: string[]) => mod(rnd, MODELOS.ciprestes, x, z, s * 0.85, escolha(rnd, verdes)),
  betula: betulaProc,
  acacia: (rnd: R, x: number, z: number, s: number) => mod(rnd, MODELOS.acacias, x, z, s * 1.05, escolha(rnd, ["#8fb04a", "#7fa340", "#9cbc52"])),
  palmeira: (rnd: R, x: number, z: number, s: number) => mod(rnd, MODELOS.palmeiras, x, z, s, escolha(rnd, ["#3fae4f", "#5fc85e", "#4fb85a"])),
  arbusto: (rnd: R, x: number, z: number, s: number, verdes: string[]) => mod(rnd, MODELOS.arbustos, x, z, s, escolha(rnd, verdes)),
  tufo: (rnd: R, x: number, z: number, cor: string) => mod(rnd, MODELOS.tufos, x, z, entre(rnd, 0.8, 1.25), cor),
  flor: (rnd: R, x: number, z: number) => mod(rnd, MODELOS.flores, x, z, entre(rnd, 0.8, 1.2)),
  pedra: (rnd: R, x: number, z: number, s: number, cores: string[]) => mod(rnd, rnd() < 0.15 ? MODELOS.rochas : MODELOS.pedras, x, z, s, escolha(rnd, cores)),
  cogumelo: (rnd: R, x: number, z: number, s: number) => mod(rnd, MODELOS.cogumelos, x, z, s),
  tronco: (rnd: R, x: number, z: number) => mod(rnd, MODELOS.troncos, x, z, entre(rnd, 0.8, 1.1)),
  cacto: (rnd: R, x: number, z: number, s: number) => mod(rnd, MODELOS.cactos, x, z, s, escolha(rnd, ["#5fa85a", "#6cb866"])),
  bambu: (rnd: R, x: number, z: number, s: number) => mod(rnd, MODELOS.bambus, x, z, s, escolha(rnd, ["#8fc94f", "#7fb84a", "#9ad25a"])),
  arvoreTropical: arvoreTropicalProc,
  eucalipto: eucaliptoProc,
};
const PROCEDURAL = { arvoreRedonda: arvoreRedondaProc, pinheiro: pinheiroProc, cipreste: cipresteProc, betula: betulaProc, acacia: acaciaProc, palmeira: palmeiraProc, arbusto: arbustoProc, tufo: tufoProc, flor: florProc, pedra: pedraProc, cogumelo: cogumeloProc, tronco: troncoProc, cacto: cactoProc, bambu: bambuProc, arvoreTropical: arvoreTropicalProc, eucalipto: eucaliptoProc };
/** Geradores em uso (decidido a cada montagem do mundo, pela chave). */
const gen = () => (modelosLigados() ? COM_MODELO : PROCEDURAL);
const arvoreRedonda: (typeof PROCEDURAL)["arvoreRedonda"] = (...a: Parameters<(typeof PROCEDURAL)["arvoreRedonda"]>) => (gen().arvoreRedonda as (...x: typeof a) => Peca[])(...a);
const pinheiro: (typeof PROCEDURAL)["pinheiro"] = (...a: Parameters<(typeof PROCEDURAL)["pinheiro"]>) => (gen().pinheiro as (...x: typeof a) => Peca[])(...a);
const cipreste: (typeof PROCEDURAL)["cipreste"] = (...a: Parameters<(typeof PROCEDURAL)["cipreste"]>) => (gen().cipreste as (...x: typeof a) => Peca[])(...a);
const betula: (typeof PROCEDURAL)["betula"] = (...a: Parameters<(typeof PROCEDURAL)["betula"]>) => (gen().betula as (...x: typeof a) => Peca[])(...a);
const acacia: (typeof PROCEDURAL)["acacia"] = (...a: Parameters<(typeof PROCEDURAL)["acacia"]>) => (gen().acacia as (...x: typeof a) => Peca[])(...a);
const palmeira: (typeof PROCEDURAL)["palmeira"] = (...a: Parameters<(typeof PROCEDURAL)["palmeira"]>) => (gen().palmeira as (...x: typeof a) => Peca[])(...a);
const arbusto: (typeof PROCEDURAL)["arbusto"] = (...a: Parameters<(typeof PROCEDURAL)["arbusto"]>) => (gen().arbusto as (...x: typeof a) => Peca[])(...a);
const tufo: (typeof PROCEDURAL)["tufo"] = (...a: Parameters<(typeof PROCEDURAL)["tufo"]>) => (gen().tufo as (...x: typeof a) => Peca[])(...a);
const flor: (typeof PROCEDURAL)["flor"] = (...a: Parameters<(typeof PROCEDURAL)["flor"]>) => (gen().flor as (...x: typeof a) => Peca[])(...a);
const pedra: (typeof PROCEDURAL)["pedra"] = (...a: Parameters<(typeof PROCEDURAL)["pedra"]>) => (gen().pedra as (...x: typeof a) => Peca[])(...a);
const cogumelo: (typeof PROCEDURAL)["cogumelo"] = (...a: Parameters<(typeof PROCEDURAL)["cogumelo"]>) => (gen().cogumelo as (...x: typeof a) => Peca[])(...a);
const tronco: (typeof PROCEDURAL)["tronco"] = (...a: Parameters<(typeof PROCEDURAL)["tronco"]>) => (gen().tronco as (...x: typeof a) => Peca[])(...a);
const cacto: (typeof PROCEDURAL)["cacto"] = (...a: Parameters<(typeof PROCEDURAL)["cacto"]>) => (gen().cacto as (...x: typeof a) => Peca[])(...a);
const bambu: (typeof PROCEDURAL)["bambu"] = (...a: Parameters<(typeof PROCEDURAL)["bambu"]>) => (gen().bambu as (...x: typeof a) => Peca[])(...a);
const arvoreTropical: (typeof PROCEDURAL)["arvoreTropical"] = (...a: Parameters<(typeof PROCEDURAL)["arvoreTropical"]>) => (gen().arvoreTropical as (...x: typeof a) => Peca[])(...a);
const eucalipto: (typeof PROCEDURAL)["eucalipto"] = (...a: Parameters<(typeof PROCEDURAL)["eucalipto"]>) => (gen().eucalipto as (...x: typeof a) => Peca[])(...a);

// ── Catálogo por tipo de bioma ──────────────────────────────────────────────

type Gerador = (rnd: R, x: number, z: number) => Peca[];
type Catalogo = { peso: number; r: number; g: Gerador }[];

const verdes = ["#5aa84a", "#6cba52", "#4f9a45", "#7cc35c"];
const outono = ["#e8a33c", "#d9772f", "#f2c14e", "#c95b35", "#7cbf5c"];

function catalogo(tipo: TipoBioma, pais: string): { densidade: number; itens: Catalogo } {
  const tufoDe = (cor: string): Gerador => (rnd, x, z) => tufo(rnd, x, z, cor);
  switch (tipo) {
    case "fazenda":
      return { densidade: 0.65, itens: [
        { peso: 22, r: 0.45, g: (rnd, x, z) => arvoreRedonda(rnd, x, z, entre(rnd, 0.5, 1.3), verdes) },
        { peso: 6, r: 0.4, g: (rnd, x, z) => betula(rnd, x, z, entre(rnd, 0.7, 1.15)) },
        { peso: 12, r: 0.3, g: (rnd, x, z) => arbusto(rnd, x, z, entre(rnd, 0.6, 1.1), verdes) },
        { peso: 25, r: 0.1, g: (rnd, x, z) => flor(rnd, x, z) },
        { peso: 30, r: 0.08, g: tufoDe("#6cb24c") },
        { peso: 5, r: 0.3, g: (rnd, x, z) => feno(rnd, x, z) },
        { peso: 4, r: 0.2, g: (rnd, x, z) => pedra(rnd, x, z, entre(rnd, 0.6, 1), ["#b8b0a6", "#a39b92"]) },
      ] };
    case "floresta-tropical":
    case "rios":
      return { densidade: 0.75, itens: [
        { peso: 30, r: 0.55, g: (rnd, x, z) => arvoreTropical(rnd, x, z, entre(rnd, 0.8, 1.4)) },
        { peso: 16, r: 0.45, g: (rnd, x, z) => arvoreRedonda(rnd, x, z, entre(rnd, 0.8, 1.6), ["#2f8a4f", "#3e9e63", "#277a45"]) },
        { peso: 10, r: 0.4, g: (rnd, x, z) => palmeira(rnd, x, z, entre(rnd, 0.8, 1.2)) },
        { peso: 18, r: 0.25, g: (rnd, x, z) => arbusto(rnd, x, z, entre(rnd, 0.6, 1.2), ["#2f8a4f", "#3e9e63"]) },
        { peso: 8, r: 0.1, g: (rnd, x, z) => flor(rnd, x, z) },
        { peso: 5, r: 0.12, g: (rnd, x, z) => cogumelo(rnd, x, z, entre(rnd, 0.6, 1.2)) },
        { peso: 16, r: 0.08, g: tufoDe("#2f8a55") },
      ] };
    case "floresta-temperada":
      return { densidade: 0.65, itens: [
        { peso: 30, r: 0.45, g: (rnd, x, z) => arvoreRedonda(rnd, x, z, entre(rnd, 0.7, 1.4), outono) },
        { peso: 18, r: 0.35, g: (rnd, x, z) => pinheiro(rnd, x, z, entre(rnd, 0.7, 1.6), ["#2f8a55", "#3e9e63"]) },
        { peso: 8, r: 0.4, g: (rnd, x, z) => betula(rnd, x, z, entre(rnd, 0.8, 1.2)) },
        { peso: 12, r: 0.25, g: (rnd, x, z) => arbusto(rnd, x, z, entre(rnd, 0.6, 1.1), outono) },
        { peso: 5, r: 0.12, g: (rnd, x, z) => cogumelo(rnd, x, z, entre(rnd, 0.6, 1.2)) },
        { peso: 4, r: 0.4, g: (rnd, x, z) => tronco(rnd, x, z) },
        { peso: 20, r: 0.08, g: tufoDe("#6aae4e") },
      ] };
    case "pradaria":
      return { densidade: 0.45, itens: [
        { peso: 60, r: 0.08, g: tufoDe("#a7c45a") },
        { peso: 15, r: 0.1, g: (rnd, x, z) => flor(rnd, x, z) },
        { peso: 5, r: 0.3, g: (rnd, x, z) => arbusto(rnd, x, z, entre(rnd, 0.5, 0.9), ["#93a84c", "#a7b85a"]) },
        { peso: 3, r: 0.45, g: (rnd, x, z) => arvoreRedonda(rnd, x, z, entre(rnd, 0.6, 1.1), verdes) },
        { peso: 3, r: 0.2, g: (rnd, x, z) => pedra(rnd, x, z, entre(rnd, 0.5, 1), ["#b8a68e", "#a8957e"]) },
      ] };
    case "taiga":
      return { densidade: 0.7, itens: [
        { peso: 55, r: 0.35, g: (rnd, x, z) => pinheiro(rnd, x, z, entre(rnd, 0.6, 1.8), ["#2f6b4b", "#3e7f5a", "#25603f"]) },
        { peso: 10, r: 0.25, g: (rnd, x, z) => cipreste(rnd, x, z, entre(rnd, 0.8, 1.4), ["#2f6b4b", "#3e7f5a"]) },
        { peso: 8, r: 0.2, g: (rnd, x, z) => pedra(rnd, x, z, entre(rnd, 0.6, 1.3), ["#8f8a83", "#7f7a74"]) },
        { peso: 5, r: 0.4, g: (rnd, x, z) => tronco(rnd, x, z) },
        { peso: 15, r: 0.08, g: tufoDe("#4f8f5f") },
      ] };
    case "tundra":
      return { densidade: 0.3, itens: [
        { peso: 20, r: 0.2, g: (rnd, x, z) => pedra(rnd, x, z, entre(rnd, 0.5, 1.2), ["#bcd3e6", "#9fbdd6", "#dfe9f3"]) },
        { peso: 30, r: 0.08, g: tufoDe("#b8a888") },
        { peso: 8, r: 0.2, g: (rnd, x, z) => arbusto(rnd, x, z, entre(rnd, 0.4, 0.7), ["#8a9a78", "#9aa888"]) },
        { peso: 6, r: 0.35, g: (rnd, x, z) => pinheiro(rnd, x, z, entre(rnd, 0.5, 1.0), ["#3f8f6a", "#4a9e78"], true) },
        { peso: 5, r: 0.4, g: (rnd, x, z) => iceberg(rnd, x, z, entre(rnd, 0.4, 0.8)) },
      ] };
    case "bambuzal":
      return { densidade: 0.6, itens: [
        { peso: 45, r: 0.45, g: (rnd, x, z) => bambu(rnd, x, z, entre(rnd, 0.8, 1.3)) },
        { peso: 10, r: 0.45, g: (rnd, x, z) => arvoreRedonda(rnd, x, z, entre(rnd, 0.6, 1.2), verdes) },
        { peso: 10, r: 0.25, g: (rnd, x, z) => arbusto(rnd, x, z, entre(rnd, 0.5, 1), verdes) },
        { peso: 8, r: 0.2, g: (rnd, x, z) => pedra(rnd, x, z, entre(rnd, 0.6, 1.3), ["#8f9a86", "#a3ad98"]) },
        { peso: 8, r: 0.1, g: (rnd, x, z) => flor(rnd, x, z) },
        { peso: 15, r: 0.08, g: tufoDe("#7dbf53") },
      ] };
    case "deserto":
      return { densidade: 0.22, itens: [
        { peso: 25, r: 0.25, g: (rnd, x, z) => pedra(rnd, x, z, entre(rnd, 0.6, 1.6), ["#d9a35d", "#c99a5b", "#e2b06b"]) },
        { peso: 30, r: 0.08, g: tufoDe("#c9a85a") },
        { peso: 12, r: 0.25, g: (rnd, x, z) => arbusto(rnd, x, z, entre(rnd, 0.4, 0.8), ["#a7a05a", "#9a924c"]) },
        // cactos só existem nas Américas
        ...(pais === "eua" ? [{ peso: 14, r: 0.25, g: ((rnd, x, z) => cacto(rnd, x, z, entre(rnd, 0.7, 1.3))) as Gerador }] : []),
        { peso: 3, r: 0.4, g: (rnd, x, z) => palmeira(rnd, x, z, entre(rnd, 0.8, 1.1)) },
      ] };
    case "outback":
      return { densidade: 0.35, itens: [
        { peso: 20, r: 0.25, g: (rnd, x, z) => pedra(rnd, x, z, entre(rnd, 0.6, 1.5), ["#c46a3c", "#b8643a", "#d2794a"]) },
        { peso: 12, r: 0.35, g: (rnd, x, z) => cupinzeiro(rnd, x, z, entre(rnd, 0.7, 1.3)) },
        { peso: 20, r: 0.25, g: (rnd, x, z) => arbusto(rnd, x, z, entre(rnd, 0.4, 0.8), ["#a8a35a", "#b8b06a"]) },
        { peso: 35, r: 0.08, g: tufoDe("#c9a85a") },
        { peso: 4, r: 0.4, g: (rnd, x, z) => eucalipto(rnd, x, z, entre(rnd, 0.6, 1)) },
      ] };
    case "eucaliptos":
      return { densidade: 0.6, itens: [
        { peso: 40, r: 0.4, g: (rnd, x, z) => eucalipto(rnd, x, z, entre(rnd, 0.8, 1.4)) },
        { peso: 14, r: 0.25, g: (rnd, x, z) => arbusto(rnd, x, z, entre(rnd, 0.5, 1), ["#86ae95", "#9cc4a8"]) },
        { peso: 20, r: 0.08, g: tufoDe("#8ab468") },
        { peso: 8, r: 0.1, g: (rnd, x, z) => flor(rnd, x, z) },
        { peso: 5, r: 0.2, g: (rnd, x, z) => pedra(rnd, x, z, entre(rnd, 0.5, 1), ["#a39b8e", "#b8b0a6"]) },
      ] };
    case "savana":
      return { densidade: 0.4, itens: [
        { peso: 14, r: 0.6, g: (rnd, x, z) => acacia(rnd, x, z, entre(rnd, 0.7, 1.35)) },
        { peso: 6, r: 0.35, g: (rnd, x, z) => cupinzeiro(rnd, x, z, entre(rnd, 0.7, 1.2)) },
        { peso: 8, r: 0.3, g: (rnd, x, z) => pedra(rnd, x, z, entre(rnd, 0.6, 1.6), ["#d9944d", "#c98a4b"]) },
        { peso: 12, r: 0.25, g: (rnd, x, z) => arbusto(rnd, x, z, entre(rnd, 0.5, 0.9), ["#a7b85a", "#93a84c"]) },
        { peso: 55, r: 0.08, g: tufoDe("#d9a547") },
      ] };
    case "cerrado":
      return { densidade: 0.45, itens: [
        { peso: 14, r: 0.45, g: (rnd, x, z) => arvoreRedonda(rnd, x, z, entre(rnd, 0.5, 1.0), ["#8a9a48", "#7f9142", "#9aa652"]) },
        { peso: 18, r: 0.25, g: (rnd, x, z) => arbusto(rnd, x, z, entre(rnd, 0.5, 1), ["#a7a05a", "#9aa652"]) },
        { peso: 8, r: 0.35, g: (rnd, x, z) => cupinzeiro(rnd, x, z, entre(rnd, 0.7, 1.2)) },
        { peso: 45, r: 0.08, g: tufoDe("#bdb556") },
        { peso: 7, r: 0.1, g: (rnd, x, z) => flor(rnd, x, z) },
      ] };
    case "recife":
      return { densidade: 0, itens: [] };
  }
}

// ── Montagem na ilha ────────────────────────────────────────────────────────

export interface Mundo {
  pecasPorBioma: Record<string, Peca[]>; // coordenadas do MUNDO
  especiais: Especial[];
  /** Pontos livres (mundo) por bioma, para bichos andarem. */
  pastos: Record<string, THREE.Vector3[]>;
}

const cacheMundo = new Map<string, Mundo>();

export function montarMundo(ilha: Ilha): Mundo {
  const pronto = cacheMundo.get(ilha.pais);
  if (pronto) return pronto;
  const rnd = prng(ilha.pais.length * 977 + 13);
  const pecasPorBioma: Record<string, Peca[]> = Object.fromEntries(ilha.biomas.map((b) => [b.id, [] as Peca[]]));
  const especiais: Especial[] = [];
  const pastos: Record<string, THREE.Vector3[]> = Object.fromEntries(ilha.biomas.map((b) => [b.id, [] as THREE.Vector3[]]));
  const ocupado: { x: number; z: number; r: number }[] = ilha.fases.map((f) => ({ x: f.pos.x, z: f.pos.z, r: 1.0 }));
  const { altura, dist, biomaEm, distanciaTrilha, marEm } = ilha;

  const inclinacao = (x: number, z: number) => {
    const e = 0.3;
    return Math.hypot(altura(x + e, z) - altura(x - e, z), altura(x, z + e) - altura(x, z - e)) / (2 * e);
  };
  const livre = (x: number, z: number, r: number) => ocupado.every((o) => Math.hypot(o.x - x, o.z - z) > o.r + r);
  /** Coloca as peças no chão (soma a altura do terreno no ponto base). */
  const assentar = (x: number, z: number, lista: Peca[]) => {
    const h = altura(x, z);
    const id = biomaEm(x, z).id;
    for (const pc of lista) pecasPorBioma[id].push({ ...pc, p: [pc.p[0], pc.p[1] + h - 0.02, pc.p[2]] });
  };
  const pontoEmTerra = (r: number, filtro: (x: number, z: number) => boolean, folga = 0.9) => {
    for (let t = 0; t < 60; t++) {
      const x = (rnd() - 0.5) * 2 * 16;
      const z = (rnd() - 0.5) * 2 * 16;
      if (dist(x, z) < 1.5 || altura(x, z) < 0.45 || distanciaTrilha(x, z) < folga + r * 0.5) continue;
      if (!filtro(x, z) || !livre(x, z, r)) continue;
      ocupado.push({ x, z, r });
      return [x, z] as [number, number];
    }
    return null;
  };

  // Construções da fazenda, perto da âncora
  const fazenda = ilha.biomas.find((b) => b.tipo === "fazenda");
  if (fazenda) {
    const naFazenda = (x: number, z: number) => biomaEm(x, z) === fazenda && inclinacao(x, z) < 0.45;
    const l1 = pontoEmTerra(1.1, naFazenda, 1.3);
    if (l1) assentar(l1[0], l1[1], celeiro(l1[0], l1[1], 0.4));
    const l2 = pontoEmTerra(0.8, naFazenda, 1.2);
    if (l2) {
      assentar(l2[0], l2[1], casinha(l2[0], l2[1], -0.3));
      especiais.push({ tipo: "fumaca", bioma: fazenda.id, p: [l2[0] + 0.15, altura(l2[0], l2[1]) + 1.05, l2[1] - 0.1] });
    }
    const l3 = pontoEmTerra(0.7, naFazenda, 1.2);
    if (l3) especiais.push({ tipo: "moinho", bioma: fazenda.id, p: [l3[0], altura(l3[0], l3[1]) - 0.02, l3[1]] });
    const l4 = pontoEmTerra(1.0, naFazenda, 1.2);
    if (l4) {
      const [x, z] = l4;
      assentar(x, z, [...cerca(x - 0.8, z - 0.6, x + 0.8, z - 0.6), ...cerca(x + 0.8, z - 0.6, x + 0.8, z + 0.6), ...cerca(x - 0.8, z - 0.6, x - 0.8, z + 0.6)]);
    }
  }

  // Vegetação por tipo de bioma: sorteia pontos por toda a ilha
  const total = 4200;
  for (let i = 0; i < total; i++) {
    const x = (rnd() - 0.5) * 2 * 16;
    const z = (rnd() - 0.5) * 2 * 16;
    const d = dist(x, z);
    if (d < 1.4) continue;
    const b = biomaEm(x, z);
    const cat = catalogo(b.tipo, ilha.pais);
    if (rnd() > cat.densidade) continue;
    const soma = cat.itens.reduce((s, it) => s + it.peso, 0);
    let sorteio = rnd() * soma;
    const item = cat.itens.find((it) => (sorteio -= it.peso) <= 0) ?? cat.itens[0];
    if (!item) continue;
    if (distanciaTrilha(x, z) < 0.85 + item.r * 0.5 || inclinacao(x, z) > 1.4 || !livre(x, z, item.r)) continue;
    ocupado.push({ x, z, r: item.r });
    assentar(x, z, item.g(rnd, x, z));
  }

  // Praia: palmeiras e pedras (guarda-sóis e conchas nos países tropicais)
  const tropical = ["brasil", "australia", "africa"].includes(ilha.pais);
  for (let i = 0; i < 900; i++) {
    const x = (rnd() - 0.5) * 2 * 16;
    const z = (rnd() - 0.5) * 2 * 16;
    const d = dist(x, z);
    // só na areia de verdade (abaixo do degrau de terra), não na grama
    const hp = altura(x, z);
    if (d < 0.15 || d > 1.6 || hp < 0.05 || hp > 0.3 || distanciaTrilha(x, z) < 1 || !livre(x, z, 0.5)) continue;
    if (rnd() > 0.12) continue;
    const frio = biomaEm(x, z).tipo === "tundra" || biomaEm(x, z).tipo === "taiga";
    ocupado.push({ x, z, r: 0.5 });
    const sorte = rnd();
    assentar(
      x,
      z,
      frio
        ? pedra(rnd, x, z, entre(rnd, 0.6, 1.3), ["#bcd3e6", "#9fbdd6"])
        : tropical && sorte > 0.55
          ? palmeira(rnd, x, z, entre(rnd, 0.8, 1.15))
          : tropical && sorte > 0.4
            ? guardaSol(rnd, x, z)
            : tropical && sorte > 0.2
              ? concha(rnd, x, z)
              : pedra(rnd, x, z, entre(rnd, 0.6, 1.2), ["#cfc8bf", "#b8b0a6"]),
    );
  }

  // Icebergs no mar perto da tundra
  for (const b of ilha.biomas.filter((x) => x.tipo === "tundra")) {
    for (let i = 0; i < 14; i++) {
      for (let t = 0; t < 30; t++) {
        const a = rnd() * Math.PI * 2;
        const r = 6 + rnd() * 9;
        const x = b.x + Math.cos(a) * r;
        const z = b.z + Math.sin(a) * r;
        const d = dist(x, z);
        if (d > -1.2 || d < -5 || marEm(x, z) || !livre(x, z, 0.6)) continue;
        ocupado.push({ x, z, r: 0.6 });
        pecasPorBioma[b.id].push(...iceberg(rnd, x, z, entre(rnd, 0.7, 1.7)).map((pc) => ({ ...pc, p: [pc.p[0], pc.p[1] - 0.2, pc.p[2]] as [number, number, number] })));
        break;
      }
    }
  }

  // Biomas no mar: deques sob as fases, corais e algas
  for (const m of ilha.biomas.filter((b) => b.noMar)) {
    const noMar = (lista: Peca[], y: number) => pecasPorBioma[m.id].push(...lista.map((pc) => ({ ...pc, p: [pc.p[0], pc.p[1] + y, pc.p[2]] as [number, number, number] })));
    for (const fz of ilha.fases.filter((f) => f.territorio === m.id)) {
      const { x, z } = fz.pos;
      if (altura(x, z) >= NIVEL_PIER) continue;
      noMar([{ f: "disco", p: [x, NIVEL_PIER + 0.02, z], s: [1.7, 0.14, 1.7], c: "#c98e5b" }], 0);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        noMar([{ f: "cilindro", p: [x + Math.cos(a) * 0.72, NIVEL_PIER - 0.75, z + Math.sin(a) * 0.72], s: [0.12, 1.5, 0.12], c: "#8a5a3b" }], 0);
      }
      noMar([{ f: "cilindro", p: [x + 0.75, NIVEL_PIER + 0.3, z - 0.3], s: [0.08, 0.6, 0.08], c: "#8a5a3b" }], 0);
      noMar([{ f: "esfera", p: [x + 0.75, NIVEL_PIER + 0.66, z - 0.3], s: [0.18, 0.18, 0.18], c: "#ffd34d" }], 0);
    }
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 7.2;
      const x = m.x + Math.cos(a) * r;
      const z = m.z + Math.sin(a) * r;
      if (marEm(x, z) !== m || distanciaTrilha(x, z) < 0.9 || !livre(x, z, 0.25)) continue;
      if (rnd() > 0.45) continue;
      ocupado.push({ x, z, r: 0.25 });
      const cor = escolha(rnd, ["#ff7a6b", "#ff8fb1", "#b48cff", "#ffc935", "#f28c38"]);
      const tipo = rnd();
      const peca: Peca[] =
        tipo < 0.3
          ? [0, 1, 2].map((k) => ({ f: "cilindro" as const, p: [x + (k - 1) * 0.1, 0.18, z] as [number, number, number], s: [0.07, 0.35 + rnd() * 0.25, 0.07] as [number, number, number], r: [(k - 1) * 0.35, 0, 0] as [number, number, number], c: cor }))
          : tipo < 0.6
            ? [{ f: "icosa", p: [x, 0.12, z], s: [0.45, 0.3, 0.45], r: [rnd(), rnd(), 0], c: cor }]
            : tipo < 0.8
              ? [{ f: "disco", p: [x, 0.1, z], s: [0.55, 0.08, 0.55], r: [0.2, rnd() * 3, 0], c: cor }]
              : [{ f: "cone", p: [x, 0.3, z], s: [0.08, 0.6 + rnd() * 0.4, 0.08], r: [rnd() * 0.3, 0, rnd() * 0.3], c: escolha(rnd, ["#3f9a5d", "#5fae5a"]) }];
      noMar(peca, altura(x, z));
    }
  }

  // Pontos livres para bichos passearem
  for (const b of ilha.biomas.filter((x) => !x.noMar)) {
    for (let i = 0; i < 6; i++) {
      const l = pontoEmTerra(0.6, (x, z) => biomaEm(x, z) === b && inclinacao(x, z) < 0.5, 1.1);
      if (l) pastos[b.id].push(new THREE.Vector3(l[0], altura(l[0], l[1]), l[1]));
    }
  }

  const mundo = { pecasPorBioma, especiais, pastos };
  cacheMundo.set(ilha.pais, mundo);
  return mundo;
}
