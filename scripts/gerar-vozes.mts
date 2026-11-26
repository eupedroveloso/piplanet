/**
 * Gera ANTES as falas conhecidas do jogo (bichos, curiosidades, sílabas, frases, biomas, avisos),
 * para a criança nunca esperar a voz. Cada frase é gerada uma vez e fica no banco (VozCache);
 * as que já existem não custam nada.
 *
 * As falas fixas são EXTRAÍDAS DO CÓDIGO automaticamente (speak("..."), fala="...", aria-label="...",
 * <Mascote fala="...">); as que dependem do conteúdo (bichos, sílabas, contagens) são montadas aqui.
 * Ao criar uma fala com texto montado na hora (template), acrescente as variações aqui embaixo.
 *
 * Uso: com o servidor rodando (npm run dev, porta 3100):
 *   npx tsx scripts/gerar-vozes.mts            → gera tudo e atualiza docs/FALAS.md
 *   npx tsx scripts/gerar-vozes.mts --contar   → só conta falas e caracteres
 *   npx tsx scripts/gerar-vozes.mts --mapa     → só atualiza o mapa de falas (docs/FALAS.md)
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ANIMAIS } from "../src/content/animais";
import { CURIOSIDADES } from "../src/content/curiosidades";
import { fraseDe } from "../src/content/frases";
import { JOGOS, TERRITORIOS } from "../src/content/jornada";
import { PAISES } from "../src/content/paises";
import { PERFIS } from "../src/content/perfis";
import { NIVEIS_JORNADA } from "../src/content/niveis";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const falas = new Set<string>();
const add = (t: string | undefined) => t && falas.add(t.replace(/\s+/g, " ").trim().toLowerCase());

const NIVEIS_FALA = [
  "Você está aprendendo as sílabas!",
  "Você lê palavras curtas, como gato!",
  "Você lê palavras de três sílabas, como cavalo!",
  "Você lê palavras difíceis, como zebra!",
  "Você já lê frases curtas!",
  "Você lê frases inteiras! Uau!",
];

for (const a of ANIMAIS) {
  add(a.nome);
  add(`Esse é ${a.nome}.`);
  add(a.curiosidade);
  for (const c of CURIOSIDADES[a.id] ?? []) add(c);
  for (const s of a.silabas) add(s);
  add(a.silabas.join(" ") + ". " + a.nome);
  add(fraseDe(a, "curta").join(" "));
  add(fraseDe(a, "media").join(" "));
}
for (const j of Object.values(JOGOS)) {
  add(j.nome);
  add(j.instrucao);
}
for (const t of TERRITORIOS) {
  add(t.nome);
  add(`${t.nome}. Ainda trancado. Termine as fases de antes para abrir.`);
}
for (const p of PAISES) {
  add(p.nome);
  add(`${p.nome}. Ainda trancado. Termine o país anterior para viajar até aqui.`);
  for (const b of p.biomas) add(b.boasVindas);
}
for (const p of PERFIS) {
  add(`Oi, ${p.nome}!`);
  add(`${p.nome}. Digite a senha.`);
  add(`Oi, ${p.nome}! Toque nos bichos do mapa para jogar.`);
}
for (const nv of NIVEIS_JORNADA) {
  add(nv.fala);
  add(`Você subiu de nível! ${nv.fala}`);
  add(nv.nome);
}
add("Você subiu de nível!");
for (const n of [1, 2, 3]) add(`Parabéns! Você ganhou ${n} ${n === 1 ? "estrela" : "estrelas"}!`);
for (const f of NIVEIS_FALA) {
  add(f);
  add(`Prontinho! ${f}`);
}
[
  "Essa fase ainda está trancada.", "Essa figurinha ainda vai chegar. Continue jogando!", "Oba! Agora eu falo com você.",
  "Ops! Toque de novo no seu bicho.", "Ops! Toque no botão para tentar de novo.", "Que bicho é esse?",
  "Quem vai jogar? Toque no seu bicho.", "Senha errada. Tente de novo.", "Vamos continuar!", "Vamos tentar de novo!",
  "Obrigado!", "Muito bem!", "Vamos para a próxima!", "Vamos treinar de novo!",
  "Tente ler a palavra. Depois toque na carta para virar!", "Você já revisou todas as cartas de hoje! Volte amanhã.",
  "Vamos treinar com as cartas dos bichos?", "Voltar", "Voltar ao mapa", "Ver o planeta", "Onde estou", "Continuar daqui",
  "Ouvir a palavra", "Ouvir o nome", "Ouvir a frase", "Ouvir outra curiosidade", "Fechar", "Trocar de perfil",
  "Desligar voz", "Ligar voz", "Começar", "Li sozinho", "Treinar de novo", "Jornada", "Cartas", "Álbum", "Nível",
  "Apagar", "Entrar", "Tentar de novo",
].forEach(add);

// ── Falas fixas extraídas do código ─────────────────────────────────────────
function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === "generated" || n === "design-system" || n === "painel" ? [] : arquivos(p);
    return /\.(tsx|ts)$/.test(n) ? [p] : [];
  });
}
/** Pega o argumento de speak( ... ) / fala={ ... } até fechar o parêntese/chave. */
function argumento(src: string, ini: number, abre: string, fecha: string) {
  let d = 0;
  for (let i = ini; i < src.length; i++) {
    if (src[i] === abre) d++;
    else if (src[i] === fecha && --d === 0) return src.slice(ini, i + 1);
  }
  return "";
}
const literais = (trecho: string) =>
  [...trecho.matchAll(/"([^"\n]{2,300})"|`([^`$\n]{2,300})`/g)].map((m) => m[1] ?? m[2]).filter((t) => /[a-zà-ú]/i.test(t) && !/^(use client|ui\/|animais\/|mascote\/|button|radio)/.test(t));
