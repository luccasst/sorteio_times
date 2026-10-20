import { Link } from "react-router-dom";

export default function Termos() {
  return (
    <article className="painel pagina-texto">
      <header className="topo topo-sorteios">
        <div>
          <p className="marca">Pelada equilibrada</p>
          <h1>Termos de uso</h1>
        </div>
        <Link to="/" className="botao voltar">
          Voltar
        </Link>
      </header>

      <div className="texto-legal">
        <p>
          Ao usar o Sorteio de Times, você concorda em utilizar o aplicativo apenas para organizar partidas
          e peladas de forma recreativa.
        </p>
        <p>
          O serviço é oferecido como está, sem garantia de disponibilidade contínua. Os dados digitados
          (nomes e histórico) permanecem no seu dispositivo, salvo se você exportar um arquivo JSON.
        </p>
        <p>
          É proibido usar o site para conteúdo ilegal, spam ou qualquer prática que viole as políticas do
          Google AdSense ou a legislação brasileira.
        </p>
        <p>
          Podemos atualizar estes termos. A versão vigente fica publicada nesta página. Dúvidas sobre
          privacidade estão em <Link to="/privacidade">Privacidade</Link>.
        </p>
      </div>
    </article>
  );
}
