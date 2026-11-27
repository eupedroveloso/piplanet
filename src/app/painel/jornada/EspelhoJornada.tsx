"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { arteDoAnimal } from "@/content/animais";
import { animaisDoTerritorio, chaveFase, faseDesbloqueada, JOGOS, paisDesbloqueado, SEQUENCIA, TERRITORIOS } from "@/content/jornada";
import { infoNivel, NIVEIS_JORNADA } from "@/content/niveis";
import { PAISES } from "@/content/paises";
import { Arte, ArteMascote, BotaoRedondo, MOLA_ENTRADA, MOLA_TOQUE } from "@/components/ui";
import { duracao } from "../dados";
import { TelaEspelho, useEspelho } from "../espelho";
import { Cartao, Secoes } from "../graficos";

/** Uma fase da jornada vista pelos Pais: resultado, pontuação, vezes, erros e estado. */
type InfoFase = {
  chave: string;
  t: (typeof TERRITORIOS)[number];
  i: number;
  nivel: number;
  feita: boolean;
  estrelas: number;
  pontos: number;
  vezes: number;
  erros: number;
  tempo: number;
  livre: boolean;
  atual: boolean;
};

const estrelinhas = (n: number) => "★".repeat(n) + "☆".repeat(3 - n);

/**
 * ESPELHO DA JORNADA (conta Pais, somente leitura)
 * O caminho da criança escolhida: por nível, por país e fase a fase (estrelas, pontuação, vezes, erros),
 * com destaque nas fases com mais erros e onde ela está agora. Nada de jogar.
 */
export function EspelhoJornada() {
  const esp = useEspelho();
  const { base, m, crianca } = esp;
  const atualChave = SEQUENCIA.find((k) => !(k in base.fases));
  const porLicao = new Map(m.porLicao.map((l) => [l.chave, l]));

  const fases: InfoFase[] = TERRITORIOS.flatMap((t) =>
    t.fases.map((f, i) => {
      const chave = chaveFase(t.id, i);
      const r = base.fases[chave];
      const l = porLicao.get(chave);
      return {
        chave,
        t,
        i,
        nivel: f.nivel,
        feita: !!r,
        estrelas: r?.estrelas ?? 0,
        pontos: r?.melhorPontos ?? 0,
        vezes: l?.vezes ?? r?.vezes ?? 0,
        erros: l?.erros ?? 0,
        tempo: l?.tempoTotal ?? 0,
        livre: faseDesbloqueada(base.fases, t.id, i),
        atual: chave === atualChave,
      };
    }),
  );
  // destaque: as fases com mais erros (pelo menos 3 e entre as mais erradas)
  const maxErros = Math.max(0, ...fases.map((f) => f.erros));
  const muitoErro = (f: InfoFase) => f.erros >= 3 && f.erros >= maxErros * 0.6;
  const faseAtual = fases.find((f) => f.atual);

  return (
    <TelaEspelho titulo="Jornada" icone="ui/mapa" esp={esp}>
      <Secoes
        secoes={[
          { titulo: "Por nível", conteudo: <PorNivel fases={fases} genero={crianca.genero} faseAtual={faseAtual} /> },
          { titulo: "Por país", conteudo: <PorPais fases={fases} fasesProgresso={base.fases} /> },
          { titulo: "Fase a fase", conteudo: <FaseAFase fases={fases} muitoErro={muitoErro} faseAtual={faseAtual} /> },
        ]}
      />
    </TelaEspelho>
  );
}

