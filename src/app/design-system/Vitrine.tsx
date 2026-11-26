"use client";

import { useState, type ReactNode } from "react";
import {
  Arte,
  Bolinhas,
  Botao,
  BotaoRedondo,
  BotaoSom,
  Casinha,
  Comemoracao,
  Contador,
  Estrelas,
  Mascote,
  Painel,
  Peca,
} from "@/components/ui";

const CORES: { grupo: string; itens: [string, string][] }[] = [
  {
    grupo: "Marca",
    itens: [
      ["roxo", "#5b2a9c"],
      ["roxo-escuro", "#43207a"],
      ["roxo-claro", "#efe8fb"],
      ["amarelo", "#ffc935"],
      ["amarelo-escuro", "#e3a400"],
      ["amarelo-claro", "#fff4d1"],
      ["coral", "#f25f5c"],
      ["verde", "#5dbb85"],
      ["azul", "#4fb0e3"],
    ],
  },
  {
    grupo: "Neutros",
    itens: [
      ["fundo", "#f6f2fd"],
      ["branco", "#ffffff"],
      ["tinta", "#3d3551"],
      ["tinta-suave", "#8a84a0"],
      ["linha", "#ebe6f3"],
      ["bloqueado", "#d9d4e3"],
    ],
  },
  {
    grupo: "Territórios (fundo)",
    itens: [
      ["fazenda", "#dff2dc"],
      ["floresta", "#cfe9d9"],
      ["savana", "#fcefc2"],
      ["oceano", "#d8eef9"],
    ],
  },
];

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b-4 border-amarelo pb-1 text-2xl font-extrabold text-roxo">{titulo}</h2>
      {children}
    </section>
  );
}

export function Vitrine() {
  return (
    <div className="flex flex-col gap-10">
      <Secao titulo="Cores">
        {CORES.map((g) => (
          <div key={g.grupo} className="flex flex-col gap-2">
            <h3 className="font-bold text-tinta-suave">{g.grupo}</h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {g.itens.map(([nome, hex]) => (
                <div key={nome} className="overflow-hidden rounded-md bg-branco shadow-suave">
                  <div className="h-16" style={{ background: hex }} />
                  <div className="p-2 text-sm">
                    <div className="font-bold">{nome}</div>
                    <div className="text-tinta-suave">{hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Secao>

      <Secao titulo="Tipografia">
        <Painel className="flex flex-col gap-3">
          <p className="text-4xl font-extrabold text-roxo">Baloo 2 · Título</p>
          <p className="text-xl font-semibold">Baloo 2 · Interface, botões e textos</p>
          <p className="font-leitura text-5xl font-bold uppercase">Andika · GA TO</p>
          <p className="text-tinta-suave">Andika é usada só para letras, sílabas e palavras que a criança lê.</p>
        </Painel>
      </Secao>

      <Secao titulo="Botões">
        <div className="flex flex-wrap items-center gap-4">
          <Botao cor="roxo">Roxo</Botao>
          <Botao cor="amarelo">Amarelo</Botao>
          <Botao cor="verde">Verde</Botao>
          <Botao cor="coral">Coral</Botao>
          <Botao cor="branco">Branco</Botao>
          <Botao cor="amarelo" tamanho="lg">
            Grande ▶
          </Botao>
        </div>
        <div className="flex gap-4">
          <BotaoRedondo aria-label="Voltar">
            <Arte nome="ui/voltar" className="size-7" />
          </BotaoRedondo>
          <BotaoSom />
        </div>
      </Secao>

      <Secao titulo="Placar e recompensas">
        <div className="flex flex-wrap items-center gap-3">
          <Contador icone="ui/estrela" valor={12} rotulo="estrelas" />
          <Contador icone="ui/patinhas" valor={340} rotulo="patinhas" />
          <Contador icone="ui/album" valor={18} total={53} rotulo="figurinhas" />
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <Estrelas valor={1} />
          <Estrelas valor={2} />
          <Estrelas valor={3} tamanho="lg" />
        </div>
        <Bolinhas total={5} feitas={2} />
        <DemoComemoracao />
      </Secao>

      <Secao titulo="Peças de sílaba">
        <div data-territorio="fazenda" className="flex flex-col gap-4 rounded-xl bg-t-fundo p-6">
          <div className="flex flex-wrap gap-3">
            <Casinha estado="cheia" texto="ga" />
            <Casinha estado="proxima" />
            <Casinha estado="vazia" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Peca texto="to" />
            <Peca texto="ca" estado="dica" />
            <Peca texto="lo" />
          </div>
        </div>
      </Secao>

      <Secao titulo="Mascote">
        <Mascote fala="Oi! Eu sou a Juju. Toque em mim para ouvir!" />
      </Secao>

      <Secao titulo="Temas de território">
        <div className="grid gap-3 sm:grid-cols-4">
          {(["fazenda", "floresta", "savana", "artico", "oceano"] as const).map((t) => (
            <div key={t} data-territorio={t} className="flex flex-col gap-2 rounded-lg bg-t-fundo p-4">
              <span className="font-extrabold text-t-destaque uppercase">{t}</span>
              <div className="h-3 rounded-full bg-t-trilha" />
              <div className="h-3 rounded-full bg-t-chao" />
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Ilustrações">
        <div className="flex flex-wrap gap-3">
          {["leao", "girafa", "polvo", "coruja", "vaca", "sapo"].map((a) => (
            <Arte key={a} nome={`animais/${a}`} className="size-16" />
          ))}
          <Arte nome="animais/leao" silhueta className="size-16" />
        </div>
        <p className="text-tinta-suave">
          Estilo flat, coleção Fluent Emoji (MIT). Silhueta = figurinha ainda não conquistada.
        </p>
      </Secao>
    </div>
  );
}

/** Toque para ver de novo a celebração de acerto. */
function DemoComemoracao() {
  const [vez, setVez] = useState(0);
  return (
    <div className="relative grid h-40 w-56 place-items-center">
      {vez > 0 && <Comemoracao key={vez} raio={90} />}
      <Botao cor="verde" onClick={() => setVez((v) => v + 1)}>
        Comemorar!
      </Botao>
    </div>
  );
}
