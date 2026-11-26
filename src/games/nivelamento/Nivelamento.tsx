"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ANIMAIS, arteDoAnimal, type Animal } from "@/content/animais";
import { fraseDe } from "@/content/frases";
import { registrarNivelamento, registrarSessao, useProgress } from "@/lib/progress";
import { shuffle } from "@/lib/random";
import { speak } from "@/lib/speech";
import { falaDaSilaba } from "@/content/letras";
import { Arte, Botao, BotaoLink, BotaoRedondo, BotaoRedondoLink, BotaoSom, Mascote, MOLA_ENTRADA, Painel, fonteQueCabe } from "@/components/ui";

/**
 * NIVELAMENTO (teste de leitura adaptativo)
 * Escada de 6 degraus: 1 sílabas · 2 palavras de 2 sílabas · 3 de 3 sílabas ·
 * 4 sílabas complexas · 5 frase curta · 6 frase com lugar.
 * Começa no degrau 2; acertou sobe, errou desce. 10 perguntas.
 * Para quem ainda não lê: toda instrução é falada; só o alvo da pergunta precisa ser lido.
 * Sem "certo/errado" durante o teste: a resposta só agradece e segue (sem ansiedade).
 */

const TOTAL = 10;
export const NIVEIS = [
  { n: 1, nome: "Sílabas", icone: "ui/letras", fala: "Você está aprendendo as sílabas!" },
  { n: 2, nome: "Palavras curtas", icone: "animais/gato", fala: "Você lê palavras curtas, como gato!" },
  { n: 3, nome: "Palavras maiores", icone: "animais/cavalo", fala: "Você lê palavras de três sílabas, como cavalo!" },
  { n: 4, nome: "Palavras difíceis", icone: "animais/zebra", fala: "Você lê palavras difíceis, como zebra!" },
  { n: 5, nome: "Frases curtas", icone: "ui/frase", fala: "Você já lê frases curtas!" },
  { n: 6, nome: "Frases inteiras", icone: "ui/trofeu", fala: "Você lê frases inteiras! Uau!" },
];

type Pergunta =
  | { tipo: "silaba"; nivel: number; alvo: string; opcoes: string[] }
  | { tipo: "figura"; nivel: number; texto: string; alvo: Animal; opcoes: Animal[] };

const silabasSimples = [...new Set(ANIMAIS.filter((a) => a.dificuldade === 1).flatMap((a) => a.silabas))];

function criarPergunta(nivel: number, usados: Set<string>): Pergunta {
  if (nivel === 1) {
    const [alvo, ...resto] = shuffle(silabasSimples);
    return { tipo: "silaba", nivel, alvo, opcoes: shuffle([alvo, ...resto.slice(0, 2)]) };
  }
  const dif = nivel === 2 ? 1 : nivel === 3 ? 2 : 3;
  const pool = ANIMAIS.filter((a) => (nivel >= 5 ? true : a.dificuldade === dif) && !usados.has(a.id));
  const alvo = shuffle(pool.length ? pool : ANIMAIS)[0];
  // nunca duas opções com o mesmo nome ou a mesma ilustração (ex.: boto e golfinho)
  const outros = shuffle(ANIMAIS.filter((a) => a.id !== alvo.id && a.nome !== alvo.nome && arteDoAnimal(a) !== arteDoAnimal(alvo))).slice(0, 2);
  const texto = nivel === 5 ? fraseDe(alvo, "curta").join(" ") : nivel === 6 ? fraseDe(alvo, "media").join(" ") : alvo.nome;
  return { tipo: "figura", nivel, texto, alvo, opcoes: shuffle([alvo, ...outros]) };
}

function instrucao(p: Pergunta) {
  if (p.tipo === "silaba") return `Toque na sílaba que eu falar: ${falaDaSilaba(p.alvo)}`;
  return p.nivel >= 5 ? "Leia a frase e toque no bicho certo." : "Leia a palavra e toque no bicho certo.";
}

