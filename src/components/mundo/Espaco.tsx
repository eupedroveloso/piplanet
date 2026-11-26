"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fundir, type Parte } from "./fundir";
import { prng } from "./ilha";
import { geometriaRocha } from "./rochas";

/**
 * ESPAÇO EM VOLTA DO PLANETA
 * Estrelas que cintilam, lua com crateras, cinturão de asteroides, foguetes orbitando,
 * satélite e um cometa. Tudo devagar e suave.
 */

/** Campo de estrelas: duas camadas que cintilam em ritmos diferentes. */
export function Estrelas() {
  const camadas = useMemo(() => {
    const rnd = prng(808);
    return [0, 1].map((c) => {
      const n = c === 0 ? 2600 : 700;
      const pos = new Float32Array(n * 3);
      const cor = new Float32Array(n * 3);
      const paleta = ["#ffffff", "#fff4d1", "#d6e6ff", "#ffd6e7"].map((h) => new THREE.Color(h));
      for (let i = 0; i < n; i++) {
        const u = rnd() * 2 - 1;
        const t = rnd() * Math.PI * 2;
        const r = 70 + rnd() * 40;
        const s = Math.sqrt(1 - u * u);
        pos.set([Math.cos(t) * s * r, u * r, Math.sin(t) * s * r], i * 3);
        const k = paleta[Math.floor(rnd() * paleta.length)];
        cor.set([k.r, k.g, k.b], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.BufferAttribute(cor, 3));
      return g;
    });
  }, []);
  const m1 = useRef<THREE.PointsMaterial>(null);
  const m2 = useRef<THREE.PointsMaterial>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (m1.current) m1.current.opacity = 0.75 + Math.sin(t * 0.9) * 0.2;
    if (m2.current) m2.current.opacity = 0.65 + Math.sin(t * 1.7 + 1) * 0.35;
  });
  return (
    <>
      <points geometry={camadas[0]}>
        <pointsMaterial ref={m1} size={0.7} sizeAttenuation vertexColors transparent depthWrite={false} />
      </points>
      <points geometry={camadas[1]}>
        <pointsMaterial ref={m2} size={1.5} sizeAttenuation vertexColors transparent depthWrite={false} />
      </points>
    </>
  );
}

/** Lua: rocha clara com muitas crateras (bordas levantadas, fundo escuro), girando devagar. */
export function Lua() {
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(
    () => geometriaRocha({ semente: 42, detalhe: 3, crateras: 14, rugosidade: 0.03, paleta: ["#cbc7d8", "#d8d5e3", "#e4e1ed", "#f0eef6"], raioCratera: [0.22, 0.5], profundidade: [0.12, 0.22] }),
    [],
  );
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime * 0.05;
    g.position.set(Math.cos(t) * 13, 3 + Math.sin(t * 0.7) * 1.5, Math.sin(t) * 13);
    g.rotation.y += 0.002;
  });
  return (
    <group ref={ref}>
      <mesh geometry={geo} scale={1.3}>
        <meshStandardMaterial vertexColors flatShading roughness={1} />
      </mesh>
    </group>
  );
}

/**
 * Cinturão de asteroides: 3 formas de rocha esculpida (instanciadas = 3 draw calls),
 * tamanhos variados, alguns alongados, tons de cinza e marrom e rotação própria.
 */
