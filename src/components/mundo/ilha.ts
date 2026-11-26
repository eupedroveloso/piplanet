import * as THREE from "three";
import {
  PAISES,
  type BiomaPais,
  type PaisId,
  type TipoBioma,
} from "@/content/paises";
import { TERRITORIOS } from "@/content/jornada";
import { silhueta, type Silhueta } from "./geo";

/**
 * ILHA DE UM PAÍS
 * A partir da silhueta real do país, gera:
 * - Biomas em regiões com fronteiras naturais (diagrama de Voronoi "ondulado").
 * - Relevo com função: colinas e vales suaves por toda a ilha, SERRAS nas fronteiras
 *   entre biomas (que dividem as regiões), PASSAGENS onde a trilha cruza as serras,
 *   MIRANTES (platôs) em cada fase e relevo próprio de cada tipo de bioma.
 * - Biomas no mar: recife raso com a trilha sobre píeres e as fases em deques.
 * - Uma trilha contínua pelos biomas, na ordem da jornada.
 * Mar em y = 0. Tudo determinístico.
 */

// ── Ruído ───────────────────────────────────────────────────────────────────

function hash(x: number, y: number, s: number) {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function ruido(x: number, y: number, s = 0) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, s);
  const b = hash(x0 + 1, y0, s);
  const c = hash(x0, y0 + 1, s);
  const d = hash(x0 + 1, y0 + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, s = 0) {
  return (
    ruido(x, y, s) * 0.55 +
    ruido(x * 2.1, y * 2.1, s + 1) * 0.3 +
    ruido(x * 4.3, y * 4.3, s + 2) * 0.15
  );
}
export function prng(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Máximo suave (sem vinco). */
const smax = (a: number, b: number, k: number) => {
  const t = Math.min(1, Math.max(0, 0.5 + (0.5 * (a - b)) / k));
  return b + (a - b) * t + k * t * (1 - t);
};
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export function misturar(a: string, b: string, t: number) {
  return "#" + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
}

// ── Aparência e relevo por tipo de bioma ────────────────────────────────────

export interface Visual {
  /** Tons do topo (grama/chão): [médio, escuro, claro, mais escuro]. */
  cores: string[];
  /** "Borda de terra" que aparece nos degraus e encostas. */
  terra: string;
  rocha: string;
  /** Altura base e amplitude das colinas. */
  base: number;
  amp: number;
}

export const VISUAL: Record<TipoBioma, Visual> = {
  fazenda: {
    terra: "#b98a5e",
    cores: ["#8fd16a", "#86ca61", "#99d874", "#7fc35c"],
    rocha: "#a59a8e",
    base: 0.8,
    amp: 1.0,
  },
  "floresta-tropical": {
    terra: "#9a6b47",
    cores: ["#4fae6e", "#47a465", "#58b877", "#3f9a5d"],
    rocha: "#7f8a76",
    base: 0.9,
    amp: 1.5,
  },
  "floresta-temperada": {
    terra: "#a47b55",
    cores: ["#7cbf5c", "#73b655", "#86c866", "#6aae4e"],
    rocha: "#958c82",
    base: 0.9,
    amp: 1.4,
  },
  pradaria: {
    terra: "#b48c5c",
    cores: ["#b9d36a", "#b0cc62", "#c3da75", "#a7c45a"],
    rocha: "#a8957e",
    base: 0.7,
    amp: 0.5,
  },
  taiga: {
    terra: "#8d7560",
    cores: ["#5e9e6e", "#579766", "#66a776", "#4f8f5f"],
    rocha: "#8f8a83",
    base: 0.9,
    amp: 1.6,
  },
  tundra: {
    terra: "#a7a39c",
    cores: ["#eef6ff", "#e3f0fc", "#f6faff", "#d9eaf8"],
    rocha: "#9fbdd6",
    base: 0.65,
    amp: 0.45,
  },
  bambuzal: {
    terra: "#a07a52",
    cores: ["#8fcf63", "#86c75a", "#98d66d", "#7dbf53"],
    rocha: "#8f9a86",
    base: 0.9,
    amp: 1.2,
  },
  deserto: {
    terra: "#d9a862",
    cores: ["#f4d48a", "#efcc7d", "#f7db97", "#ebc571"],
    rocha: "#c99a5b",
    base: 0.8,
    amp: 0.7,
  },
  outback: {
    terra: "#c0703f",
    cores: ["#e59a5b", "#df9152", "#eaa465", "#d9884a"],
    rocha: "#b8643a",
    base: 0.75,
    amp: 0.6,
  },
  eucaliptos: {
    terra: "#b0835a",
    cores: ["#9cc47a", "#93bc71", "#a6cc84", "#8ab468"],
    rocha: "#a39b8e",
    base: 0.85,
    amp: 1.1,
  },
  savana: {
    terra: "#c48a52",
    cores: ["#f4c46c", "#eebb5f", "#f7cc7a", "#e8b458"],
    rocha: "#c98a4b",
    base: 0.85,
    amp: 1.0,
  },
  rios: {
    terra: "#94704f",
    cores: ["#5fb56f", "#56ab66", "#68bd78", "#4da05d"],
    rocha: "#8a8f7c",
    base: 0.7,
    amp: 0.9,
  },
  cerrado: {
    terra: "#b9814f",
    cores: ["#cfc76a", "#c6be60", "#d8d074", "#bdb556"],
    rocha: "#b49a6e",
    base: 0.85,
    amp: 0.8,
  },
  recife: { terra: "#d8c49a", cores: ["#f0dca8"], rocha: "#cfc8bf", base: 0, amp: 0 },
};

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface BiomaIlha extends BiomaPais {
  x: number;
  z: number;
  /** true se é território da jornada (tem fases). */
  jogavel: boolean;
}

export interface FaseNoMapa {
  territorio: string;
  fase: number;
  pos: THREE.Vector3;
}

export interface Ilha {
  pais: PaisId;
  silhueta: Silhueta;
  biomas: BiomaIlha[];
  /** Distância até a costa (positivo = terra). */
  dist: (x: number, z: number) => number;
  biomaEm: (x: number, z: number) => BiomaIlha;
  /** Bioma marinho naquele ponto do mar (ou null). */
  marEm: (x: number, z: number) => BiomaIlha | null;
  altura: (x: number, z: number) => number;
  distanciaTrilha: (x: number, z: number) => number;
  fases: FaseNoMapa[];
  trilha: THREE.Vector3[];
  trechos: { territorio: string; pontos: THREE.Vector3[] }[];
  pier: THREE.Vector3[];
  centro: (id: string) => THREE.Vector3;
  inicio: THREE.Vector3;
  /** Alturas pré-calculadas numa grade fina (para a malha do terreno). */
  relevo: { min: number; passo: number; n: number; h: Float32Array };
}

export const NIVEL_PIER = 0.42;
/** Altura do alto da praia (acima disso começa o degrau de terra). */
const TOPO_PRAIA = 0.3;
const DOM = { min: -21, passo: 0.25, n: 169 }; // grade de cálculo (cobre a ilha e o mar em volta)
const RAIO_MAR = 7.5; // alcance de um bioma marinho a partir da âncora

// ── Construção ──────────────────────────────────────────────────────────────

const cache = new Map<PaisId, Ilha>();

export function criarIlha(paisId: PaisId): Ilha {
  const pronta = cache.get(paisId);
  if (pronta) return pronta;
  const pais = PAISES.find((p) => p.id === paisId)!;
  const sil = silhueta(paisId);
  const seed = paisId.length * 31 + paisId.charCodeAt(0);

  // 1) Distância assinada até a costa, numa grade
  const pts = sil.pontos;
  const grade = (f: (x: number, z: number) => number) => {
    const g = new Float32Array(DOM.n * DOM.n);
    for (let j = 0; j < DOM.n; j++)
      for (let i = 0; i < DOM.n; i++)
        g[j * DOM.n + i] = f(DOM.min + i * DOM.passo, DOM.min + j * DOM.passo);
    return g;
  };
  const amostrar = (g: Float32Array) => (x: number, z: number) => {
    const fx = (x - DOM.min) / DOM.passo;
    const fz = (z - DOM.min) / DOM.passo;
    const i = Math.max(0, Math.min(DOM.n - 2, Math.floor(fx)));
    const j = Math.max(0, Math.min(DOM.n - 2, Math.floor(fz)));
    const u = Math.min(1, Math.max(0, fx - i));
    const v = Math.min(1, Math.max(0, fz - j));
    const a = (ii: number, jj: number) => g[jj * DOM.n + ii];
    return (
      (a(i, j) * (1 - u) + a(i + 1, j) * u) * (1 - v) +
      (a(i, j + 1) * (1 - u) + a(i + 1, j + 1) * u) * v
    );
  };
  const sdfBruta = (x: number, z: number) => {
    let dmin = Infinity;
    let dentro = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i];
      const b = pts[j];
      if (
        a.z > z !== b.z > z &&
        x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x
      )
        dentro = !dentro;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const t = Math.max(
        0,
        Math.min(
          1,
          ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1),
        ),
      );
      const d = (x - a.x - t * dx) ** 2 + (z - a.z - t * dz) ** 2;
      if (d < dmin) dmin = d;
    }
    const d = Math.sqrt(dmin);
    return dentro ? d : -d;
  };
  const sdf = amostrar(grade(sdfBruta));
  const dist = (x: number, z: number) =>
    sdf(x, z) + (fbm(x * 0.35, z * 0.35, seed) - 0.5) * 0.7;

  // 2) Biomas: âncoras na silhueta (ajustadas para cair em terra ou no mar)
  const biomas: BiomaIlha[] = pais.biomas.map((b) => {
    let { x, z } = sil.uv(b.u, b.v);
    const ok = (px: number, pz: number) =>
      b.noMar
        ? sdfBruta(px, pz) < -2.5 && sdfBruta(px, pz) > -6
        : sdfBruta(px, pz) > 2.2;
    if (!ok(x, z)) {
      let melhor = { x, z, d: Infinity };
      for (let r = 0.5; r < 14 && melhor.d === Infinity; r += 0.5)
        for (let k = 0; k < 24; k++) {
          const a = (k / 24) * Math.PI * 2;
          const px = x + Math.cos(a) * r;
          const pz = z + Math.sin(a) * r;
          if (ok(px, pz)) {
            melhor = { x: px, z: pz, d: r };
            break;
          }
        }
      x = melhor.x;
      z = melhor.z;
    }
    return { ...b, x, z, jogavel: !b.decorativo && !!b.niveis };
  });
  const terra = biomas.filter((b) => !b.noMar);
  const mares = biomas.filter((b) => b.noMar);

  const warp = (x: number, z: number) => ({
    x: x + (fbm(x * 0.13 + 3, z * 0.13, seed + 5) - 0.5) * 3.2,
    z: z + (fbm(x * 0.13, z * 0.13 + 7, seed + 9) - 0.5) * 3.2,
  });
  /** Distâncias (onduladas) até cada âncora de terra. */
  const distancias = (x: number, z: number) => {
    const w = warp(x, z);
    return terra.map((b) => Math.hypot(w.x - b.x, w.z - b.z));
  };
  const marEm = (x: number, z: number) => {
    // primeiro o teste barato (perto de uma âncora marinha), depois a distância exata à costa
    const m = mares.find((m) => Math.hypot(x - m.x, z - m.z) < RAIO_MAR);
    if (!m || sdfBruta(x, z) > -0.3) return null;
    return m;
  };
  const biomaTerra = (x: number, z: number) => {
    const ds = distancias(x, z);
    let k = 0;
    for (let i = 1; i < ds.length; i++) if (ds[i] < ds[k]) k = i;
    return terra[k];
  };
  const biomaEm = (x: number, z: number) => marEm(x, z) ?? biomaTerra(x, z);

  // 3) Trilha: serpentina em faixas paralelas dentro de cada território, sempre avançando
  //    na direção do próximo bioma (3 fases por faixa, curvas arredondadas, nada se cruza).
  const jogaveis = biomas.filter((b) => b.jogavel);
  const pontosTrilha: { x: number; z: number; t?: string; f?: number }[] = [];
  const fases2d: { territorio: string; fase: number; x: number; z: number }[] =
    [];
  const sequencia: { x: number; z: number; t?: string; f?: number }[] = [];
  jogaveis.forEach((b, k) => {
    const n = TERRITORIOS.find((t) => t.id === b.id)!.fases.length;
    const ant = jogaveis[k - 1] ?? { x: -b.x * 0.3, z: b.z + 6 };
    const prox = jogaveis[k + 1] ?? {
      x: b.x + (b.x - ant.x),
      z: b.z + (b.z - ant.z),
    };
    let dx = prox.x - ant.x;
    let dz = prox.z - ant.z;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    let px = -dz;
    let pz = dx;
    /** Fase vale se está no próprio bioma (ou num vizinho só de cenário, que não é de outra fase). */
    const valido = (x: number, z: number) => {
      if (b.noMar) return marEm(x, z) === b && sdfBruta(x, z) < -1.4;
      if (sdfBruta(x, z) < 1.4) return false;
      const t = biomaTerra(x, z);
      return t === b || !t.jogavel;
    };
    const porFaixa = n <= 4 ? n : 3;
    const faixas = Math.ceil(n / porFaixa);
    const padrao = (esc: number, cx = b.x, cz = b.z) => {
      const out: { x: number; z: number; f?: number }[] = [];
      let idx = 0;
      for (let i = 0; i < faixas; i++) {
        const qtd = Math.min(porFaixa, n - idx);
        const along = (i - (faixas - 1) / 2) * 3.0 * esc;
        let ultimoLat = 0;
        for (let q = 0; q < qtd; q++) {
          const l0 = qtd === 1 ? 0 : (q / (qtd - 1) - 0.5) * 2 * 2.6 * esc;
          const lat = i % 2 === 0 ? l0 : -l0;
          out.push({
            x: cx + dx * along + px * lat,
            z: cz + dz * along + pz * lat,
            f: idx,
          });
          ultimoLat = lat;
          idx++;
        }
        // curva arredondada até a próxima faixa
        if (i < faixas - 1) {
          const lado = Math.sign(ultimoLat) || 1;
          const meio = along + 1.5 * esc;
          const lat = lado * (2.6 * esc + 0.9);
          out.push({
            x: cx + dx * meio + px * lat,
            z: cz + dz * meio + pz * lat,
          });
        }
      }
      return out;
    };
    // Procura o maior tamanho (e o melhor centro perto da âncora) em que todas as fases cabem no bioma
    let escolhido = padrao(0.5);
    const [dx0, dz0, px0, pz0] = [dx, dz, px, pz];
    procura: for (let esc = 1.1; esc >= 0.5; esc -= 0.05) {
      for (const girar of [false, true]) {
        // testa as faixas nas duas orientações
        [dx, dz, px, pz] = girar
          ? [px0, pz0, -dx0, -dz0]
          : [dx0, dz0, px0, pz0];
        for (let r = 0; r <= 5; r += 1) {
          const voltas = r === 0 ? 1 : 12;
          for (let q = 0; q < voltas; q++) {
            const a = (q / voltas) * Math.PI * 2;
            const pts = padrao(
              esc,
              b.x + Math.cos(a) * r,
              b.z + Math.sin(a) * r,
            );
            if (pts.every((p) => p.f === undefined || valido(p.x, p.z))) {
              escolhido = pts;
              break procura;
            }
          }
        }
      }
    }
    for (const p of escolhido) {
      if (p.f !== undefined) {
        let { x, z } = p;
        for (let tent = 0; tent < 12 && !valido(x, z); tent++) {
          x += (b.x - x) * 0.25;
          z += (b.z - z) * 0.25;
        }
        fases2d.push({ territorio: b.id, fase: p.f, x, z });
        sequencia.push({ x, z, t: b.id, f: p.f });
      } else {
        sequencia.push({ x: p.x, z: p.z });
      }
    }
  });
  const prim = fases2d[0];
  const seg = fases2d[1] ?? prim;
  let ix = prim.x - (seg.x - prim.x) * 0.8;
  let iz = prim.z - (seg.z - prim.z) * 0.8;
  for (let t = 0; t < 10 && sdfBruta(ix, iz) < 1.2; t++) {
    ix += (prim.x - ix) * 0.3;
    iz += (prim.z - iz) * 0.3;
  }
  pontosTrilha.push({ x: ix, z: iz });
  for (const p of sequencia) pontosTrilha.push(p);
  const curva = new THREE.CatmullRomCurve3(
    pontosTrilha.map((p) => new THREE.Vector3(p.x, 0, p.z)),
    false,
    "centripetal",
  );
  const amostras2d = curva.getSpacedPoints(
    Math.max(300, Math.round(curva.getLength() * 6)),
  );

  const distTrilha = amostrar(
    grade((x, z) => {
      let d = Infinity;
      for (const p of amostras2d) {
        const dd = (p.x - x) ** 2 + (p.z - z) ** 2;
        if (dd < d) d = dd;
      }
      return Math.sqrt(d);
    }),
  );

  // 4) Relevo
  const uluru = paisId === "australia" ? sil.uv(0.45, 0.55) : null;
  const partes = (x: number, z: number) => {
    const d = dist(x, z);
    if (d < 0) {
      // contínuo com a praia (sem degrau na linha d'água): plataforma rasa e depois o fundo
      const fundo = Math.max(-3, d > -0.7 ? d * 0.5 : -0.35 + (d + 0.7) * 0.75);
      // recife: o fundo sobe suavemente perto da âncora do bioma marinho (sem degrau)
      let recife = 0;
      for (const m of mares) recife = Math.max(recife, 1 - smooth(4.5, RAIO_MAR, Math.hypot(x - m.x, z - m.z)));
      const raso = -0.75 + fbm(x * 0.5, z * 0.5, 21) * 0.3;
      return { final: recife > 0 ? fundo + (Math.max(fundo, raso) - fundo) * recife : fundo, plano: fundo, agua: true, d };
    }
    const ds = distancias(x, z);
    const d1 = Math.min(...ds);
    const pesos = ds.map((v) => Math.exp(-(v - d1) / 0.9));
    const soma = pesos.reduce((a, b) => a + b, 0);
    let base = 0;
    let amp = 0;
    const extra: number[] = [];
    terra.forEach((b, i) => {
      const w = pesos[i] / soma;
      const vis = VISUAL[b.tipo];
      base += vis.base * w;
      amp += vis.amp * w;
      // Relevo próprio de cada tipo
      let e = 0;
      if (b.tipo === "deserto")
        e =
          (Math.sin(x * 0.9 + fbm(x * 0.2, z * 0.2, 4) * 6) * 0.5 + 0.5) * 0.45; // dunas
      if (b.tipo === "bambuzal")
        e = Math.max(0, fbm(x * 0.32, z * 0.32, 8) - 0.52) * 7; // morros pontudos
      if (b.tipo === "taiga") e = fbm(x * 0.25, z * 0.25, 6) * 0.6;
      if (b.tipo === "savana")
        e = Math.round(fbm(x * 0.18, z * 0.18, 3) * 3) * 0.28; // mesas
      if (b.tipo === "tundra") e = -0.15;
      extra.push(e * w);
    });
    const colinas = (fbm(x * 0.11, z * 0.11, seed + 2) - 0.4) * amp;
    const tipico = extra.reduce((a, b) => a + b, 0);
    // Serras nas fronteiras entre biomas (onde a 2ª âncora está quase tão perto quanto a 1ª)
    const ord = [...ds].sort((a, b) => a - b);
    const fronteira = ord.length > 1 ? ord[1] - ord[0] : 99;
    const serra =
      (1 - smooth(0, 2.6, fronteira)) ** 1.5 *
      (0.55 + fbm(x * 0.3, z * 0.3, 13) * 0.9);
    let monolito = 0;
    if (uluru)
      monolito =
        (1 - smooth(1.3, 1.9, Math.hypot(x - uluru.x, z - uluru.z))) * 1.5;
    // Camadas de maquete na costa: praia larga e lisa → degrau de terra → platô de grama.
    // Em alguns trechos a praia some e o degrau vira falésia.
    const falesia = smooth(0.6, 0.72, fbm(x * 0.16 + 11, z * 0.16, seed + 17));
    const larg = (0.75 + fbm(x * 0.3, z * 0.3, seed + 19) * 0.9) * (1 - falesia * 0.8);
    const praia = Math.min(d / larg, 1) * TOPO_PRAIA;
    const topo = 0.62 + falesia * 0.55;
    const k = smooth(larg, larg + 2.6, d);
    const degrau = smooth(larg, larg + 0.3 + 0.3 * (1 - falesia), d);
    const subir = (bruto: number) =>
      praia + (smax(topo + (bruto - topo) * k, 0.5, 0.2) - praia) * degrau;
    const plano = subir(base + colinas * 0.35);
    const final = subir(base + colinas + tipico + serra + monolito);
    return { final, plano, agua: false, d };
  };

  // Mirantes: cada fase fica num platô levemente acima do caminho
  const mirantes = fases2d.map((f) => ({
    ...f,
    h: Math.max(NIVEL_PIER, partes(f.x, f.z).plano + 0.28),
  }));

  const altura = (x: number, z: number) => {
    const p = partes(x, z);
    const dt = distTrilha(x, z);
    const w = 1 - smooth(0.7, 1.8, dt);
    let h = p.agua ? p.final : p.final * (1 - w) + p.plano * w;
    // a trilha em terra nunca desce à areia (senão vira píer): rampa suave sobre a praia
    if (!p.agua) h += (Math.max(h, NIVEL_PIER + 0.04) - h) * w * smooth(0, 0.25, p.d);
    for (const m of mirantes) {
      const dm = Math.hypot(x - m.x, z - m.z);
      if (dm < 1.6 && !p.agua) h = h + (m.h - h) * (1 - smooth(0.75, 1.6, dm));
    }
    return h;
  };
  const chao = (x: number, z: number) => Math.max(altura(x, z), NIVEL_PIER);

  const trilha = amostras2d.map(
    (p) => new THREE.Vector3(p.x, chao(p.x, p.z) + 0.06, p.z),
  );
  const pier = amostras2d
    .filter((p) => altura(p.x, p.z) < NIVEL_PIER - 0.08)
    .map((p) => new THREE.Vector3(p.x, NIVEL_PIER, p.z));
  const trechos: Ilha["trechos"] = [];
  for (const p of trilha) {
    const t = biomaEm(p.x, p.z);
    const id = t.jogavel
      ? t.id
      : (trechos[trechos.length - 1]?.territorio ?? jogaveis[0].id);
    const ult = trechos[trechos.length - 1];
    if (ult && ult.territorio === id) ult.pontos.push(p);
    else
      trechos.push({
        territorio: id,
        pontos: ult ? [ult.pontos[ult.pontos.length - 1], p] : [p],
      });
  }
  const fases = fases2d.map((f) => ({
    territorio: f.territorio,
    fase: f.fase,
    pos: new THREE.Vector3(f.x, chao(f.x, f.z), f.z),
  }));

  const ilha: Ilha = {
    pais: paisId,
    silhueta: sil,
    biomas,
    dist,
    biomaEm,
    marEm,
    altura,
    distanciaTrilha: distTrilha,
    fases,
    trilha,
    trechos,
    pier,
    centro: (id) => {
      const b = biomas.find((x) => x.id === id)!;
      return new THREE.Vector3(b.x, chao(b.x, b.z), b.z);
    },
    inicio: new THREE.Vector3(ix, chao(ix, iz), iz),
    relevo: (() => {
      const passo = 0.2;
      const min = -21.6;
      const n = 217; // 216 células = 27 blocos de 8 (quadtree da malha do terreno)
      const h = new Float32Array(n * n);
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++)
          h[j * n + i] = altura(min + i * passo, min + j * passo);
      return { min, passo, n, h };
    })(),
  };
  cache.set(paisId, ilha);
  return ilha;
}

