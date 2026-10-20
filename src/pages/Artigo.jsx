import { Link, useParams } from "react-router-dom";
import { formatarDataArtigo, obterArtigo } from "../blog/artigos.js";
import Rodape from "../components/Rodape.jsx";

export default function Artigo() {
  const { slug } = useParams();
  const artigo = obterArtigo(slug);

  if (!artigo) {
    return (
      <div className="pagina">
        <article className="painel pagina-texto">
          <h1>Artigo não encontrado</h1>
          <p className="texto-legal">Esse endereço não corresponde a nenhum post.</p>
          <Link to="/blog" className="botao voltar">
            Voltar ao blog
          </Link>
        </article>
      </div>
    );
  }

  return (
    <div className="pagina">
      <article className="painel artigo">
        <header className="topo topo-sorteios">
          <div>
            <p className="marca">Blog</p>
            <h1>{artigo.titulo}</h1>
            <time dateTime={artigo.data}>{formatarDataArtigo(artigo.data)}</time>
          </div>
          <Link to="/blog" className="botao voltar">
            Todos os artigos
          </Link>
        </header>

        <p className="artigo-resumo">{artigo.resumo}</p>

        {artigo.secoes.map((secao) => (
          <section key={secao.titulo} className="artigo-secao">
            <h2>{secao.titulo}</h2>
            {secao.paragrafos.map((paragrafo) => (
              <p key={paragrafo.slice(0, 32)}>{paragrafo}</p>
            ))}
          </section>
        ))}

        <p className="artigo-cta">
          Quer montar times equilibrados agora?{" "}
          <Link to="/">Abrir o Sorteio de Times</Link>
        </p>
      </article>
      <Rodape />
    </div>
  );
}