export function Asteroides() {
  const formas = useMemo(
    () => [
      geometriaRocha({ semente: 11, detalhe: 2, crateras: 5, rugosidade: 0.22, paleta: ["#837d78", "#958e88", "#a8a098", "#bbb3aa"] }),
      geometriaRocha({ semente: 23, detalhe: 2, crateras: 3, rugosidade: 0.3, paleta: ["#807970", "#938b81", "#a69c90", "#b8ad9f"], raioCratera: [0.35, 0.7] }),
      geometriaRocha({ semente: 37, detalhe: 1, crateras: 2, rugosidade: 0.35, paleta: ["#89837d", "#9c958d", "#afa79d"] }),
    ],
    [],
  );
  useEffect(() => () => formas.forEach((g) => g.dispose()), [formas]);
  const dados = useMemo(() => {
    const rnd = prng(77);
    const tons = ["#ffffff", "#f1e3d0", "#e3cdb2", "#dcdcdc", "#c9b39a"];
    return Array.from({ length: 90 }, (_, i) => {
      const alongado = rnd() < 0.3;
      const s = 0.07 + rnd() ** 2 * 0.36;
      return {
        forma: i % 3,
        a: rnd() * Math.PI * 2,
        r: 15 + rnd() * 4,
        y: (rnd() - 0.5) * 2,
        esc: new THREE.Vector3(s * (alongado ? 1.6 + rnd() * 0.5 : 0.9 + rnd() * 0.2), s * (0.75 + rnd() * 0.25), s * (0.85 + rnd() * 0.2)),
        eixo: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
        giro: (0.15 + rnd() * 0.5) * (rnd() < 0.5 ? -1 : 1),
        fase: rnd() * 6,
        vel: 0.02 + rnd() * 0.03,
        cor: tons[Math.floor(rnd() * tons.length)],
      };
    });
  }, []);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const tmp = useRef({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), cont: [0, 0, 0] });
  useEffect(() => {
    const c = new THREE.Color();
    const cont = [0, 0, 0];
    for (const d of dados) {
      const m = refs.current[d.forma];
      if (m) m.setColorAt(cont[d.forma]++, c.set(d.cor));
    }
    refs.current.forEach((m) => m?.instanceColor && (m.instanceColor.needsUpdate = true));
  }, [dados]);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const { m, q, p, cont } = tmp.current;
    cont[0] = cont[1] = cont[2] = 0;
    for (const d of dados) {
      const im = refs.current[d.forma];
      if (!im) continue;
      const a = d.a + t * d.vel;
      p.set(Math.cos(a) * d.r, d.y + Math.sin(a * 2) * 0.2, Math.sin(a) * d.r);
      q.setFromAxisAngle(d.eixo, d.fase + t * d.giro);
      m.compose(p, q, d.esc);
      im.setMatrixAt(cont[d.forma]++, m);
    }
    refs.current.forEach((im) => im && (im.instanceMatrix.needsUpdate = true));
  });
  const qtd = [0, 1, 2].map((k) => dados.filter((d) => d.forma === k).length);
  return (
    <group rotation={[0.55, 0, 0.2]}>
      {formas.map((g, k) => (
        <instancedMesh key={k} ref={(el) => void (refs.current[k] = el)} args={[g, undefined, qtd[k]]} frustumCulled={false}>
          <meshStandardMaterial vertexColors flatShading roughness={1} />
        </instancedMesh>
      ))}
    </group>
  );
}

