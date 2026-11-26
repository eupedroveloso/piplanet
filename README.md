# Pietro Games 🐾

Uma jornada por uma ilha de animais para aprender a ler. Grátis, sem anúncios.

## Tecnologias

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**: design system com tokens em `src/app/globals.css` (ver `docs/DESIGN-SYSTEM.md`)
- **Motion**: animações e micro-interações
- **three.js + React Three Fiber + drei**: o mapa 3D (ilha low-poly no oceano)
- **Fluent Emoji Flat** (MIT): ilustrações em `public/arte/`
- **Web Speech API**: voz em português, do navegador
- **Prisma 7 + Prisma Postgres**: banco (progresso na nuvem)
- Hospedagem: **Vercel** (plano gratuito)

## Rodar localmente

```bash
npm install          # também gera o cliente do Prisma
cp .env.example .env # e preencha as URLs do banco
npm run dev
```

Testar o banco: `npx tsx scripts/db-ping.mts` · Nova migração: `npm run db:migrate` · Ver dados: `npm run db:studio`

## Publicar na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Na Vercel: **Add New Project** → importe o repositório.
3. Em **Settings → Environment Variables**, adicione as variáveis do `.env` (se o banco foi criado pela integração Prisma da Vercel, elas já estão lá).
4. Cada `git push` publica uma nova versão.

## Estrutura

```
src/
  app/                    rotas: / (ilha 3D), /jogar/[territorio]/[fase], /album, /design-system
  components/ui/          design system (componentes)
  components/mundo/       mapa 3D: terreno, decoração, vida, etiquetas
  components/jornada/     álbum
  content/animais.ts      53 animais com sílabas, território e curiosidade
  content/jornada.ts      territórios, fases e desbloqueio
  games/                  um diretório por jogo
  lib/                    voz, progresso/pontuação, banco, configurações
prisma/                   schema e migrações
docs/                     metodologia, design system, como criar jogos
```
