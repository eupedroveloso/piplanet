"use client";

import { useState } from "react";
import { ANIMAIS, type Animal } from "@/content/animais";
import type { Territorio } from "@/content/jornada";
import { shuffle } from "@/lib/random";
import { speak } from "@/lib/speech";
import { falaDaLetra, falaDaSilaba } from "@/content/letras";
import { fraseDe, PALAVRAS_EXTRAS } from "@/content/frases";
import { Arte, BotaoRedondo, Casinha, Peca } from "@/components/ui";
import { CirculoBicho, JogoFase, type RodadaProps } from "../comum/JogoFase";

/**
 * MONTA O BICHO (modo "silabas") e MONTA A SÍLABA (modo "letras").
 *
 * - silabas: as peças são sílabas; ele monta a palavra (GA + TO = GATO).
 * - letras: ele forma cada sílaba com letras (G + A = GA), uma sílaba por vez,
 *   e a palavra vai se completando. É o passo da letra para a sílaba (método fônico).
 *
 * - frase: as peças são PALAVRAS; ele ouve a frase e coloca as palavras na ordem
 *   (O · GATO · MIA). Para quem ainda não lê, a frase pode ser ouvida quantas vezes quiser.
 *
 * Toda peça tocada é lida. Erro só balança a peça. Após 2 erros na mesma casa, a peça certa pula.
 */

const ERROS_ATE_DICA = 2;
const LETRAS_EXTRAS = "abcdefgijlmnoprstuvz";

type Modo = "silabas" | "letras" | "frase";
type Tile = { id: string; text: string; used: boolean };

export function MontaOBicho({ territorio, faseIdx, modo }: { territorio: Territorio; faseIdx: number; modo: Modo }) {
  return <JogoFase territorio={territorio} faseIdx={faseIdx} rodada={(p) => <RodadaMontar {...p} modo={modo} />} />;
}

function pecasDeSilabas(animal: Animal, distratores: number): Tile[] {
  const proprias = new Set(animal.silabas);
  const pool = ANIMAIS.filter((a) => a.dificuldade === animal.dificuldade).flatMap((a) => a.silabas);
  const extras = shuffle([...new Set(pool)].filter((s) => !proprias.has(s))).slice(0, distratores);
  return shuffle([...animal.silabas, ...extras]).map((text, i) => ({ id: `s${i}-${text}`, text, used: false }));
}

function pecasDeLetras(silaba: string, distratores: number, n: number): Tile[] {
  const letras = [...silaba];
  const extras = shuffle([...LETRAS_EXTRAS].filter((l) => !letras.includes(l))).slice(0, distratores);
  return shuffle([...letras, ...extras]).map((text, i) => ({ id: `l${n}-${i}-${text}`, text, used: false }));
}

function pecasDePalavras(palavras: string[], distratores: number): Tile[] {
  const extras = shuffle(PALAVRAS_EXTRAS.filter((p) => !palavras.includes(p))).slice(0, distratores);
  return shuffle([...palavras, ...extras]).map((text, i) => ({ id: `w${i}-${text}`, text, used: false }));
}

