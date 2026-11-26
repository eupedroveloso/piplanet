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
  nome: string;
  exemplo: string;
  /** Ilustração (public/arte/...). */
  icone: string;
  /** O que a voz fala quando a criança chega neste nível. */
  fala: string;
}

export const NIVEIS_JORNADA: InfoNivel[] = [
  { n: 1, nome: "Palavras curtinhas", exemplo: "ga·to", icone: "animais/gato", fala: "Nível um: palavras curtinhas, como gato!" },
  { n: 2, nome: "Palavras de três sílabas", exemplo: "ca·va·lo", icone: "animais/cavalo", fala: "Nível dois: palavras de três pedacinhos, como cavalo!" },
  { n: 3, nome: "Sílabas diferentes", exemplo: "co·bra", icone: "animais/cobra", fala: "Nível três: sílabas diferentes, como cobra e tubarão!" },
  { n: 4, nome: "Palavras difíceis", exemplo: "o·ve·lha", icone: "animais/ovelha", fala: "Nível quatro: palavras difíceis, como ovelha e pinguim!" },
  { n: 5, nome: "Palavras gigantes", exemplo: "hi·po·pó·ta·mo", icone: "animais/hipopotamo", fala: "Nível cinco: palavras gigantes, como hipopótamo!" },
];

export const infoNivel = (n: number) => NIVEIS_JORNADA[Math.min(5, Math.max(1, n)) - 1];

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
