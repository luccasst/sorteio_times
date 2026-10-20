import { sortearTimes } from "../src/lib/draw.js";
import { equilibrioEsperado, montarElenco, preencherExemplo, validarElenco } from "../src/lib/players.js";

function assert(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
}

function elencoPadrao(times = 4, niveis = 6) {
  return preencherExemplo(montarElenco(times, niveis));
}

function conferirRodada(rodada, times, niveis) {
  const esperado = equilibrioEsperado(niveis);
  assert(rodada.timesSorteados.length === times, "quantidade de times");
  const chaves = new Set();

  for (const time of rodada.timesSorteados) {
    assert(time.jogadores.length === niveis, "jogadores por time");
    const niveisDoTime = time.jogadores.map((jogador) => jogador.nivel).sort((a, b) => a - b);
    assert(niveisDoTime.join(",") === [...Array(niveis).keys()].map((n) => n + 1).join(","), "um de cada nível");
    assert(time.soma === esperado.soma, `soma ${time.soma} != ${esperado.soma}`);
    assert(time.media === esperado.media, "média");
    for (const jogador of time.jogadores) {
      assert(!chaves.has(jogador.chave), "jogador repetido no sorteio");
      chaves.add(jogador.chave);
    }
  }
}

const vazio = montarElenco(4, 6);
const errosVazio = validarElenco(vazio, 4, 6);
assert(errosVazio.some((erro) => erro.includes("sem nome")), "valida nome vazio");

const duplicado = preencherExemplo(montarElenco(4, 6));
duplicado[1] = { ...duplicado[1], nome: duplicado[0].nome };
assert(validarElenco(duplicado, 4, 6).some((erro) => erro.includes("duplicados")), "valida duplicado");

const base = elencoPadrao();
assert(validarElenco(base, 4, 6).length === 0, "elenco válido");

const historico = [];
for (let rodada = 0; rodada < 8; rodada += 1) {
  const inicio = performance.now();
  const resultado = sortearTimes(base, 4, 6, historico);
  const gasto = performance.now() - inicio;
  conferirRodada(resultado, 4, 6);
  historico.push(resultado);
  console.log(
    `rodada ${rodada + 1}: ${gasto.toFixed(0)}ms, avaliações ${resultado.avaliacoes}, pontuação ${resultado.pontuacao}, duplas anteriores ${resultado.estatisticas.duplasRepetidasDoAnterior}, duplas já vistas ${resultado.estatisticas.duplasQueJaJogaramJuntas}`,
  );
  assert(gasto < 2500, "sorteio demorou demais");
  if (rodada > 0) {
    assert(resultado.estatisticas.duplasRepetidasDoAnterior < 12, "muitas duplas repetidas do sorteio anterior");
  }
}

const pequeno = sortearTimes(elencoPadrao(3, 4), 3, 4, []);
conferirRodada(pequeno, 3, 4);
assert(pequeno.timesSorteados[0].soma === 10, "soma 1+2+3+4");
assert(pequeno.timesSorteados[0].media === 2.5, "média");

console.log("ok");
