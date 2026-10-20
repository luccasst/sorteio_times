import { useState } from "react";
import { Link } from "react-router-dom";
import Rodape from "../components/Rodape.jsx";

/**
 * Destino só no env (build). Não é exibido na página.
 * No Vercel: VITE_CONTATO_EMAIL
 */
const DESTINO = import.meta.env.VITE_CONTATO_EMAIL?.trim() || "";

export default function Contato() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    if (!DESTINO) {
      setSucesso(false);
      setAviso("O formulário ainda não está configurado. Tente mais tarde.");
      return;
    }
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      setSucesso(false);
      setAviso("Preencha nome, e-mail e mensagem.");
      return;
    }

    setEnviando(true);
    setAviso("");
    setSucesso(false);

    try {
      const resposta = await fetch(`https://formsubmit.co/ajax/${DESTINO}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: nome.trim(),
          email: email.trim(),
          message: mensagem.trim(),
          _subject: `Contato Sorteio de Times — ${nome.trim()}`,
          _template: "table",
          _captcha: "false",
        }),
      });

      const dados = await resposta.json().catch(() => ({}));
      const falhou =
        !resposta.ok ||
        dados.success === false ||
        dados.success === "false";

      if (falhou) {
        const detalhe = String(dados.message || "");
        if (/activate|confirm|verif|habilit/i.test(detalhe)) {
          throw new Error(
            "Confirme o e-mail de ativação do FormSubmit na sua caixa de entrada (e no spam) e tente de novo.",
          );
        }
        throw new Error(detalhe || "Não foi possível enviar a mensagem agora.");
      }

      setSucesso(true);
      setAviso("Mensagem enviada. Em breve respondemos no e-mail que você informou.");
      setNome("");
      setEmail("");
      setMensagem("");
    } catch (erro) {
      setSucesso(false);
      setAviso(erro instanceof Error ? erro.message : "Erro ao enviar. Tente de novo em instantes.");
    } finally {
      setEnviando(false);
    }
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
        </div>

        <form className="form-contato" onSubmit={enviar}>
          <label>
            Nome
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={80}
              required
              disabled={enviando}
            />
          </label>
          <label>
            Seu e-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
              required
              disabled={enviando}
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
              disabled={enviando}
            />
          </label>
          {aviso ? <p className={sucesso ? "aviso" : "alerta"}>{aviso}</p> : null}
          <button type="submit" className="botao principal" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      </article>
      <Rodape />
    </div>
  );
}
