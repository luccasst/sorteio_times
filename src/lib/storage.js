const CHAVE = "sorteio-times-v1";

export function carregarEstado() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    return normalizarEstado(JSON.parse(bruto), { tolerante: true });
  } catch {
    return null;
  }
}

export function salvarEstado(estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

export function arquivoDoEstado(estado) {
  return {
    versao: 1,
    salvoEm: new Date().toISOString(),
    modalidade: estado.modalidade,
    times: estado.times,
    niveis: estado.niveis,
    jogadores: estado.jogadores,
    historico: estado.historico,
    atual: estado.atual,
  };
}

export function baixarJson(estado) {
  const conteudo = JSON.stringify(arquivoDoEstado(estado), null, 2);
  const blob = new Blob([conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dia = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `sorteio-times-${dia}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function lerArquivoJson(arquivo) {
  return arquivo.text().then((texto) => normalizarEstado(JSON.parse(texto)));
}

function normalizarEstado(dados, opcoes = {}) {
  const tolerante = Boolean(opcoes.tolerante);

  if (!dados || typeof dados !== "object") {
    throw new Error("O arquivo não tem o formato esperado.");
  }

  let times = Number(dados.times);
  let niveis = Number(dados.niveis);
  if (!Number.isInteger(times) || times < 2 || times > 12) {
    if (!tolerante) throw new Error("A quantidade de times no arquivo é inválida.");
    times = 4;
  }
  if (!Number.isInteger(niveis) || niveis < 2 || niveis > 10) {
    if (!tolerante) throw new Error("A quantidade de níveis no arquivo é inválida.");
    niveis = 6;
  }

  const listaJogadores = Array.isArray(dados.jogadores) ? dados.jogadores : [];
  const listaHistorico = Array.isArray(dados.historico) ? dados.historico : [];

  if (!tolerante && (!Array.isArray(dados.jogadores) || !Array.isArray(dados.historico))) {
    throw new Error("O arquivo não contém jogadores e histórico.");
  }

  const jogadores = listaJogadores
    .map((jogador, indice) => {
      if (!jogador || typeof jogador.nome !== "string") {
        if (!tolerante) throw new Error(`Jogador ${indice + 1} está inválido.`);
        return null;
      }
      const nivel = Number(jogador.nivel);
      if (!Number.isInteger(nivel)) {
        if (!tolerante) throw new Error(`Jogador ${indice + 1} está inválido.`);
        return null;
      }
      return {
        id: typeof jogador.id === "string" ? jogador.id : `imp-${indice}`,
        nome: jogador.nome,
        nivel,
      };
    })
    .filter(Boolean);

  const historico = listaHistorico
    .map((rodada, indice) => {
      if (!rodada || !Array.isArray(rodada.timesSorteados)) {
        if (!tolerante) throw new Error(`A rodada ${indice + 1} do histórico está inválida.`);
        return null;
      }
      return {
        ...rodada,
        id: typeof rodada.id === "string" ? rodada.id : `rodada-${indice + 1}`,
        criadoEm: typeof rodada.criadoEm === "string" ? rodada.criadoEm : new Date().toISOString(),
        estatisticas: rodada.estatisticas ?? {
          duplasRepetidasDoAnterior: 0,
          duplasQueJaJogaramJuntas: 0,
          jogadoresNoMesmoTime: 0,
          formacaoIdentica: false,
        },
      };
    })
    .filter(Boolean);

  return {
    modalidade: typeof dados.modalidade === "string" ? dados.modalidade : "Futebol",
    times,
    niveis,
    jogadores,
    historico,
    atual: dados.atual?.timesSorteados ? dados.atual : null,
  };
}
