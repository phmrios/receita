// js/comum.js
// Utilidades compartilhadas pelas páginas: mensagens na tela, copiar, imprimir e modo offline.

// Mostra uma mensagem dentro da página (substitui alert()).
// tipo: "erro" | "aviso" | "ok"
export function mostrarMensagem(el, texto, tipo = "erro") {
  if (!el) return;
  el.textContent = texto;
  el.className = `mensagem mensagem-${tipo}`;
  el.hidden = !texto;
}

export function mostrarLista(el, itens, tipo = "aviso") {
  if (!el) return;
  el.replaceChildren();
  el.className = `mensagem mensagem-${tipo}`;
  el.hidden = itens.length === 0;
  if (!itens.length) return;
  const ul = document.createElement("ul");
  for (const t of itens) {
    const li = document.createElement("li");
    li.textContent = t;
    ul.appendChild(li);
  }
  el.appendChild(ul);
}

export async function copiarTexto(texto, statusEl) {
  if (!texto.trim()) {
    mostrarMensagem(statusEl, "Nada para copiar ainda.", "aviso");
    return;
  }
  try {
    await navigator.clipboard.writeText(texto.trim());
    mostrarMensagem(statusEl, "Copiado!", "ok");
  } catch {
    mostrarMensagem(statusEl, "Não foi possível copiar. Selecione o texto e copie manualmente.", "erro");
  }
  setTimeout(() => mostrarMensagem(statusEl, ""), 2500);
}

// Imprime apenas o elemento indicado.
export function imprimirElemento(el) {
  el.classList.add("area-impressao");
  document.body.classList.add("imprimindo");
  window.print();
  document.body.classList.remove("imprimindo");
  el.classList.remove("area-impressao");
}

// Liga os botões [data-copiar="#id"] e [data-imprimir="#id"] da página.
export function ligarBotoesDeSaida(statusEl) {
  document.querySelectorAll("[data-copiar]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const alvo = document.querySelector(btn.dataset.copiar);
      copiarTexto(alvo.textContent, statusEl || btn.parentElement.querySelector(".mensagem"));
    }),
  );
  document.querySelectorAll("[data-imprimir]").forEach((btn) =>
    btn.addEventListener("click", () => imprimirElemento(document.querySelector(btn.dataset.imprimir))),
  );
}

// Modo offline (PWA): guarda o site no aparelho depois do primeiro acesso.
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch((err) => console.warn("Service worker:", err));
}
