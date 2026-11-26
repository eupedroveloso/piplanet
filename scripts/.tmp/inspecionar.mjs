import { NodeIO } from "@gltf-transform/core";
import { getBounds } from "@gltf-transform/core";
const dir = process.argv[2];
const io = new NodeIO();
for (const nome of process.argv.slice(3)) {
  const doc = await io.read(`${dir}/${nome}.glb`);
  const root = doc.getRoot();
  const b = getBounds(root.listScenes()[0]);
  let tris = 0;
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() ?? p.getAttribute("POSITION").getCount()) / 3;
  const mats = root.listMaterials().map((m) => m.getName() + ":" + m.getBaseColorFactor().slice(0, 3).map((v) => v.toFixed(2)).join(",") + (m.getBaseColorTexture() ? "+TEX" : ""));
  console.log(nome, "h", (b.max[1] - b.min[1]).toFixed(2), "w", (b.max[0] - b.min[0]).toFixed(2), "tris", tris, mats.join(" | "));
}
