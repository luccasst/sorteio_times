const DESTINO = (process.env.CONTATO_EMAIL || process.env.VITE_CONTATO_EMAIL || "").trim();
const RESEND_KEY = (process.env.RESEND_API_KEY || "").trim();

async function obterCorpo(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    if (req.body.nome || req.body.email || req.body.mensagem) return req.body;
  }
  if (typeof req.body === "string" && req.body.trim()) {
    return JSON.parse(req.body);
  }

  const bruto = await new Promise((resolver, rejeitar) => {
    const pedacos = [];
    req.on("data", (chunk) => pedacos.push(chunk));
    req.on("end", () => resolver(Buffer.concat(pedacos).toString("utf8")));
    req.on("error", rejeitar);
  });

  if (!bruto.trim()) return {};
  return JSON.parse(bruto);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, erro: "Método não permitido." });
    return;
  }

  if (!DESTINO) {
    res.status(500).json({
      ok: false,
      erro: "E-mail de destino não configurado (CONTATO_EMAIL).",
    });
    return;
  }

  if (!RESEND_KEY) {
    res.status(500).json({
      ok: false,
      erro: "Envio ainda não configurado (falta RESEND_API_KEY no Vercel).",
    });
    return;
  }

  try {
    const corpo = await obterCorpo(req);
    const nome = String(corpo.nome || "").trim();
    const email = String(corpo.email || "").trim();
    const mensagem = String(corpo.mensagem || "").trim();

    if (!nome || !email || !mensagem) {
      res.status(400).json({ ok: false, erro: "Preencha nome, e-mail e mensagem." });
      return;
    }

    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sorteio de Times <onboarding@resend.dev>",
        to: [DESTINO],
        reply_to: email,
        subject: `Contato Sorteio de Times — ${nome}`,
        text: `Nome: ${nome}\nE-mail: ${email}\n\n${mensagem}`,
      }),
    });

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      res.status(502).json({
        ok: false,
        erro: dados.message || "Falha ao enviar pelo serviço de e-mail.",
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
