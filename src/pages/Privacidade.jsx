import { Link } from "react-router-dom";

export default function Privacidade() {
  return (
    <article className="painel privacidade">
      <header className="topo topo-sorteios">
        <div>
          <p className="marca">Pelada equilibrada</p>
          <h1>Privacidade</h1>
        </div>
        <Link to="/" className="botao voltar">
          Voltar
        </Link>
      </header>

      <div className="texto-legal">
        <p>
          O Sorteio de Times é um aplicativo usado no navegador. Os nomes dos jogadores e o histórico dos
          sorteios ficam salvos neste dispositivo (armazenamento local), sem envio automático para nossos
          servidores.
        </p>
        <p>
          Se anúncios do Google AdSense estiverem ativos, o Google pode usar cookies ou identificadores
          semelhantes para exibir anúncios. Você pode gerenciar preferências de anúncios em{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
            adssettings.google.com
          </a>
          .
        </p>
        <p>
          Política de anúncios do Google:{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">
            policies.google.com/technologies/ads
          </a>
          .
        </p>
        <p>Ao usar o aplicativo, você concorda com esta política de privacidade.</p>
      </div>
    </article>
  );
}