/** Os 5 níveis de leitura: quantas lições concluiu, estrelas, pontos e erros em cada um. */
function PorNivel({ fases, genero, faseAtual }: { fases: InfoFase[]; genero: "m" | "f"; faseAtual?: InfoFase }) {
  return (
    <Cartao titulo="Níveis de leitura" ajuda="Cada nível tem palavras um pouco mais difíceis. A barra mostra as lições concluídas no nível.">
      <ul className="flex flex-col gap-2 [@media(max-height:700px)]:gap-1">
        {NIVEIS_JORNADA.map((nv, k) => {
          const doNivel = fases.filter((f) => f.nivel === nv.n);
          const feitas = doNivel.filter((f) => f.feita);
          const estrelas = feitas.reduce((s, f) => s + f.estrelas, 0);
          const pontos = feitas.reduce((s, f) => s + f.pontos, 0);
          const erros = doNivel.reduce((s, f) => s + f.erros, 0);
          const aqui = faseAtual?.nivel === nv.n;
          const info = infoNivel(nv.n, genero);
          return (
            <motion.li
              key={nv.n}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...MOLA_ENTRADA, delay: k * 0.05 }}
              className={`flex items-center gap-3 rounded-xl px-2 py-1 transition-colors duration-300 ${aqui ? "bg-amarelo-claro" : ""}`}
            >
              <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-roxo-claro">
                <Arte nome={nv.icone} className={`size-7 ${feitas.length || aqui ? "" : "opacity-40 grayscale"}`} />
                {aqui && <ArteMascote sufixo="-rosto" className="absolute -right-1.5 -bottom-1.5 size-5" />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm leading-tight font-bold text-roxo">
                    {nv.n}. {info.nome}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-tinta-suave">
                    {feitas.length}/{doNivel.length} lições
                  </span>
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-linha">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${doNivel.length ? (feitas.length / doNivel.length) * 100 : 0}%` }}
                    transition={{ ...MOLA_ENTRADA, delay: k * 0.05 }}
                    className={`block h-full rounded-full ${feitas.length === doNivel.length && doNivel.length ? "bg-verde" : "bg-roxo"}`}
                  />
                </span>
                <span className="flex gap-3 text-xs text-tinta-suave">
                  <span className="font-bold text-amarelo-escuro">★ {estrelas}</span>
                  <span>{pontos} pts</span>
                  <span className={erros ? "font-bold text-coral-escuro" : ""}>{erros} erros</span>
                </span>
              </span>
            </motion.li>
          );
        })}
      </ul>
    </Cartao>
  );
}

