import { Link } from "react-router-dom";

export default function ConteudoAjuda() {
  return (
    <section className="painel ajuda" aria-labelledby="titulo-ajuda">
      <h2 id="titulo-ajuda">Como funciona</h2>
      <p>
        Cadastre os jogadores por nível de habilidade, escolha quantos times deseja e clique em
        Sortear Times. Cada time recebe um jogador de cada nível, com a mesma soma e a mesma média.
      </p>

      <h3>Passo a passo</h3>
      <ol>
        <li>Defina a quantidade de times e de níveis.</li>
        <li>Preencha o nome de cada jogador no nível correspondente.</li>
        <li>Clique em Sortear Times para gerar a formação.</li>
        <li>Use Meus Sorteios para ver o histórico e evitar repetições.</li>
      </ol>

      <h3>Perguntas frequentes</h3>
      <dl className="faq">
        <div>
          <dt>Para que serve o nível do jogador?</dt>
          <dd>
            O nível representa a habilidade relativa na pelada (1 mais iniciante, valores maiores mais
            experientes). A distribuição igual por nível deixa os times equilibrados.
          </dd>
        </div>
        <div>
          <dt>Os dados ficam salvos onde?</dt>
          <dd>
            No navegador deste aparelho. Você também pode exportar e importar o histórico em arquivo JSON.
          </dd>
        </div>
        <div>
          <dt>Por que o próximo sorteio fica diferente?</dt>
          <dd>
            O app compara com as rodadas anteriores e tenta reduzir companheiros e formações repetidas,
            sem quebrar a regra de um jogador de cada nível por time.
          </dd>
        </div>
        <div>
          <dt>Funciona no celular?</dt>
          <dd>
            Sim. No celular, Meus Sorteios abre em uma tela separada para facilitar a leitura dos times.
          </dd>
        </div>
      </dl>

      <p className="ajuda-blog">
        Quer mais dicas de organização? Confira o <Link to="/blog">blog da pelada equilibrada</Link>.
      </p>
    </section>
  );
}
