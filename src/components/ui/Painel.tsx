import type { ComponentProps } from "react";

/** Superfície branca arredondada. Base de cards, balões e caixas. */
export function Painel({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-lg bg-branco p-5 shadow-suave ${className}`} {...props} />;
}
