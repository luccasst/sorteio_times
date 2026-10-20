/** Identidade do jogador: o histórico acompanha o nome, sem diferenciar maiúsculas. */
export function chaveJogador(nome) {
  return nome.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

export function criarId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Monta a lista de vagas: cada nível tem exatamente `times` jogadores,
 * porque cada time recebe um jogador de cada nível.
 * Preserva nomes já digitados quando a configuração muda.
 */
export function montarElenco(times, niveis, anterior = []) {
  const elenco = [];
  for (let nivel = 1; nivel <= niveis; nivel += 1) {
    const doNivel = anterior.filter((jogador) => jogador.nivel === nivel);
    for (let indice = 0; indice < times; indice += 1) {
      const existente = doNivel[indice];
      elenco.push({
        id: existente?.id ?? criarId(),
        nome: existente?.nome ?? "",
        nivel,
      });
    }
  }
  return elenco;
}

const EXEMPLOS = [
  "André", "Bruno", "Caio", "Diego", "Eduardo", "Felipe", "Gustavo", "Henrique",
  "Igor", "João", "Kaique", "Lucas", "Marcelo", "Nicolas", "Otávio", "Pedro",
  "Rafael", "Samuel", "Thiago", "Vitor", "Wagner", "Xavier", "Yuri", "Zeca",
  "Alex", "Breno", "César", "Davi", "Enzo", "Fabio", "Gael", "Heitor",
  "Ian", "Júlio", "Kevin", "Leandro", "Murilo", "Nathan", "Oscar", "Paulo",
  "Raul", "Sérgio", "Tales", "Ulisses", "Vinícius", "William", "Yago", "Zion",
];

export function preencherExemplo(elenco) {
  return elenco.map((jogador, indice) => ({
    ...jogador,
    nome: EXEMPLOS[indice] ?? `Jogador ${indice + 1}`,
  }));
}

export function validarElenco(jogadores, times, niveis) {
  const erros = [];
  const esperado = times * niveis;

  if (jogadores.length !== esperado) {
    erros.push(
      `São necessários exatamente ${esperado} jogadores. Encontrados: ${jogadores.length}.`,
    );
  }

  const semNome = jogadores.filter((jogador) => !jogador.nome.trim());
  if (semNome.length === 1) {
    erros.push("Existe 1 jogador sem nome.");
  } else if (semNome.length > 1) {
    erros.push(`Existem ${semNome.length} jogadores sem nome.`);
  }

  const vistos = new Map();
  const duplicados = new Set();
  for (const jogador of jogadores) {
    const chave = chaveJogador(jogador.nome);
    if (!chave) continue;
    if (vistos.has(chave)) {
      duplicados.add(vistos.get(chave));
      duplicados.add(jogador.nome.trim().replace(/\s+/g, " "));
    } else {
      vistos.set(chave, jogador.nome.trim().replace(/\s+/g, " "));
    }
  }
  if (duplicados.size > 0) {
    erros.push(`Há jogadores duplicados: ${[...duplicados].join(", ")}.`);
  }

  for (let nivel = 1; nivel <= niveis; nivel += 1) {
    const quantidade = jogadores.filter((jogador) => jogador.nivel === nivel).length;
    if (quantidade !== times) {
      erros.push(
        `O nível ${nivel} precisa ter exatamente ${times} jogadores. Encontrados: ${quantidade}.`,
      );
    }
  }

  return erros;
}

/** Soma e média quando cada time recebe os níveis 1..N uma vez. */
export function equilibrioEsperado(niveis) {
  const soma = (niveis * (niveis + 1)) / 2;
  return { soma, media: soma / niveis };
}

export function chavesDuplicadas(jogadores) {
  const contagem = new Map();
  for (const jogador of jogadores) {
    const chave = chaveJogador(jogador.nome);
    if (!chave) continue;
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  const duplicadas = new Set();
  for (const [chave, quantidade] of contagem) {
    if (quantidade > 1) duplicadas.add(chave);
  }
  return duplicadas;
}
