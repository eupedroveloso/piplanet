/**
 * FONTE DE LEITURA QUE CABE
 * Devolve um font-size em CSS que encolhe com a largura da tela para a palavra caber numa linha
 * (ex.: RI·NO·CE·RON·TE em 360 px), sem passar do tamanho máximo no tablet.
 * Calibrado para Andika bold em caixa alta (~0,64 em por letra) e separador "·" com folga (~0,7 em).
 *
 * @param letras total de letras visíveis
 * @param separadores quantos "·" ou espaços entre as partes
 * @param folgaPx espaço horizontal que NÃO é da palavra (margens, padding do cartão)
 * @param maxRem tamanho máximo (rem)
 */
export function fonteQueCabe(letras: number, separadores = 0, folgaPx = 80, maxRem = 4.5) {
  const ems = Math.max(1, letras * 0.64 + separadores * 0.7);
  return `min(${maxRem}rem, calc((100vw - ${folgaPx}px) / ${ems.toFixed(2)}))`;
}
