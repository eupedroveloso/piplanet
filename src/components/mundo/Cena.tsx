"use client";

import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls, Instance, Instances } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import CameraControlsImpl from "camera-controls";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { chaveFase, faseDesbloqueada, TERRITORIOS } from "@/content/jornada";
import type { Progress } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { IlhaContexto } from "./contexto";
import { montarMundo, type Peca } from "./decoracao";
import { GEOMETRIAS, type Forma } from "./formas";
import { geometriaFita, geometriaTerreno, misturar, type Ilha } from "./ilha";
import {
  Balao,
  AlgasDoFundo,
  Baleia,
  Barco,
  BrilhosDoMar,
  Borboleta,
  Coelho,
  Espuma,
  Farol,
  Fumaca,
  Girafa,
  Golfinho,
  Mar,
  MiudezasDoMar,
  Moinho,
  Ovelha,
  Passaros,
  Pinguim,
  PlacaDeGelo,
  Tartaruga,
} from "./vida";

const CINZA = "#c4c7dc";

export interface CenaProps {
  ilha: Ilha;
  progresso: Progress;
  liberados: Record<string, boolean>;
  foco: string | null;
  onFocar: (t: string | null) => void;
  hover: string | null;
  onHover: (t: string | null) => void;
  /** Câmera e balão expostos para a camada de etiquetas (HTML) acompanhar o 3D. */
  camRef: RefObject<THREE.Camera | null>;
  balaoRef: RefObject<THREE.Group | null>;
}

/** Canvas 3D: a ilha (com a silhueta do país) no meio do oceano. */
export default function Cena(props: CenaProps) {
  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }} camera={{ fov: 38, position: [0, 30, 38], near: 0.1, far: 240 }}>
      <fog attach="fog" args={["#bfeef0", 55, 130]} />
      <hemisphereLight args={["#ffffff", "#9fe3dc", 1.05]} />
      <directionalLight
        position={[14, 26, 10]}
        intensity={1.6}
        color="#fff3e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-far={90}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      <IlhaContexto.Provider value={props.ilha}>
        <Mundo {...props} />
      </IlhaContexto.Provider>
      {/* Oclusão de ambiente: sombra macia onde as coisas se encostam (cara de maquete) */}
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={1.6} distanceFalloff={1.2} intensity={2.2} color="#2b3550" halfRes />
      </EffectComposer>
    </Canvas>
  );
}

/** Primeira fase liberada e ainda não concluída. */
function faseAtual(p: Progress) {
  for (const t of TERRITORIOS)
    for (let i = 0; i < t.fases.length; i++)
      if (!(chaveFase(t.id, i) in p.fases) && faseDesbloqueada(p.fases, t.id, i)) return { t: t.id, i };
  return null;
}

