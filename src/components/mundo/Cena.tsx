"use client";

import { liberadas } from "@/lib/progress";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls, Instance, Instances, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import CameraControlsImpl from "camera-controls";
import { createContext, Suspense, useContext, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { chaveFase, faseDesbloqueada, TERRITORIOS } from "@/content/jornada";
import type { Progress } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { DURACAO_CAMINHO, type Caminho } from "./caminhada";
import { IlhaContexto } from "./contexto";
import { montarMundo, type Peca } from "./decoracao";
import { GEOMETRIAS, type Forma } from "./formas";
import { fundir } from "./fundir";
import { Modelos } from "./DecoracaoModelos";
import { modelosLigados } from "./modelos";
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
  /** Trecho da trilha já feito (e o que está se desenhando agora). */
  caminho?: Caminho | null;
  /** Ponta do caminho que se desenha (a mãozinha HTML acompanha). */
  cabeca?: RefObject<THREE.Vector3 | null>;
}

/**
 * Qualidade adaptativa (tablet Android): começa no médio e o PerformanceMonitor sobe ou desce.
 * alto = sombra 2048 + N8AO + dpr até 2 · médio = sombra 1024, sem AO, dpr 1,5 · baixo = sem sombra, dpr 1, menos miudezas.
 */
export type Qualidade = "alto" | "medio" | "baixo";
const ORDEM: Qualidade[] = ["baixo", "medio", "alto"];
const DPR: Record<Qualidade, number> = { alto: 2, medio: 1.5, baixo: 1 };
const QualidadeContexto = createContext<Qualidade>("medio");

/** Canvas 3D: a ilha (com a silhueta do país) no meio do oceano. */
export default function Cena(props: CenaProps) {
  const [q, setQ] = useState<Qualidade>("medio");
  const mudar = (passo: number) => setQ((atual) => ORDEM[Math.max(0, Math.min(2, ORDEM.indexOf(atual) + passo))]);
  const dpr = Math.min(DPR[q], typeof window !== "undefined" ? window.devicePixelRatio : 1);
  useEffect(() => {
    // em desenvolvimento: window.__pgQualidade("baixo") força um nível para medir
    if (process.env.NODE_ENV !== "production") (window as unknown as { __pgQualidade: (q: Qualidade) => void }).__pgQualidade = setQ;
  }, []);
  return (
    <Canvas shadows dpr={dpr} gl={{ antialias: true, alpha: true }} camera={{ fov: 38, position: [0, 30, 38], near: 0.1, far: 240 }}>
      <PerformanceMonitor flipflops={3} onIncline={() => mudar(1)} onDecline={() => mudar(-1)} onFallback={() => setQ("baixo")} />
      <Medidor q={q} />
      <fog attach="fog" args={["#bfeef0", 55, 130]} />
      <hemisphereLight args={["#ffffff", "#9fe3dc", 1.05]} />
      <directionalLight
        key={q}
        position={[14, 26, 10]}
        intensity={1.6}
        color="#fff3e2"
        castShadow={q !== "baixo"}
        shadow-mapSize={q === "alto" ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-far={90}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      <QualidadeContexto.Provider value={q}>
        <IlhaContexto.Provider value={props.ilha}>
          <Mundo {...props} />
        </IlhaContexto.Provider>
      </QualidadeContexto.Provider>
      {/* Oclusão de ambiente (cara de maquete): só no nível alto */}
      {q === "alto" && (
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={1.6} distanceFalloff={1.2} intensity={2.2} color="#2b3550" halfRes />
        </EffectComposer>
      )}
    </Canvas>
  );
}

/** Em desenvolvimento, expõe números de desempenho em window.__pgDesempenho (para medir no portal). */
function Medidor({ q }: { q: Qualidade }) {
  const gl = useThree((st) => st.gl);
  const cena = useThree((st) => st.scene);
  const quadro = useRef({ triangulos: 0, drawCalls: 0 });
  // soma todos os passes do quadro (sombra, cena, pós) — o info zera a cada render se autoReset
  useFrame((st) => {
    if (process.env.NODE_ENV === "production") return;
    const info = st.gl.info;
    info.autoReset = false;
    quadro.current.triangulos = info.render.triangles;
    quadro.current.drawCalls = info.render.calls;
    info.reset();
  }, -100);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __pgDesempenho: () => object }).__pgDesempenho = () => {
      let meshes = 0;
      let instanciados = 0;
      let comSombra = 0;
      cena.traverseVisible((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        meshes++;
        if ((m as THREE.InstancedMesh).isInstancedMesh) instanciados++;
        if (m.castShadow) comSombra++;
      });
      return {
        qualidade: q,
        dpr: gl.getPixelRatio(),
        triangulos: quadro.current.triangulos,
        drawCalls: quadro.current.drawCalls,
        geometrias: gl.info.memory.geometries,
        meshes,
        instanciados,
        comSombra,
      };
    };
  }, [gl, cena, q]);
  return null;
}

