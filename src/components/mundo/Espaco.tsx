"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { prng } from "./ilha";

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

/** Lua com crateras, orbitando devagar. */
export function Lua() {
  const ref = useRef<THREE.Group>(null);
  const crateras = useMemo(() => {
    const rnd = prng(42);
    return Array.from({ length: 9 }, () => {
      const u = rnd() * 2 - 1;
      const t = rnd() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      return { p: new THREE.Vector3(Math.cos(t) * s, u, Math.sin(t) * s), r: 0.12 + rnd() * 0.2 };
    });
  }, []);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime * 0.05;
    g.position.set(Math.cos(t) * 13, 3 + Math.sin(t * 0.7) * 1.5, Math.sin(t) * 13);
    g.rotation.y += 0.002;
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[1.3, 32, 24]} />
        <meshStandardMaterial color="#d9d6e3" roughness={1} />
      </mesh>
      {crateras.map((c, i) => (
        <mesh key={i} position={c.p.clone().multiplyScalar(1.27)} scale={[c.r, c.r, c.r * 0.35]} onUpdate={(m) => m.lookAt(0, 0, 0)}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#b9b5c8" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Cinturão de asteroides girando em volta do planeta (instanciado). */
export function Asteroides() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dados = useMemo(() => {
    const rnd = prng(77);
    return Array.from({ length: 90 }, () => ({
      a: rnd() * Math.PI * 2,
      r: 15 + rnd() * 4,
      y: (rnd() - 0.5) * 2,
      s: 0.06 + rnd() ** 2 * 0.32,
      giro: new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3),
      vel: 0.02 + rnd() * 0.03,
    }));
  }, []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((st) => {
    const m = ref.current;
    if (!m) return;
    const t = st.clock.elapsedTime;
    dados.forEach((d, i) => {
      const a = d.a + t * d.vel;
      tmp.position.set(Math.cos(a) * d.r, d.y + Math.sin(a * 2) * 0.2, Math.sin(a) * d.r);
      tmp.rotation.set(d.giro.x + t * 0.3, d.giro.y + t * 0.2, d.giro.z);
      tmp.scale.setScalar(d.s);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group rotation={[0.55, 0, 0.2]}>
      <instancedMesh ref={ref} args={[undefined, undefined, dados.length]}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#9b8f86" roughness={1} />
      </instancedMesh>
    </group>
  );
}

/** Foguete orbitando o planeta, com chama piscando. */
export function Foguete({ raio, vel, fase, inclinacao, cor }: { raio: number; vel: number; fase: number; inclinacao: number; cor: string }) {
  const ref = useRef<THREE.Group>(null);
  const chama = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime * vel + fase;
    g.position.set(Math.cos(t) * raio, Math.sin(t * 0.8) * 1.2, Math.sin(t) * raio);
    // aponta para a direção do movimento
    g.lookAt(Math.cos(t + 0.05) * raio, Math.sin((t + 0.05) * 0.8) * 1.2, Math.sin(t + 0.05) * raio);
    g.rotateX(Math.PI / 2);
    if (chama.current) chama.current.scale.y = 0.8 + Math.sin(st.clock.elapsedTime * 25 + fase) * 0.25;
  });
  return (
    <group rotation={[inclinacao, 0, 0]}>
      <group ref={ref} scale={0.55}>
        <mesh>
          <cylinderGeometry args={[0.32, 0.36, 1.4, 20]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.98, 0]}>
          <coneGeometry args={[0.32, 0.6, 20]} />
          <meshStandardMaterial color={cor} />
        </mesh>
        <mesh position={[0, 0.25, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.06, 16]} />
          <meshStandardMaterial color="#6cc4ee" emissive="#3aa6dd" emissiveIntensity={0.4} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos((i * Math.PI * 2) / 3) * 0.38, -0.6, Math.sin((i * Math.PI * 2) / 3) * 0.38]} rotation={[0, -(i * Math.PI * 2) / 3, 0]}>
            <boxGeometry args={[0.32, 0.45, 0.05]} />
            <meshStandardMaterial color={cor} />
          </mesh>
        ))}
        <mesh ref={chama} position={[0, -1.0, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.22, 0.8, 16]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, -0.9, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.12, 0.45, 12]} />
          <meshBasicMaterial color="#fff4b0" />
        </mesh>
      </group>
    </group>
  );
}

/** Satélite com painéis solares girando em órbita. */
export function Satelite() {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime * 0.12 + 2;
    g.position.set(Math.cos(t) * 8.6, 4 + Math.sin(t) * 2, Math.sin(t) * 8.6);
    g.rotation.y += 0.01;
    g.rotation.z = 0.4;
  });
  return (
    <group ref={ref} scale={0.5}>
      <mesh>
        <boxGeometry args={[0.6, 0.6, 0.8]} />
        <meshStandardMaterial color="#f2c14e" metalness={0.4} roughness={0.4} />
      </mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} position={[l * 1.05, 0, 0]}>
          <boxGeometry args={[1.3, 0.04, 0.6]} />
          <meshStandardMaterial color="#3d5bd6" metalness={0.3} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.25, 0.25, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/** Cometa passando de vez em quando, com cauda brilhante. */
export function Cometa() {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const ciclo = (st.clock.elapsedTime % 18) / 18;
    g.visible = ciclo < 0.35;
    const t = ciclo / 0.35;
    g.position.set(-30 + t * 60, 14 - t * 6, -25);
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.35, 16, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-1.6, 0.18, 0]} rotation={[0, 0, Math.PI / 2 + 0.11]}>
        <coneGeometry args={[0.3, 3.2, 16, 1, true]} />
        <meshBasicMaterial color="#cfe3ff" transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
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