function Mundo({ ilha, progresso, liberados, foco, onFocar, hover, onHover, camRef, balaoRef }: CenaProps) {
  const mundo = useMemo(() => montarMundo(ilha), [ilha]);
  const controles = useRef<CameraControlsImpl>(null);
  const camera = useThree((st) => st.camera);
  useEffect(() => {
    camRef.current = camera;
  }, [camera, camRef]);

  const jogaveis = ilha.biomas.filter((b) => b.jogavel);
  const atual = faseAtual(progresso);
  const territorioAtual = jogaveis.find((b) => b.id === atual?.t)?.id ?? jogaveis[0].id;
  const algumLivre = jogaveis.some((b) => liberados[b.id]);
  const livre = (id: string) => {
    const b = ilha.biomas.find((x) => x.id === id);
    return b?.jogavel ? !!liberados[id] : algumLivre;
  };

  // Câmera: dois níveis (o país todo / um bioma de perto, olhando de fora para dentro)
  useEffect(() => {
    const c = controles.current;
    if (!c) return;
    const k = typeof window !== "undefined" && window.innerWidth < window.innerHeight ? 1.45 : 1;
    if (!foco) {
      c.setLookAt(1, 25 * k, 32 * k, 1, 0.5, 2, true);
    } else {
      const alvo = ilha.centro(foco);
      const fora = new THREE.Vector3(alvo.x, 0, alvo.z);
      if (fora.length() < 2) fora.set(0, 0, 1);
      fora.normalize();
      const lado = new THREE.Vector3(-fora.z, 0, fora.x).multiplyScalar(2.5);
      const cam = alvo.clone().add(fora.multiplyScalar(12 * k)).add(lado).add(new THREE.Vector3(0, 11.5 * k, 0));
      c.setLookAt(cam.x, cam.y, cam.z, alvo.x, alvo.y, alvo.z, true);
    }
  }, [foco, ilha]);

  const terreno = useMemo(() => geometriaTerreno(ilha, liberados), [ilha, liberados]);

  const pecas = useMemo(
    () => Object.entries(mundo.pecasPorBioma).flatMap(([id, lista]) => (livre(id) ? lista : lista.map((pc) => ({ ...pc, c: misturar(pc.c, CINZA, 0.6) })))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mundo, liberados],
  );

  const tocar = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    const b = ilha.biomaEm(e.point.x, e.point.z);
    const alvo = b.jogavel ? b.id : territorioAtual;
    if (b.jogavel && !liberados[b.id]) speak(`${b.nome}. Ainda trancado.`);
    onFocar(alvo);
  };

  const cBalao = ilha.centro(territorioAtual);
  const balaoAlvo = new THREE.Vector3(cBalao.x - 3.5, Math.max(cBalao.y, 0.5) + 5.5, cBalao.z + 2.5);

  const temTipo = (tipo: string) => ilha.biomas.filter((b) => b.tipo === tipo && livre(b.id));
  const mares = ilha.biomas.filter((b) => b.noMar && livre(b.id));
  const pastos = (tipo: string) => temTipo(tipo).flatMap((b) => mundo.pastos[b.id] ?? []);

  return (
    <>
      <CameraControls
        ref={controles}
        smoothTime={0.7}
        minPolarAngle={0.5}
        maxPolarAngle={1.18}
        mouseButtons={{
          left: CameraControlsImpl.ACTION.ROTATE,
          middle: CameraControlsImpl.ACTION.NONE,
          right: CameraControlsImpl.ACTION.NONE,
          wheel: CameraControlsImpl.ACTION.NONE,
        }}
        touches={{
          one: CameraControlsImpl.ACTION.TOUCH_ROTATE,
          two: CameraControlsImpl.ACTION.NONE,
          three: CameraControlsImpl.ACTION.NONE,
        }}
      />

      {/* Fundo do mar: azul profundo e uniforme */}
      <mesh position={[0, -3.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[120, 48]} />
        <meshBasicMaterial color="#13989c" />
      </mesh>
      <AlgasDoFundo />
      <Mar />
      <Espuma />
      <BrilhosDoMar />

      {/* Terreno da ilha */}
      <mesh
        geometry={terreno}
        receiveShadow
        castShadow
        onClick={tocar}
        onPointerMove={(e) => {
          const b = ilha.biomaEm(e.point.x, e.point.z);
          const id = b.jogavel ? b.id : null;
          if (id !== hover) onHover(id);
        }}
        onPointerOut={() => onHover(null)}
      >
        <meshStandardMaterial vertexColors flatShading roughness={0.95} />
      </mesh>

      <Trilha ilha={ilha} liberados={liberados} />
      <Pier ilha={ilha} liberados={liberados} />

      {/* Plataformas (mirantes) das fases em terra */}
      {ilha.fases
        .filter((f) => ilha.altura(f.pos.x, f.pos.z) >= 0.42)
        .map((f) => (
          <mesh key={`${f.territorio}-${f.fase}`} position={[f.pos.x, f.pos.y + 0.08, f.pos.z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.42, 0.48, 0.16, 18]} />
            <meshStandardMaterial color={liberados[f.territorio] ? "#ffffff" : "#e3e1ec"} />
          </mesh>
        ))}

      <Pecas pecas={pecas} />

      {mundo.especiais.map((e, i) => {
        if (e.tipo === "moinho") return <Moinho key={i} p={e.p} />;
        if (e.tipo === "fumaca") return livre(e.bioma) ? <Fumaca key={i} p={e.p} /> : null;
        return null;
      })}

      {/* Bichos (só nos biomas liberados: o resto é surpresa) */}
      {pastos("fazenda").slice(0, 4).map((b, i) => <Ovelha key={`o${i}`} base={b} fase={i * 1.7} />)}
      {[...pastos("fazenda"), ...pastos("floresta-tropical"), ...pastos("bambuzal"), ...pastos("eucaliptos")]
        .slice(0, 6)
        .map((b, i) => <Borboleta key={`bf${i}`} base={b} fase={i * 2.1} />)}
      {[...pastos("floresta-temperada"), ...pastos("pradaria"), ...pastos("taiga")].slice(0, 5).map((b, i) => <Coelho key={`c${i}`} base={b} fase={i * 1.3} />)}
      {pastos("savana").slice(0, 3).map((b, i) => <Girafa key={`g${i}`} base={b} fase={i * 3} />)}
      {temTipo("tundra").flatMap((b, bi) =>
        [0, 1, 2].map((i) => {
          const a = i * 2.1 + bi;
          let x = b.x + Math.cos(a) * 9;
          let z = b.z + Math.sin(a) * 9;
          for (let t = 0; t < 8 && ilha.dist(x, z) > -2; t++) {
            x += Math.cos(a) * 1.5;
            z += Math.sin(a) * 1.5;
          }
          return <PlacaDeGelo key={`gelo${bi}-${i}`} x={x} z={z} raio={0.9 + i * 0.15} fase={i * 1.7} vazia />;
        }),
      )}
      {ilha.pais === "australia" &&
        mares.flatMap((m) => [0, 1, 2].map((i) => <Pinguim key={`pg${i}`} base={new THREE.Vector3(m.x + 1.5, 0, m.z - 1)} fase={i * 1.5} raio={0.8} y={0.2} />))}
      {mares.map((m) => (
        <group key={`vida-${m.id}`}>
          <Baleia cx={m.x} cz={m.z} />
          <Tartaruga cx={m.x - 1.5} cz={m.z + 1.5} />
        </group>
      ))}

      {/* Mar vivo */}
      <Barco raio={24} vel={0.04} fase={0} cor="#ffffff" />
      <Barco raio={26} vel={-0.03} fase={2} cor="#ffc935" />
      <Barco raio={23} vel={0.03} fase={4.2} cor="#f25f5c" />
      <Golfinho x={17} z={9} fase={0} giro={0.4} />
      <Golfinho x={-16} z={-11} fase={2} giro={2.2} />
      <Golfinho x={8} z={19} fase={3.1} giro={1.2} />
      <Farol x={-15} z={15} />
      <MiudezasDoMar />
      <Passaros />
      <Balao alvo={balaoAlvo} objRef={balaoRef} />
    </>
  );
}

