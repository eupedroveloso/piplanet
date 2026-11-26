"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useIlha } from "./contexto";
import { fundir, type Parte } from "./fundir";
import { geometriaEspuma, prng } from "./ilha";

/**
 * VIDA DO MUNDO: tudo que se mexe sozinho.
 * Oceano com ondas, lagos, moinho, fumaça, pássaros, borboletas, ovelhas, coelhos, pinguins,
 * girafas, peixes e golfinhos pulando, barquinhos, farol, boias, rochas e o balão da Juju.
 * Movimentos lentos e previsíveis (nada brusco).
 */

// ── Construções animadas ────────────────────────────────────────────────────

export function Moinho({ p }: { p: [number, number, number] }) {
  const pas = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (pas.current) pas.current.rotation.z += dt * 1.1;
  });
  return (
    <group position={p}>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.36, 1.6, 8]} />
        <meshStandardMaterial color="#f5efe3" flatShading />
      </mesh>
      <mesh position={[0, 1.78, 0]} castShadow>
        <coneGeometry args={[0.3, 0.4, 8]} />
        <meshStandardMaterial color="#f25f5c" flatShading />
      </mesh>
      <mesh position={[0, 0.25, 0.33]}>
        <boxGeometry args={[0.2, 0.36, 0.04]} />
        <meshStandardMaterial color="#8a5a3b" />
      </mesh>
      <group ref={pas} position={[0, 1.45, 0.3]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.12, 1.5, 0.03]} />
            <meshStandardMaterial color={i % 2 ? "#fff3e0" : "#f2c14e"} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshStandardMaterial color="#8a5a3b" />
        </mesh>
      </group>
    </group>
  );
}

