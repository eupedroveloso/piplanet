import * as THREE from "three";

/**
 * FORMAS LOW-POLY "DE MAQUETE"
 * Primitivas com vértices levemente deslocados (sempre do mesmo jeito para a mesma posição,
 * então as faces continuam fechadas), para as copas, pedras e pinheiros parecerem esculpidos
 * à mão em vez de geométricos perfeitos. Várias variações de cada para não repetir.
 */

export type Forma =
  | "cilindro"
  | "cone"
  | "icosa"
  | "dodeca"
  | "caixa"
  | "esfera"
  | "prisma"
  | "disco"
  | "copa0"
  | "copa1"
  | "copa2"
  | "copa3"
  | "rocha0"
  | "rocha1"
  | "rocha2"
  | "pinho0"
  | "pinho1";

function hash3(x: number, y: number, z: number, s: number) {
  let h = (Math.round(x * 1000) * 73856093) ^ (Math.round(y * 1000) * 19349663) ^ (Math.round(z * 1000) * 83492791) ^ (s * 2654435761);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Desloca cada vértice de acordo com a posição (vértices repetidos se movem juntos). */
function esculpir(g: THREE.BufferGeometry, forca: number, semente: number, escala: [number, number, number] = [1, 1, 1]) {
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const k = 1 + (hash3(x, y, z, semente) - 0.5) * 2 * forca;
    p.setXYZ(i, x * k * escala[0], y * k * escala[1] + (hash3(z, x, y, semente + 1) - 0.5) * forca * 0.3, z * k * escala[2]);
  }
  g.computeVertexNormals();
  return g;
}

function copa(semente: number) {
  // icosaedro grosseiro (20 faces) com cara de "folhagem esculpida"
  const g = new THREE.IcosahedronGeometry(0.5, semente % 2 === 0 ? 0 : 1);
  return esculpir(g, semente % 2 === 0 ? 0.18 : 0.12, semente, [1, 0.85, 1]);
}

function rocha(semente: number) {
  if (semente === 0) {
    // bloco anguloso chanfrado
    const g = new THREE.BoxGeometry(1, 0.8, 0.9, 2, 1, 2);
    return esculpir(g, 0.16, 11);
  }
  const g = new THREE.DodecahedronGeometry(0.5, 0);
  return esculpir(g, 0.22, semente * 17, [1.1, 0.75, 0.95]);
}

function pinho(semente: number) {
  // andar de pinheiro: cone baixo de 7 lados com a borda levemente irregular
  const g = new THREE.ConeGeometry(0.5, 1, 7, 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y < 0) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const k = 1 + (hash3(x, y, z, semente) - 0.5) * 0.22;
      p.setXYZ(i, x * k, y + (hash3(z, x, y, semente) - 0.5) * 0.12, z * k);
    }
  }
  g.computeVertexNormals();
  return g;
}

export const GEOMETRIAS: Record<Forma, () => THREE.BufferGeometry> = {
  cilindro: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 7),
  cone: () => new THREE.ConeGeometry(0.5, 1, 8),
  icosa: () => new THREE.IcosahedronGeometry(0.5, 1),
  dodeca: () => new THREE.DodecahedronGeometry(0.5, 0),
  caixa: () => new THREE.BoxGeometry(1, 1, 1),
  esfera: () => new THREE.SphereGeometry(0.5, 10, 8),
  prisma: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 3, 1, false, Math.PI / 2),
  disco: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  copa0: () => copa(0),
  copa1: () => copa(1),
  copa2: () => copa(2),
  copa3: () => copa(3),
  rocha0: () => rocha(0),
  rocha1: () => rocha(1),
  rocha2: () => rocha(2),
  pinho0: () => pinho(3),
  pinho1: () => pinho(7),
};
