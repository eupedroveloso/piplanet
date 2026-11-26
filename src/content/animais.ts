/**
 * Base central de animais. Todos os jogos leem daqui.
 *
 * - `silabas`: separação silábica oficial, em minúsculas (a voz lê melhor assim).
 * - `dificuldade`: progressão do método fônico (ver docs/METODOLOGIA.md).
 *     1 = 2 sílabas simples (consoante + vogal): ga-to
 *     2 = 3 sílabas simples: ca-va-lo
 *     3 = sílabas complexas (encontros, nasais, dígrafos, R/L no meio): ze-bra, o-ve-lha
 * - `territorio`: id do bioma onde o bicho vive de verdade (ver content/paises.ts).
 * - `arte`: arquivo em public/arte/animais/ (padrão: id.svg).
 * - `curiosidade`: frase curta e VERDADEIRA, lida em voz alta depois do acerto.
 */

export type Grupo = "mamífero" | "ave" | "réptil" | "anfíbio" | "peixe" | "inseto" | "aracnídeo" | "molusco" | "crustáceo" | "cnidário";
export type Dificuldade = 1 | 2 | 3;
/** Id do bioma (território) onde o bicho aparece, ex.: "br-amazonia". Ver content/paises.ts. */
export type TerritorioId = string;

export interface Animal {
  id: string;
  nome: string;
  silabas: string[];
  grupo: Grupo;
  dificuldade: Dificuldade;
  territorio: TerritorioId;
  curiosidade: string;
  arte?: string;
}

type A = Animal;
const a = (
  id: string,
  silabas: string,
  dificuldade: Dificuldade,
  territorio: TerritorioId,
  grupo: Grupo,
  curiosidade: string,
  extra: Partial<A> = {},
): A => ({
  id,
  nome: silabas.replaceAll("-", ""),
  silabas: silabas.split("-"),
  dificuldade,
  territorio,
  grupo,
  curiosidade,
  ...extra,
});

