import { criarIlha } from "../../src/components/mundo/ilha";
const ilha = criarIlha("brasil");
for (const [dx, dz] of [[-1, 0.3], [0.2, 1], [1, -0.2]]) {
  const l = Math.hypot(dx, dz);
  let row = "";
  for (let r = 6; r < 20; r += 0.4) {
    const x = (dx / l) * r, z = (dz / l) * r;
    row += `${ilha.dist(x, z).toFixed(1)}:${ilha.altura(x, z).toFixed(2)} `;
  }
  console.log(row);
}