/** Corpo do foguete (peças estáticas numa malha só, cor por vértice). */
function geometriaFoguete(cor: string) {
  const v = (pts: [number, number][]) => pts.map(([x, y]) => new THREE.Vector2(x, y));
  const LADOS = 14;
  const corpo = new THREE.LatheGeometry(v([[0, -0.72], [0.3, -0.72], [0.34, -0.5], [0.36, -0.1], [0.35, 0.3], [0.32, 0.6], [0, 0.6]]), LADOS);
  const bico = new THREE.LatheGeometry(v([[0.32, 0.6], [0.3, 0.82], [0.24, 1.02], [0.14, 1.18], [0.05, 1.27], [0, 1.3]]), LADOS);
  const faixa = new THREE.CylinderGeometry(0.368, 0.37, 0.12, LADOS);
  const faixaFina = new THREE.CylinderGeometry(0.356, 0.356, 0.05, LADOS);
  const bocal = new THREE.LatheGeometry(v([[0.13, -0.7], [0.17, -0.8], [0.24, -0.97], [0.21, -0.99], [0.15, -0.84], [0.1, -0.74]]), LADOS);
  const aro = new THREE.TorusGeometry(0.15, 0.035, 6, 16);
  const vidro = new THREE.CircleGeometry(0.125, 16);
  const brilho = new THREE.CircleGeometry(0.04, 8);
  const forma = new THREE.Shape();
  forma.moveTo(0, 0.05);
  forma.lineTo(0.3, -0.22);
  forma.lineTo(0.36, -0.52);
  forma.lineTo(0.24, -0.5);
  forma.lineTo(0, -0.34);
  forma.closePath();
  const aleta = new THREE.ExtrudeGeometry(forma, { depth: 0.05, bevelEnabled: false });
  aleta.translate(0, 0, -0.025);
  const partes: Parte[] = [
    { geo: corpo, pos: [0, 0, 0], cor: "#f7f4ee" },
    { geo: bico, pos: [0, 0, 0], cor },
    { geo: faixa, pos: [0, -0.45, 0], cor },
    { geo: faixaFina, pos: [0, 0.5, 0], cor: "#3d3551" },
    { geo: bocal, pos: [0, 0, 0], cor: "#5d5a6b" },
    { geo: aro, pos: [0, 0.18, 0.345], cor: "#9a97a8" },
    { geo: vidro, pos: [0, 0.18, 0.36], cor: "#6cc4ee" },
    { geo: brilho, pos: [-0.05, 0.23, 0.37], cor: "#ffffff" },
  ];
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2 + Math.PI / 2;
    partes.push({ geo: aleta, pos: [Math.cos(ang) * 0.3, -0.3, -Math.sin(ang) * 0.3], rot: [0, ang, 0], cor });
  }
  const g = fundir(partes);
  [corpo, bico, faixa, faixaFina, bocal, aro, vidro, brilho, aleta].forEach((x) => x.dispose());
  return g;
}

const RASTRO = 12;

