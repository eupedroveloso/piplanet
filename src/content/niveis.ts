import type { Animal } from "./animais";

/**
 * NÍVEIS DE LEITURA DA JORNADA (método fônico, do mais simples ao mais complexo)
 * A jornada inteira é uma escada única: começa com palavras curtinhas e termina com palavras gigantes.
 * O nível de cada palavra é calculado pelas sílabas (quantidade e sílabas "diferentes": lh, nh, ch, rr,
 * qu, gu, encontros como br/tr, sílaba terminada em consoante, ã/õ).
 */
export type NivelJornada = 1 | 2 | 3 | 4 | 5;

export interface InfoNivel {
  n: NivelJornada;
  /** Título de explorador (o que a criança "vira" ao chegar no nível). */
  nome: string;
  /** O que se lê neste nível (para os pais e para a fala). */
  leitura: string;
  exemplo: string;
  /** Ilustração (public/arte/...). */
  icone: string;
  /** O que a voz fala quando a criança chega neste nível. */
  fala: string;
}

export const NIVEIS_JORNADA: InfoNivel[] = [
  { n: 1, nome: "Explorador Iniciante", leitura: "Palavras curtinhas", exemplo: "ga·to", icone: "animais/gato", fala: "Explorador Iniciante! Palavras curtinhas, como gato!" },
  { n: 2, nome: "Explorador Aprendiz", leitura: "Palavras de três sílabas", exemplo: "ca·va·lo", icone: "animais/cavalo", fala: "Explorador Aprendiz! Palavras de três pedacinhos, como cavalo!" },
  { n: 3, nome: "Explorador Aventureiro", leitura: "Sílabas diferentes", exemplo: "co·bra", icone: "animais/cobra", fala: "Explorador Aventureiro! Sílabas diferentes, como cobra e tubarão!" },
  { n: 4, nome: "Explorador Experiente", leitura: "Palavras difíceis", exemplo: "o·ve·lha", icone: "animais/ovelha", fala: "Explorador Experiente! Palavras difíceis, como ovelha e pinguim!" },
  { n: 5, nome: "Explorador Mestre", leitura: "Palavras gigantes", exemplo: "hi·po·pó·ta·mo", icone: "animais/hipopotamo", fala: "Explorador Mestre! Palavras gigantes, como hipopótamo!" },
];

/** Nível com o título no gênero da criança ("Exploradora Iniciante" para "f"). */
export const infoNivel = (n: number, genero: "m" | "f" = "m"): InfoNivel => {
  const nv = NIVEIS_JORNADA[Math.min(5, Math.max(1, n)) - 1];
  if (genero === "m") return nv;
  return { ...nv, nome: nv.nome.replace("Explorador", "Exploradora"), fala: nv.fala.replace("Explorador", "Exploradora") };
};

/** Sílaba "diferente" (mais difícil que consoante + vogal). */
function silabaComplexa(s: string) {
  const x = s.toLowerCase();
  return (
    /lh|nh|ch|rr|ss|qu|gu|[bcdfgkptv][rl]|ã|õ/.test(x) ||
    /[aeiouáéíóúâêô][rslmnxz]$/.test(x) ||
    x.length > 3
  );
}

/** Nível de leitura de uma palavra (pelas sílabas). */
export function nivelPalavra(silabas: string[]): NivelJornada {
  const c = silabas.filter(silabaComplexa).length;
  const n = silabas.length;
  if (n <= 2 && c === 0) return 1;
  if (n === 3 && c === 0) return 2;
  if (n <= 3 && c === 1) return 3;
  if (n <= 3 || (n === 4 && c <= 1)) return 4;
  return 5;
}

export const nivelDoBicho = (a: Animal) => nivelPalavra(a.silabas);
