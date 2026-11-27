"use client";

import { motion } from "motion/react";
import { arteDoAnimal } from "@/content/animais";
import { JOGOS } from "@/content/jornada";
import { ACERTOS_PARA_SUPERAR, diaDe, estudoDoDia, exerciciosDoDia, melhora, palavrasParaReforcar, recomendacoes } from "@/lib/estudo";
import type { Progress } from "@/lib/progress";
import { Arte, MOLA_ENTRADA } from "@/components/ui";
import { Cartao, KPI, Secoes, useTelaBaixa } from "./graficos";

/**
 * ESTUDO E REFORÇO no painel dos Pais (somente leitura, progresso da criança vindo do banco).
 * - O que fazer para errar menos (recomendações com o número que justifica).
 * - Melhora: palavras superadas (antes → agora), palavras em reforço (N de 2 leituras sem erro), dias de estudo.
 * - Hoje: a trilha do dia da criança (feito / pendente).
 * Números exatos, sem casas decimais.
 */

/** "O que fazer para errar menos": cada item com ícone, a ação em 1 frase e o porquê com número. */
export function Recomendacoes({ p, nome, agora, titulo = true }: { p: Progress; nome: string; agora: number; titulo?: boolean }) {
  const recs = recomendacoes(p, nome, agora || undefined);
  return (
    <Cartao
      titulo={titulo ? "O que fazer para errar menos" : undefined}
      ajuda={titulo ? "Ações sugeridas a partir dos erros, do jogo e da frequência de estudo da criança. A mais importante vem primeiro." : undefined}
    >
      {recs.length ? (
        <ol className="flex flex-col gap-3 [@media(max-height:820px)]:gap-2 [@media(max-height:820px)]:[&>li:nth-child(n+4)]:hidden [@media(max-height:700px)]:[&>li:nth-child(n+3)]:hidden">
          {recs.map((r, k) => (
            <motion.li
              key={r.acao}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...MOLA_ENTRADA, delay: k * 0.06 }}
              className={`flex items-start gap-3 rounded-xl p-2.5 [@media(max-height:700px)]:p-2 ${k === 0 ? "bg-amarelo-claro" : "bg-fundo"}`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-branco shadow-suave [@media(max-height:700px)]:size-9">
                <Arte nome={r.icone} className="size-7 [@media(max-height:700px)]:size-6" />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-sm leading-snug font-bold text-roxo">{r.acao}</span>
                <span className="text-xs leading-snug text-tinta-suave">{r.porque}</span>
              </span>
            </motion.li>
          ))}
        </ol>
      ) : (
        <p className="flex items-center gap-2 text-sm font-bold text-verde-escuro">
          <Arte nome="ui/estrela" className="size-6" /> Tudo em dia: nenhuma palavra com erro para reforçar.
        </p>
      )}
    </Cartao>
  );
}

const erros = (n: number) => `${n} ${n === 1 ? "erro" : "erros"}`;

/** Palavras superadas: arte + nome, "antes N erros → agora 0". */
function Superadas({ p, agora }: { p: Progress; agora: number }) {
  const sup = melhora(p, agora || undefined).superadas.slice(0, 6);
  return (
    <Cartao titulo="Palavras superadas" ajuda={`Errava a palavra e agora leu ${ACERTOS_PARA_SUPERAR} vezes seguidas sem errar. "Antes" é a leitura com mais erros.`}>
      {sup.length ? (
        <ul className="flex flex-col gap-2 [@media(max-height:700px)]:[&>li:nth-child(n+5)]:hidden">
          {sup.map((s, k) => (
            <motion.li
              key={s.animal.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...MOLA_ENTRADA, delay: k * 0.05 }}
              className="flex items-center gap-2.5"
            >
              <Arte src={arteDoAnimal(s.animal)} className="size-8 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-roxo">{s.animal.nome}</span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold">
                <span className="rounded-full bg-coral/15 px-2 py-0.5 text-coral-escuro">antes {erros(s.piorAntes)}</span>
                <span aria-hidden className="text-tinta-suave">→</span>
                <span className="rounded-full bg-verde/15 px-2 py-0.5 text-verde-escuro">agora 0</span>
              </span>
            </motion.li>
          ))}
        </ul>
      ) : (
        <span className="text-2xl font-extrabold text-roxo">—</span>
      )}
    </Cartao>
  );
}

