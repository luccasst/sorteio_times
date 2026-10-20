import { Link } from "react-router-dom";
import { artigos, formatarDataArtigo } from "../blog/artigos.js";
import Rodape from "../components/Rodape.jsx";

export default function Blog() {
  const lista = [...artigos].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="pagina">
      <header className="topo topo-sorteios">
        <div>
          <p className="marca">Pelada equilibrada</p>
          <h1>Blog</h1>
          <p className="subtitulo">
            Guias e ideias para organizar rachas, equilibrar times e melhorar a pelada com os amigos.
          </p>
        </div>
        <Link to="/" className="botao voltar">
          Ir ao sorteio
        </Link>
      </header>

      <section className="painel blog-lista">
        <ul>
          {lista.map((artigo) => (
            <li key={artigo.slug}>
              <article>
                <time dateTime={artigo.data}>{formatarDataArtigo(artigo.data)}</time>
                <h2>
                  <Link to={`/blog/${artigo.slug}`}>{artigo.titulo}</Link>
                </h2>
                <p>{artigo.resumo}</p>
                <Link className="ler-mais" to={`/blog/${artigo.slug}`}>
                  Ler artigo
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <Rodape />
    </div>
  );
}
