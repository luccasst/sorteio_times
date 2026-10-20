import { Link } from "react-router-dom";

export default function Rodape() {
  return (
    <footer className="rodape-legal">
      <nav aria-label="Informações do site">
        <Link to="/blog">Blog</Link>
        <Link to="/sobre">Sobre</Link>
        <Link to="/privacidade">Privacidade</Link>
        <Link to="/termos">Termos</Link>
      </nav>
      <p>Sorteio de Times · ferramenta gratuita para peladas equilibradas</p>
    </footer>
  );
}