/** Primeira fase liberada e ainda não concluída. */
function faseAtual(p: Progress) {
  for (const t of TERRITORIOS)
    for (let i = 0; i < t.fases.length; i++)
      if (!(chaveFase(t.id, i) in p.fases) && faseDesbloqueada(liberadas(p), t.id, i)) return { t: t.id, i };
  return null;
}

function Mundo({ ilha, progresso, liberados, foco, onFocar, hover, onHover, camRef, balaoRef, caminho, cabeca }: CenaProps) {
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
    () =>
      Object.entries(mundo.pecasPorBioma).flatMap(([id, lista]) =>
        livre(id) ? lista : lista.map((pc) => (pc.m ? { ...pc, d: true } : { ...pc, c: misturar(pc.c, CINZA, 0.6) })),
      ),
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
      {caminho && <TrilhaFeita ilha={ilha} caminho={caminho} cabeca={cabeca} controles={controles} />}
      <Pier ilha={ilha} liberados={liberados} />

      {/* Plataformas (mirantes) das fases em terra */}
      <Mirantes ilha={ilha} liberados={liberados} />

      <Pecas pecas={pecas.filter((p) => !p.m)} />
      {/* Árvores, pedras, flores... modelos prontos do pacote do país (baixado sob demanda) */}
      {modelosLigados() && (
        <Suspense fallback={null}>
          <ModelosDaQualidade pais={ilha.pais} pecas={pecas.filter((p) => p.m)} />
        </Suspense>
      )}

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
  // Todos os trechos numa malha para a borda e outra para o piso (cor por vértice: liberado ou desbotado)
  const { borda, piso } = useMemo(() => {
    const juntar = (largura: number, sobe: number, cor: string) => {
      const partes = ilha.trechos.map((t) => ({
        geo: geometriaFita(ilha, t.pontos, largura, sobe),
        pos: [0, 0, 0] as [number, number, number],
        cor: liberados[t.territorio] ? cor : misturar(cor, CINZA, 0.6),
      }));
      const g = fundir(partes);
      partes.forEach((pt) => pt.geo.dispose());
      return g;
    };
    return { borda: juntar(0.78, 0.04, "#d9b874"), piso: juntar(0.58, 0.07, "#fbeec6") };
  }, [ilha, liberados]);
  useEffect(() => () => { borda.dispose(); piso.dispose(); }, [borda, piso]);
  return (
    <>
      <mesh geometry={borda} receiveShadow>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh geometry={piso} receiveShadow>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-4} />
      </mesh>
    </>
  );
}

/** Suaviza o começo e o fim (sem tranco: previsível). */
const suave = (t: number) => t * t * (3 - 2 * t);

/**
 * Trecho já percorrido da trilha: uma fita coral por cima do piso, cortada no shader até `uFeito`
 * (posição em amostras da trilha). Um draw call; a animação só muda um uniform.
 * Enquanto se desenha, a ponta brilha e a câmera desliza de leve atrás dela.
 */