export function Fumaca({ p }: { p: [number, number, number] }) {
  const grupo = useRef<THREE.Group>(null);
  useFrame((st) => {
    grupo.current?.children.forEach((m, i) => {
      const t = (st.clock.elapsedTime * 0.35 + i / 4) % 1;
      m.position.set(Math.sin(t * 4 + i) * 0.08, t * 1.3, 0);
      m.scale.setScalar(0.12 + t * 0.28);
      ((m as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.75 * (1 - t);
    });
  });
  return (
    <group ref={grupo} position={p}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#ffffff" transparent flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ── Céu ─────────────────────────────────────────────────────────────────────

export function Passaros() {
  const aves = useMemo(() => {
    const rnd = prng(77);
    return Array.from({ length: 14 }, () => {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * 8;
      return {
        c: new THREE.Vector3(Math.cos(a) * d, 6 + rnd() * 3, Math.sin(a) * d),
        r: 4 + rnd() * 6,
        v: (0.15 + rnd() * 0.2) * (rnd() > 0.5 ? 1 : -1),
        f: rnd() * Math.PI * 2,
        cor: rnd() > 0.5 ? "#3d3551" : "#5b2a9c",
      };
    });
  }, []);
  // Asas instanciadas (2 por ave, 1 draw call): um "esqueleto" fora da cena calcula as matrizes
  const ref = useRef<THREE.InstancedMesh>(null);
  const esqueleto = useMemo(() => {
    const corpo = new THREE.Object3D();
    const asaA = new THREE.Object3D();
    const asaB = new THREE.Object3D();
    asaA.position.z = 0.12;
    asaB.position.z = -0.12;
    corpo.add(asaA, asaB);
    return { corpo, asaA, asaB };
  }, []);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    aves.forEach((a, i) => {
      m.setColorAt(i * 2, c.set(a.cor));
      m.setColorAt(i * 2 + 1, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [aves]);
  useFrame((st) => {
    const m = ref.current;
    if (!m) return;
    const t = st.clock.elapsedTime;
    const { corpo, asaA, asaB } = esqueleto;
    aves.forEach((a, i) => {
      const ang = t * a.v + a.f;
      corpo.position.set(a.c.x + Math.cos(ang) * a.r, a.c.y + Math.sin(t * 0.7 + a.f) * 0.4, a.c.z + Math.sin(ang) * a.r);
      corpo.rotation.y = -ang + (a.v > 0 ? 0 : Math.PI);
      const bate = Math.sin(t * 9 + a.f) * 0.6;
      asaA.rotation.x = bate;
      asaB.rotation.x = -bate;
      corpo.updateMatrixWorld(true);
      m.setMatrixAt(i * 2, asaA.matrixWorld);
      m.setMatrixAt(i * 2 + 1, asaB.matrixWorld);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, aves.length * 2]} frustumCulled={false}>
      <boxGeometry args={[0.07, 0.015, 0.26]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}

// ── Bichos ──────────────────────────────────────────────────────────────────

/** Faz um bicho passear em volta de um ponto, devagar, olhando para onde vai. */
function usePasseio(base: THREE.Vector3, raio: number, vel: number, fase: number, pulo = 0, yFixo?: number) {
  const ref = useRef<THREE.Group>(null);
  const { altura } = useIlha();
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime * vel + fase;
    const x = base.x + Math.cos(t) * raio;
    const z = base.z + Math.sin(t * 0.8) * raio * 0.7;
    const dx = -Math.sin(t) * raio;
    const dz = Math.cos(t * 0.8) * raio * 0.7 * 0.8;
    g.position.set(x, (yFixo ?? altura(x, z)) + (pulo ? Math.abs(Math.sin(st.clock.elapsedTime * 6 + fase)) * pulo : 0), z);
    g.rotation.y = Math.atan2(dx, dz);
  });
  return ref;
}

export function Ovelha({ base, fase }: { base: THREE.Vector3; fase: number }) {
  const ref = usePasseio(base, 0.5, 0.15, fase);
  return (
    <group ref={ref}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <icosahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color="#ffffff" flatShading />
      </mesh>
      <mesh position={[0, 0.32, 0.24]} castShadow>
        <boxGeometry args={[0.13, 0.14, 0.16]} />
        <meshStandardMaterial color="#3d3551" />
      </mesh>
      {[
        [-0.1, 0.1],
        [0.1, 0.1],
        [-0.1, -0.1],
        [0.1, -0.1],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]}>
          <boxGeometry args={[0.05, 0.16, 0.05]} />
          <meshStandardMaterial color="#3d3551" />
        </mesh>
      ))}
    </group>
  );
}

export function Coelho({ base, fase }: { base: THREE.Vector3; fase: number }) {
  const ref = usePasseio(base, 0.6, 0.3, fase, 0.12);
  return (
    <group ref={ref}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <icosahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color="#c9a27c" flatShading />
      </mesh>
      <mesh position={[0, 0.22, 0.1]} castShadow>
        <icosahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color="#c9a27c" flatShading />
      </mesh>
      {[-0.03, 0.03].map((x, i) => (
        <mesh key={i} position={[x, 0.33, 0.09]}>
          <boxGeometry args={[0.025, 0.12, 0.02]} />
          <meshStandardMaterial color="#e8c9a8" />
        </mesh>
      ))}
      <mesh position={[0, 0.14, -0.12]}>
        <sphereGeometry args={[0.04, 6, 5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export function Pinguim({ base, fase, raio = 0.45, y }: { base: THREE.Vector3; fase: number; raio?: number; y?: number }) {
  const ref = usePasseio(base, raio, 0.18, fase, 0, y);
  const corpo = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (corpo.current) corpo.current.rotation.z = Math.sin(st.clock.elapsedTime * 5 + fase) * 0.12;
  });
  return (
    <group ref={ref}>
      <group ref={corpo}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.18, 4, 8]} />
          <meshStandardMaterial color="#2b2f3a" />
        </mesh>
        <mesh position={[0, 0.19, 0.06]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.33, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.03, 0.07, 5]} />
          <meshStandardMaterial color="#f29a2e" />
        </mesh>
      </group>
    </group>
  );
}

export function Girafa({ base, fase }: { base: THREE.Vector3; fase: number }) {
  const ref = usePasseio(base, 0.6, 0.08, fase);
  const cor = "#f2b544";
  return (
    <group ref={ref} scale={1.1}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.26, 0.24, 0.46]} />
        <meshStandardMaterial color={cor} flatShading />
      </mesh>
      <mesh position={[0, 0.92, 0.2]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.62, 0.1]} />
        <meshStandardMaterial color={cor} flatShading />
      </mesh>
      <mesh position={[0, 1.22, 0.34]} castShadow>
        <boxGeometry args={[0.13, 0.12, 0.22]} />
        <meshStandardMaterial color={cor} flatShading />
      </mesh>
      {[
        [-0.09, 0.16],
        [0.09, 0.16],
        [-0.09, -0.16],
        [0.09, -0.16],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]} castShadow>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color={cor} />
        </mesh>
      ))}
      {[
        [0.13, 0.6, 0.05],
        [-0.13, 0.52, -0.1],
        [0.13, 0.5, -0.15],
        [-0.13, 0.62, 0.12],
      ].map(([x, y, z], i) => (
        <mesh key={`m${i}`} position={[x, y, z]}>
          <boxGeometry args={[0.01, 0.08, 0.08]} />
          <meshStandardMaterial color="#a8682a" />
        </mesh>
      ))}
    </group>
  );
}

