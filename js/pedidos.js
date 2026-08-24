/* ============================================================
   CosplayHub — Histórico de pedidos
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin("pedidos.html")) return;
  renderPedidos();
});

function renderPedidos() {
  const pedidos = getOrders().sort((a, b) => b.data.localeCompare(a.data));
  const lista = document.getElementById("lista-pedidos");
  const vazio = document.getElementById("sem-pedidos");
  const contador = document.getElementById("contador-pedidos");

  if (pedidos.length === 0) {
    vazio.classList.remove("d-none");
    contador.textContent = "Você ainda não realizou nenhum pedido.";
    return;
  }

  vazio.classList.add("d-none");
  contador.textContent =
    pedidos.length === 1 ? "1 pedido realizado." : `${pedidos.length} pedidos realizados.`;

  lista.innerHTML = pedidos.map(pedidoCardHTML).join("");
  aplicarReveals();
}

function statusPedido(dataIso) {
  const dias = (Date.now() - new Date(dataIso)) / 86400000;
  if (dias >= 7) return { label: "Entregue", cor: "success", icone: "bi-house-check-fill" };
  if (dias >= 5) return { label: "Em trânsito", cor: "info", icone: "bi-truck" };
  if (dias >= 3) return { label: "Enviado", cor: "primary", icone: "bi-send-fill" };
  if (dias >= 2) return { label: "Em separação", cor: "warning", icone: "bi-boxes" };
  return { label: "Pagamento aprovado", cor: "success", icone: "bi-check-circle-fill" };
}

/* ---------------- Rastreamento simulado ---------------- */

const ETAPAS_RASTREIO = [
  { label: "Pedido confirmado", icone: "bi-receipt-cutoff" },
  { label: "Pagamento aprovado", icone: "bi-check-circle" },
  { label: "Em separação no centro de distribuição", icone: "bi-boxes" },
  { label: "Enviado à transportadora", icone: "bi-send" },
  { label: "Em trânsito para sua cidade", icone: "bi-truck" },
  { label: "Entregue", icone: "bi-house-check" },
];

function timelineHTML(p) {
  const dias = (Date.now() - new Date(p.data)) / 86400000;

  let atualMarcada = false;
  const itens = ETAPAS_RASTREIO.map((etapa, i) => {
    const feito = [true, dias >= 0.02, dias >= 2, dias >= 3, dias >= 5, dias >= 7][i];
    let estado;
    if (feito) {
      estado = "done";
    } else if (!atualMarcada) {
      estado = "atual";
      atualMarcada = true;
    } else {
      estado = "pendente";
    }

    const nota =
      estado === "done"
        ? "Concluído"
        : estado === "atual"
          ? "Etapa em andamento…"
          : "Aguardando";

    return `
    <li class="${estado}">
      <span class="timeline-dot">${feito ? '<i class="bi bi-check-lg"></i>' : ""}</span>
      <strong class="small d-block"><i class="bi ${etapa.icone} me-1"></i>${etapa.label}</strong>
      <small class="text-muted-2">${nota}</small>
    </li>`;
  }).join("");

  const codigo = `CH${String(Math.abs(hashDemo(p.numero)).toString().slice(0, 9)).padStart(9, "7")}`;
  return `
  <ul class="timeline">${itens}</ul>
  <div class="small text-muted-2 border-top border-subtle pt-2 mt-1">
    <i class="bi bi-upc-scan me-1"></i>Código de rastreio simulado: <strong class="font-display">${codigo}</strong>
  </div>`;
}

function pedidoCardHTML(p) {
  const status = statusPedido(p.data);
  const data = new Date(p.data).toLocaleString("pt-BR");
  const metodo =
    p.pagamento.metodo === "cartao"
      ? `Cartão · ${p.pagamento.parcelas}x`
      : p.pagamento.metodo.toUpperCase();

  return `
  <article class="filter-card overflow-hidden">
    <header class="bg-surface-2 border-bottom border-subtle px-4 py-3 d-flex flex-wrap justify-content-between align-items-center gap-2 small">
      <div>
        <span class="text-muted-2 d-block">Pedido</span>
        <strong class="font-display fs-6">${p.numero}</strong>
      </div>
      <div>
        <span class="text-muted-2 d-block">Data</span>
        <strong>${data}</strong>
      </div>
      <div>
        <span class="text-muted-2 d-block">Total</span>
        <strong>${brl(p.valores.total)}</strong>
      </div>
      <div>
        <span class="text-muted-2 d-block">Pagamento</span>
        <strong>${metodo}</strong>
      </div>
      <span class="badge rounded-pill text-bg-${status.cor} px-3 py-2">
        <i class="bi ${status.icone} me-1"></i>${status.label}
      </span>
    </header>

    <div class="p-4">
      <div class="row g-3">
        ${p.itens
          .map((item) => {
            const produto = buscarProduto(item.id);
            return `
          <div class="col-md-6 col-xl-4">
            <div class="d-flex gap-3 align-items-center">
              ${
                produto
                  ? `<a href="produto.html?id=${item.id}"><img src="${imagemPrincipal(produto)}"
                      alt="${item.nome}" width="52" height="64" class="rounded-3 border-subtle"
                      style="object-fit:cover" loading="lazy"
                      onerror="this.onerror=null;this.src='${fallbackImagem(item.id + "-pd")}'"></a>`
                  : ""
              }
              <div class="small flex-grow-1">
                <strong class="d-block text-truncate">${item.nome}</strong>
                <span class="text-muted-2">${item.qty}x · Tam: ${item.tamanho}</span>
              </div>
            </div>
          </div>`;
          })
          .join("")}
      </div>

      <div class="small text-muted-2 mt-3 pt-3 border-top border-subtle">
        <i class="bi bi-geo-alt me-1"></i>
        Entrega para: ${p.endereco.rua}, ${p.endereco.numero}${p.endereco.complemento ? " — " + p.endereco.complemento : ""}
        · ${p.endereco.bairro}, ${p.endereco.cidade}/${p.endereco.uf}
        · Prazo: ${p.entrega.prazo}
      </div>

      <button class="btn btn-outline-brand btn-sm tracking-toggle mt-3" type="button"
        data-bs-toggle="collapse" data-bs-target="#rastreio-${p.numero}" aria-expanded="false"
        aria-controls="rastreio-${p.numero}">
        <i class="bi bi-signpost-split me-1"></i>Rastrear pedido
      </button>
      <div class="collapse mt-3" id="rastreio-${p.numero}">
        <div class="bg-surface-2 border-subtle rounded-3 p-3 ps-4 pt-4">
          ${timelineHTML(p)}
        </div>
      </div>
    </div>
  </article>`;
}