function TrilhaFeita({
  ilha,
  caminho,
  cabeca,
  controles,
}: {
  ilha: Ilha;
  caminho: Caminho;
  cabeca?: RefObject<THREE.Vector3 | null>;
  controles: RefObject<CameraControlsImpl | null>;
}) {
  const geo = useMemo(() => {
    const g = geometriaFita(ilha, ilha.trilha, 0.36, 0.085);
    // posição ao longo da trilha: 2 vértices por amostra
    const n = g.attributes.position.count;
    const s = new Float32Array(n);
    for (let i = 0; i < n; i++) s[i] = Math.floor(i / 2);
    g.setAttribute("aS", new THREE.BufferAttribute(s, 1));
    return g;
  }, [ilha]);
  useEffect(() => () => geo.dispose(), [geo]);
  const u = useRef({ uFeito: { value: caminho.de }, uBrilho: { value: 0 } });
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: misturar("#f25f5c", "#fbeec6", 0.32),
      roughness: 0.8,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -6,
    });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u.current);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aS;\nvarying float vS;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvS = aS;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uFeito;\nuniform float uBrilho;\nvarying float vS;")
        .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nif (vS > uFeito) discard;")
        .replace(
          "#include <emissivemap_fragment>",
          "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.9, 0.6) * uBrilho * smoothstep(uFeito - 10.0, uFeito, vS);",
        );
    };
    return m;
  }, []);
  useEffect(() => () => material.dispose(), [material]);

  const base = useRef<{ t0: number; alvo: THREE.Vector3; ponta: THREE.Vector3 } | null>(null);
  const reduzir = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  useFrame(() => {
    const { de, ate, t0 } = caminho;
    const t = t0 === null ? 0 : Math.min(1, (performance.now() - t0) / DURACAO_CAMINHO);
    const feito = de + (ate - de) * suave(t);
    u.current.uFeito.value = feito;
    u.current.uBrilho.value = t0 !== null && t < 1 ? 0.55 : Math.max(0, u.current.uBrilho.value - 0.03);
    const i = Math.min(ilha.trilha.length - 2, Math.floor(feito));
    const ponta = ilha.trilha[Math.max(0, i)].clone().lerp(ilha.trilha[Math.max(0, i) + 1], feito - i);
    cabeca?.current?.copy(ponta);
    // câmera acompanha de leve (40% do deslocamento da ponta), suavizada pelo CameraControls
    const c = controles.current;
    if (!c || t0 === null || reduzir || de === ate) return;
    if (base.current?.t0 !== t0) base.current = { t0, alvo: c.getTarget(new THREE.Vector3()), ponta: ponta.clone() };
    if (t < 1) {
      const b = base.current;
      const alvo = b.alvo.clone().addScaledVector(ponta.sub(b.ponta), 0.4);
      c.moveTo(alvo.x, alvo.y, alvo.z, true);
    }
  });
  return <mesh geometry={geo} material={material} receiveShadow />;
}

/** Plataformas (mirantes) das fases em terra: uma malha só. */
function Mirantes({ ilha, liberados }: { ilha: Ilha; liberados: Record<string, boolean> }) {
  const geo = useMemo(() => {
    const disco = new THREE.CylinderGeometry(0.42, 0.48, 0.16, 18);
    const g = fundir(
      ilha.fases
        .filter((f) => ilha.altura(f.pos.x, f.pos.z) >= 0.42)
        .map((f) => ({ geo: disco, pos: [f.pos.x, f.pos.y + 0.08, f.pos.z] as [number, number, number], cor: liberados[f.territorio] ? "#ffffff" : "#e3e1ec" })),
    );
    disco.dispose();
    return g;
  }, [ilha, liberados]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial vertexColors />
    </mesh>
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


/** Modelos com a qualidade atual: no baixo, sem sombra e sem miudezas (tufos, flores, cogumelos). */
function ModelosDaQualidade({ pais, pecas }: { pais: Ilha["pais"]; pecas: Peca[] }) {
  const q = useContext(QualidadeContexto);
  const lista = useMemo(() => (q === "baixo" ? pecas.filter((p) => !/^(grass|flower|mushroom)/.test(p.m!)) : pecas), [pecas, q]);
  return <Modelos pais={pais} pecas={lista} sombra={q !== "baixo"} />;
}

function Pecas({ pecas }: { pecas: Peca[] }) {
  const q = useContext(QualidadeContexto);
  const grupos = useMemo(() => {
    const m = new Map<Forma, Peca[]>();
    for (const p of pecas) {
      // no nível baixo, ficam de fora as miudezas (tufos, flores, pedrinhas)
      if (q === "baixo" && Math.max(...p.s) < 0.14) continue;
      m.set(p.f, [...(m.get(p.f) ?? []), p]);
    }
    return [...m.entries()];
  }, [pecas, q]);
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
