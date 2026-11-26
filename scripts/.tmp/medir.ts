import { criarIlha, geometriaTerreno } from "../../src/components/mundo/ilha";
import { PAISES } from "../../src/content/paises";
for (const p of PAISES) {
  let t = performance.now();
  const ilha = criarIlha(p.id);
  const t1 = performance.now() - t;
  t = performance.now();
  const g = geometriaTerreno(ilha, {});
  const t2 = performance.now() - t;
  console.log(p.id, "ilha", t1.toFixed(0), "ms terreno", t2.toFixed(0), "ms tris", g.attributes.position.count / 3);
}
