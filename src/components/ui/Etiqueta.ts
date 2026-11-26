/**
 * ETIQUETA FLUTUANTE (placas de país/bioma sobre o mapa 3D)
 * 40 px visíveis, mas a área de toque vai a 48 px (pseudo-elemento). Fundo branco SÓLIDO
 * (passe `bg-branco` ou `bg-amarelo` junto; nunca translúcido): o texto precisa ler sobre neve, mar, floresta e espaço.
 * Para quem não sabe ler: sempre com um ícone (bicho/cadeado) antes do nome e fala ao tocar. Use num motion.button com hover/toque.
 */
export const CLASSE_ETIQUETA =
  "relative flex h-10 items-center gap-1.5 rounded-full pl-1.5 pr-3.5 whitespace-nowrap vidro before:absolute before:-inset-1 before:content-['']";
