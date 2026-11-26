/**
 * Gera os pacotes de modelos 3D por país: public/modelos/<pais>.glb
 * Rode: npx tsx scripts/modelos.ts
 *
 * Fonte: scripts/modelos-fonte/*.glb (Kenney Nature Kit, CC0).
 * Para cada modelo: achata todas as malhas numa só, grava a cor do material nos vértices
 * (paleta do projeto, sem texturas), marca as partes tingíveis no atributo _TINGE,
 * normaliza o tamanho (base em y=0, centro em x/z) e comprime (quantização + meshopt).
 */
import { Document, NodeIO, type Primitive } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, quantize, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PAISES } from "../src/content/paises";
import { CORES_MATERIAL, FAMILIAS, TINGIVEIS, familiaDe, modelosDoPais } from "../src/components/mundo/modelos";

const FONTE = fileURLToPath(new URL("./modelos-fonte/", import.meta.url));
const SAIDA = fileURLToPath(new URL("../public/modelos/", import.meta.url));

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  // sRGB → linear (glTF guarda cores de vértice em linear)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
};

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

interface Malha {
  pos: number[];
  cor: number[];
  tinge: number[];
}

async function achatar(nome: string): Promise<Malha> {
  const doc = await io.read(`${FONTE}${nome}.glb`);
  const familia = familiaDe(nome);
  const tingiveis = TINGIVEIS[familia];
  const out: Malha = { pos: [], cor: [], tinge: [] };
  for (const no of doc.getRoot().listNodes()) {
    const mesh = no.getMesh();
    if (!mesh) continue;
    const M = no.getWorldMatrix(); // coluna-maior
    for (const prim of mesh.listPrimitives() as Primitive[]) {
      const mat = prim.getMaterial()?.getName() ?? "_defaultMat";
      const tinge = tingiveis.includes(mat);
      const cor = tinge ? [1, 1, 1] : hex(CORES_MATERIAL[mat] ?? "#cccccc");
      const P = prim.getAttribute("POSITION")!;
      const I = prim.getIndices();
      const n = I ? I.getCount() : P.getCount();
      const el: number[] = [];
      for (let k = 0; k < n; k++) {
        const idx = I ? I.getScalar(k) : k;
        P.getElement(idx, el);
        const [x, y, z] = el;
        out.pos.push(
          M[0] * x + M[4] * y + M[8] * z + M[12],
          M[1] * x + M[5] * y + M[9] * z + M[13],
          M[2] * x + M[6] * y + M[10] * z + M[14],
        );
        out.cor.push(...cor);
        out.tinge.push(tinge ? 1 : 0);
      }
    }
  }
  // normaliza: base em y = 0, centro em x/z, tamanho-alvo da família
  let [x0, y0, z0, x1, y1, z1] = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (let i = 0; i < out.pos.length; i += 3) {
    x0 = Math.min(x0, out.pos[i]); x1 = Math.max(x1, out.pos[i]);
    y0 = Math.min(y0, out.pos[i + 1]); y1 = Math.max(y1, out.pos[i + 1]);
    z0 = Math.min(z0, out.pos[i + 2]); z1 = Math.max(z1, out.pos[i + 2]);
  }
  const f = FAMILIAS[familia];
  const medida = f.medida === "altura" ? y1 - y0 : Math.max(x1 - x0, z1 - z0);
  const k = f.alvo / (medida || 1);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  for (let i = 0; i < out.pos.length; i += 3) {
    out.pos[i] = (out.pos[i] - cx) * k;
    out.pos[i + 1] = (out.pos[i + 1] - y0) * k;
    out.pos[i + 2] = (out.pos[i + 2] - cz) * k;
  }
  return out;
}

async function main() {
  await MeshoptEncoder.ready;
  io.registerDependencies({ "meshopt.encoder": MeshoptEncoder });
  const cache = new Map<string, Malha>();
  let total = 0;
  for (const pais of PAISES) {
    const doc = new Document();
    const buf = doc.createBuffer();
    const cena = doc.createScene(pais.id);
    let tris = 0;
    for (const nome of modelosDoPais(pais.id)) {
      if (!cache.has(nome)) cache.set(nome, await achatar(nome));
      const m = cache.get(nome)!;
      tris += m.pos.length / 9;
      const prim = doc
        .createPrimitive()
        .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(m.pos)).setBuffer(buf))
        .setAttribute("COLOR_0", doc.createAccessor().setType("VEC3").setArray(new Float32Array(m.cor)).setBuffer(buf))
        .setAttribute("_TINGE", doc.createAccessor().setType("SCALAR").setArray(new Float32Array(m.tinge)).setBuffer(buf));
      cena.addChild(doc.createNode(nome).setMesh(doc.createMesh(nome).addPrimitive(prim)));
    }
    await doc.transform(weld(), quantize(), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
    const arq = `${SAIDA}${pais.id}.glb`;
    await io.write(arq, doc);
    const kb = statSync(arq).size / 1024;
    total += kb;
    console.log(`${pais.id}: ${modelosDoPais(pais.id).length} modelos, ${tris} triângulos, ${kb.toFixed(0)} KB`);
  }
  console.log(`total: ${total.toFixed(0)} KB`);
}

main();