// ── Trilha ──────────────────────────────────────────────────────────────────

function Trilha({ ilha, liberados }: { ilha: Ilha; liberados: Record<string, boolean> }) {
  const trechos = useMemo(
    () => ilha.trechos.map((t) => ({ ...t, borda: geometriaFita(ilha, t.pontos, 0.78, 0.04), piso: geometriaFita(ilha, t.pontos, 0.58, 0.07) })),
    [ilha],
  );
  return (
    <>
      {trechos.map((t, i) => {
        const livre = liberados[t.territorio];
        return (
          <group key={i}>
            <mesh geometry={t.borda} receiveShadow>
              <meshStandardMaterial color={livre ? "#d9b874" : misturar("#d9b874", CINZA, 0.6)} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
            <mesh geometry={t.piso} receiveShadow>
              <meshStandardMaterial color={livre ? "#fbeec6" : misturar("#fbeec6", CINZA, 0.6)} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-4} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

// ── Píer de madeira (trilha sobre a água) ───────────────────────────────────

function Pier({ ilha, liberados }: { ilha: Ilha; liberados: Record<string, boolean> }) {
  const { tabuas, estacas, corrimao, lanternas } = useMemo(() => {
    const tabuas: { p: THREE.Vector3; giro: number }[] = [];
    const estacas: THREE.Vector3[] = [];
    const corrimao: { p: THREE.Vector3; giro: number }[] = [];
    const lanternas: { p: THREE.Vector3; giro: number }[] = [];
    const P = ilha.pier;
    for (let i = 0; i < P.length; i += 2) {
      const p = P[i];
      const prox = P[Math.min(P.length - 1, i + 1)];
      const ant = P[Math.max(0, i - 1)];
      const t = new THREE.Vector3().subVectors(prox, ant);
      if (t.lengthSq() > 1) continue;
      const giro = Math.atan2(t.x, t.z);
      tabuas.push({ p, giro });
      if (i % 8 === 0) {
        const lado = new THREE.Vector3(Math.cos(giro), 0, -Math.sin(giro)).multiplyScalar(0.42);
        estacas.push(p.clone().add(lado), p.clone().sub(lado));
        corrimao.push({ p: p.clone().add(lado), giro }, { p: p.clone().sub(lado), giro });
      }
      if (i % 48 === 0) lanternas.push({ p: p.clone().add(new THREE.Vector3(Math.cos(giro), 0, -Math.sin(giro)).multiplyScalar(0.5)), giro });
    }
    return { tabuas, estacas, corrimao, lanternas };
  }, [ilha]);
  const mar = ilha.biomas.find((b) => b.noMar);
  const madeira = !mar || liberados[mar.id] ? "#c98e5b" : misturar("#c98e5b", CINZA, 0.6);
  if (!tabuas.length) return null;
  return (
    <>
      <Instances limit={tabuas.length}>
        <boxGeometry args={[0.92, 0.07, 0.16]} />
        <meshStandardMaterial color="#ffffff" flatShading />
        {tabuas.map((t, i) => (
          <Instance key={i} position={[t.p.x, t.p.y + 0.1, t.p.z]} rotation={[0, t.giro, 0]} color={i % 2 ? madeira : misturar(madeira, "#000000", 0.1)} />
        ))}
      </Instances>
      <Instances limit={Math.max(1, estacas.length)}>
        <cylinderGeometry args={[0.07, 0.08, 1.9, 7]} />
        <meshStandardMaterial color="#7a5236" flatShading />
        {estacas.map((e, i) => (
          <Instance key={i} position={[e.x, e.y - 0.45, e.z]} />
        ))}
      </Instances>
      {/* corrimão: travessa sobre as estacas */}
      <Instances limit={Math.max(1, corrimao.length)}>
        <boxGeometry args={[0.06, 0.06, 1.2]} />
        <meshStandardMaterial color="#8a5d3b" flatShading />
        {corrimao.map((c, i) => (
          <Instance key={i} position={[c.p.x, c.p.y + 0.5, c.p.z]} rotation={[0, c.giro, 0]} />
        ))}
      </Instances>
      {/* postes com lanterna */}
      {lanternas.map((l, i) => (
        <group key={i} position={[l.p.x, l.p.y, l.p.z]} rotation={[0, l.giro, 0]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.09, 1.8, 0.09]} />
            <meshStandardMaterial color="#6b4a33" flatShading />
          </mesh>
          <mesh position={[0.22, 1.75, 0]}>
            <boxGeometry args={[0.5, 0.07, 0.07]} />
            <meshStandardMaterial color="#6b4a33" flatShading />
          </mesh>
          <mesh position={[0.42, 1.5, 0]}>
            <boxGeometry args={[0.16, 0.24, 0.16]} />
            <meshStandardMaterial color="#ffe08a" emissive="#ffc935" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ── Decoração instanciada ───────────────────────────────────────────────────


function Pecas({ pecas }: { pecas: Peca[] }) {
  const grupos = useMemo(() => {
    const m = new Map<Forma, Peca[]>();
    for (const p of pecas) m.set(p.f, [...(m.get(p.f) ?? []), p]);
    return [...m.entries()];
  }, [pecas]);
  const geos = useMemo(
    () => Object.fromEntries(Object.entries(GEOMETRIAS).map(([k, f]) => [k, f()])) as Record<Forma, THREE.BufferGeometry>,
    [],
  );
  return (
    <>
      {grupos.map(([forma, lista]) => (
        <Instances key={forma} limit={lista.length} geometry={geos[forma]} castShadow receiveShadow>
          <meshStandardMaterial flatShading roughness={0.9} />
          {lista.map((p, i) => (
            <Instance key={i} position={p.p} scale={p.s} rotation={p.r ?? [0, 0, 0]} color={p.c} />
          ))}
        </Instances>
      ))}
    </>
  );
}
