import { Link } from "react-router-dom";

export default function Privacidade() {
  return (
    <article className="painel pagina-texto">
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
          Esta política descreve como o <strong>Sorteio de Times</strong> trata informações quando você
          usa o site em https://sorteio-times-cyan.vercel.app ou em outros endereços oficiais do projeto.
        </p>

        <h2>Dados que ficam no seu aparelho</h2>
        <p>
          Nomes dos jogadores, configuração de times e histórico de sorteios são guardados no
          armazenamento local do navegador. Esses dados não são enviados automaticamente para um servidor
          nosso. Se você usar Salvar JSON ou Carregar JSON, o arquivo fica sob o seu controle.
        </p>

        <h2>Anúncios e cookies</h2>
        <p>
          O site pode exibir anúncios do Google AdSense. O Google e seus parceiros podem usar cookies ou
          tecnologias semelhantes para personalizar anúncios e medir desempenho. Você pode alterar
          preferências em{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
            adssettings.google.com
          </a>
          . Saiba mais em{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">
            policies.google.com/technologies/ads
          </a>
          .
        </p>

        <h2>Menores de idade</h2>
        <p>
          O aplicativo não é destinado a crianças menores de 13 anos. Se você é responsável por um menor,
          oriente o uso consciente da internet e dos anúncios.
        </p>

        <h2>Alterações</h2>
        <p>
          Podemos atualizar esta página para refletir mudanças no serviço ou na legislação. A data da
          versão atual é outubro de 2026.
        </p>

        <p>
          Veja também o <Link to="/sobre">Sobre</Link> e os <Link to="/termos">Termos de uso</Link>.
        </p>
      </div>
    </article>
  );
}
