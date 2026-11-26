import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { fbm, prng } from "./ilha";

/**
 * ROCHAS ESCULPIDAS (asteroides, lua, núcleo de cometa)
 * Icosaedro deformado por ruído + crateras (fundo afundado e borda levantada),
 * facetado (normal por face) e com UMA cor por face: manchas de tom, fundo das crateras
 * mais escuro e bordas mais claras. Determinístico pela semente.
 */
export interface OpcoesRocha {
  semente: number;
  /** Subdivisão do icosaedro (1 = 80 faces, 2 = 320, 3 = 1280). */
  detalhe: number;
  crateras: number;
  /** Quanto o ruído deforma (0 = esfera). */
  rugosidade: number;
  /** Tons do mais escuro ao mais claro. */
  paleta: string[];
  /** Tamanho das crateras (raio angular, em radianos). */
  raioCratera?: [number, number];
  /** Profundidade das crateras (mínima, máxima). */
  profundidade?: [number, number];
}

/** Ruído 3D barato a partir do fbm 2D (média de três planos). */
const ruido3 = (x: number, y: number, z: number, s: number) => (fbm(x, y, s) + fbm(y + 3.1, z, s + 1) + fbm(z + 7.7, x, s + 2)) / 3;

export function geometriaRocha(o: OpcoesRocha): THREE.BufferGeometry {
  const rnd = prng(o.semente);
  const [rmin, rmax] = o.raioCratera ?? [0.25, 0.6];
  const [pmin, pmax] = o.profundidade ?? [0.06, 0.16];
  const crateras = Array.from({ length: o.crateras }, () => {
    const u = rnd() * 2 - 1;
    const t = rnd() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return { c: new THREE.Vector3(Math.cos(t) * s, u, Math.sin(t) * s), r: rmin + rnd() * (rmax - rmin), prof: pmin + rnd() * (pmax - pmin) };
  });
  /** Para um ponto da esfera: deslocamento do raio e "onde está" em relação às crateras. */
  const avaliar = (n: THREE.Vector3) => {
    let r = 1 + (ruido3(n.x * 1.6, n.y * 1.6, n.z * 1.6, o.semente) - 0.5) * 2 * o.rugosidade;
    let fundo = 0;
    let borda = 0;
    for (const k of crateras) {
      const t = Math.acos(Math.min(1, Math.max(-1, n.dot(k.c)))) / k.r;
      if (t < 1) {
        r -= k.prof * (1 - t * t);
        fundo = Math.max(fundo, 1 - t);
      } else if (t < 1.45) {
        const b = Math.sin(((t - 1) / 0.45) * Math.PI);
        r += k.prof * 0.35 * b;
        borda = Math.max(borda, b);
      }
    }
    return { r, fundo, borda };
  };

  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, o.detalhe);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const P = g.attributes.position as THREE.BufferAttribute;
  const n = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    n.fromBufferAttribute(P, i).normalize();
    const { r } = avaliar(n);
    P.setXYZ(i, n.x * r, n.y * r, n.z * r);
  }
  const plana = g.toNonIndexed();
  g.dispose();
  plana.computeVertexNormals();

  // cor por face (decidida no centro da face)
  const Q = plana.attributes.position as THREE.BufferAttribute;
  const cor = new Float32Array(Q.count * 3);
  const paleta = o.paleta.map((h) => new THREE.Color(h));
  const c = new THREE.Color();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const d = new THREE.Vector3();
  for (let f = 0; f < Q.count; f += 3) {
    a.fromBufferAttribute(Q, f);
    b.fromBufferAttribute(Q, f + 1);
    d.fromBufferAttribute(Q, f + 2);
    n.copy(a).add(b).add(d).normalize();
    const { fundo, borda } = avaliar(n);
    // manchas grandes de tom (sem pontilhado)
    const mancha = ruido3(n.x * 1.1 + 5, n.y * 1.1, n.z * 1.1, o.semente + 9);
    const idx = Math.min(paleta.length - 1, Math.max(0, Math.floor((mancha - 0.25) * 2 * paleta.length)));
    c.copy(paleta[idx]);
    if (fundo > 0) c.multiplyScalar(0.8 - fundo * 0.14);
    else if (borda > 0.5) c.lerp(paleta[paleta.length - 1], 0.45);
    for (let k = 0; k < 3; k++) cor.set([c.r, c.g, c.b], (f + k) * 3);
  }
  plana.setAttribute("color", new THREE.BufferAttribute(cor, 3));
  plana.computeBoundingSphere();
  return plana;
}
