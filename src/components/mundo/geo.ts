import { feature, merge } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import mundoJson from "world-atlas/countries-110m.json";
import { PAISES, type Pais, type PaisId } from "@/content/paises";

/**
 * GEOGRAFIA (Natural Earth 1:110m via world-atlas, domínio público)
 * - Contorno de cada país (ou da África inteira) para virar a silhueta da ilha.
 * - Textura do globo (mapa-múndi desenhado num canvas) para o planeta.
 */

const topo = mundoJson as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const paises = topo.objects.countries;

type Anel = [number, number][]; // [lon, lat]

function areaAnel(anel: Anel, cosLat: number) {
  let a = 0;
  for (let i = 0; i < anel.length - 1; i++) {
    a += anel[i][0] * cosLat * anel[i + 1][1] - anel[i + 1][0] * cosLat * anel[i][1];
  }
  return Math.abs(a / 2);
}

/** Maior anel (parte principal) do país: ex.: EUA sem Alasca, Austrália sem Tasmânia. */
export function contornoPais(pais: Pais): Anel {
  const geoms = paises.geometries.filter((g) => pais.iso.includes(String(g.id)));
  type Poligonal = Parameters<typeof merge>[1];
  const geo =
    geoms.length > 1
      ? merge(topo, geoms as unknown as Poligonal)
      : (feature(topo, geoms[0]) as unknown as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>).geometry;
  const poligonos: Anel[][] =
    geo.type === "Polygon" ? [geo.coordinates as Anel[]] : geo.type === "MultiPolygon" ? (geo.coordinates as Anel[][]) : [];
  const cos = Math.cos((pais.lat * Math.PI) / 180);
  let melhor: Anel = [];
  let maior = 0;
  for (const poli of poligonos) {
    const a = areaAnel(poli[0], cos);
    if (a > maior) {
      maior = a;
      melhor = poli[0];
    }
  }
  return melhor;
}

export interface Silhueta {
  /** Contorno em coordenadas locais (x leste, z sul), centralizado e escalado. */
  pontos: { x: number; z: number }[];
  /** Converte (u, v) do retângulo da silhueta (0..1) para coordenadas locais. */
  uv: (u: number, v: number) => { x: number; z: number };
  largura: number;
  altura: number;
}

/** Projeta o contorno num plano e escala para caber num quadrado de `tamanho`. */
export function silhueta(paisId: PaisId, tamanhoPadrao = 26): Silhueta {
  const pais = PAISES.find((p) => p.id === paisId)!;
  const tamanho = pais.tamanhoIlha ?? tamanhoPadrao;
  // Destino no mar (sem país): uma ilhota arredondada e irregular no meio do oceano
  const anel: Anel = pais.iso.length
    ? contornoPais(pais)
    : Array.from({ length: 41 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2;
        const r = 1 + 0.18 * Math.sin(a * 3 + 1) + 0.1 * Math.sin(a * 5 + 2);
        return [pais.lon + Math.cos(a) * r, pais.lat + Math.sin(a) * r] as [number, number];
      });
  let lons = anel.map((p) => p[0]);
  // Contornos que cruzam a linha de 180° (ex.: Rússia): passa tudo para 0..360
  if (Math.max(...lons) - Math.min(...lons) > 180) lons = lons.map((l) => (l < 0 ? l + 360 : l));
  const lats = anel.map((p) => p[1]);
  const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2;
  const cos = Math.cos((lat0 * Math.PI) / 180);
  const xs = lons.map((l) => l * cos);
  const zs = lats.map((l) => -l);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const w = maxX - minX;
  const h = maxZ - minZ;
  const k = tamanho / Math.max(w, h);
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const pontos = xs.map((x, i) => ({ x: (x - cx) * k, z: (zs[i] - cz) * k }));
  return {
    pontos,
    uv: (u, v) => ({ x: (minX + u * w - cx) * k, z: (minZ + v * h - cz) * k }),
    largura: w * k,
    altura: h * k,
  };
}

// ── Globo ───────────────────────────────────────────────────────────────────

/** Desenha o mapa-múndi (equirretangular) num canvas para virar a textura do planeta. */
export function texturaGlobo(liberados: Record<PaisId, boolean>, largura = 2048) {
  const W = largura;
  const H = largura / 2;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  // Mar com degradê suave
  const mar = g.createLinearGradient(0, 0, 0, H);
  mar.addColorStop(0, "#5cc0ea");
  mar.addColorStop(0.5, "#3aa6dd");
  mar.addColorStop(1, "#5cc0ea");
  g.fillStyle = mar;
  g.fillRect(0, 0, W, H);
  // Paralelos e meridianos bem leves
  g.strokeStyle = "rgba(255,255,255,0.12)";
  g.lineWidth = 2;
  for (let lat = -60; lat <= 60; lat += 30) {
    g.beginPath();
    g.moveTo(0, ((90 - lat) / 180) * H);
    g.lineTo(W, ((90 - lat) / 180) * H);
    g.stroke();
  }
  const px = (lon: number) => ((lon + 180) / 360) * W;
  const py = (lat: number) => ((90 - lat) / 180) * H;

  const corDe = (id: string) => {
    for (const p of PAISES) if (p.iso.includes(id)) return liberados[p.id] ? p.cor : "#c9c4d8";
    return null;
  };

  // Destinos no mar (ex.: Oceano): mancha turquesa clara com recife
  for (const p of PAISES.filter((x) => !x.iso.length)) {
    const cx = px(p.lon);
    const cy = py(p.lat);
    const r = W * 0.045;
    const grad = g.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    grad.addColorStop(0, liberados[p.id] ? "#b7f5ea" : "#cfd6e6");
    grad.addColorStop(0.6, liberados[p.id] ? "#5fdcd0" : "#a9b4cc");
    grad.addColorStop(1, "rgba(58,166,221,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(cx, cy, r * 1.3, r, 0, 0, Math.PI * 2);
    g.fill();
  }

  const fc = feature(topo, paises) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  for (const f of fc.features) {
    const id = String(f.id);
    const destaque = corDe(id);
    const geom = f.geometry;
    const polis: Anel[][] = geom.type === "Polygon" ? [geom.coordinates as Anel[]] : geom.type === "MultiPolygon" ? (geom.coordinates as Anel[][]) : [];
    g.beginPath();
    for (const poli of polis) {
      for (const anel of poli) {
        anel.forEach(([lon, lat], i) => {
          const prev = anel[i - 1];
          if (i === 0 || (prev && Math.abs(prev[0] - lon) > 180)) g.moveTo(px(lon), py(lat));
          else g.lineTo(px(lon), py(lat));
        });
        g.closePath();
      }
    }
    g.fillStyle = destaque ?? (id === "010" ? "#ffffff" : "#a8d98f");
    g.fill("evenodd");
    g.strokeStyle = destaque ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)";
    g.lineWidth = destaque ? 3 : 1.2;
    g.stroke();
  }
  return c;
}

/** Ponto na superfície do globo (mesma convenção do SphereGeometry do three.js). */
export function latLonParaVetor(lat: number, lon: number, raio: number) {
  const phi = ((lon + 180) * Math.PI) / 180;
  const theta = ((90 - lat) * Math.PI) / 180;
  return { x: -raio * Math.cos(phi) * Math.sin(theta), y: raio * Math.cos(theta), z: raio * Math.sin(phi) * Math.sin(theta) };
}
