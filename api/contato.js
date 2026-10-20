const DESTINO = process.env.CONTATO_EMAIL || process.env.VITE_CONTATO_EMAIL || "";

function lerCorpo(req) {
  return new Promise((resolver, rejeitar) => {
    let bruto = "";
    req.on("data", (chunk) => {
      bruto += chunk;
      if (bruto.length > 50_000) rejeitar(new Error("Mensagem grande demais."));
    });
    req.on("end", () => {
      try {
        resolver(bruto ? JSON.parse(bruto) : {});
      } catch {
        rejeitar(new Error("JSON inválido."));
      }
    });
    req.on("error", rejeitar);
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, erro: "Método não permitido." });
    return;
  }

  if (!DESTINO) {
    res.status(500).json({ ok: false, erro: "E-mail de destino não configurado no servidor." });
    return;
  }

  try {
    const corpo = typeof req.body === "object" && req.body !== null ? req.body : await lerCorpo(req);
    const nome = String(corpo.nome || "").trim();
    const email = String(corpo.email || "").trim();
    const mensagem = String(corpo.mensagem || "").trim();

    if (!nome || !email || !mensagem) {
      res.status(400).json({ ok: false, erro: "Preencha nome, e-mail e mensagem." });
      return;
    }

    const resposta = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(DESTINO)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: nome,
        email,
        message: mensagem,
        _subject: `Contato Sorteio de Times — ${nome}`,
        _template: "table",
        _captcha: "false",
      }),
    });

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      res.status(502).json({
        ok: false,
        erro: dados.message || "Não foi possível enviar a mensagem agora.",
      });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (erro) {
    res.status(500).json({
      ok: false,
      erro: erro instanceof Error ? erro.message : "Erro ao enviar a mensagem.",
    });
  }
}
