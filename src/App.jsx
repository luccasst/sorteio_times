import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useNavigate } from "react-router-dom";
import AdSense from "./components/AdSense.jsx";
import ConteudoAjuda from "./components/ConteudoAjuda.jsx";
import Rodape from "./components/Rodape.jsx";
import {
  chavesDuplicadas,
  chaveJogador,
  equilibrioEsperado,
  montarElenco,
  preencherExemplo,
  validarElenco,
} from "./lib/players.js";
import { baixarJson, carregarEstado, lerArquivoJson, salvarEstado } from "./lib/storage.js";
import Artigo from "./pages/Artigo.jsx";
import Blog from "./pages/Blog.jsx";
import Privacidade from "./pages/Privacidade.jsx";
import Sobre from "./pages/Sobre.jsx";
import Termos from "./pages/Termos.jsx";

const CORES_TIME = ["#3dd6c6", "#f0c14a", "#ff8b6a", "#7aa2ff", "#c084fc", "#86efac", "#fb7185", "#67e8f9", "#fdba74", "#a3e635"];

const INICIAL = carregarEstado();

function formatarMedia(valor) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatarData(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
      <Aplicacao />
    </BrowserRouter>
  );
}

function Aplicacao() {
  const [modalidade, setModalidade] = useState(INICIAL?.modalidade ?? "Futebol");
  const [times, setTimes] = useState(INICIAL?.times ?? 4);
  const [niveis, setNiveis] = useState(INICIAL?.niveis ?? 6);
  const [jogadores, setJogadores] = useState(() => INICIAL?.jogadores ?? montarElenco(4, 6));
  const [historico, setHistorico] = useState(INICIAL?.historico ?? []);
  const [atual, setAtual] = useState(INICIAL?.atual ?? null);
  const [erros, setErros] = useState([]);
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [modal, setModal] = useState(null);
  const arquivoRef = useRef(null);
  const pronto = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!pronto.current) {
      pronto.current = true;
      return;
    }
    salvarEstado({ modalidade, times, niveis, jogadores, historico, atual });
  }, [modalidade, times, niveis, jogadores, historico, atual]);

  const duplicadas = useMemo(() => chavesDuplicadas(jogadores), [jogadores]);
  const equilibrio = equilibrioEsperado(niveis);
  const total = times * niveis;
  const exibido = atual ?? historico[historico.length - 1] ?? null;
  const indiceExibido = historico.findIndex((item) => item.id === exibido?.id);
  const timesExibidos = exibido?.quantidadeTimes ?? exibido?.timesSorteados?.length ?? times;
  const niveisExibidos = exibido?.niveis ?? exibido?.timesSorteados?.[0]?.jogadores?.length ?? niveis;
  const configMudou = Boolean(exibido) && (timesExibidos !== times || niveisExibidos !== niveis);

  function mostrarRodada(rodada) {
    setAtual(rodada);
  }

  function mudarRodada(direcao) {
    const proxima = historico[indiceExibido + direcao];
    if (proxima) setAtual(proxima);
  }

  function alterarTimes(valor) {
    const proximo = limitar(valor, 2, 12);
    setTimes(proximo);
    setJogadores((lista) => montarElenco(proximo, niveis, lista));
    setErros([]);
  }

  function alterarNiveis(valor) {
    const proximo = limitar(valor, 2, 10);
    setNiveis(proximo);
    setJogadores((lista) => montarElenco(times, proximo, lista));
    setErros([]);
  }

  function alterarNome(id, nome) {
    setJogadores((lista) => lista.map((jogador) => (jogador.id === id ? { ...jogador, nome } : jogador)));
    setErros([]);
  }

  async function sortear() {
    const problemas = validarElenco(jogadores, times, niveis);
    if (problemas.length > 0) {
      setErros(problemas);
      setAviso("");
      return;
    }

    setOcupado(true);
    setErros([]);
    await esperarQuadro();

    const { sortearTimes } = await import("./lib/draw.js");
    const rodada = sortearTimes(jogadores, times, niveis, historico);
    setAtual(rodada);
    setHistorico((lista) => [...lista, rodada]);
    setAviso("Times sorteados. A formação foi escolhida entre as combinações com menos repetição.");
    setOcupado(false);
    if (window.matchMedia("(max-width: 900px)").matches) {
      navigate("/sorteios");
    }
  }

  function confirmarNovo() {
    setModal({
      titulo: "Começar um novo sorteio?",
      texto: "Os nomes digitados e o resultado atual serão apagados. Você escolhe o que acontece com o histórico.",
      acoes: [
        { rotulo: "Cancelar", tipo: "ghost", aoClicar: () => setModal(null) },
        {
          rotulo: "Manter histórico",
          tipo: "secundario",
          aoClicar: () => {
            setJogadores(montarElenco(times, niveis));
            setAtual(null);
            setErros([]);
            setAviso("Ficha limpa. O histórico das rodadas foi mantido.");
            setModal(null);
          },
        },
        {
          rotulo: "Apagar histórico",
          tipo: "perigo",
          aoClicar: () => {
            setJogadores(montarElenco(times, niveis));
            setHistorico([]);
            setAtual(null);
            setErros([]);
            setAviso("Ficha e histórico foram zerados.");
            setModal(null);
          },
        },
      ],
    });
  }

  function confirmarExcluir(rodada, numero) {
    setModal({
      titulo: `Excluir o sorteio ${numero}?`,
      texto: "Essa rodada sai do histórico e deixa de ser usada na comparação dos próximos sorteios.",
      acoes: [
        { rotulo: "Cancelar", tipo: "ghost", aoClicar: () => setModal(null) },
        {
          rotulo: "Excluir",
          tipo: "perigo",
          aoClicar: () => {
            const restante = historico.filter((item) => item.id !== rodada.id);
            setHistorico(restante);
            if (atual?.id === rodada.id) {
              setAtual(restante[restante.length - 1] ?? null);
            }
            setAviso(`Sorteio ${numero} excluído.`);
            setModal(null);
          },
        },
      ],
    });
  }

  function confirmarLimparHistorico() {
    setModal({
      titulo: "Limpar o histórico?",
      texto: "As rodadas guardadas neste navegador serão apagadas. O arquivo JSON que você já baixou continua no computador.",
      acoes: [
        { rotulo: "Cancelar", tipo: "ghost", aoClicar: () => setModal(null) },
        {
          rotulo: "Limpar Histórico",
          tipo: "perigo",
          aoClicar: () => {
            setHistorico([]);
            setAviso("Histórico limpo. O próximo sorteio não terá rodadas anteriores para comparar.");
            setModal(null);
          },
        },
      ],
    });
  }

  async function importarArquivo(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;

    try {
      const estado = await lerArquivoJson(arquivo);
      setModalidade(estado.modalidade);
      setTimes(estado.times);
      setNiveis(estado.niveis);
      setJogadores(estado.jogadores);
      setHistorico(estado.historico);
      setAtual(estado.atual);
      setErros([]);
      setAviso(`Histórico carregado: ${estado.historico.length} rodada(s).`);
    } catch (erro) {
      setErros([erro instanceof Error ? erro.message : "Não foi possível ler o arquivo JSON."]);
    }
  }

  const painel = (
    <PainelSorteios
      historico={historico}
      exibido={exibido}
      timesExibidos={timesExibidos}
      niveisExibidos={niveisExibidos}
      times={times}
      niveis={niveis}
      aviso={aviso}
      configMudou={configMudou}
      indiceExibido={indiceExibido}
      aoMudarRodada={mudarRodada}
      aoExcluir={confirmarExcluir}
      aoSelecionar={mostrarRodada}
    />
  );

  return (
    <div className="pagina">
      <Routes>
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<Artigo />} />
        <Route
          path="/sorteios"
          element={
            <>
              <header className="topo topo-sorteios">
                <div>
                  <p className="marca">Pelada equilibrada</p>
                  <h1>Meus Sorteios</h1>
                </div>
                <Link to="/" className="botao voltar">
                  Voltar ao cadastro
                </Link>
              </header>
              {painel}
              <Rodape />
            </>
          }
        />
        <Route
          path="*"
          element={
            <>
      <header className="topo">
        <div>
          <p className="marca">Pelada equilibrada</p>
          <h1>Sorteio de Times</h1>
          <p className="subtitulo">
            Cada time recebe um jogador de cada nível. O sorteio guarda as rodadas e evita repetir os mesmos companheiros.
            Ideal para futebol, futsal e jogos eletrônicos entre amigos.
          </p>
        </div>
      </header>

      <Link to="/sorteios" className="botao meus-sorteios">
        Meus Sorteios
        <span>{historico.length}</span>
      </Link>

      <main className="grade">
        <section className="painel cadastro">
          <div className="config">
            <Passo
              rotulo="Quantidade de times"
              valor={times}
              detalhe="de 2 a 12"
              minimo={2}
              maximo={12}
              aoMudar={alterarTimes}
            />
            <Passo
              rotulo="Níveis"
              valor={niveis}
              detalhe="por time"
              minimo={2}
              maximo={10}
              aoMudar={alterarNiveis}
            />
            <div className="resumo-config">
              <strong>{total} jogadores</strong>
              <span>{times} por nível · soma {equilibrio.soma} · média {formatarMedia(equilibrio.media)}</span>
            </div>
          </div>

          <div className="lista-niveis">
            {Array.from({ length: niveis }, (_, indice) => indice + 1).map((nivel) => (
              <fieldset key={nivel} className="bloco-nivel">
                <legend>
                  <span className="selo" style={{ "--nivel": nivel }}>
                    {nivel}
                  </span>
                  Nível {nivel}
                  <small>{times} jogadores</small>
                </legend>
                <div className="campos">
                  {jogadores
                    .filter((jogador) => jogador.nivel === nivel)
                    .map((jogador, indice) => {
                      const invalido = chaveJogador(jogador.nome) !== "" && duplicadas.has(chaveJogador(jogador.nome));
                      const vazio = erros.length > 0 && !jogador.nome.trim();
                      return (
                        <label key={jogador.id} className={invalido || vazio ? "campo ruim" : "campo"}>
                          <span>Jogador {indice + 1}</span>
                          <input
                            value={jogador.nome}
                            maxLength={40}
                            placeholder="Nome"
                            aria-label={`Nível ${nivel}, jogador ${indice + 1}`}
                            onChange={(evento) => alterarNome(jogador.id, evento.target.value)}
                          />
                        </label>
                      );
                    })}
                </div>
              </fieldset>
            ))}
          </div>

          {erros.length > 0 && (
            <div className="alerta" role="alert">
              {erros.map((erro) => (
                <p key={erro}>{erro}</p>
              ))}
            </div>
          )}

          <div className="acoes">
            <button type="button" className="botao principal" onClick={sortear} disabled={ocupado}>
              {ocupado ? "Sorteando..." : "Sortear Times"}
            </button>
            <button type="button" className="botao" onClick={() => setJogadores(preencherExemplo(jogadores))}>
              Preencher exemplo
            </button>
            <button type="button" className="botao" onClick={confirmarNovo}>
              Novo Sorteio
            </button>
            <button type="button" className="botao" onClick={confirmarLimparHistorico}>
              Limpar Histórico
            </button>
            <button
              type="button"
              className="botao"
              onClick={() => baixarJson({ modalidade, times, niveis, jogadores, historico, atual })}
            >
              Salvar JSON
            </button>
            <button type="button" className="botao" onClick={() => arquivoRef.current?.click()}>
              Carregar JSON
            </button>
            <input
              ref={arquivoRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={importarArquivo}
            />
          </div>
        </section>

        <div className="resultado-inicio">{painel}</div>
      </main>
              <ConteudoAjuda />
              <Rodape />
            </>
          }
        />
      </Routes>

      {modal && (
        <div className="cortina" role="dialog" aria-modal="true" aria-labelledby="titulo-modal">
          <div className="modal">
            <h2 id="titulo-modal">{modal.titulo}</h2>
            <p>{modal.texto}</p>
            <div className="acoes modal-acoes">
              {modal.acoes.map((acao) => (
                <button key={acao.rotulo} type="button" className={`botao ${acao.tipo ?? ""}`} onClick={acao.aoClicar}>
                  {acao.rotulo}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PainelSorteios({
  historico,
  exibido,
  timesExibidos,
  niveisExibidos,
  times,
  niveis,
  aviso,
  configMudou,
  indiceExibido,
  aoMudarRodada,
  aoExcluir,
  aoSelecionar,
}) {
  return (
    <section className="painel resultado">
      <div className="cabeca-resultado">
        <div>
          <h2>Times da rodada</h2>
          <p>{exibido ? `${timesExibidos} times · ${niveisExibidos} níveis` : `${times} times`}</p>
        </div>
        <div className="contador" aria-live="polite">
          <strong>{historico.length}</strong>
          <span>{historico.length === 1 ? "sorteio realizado" : "sorteios realizados"}</span>
        </div>
      </div>

      {aviso && <p className="aviso">{aviso}</p>}
      {exibido && historico.length > 0 && (
        <div className="nav-sorteio">
          <button type="button" onClick={() => aoMudarRodada(-1)} disabled={indiceExibido <= 0}>
            Anterior
          </button>
          <span>
            Sorteio {indiceExibido + 1} de {historico.length}
          </span>
          <button
            type="button"
            onClick={() => aoMudarRodada(1)}
            disabled={indiceExibido < 0 || indiceExibido >= historico.length - 1}
          >
            Próximo
          </button>
        </div>
      )}
      {configMudou && (
        <p className="nota">
          Configuração deste sorteio: {timesExibidos} times e {niveisExibidos} níveis. A quantidade ao lado vale para o próximo.
        </p>
      )}

      {exibido ? (
        <>
          <div className="times" key={exibido.id}>
            {exibido.timesSorteados.map((time, indice) => (
              <article key={time.nome} className="cartao-time" style={{ "--cor": CORES_TIME[indice % CORES_TIME.length] }}>
                <header>
                  <h3>{time.nome}</h3>
                  <span>{time.jogadores.length} jogadores</span>
                </header>
                <ul>
                  {time.jogadores.map((jogador) => (
                    <li key={jogador.chave}>
                      <span className="selo pequeno" style={{ "--nivel": jogador.nivel }}>
                        {jogador.nivel}
                      </span>
                      <span className="nome-jogador">{jogador.nome}</span>
                      <span className="nivel-texto">nível {jogador.nivel}</span>
                    </li>
                  ))}
                </ul>
                <footer>
                  <div>
                    <small>Soma</small>
                    <strong>{time.soma}</strong>
                  </div>
                  <div>
                    <small>Média</small>
                    <strong>{formatarMedia(time.media)}</strong>
                  </div>
                </footer>
              </article>
            ))}
          </div>
          <Estatisticas rodada={exibido} />
          <AdSense chave={exibido.id} />
          {historico.some((item) => item.id === exibido.id) && (
            <button
              type="button"
              className="botao perigo"
              onClick={() => aoExcluir(exibido, historico.findIndex((item) => item.id === exibido.id) + 1)}
            >
              Excluir este sorteio
            </button>
          )}
        </>
      ) : (
        <div className="vazio">
          <p>Nenhum sorteio nesta rodada.</p>
          <span>Cadastre os nomes e clique em Sortear times. Cada time fica com os níveis de 1 a {niveis}.</span>
        </div>
      )}

      <Historico
        historico={historico}
        selecionadoId={exibido?.id}
        aoSelecionar={aoSelecionar}
        aoExcluir={aoExcluir}
      />
    </section>
  );
}

function Passo({ rotulo, valor, detalhe, minimo, maximo, aoMudar }) {
  return (
    <div className="passo">
      <span>{rotulo}</span>
      <div>
        <button type="button" onClick={() => aoMudar(valor - 1)} aria-label={`Diminuir ${rotulo}`}>
          −
        </button>
        <input
          className="numero"
          type="number"
          min={minimo}
          max={maximo}
          value={valor}
          aria-label={rotulo}
          onChange={(evento) => {
            const numero = Number(evento.target.value);
            if (Number.isInteger(numero)) aoMudar(numero);
          }}
        />
        <button type="button" onClick={() => aoMudar(valor + 1)} aria-label={`Aumentar ${rotulo}`}>
          +
        </button>
      </div>
      <small>{detalhe}</small>
    </div>
  );
}

function Estatisticas({ rodada }) {
  const { estatisticas, avaliacoes, pontuacao } = rodada;
  return (
    <div className="estatisticas">
      <p>
        <strong>{avaliacoes.toLocaleString("pt-BR")}</strong> combinações avaliadas · pontuação de repetição{" "}
        <strong>{pontuacao}</strong>
      </p>
      <ul>
        <li>Duplas repetidas do sorteio anterior: {estatisticas.duplasRepetidasDoAnterior}</li>
        <li>Duplas que já jogaram juntas alguma vez: {estatisticas.duplasQueJaJogaramJuntas}</li>
        <li>Jogadores que voltaram ao mesmo time: {estatisticas.jogadoresNoMesmoTime}</li>
      </ul>
    </div>
  );
}

function Historico({ historico, selecionadoId, aoSelecionar, aoExcluir }) {
  const recente = [...historico].reverse();

  return (
    <div className="historico">
      <h2>Histórico</h2>
      {recente.length === 0 ? (
        <p className="historico-vazio">As rodadas aparecem aqui e ficam salvas neste navegador.</p>
      ) : (
        <ol>
          {recente.map((rodada, indice) => {
            const numero = historico.length - indice;
            const ativo = rodada.id === selecionadoId;
            return (
              <li key={rodada.id}>
                <div className={ativo ? "linha-historico ativo" : "linha-historico"}>
                  <button
                    type="button"
                    className="abrir"
                    aria-current={ativo ? "true" : undefined}
                    onClick={() => aoSelecionar(rodada)}
                  >
                    <span>Sorteio {numero}</span>
                    <small>{formatarData(rodada.criadoEm)}</small>
                    <small>{ativo ? "em exibição" : `${rodada.timesSorteados.length} times`}</small>
                  </button>
                  <button type="button" className="botao perigo" onClick={() => aoExcluir(rodada, numero)}>
                    Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor));
}

function esperarQuadro() {
  return new Promise((resolver) => {
    setTimeout(resolver, 40);
  });
}
