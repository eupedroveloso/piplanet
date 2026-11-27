/**
 * NOME DAS LETRAS EM PORTUGUÊS (como a criança ouve na escola)
 * Ao tocar numa letra, a voz fala o nome dela: "v" → "vê", "h" → "agá", "ç" → "cê-cedilha".
 * Escrito como se fala, para a voz não ler a letra solta em outra língua.
 */
const NOMES: Record<string, string> = {
  a: "a", b: "bê", c: "cê", d: "dê", e: "é", f: "éfe", g: "gê", h: "agá", i: "i", j: "jota", k: "cá",
  l: "éle", m: "ême", n: "êne", o: "ó", p: "pê", q: "quê", r: "érre", s: "ésse", t: "tê", u: "u", v: "vê",
  w: "dáblio", x: "xis", y: "ípsilon", z: "zê",
  á: "á com acento", à: "á com crase", â: "â com chapéu", ã: "á com til",
  é: "é com acento", ê: "ê com chapéu", í: "í com acento",
  ó: "ó com acento", ô: "ô com chapéu", õ: "ó com til", ú: "ú com acento", ç: "cê-cedilha",
};

/** O que a voz fala para uma letra (ou o próprio texto, se não for uma letra só). */
export function falaDaLetra(letra: string): string {
  const l = letra.toLowerCase();
  return NOMES[l] ?? letra;
}

export const TODAS_AS_LETRAS = Object.keys(NOMES);

/**
 * Como a voz fala uma SÍLABA: do jeito que está escrita, sem acento inventado. Acento só quando a palavra
 * tem acento de verdade (ex.: o "á" de sabiá). Regra do dono: "vá-cá" e "gá-ló" soavam errados.
 */
export function falaDaSilaba(silaba: string): string {
  return silaba.toLowerCase();
}
