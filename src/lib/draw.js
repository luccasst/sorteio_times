import { chaveJogador } from "./players.js";

/**
 * Pesos da pontuação. Quanto maior o peso, mais aquele tipo de repetição
 * empurra o sorteio para fora da escolha final. A busca fica com a MENOR pontuação.
 *
 * A prioridade é variar os companheiros. O índice do time (Time 1, Time 2...)
 * pesa menos, porque trocar só o rótulo do time não muda quem joga junto.
 */
export const PESOS = {
  duplaDoSorteioAnterior: 14,
  duplaJaVista: 5,
  mesmoTime: 2,
  grupoParecido: 6,
  sorteioIdentico: 1000,
};

const JANELA_GRUPOS = 40;
const ORCAMENTO_MS = 700;

function chaveDupla(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function embaralhar(lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function permutacoes(n) {
  const resultado = [];
  const atual = [...Array(n).keys()];

  function heap(k) {
    if (k === 1) {
      resultado.push(atual.slice());
      return;
    }
    heap(k - 1);
    for (let i = 0; i < k - 1; i += 1) {
      const troca = k % 2 === 0 ? i : 0;
      [atual[troca], atual[k - 1]] = [atual[k - 1], atual[troca]];
      heap(k - 1);
    }
  }

  heap(n);
  return resultado;
}

const cachePermutacoes = new Map();

function permutacoesDe(n) {
  if (!cachePermutacoes.has(n)) cachePermutacoes.set(n, permutacoes(n));
  return cachePermutacoes.get(n);
}

function assinatura(times) {
  return times
    .map((time) => time.map((jogador) => jogador.chave).sort().join(","))
    .sort()
    .join("||");
}

function montarTimes(grupos, atribuicoes) {
  const quantidadeTimes = grupos[0].length;
  const times = Array.from({ length: quantidadeTimes }, () => []);

  for (let nivel = 0; nivel < grupos.length; nivel += 1) {
    const permutacao = atribuicoes[nivel];
    if (!permutacao) continue;
    for (let time = 0; time < quantidadeTimes; time += 1) {
      times[time].push(grupos[nivel][permutacao[time]]);
    }
  }

  return times;
}

/**
 * Lê o histórico e resume o que não pode se repetir:
 * duplas que já jogaram juntas, em qual time cada jogador já caiu,
 * e os grupos recentes.
 */
function criarContexto(historico) {
  const frequenciaDuplas = new Map();
  const frequenciaTimes = new Map();
  const assinaturas = new Set();
  const timesRecentes = [];

  historico.forEach((rodada, indice) => {
    const recente = indice >= historico.length - JANELA_GRUPOS;
    const timesDaRodada = rodada.timesSorteados ?? [];
    assinaturas.add(
      assinatura(
        timesDaRodada.map((time) =>
          time.jogadores.map((jogador) => ({
            chave: jogador.chave || chaveJogador(jogador.nome),
          })),
        ),
      ),
    );

    timesDaRodada.forEach((time, indiceTime) => {
      const chaves = time.jogadores.map((jogador) => jogador.chave || chaveJogador(jogador.nome));
      if (recente) timesRecentes.push(new Set(chaves));

      for (let i = 0; i < chaves.length; i += 1) {
        const chaveVaga = `${chaves[i]}@${indiceTime}`;
        frequenciaTimes.set(chaveVaga, (frequenciaTimes.get(chaveVaga) ?? 0) + 1);

        for (let j = i + 1; j < chaves.length; j += 1) {
          const dupla = chaveDupla(chaves[i], chaves[j]);
          frequenciaDuplas.set(dupla, (frequenciaDuplas.get(dupla) ?? 0) + 1);
        }
      }
    });
  });

  const ultima = historico[historico.length - 1];
  const duplasAnteriores = new Set();
  if (ultima) {
    for (const time of ultima.timesSorteados ?? []) {
      const chaves = time.jogadores.map((jogador) => jogador.chave || chaveJogador(jogador.nome));
      for (let i = 0; i < chaves.length; i += 1) {
        for (let j = i + 1; j < chaves.length; j += 1) {
          duplasAnteriores.add(chaveDupla(chaves[i], chaves[j]));
        }
      }
    }
  }

  return {
    frequenciaDuplas,
    frequenciaTimes,
    assinaturas,
    timesRecentes,
    duplasAnteriores,
    rodadas: historico.length,
  };
}

function pontuar(times, contexto, parcial) {
  let duplasAnteriores = 0;
  let custoDuplasVistas = 0;
  let duplasVistas = 0;
  let custoMesmoTime = 0;
  let jogadoresNoMesmoTime = 0;
  let custoGrupo = 0;

  for (let indiceTime = 0; indiceTime < times.length; indiceTime += 1) {
    const chaves = times[indiceTime].map((jogador) => jogador.chave);

    for (let i = 0; i < chaves.length; i += 1) {
      const vezesNoTime = contexto.frequenciaTimes.get(`${chaves[i]}@${indiceTime}`) ?? 0;
      if (vezesNoTime > 0) jogadoresNoMesmoTime += 1;
      custoMesmoTime += vezesNoTime * vezesNoTime;

      for (let j = i + 1; j < chaves.length; j += 1) {
        const dupla = chaveDupla(chaves[i], chaves[j]);
        const vezes = contexto.frequenciaDuplas.get(dupla) ?? 0;
        if (vezes > 0) {
          duplasVistas += 1;
          custoDuplasVistas += vezes * vezes;
        }
        if (contexto.duplasAnteriores.has(dupla)) duplasAnteriores += 1;
      }
    }

    if (!parcial && contexto.timesRecentes.length > 0) {
      let maiorIntersecao = 0;
      for (const antigo of contexto.timesRecentes) {
        let intersecao = 0;
        for (const chave of chaves) {
          if (antigo.has(chave)) intersecao += 1;
        }
        if (intersecao > maiorIntersecao) maiorIntersecao = intersecao;
      }
      if (maiorIntersecao >= 3) {
        custoGrupo += (maiorIntersecao - 2) * (maiorIntersecao - 2);
      }
    }
  }

  const repetido = !parcial && contexto.assinaturas.has(assinatura(times)) ? 1 : 0;

  const total =
    duplasAnteriores * PESOS.duplaDoSorteioAnterior +
    custoDuplasVistas * PESOS.duplaJaVista +
    custoMesmoTime * PESOS.mesmoTime +
    custoGrupo * PESOS.grupoParecido +
    repetido * PESOS.sorteioIdentico;

  return {
    total,
    duplasAnteriores,
    duplasVistas,
    jogadoresNoMesmoTime,
    repetido,
  };
}

/**
 * Para poucos times, testa todas as formas de encaixar um nível
 * e fica com a que menos repete companheiros, dados os níveis já distribuídos.
 */
function melhorPermutacao(grupos, atribuicoes, nivel, contexto) {
  const quantidadeTimes = grupos[0].length;
  let melhor = null;
  let melhorPontuacao = Infinity;

  for (const permutacao of permutacoesDe(quantidadeTimes)) {
    atribuicoes[nivel] = permutacao;
    const pontuacao = pontuar(montarTimes(grupos, atribuicoes), contexto, true).total;
    if (pontuacao < melhorPontuacao) {
      melhorPontuacao = pontuacao;
      melhor = permutacao;
    }
  }

  return melhor.slice();
}

function construir(grupos, contexto) {
  const niveis = grupos.length;
  const ordem = embaralhar([...Array(niveis).keys()]);
  const atribuicoes = Array.from({ length: niveis }, () => null);
  const quantidadeTimes = grupos[0].length;
  const enumerar = quantidadeTimes <= 6;

  for (const nivel of ordem) {
    if (enumerar) {
      atribuicoes[nivel] = melhorPermutacao(grupos, atribuicoes, nivel, contexto);
    } else {
      atribuicoes[nivel] = embaralhar([...Array(quantidadeTimes).keys()]);
    }
  }

  return atribuicoes;
}

/** Família cíclica: espalha os níveis por turnos diferentes antes da busca livre. */
function construirCiclico(grupos, multiplicador, extra) {
  const quantidadeTimes = grupos[0].length;
  const ordem = grupos.map(() => embaralhar([...Array(quantidadeTimes).keys()]));

  return ordem.map((jogadoresDoNivel, nivel) => {
    const permutacao = [];
    const giro = (multiplicador * nivel + extra) % quantidadeTimes;
    for (let time = 0; time < quantidadeTimes; time += 1) {
      permutacao[time] = jogadoresDoNivel[(time + giro) % quantidadeTimes];
    }
    return permutacao;
  });
}

function copiarAtribuicoes(atribuicoes) {
  return atribuicoes.map((permutacao) => permutacao.slice());
}

/**
 * Busca em profundidade, podando o que já repetiu mais que a melhor formação
 * completa. Funciona bem até 5 times, porque cada nível tem no máximo 120 ordens.
 */
function buscaEmArvore(grupos, contexto, inicio) {
  const quantidadeTimes = grupos[0].length;
  const niveis = grupos.length;
  if (quantidadeTimes > 5 || niveis > 8) return null;

  const ordens = embaralhar(permutacoesDe(quantidadeTimes).map((permutacao) => permutacao.slice()));
  const atribuicoes = Array.from({ length: niveis }, () => null);
  let melhor = null;
  let avaliacoes = 0;
  const limiteAvaliacoes = 20000;

  function visitar(nivel) {
    if (avaliacoes >= limiteAvaliacoes || performance.now() - inicio > ORCAMENTO_MS) return;

    if (nivel === niveis) {
      const times = montarTimes(grupos, atribuicoes);
      const pontuacao = pontuar(times, contexto, false);
      avaliacoes += 1;
      if (!melhor || pontuacao.total < melhor.pontuacao.total) {
        melhor = {
          times: times.map((time) => time.slice()),
          pontuacao,
          avaliacoes,
        };
      }
      return;
    }

    for (const ordem of ordens) {
      if (avaliacoes >= limiteAvaliacoes || performance.now() - inicio > ORCAMENTO_MS) return;
      atribuicoes[nivel] = ordem;
      const parcial = pontuar(montarTimes(grupos, atribuicoes), contexto, true);
      avaliacoes += 1;
      if (melhor && parcial.total >= melhor.pontuacao.total) continue;
      visitar(nivel + 1);
      if (melhor?.pontuacao.total === 0) return;
    }
  }

  visitar(0);
  if (!melhor) return null;
  melhor.avaliacoes = avaliacoes;
  return melhor;
}

/**
 * Recozimento: aceita uma troca pior no começo para não ficar preso
 * num grupo que ainda repete vários companheiros. Guarda a melhor vista.
 */
function recozer(grupos, atribuicoes, contexto, inicio) {
  const quantidadeTimes = grupos[0].length;
  const niveis = grupos.length;
  let times = montarTimes(grupos, atribuicoes);
  let pontuacao = pontuar(times, contexto, false);
  let melhorTimes = times;
  let melhorPontuacao = pontuacao;
  let avaliacoes = 1;
  const passos = contexto.rodadas === 0 ? 0 : Math.min(2500, 700 + contexto.rodadas * 120);

  for (let passo = 0; passo < passos; passo += 1) {
    if (performance.now() - inicio > ORCAMENTO_MS) break;

    const nivel = Math.floor(Math.random() * niveis);
    const permutacao = atribuicoes[nivel];
    const a = Math.floor(Math.random() * quantidadeTimes);
    let b = Math.floor(Math.random() * (quantidadeTimes - 1));
    if (b >= a) b += 1;
    [permutacao[a], permutacao[b]] = [permutacao[b], permutacao[a]];

    const candidato = montarTimes(grupos, atribuicoes);
    const novaPontuacao = pontuar(candidato, contexto, false);
    avaliacoes += 1;
    const delta = novaPontuacao.total - pontuacao.total;
    const temperatura = 18 * (1 - passo / passos) + 0.35;
    const aceita = delta <= 0 || Math.random() < Math.exp(-delta / temperatura);

    if (aceita) {
      times = candidato;
      pontuacao = novaPontuacao;
      if (novaPontuacao.total < melhorPontuacao.total) {
        melhorPontuacao = novaPontuacao;
        melhorTimes = candidato;
      }
    } else {
      [permutacao[a], permutacao[b]] = [permutacao[b], permutacao[a]];
    }
  }

  return { times: melhorTimes, pontuacao: melhorPontuacao, avaliacoes };
}

function prepararGrupos(jogadores, times, niveis) {
  const grupos = Array.from({ length: niveis }, () => []);

  for (const jogador of jogadores) {
    grupos[jogador.nivel - 1].push({
      id: jogador.id,
      nome: jogador.nome.trim().replace(/\s+/g, " "),
      nivel: jogador.nivel,
      chave: chaveJogador(jogador.nome),
    });
  }

  for (const grupo of grupos) {
    if (grupo.length !== times) {
      throw new Error("Cada nível precisa ter um jogador para cada time.");
    }
  }

  return grupos;
}

function resumirTime(jogadores, indice) {
  const soma = jogadores.reduce((total, jogador) => total + jogador.nivel, 0);
  const media = soma / jogadores.length;
  return {
    nome: `Time ${indice + 1}`,
    jogadores: [...jogadores].sort((a, b) => a.nivel - b.nivel),
    soma,
    media,
  };
}

/**
 * Gera várias distribuições e devolve a que menos repete companheiros,
 * vagas e formações anteriores. Cada time continua com um jogador de cada nível.
 */
export class SorteadorEquilibrado {
  constructor(historico = []) {
    this.contexto = criarContexto(historico);
  }

  sortear(jogadores, times, niveis) {
    const grupos = prepararGrupos(jogadores, times, niveis);
    const inicio = performance.now();
    const comHistorico = this.contexto.rodadas > 0;

    const reinicios = comHistorico ? Math.min(24, 8 + this.contexto.rodadas) : 8;

    let melhor = null;
    let avaliacoes = 0;

    if (comHistorico && times <= 5) {
      const arvore = buscaEmArvore(grupos, this.contexto, inicio);
      if (arvore) {
        melhor = arvore;
        avaliacoes += arvore.avaliacoes;
      }
    }

    const sementes = [];

    if (comHistorico) {
      const quantidadeCiclos = Math.min(times, 4);
      for (let multiplicador = 0; multiplicador < quantidadeCiclos; multiplicador += 1) {
        sementes.push(construirCiclico(grupos, multiplicador + 1, Math.floor(Math.random() * times)));
      }
    }

    for (let tentativa = 0; tentativa < reinicios; tentativa += 1) {
      if (performance.now() - inicio > ORCAMENTO_MS && melhor) break;

      const atribuicoes = sementes[tentativa]
        ? copiarAtribuicoes(sementes[tentativa])
        : comHistorico
          ? construir(grupos, this.contexto)
          : grupos.map(() => embaralhar([...Array(times).keys()]));

      const resultado = recozer(grupos, atribuicoes, this.contexto, inicio);
      avaliacoes += resultado.avaliacoes;

      if (!melhor || resultado.pontuacao.total < melhor.pontuacao.total) {
        melhor = resultado;
      }
      if (melhor.pontuacao.total === 0 && !comHistorico) break;
    }

    const timesResumo = melhor.times.map(resumirTime);

    return {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      criadoEm: new Date().toISOString(),
      quantidadeTimes: times,
      niveis,
      timesSorteados: timesResumo,
      pontuacao: melhor.pontuacao.total,
      avaliacoes,
      estatisticas: {
        duplasRepetidasDoAnterior: melhor.pontuacao.duplasAnteriores,
        duplasQueJaJogaramJuntas: melhor.pontuacao.duplasVistas,
        jogadoresNoMesmoTime: melhor.pontuacao.jogadoresNoMesmoTime,
        formacaoIdentica: melhor.pontuacao.repetido === 1,
      },
    };
  }
}

export function sortearTimes(jogadores, times, niveis, historico) {
  return new SorteadorEquilibrado(historico).sortear(jogadores, times, niveis);
}
