"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { PaisId } from "@/content/paises";
import type { Peca } from "./decoracao";
import { urlModelos } from "./modelos";

/**
 * Modelos prontos da decoração (pacote do país, baixado sob demanda) desenhados num
 * único BatchedMesh: todas as árvores, pedras, flores... em UM draw call (+1 da sombra).
 *
 * Cor de cada instância (Vector4):
 * - rgb = tinta das partes tingíveis do modelo (folhas, grama, corpo da pedra);
 * - a   = 1 normal, 0 desbotado (bioma trancado).
 */

const CINZA_LINEAR = new THREE.Color("#c4c7dc");

function criarMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aTinge;\nvarying float vDesbota;")
      .replace(
        "#include <color_vertex>",
        `vColor = vec4( 1.0 );
        #ifdef USE_COLOR
          vColor.rgb *= color;
        #endif
        vDesbota = 0.0;
        #ifdef USE_BATCHING_COLOR
          vec4 corLote = getBatchingColor( getIndirectIndex( gl_DrawID ) );
          vColor.rgb *= mix( vec3( 1.0 ), corLote.rgb, aTinge );
          vDesbota = 1.0 - corLote.a;
        #endif`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vDesbota;\nuniform vec3 uCinza;")
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb = mix( diffuseColor.rgb, uCinza, vDesbota * 0.6 );");
    sh.uniforms.uCinza = { value: CINZA_LINEAR };
  };
  return m;
}

/** Tira as geometrias do glTF: atributos em float, transformação do nó já aplicada, nome = modelo. */
function extrair(cena: THREE.Object3D) {
  const out = new Map<string, THREE.BufferGeometry>();
  cena.updateMatrixWorld(true);
  cena.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const src = mesh.geometry;
    const n = src.attributes.position.count;
    const pos = new Float32Array(n * 3);
    const cor = new Float32Array(n * 3);
    const tinge = new Float32Array(n);
    const P = src.attributes.position;
    const C = src.attributes.color;
    const T = src.attributes._tinge;
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(mesh.matrixWorld);
      pos.set([v.x, v.y, v.z], i * 3);
      if (C) cor.set([C.getX(i), C.getY(i), C.getZ(i)], i * 3);
      else cor.fill(1, i * 3, i * 3 + 3);
      tinge[i] = T ? T.getX(i) : 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(cor, 3));
    g.setAttribute("aTinge", new THREE.BufferAttribute(tinge, 1));
    g.setIndex(src.index ? Array.from(src.index.array as ArrayLike<number>) : Array.from({ length: n }, (_, i) => i));
    out.set(mesh.name, g);
  });
  return out;
}

export function Modelos({ pais, pecas, sombra }: { pais: PaisId; pecas: Peca[]; sombra: boolean }) {
  const { scene } = useGLTF(urlModelos(pais), false, true);
  const geos = useMemo(() => extrair(scene), [scene]);
  const material = useMemo(() => criarMaterial(), []);
  useEffect(() => () => { geos.forEach((g) => g.dispose()); }, [geos]);
  useEffect(() => () => material.dispose(), [material]);

  const lote = useMemo(() => {
    const lista = pecas.filter((p) => p.m && geos.has(p.m));
    const usados = [...new Set(lista.map((p) => p.m!))];
    let nv = 0;
    let ni = 0;
    for (const nome of usados) {
      const g = geos.get(nome)!;
      nv += g.attributes.position.count;
      ni += g.index!.count;
    }
    const bm = new THREE.BatchedMesh(Math.max(1, lista.length), Math.max(1, nv), Math.max(1, ni), material);
    const ids = new Map(usados.map((nome) => [nome, bm.addGeometry(geos.get(nome)!)]));
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const esc = new THREE.Vector3();
    const c = new THREE.Color();
    const cor = new THREE.Vector4();
    for (const p of lista) {
      const id = bm.addInstance(ids.get(p.m!)!);
      q.setFromEuler(e.set(...(p.r ?? [0, 0, 0])));
      m4.compose(pos.set(...p.p), q, esc.set(...p.s));
      bm.setMatrixAt(id, m4);
      c.set(p.c);
      bm.setColorAt(id, cor.set(c.r, c.g, c.b, p.d ? 0 : 1));
    }
    bm.sortObjects = false; // opaco: ordenar só gastaria CPU
    bm.receiveShadow = true;
    return bm;
  }, [geos, pecas, material]);
  // Descarte seguro: o StrictMode (dev) desmonta e remonta reaproveitando o mesmo lote,
  // e um BatchedMesh descartado não volta. Troca: descarta o anterior. Saída: só se for de verdade.
  const anterior = useRef<THREE.BatchedMesh | null>(null);
  const montado = useRef(false);
  useEffect(() => {
    if (anterior.current && anterior.current !== lote) anterior.current.dispose();
    anterior.current = lote;
  }, [lote]);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      setTimeout(() => {
        if (!montado.current) anterior.current?.dispose();
      }, 0);
    };
  }, []);

  return <primitive object={lote} castShadow={sombra} />;
}