/** Palavras em reforço com o progresso "N de 2 leituras sem erro". */
function EmReforco({ p, agora }: { p: Progress; agora: number }) {
  const em = melhora(p, agora || undefined).emReforco.slice(0, 6);
  return (
    <Cartao titulo="Em reforço" ajuda={`Palavras com erro que a criança está revisando no Reforçar. Saem da lista com ${ACERTOS_PARA_SUPERAR} leituras seguidas sem erro.`}>
      {em.length ? (
        <ul className="flex flex-col gap-2.5 [@media(max-height:700px)]:gap-2 [@media(max-height:700px)]:[&>li:nth-child(n+6)]:hidden">
          {em.map((s, k) => (
            <motion.li
              key={s.animal.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...MOLA_ENTRADA, delay: k * 0.05 }}
              className="flex items-center gap-2.5"
            >
              <Arte src={arteDoAnimal(s.animal)} className="size-8 shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-bold text-roxo">{s.animal.nome}</span>
                  <span className="shrink-0 text-xs text-tinta-suave">
                    <b className="text-roxo">{s.seguidasSemErro}</b> de {ACERTOS_PARA_SUPERAR} leituras sem erro
                  </span>
                </span>
                <span className="flex gap-1">
                  {Array.from({ length: ACERTOS_PARA_SUPERAR }, (_, i) => (
                    <motion.span
                      key={i}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ ...MOLA_ENTRADA, delay: k * 0.05 + i * 0.08 }}
                      className={`h-2 flex-1 origin-left rounded-full ${i < s.seguidasSemErro ? "bg-verde" : "bg-linha"}`}
                    />
                  ))}
                </span>
              </span>
            </motion.li>
          ))}
        </ul>
      ) : (
        <span className="text-2xl font-extrabold text-roxo">—</span>
      )}
    </Cartao>
  );
}

/** A trilha do dia da criança, só leitura: exercícios e reforço (feito / pendente). */
function TrilhaDoDia({ p, agora }: { p: Progress; agora: number }) {
  const dia = diaDe(agora || undefined);
  const feito = estudoDoDia(p, dia);
  const jogo = exerciciosDoDia(p, dia).fase.jogo;
  const reforcar = palavrasParaReforcar(p);
  const paradas = [
    { id: "ex", icone: JOGOS[jogo].icone, rotulo: `Exercícios do dia (${JOGOS[jogo].nome})`, feita: feito.exercicios },
    {
      id: "rf",
      icone: "ui/coracao",
      rotulo: reforcar.length ? `Reforçar ${reforcar.length} ${reforcar.length === 1 ? "palavra" : "palavras"}` : "Reforçar (nada pendente)",
      feita: feito.reforco || (feito.exercicios && reforcar.length === 0),
    },
    { id: "cq", icone: "ui/trofeu", rotulo: "Conquista do dia", feita: feito.completo || (feito.exercicios && reforcar.length === 0) },
  ];
  return (
    <Cartao titulo="Estudo de hoje" ajuda="A trilha que a criança vê na aba Estudo: primeiro os exercícios do dia, depois o reforço das palavras com erro.">
      <ol className="flex flex-col gap-2">
        {paradas.map((x, k) => (
          <motion.li
            key={x.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...MOLA_ENTRADA, delay: k * 0.06 }}
            className="flex items-center gap-3"
          >
            <span className={`relative grid size-10 shrink-0 place-items-center rounded-full ${x.feita ? "bg-verde" : "bg-linha/70"}`}>
              <Arte nome={x.icone} className={`size-6 ${x.feita ? "" : "opacity-60 grayscale"}`} />
              {x.feita && <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-branco text-xs font-extrabold text-verde-escuro shadow-suave">✓</span>}
            </span>
            <span className="min-w-0 flex-1 text-sm font-bold text-roxo">{x.rotulo}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${x.feita ? "bg-verde/15 text-verde-escuro" : "bg-linha/70 text-tinta-suave"}`}>
              {x.feita ? "feito" : "pendente"}
            </span>
          </motion.li>
        ))}
      </ol>
    </Cartao>
  );
}

/** Aba "Estudo" do painel: o que fazer, melhora e o estudo de hoje. */
export function EstudoAba({ p, nome, agora }: { p: Progress; nome: string; agora: number }) {
  const m = melhora(p, agora || undefined);
  // em telas baixas, "hoje" e "em reforço" viram páginas separadas (não cabem juntos sem espremer)
  const baixa = useTelaBaixa();
  return (
    <Secoes
      secoes={[
        { titulo: "O que fazer", conteudo: <Recomendacoes p={p} nome={nome} agora={agora} /> },
        {
          titulo: "Melhora",
          conteudo: (
            <>
              <div className="grid grid-cols-2 gap-3">
                <KPI
                  icone="ui/sol"
                  rotulo="Dias de estudo completo (7 dias)"
                  valor={m.diasDeEstudo7}
                  unidade="de 7"
                  ajuda="Dias em que a criança fez os exercícios do dia e o reforço."
                />
                <KPI icone="ui/estrela" rotulo="Dias seguidos de estudo" valor={m.diasSeguidos} unidade={m.diasSeguidos === 1 ? "dia" : "dias"} />
              </div>
              <Superadas p={p} agora={agora} />
            </>
          ),
        },
        ...(baixa
          ? [
              { titulo: "Estudo de hoje", conteudo: <TrilhaDoDia p={p} agora={agora} /> },
              { titulo: "Em reforço", conteudo: <EmReforco p={p} agora={agora} /> },
            ]
          : [
              {
                titulo: "Reforço e hoje",
                conteudo: (
                  <>
                    <TrilhaDoDia p={p} agora={agora} />
                    <EmReforco p={p} agora={agora} />
                  </>
                ),
              },
            ]),
      ]}
    />
  );
}
