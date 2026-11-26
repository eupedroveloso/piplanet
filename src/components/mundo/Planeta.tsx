"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import CameraControlsImpl from "camera-controls";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { PAISES, type PaisId } from "@/content/paises";
import { animaisDoTerritorio, territoriosDoPais } from "@/content/jornada";
import { arteDoAnimal } from "@/content/animais";
import type { Progress } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { CLASSE_ETIQUETA, MOLA_ENTRADA } from "@/components/ui";
import { latLonParaVetor, texturaGlobo } from "./geo";
import { Asteroides, Cometa, CriaturasDoMar, Estrelas, Foguete, Lua, Satelite } from "./Espaco";
import { useProjecao } from "./Rotulos";

const RAIO = 6;
const tmp = new THREE.Vector3();
/** Só mostra a placa do país quando ele está virado para a câmera. */
const frente = (alvo: THREE.Vector3, cam: THREE.Camera) => tmp.subVectors(cam.position, alvo).dot(alvo) > 0;

/**
 * PLANETA: o nível acima das ilhas.
 * Globo 3D com o mapa-múndi; os países da jornada aparecem coloridos (cinza = trancado).
 * Arraste para girar; toque num país para viajar até a ilha dele.
 */
export function Planeta({
  liberados,
  atual,
  progresso,
  alvo,
  onEscolher,
}: {
  liberados: Record<PaisId, boolean>;
  atual: PaisId;
  progresso: Progress;
  /** País para onde a câmera está voando (antes de trocar para a ilha). */
  alvo: PaisId | null;
  onEscolher: (p: PaisId) => void;
}) {
  const camRef = useRef<THREE.Camera | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const ancoras = useMemo(
    () =>
      new Map(
        PAISES.map((p) => {
          const v = latLonParaVetor(p.lat, p.lon, RAIO * 1.04);
          return [`pais-${p.id}`, new THREE.Vector3(v.x, v.y, v.z)] as const;
        }),
      ),
    [],
  );
  useProjecao(host, camRef, ancoras, undefined, frente);

  return (
    <div className="absolute inset-0">
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }} camera={{ fov: 40, position: [0, 4, 22], near: 0.1, far: 300 }}>
        <hemisphereLight args={["#ffffff", "#5b5fa8", 0.9]} />
        <directionalLight position={[10, 12, 14]} intensity={1.6} />
        <Estrelas />
        <Globo liberados={liberados} atual={atual} alvo={alvo} camRef={camRef} />
        <CriaturasDoMar raio={RAIO} />
        <Lua />
        <Asteroides />
        <Foguete raio={8.2} vel={0.25} fase={0} inclinacao={0.3} cor="#f25f5c" />
        <Foguete raio={9.4} vel={-0.18} fase={2.5} inclinacao={-0.5} cor="#ffc935" />
        <Satelite />
        <Cometa />
      </Canvas>

      {/* Placas dos países (escondem quando estão do outro lado do globo) */}
      <div ref={host} className="pointer-events-none absolute inset-0 overflow-hidden">
        {PAISES.map((p, i) => {
          const livre = liberados[p.id];
          const ts = territoriosDoPais(p.id);
          const total = ts.reduce((s, t) => s + t.fases.length, 0);
          const feitas = ts.reduce((s, t) => s + t.fases.filter((_, k) => `${t.id}/${k}` in progresso.fases).length, 0);
          const capa = ts[0] ? animaisDoTerritorio(ts[0].id)[0] : undefined;
          return (
            <div key={p.id} data-ancora={`pais-${p.id}`} className="pointer-events-auto absolute top-0 left-0">
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                animate={{ opacity: 1, scale: p.id === atual ? [1, 1.08, 1] : 1, y: 0 }}
                transition={
                  p.id === atual
                    ? { scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" }, default: { ...MOLA_ENTRADA, delay: i * 0.06 } }
                    : { ...MOLA_ENTRADA, delay: i * 0.06 }
                }
                whileHover={{ y: -4, scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  speak(livre ? p.nome : `${p.nome}. Ainda trancado. Termine o país anterior para viajar até aqui.`);
                  if (livre) onEscolher(p.id);
                }}
                className={`${CLASSE_ETIQUETA} ${p.id === atual ? "bg-amarelo outline-2 outline-branco/80" : "bg-branco"}`}
              >
                {/* Ícone primeiro: um bicho do país (ou o cadeado), para quem ainda não lê */}
                <span className="relative grid size-8 place-items-center rounded-full bg-branco/80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={capa ? arteDoAnimal(capa) : "/arte/ui/cadeado.svg"} alt="" className={`size-6 ${livre ? "" : "opacity-40 grayscale"}`} />
                  {!livre && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/arte/ui/cadeado.svg" alt="" className="absolute -right-1 -bottom-1 size-4" />
                  )}
                </span>
                <span className={`text-sm font-extrabold tracking-[0.08em] uppercase ${livre ? "text-roxo" : "text-tinta"}`}>{p.nome}</span>
                {livre && (
                  <span className={`flex h-6 items-center rounded-full px-2 text-xs font-bold text-tinta ${p.id === atual ? "bg-branco/85" : "bg-roxo-claro"}`}>
                    {feitas}/{total}
                  </span>
                )}
              </motion.button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Globo({
  liberados,
  atual,
  alvo,
  camRef,
}: {
  liberados: Record<PaisId, boolean>;
  atual: PaisId;
  alvo: PaisId | null;
  camRef: RefObject<THREE.Camera | null>;
}) {
  const controles = useRef<CameraControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const tocando = useRef(false);
  useEffect(() => {
    camRef.current = camera;
  }, [camera, camRef]);

  const textura = useMemo(() => {
    const t = new THREE.CanvasTexture(texturaGlobo(liberados));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [liberados]);

  /** Coloca a câmera de frente para um país (distância `d`). */
  const olharPara = (id: PaisId, d: number, animar: boolean) => {
    const p = PAISES.find((x) => x.id === id)!;
    const v = latLonParaVetor(p.lat, p.lon, d);
    controles.current?.setLookAt(v.x, v.y + d * 0.12, v.z, 0, 0, 0, animar);
  };

  // Abre mostrando o país atual
  useEffect(() => {
    olharPara(atual, 22, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Voo até o país escolhido (antes de entrar na ilha)
  useEffect(() => {
    if (alvo) olharPara(alvo, 10.5, true);
     
  }, [alvo]);

  // Giro bem lento quando ninguém está mexendo
  useFrame((_, dt) => {
    if (!alvo && !tocando.current) controles.current?.rotate(dt * 0.04, 0, false);
  });

  return (
    <>
      <CameraControls
        ref={controles}
        smoothTime={0.8}
        minDistance={10}
        maxDistance={24}
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
        onStart={() => (tocando.current = true)}
        onEnd={() => (tocando.current = false)}
      />
      {/* Brilho de atmosfera */}
      <mesh scale={1.06}>
        <sphereGeometry args={[RAIO, 48, 32]} />
        <meshBasicMaterial color="#7fb8ff" transparent opacity={0.35} side={THREE.BackSide} />
      </mesh>
      <mesh scale={1.14}>
        <sphereGeometry args={[RAIO, 48, 32]} />
        <meshBasicMaterial color="#4a6fd6" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[RAIO, 96, 64]} />
        <meshStandardMaterial map={textura} roughness={0.85} />
      </mesh>
    </>
  );
}
