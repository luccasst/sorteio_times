const DESTINO = (process.env.CONTATO_EMAIL || process.env.VITE_CONTATO_EMAIL || "").trim();

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

async function enviarComFormSubmit(destino, nome, email, mensagem) {
  const corpo = new URLSearchParams({
    name: nome,
    email,
    message: mensagem,
    _subject: `Contato Sorteio de Times — ${nome}`,
    _template: "table",
    _captcha: "false",
  });

  const resposta = await fetch(`https://formsubmit.co/ajax/${destino}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: corpo.toString(),
  });

  const texto = await resposta.text();
  let dados = {};
  try {
    dados = JSON.parse(texto);
  } catch {
    dados = { message: texto.slice(0, 200) };
  }

  const sucesso =
    resposta.ok &&
    dados.success !== false &&
    dados.success !== "false" &&
    !/invalid json/i.test(String(dados.message || ""));

  return { sucesso, dados, status: resposta.status };
}

async function enviarComResend(destino, nome, email, mensagem) {
  const chave = process.env.RESEND_API_KEY?.trim();
  if (!chave) return null;

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chave}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Sorteio de Times <onboarding@resend.dev>",
      to: [destino],
      reply_to: email,
      subject: `Contato Sorteio de Times — ${nome}`,
      text: `Nome: ${nome}\nE-mail: ${email}\n\n${mensagem}`,
    }),
  });

  const dados = await resposta.json().catch(() => ({}));
  return { sucesso: resposta.ok, dados, status: resposta.status };
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
    res.status(500).json({ ok: false, erro: "E-mail de destino não configurado no servidor." });
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

    const viaResend = await enviarComResend(DESTINO, nome, email, mensagem);
    if (viaResend?.sucesso) {
      res.status(200).json({ ok: true });
      return;
    }

    const viaForm = await enviarComFormSubmit(DESTINO, nome, email, mensagem);
    if (viaForm.sucesso) {
      res.status(200).json({ ok: true });
      return;
    }

    const detalhe = String(viaForm.dados?.message || viaResend?.dados?.message || "");
    const precisaAtivar = /activate|confirm|habilit|verif/i.test(detalhe);

    res.status(502).json({
      ok: false,
      erro: precisaAtivar
        ? "Abra seu Hotmail e confirme o e-mail de ativação do FormSubmit (veja também o spam). Depois tente de novo."
        : detalhe || "Não foi possível enviar a mensagem agora. Tente novamente em alguns minutos.",
    });
  } catch (erro) {
    res.status(500).json({
      ok: false,
      erro: erro instanceof Error ? erro.message : "Erro ao enviar a mensagem.",
    });
  }
}