const pontos: { arquivo: string; linha: number; tipo: string; textos: string[] }[] = [];
for (const f of arquivos("src")) {
  const src = readFileSync(f, "utf8");
  const linhaDe = (i: number) => src.slice(0, i).split("\n").length;
  for (const m of src.matchAll(/\bspeak\(/g)) {
    const arg = argumento(src, m.index! + 5, "(", ")");
    const ts = literais(arg);
    ts.forEach(add);
    pontos.push({ arquivo: f, linha: linhaDe(m.index!), tipo: "speak", textos: ts.length ? ts : [arg.slice(1, 70).replace(/\s+/g, " ") + " (montado na hora)"] });
  }
  for (const m of src.matchAll(/\bfala=(\{|")/g)) {
    const arg = m[1] === '"' ? src.slice(m.index! + 5, src.indexOf('"', m.index! + 6) + 1) : argumento(src, m.index! + 5, "{", "}");
    const ts = literais(arg);
    ts.forEach(add);
    if (ts.length) pontos.push({ arquivo: f, linha: linhaDe(m.index!), tipo: "fala", textos: ts });
  }
  for (const m of src.matchAll(/aria-label="([^"]{2,80})"/g)) {
    add(m[1]);
    pontos.push({ arquivo: f, linha: linhaDe(m.index!), tipo: "aria-label (botão fala o rótulo)", textos: [m[1]] });
  }
}

// ── Falas montadas na hora (templates com números/nomes) ────────────────────
const silabasSimples = [...new Set(ANIMAIS.filter((a) => a.dificuldade === 1).flatMap((a) => a.silabas))];
for (const s of silabasSimples) add(`Toque na sílaba que eu falar: ${s}`);
for (const i of ["Leia a palavra e toque no bicho certo.", "Leia a frase e toque no bicho certo."]) {
  add(i);
  add("Vamos ver como está sua leitura! Não tem certo nem errado. " + i);
}
for (let n = 0; n <= ANIMAIS.length; n++) add(`Você tem ${n} de ${ANIMAIS.length} figurinhas.`);
for (let n = 0; n <= 60; n++) add(`Você tem ${n} estrelas.`);
for (let n = 0; n <= 8; n++) add(`Você leu ${n} cartas sozinho!`);
for (const t of TERRITORIOS) {
  const total = ANIMAIS.filter((a) => a.territorio === t.id).length;
  for (let n = 0; n <= total; n++) add(`${t.nome}. Você tem ${n} de ${total} figurinhas.`);
  add(`${t.nome}. Ainda trancado.`);
}
for (const nv of NIVEIS_JORNADA) add(`${nv.fala} Ainda trancado.`);

// ── Mapa de falas (docs/FALAS.md) ───────────────────────────────────────────
function atualizarMapa() {
  const p = "docs/FALAS.md";
  const doc = readFileSync(p, "utf8");
  const ini = "<!-- MAPA:INICIO -->";
  const fim = "<!-- MAPA:FIM -->";
  const linhas = pontos
    .sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha)
    .map((x) => `| \`${x.arquivo}:${x.linha}\` | ${x.tipo} | ${x.textos.map((t) => t.replace(/\|/g, "/")).join(" · ").slice(0, 160)} |`);
  const tabela = [ini, `_Gerado por \`scripts/gerar-vozes.mts\` em ${new Date().toLocaleString("pt-BR")}. ${pontos.length} pontos de fala, ${falas.size} falas únicas._`, "", "| Onde | Tipo | O que fala |", "|---|---|---|", ...linhas, fim].join("\n");
  writeFileSync(p, doc.includes(ini) ? doc.slice(0, doc.indexOf(ini)) + tabela + doc.slice(doc.indexOf(fim) + fim.length) : doc + "\n" + tabela + "\n");
  console.log(`docs/FALAS.md atualizado (${pontos.length} pontos).`);
}
atualizarMapa();
if (process.argv.includes("--mapa")) process.exit(0);

const lista = [...falas];
const chars = lista.reduce((s, t) => s + t.length, 0);
console.log(`${lista.length} falas, ${chars} caracteres`);
if (process.argv.includes("--contar")) process.exit(0);

// sessão do Pietro para chamar a API
const r = await fetch(`${BASE}/api/entrar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil: "pietro" }) });
const cookie = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

let feitas = 0, falhas = 0;
const falhou: string[] = [];
async function trabalhador() {
  for (;;) {
    const t = lista.shift();
    if (!t) return;
    const res = await fetch(`${BASE}/api/voz?t=${encodeURIComponent(t)}`, { headers: { cookie } }).catch(() => null);
    if (res?.ok) await res.arrayBuffer();
    else { falhas++; falhou.push(t); }
    feitas++;
    if (feitas % 25 === 0) console.log(`${feitas} feitas (${falhas} falhas)`);
  }
}
await Promise.all(Array.from({ length: 6 }, trabalhador));
console.log(`Pronto: ${feitas} falas, ${falhas} falhas.`);
if (falhou.length) console.log("Falharam (vão usar a voz do navegador até gerar):", falhou.slice(0, 40));