export function Nivelamento() {
  const { nivelamentos } = useProgress();
  const [etapa, setEtapa] = useState<"inicio" | "teste" | "fim">("inicio");
  const [nivel, setNivel] = useState(2);
  const [n, setN] = useState(0);
  const [pergunta, setPergunta] = useState<Pergunta | null>(null);
  const [usados, setUsados] = useState<Set<string>>(new Set());
  const [acertos, setAcertos] = useState<Record<number, [number, number]>>({});
  const [resultado, setResultado] = useState(1);
  const [escolhido, setEscolhido] = useState<string | null>(null);

  const [inicio, setInicio] = useState(0);

  function comecar() {
    setInicio(Date.now());
    const p = criarPergunta(2, new Set());
    setNivel(2);
    setN(0);
    setAcertos({});
    setUsados(new Set());
    setPergunta(p);
    setEtapa("teste");
    speak("Vamos ver como está sua leitura! Não tem certo nem errado. " + instrucao(p));
  }

  function responder(certo: boolean, chave: string) {
    if (!pergunta || escolhido) return;
    setEscolhido(chave);
    const ac = { ...acertos };
    const [c, t] = ac[pergunta.nivel] ?? [0, 0];
    ac[pergunta.nivel] = [c + (certo ? 1 : 0), t + 1];
    setAcertos(ac);
    speak(["Obrigado!", "Muito bem!", "Vamos para a próxima!"][n % 3]);
    setTimeout(() => {
      setEscolhido(null);
      const prox = n + 1;
      if (prox >= TOTAL) {
        // Nível final: o mais alto em que acertou pelo menos 2 de 3 (e ao menos uma vez)
        let final = 1;
        for (let k = 1; k <= 6; k++) {
          const [cc, tt] = ac[k] ?? [0, 0];
          if (cc >= 1 && cc / tt >= 0.66) final = k;
        }
        setResultado(final);
        registrarNivelamento({ data: new Date().toISOString(), nivel: final, acertos: ac });
        const erros = Object.values(ac).reduce((s, [cc, tt]) => s + (tt - cc), 0);
        registrarSessao({ tipo: "nivelamento", inicio, fim: Date.now(), concluida: true, erros, estrelas: final });
        setEtapa("fim");
        speak(`Prontinho! ${NIVEIS[final - 1].fala}`);
        return;
      }
      const novoNivel = Math.max(1, Math.min(6, nivel + (certo ? 1 : -1)));
      const novosUsados = new Set(usados);
      if (pergunta.tipo === "figura") novosUsados.add(pergunta.alvo.id);
      const p = criarPergunta(novoNivel, novosUsados);
      setUsados(novosUsados);
      setNivel(novoNivel);
      setN(prox);
      setPergunta(p);
      speak(instrucao(p));
    }, 900);
  }

  const topo = (
    <div className="flex items-center gap-3">
      <BotaoRedondoLink href="/" aria-label="Voltar ao mapa">
        <Arte nome="ui/voltar" className="size-7" />
      </BotaoRedondoLink>
      <div className="flex flex-1 justify-center">
        {etapa === "teste" ? (
          <div className="flex gap-1.5" aria-label={`Pergunta ${n + 1} de ${TOTAL}`}>
            {Array.from({ length: TOTAL }, (_, i) => (
              <span key={i} className={`h-3 rounded-full transition-all ${i < n ? "w-3 bg-verde" : i === n ? "w-6 bg-amarelo" : "w-3 bg-branco"}`} />
            ))}
          </div>
        ) : (
          <span className="flex items-center gap-2 text-xl font-extrabold text-roxo uppercase">
            <Arte nome="ui/nivel" className="size-7" /> Meu nível
          </span>
        )}
      </div>
      <BotaoSom />
    </div>
  );

  if (etapa === "inicio") {
    const ultimo = nivelamentos[nivelamentos.length - 1];
    return (
      <div className="flex flex-1 flex-col gap-6">
        {topo}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 sm:gap-8">
          <Mascote fala="Vamos ver como está sua leitura? Não tem certo nem errado!" tamanho="lg" />
          {ultimo && <Escada nivel={ultimo.nivel} />}
          <Botao cor="amarelo" tamanho="lg" onClick={comecar} icone={<Arte nome="ui/nivel" className="size-8" />}>
            ▶
          </Botao>
          {nivelamentos.length > 0 && <Historico lista={nivelamentos} />}
        </div>
      </div>
    );
  }

  if (etapa === "fim") {
    return (
      <div className="flex flex-1 flex-col gap-6">
        {topo}
        <div className="flex flex-1 items-center justify-center">
          <Painel className="flex w-full max-w-xl flex-col items-center gap-5 p-8 text-center">
            <Arte nome="ui/festa" className="size-16" />
            <button type="button" onClick={() => speak(NIVEIS[resultado - 1].fala)} className="text-3xl font-extrabold text-roxo">
              {NIVEIS[resultado - 1].nome}
            </button>
            <Escada nivel={resultado} />
            <div className="flex gap-3">
              <BotaoLink href="/" cor="verde" tamanho="lg" aria-label="Voltar ao mapa" icone={<Arte nome="ui/mapa" className="size-8" />}>
                ▶
              </BotaoLink>
              <Botao cor="branco" tamanho="lg" onClick={comecar} aria-label="Fazer de novo" icone={<Arte nome="ui/nivel" className="size-8" />}>
                ↺
              </Botao>
            </div>
          </Painel>
        </div>
      </div>
    );
  }

  const p = pergunta!;
  return (
    <div className="flex flex-1 flex-col gap-6">
      {topo}
      <AnimatePresence mode="wait">
        <motion.div
          key={n}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={MOLA_ENTRADA}
          className="flex flex-1 flex-col items-center justify-center gap-6 sm:gap-8"
        >
          <div className="flex items-center gap-3">
            <BotaoRedondo aria-label="Ouvir a instrução de novo" fala={false} onClick={() => speak(instrucao(p))} className="size-14 shrink-0 ring-4 ring-amarelo sm:size-16">
              <Arte nome="ui/som-ligado" className="size-9" />
            </BotaoRedondo>
            {p.tipo === "figura" && (
              <div className="rounded-xl bg-branco px-4 py-3 shadow-[0_8px_0_var(--color-linha)] sm:px-6 sm:py-4">
                <span style={{ fontSize: fonteQueCabe(p.texto.replace(/[^a-zà-ú]/gi, "").length, 0, 150, 3.75) }} className="font-leitura font-bold text-roxo uppercase">
                  {p.texto}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {p.tipo === "silaba"
              ? p.opcoes.map((s) => (
                  <motion.button
                    key={s}
                    type="button"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.92 }}
                    animate={escolhido === s ? { scale: 1.1 } : { scale: 1 }}
                    onClick={() => responder(s === p.alvo, s)}
                    className={`grid h-20 min-w-20 place-items-center rounded-xl bg-branco px-3 font-leitura text-4xl font-bold text-roxo uppercase shadow-[0_8px_0_var(--color-linha)] sm:h-28 sm:min-w-28 sm:px-5 sm:text-6xl ${
                      escolhido === s ? "ring-4 ring-amarelo" : ""
                    }`}
                  >
                    {s}
                  </motion.button>
                ))
              : p.opcoes.map((a) => (
                  <motion.button
                    key={a.id}
                    type="button"
                    aria-label="Opção de bicho"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.92 }}
                    animate={escolhido === a.id ? { scale: 1.1 } : { scale: 1 }}
                    onClick={() => responder(a.id === p.alvo.id, a.id)}
                    className={`grid size-36 place-items-center rounded-xl bg-branco shadow-[0_8px_0_var(--color-linha)] sm:size-40 ${
                      escolhido === a.id ? "ring-4 ring-amarelo" : ""
                    }`}
                  >
                    <Arte src={arteDoAnimal(a)} className="size-28" />
                  </motion.button>
                ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Escada dos 6 níveis, com o degrau atual destacado. */
function Escada({ nivel }: { nivel: number }) {
  return (
    <div className="flex items-end gap-0.5 sm:gap-2" aria-label={`Nível ${nivel} de 6`}>
      {NIVEIS.map((nv, i) => {
        const feito = nv.n <= nivel;
        return (
          <motion.button
            key={nv.n}
            type="button"
            onClick={() => speak(nv.fala)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...MOLA_ENTRADA, delay: i * 0.06 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.92 }}
            style={{ height: 48 + i * 14 }}
            className={`flex w-12 flex-col sm:w-14 items-center justify-start rounded-t-lg pt-2 ${
              nv.n === nivel ? "bg-amarelo shadow-[0_5px_0_var(--color-amarelo-escuro)]" : feito ? "bg-verde-claro" : "bg-branco/60"
            }`}
          >
            <Arte nome={nv.icone} className={`size-7 sm:size-8 ${feito ? "" : "opacity-40 grayscale"}`} />
          </motion.button>
        );
      })}
    </div>
  );
}

/** Histórico para os responsáveis: últimos resultados em barrinhas. */
function Historico({ lista }: { lista: { data: string; nivel: number }[] }) {
  const ultimos = lista.slice(-8);
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-bold text-tinta-suave">Evolução</span>
      <div className="flex h-24 items-end gap-2 rounded-lg bg-branco/70 p-3">
        {ultimos.map((r, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-5 rounded-t bg-roxo" style={{ height: r.nivel * 11 }} />
            <span className="text-[10px] font-bold text-tinta-suave">
              {new Date(r.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
