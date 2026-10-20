import { useState } from "react";
import { Link } from "react-router-dom";
import Rodape from "../components/Rodape.jsx";

/** Defina no Vercel: VITE_CONTATO_EMAIL=seu@email.com */
const EMAIL = import.meta.env.VITE_CONTATO_EMAIL?.trim() || "";

export default function Contato() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [aviso, setAviso] = useState("");

  function enviar(evento) {
    evento.preventDefault();
    if (!EMAIL) {
      setAviso("O e-mail de contato ainda não foi configurado no site. Tente novamente em breve.");
      return;
    }
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      setAviso("Preencha nome, e-mail e mensagem.");
      return;
    }

    const assunto = encodeURIComponent(`Contato Sorteio de Times — ${nome.trim()}`);
    const corpo = encodeURIComponent(
      `Nome: ${nome.trim()}\nE-mail: ${email.trim()}\n\n${mensagem.trim()}`,
    );
    window.location.href = `mailto:${EMAIL}?subject=${assunto}&body=${corpo}`;
    setAviso("Se o aplicativo de e-mail não abrir, escreva diretamente para o endereço exibido abaixo.");
  }

  return (
    <div className="pagina">
      <article className="painel pagina-texto">
        <header className="topo topo-sorteios">
          <div>
            <p className="marca">Pelada equilibrada</p>
            <h1>Contato</h1>
          </div>
          <Link to="/" className="botao voltar">
            Voltar
          </Link>
        </header>

        <div className="texto-legal">
          <p>
            Dúvidas sobre o Sorteio de Times, sugestões para o blog ou assuntos relacionados ao site:
            use o formulário abaixo. Respondemos pelo e-mail informado na mensagem.
          </p>
          {EMAIL ? (
            <p>
              E-mail: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </p>
          ) : null}
        </div>

        <form className="form-contato" onSubmit={enviar}>
          <label>
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required />
          </label>
          <label>
            Seu e-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
              required
            />
          </label>
          <label>
            Mensagem
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={6}
              maxLength={2000}
              required
            />
          </label>
          {aviso ? <p className="aviso">{aviso}</p> : null}
          <button type="submit" className="botao principal">
            Enviar mensagem
          </button>
        </form>
      </article>
      <Rodape />
    </div>
  );
}
