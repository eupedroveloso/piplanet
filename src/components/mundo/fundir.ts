import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Junta peças ESTÁTICAS numa malha só, com a cor de cada peça gravada nos vértices.
 * Um draw call no lugar de dezenas (orçamento de tablet: ~80 draw calls no país).
 * Use com um material `vertexColors` (de preferência `flatShading`).
 */
export interface Parte {
  geo: THREE.BufferGeometry;
  pos: [number, number, number];
  rot?: [number, number, number];
  esc?: number | [number, number, number];
  cor: string;
}

const m = new THREE.Matrix4();
const q = new THREE.Quaternion();
const e = new THREE.Euler();
const v = new THREE.Vector3();
const s = new THREE.Vector3();
const c = new THREE.Color();

export function fundir(partes: Parte[]): THREE.BufferGeometry {
  if (!partes.length) return new THREE.BufferGeometry();
  const geos = partes.map((p) => {
    const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo.clone()) as THREE.BufferGeometry;
    for (const nome of Object.keys(g.attributes)) if (nome !== "position" && nome !== "normal") g.deleteAttribute(nome);
    if (!g.attributes.normal) g.computeVertexNormals();
    e.set(...(p.rot ?? [0, 0, 0]));
    q.setFromEuler(e);
    if (typeof p.esc === "number") s.setScalar(p.esc);
    else s.set(...(p.esc ?? [1, 1, 1]));
    m.compose(v.set(...p.pos), q, s);
    g.applyMatrix4(m);
    c.set(p.cor);
    const n = g.attributes.position.count;
    const cor = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      cor[i * 3] = c.r;
      cor[i * 3 + 1] = c.g;
      cor[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(cor, 3));
    return g;
  });
  const out = mergeGeometries(geos, false) ?? new THREE.BufferGeometry();
  geos.forEach((g) => g.dispose());
  return out;
}
