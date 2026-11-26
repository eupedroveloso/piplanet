import type { MetadataRoute } from "next";

/** Permite "Adicionar à tela de início" no tablet/celular, abrindo em tela cheia. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pietro Games",
    short_name: "Pietro Games",
    description: "Uma jornada pelos territórios dos animais para aprender a ler.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f6f2fd",
    theme_color: "#f6f2fd",
    icons: [{ src: "/arte/animais/coruja.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