/** Foguete orbitando o planeta: aponta para onde vai, gira de leve no próprio eixo, chama em camadas e rastro de fumaça. */
export function Foguete({ raio, vel, fase, inclinacao, cor }: { raio: number; vel: number; fase: number; inclinacao: number; cor: string }) {
  const ref = useRef<THREE.Group>(null);
  const chamas = useRef<(THREE.Mesh | null)[]>([]);
  const fumaca = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => geometriaFoguete(cor), [cor]);
  useEffect(() => () => geo.dispose(), [geo]);
  const tmp = useRef({ dir: new THREE.Vector3(), cima: new THREE.Vector3(0, 1, 0), q: new THREE.Quaternion(), giro: new THREE.Quaternion(), o: new THREE.Object3D() });
  const pos = (t: number, alvo: THREE.Vector3) => alvo.set(Math.cos(t) * raio, Math.sin(t * 0.8) * 1.2, Math.sin(t) * raio);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const tt = tmp.current;
    const tempo = st.clock.elapsedTime;
    const t = tempo * vel + fase;
    pos(t, g.position);
    // direção do movimento no espaço LOCAL do grupo inclinado (lookAt usaria coordenadas do mundo)
    const s = Math.sign(vel) || 1;
    tt.dir.set(-Math.sin(t) * raio * s, 0.96 * Math.cos(t * 0.8) * s, Math.cos(t) * raio * s).normalize();
    tt.q.setFromUnitVectors(tt.cima, tt.dir);
    tt.giro.setFromAxisAngle(tt.cima, tempo * 0.6);
    g.quaternion.copy(tt.q).multiply(tt.giro);
    chamas.current.forEach((m, i) => {
      if (!m) return;
      const k = 1 + Math.sin(tempo * (22 + i * 7) + fase + i) * (0.14 + i * 0.05);
      m.scale.set(1 + (k - 1) * 0.3, k, 1 + (k - 1) * 0.3);
    });
    // rastro: bolinhas de fumaça nos pontos por onde o foguete passou, crescendo e sumindo
    const f = fumaca.current;
    if (f) {
      for (let i = 0; i < RASTRO; i++) {
        const k = (i + ((tempo * 3) % 1)) / RASTRO;
        pos(t - s * (0.035 + k * 0.32), tt.o.position);
        tt.o.position.y += Math.sin(tempo * 2 + i) * 0.04;
        tt.o.scale.setScalar(0.04 + Math.sin(k * Math.PI) * 0.16 * (1 - k * 0.4));
        tt.o.rotation.set(i, tempo * 0.5 + i, 0);
        tt.o.updateMatrix();
        f.setMatrixAt(i, tt.o.matrix);
      }
      f.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group rotation={[inclinacao, 0, 0]}>
      <instancedMesh ref={fumaca} args={[undefined, undefined, RASTRO]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#e9e6f2" flatShading transparent opacity={0.45} depthWrite={false} />
      </instancedMesh>
      <group ref={ref} scale={0.72}>
        <mesh geometry={geo}>
          <meshStandardMaterial vertexColors flatShading roughness={0.55} metalness={0.05} />
        </mesh>
        {/* chama em camadas: externa laranja, média amarela, núcleo branco (aditivas), e um brilho */}
        {[
          { r: 0.2, h: 0.95, c: "#ff7a3d", o: 0.75 },
          { r: 0.14, h: 0.68, c: "#ffc23d", o: 0.85 },
          { r: 0.08, h: 0.42, c: "#fff6d0", o: 1 },
        ].map((ch, i) => (
          <mesh key={i} ref={(el) => void (chamas.current[i] = el)} position={[0, -0.98, 0]}>
            <coneGeometry args={[ch.r, ch.h, 10, 1, true]} />
            <meshBasicMaterial color={ch.c} transparent opacity={ch.o} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <mesh position={[0, -1.02, 0]}>
          <sphereGeometry args={[0.32, 12, 8]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Satélite: corpo dourado com frisos, painéis solares em grade, antena parabólica e luz piscando. */
export function Satelite() {
  const ref = useRef<THREE.Group>(null);
  const luz = useRef<THREE.MeshBasicMaterial>(null);
  const geo = useMemo(() => {
    const caixa = new THREE.BoxGeometry(1, 1, 1);
    const haste = new THREE.CylinderGeometry(0.03, 0.03, 1, 6);
    const prato = new THREE.LatheGeometry(
      [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.28, 0].map((r, i) => new THREE.Vector2(r, i < 6 ? r * r * 1.4 : i === 6 ? 0.13 : 0.04)),
      14,
    );
    const ponta = new THREE.SphereGeometry(0.05, 8, 6);
    const partes: Parte[] = [
      { geo: caixa, pos: [0, 0, 0], esc: [0.6, 0.6, 0.8], cor: "#f2c14e" },
      { geo: caixa, pos: [0, 0, 0.36], esc: [0.63, 0.63, 0.05], cor: "#c9962e" },
      { geo: caixa, pos: [0, 0, -0.36], esc: [0.63, 0.63, 0.05], cor: "#c9962e" },
      { geo: caixa, pos: [0, 0, 0], esc: [0.63, 0.06, 0.82], cor: "#d9a83a" },
      { geo: prato, pos: [0, 0.32, 0.1], rot: [0.35, 0, 0], cor: "#f4f2f8" },
      { geo: haste, pos: [0, 0.48, 0.16], rot: [0.35, 0, 0], esc: [1, 0.3, 1], cor: "#9a97a8" },
      { geo: ponta, pos: [0, 0.62, 0.21], cor: "#9a97a8" },
      { geo: haste, pos: [0.18, 0.55, -0.25], rot: [-0.3, 0, 0.2], esc: [0.6, 0.6, 0.6], cor: "#9a97a8" },
    ];
    for (const l of [-1, 1]) {
      partes.push({ geo: haste, pos: [l * 0.42, 0, 0], rot: [0, 0, Math.PI / 2], esc: [1, 0.25, 1], cor: "#9a97a8" });
      partes.push({ geo: caixa, pos: [l * 1.2, 0, 0], esc: [1.4, 0.03, 0.66], cor: "#25306b" });
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 2; j++)
          partes.push({ geo: caixa, pos: [l * (0.68 + i * 0.345), 0.018, -0.16 + j * 0.32], esc: [0.31, 0.02, 0.28], cor: (i + j) % 2 ? "#3d5bd6" : "#4a6ae6" });
    }
    const g = fundir(partes);
    [caixa, haste, prato, ponta].forEach((x) => x.dispose());
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime * 0.12 + 2;
    g.position.set(Math.cos(t) * 8.6, 4 + Math.sin(t) * 2, Math.sin(t) * 8.6);
    g.rotation.y += 0.006;
    g.rotation.z = 0.4;
    if (luz.current) luz.current.opacity = Math.sin(st.clock.elapsedTime * 3) > 0.6 ? 1 : 0.15;
  });
  return (
    <group ref={ref} scale={0.55}>
      <mesh geometry={geo}>
        <meshStandardMaterial vertexColors flatShading metalness={0.3} roughness={0.45} />
      </mesh>
      <mesh position={[0.18, 0.84, -0.33]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshBasicMaterial ref={luz} color="#ff5a5a" transparent />
      </mesh>
    </group>
  );
}

const POEIRA = 14;

/** Cometa passando de vez em quando: núcleo de gelo esculpido, coma brilhante e cauda em camadas com poeira. */
export function Cometa() {
  const ref = useRef<THREE.Group>(null);
  const poeira = useRef<THREE.InstancedMesh>(null);
  const nucleo = useMemo(() => geometriaRocha({ semente: 5, detalhe: 1, crateras: 2, rugosidade: 0.3, paleta: ["#aebfd6", "#c7d6ea", "#dfe9f5"] }), []);
  useEffect(() => () => nucleo.dispose(), [nucleo]);
  // trajeto: de (-30, 14) a (30, 8); a cauda aponta para trás
  const ang = Math.atan2(-6, 60);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const tempo = st.clock.elapsedTime;
    const ciclo = (tempo % 18) / 18;
    g.visible = ciclo < 0.35;
    if (!g.visible) return;
    const t = ciclo / 0.35;
    g.position.set(-30 + t * 60, 14 - t * 6, -25);
    g.children[0].rotation.set(tempo * 0.7, tempo * 0.4, 0);
    const p = poeira.current;
    if (p) {
      for (let i = 0; i < POEIRA; i++) {
        const k = ((i / POEIRA + tempo * 0.35) % 1);
        tmp.position.set(-0.4 - k * 3.6, Math.sin(i * 2.3) * 0.35 * k, Math.cos(i * 1.7) * 0.35 * k);
        tmp.scale.setScalar(0.06 * (1 - k) + 0.01);
        tmp.updateMatrix();
        p.setMatrixAt(i, tmp.matrix);
      }
      p.instanceMatrix.needsUpdate = true;
    }
  });
  const aditivo = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false } as const;
  return (
    <group ref={ref} rotation={[0, 0, ang]}>
      <mesh geometry={nucleo} scale={0.32}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} emissive="#9fc7ff" emissiveIntensity={0.25} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.6, 14, 10]} />
        <meshBasicMaterial color="#bfe3ff" opacity={0.3} {...aditivo} />
      </mesh>
      {/* cauda: cones abertos, a base larga no núcleo e a ponta para trás (-x) */}
      {[
        { r: 0.55, h: 4.6, c: "#7fb8ff", o: 0.22 },
        { r: 0.36, h: 3.4, c: "#bfe0ff", o: 0.32 },
        { r: 0.18, h: 2.3, c: "#ffffff", o: 0.5 },
      ].map((c, i) => (
        <mesh key={i} position={[-c.h / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[c.r, c.h, 14, 1, true]} />
          <meshBasicMaterial color={c.c} opacity={c.o} side={THREE.DoubleSide} {...aditivo} />
        </mesh>
      ))}
      <instancedMesh ref={poeira} args={[undefined, undefined, POEIRA]} frustumCulled={false}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#e6f2ff" opacity={0.8} {...aditivo} />
      </instancedMesh>
    </group>
  );
}

/**
 * Criaturas do mar nadando pelos oceanos do globo (baleias e golfinhos).
 * Cada uma segue um caminho em alto-mar e acompanha a curva do planeta.
 */
const ROTAS_MAR: { lon: number; lat0: number; lat1: number; tipo: "baleia" | "golfinho"; vel: number }[] = [
  { lon: -30, lat0: -45, lat1: 30, tipo: "baleia", vel: 0.05 },
  { lon: -150, lat0: -40, lat1: 35, tipo: "baleia", vel: 0.04 },
  { lon: 75, lat0: -40, lat1: -5, tipo: "golfinho", vel: 0.08 },
  { lon: -10, lat0: -40, lat1: -10, tipo: "golfinho", vel: 0.09 },
  { lon: 165, lat0: -40, lat1: 20, tipo: "golfinho", vel: 0.07 },
];

export function CriaturasDoMar({ raio }: { raio: number }) {
  return (
    <>
      {ROTAS_MAR.map((r, i) => (
        <CriaturaGlobo key={i} {...r} raio={raio} fase={i * 1.3} />
      ))}
    </>
  );
}

function CriaturaGlobo({ lon, lat0, lat1, tipo, vel, raio, fase }: (typeof ROTAS_MAR)[number] & { raio: number; fase: number }) {
  const ref = useRef<THREE.Group>(null);
  const corpo = useRef<THREE.Group>(null);
  const p = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Vector3(), []);
  const ponto = (lat: number, lo: number, r: number, alvo: THREE.Vector3) => {
    const phi = ((lo + 180) * Math.PI) / 180;
    const th = ((90 - lat) * Math.PI) / 180;
    return alvo.set(-r * Math.cos(phi) * Math.sin(th), r * Math.cos(th), r * Math.sin(phi) * Math.sin(th));
  };
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = (Math.sin(st.clock.elapsedTime * vel + fase) + 1) / 2;
    const lat = lat0 + (lat1 - lat0) * t;
    const lo = lon + Math.sin(st.clock.elapsedTime * vel * 2 + fase) * 6;
    ponto(lat, lo, raio * 1.005, p);
    ponto(lat + (Math.cos(st.clock.elapsedTime * vel + fase) >= 0 ? 0.6 : -0.6), lo, raio * 1.005, q);
    g.position.copy(p);
    g.up.copy(p).normalize();
    g.lookAt(q);
    // golfinho pula; baleia sobe e desce de leve
    if (corpo.current) {
      const pulo = tipo === "golfinho" ? Math.max(0, Math.sin(st.clock.elapsedTime * 2.2 + fase)) * 0.22 : Math.sin(st.clock.elapsedTime + fase) * 0.03;
      corpo.current.position.y = pulo;
    }
  });
  const cor = tipo === "baleia" ? "#4f73a6" : "#7f9fc2";
  const s = tipo === "baleia" ? 0.32 : 0.18;
  return (
    <group ref={ref}>
      <group ref={corpo} scale={s}>
        <mesh scale={[0.55, 0.35, 1.3]}>
          <icosahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial color={cor} flatShading />
        </mesh>
        <mesh position={[0, 0, -1]} rotation={[Math.PI / 2, 0, 0]} scale={[1.2, 0.3, 0.5]}>
          <coneGeometry args={[0.4, 0.7, 3]} />
          <meshStandardMaterial color={cor} flatShading />
        </mesh>
        {tipo === "golfinho" && (
          <mesh position={[0, 0.3, 0]} rotation={[-0.4, 0, 0]}>
            <coneGeometry args={[0.12, 0.4, 4]} />
            <meshStandardMaterial color={cor} flatShading />
          </mesh>
        )}
      </group>
    </group>
  );
}