// ── Geometrias ──────────────────────────────────────────────────────────────

const COR_AREIA = new THREE.Color("#f3dba0");
const COR_AREIA_MOLHADA = new THREE.Color("#dfc187");
const COR_SEIXO = new THREE.Color("#cfd5da");
const COR_RASO = new THREE.Color("#c9ecd2");
const COR_RECIFE = new THREE.Color("#ddf3cf");
const COR_FUNDO = new THREE.Color("#5cc4b5");
const COR_FUNDO_FUNDO = new THREE.Color("#13989c");
const COR_NEVE = new THREE.Color("#ffffff");
const CINZA = new THREE.Color("#c4c7dc");

// Limiares das zonas (todos viram linhas de contorno limpas na malha)
const Y_PLATAFORMA = -0.5; // borda do raso claro
const Y_MOLHADO = 0.07; // faixa de areia molhada na beira d'água
const Y_AREIA = TOPO_PRAIA + 0.03; // acima disso acaba a praia
const G_TERRA = 0.85; // inclinação a partir da qual aparece a borda de terra
const G_ROCHA = 1.6; // inclinação de rocha (falésias, serras íngremes)
const MANCHAS = [0.42, 0.6]; // manchas grandes de tom na grama
const ESTRATOS = [0.95, 1.35, 1.75, 2.15, 2.55, 2.95]; // faixas nas encostas de terra/rocha