function RodadaMontar({ animal, fase, acertou, errar, acertar, modo }: RodadaProps & { modo: Modo }) {
  // Unidades a encaixar, em ordem, e a que grupo (sílaba ou palavra) cada uma pertence
  const palavras = modo === "frase" ? fraseDe(animal, fase.frase ?? "curta") : [];
  const grupos = modo === "frase" ? palavras : animal.silabas;
  const unidades = modo === "silabas" ? animal.silabas : modo === "frase" ? palavras : animal.silabas.flatMap((s) => [...s]);
  const grupoDe =
    modo === "letras" ? animal.silabas.flatMap((s, i) => [...s].map(() => i)) : unidades.map((_, i) => i);

  const [pecas, setPecas] = useState<Tile[]>(() =>
    modo === "silabas"
      ? pecasDeSilabas(animal, fase.distratores)
      : modo === "frase"
        ? pecasDePalavras(palavras, fase.distratores)
        : pecasDeLetras(animal.silabas[0], fase.distratores, 0),
  );
  const [trancado, setTrancado] = useState(false);
  const [ouviuFrase, setOuviuFrase] = useState(false);
  const ouvirFrase = () => {
    setOuviuFrase(true);
    speak(palavras.join(" "));
  };
  const [feitas, setFeitas] = useState(0);
  const [errosCasa, setErrosCasa] = useState(0);
  const [balancando, setBalancando] = useState<string | null>(null);
  /** Qual peça entrou em cada casinha (só para a animação de encaixe). */
  const [encaixes, setEncaixes] = useState<string[]>([]);
  const idVoo = (tileId: string) => `peca-${animal.id}-${tileId}`;

  function tocar(tile: Tile) {
    // durante a pausa entre sílabas ou antes do acerto, toques não contam (nem como erro)
    if (acertou || tile.used || trancado) return;
    if (tile.text !== unidades[feitas]) {
      setErrosCasa((e) => e + 1);
      errar();
      setBalancando(tile.id);
      setTimeout(() => setBalancando(null), 450);
      speak(modo === "letras" ? falaDaLetra(tile.text) : modo === "silabas" ? falaDaSilaba(tile.text) : tile.text);
      return;
    }

    const total = feitas + 1;
    setPecas((ps) => ps.map((p) => (p.id === tile.id ? { ...p, used: true } : p)));
    setFeitas(total);
    setEncaixes((e) => [...e, tile.id]);
    setErrosCasa(0);

    // A fala entra na fila e toca inteira; o JOGO NÃO ESPERA a voz (as peças aparecem no tempo certo,
    // mesmo se o áudio demorar). Pequenas pausas só para a criança ver a peça encaixar.
    speak(modo === "letras" ? falaDaLetra(tile.text) : modo === "silabas" ? falaDaSilaba(tile.text) : tile.text);

    if (modo === "letras") {
      const g = grupoDe[feitas];
      const fimDaSilaba = total === unidades.length || grupoDe[total] !== g;
      if (fimDaSilaba) {
        speak(falaDaSilaba(animal.silabas[g]));
        if (total < unidades.length) {
          const proxima = g + 1;
          setTrancado(true);
          setTimeout(() => {
            setPecas(pecasDeLetras(animal.silabas[proxima], fase.distratores, proxima));
            setTrancado(false);
          }, 700);
        }
      }
    }
    if (total === unidades.length) {
      if (modo === "frase") speak(palavras.join(" "));
      setTrancado(true);
      setTimeout(acertar, 600);
    }
  }

  const dica = errosCasa >= ERROS_ATE_DICA ? pecas.find((p) => !p.used && p.text === unidades[feitas])?.id : undefined;
  // Palavras longas (RI·NO·CE·RON·TE) usam o bloco menor para caber numa linha no celular
  const pequeno = modo !== "silabas" || unidades.length >= 4;
  const bloco = modo === "silabas" && unidades.length >= 5 ? "xs" : pequeno ? "sm" : "md";

  return (
    <>
      <div className="flex items-center gap-3 sm:gap-4">
        <CirculoBicho animal={animal} acertou={acertou} />
        {modo === "frase" && (
          // Ouvir a frase inteira (apoio para quem ainda não lê); pulsa até ser tocado
          <BotaoRedondo
            aria-label="Ouvir a frase"
            fala={false}
            onClick={ouvirFrase}
            className={`size-14 sm:size-16 ${ouviuFrase ? "" : "animate-pulsar ring-4 ring-amarelo"}`}
          >
            <Arte nome="ui/som-ligado" className="size-9" />
          </BotaoRedondo>
        )}
      </div>

      {/* Casinhas, agrupadas por sílaba */}
      <div className={`flex flex-wrap justify-center ${modo === "silabas" ? "gap-1.5 sm:gap-5" : "gap-2 sm:gap-5"}`}>
        {grupos.map((_, g) => {
          const membros = unidades.map((u, i) => ({ u, i })).filter(({ i }) => grupoDe[i] === g);
          const pronta = membros.every(({ i }) => i < feitas);
          const atual = !pronta && membros.some(({ i }) => i === feitas);
          return (
            <div
              key={g}
              className={`flex gap-1 rounded-lg transition-colors duration-300 sm:gap-1.5 ${modo === "silabas" ? "" : "p-1 sm:p-1.5"} ${
                modo !== "silabas" && pronta ? "bg-verde-claro" : ""
              } ${modo !== "silabas" && atual ? "bg-branco/60" : ""}`}
            >
              {membros.map(({ u, i }) => (
                <Casinha
                  key={i}
                  texto={u}
                  tamanho={bloco}
                  layoutId={encaixes[i] ? idVoo(encaixes[i]) : undefined}
                  estado={i < feitas ? "cheia" : i === feitas && !acertou ? "proxima" : "vazia"}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Peças */}
      {!acertou && (
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4">
          {pecas.map((p, n) => (
            <Peca
              key={p.id}
              indice={n}
              layoutId={idVoo(p.id)}
              texto={p.text}
              usada={p.used}
              tamanho={bloco}
              onToque={() => tocar(p)}
              estado={balancando === p.id ? "balancar" : dica === p.id ? "dica" : "normal"}
            />
          ))}
        </div>
      )}
    </>
  );
}