export function Borboleta({ base, fase }: { base: THREE.Vector3; fase: number }) {
  const ref = useRef<THREE.Group>(null);
  const { altura } = useIlha();
  const cor = ["#ff8fb1", "#ffc935", "#b48cff", "#4fb0e3"][Math.floor(fase) % 4];
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime;
    const bx = base.x + Math.sin(t * 0.5 + fase) * 1.2;
    const bz = base.z + Math.cos(t * 0.4 + fase) * 1.2;
    g.position.set(bx, altura(bx, bz) + 0.6 + Math.sin(t * 1.3 + fase) * 0.25, bz);
    g.rotation.y = t * 0.5 + fase;
    const bate = Math.sin(t * 14 + fase) * 0.9;
    g.children[0].rotation.z = bate;
    g.children[1].rotation.z = -bate;
  });
  return (
    <group ref={ref}>
      <mesh position={[0.05, 0, 0]}>
        <planeGeometry args={[0.1, 0.08]} />
        <meshStandardMaterial color={cor} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.05, 0, 0]}>
        <planeGeometry args={[0.1, 0.08]} />
        <meshStandardMaterial color={cor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Peixe({ base, fase }: { base: THREE.Vector3; fase: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = (st.clock.elapsedTime * 0.5 + fase) % 3; // pula 1 vez a cada 3 s
    const s = Math.min(1, t);
    g.visible = t < 1;
    g.position.set(base.x + (s - 0.5) * 0.7, base.y + Math.sin(s * Math.PI) * 0.55, base.z);
    g.rotation.z = (0.5 - s) * 2.2;
  });
  return (
    <group ref={ref}>
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.06, 0.2, 5]} />
        <meshStandardMaterial color="#f28c38" />
      </mesh>
    </group>
  );
}

// ── Balão da Juju ───────────────────────────────────────────────────────────

export function Balao({ alvo, objRef }: { alvo: THREE.Vector3; objRef: RefObject<THREE.Group | null> }) {
  const ref = objRef;
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.9, 12, 10);
    const cores: number[] = [];
    const a = new THREE.Color("#f25f5c");
    const b = new THREE.Color("#ffc935");
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const ang = Math.atan2(pos.getZ(i), pos.getX(i));
      const c = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 12) % 2 ? a : b;
      cores.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
    return g;
  }, []);
  useFrame((st, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.lerp(alvo, Math.min(1, dt * 0.8));
    g.position.y = g.position.y + Math.sin(st.clock.elapsedTime * 1.2) * 0.004;
    g.rotation.y += dt * 0.15;
  });
  return (
    <group ref={ref} position={alvo}>
      <mesh geometry={geo} scale={[1, 1.15, 1]} castShadow>
        <meshStandardMaterial vertexColors flatShading />
      </mesh>
      <mesh position={[0, -1.05, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.12, 0.25, 8]} />
        <meshStandardMaterial color="#f25f5c" flatShading />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.24, -1.4, Math.sin(a) * 0.24]}>
            <cylinderGeometry args={[0.012, 0.012, 0.55, 4]} />
            <meshStandardMaterial color="#8a5a3b" />
          </mesh>
        );
      })}
      <mesh position={[0, -1.78, 0]} castShadow>
        <boxGeometry args={[0.46, 0.3, 0.46]} />
        <meshStandardMaterial color="#b07a4a" flatShading />
      </mesh>
    </group>
  );
}


