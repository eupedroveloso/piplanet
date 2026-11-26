/* eslint-disable @next/next/no-img-element -- ilustrações SVG locais, sem otimização necessária */
import type { CSSProperties } from "react";

/**
 * Ilustração do acervo (public/arte). Ex.: <Arte nome="ui/estrela" /> ou <Arte src="/arte/animais/gato.svg" />.
 * Estilo flat, da coleção Fluent Emoji (Microsoft, licença MIT).
 */
export function Arte({
  nome,
  src,
  alt = "",
  className = "",
  silhueta = false,
  style,
}: {
  nome?: string;
  src?: string;
  alt?: string;
  className?: string;
  /** Mostra só a sombra do desenho (figurinha ainda não conquistada). */
  silhueta?: boolean;
  style?: CSSProperties;
}) {
  return (
    <img
      src={src ?? `/arte/${nome}.svg`}
      alt={alt}
      draggable={false}
      style={style}
      className={`${silhueta ? "brightness-0 opacity-15" : ""} ${className}`}
    />
  );
}