/** Os países em ordem: concluídos, onde está e o que falta (trancado). */
function PorPais({ fases, fasesProgresso }: { fases: InfoFase[]; fasesProgresso: Record<string, unknown> }) {
  return (
    <Cartao titulo="Países, em ordem">
      <ul className="flex flex-col gap-2 [@media(max-height:700px)]:gap-0.5">
        {PAISES.map((p, k) => {
          const doPais = fases.filter((f) => f.t.pais === p.id);
          if (!doPais.length) return null;
          const feitas = doPais.filter((f) => f.feita);
          const estrelas = feitas.reduce((s, f) => s + f.estrelas, 0);
          const aqui = doPais.some((f) => f.atual);
          const livre = paisDesbloqueado(fasesProgresso, p.id);
          const capa = animaisDoTerritorio(doPais[0].t.id)[0];
          const completo = feitas.length === doPais.length;
          return (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...MOLA_ENTRADA, delay: k * 0.04 }}
              className={`flex items-center gap-3 rounded-xl px-2 py-1 transition-colors duration-300 [@media(max-height:700px)]:py-0.5 ${aqui ? "bg-amarelo-claro" : ""}`}
            >
              <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-roxo-claro [@media(max-height:700px)]:size-9">
                {capa && <Arte src={arteDoAnimal(capa)} className={`size-7 ${livre ? "" : "opacity-40 grayscale"}`} />}
                {!livre && <Arte nome="ui/cadeado" className="absolute -right-1 -bottom-1 size-4" />}
                {completo && <Arte nome="ui/medalha" className="absolute -right-1 -bottom-1 size-5" />}
                {aqui && <ArteMascote sufixo="-rosto" className="absolute -right-1.5 -bottom-1.5 size-5" />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`text-sm leading-tight font-bold ${livre ? "text-roxo" : "text-tinta-suave"}`}>{p.nome}</span>
                  <span className="shrink-0 text-xs font-bold text-tinta-suave">
                    {feitas.length}/{doPais.length} · <span className="text-amarelo-escuro">★ {estrelas}</span>
                  </span>
                </span>
                <span className="h-1.5 overflow-hidden rounded-full bg-linha">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${(feitas.length / doPais.length) * 100}%` }}
                    transition={{ ...MOLA_ENTRADA, delay: k * 0.04 }}
                    className={`block h-full rounded-full ${completo ? "bg-verde" : "bg-roxo"}`}
                  />
                </span>
              </span>
            </motion.li>
          );
        })}
      </ul>
    </Cartao>
  );
}

/** Um bioma por vez (setas): cada fase com estrelas e destaque de erros; tocar abre o detalhe. */
function FaseAFase({ fases, muitoErro, faseAtual }: { fases: InfoFase[]; muitoErro: (f: InfoFase) => boolean; faseAtual?: InfoFase }) {
  const inicio = Math.max(0, TERRITORIOS.findIndex((t) => t.id === (faseAtual?.t.id ?? TERRITORIOS[0].id)));
  const [ti, setTi] = useState(inicio);
  const [sel, setSel] = useState<string | null>(faseAtual?.chave ?? null);
  const t = TERRITORIOS[ti];
  const doBioma = fases.filter((f) => f.t.id === t.id);
  const capa = animaisDoTerritorio(t.id)[0];
  const selecionada = doBioma.find((f) => f.chave === sel) ?? doBioma.find((f) => f.atual) ?? null;
  const pais = PAISES.find((p) => p.id === t.pais);

  const ir = (d: number) => {
    const n = Math.max(0, Math.min(TERRITORIOS.length - 1, ti + d));
    setTi(n);
    setSel(null);
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <BotaoRedondo aria-label="Bioma anterior" fala={false} onClick={() => ir(-1)} disabled={ti === 0} className="disabled:opacity-40">
          <span className="text-lg font-extrabold text-roxo">‹</span>
        </BotaoRedondo>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          {capa && <Arte src={arteDoAnimal(capa)} className="size-8 shrink-0" />}
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-xs font-bold text-tinta-suave">{pais?.nome}</span>
            <span className="truncate font-extrabold text-roxo">{t.nome}</span>
          </span>
        </div>
        <BotaoRedondo aria-label="Próximo bioma" fala={false} onClick={() => ir(1)} disabled={ti === TERRITORIOS.length - 1} className="disabled:opacity-40">
          <span className="text-lg font-extrabold text-roxo">›</span>
        </BotaoRedondo>
      </div>

      <Cartao
        titulo={`Fases · ${doBioma.filter((f) => f.feita).length} de ${doBioma.length} concluídas`}
        ajuda="Verde: concluída (com as estrelas). Amarela: onde a criança está agora. Borda vermelha: fase com mais erros. Cadeado: ainda trancada."
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16, transition: { duration: 0.12 } }}
            transition={MOLA_ENTRADA}
            className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-2"
          >
            {doBioma.map((f) => {
              const ativa = selecionada?.chave === f.chave;
              const erro = muitoErro(f);
              return (
                <motion.button
                  key={f.chave}
                  type="button"
                  onClick={() => setSel(f.chave)}
                  aria-pressed={ativa}
                  aria-label={`${f.t.fases[f.i].titulo}${f.feita ? `, ${f.estrelas} estrelas` : f.atual ? ", está aqui" : f.livre ? "" : ", trancada"}`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  animate={f.atual ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={f.atual ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : MOLA_TOQUE}
                  className={`relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-extrabold transition-shadow duration-200 ${
                    f.feita ? "bg-verde-claro text-verde-escuro" : f.atual ? "bg-amarelo text-roxo" : f.livre ? "bg-fundo text-roxo" : "bg-linha/50 text-tinta-suave"
                  } ${erro ? "ring-2 ring-coral" : ""} ${ativa ? "outline-2 outline-offset-2 outline-roxo" : ""}`}
                >
                  {f.atual ? <ArteMascote sufixo="-rosto" className="size-6" /> : !f.livre ? <Arte nome="ui/cadeado" className="size-4 opacity-60" /> : <span>{f.i + 1}</span>}
                  {f.feita && <span className="text-[0.7rem] leading-none text-amarelo-escuro">{estrelinhas(f.estrelas)}</span>}
                  {erro && <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-coral text-xs text-branco">!</span>}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* detalhe da fase tocada */}
        <AnimatePresence mode="wait">
          {selecionada && (
            <motion.div
              key={selecionada.chave}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={MOLA_ENTRADA}
              className="flex flex-col gap-2 rounded-xl bg-fundo p-3"
            >
              <span className="flex items-center gap-2">
                <Arte nome={JOGOS[selecionada.t.fases[selecionada.i].jogo].icone} className="size-6" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-roxo">
                  {selecionada.t.fases[selecionada.i].titulo} · {JOGOS[selecionada.t.fases[selecionada.i].jogo].nome}
                </span>
                <span className="shrink-0 rounded-full bg-roxo-claro px-2 py-0.5 text-xs font-bold text-roxo">Nível {selecionada.nivel}</span>
              </span>
              <span className="grid grid-cols-4 gap-2 text-center">
                <Dado valor={selecionada.feita ? estrelinhas(selecionada.estrelas) : "—"} rotulo="Estrelas" cor="text-amarelo-escuro" />
                <Dado valor={selecionada.feita ? selecionada.pontos : "—"} rotulo="Melhor pts" />
                <Dado valor={selecionada.vezes || "—"} rotulo="Vezes" />
                <Dado valor={selecionada.vezes ? selecionada.erros : "—"} rotulo="Erros" cor={muitoErro(selecionada) ? "text-coral-escuro" : undefined} />
              </span>
              {selecionada.tempo > 0 && <span className="text-xs text-tinta-suave">Tempo total nesta fase: {duracao(selecionada.tempo)}</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </Cartao>
    </>
  );
}

function Dado({ valor, rotulo, cor = "text-roxo" }: { valor: React.ReactNode; rotulo: string; cor?: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className={`text-base leading-none font-extrabold ${cor}`}>{valor}</span>
      <span className="text-xs text-tinta-suave">{rotulo}</span>
    </span>
  );
}

