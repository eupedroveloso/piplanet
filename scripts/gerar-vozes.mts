/**
 * Gera ANTES as falas conhecidas do jogo (bichos, curiosidades, sílabas, frases, biomas, avisos),
 * para a criança nunca esperar a voz. Cada frase é gerada uma vez e fica no banco (VozCache);
 * as que já existem não custam nada.
 *
 * Uso: com o servidor rodando (npm run dev, porta 3100):
 *   npx tsx scripts/gerar-vozes.mts            → gera tudo
 *   npx tsx scripts/gerar-vozes.mts --contar   → só mostra quantas falas e caracteres
 */
import { ANIMAIS } from "../src/content/animais";
import { CURIOSIDADES } from "../src/content/curiosidades";
import { fraseDe } from "../src/content/frases";
import { JOGOS, TERRITORIOS } from "../src/content/jornada";
import { PAISES } from "../src/content/paises";
import { PERFIS } from "../src/content/perfis";

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