// ── Oceano ──────────────────────────────────────────────────────────────────

/** Mar com ondas suaves (vértices animados) e cor mais clara no raso. */
export function Mar() {
  // Ondas no vertex shader (a GPU anima; nada de recalcular normais na CPU a cada quadro).
  // Com flatShading, a normal de cada face sai das derivadas no fragment shader.
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(160, 160, 96, 96);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const tempo = useRef({ value: 0 });
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: "#26c2bd", transparent: true, opacity: 0.8, roughness: 0.3, metalness: 0.05, flatShading: true });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTempo = tempo.current;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTempo;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          transformed.y += sin(position.x * 0.32 + uTempo * 0.9) * 0.07 + cos(position.z * 0.27 + uTempo * 0.7) * 0.07 + sin((position.x + position.z) * 0.6 + uTempo * 1.6) * 0.025;`,
        );
    };
    return m;
  }, []);
  useEffect(() => () => { geo.dispose(); material.dispose(); }, [geo, material]);
  useFrame((st) => {
    tempo.current.value = st.clock.elapsedTime;
  });
  return <mesh geometry={geo} material={material} receiveShadow />;
}

/** Espuma batendo na praia em volta da ilha toda: dois anéis que pulsam. */
export function Espuma() {
  const ilha = useIlha();
  const g1 = useMemo(() => geometriaEspuma(ilha, -0.25, 0.42), [ilha]);
  const g2 = useMemo(() => geometriaEspuma(ilha, -1.0, 0.22), [ilha]);
  const m1 = useRef<THREE.MeshBasicMaterial>(null);
  const m2 = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (m1.current) m1.current.opacity = 0.55 + Math.sin(t * 1.4) * 0.2;
    if (m2.current) m2.current.opacity = 0.25 + Math.sin(t * 1.4 + 1.5) * 0.15;
  });
  return (
    <>
      <mesh geometry={g1} position={[0, 0.11, 0]}>
        <meshBasicMaterial ref={m1} color="#ffffff" transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh geometry={g2} position={[0, 0.1, 0]}>
        <meshBasicMaterial ref={m2} color="#ffffff" transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  );
}

/** Barquinho à vela dando a volta no arquipélago, balançando nas ondas. */
export function Barco({ raio, vel, fase, cor }: { raio: number; vel: number; fase: number; cor: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime * vel + fase;
    g.position.set(Math.cos(t) * raio, 0.08 + Math.sin(st.clock.elapsedTime * 1.5 + fase) * 0.05, Math.sin(t) * raio * 0.85);
    g.rotation.y = -t + (vel > 0 ? Math.PI : 0);
    g.rotation.z = Math.sin(st.clock.elapsedTime * 1.2 + fase) * 0.08;
  });
  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[0.35, 0.18, 0.9]} />
        <meshStandardMaterial color="#8a5a3b" flatShading />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.37, 0.04, 0.92]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.9, 5]} />
        <meshStandardMaterial color="#5f4630" />
      </mesh>
      <mesh position={[0, 0.6, 0.12]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <coneGeometry args={[0.3, 0.75, 3]} />
        <meshStandardMaterial color={cor} flatShading side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Golfinho que pula de vez em quando num ponto do mar. */
export function Golfinho({ x, z, fase, giro }: { x: number; z: number; fase: number; giro: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = (st.clock.elapsedTime * 0.45 + fase) % 4; // um pulo a cada ~9 s
    const s = Math.min(1, t);
    g.visible = t < 1;
    const dx = (s - 0.5) * 1.6;
    g.position.set(x + Math.cos(giro) * dx, Math.sin(s * Math.PI) * 0.9 - 0.15, z + Math.sin(giro) * dx);
    g.rotation.set(0, -giro, (0.5 - s) * 2.4);
  });
  return (
    <group ref={ref}>
      <mesh scale={[0.55, 0.18, 0.2]} castShadow>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#7f9fc2" flatShading />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.05, 0.14, 4]} />
        <meshStandardMaterial color="#6f8fb2" />
      </mesh>
      <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.07, 0.12, 4]} />
        <meshStandardMaterial color="#6f8fb2" />
      </mesh>
    </group>
  );
}

/** Farol numa ilhota, com a luz pulsando. */
export function Farol({ x, z }: { x: number; z: number }) {
  const luz = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((st) => {
    if (luz.current) luz.current.emissiveIntensity = 0.6 + Math.sin(st.clock.elapsedTime * 2) * 0.5;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[0.9, 1.2, 0.9, 9]} />
        <meshStandardMaterial color="#9b958c" flatShading />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.35 + i * 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.24 - i * 0.025, 0.27 - i * 0.025, 0.32, 10]} />
          <meshStandardMaterial color={i % 2 ? "#ffffff" : "#f25f5c"} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.22, 8]} />
        <meshStandardMaterial ref={luz} color="#fff3b0" emissive="#ffd34d" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0, 1.92, 0]} castShadow>
        <coneGeometry args={[0.22, 0.25, 8]} />
        <meshStandardMaterial color="#5b2a9c" flatShading />
      </mesh>
    </group>
  );
}

/** Rochas aparecendo na água, ilhotas com palmeira e boias balançando. */
export function MiudezasDoMar() {
  const ilha = useIlha();
  const frio = ilha.pais === "russia";
  const itens = useMemo(() => {
    const rnd = prng(303);
    const longeDasIlhas = (x: number, z: number, folga: number) => ilha.dist(x, z) < -1.2 - folga;
    const sorteia = (folga: number) => {
      for (let t = 0; t < 60; t++) {
        const a = rnd() * Math.PI * 2;
        const d = 8 + rnd() * 14;
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d;
        if (longeDasIlhas(x, z, folga) && !ilha.marEm(x, z) && ilha.dist(x, z) > -9) return [x, z] as const;
      }
      return [20, 20] as const;
    };
    return {
      rochas: Array.from({ length: 14 }, () => ({ p: sorteia(0.5), s: 0.25 + rnd() * 0.5, r: rnd() * 3 })),
      ilhotas: Array.from({ length: 3 }, () => ({ p: sorteia(1.5), r: rnd() * 3 })),
      boias: Array.from({ length: 5 }, () => ({ p: sorteia(0.8), f: rnd() * 6 })),
    };
  }, [ilha]);
  // Rochas e ilhotas são estáticas: uma malha só (com sombra)
  const estatico = useMemo(() => {
    const dodeca = new THREE.DodecahedronGeometry(0.6, 0);
    const gelo = new THREE.DodecahedronGeometry(0.9, 0);
    const base = new THREE.CylinderGeometry(0.9, 1.2, 0.5, 9);
    const caule = new THREE.CylinderGeometry(0.06, 0.09, 1.1, 6);
    const folha = new THREE.BoxGeometry(0.65, 0.04, 0.18);
    const partes: Parte[] = itens.rochas.map((r) => ({ geo: dodeca, pos: [r.p[0], 0, r.p[1]], rot: [0, r.r, 0], esc: [r.s, r.s * 0.8, r.s], cor: "#9b958c" }));
    for (const il of itens.ilhotas) {
      const [x, z] = il.p;
      if (frio) {
        partes.push({ geo: gelo, pos: [x, -0.1, z], esc: [1, 0.6, 1], cor: "#e8f1fa" });
        continue;
      }
      // ilhota de areia com coqueiro (girada por il.r)
      const g = (lx: number, lz: number): [number, number] => [x + Math.cos(il.r) * lx + Math.sin(il.r) * lz, z - Math.sin(il.r) * lx + Math.cos(il.r) * lz];
      partes.push({ geo: base, pos: [x, -0.15, z], rot: [0, il.r, 0], cor: "#fbe2ad" });
      const [cx, cz] = g(0.15, 0);
      partes.push({ geo: caule, pos: [cx, 0.55, cz], rot: [0, il.r, -0.25], cor: "#8a5d33" });
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        const [fx, fz] = g(0.3 + Math.cos(a) * 0.3, Math.sin(a) * 0.3);
        partes.push({ geo: folha, pos: [fx, 1.08, fz], rot: [0, il.r - a, -0.45], cor: "#4fae5c" });
      }
    }
    return fundir(partes);
  }, [itens, frio]);
  // Boias balançando: uma geometria (bola vermelha + faixa branca), instanciada
  const boiaGeo = useMemo(
    () =>
      fundir([
        { geo: new THREE.SphereGeometry(0.16, 8, 6), pos: [0, 0, 0], cor: "#f25f5c" },
        { geo: new THREE.CylinderGeometry(0.165, 0.165, 0.06, 8), pos: [0, 0.06, 0], cor: "#ffffff" },
      ]),
    [],
  );
  useEffect(() => () => { estatico.dispose(); boiaGeo.dispose(); }, [estatico, boiaGeo]);
  const boias = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((st) => {
    const m = boias.current;
    if (!m) return;
    itens.boias.forEach((b, i) => {
      tmp.position.set(b.p[0], 0.05 + Math.sin(st.clock.elapsedTime * 1.6 + b.f) * 0.06, b.p[1]);
      tmp.rotation.set(0, 0, Math.sin(st.clock.elapsedTime * 1.2 + b.f) * 0.15);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <mesh geometry={estatico} castShadow receiveShadow>
        <meshStandardMaterial vertexColors flatShading />
      </mesh>
      <instancedMesh ref={boias} args={[boiaGeo, undefined, itens.boias.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading />
      </instancedMesh>
    </>
  );
}

/** Placa de gelo flutuando na baía (balança devagar), com pinguins em cima. */
export function PlacaDeGelo({ x, z, raio, fase, vazia = false }: { x: number; z: number; raio: number; fase: number; vazia?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    g.position.y = 0.06 + Math.sin(st.clock.elapsedTime * 1.1 + fase) * 0.04;
    g.rotation.z = Math.sin(st.clock.elapsedTime * 0.9 + fase) * 0.03;
  });
  const centro = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  return (
    <group ref={ref} position={[x, 0.06, z]}>
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[raio, raio * 1.1, 0.22, 9]} />
        <meshStandardMaterial color="#f2f9ff" flatShading />
      </mesh>
      {!vazia &&
        [0, 1, 2].map((i) => <Pinguim key={i} base={centro} fase={fase + i * 2.1} raio={raio * 0.45} y={0.11} />)}
    </group>
  );
}

/** Baleia nadando devagar pelo recife e soltando um jato d'água de vez em quando. */
export function Baleia({ cx, cz }: { cx: number; cz: number }) {
  const ref = useRef<THREE.Group>(null);
  const jato = useRef<THREE.Group>(null);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime * 0.08;
    g.position.set(cx + Math.cos(t) * 5.5, -0.12 + Math.sin(st.clock.elapsedTime * 0.8) * 0.05, cz + Math.sin(t) * 3.5);
    g.rotation.y = -t;
    const ciclo = (st.clock.elapsedTime % 7) / 7;
    if (jato.current) {
      jato.current.visible = ciclo < 0.25;
      jato.current.scale.setScalar(0.3 + ciclo * 4);
    }
  });
  return (
    <group ref={ref}>
      <mesh scale={[0.9, 0.38, 2]} castShadow>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial color="#5b7fb2" flatShading />
      </mesh>
      <mesh position={[0, -0.06, 0]} scale={[0.75, 0.25, 1.7]}>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial color="#dfe9f3" flatShading />
      </mesh>
      <mesh position={[0, 0.05, -1.5]} rotation={[0, 0, Math.PI / 2]} scale={[0.15, 0.9, 0.4]}>
        <coneGeometry args={[0.6, 1, 3]} />
        <meshStandardMaterial color="#4f73a6" flatShading />
      </mesh>
      <group ref={jato} position={[0, 0.3, 0.6]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[(i - 1) * 0.12, i === 1 ? 0.25 : 0.12, 0]}>
            <icosahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.85} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Tartaruga-marinha nadando em círculos no recife. */
export function Tartaruga({ cx, cz }: { cx: number; cz: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    const g = ref.current;
    if (!g) return;
    const t = st.clock.elapsedTime * 0.12;
    g.position.set(cx + Math.cos(t) * 2.2, -0.25, cz + Math.sin(t) * 1.6);
    g.rotation.y = -t - Math.PI / 2;
    const nada = Math.sin(st.clock.elapsedTime * 3) * 0.4;
    g.children[2].rotation.y = nada;
    g.children[3].rotation.y = -nada;
  });
  return (
    <group ref={ref}>
      <mesh scale={[0.55, 0.2, 0.65]}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#5f8f4a" flatShading />
      </mesh>
      <mesh position={[0, 0, 0.38]}>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshStandardMaterial color="#9bc47a" />
      </mesh>
      <mesh position={[0.25, -0.02, 0.12]} scale={[0.3, 0.04, 0.12]}>
        <boxGeometry />
        <meshStandardMaterial color="#9bc47a" />
      </mesh>
      <mesh position={[-0.25, -0.02, 0.12]} scale={[0.3, 0.04, 0.12]}>
        <boxGeometry />
        <meshStandardMaterial color="#9bc47a" />
      </mesh>
    </group>
  );
}

/** Brilhos piscando na superfície da água (como sol refletido). */
export function BrilhosDoMar() {
  const ilha = useIlha();
  const pontos = useMemo(() => {
    const rnd = prng(515);
    const out: [number, number][] = [];
    while (out.length < 90) {
      const x = (rnd() - 0.5) * 60;
      const z = (rnd() - 0.5) * 60;
      if (ilha.dist(x, z) < -0.8) out.push([x, z]);
    }
    return out;
  }, [ilha]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((st) => {
    const m = ref.current;
    if (!m) return;
    const t = st.clock.elapsedTime;
    pontos.forEach(([x, z], i) => {
      const s = Math.max(0, Math.sin(t * 1.3 + i * 1.7)) ** 3;
      tmp.position.set(x, 0.14, z);
      tmp.rotation.set(-Math.PI / 2, 0, i);
      tmp.scale.set(0.35 * s + 0.001, 0.08 * s + 0.001, 1);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pontos.length]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} />
    </instancedMesh>
  );
}

/** Silhuetas de algas no fundo do mar (aparecem através da água turquesa). Uma malha só. */
export function AlgasDoFundo() {
  const ilha = useIlha();
  const geo = useMemo(() => {
    const rnd = prng(919);
    const cone = new THREE.ConeGeometry(0.09, 1, 4);
    const partes: Parte[] = [];
    let tent = 0;
    let n = 0;
    while (n < 60 && tent++ < 4000) {
      const x = (rnd() - 0.5) * 50;
      const z = (rnd() - 0.5) * 50;
      const d = ilha.dist(x, z);
      if (!(d < -1.8 && d > -6)) continue;
      n++;
      const esc = 0.45 + rnd() * 0.5;
      const r = rnd() * 6;
      const y = Math.max(-2.2, ilha.altura(x, z)) + 0.05;
      for (let k = 0; k < 3; k++) {
        const alt = 0.9 + k * 0.15;
        const lx = (k - 1) * 0.18 * esc;
        partes.push({
          geo: cone,
          pos: [x + Math.cos(r) * lx, y + 0.45 * esc, z - Math.sin(r) * lx],
          rot: [0, r, (k - 1) * 0.25],
          esc: [esc, alt * esc, esc],
          cor: "#14958a",
        });
      }
    }
    return fundir(partes);
  }, [ilha]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial vertexColors flatShading transparent opacity={0.75} />
    </mesh>
  );
}