/**
 * Terreno low-poly "de maquete":
 * - Malha adaptativa (quadtree de 1,6 → 0,2 sobre a grade `relevo`, sem rachaduras):
 *   faces grandes no plano, pequenas em encostas, costa, fronteiras e perto da trilha.
 *   Vértices com jitter determinístico e diagonais alternadas (nada de grade aparente).
 * - Cada triângulo é recortado nas linhas de contorno das zonas (areia, degrau de terra,
 *   rocha, neve, manchas de tom, estratos), então as bordas saem limpas e cada pedaço
 *   recebe UMA cor sólida, decidida no seu centro. Sem pontilhado, sem mistura por vértice.
 */
export function geometriaTerreno(
  ilha: Ilha,
  liberados: Record<string, boolean>,
) {
  const { min, passo: s, n, h } = ilha.relevo;
  const C = n - 1; // células finas por lado
  const NV = 3; // níveis acima do fino: blocos de 8×8 células (1,6)
  const B = 1 << NV;
  const cl = (v: number) => Math.max(0, Math.min(n - 1, v));
  const H = (i: number, j: number) => h[cl(j) * n + cl(i)];
  const hb = (x: number, z: number) => {
    const fx = (x - min) / s;
    const fz = (z - min) / s;
    const i = Math.max(0, Math.min(n - 2, Math.floor(fx)));
    const j = Math.max(0, Math.min(n - 2, Math.floor(fz)));
    const u = Math.min(1, Math.max(0, fx - i));
    const v = Math.min(1, Math.max(0, fz - j));
    return (
      (H(i, j) * (1 - u) + H(i + 1, j) * u) * (1 - v) +
      (H(i, j + 1) * (1 - u) + H(i + 1, j + 1) * u) * v
    );
  };
  const incl = (x: number, z: number) =>
    Math.hypot(hb(x + s, z) - hb(x - s, z), hb(x, z + s) - hb(x, z - s)) /
    (2 * s);
  const mares = ilha.biomas.filter((b) => b.noMar);
  const pertoDoMar = (x: number, z: number) =>
    mares.some((m) => Math.hypot(x - m.x, z - m.z) < RAIO_MAR);

  // 1) O que entra na malha (ilha + recife + uma faixa de fundo do mar)
  const manter = new Uint8Array(n * n);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const x = min + i * s;
      const z = min + j * s;
      manter[j * n + i] = ilha.dist(x, z) > -3.4 || pertoDoMar(x, z) ? 1 : 0;
    }

  // 2) Quadtree: decide o tamanho das faces
  const biomaId = (i: number, j: number) =>
    ilha.biomaEm(min + i * s, min + j * s).id;
  const trilhaPerto = (i: number, j: number) =>
    ilha.distanciaTrilha(min + i * s, min + j * s) < 2.4;
  type Folha = { i: number; j: number; lv: number };
  const avaliar = (f: Folha) => {
    const S = 1 << f.lv;
    let algum = false;
    let erro = 0;
    let hmin = Infinity;
    let hmax = -Infinity;
    const h00 = H(f.i, f.j);
    const h10 = H(f.i + S, f.j);
    const h01 = H(f.i, f.j + S);
    const h11 = H(f.i + S, f.j + S);
    for (let jj = 0; jj <= S; jj++)
      for (let ii = 0; ii <= S; ii++) {
        const k = cl(f.j + jj) * n + cl(f.i + ii);
        if (manter[k]) algum = true;
        const y = h[k];
        const u = ii / S;
        const v = jj / S;
        const bil =
          (h00 * (1 - u) + h10 * u) * (1 - v) + (h01 * (1 - u) + h11 * u) * v;
        erro = Math.max(erro, Math.abs(y - bil));
        hmin = Math.min(hmin, y);
        hmax = Math.max(hmax, y);
      }
    if (!algum) return { algum, dividir: false };
    if (f.lv === 0) return { algum, dividir: false };
    let dividir = erro > 0.045;
    if (!dividir && f.lv >= 2) {
      // costa (contorno limpo), fronteira de bioma, faixa da trilha: no máximo 0,4
      dividir =
        (hmin < 0.05 && hmax > -0.05) ||
        hmax - hmin > 0.6 ||
        trilhaPerto(f.i + S / 2, f.j + S / 2) ||
        new Set([
          biomaId(f.i, f.j),
          biomaId(f.i + S, f.j),
          biomaId(f.i, f.j + S),
          biomaId(f.i + S, f.j + S),
        ]).size > 1;
    }
    return { algum, dividir };
  };
  const nivel = new Int8Array(C * C).fill(-1);
  const marcar = (f: Folha, lv: number) => {
    const S = 1 << f.lv;
    for (let jj = 0; jj < S; jj++)
      for (let ii = 0; ii < S; ii++) {
        const a = f.i + ii;
        const b = f.j + jj;
        if (a < C && b < C) nivel[b * C + a] = lv;
      }
  };
  const filhos = (f: Folha): Folha[] => {
    const m = 1 << (f.lv - 1);
    return [
      { i: f.i, j: f.j, lv: f.lv - 1 },
      { i: f.i + m, j: f.j, lv: f.lv - 1 },
      { i: f.i, j: f.j + m, lv: f.lv - 1 },
      { i: f.i + m, j: f.j + m, lv: f.lv - 1 },
    ];
  };
  let folhas: Folha[] = [];
  const construir = (f: Folha) => {
    const { algum, dividir } = avaliar(f);
    if (!algum) return;
    if (dividir) filhos(f).forEach(construir);
    else {
      folhas.push(f);
      marcar(f, f.lv);
    }
  };
  for (let bj = 0; bj < C / B; bj++)
    for (let bi = 0; bi < C / B; bi++) construir({ i: bi * B, j: bj * B, lv: NV });
  // Equilíbrio 2:1 entre vizinhas (garante que cada aresta tem no máximo um ponto do meio)
  const nv = (a: number, b: number) =>
    a < 0 || b < 0 || a >= C || b >= C ? -1 : nivel[b * C + a];
  const vizinhoMaisFino = (f: Folha, lim: number) => {
    const S = 1 << f.lv;
    for (let t = 0; t < S; t++) {
      for (const v of [
        nv(f.i - 1, f.j + t),
        nv(f.i + S, f.j + t),
        nv(f.i + t, f.j - 1),
        nv(f.i + t, f.j + S),
      ])
        if (v >= 0 && v < lim) return true;
    }
    return false;
  };
  for (let mudou = true; mudou; ) {
    mudou = false;
    const prox: Folha[] = [];
    for (const f of folhas) {
      if (f.lv >= 2 && vizinhoMaisFino(f, f.lv - 1)) {
        mudou = true;
        for (const c of filhos(f)) {
          if (avaliar(c).algum) {
            prox.push(c);
            marcar(c, c.lv);
          } else marcar(c, -1);
        }
      } else prox.push(f);
    }
    folhas = prox;
  }

  // 3) Vértices: jitter proporcional à menor face que toca o ponto
  const menor = new Int8Array(n * n).fill(99);
  for (const f of folhas) {
    const S = 1 << f.lv;
    for (let t = 0; t <= S; t++)
      for (const [a, b] of [
        [f.i + t, f.j],
        [f.i + t, f.j + S],
        [f.i, f.j + t],
        [f.i + S, f.j + t],
      ]) {
        const k = b * n + a;
        if (f.lv < menor[k]) menor[k] = f.lv;
      }
    const k = (f.j + S / 2) * n + f.i + S / 2;
    if (S > 1 && f.lv < menor[k]) menor[k] = f.lv;
  }
  // Cada vértice: [x, y, z, inclinação, mancha, neve]
  const K = 6;
  const vert = new Map<number, number[]>();
  const V = (a: number, b: number) => {
    const k = b * n + a;
    let p = vert.get(k);
    if (p) return p;
    const borda = a === 0 || b === 0 || a === C || b === C;
    const amp = borda ? 0 : 0.24 * s * (1 << Math.min(NV, menor[k]));
    const ang = hash(a, b, 71) * Math.PI * 2;
    const r = amp * (0.35 + 0.65 * hash(a, b, 72));
    const x = min + a * s + Math.cos(ang) * r;
    const z = min + b * s + Math.sin(ang) * r;
    p = [
      x,
      ilha.altura(x, z),
      z,
      incl(x, z),
      fbm(x * 0.17, z * 0.17, 77),
      (fbm(x * 0.6, z * 0.6, 79) - 0.5) * 0.5,
    ];
    p[5] += p[1] - 3.35;
    vert.set(k, p);
    return p;
  };

  // 4) Triangulação das folhas
  let T: number[] = [];
  const tri = (p: number[], q: number[], r: number[]) => {
    // sempre virado para cima (CCW visto de +y)
    const ux = q[0] - p[0];
    const uz = q[2] - p[2];
    const vx = r[0] - p[0];
    const vz = r[2] - p[2];
    if (uz * vx - ux * vz < 0) [q, r] = [r, q];
    T.push(...p, ...q, ...r);
  };
  for (const f of folhas) {
    const S = 1 << f.lv;
    const m = S >> 1;
    const c0 = V(f.i, f.j);
    const c1 = V(f.i + S, f.j);
    const c2 = V(f.i + S, f.j + S);
    const c3 = V(f.i, f.j + S);
    const fino = (lado: number) => {
      if (S < 2) return false;
      for (let t = 0; t < S; t++) {
        const v =
          lado === 0
            ? nv(f.i + t, f.j - 1)
            : lado === 1
              ? nv(f.i + S, f.j + t)
              : lado === 2
                ? nv(f.i + t, f.j + S)
                : nv(f.i - 1, f.j + t);
        if (v >= 0 && v < f.lv) return true;
      }
      return false;
    };
    const meios = [0, 1, 2, 3].map(fino);
    if (!meios.some(Boolean)) {
      // duas faces; a diagonal alterna de forma irregular
      if (hash(f.i, f.j, 73) < 0.5) {
        tri(c0, c1, c2);
        tri(c0, c2, c3);
      } else {
        tri(c0, c1, c3);
        tri(c1, c2, c3);
      }
      continue;
    }
    // leque a partir do centro, incluindo os pontos do meio das arestas vizinhas mais finas
    const anel: number[][] = [c0];
    if (meios[0]) anel.push(V(f.i + m, f.j));
    anel.push(c1);
    if (meios[1]) anel.push(V(f.i + S, f.j + m));
    anel.push(c2);
    if (meios[2]) anel.push(V(f.i + m, f.j + S));
    anel.push(c3);
    if (meios[3]) anel.push(V(f.i, f.j + m));
    const ctr = V(f.i + m, f.j + m);
    for (let q = 0; q < anel.length; q++)
      tri(ctr, anel[q], anel[(q + 1) % anel.length]);
  }

  // 5) Recorte nas linhas de contorno das zonas
  const cortar = (
    campo: number,
    lim: number,
    so?: (t: number) => boolean,
  ) => {
    const out: number[] = [];
    const L = 3 * K;
    const mix = (a: number, b: number, t: number) => {
      const r = new Array<number>(K);
      for (let c = 0; c < K; c++) r[c] = T[a + c] + (T[b + c] - T[a + c]) * t;
      return r;
    };
    for (let t = 0; t < T.length; t += L) {
      const v0 = T[t + campo] - lim;
      const v1 = T[t + K + campo] - lim;
      const v2 = T[t + 2 * K + campo] - lim;
      const pos = (v0 >= 0 ? 1 : 0) + (v1 >= 0 ? 1 : 0) + (v2 >= 0 ? 1 : 0);
      if (pos === 0 || pos === 3 || (so && !so(t))) {
        for (let c = 0; c < L; c++) out.push(T[t + c]);
        continue;
      }
      // vértice sozinho do seu lado vira o primeiro (a ordem cíclica mantém a orientação)
      const vs = [v0, v1, v2];
      const sozinho = pos === 1 ? vs.findIndex((v) => v >= 0) : vs.findIndex((v) => v < 0);
      const i0 = t + sozinho * K;
      const i1 = t + ((sozinho + 1) % 3) * K;
      const i2 = t + ((sozinho + 2) % 3) * K;
      const a = vs[sozinho];
      const b = vs[(sozinho + 1) % 3];
      const c = vs[(sozinho + 2) % 3];
      const p0 = T.slice(i0, i0 + K);
      const p1 = T.slice(i1, i1 + K);
      const p2 = T.slice(i2, i2 + K);
      const q1 = mix(i0, i1, a / (a - b));
      const q2 = mix(i0, i2, a / (a - c));
      out.push(...p0, ...q1, ...q2, ...q1, ...p1, ...p2, ...q1, ...p2, ...q2);
    }
    T = out;
  };
  const maxCampo = (t: number, c: number) =>
    Math.max(T[t + c], T[t + K + c], T[t + 2 * K + c]);
  const minCampo = (t: number, c: number) =>
    Math.min(T[t + c], T[t + K + c], T[t + 2 * K + c]);
  cortar(1, Y_PLATAFORMA);
  cortar(1, 0);
  cortar(1, Y_MOLHADO);
  cortar(1, Y_AREIA);
  const emTerra = (t: number) => maxCampo(t, 1) > Y_AREIA;
  cortar(3, G_TERRA, emTerra);
  cortar(3, G_ROCHA, emTerra);
  cortar(5, 0, (t) => maxCampo(t, 1) > 2.6);
  const ingreme = (t: number) => maxCampo(t, 3) > G_TERRA && emTerra(t);
  for (const y of ESTRATOS) cortar(1, y, ingreme);
  const grama = (t: number) => minCampo(t, 3) < G_TERRA && emTerra(t);
  for (const m of MANCHAS) cortar(4, m, grama);

  // 6) Uma cor sólida por pedaço, decidida no centro
  const nTri = T.length / (3 * K);
  const pos = new Float32Array(nTri * 9);
  const cor = new Float32Array(nTri * 9);
  const algumLivre = Object.values(liberados).some(Boolean);
  const c = new THREE.Color();
  const tmp = new THREE.Color();
  const cache = new Map<string, THREE.Color[]>();
  const tons = (b: BiomaIlha) => {
    let t = cache.get(b.tipo);
    if (!t) {
      const vis = VISUAL[b.tipo];
      const terra = new THREE.Color(vis.terra);
      const rocha = new THREE.Color(vis.rocha);
      t = [
        new THREE.Color(vis.cores[3] ?? vis.cores[0]),
        new THREE.Color(vis.cores[0]),
        new THREE.Color(vis.cores[2] ?? vis.cores[0]),
        terra,
        terra.clone().multiplyScalar(0.86),
        rocha,
        rocha.clone().multiplyScalar(0.88),
      ];
      cache.set(b.tipo, t);
    }
    return t;
  };
  for (let f = 0; f < nTri; f++) {
    const t = f * 3 * K;
    let cx = 0, cy = 0, cz = 0, g = 0, mancha = 0, neve = 0;
    for (let v = 0; v < 3; v++) {
      const o = t + v * K;
      pos[f * 9 + v * 3] = T[o];
      pos[f * 9 + v * 3 + 1] = T[o + 1];
      pos[f * 9 + v * 3 + 2] = T[o + 2];
      cx += T[o] / 3;
      cy += T[o + 1] / 3;
      cz += T[o + 2] / 3;
      g += T[o + 3] / 3;
      mancha += T[o + 4] / 3;
      neve += T[o + 5] / 3;
    }
    if (cy < 0) {
      // fundo: raso claro (recife nos biomas marinhos) e depois o azul do fundo
      const recife = pertoDoMar(cx, cz) && ilha.marEm(cx, cz);
      if (cy > Y_PLATAFORMA) c.copy(recife ? COR_RECIFE : COR_RASO);
      else c.copy(COR_FUNDO).lerp(COR_FUNDO_FUNDO, smooth(Y_PLATAFORMA, -2.2, cy));
    } else {
      const b = ilha.biomaEm(cx, cz);
      const pal = tons(b);
      const fria = b.tipo === "tundra" || b.tipo === "taiga";
      if (cy < Y_MOLHADO) c.copy(fria ? COR_SEIXO : COR_AREIA_MOLHADA);
      else if (cy < Y_AREIA) c.copy(fria ? COR_SEIXO : COR_AREIA);
      else {
        const faixa = ESTRATOS.findIndex((y) => cy < y) % 2 === 1;
        if (neve > 0) c.copy(COR_NEVE);
        else if (g > G_ROCHA) c.copy(pal[faixa ? 6 : 5]);
        else if (g > G_TERRA) c.copy(pal[faixa ? 4 : 3]);
        else c.copy(pal[mancha < MANCHAS[0] ? 0 : mancha < MANCHAS[1] ? 1 : 2]);
        const livre = b.jogavel ? liberados[b.id] : algumLivre;
        if (!livre) c.lerp(tmp.copy(CINZA), 0.55);
      }
    }
    for (let v = 0; v < 3; v++) {
      cor[f * 9 + v * 3] = c.r;
      cor[f * 9 + v * 3 + 1] = c.g;
      cor[f * 9 + v * 3 + 2] = c.b;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(cor, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/** Fita seguindo a trilha (acompanha o relevo). */
export function geometriaFita(
  ilha: Ilha,
  pontos: THREE.Vector3[],
  largura: number,
  sobe: number,
) {
  const chao = (x: number, z: number) =>
    Math.max(ilha.altura(x, z), NIVEL_PIER);
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < pontos.length; i++) {
    const p = pontos[i];
    const a = pontos[Math.max(0, i - 1)];
    const b = pontos[Math.min(pontos.length - 1, i + 1)];
    const t = new THREE.Vector3().subVectors(b, a).setY(0).normalize();
    const px = -t.z * (largura / 2);
    const pz = t.x * (largura / 2);
    pos.push(
      p.x + px,
      chao(p.x + px, p.z + pz) + sobe,
      p.z + pz,
      p.x - px,
      chao(p.x - px, p.z - pz) + sobe,
      p.z - pz,
    );
    if (i < pontos.length - 1) {
      const j = i * 2;
      idx.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Linha de espuma seguindo a costa: contorno do nível `nivel` da distância à costa
 * (marching squares), desenhado como uma fita fina.
 */
export function geometriaEspuma(ilha: Ilha, nivel: number, largura: number) {
  const pos: number[] = [];
  const passo = 0.22;
  const n = Math.round(42 / passo);
  const f = (i: number, j: number) =>
    ilha.dist(-21 + i * passo, -21 + j * passo) - nivel;
  const linha = new Float32Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) linha[j * (n + 1) + i] = f(i, j);
  const v = (i: number, j: number) => linha[j * (n + 1) + i];
  const meio = (
    x1: number,
    z1: number,
    a: number,
    x2: number,
    z2: number,
    b: number,
  ) => {
    const t = a / (a - b);
    return [x1 + (x2 - x1) * t, z1 + (z2 - z1) * t] as const;
  };
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = v(i, j);
      const b = v(i + 1, j);
      const c = v(i + 1, j + 1);
      const d = v(i, j + 1);
      const x = -21 + i * passo;
      const z = -21 + j * passo;
      const cruz: (readonly [number, number])[] = [];
      if (a > 0 !== b > 0) cruz.push(meio(x, z, a, x + passo, z, b));
      if (b > 0 !== c > 0)
        cruz.push(meio(x + passo, z, b, x + passo, z + passo, c));
      if (c > 0 !== d > 0)
        cruz.push(meio(x + passo, z + passo, c, x, z + passo, d));
      if (d > 0 !== a > 0) cruz.push(meio(x, z + passo, d, x, z, a));
      for (let k = 0; k + 1 < cruz.length; k += 2) {
        const [x1, z1] = cruz[k];
        const [x2, z2] = cruz[k + 1];
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len = Math.hypot(dx, dz) || 1;
        const px = (-dz / len) * (largura / 2);
        const pz = (dx / len) * (largura / 2);
        // estende um pouco as pontas para os segmentos se emendarem
        const ex = (dx / len) * (largura / 2);
        const ez = (dz / len) * (largura / 2);
        const A = [x1 - ex + px, z1 - ez + pz];
        const B = [x1 - ex - px, z1 - ez - pz];
        const C = [x2 + ex + px, z2 + ez + pz];
        const D = [x2 + ex - px, z2 + ez - pz];
        pos.push(
          A[0],
          0,
          A[1],
          B[0],
          0,
          B[1],
          C[0],
          0,
          C[1],
          C[0],
          0,
          C[1],
          B[0],
          0,
          B[1],
          D[0],
          0,
          D[1],
        );
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}
