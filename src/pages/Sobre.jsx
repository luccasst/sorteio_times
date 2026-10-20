import { Link } from "react-router-dom";

export default function Sobre() {
  return (
    <article className="painel pagina-texto">
      <header className="topo topo-sorteios">
        <div>
          <p className="marca">Pelada equilibrada</p>
          <h1>Sobre</h1>
        </div>
        <Link to="/" className="botao voltar">
          Voltar
        </Link>
      </header>

      <div className="texto-legal">
        <p>
          O <strong>Sorteio de Times</strong> é uma ferramenta gratuita para montar times equilibrados em
          futebol, futsal, jogos eletrônicos e outras peladas entre amigos.
        </p>
        <p>
          Em vez de sortear nomes ao acaso, o app respeita o nível de cada jogador: cada time recebe a mesma
          distribuição de habilidades. Assim a disputa fica mais justa e ninguém fica sempre com o time
          mais forte.
        </p>
        <p>
          O histórico dos sorteios fica no seu navegador. Nas próximas rodadas, o algoritmo tenta variar os
          companheiros para que as mesmas duplas não se repitam o tempo todo.
        </p>
        <p>
          Além da ferramenta, publicamos um <Link to="/blog">blog</Link> com guias sobre organização de
          rachas, equilíbrio de times e dicas de pelada. O site pode exibir anúncios do Google AdSense para
          ajudar a manter o projeto no ar. Veja também a{" "}
          <Link to="/privacidade">política de privacidade</Link> e os{" "}
          <Link to="/termos">termos de uso</Link>.
        </p>
      </div>
    </article>
  );
}
