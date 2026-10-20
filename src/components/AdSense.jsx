import { useEffect, useRef } from "react";

const CLIENT =
  import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "ca-pub-5667962475948987";
const SLOT = import.meta.env.VITE_ADSENSE_SLOT?.trim() || "";

function carregarScript(client) {
  const id = "adsense-script";
  if (document.querySelector(`script[src*="adsbygoogle.js"]`)) {
    return Promise.resolve();
  }

  return new Promise((resolver, rejeitar) => {
    const script = document.createElement("script");
    script.id = id;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    script.onload = () => resolver();
    script.onerror = () => rejeitar(new Error("Não foi possível carregar o AdSense."));
    document.head.appendChild(script);
  });
}

/**
 * Anúncio do Google AdSense.
 * Só renderiza se VITE_ADSENSE_CLIENT e VITE_ADSENSE_SLOT estiverem definidos.
 * A chave (ex.: id do sorteio) força um novo pedido de anúncio a cada resultado.
 */
export default function AdSense({ slot = SLOT, formato = "auto", chave = "padrao" }) {
  const elemento = useRef(null);
  const configurado = Boolean(CLIENT && slot);

  useEffect(() => {
    if (!configurado) return undefined;
    let cancelado = false;

    carregarScript(CLIENT)
      .then(() => {
        if (cancelado || !elemento.current) return;
        try {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
        } catch {
          // O AdSense pode falhar em localhost ou antes da aprovação.
        }
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [configurado, chave, slot]);

  if (!configurado) {
    if (!import.meta.env.DEV) return null;
    return (
      <aside className="anuncio anuncio-demo" aria-label="Espaço de anúncio">
        <p>Anúncio (demo)</p>
        <span>Defina VITE_ADSENSE_CLIENT e VITE_ADSENSE_SLOT no .env para ativar o AdSense.</span>
      </aside>
    );
  }

  return (
    <aside className="anuncio" aria-label="Anúncio">
      <ins
        key={chave}
        ref={elemento}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={formato}
        data-full-width-responsive="true"
      />
    </aside>
  );
}

export function adsenseAtivo() {
  return Boolean(CLIENT && SLOT);
}