export const ANIMAIS: Animal[] = [
  // ── Brasil · Fazenda ──────────────────────────────────────────────────
  a("gato", "ga-to", 1, "br-fazenda", "mamífero", "O gato pode dormir até 16 horas por dia."),
  a("pato", "pa-to", 1, "br-fazenda", "ave", "As penas do pato são impermeáveis: a água escorre e ele não fica encharcado."),
  a("vaca", "va-ca", 1, "br-fazenda", "mamífero", "O estômago da vaca é dividido em quatro partes."),
  a("galo", "ga-lo", 1, "br-fazenda", "ave", "O galo costuma cantar de manhã cedo, mas pode cantar em qualquer hora do dia."),
  a("bode", "bo-de", 1, "br-fazenda", "mamífero", "O bode tem pupilas retangulares, que ajudam a enxergar quase tudo ao redor."),
  a("rato", "ra-to", 1, "br-fazenda", "mamífero", "Os dentes da frente do rato nunca param de crescer."),
  a("cavalo", "ca-va-lo", 2, "br-fazenda", "mamífero", "O cavalo consegue dormir em pé."),
  a("porco", "por-co", 3, "br-fazenda", "mamífero", "O porco é muito inteligente e consegue aprender truques."),
  a("ovelha", "o-ve-lha", 3, "br-fazenda", "mamífero", "A lã da ovelha não para de crescer e precisa ser cortada."),
  a("coelho", "co-e-lho", 3, "br-fazenda", "mamífero", "O coelho consegue virar as orelhas para ouvir sons de lugares diferentes."),
  a("burro", "bur-ro", 3, "br-fazenda", "mamífero", "As orelhas grandes do burro ajudam a ouvir sons bem de longe."),
  a("abelha", "a-be-lha", 3, "br-fazenda", "inseto", "A abelha faz uma dança para mostrar às outras onde estão as flores."),

  // ── Brasil · Florestas (Amazônia e Mata Atlântica) ────────────────────
  a("sapo", "sa-po", 1, "br-amazonia", "anfíbio", "Muitos sapos usam os olhos para ajudar a engolir: eles empurram os olhos para dentro da boca."),
  a("mico", "mi-co", 1, "br-amazonia", "mamífero", "O mico-leão-dourado só existe na Mata Atlântica, aqui no Brasil."),
  a("boto", "bo-to", 1, "br-amazonia", "mamífero", "O boto-cor-de-rosa vive nos rios da Amazônia."),
  a("macaco", "ma-ca-co", 2, "br-amazonia", "mamífero", "O macaco-prego usa pedras para quebrar cocos."),
  a("coruja", "co-ru-ja", 2, "br-amazonia", "ave", "A coruja consegue virar a cabeça até cerca de 270 graus."),
  a("jabuti", "ja-bu-ti", 2, "br-amazonia", "réptil", "O jabuti vive em terra firme. Quem vive no mar é a tartaruga."),
  a("jacare", "ja-ca-ré", 2, "br-amazonia", "réptil", "O jacaré troca os dentes muitas vezes durante a vida.", { nome: "jacaré" }),
  a("arara", "a-ra-ra", 2, "br-amazonia", "ave", "A arara usa o bico forte para quebrar sementes bem duras."),
  a("cobra", "co-bra", 3, "br-amazonia", "réptil", "As cobras sentem cheiros com a língua."),
  a("formiga", "for-mi-ga", 3, "br-amazonia", "inseto", "A formiga consegue carregar muitas vezes o próprio peso."),
  a("preguica", "pre-gui-ça", 3, "br-amazonia", "mamífero", "A preguiça desce da árvore mais ou menos uma vez por semana, só para fazer cocô.", { nome: "preguiça" }),
  a("borboleta", "bor-bo-le-ta", 3, "br-amazonia", "inseto", "A borboleta sente o gosto das coisas com os pés."),

  // ── Oceano · Recife de Corais (no mar) ────────────────────────────────
  a("lula", "lu-la", 1, "oc-recife", "molusco", "A lula-colossal tem os maiores olhos de todos os animais."),
  a("siri", "si-ri", 1, "oc-recife", "crustáceo", "O siri tem as patas de trás achatadas, como remos, para nadar."),
  a("medusa", "me-du-sa", 2, "oc-recife", "cnidário", "A medusa não tem cérebro nem coração."),
  a("polvo", "pol-vo", 3, "oc-recife", "molusco", "O polvo tem três corações."),
  a("tubarao", "tu-ba-rão", 3, "oc-mar", "peixe", "O tubarão troca de dentes a vida inteira.", { nome: "tubarão" }),
  a("baleia", "ba-lei-a", 3, "oc-mar", "mamífero", "A baleia-azul é o maior animal que já existiu na Terra."),
  a("camarao", "ca-ma-rão", 3, "oc-recife", "crustáceo", "O coração do camarão fica na cabeça.", { nome: "camarão" }),
  a("lagosta", "la-gos-ta", 3, "oc-recife", "crustáceo", "A lagosta troca de casca para conseguir crescer."),
  a("peixe", "pei-xe", 3, "oc-recife", "peixe", "Os peixes respiram pelas brânquias, que tiram o oxigênio da água."),
  a("tartaruga", "tar-ta-ru-ga", 3, "oc-recife", "réptil", "A tartaruga-marinha volta à praia onde nasceu para botar os ovos."),

  // ── Estados Unidos ────────────────────────────────────────────────────
  a("lobo", "lo-bo", 1, "us-florestas", "mamífero", "Os lobos vivem em grupos chamados alcateias."),
  a("urso-pardo", "ur-so", 3, "us-florestas", "mamífero", "O urso-pardo dorme durante quase todo o inverno.", { nome: "urso" }),
  a("castor", "cas-tor", 3, "us-florestas", "mamífero", "O castor constrói represas nos rios com galhos e lama."),
  a("guaxinim", "gua-xi-nim", 3, "us-florestas", "mamífero", "O guaxinim tem mãos muito sensíveis e parece lavar a comida na água."),
  a("peru", "pe-ru", 1, "us-pradaria", "ave", "O peru selvagem vive nas florestas e campos dos Estados Unidos."),
  a("bisao", "bi-são", 3, "us-pradaria", "mamífero", "O bisão é o maior mamífero terrestre da América do Norte.", { nome: "bisão" }),
  a("aguia", "á-gui-a", 3, "us-pradaria", "ave", "A águia-careca é o símbolo dos Estados Unidos.", { nome: "águia" }),
  a("cascavel", "cas-ca-vel", 3, "us-pradaria", "réptil", "A cascavel faz barulho com o chocalho na ponta do rabo."),

  // ── Rússia ────────────────────────────────────────────────────────────
  a("foca", "fo-ca", 1, "ru-tundra", "mamífero", "A foca consegue ficar muitos minutos debaixo d'água sem respirar."),
  a("rena", "re-na", 1, "ru-tundra", "mamífero", "A rena é o único cervo em que machos e fêmeas têm chifres."),
  a("raposa", "ra-po-sa", 2, "ru-tundra", "mamífero", "A raposa-do-ártico fica com o pelo branco no inverno para se esconder na neve."),
  a("mamute", "ma-mu-te", 2, "ru-tundra", "mamífero", "Os mamutes viviam na Sibéria e foram extintos há milhares de anos."),
  a("urso", "ur-so", 3, "ru-tundra", "mamífero", "O urso-polar tem a pele preta por baixo dos pelos brancos."),
  a("javali", "ja-va-li", 2, "ru-taiga", "mamífero", "O javali tem um focinho forte para cavar a terra atrás de comida."),
  a("tigre", "ti-gre", 3, "ru-taiga", "mamífero", "O tigre-siberiano é o maior felino do mundo."),
  a("alce", "al-ce", 3, "ru-taiga", "mamífero", "O alce é o maior cervo do mundo."),
  a("esquilo", "es-qui-lo", 3, "ru-taiga", "mamífero", "O esquilo enterra sementes para comer no inverno."),
  a("ourico", "ou-ri-ço", 3, "ru-taiga", "mamífero", "O ouriço se enrola como uma bola de espinhos para se proteger.", { nome: "ouriço" }),

  // ── China ─────────────────────────────────────────────────────────────
  a("bufalo", "bú-fa-lo", 2, "cn-bambuzal", "mamífero", "Na China, o búfalo-d'água ajuda a arar os campos de arroz.", { nome: "búfalo" }),
  a("panda", "pan-da", 3, "cn-bambuzal", "mamífero", "O panda-gigante passa a maior parte do dia comendo bambu."),
  a("pavao", "pa-vão", 3, "cn-bambuzal", "ave", "O pavão-verde vive nas florestas do sul da China.", { nome: "pavão" }),
  a("grilo", "gri-lo", 3, "cn-bambuzal", "inseto", "O grilo canta esfregando uma asa na outra."),
  a("cisne", "cis-ne", 3, "cn-bambuzal", "ave", "O cisne costuma ficar com o mesmo par por muitos anos."),
  a("camelo", "ca-me-lo", 2, "cn-gobi", "mamífero", "O camelo do deserto de Gobi tem duas corcovas, que guardam gordura."),
  a("escorpiao", "es-cor-pi-ão", 3, "cn-gobi", "aracnídeo", "O escorpião brilha no escuro quando recebe luz ultravioleta.", { nome: "escorpião" }),

  // ── Austrália ─────────────────────────────────────────────────────────
  a("canguru", "can-gu-ru", 3, "au-outback", "mamífero", "O filhote de canguru vive na bolsa da mãe."),
  a("lagarto", "la-gar-to", 3, "au-outback", "réptil", "O dragão-barbudo estufa a barba espinhosa e deixa ela escura para parecer maior."),
  a("aranha", "a-ra-nha", 3, "au-outback", "aracnídeo", "A aranha fabrica a própria teia com fios de seda."),
  a("coala", "co-a-la", 2, "au-eucaliptos", "mamífero", "O coala come folhas de eucalipto e dorme quase o dia todo."),
  a("morcego", "mor-ce-go", 3, "au-eucaliptos", "mamífero", "O morcego é o único mamífero que voa de verdade."),
  a("pinguim", "pin-guim", 3, "oc-mar", "ave", "O pinguim-azul, que nada nos mares do sul da Austrália, é o menor pinguim do mundo."),
  a("golfinho", "gol-fi-nho", 3, "oc-mar", "mamífero", "Os golfinhos conversam entre si com assobios e cliques."),
  a("crocodilo", "cro-co-di-lo", 3, "au-eucaliptos", "réptil", "O crocodilo-de-água-salgada é o maior réptil do mundo."),

  // ── África ────────────────────────────────────────────────────────────
  a("gorila", "go-ri-la", 2, "af-rios", "mamífero", "O gorila é o maior primata do mundo."),
  a("hipopotamo", "hi-po-pó-ta-mo", 3, "af-rios", "mamífero", "O hipopótamo passa o dia na água para proteger a pele do sol.", { nome: "hipopótamo" }),
  a("flamingo", "fla-min-go", 3, "af-rios", "ave", "O flamingo é cor-de-rosa por causa do que come."),
  a("girafa", "gi-ra-fa", 2, "af-savana", "mamífero", "O pescoço da girafa tem sete ossos, o mesmo número que o nosso."),
  a("zebra", "ze-bra", 3, "af-savana", "mamífero", "Cada zebra tem um desenho de listras único, como uma impressão digital."),
  a("leao", "le-ão", 3, "af-savana", "mamífero", "O rugido do leão pode ser ouvido a até 8 quilômetros de distância.", { nome: "leão" }),
  a("elefante", "e-le-fan-te", 3, "af-savana", "mamífero", "O elefante usa a tromba para beber água, pegar comida e cumprimentar outros elefantes."),
  a("rinoceronte", "ri-no-ce-ron-te", 3, "af-savana", "mamífero", "O chifre do rinoceronte é feito do mesmo material que as nossas unhas."),
  a("leopardo", "le-o-par-do", 3, "af-savana", "mamífero", "O leopardo é tão forte que sobe em árvores carregando a própria comida."),
];

export function animalPorId(id: string): Animal | undefined {
  return ANIMAIS.find((x) => x.id === id);
}

export function arteDoAnimal(animal: Pick<Animal, "id" | "arte">): string {
  return `/arte/animais/${animal.arte ?? `${animal.id}.svg`}`;
}
