/* ============================================================
   CosplayHub — Página do carrinho
   ============================================================ */

let cupomAtivo = null;

document.addEventListener("DOMContentLoaded", () => {
  const salvo = storeGet(KEYS.coupon, null);
  if (salvo && CUPONS[salvo]) cupomAtivo = salvo;

  wireEventos();
  renderCarrinho();
});

function wireEventos() {
  document.getElementById("form-cupom").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("input-cupom");
    const codigo = input.value.trim().toUpperCase();
    const erro = document.getElementById("cupom-erro");

    if (!CUPONS[codigo]) {
      erro.classList.remove("d-none");
      return;
    }
    erro.classList.add("d-none");
    cupomAtivo = codigo;
    storeSet(KEYS.coupon, codigo);
    showToast(`Cupom ${codigo} aplicado com sucesso!`, "success");
    renderCarrinho();
  });

  document.getElementById("btn-limpar-carrinho").addEventListener("click", () => {
    clearCart();
    localStorage.removeItem(KEYS.coupon);
    cupomAtivo = null;
    showToast("Carrinho esvaziado.", "info");
    renderCarrinho();
  });

  document.getElementById("lista-itens").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-acao]");
    if (!btn) return;
    const { acao, id, tamanho } = btn.dataset;
    const itens = cartItems();
    const item = itens.find((i) => i.id === Number(id) && i.tamanho === tamanho);
    if (!item) return;
    const produto = buscarProduto(Number(id));

    if (acao === "mais") {
      setQtyItem(Number(id), tamanho, item.qty + 1);
      if (item.qty + 1 > produto.estoque) showToast(`Estoque máximo: ${produto.estoque}.`, "warning");
    } else if (acao === "menos") {
      if (item.qty <= 1) {
        removeItemCart(Number(id), tamanho);
        showToast("Item removido do carrinho.", "info");
      } else {
        setQtyItem(Number(id), tamanho, item.qty - 1);
      }
    } else if (acao === "remover") {
      removeItemCart(Number(id), tamanho);
      showToast("Item removido do carrinho.", "info");
    }
    renderCarrinho();
  });
}

/* ---------------- Renderização ---------------- */

function renderCarrinho() {
  const itens = cartDetailed();
  const vazio = document.getElementById("carrinho-vazio");
  const cheio = document.getElementById("carrinho-cheio");

  if (itens.length === 0) {
    vazio.classList.remove("d-none");
    cheio.classList.add("d-none");
    return;
  }

  vazio.classList.add("d-none");
  cheio.classList.remove("d-none");

  renderBarraFrete();
  renderLista(itens);
  renderCupom();
  renderResumo(itens);
}

function renderBarraFrete() {
  const box = document.getElementById("barra-frete-box");
  const subtotal = cartSubtotal();

  if (subtotal >= FRETE_GRATIS_LIMITE) {
    box.innerHTML = `
      <div class="d-flex align-items-center gap-2 text-success small mb-0">
        <i class="bi bi-truck fs-5"></i>
        <span><strong>Parabéns!</strong> Você ganhou <strong>frete grátis</strong> neste pedido. 🎉</span>
      </div>`;
    return;
  }

  const falta = FRETE_GRATIS_LIMITE - subtotal;
  const pct = Math.min(100, Math.round((subtotal / FRETE_GRATIS_LIMITE) * 100));
  box.innerHTML = `
    <div class="d-flex align-items-center gap-2 small mb-2">
      <i class="bi bi-truck fs-5" style="color:#c4b5fd"></i>
      <span>Faltam apenas <strong class="text-white">${brl(falta)}</strong> para você ganhar <strong>frete grátis</strong>!</span>
    </div>
    <div class="progress" style="height:8px;background:rgba(255,255,255,.07)">
      <div class="progress-bar" role="progressbar" style="width:${pct}%;background:var(--ch-gradient)"
        aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
    </div>`;
}

function renderLista(itens) {
  const lista = document.getElementById("lista-itens");

  lista.innerHTML = itens
    .map(
      (p) => `
    <div class="filter-card p-3">
      <div class="d-flex gap-3">

        <a href="produto.html?id=${p.id}" class="flex-shrink-0">
          <img src="${imagemProduto(p, 0, 200, 250)}" alt="${p.nome}" class="cart-item-img"
            onerror="this.onerror=null;this.src='${fallbackImagem(p.id + "-mini", 184, 220)}'">
        </a>

        <div class="flex-grow-1 d-flex flex-column">
          <div class="d-flex justify-content-between gap-2">
            <div>
              <small class="text-uppercase fw-semibold" style="font-size:.64rem;color:#a78bfa">${nomeCategoria(p.categoria)}</small>
              <h6 class="mb-1 mt-1"><a href="produto.html?id=${p.id}" class="text-decoration-none text-white">${p.nome}</a></h6>
              <small class="text-muted-2">Tamanho: <strong class="text-white">${p.tamanho}</strong></small>
            </div>
            <button type="button" class="btn-close btn-close-white opacity-50" data-acao="remover"
              data-id="${p.id}" data-tamanho="${p.tamanho}" aria-label="Remover item"></button>
          </div>

          <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mt-auto pt-2">
            <div class="input-group input-group-sm qty-input">
              <button type="button" class="btn btn-outline-brand" data-acao="menos"
                data-id="${p.id}" data-tamanho="${p.tamanho}" aria-label="Diminuir">
                <i class="bi bi-dash-lg"></i>
              </button>
              <input type="text" class="form-control text-center bg-surface-2" value="${p.qty}" readonly aria-label="Quantidade">
              <button type="button" class="btn btn-outline-brand" data-acao="mais"
                data-id="${p.id}" data-tamanho="${p.tamanho}" aria-label="Aumentar">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
            <div class="text-end">
              <small class="text-muted-2 d-block">${brl(p.preco)} cada</small>
              <strong>${brl(p.linhaTotal)}</strong>
            </div>
          </div>
        </div>

      </div>
    </div>`
    )
    .join("");
}

function renderCupom() {
  const box = document.getElementById("cupom-aplicado-box");
  const chip = document.getElementById("cupom-aplicado-chip");

  if (cupomAtivo) {
    box.classList.remove("d-none");
    const regra = CUPONS[cupomAtivo];
    const descricao = regra.tipo === "percentual" ? `${regra.valor}% de desconto` : "frete grátis";
    chip.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i>${cupomAtivo} — ${descricao}
      <i class="bi bi-x-lg ms-1" role="button" id="remover-cupom" title="Remover cupom"></i>`;
    document.getElementById("remover-cupom").addEventListener("click", () => {
      cupomAtivo = null;
      localStorage.removeItem(KEYS.coupon);
      document.getElementById("input-cupom").value = "";
      showToast("Cupom removido.", "info");
      renderCarrinho();
    });
  } else {
    box.classList.add("d-none");
  }
}

function calcularDescontoCupom(subtotal) {
  if (!cupomAtivo) return 0;
  const regra = CUPONS[cupomAtivo];
  if (regra.tipo !== "percentual") return 0;
  return (subtotal * regra.valor) / 100;
}

function renderResumo(itens) {
  const subtotal = cartSubtotal();
  const desconto = calcularDescontoCupom(subtotal);
  const total = subtotal - desconto;
  const qtdItens = itens.reduce((soma, p) => soma + p.qty, 0);

  document.getElementById("resumo-qtd-itens").textContent = qtdItens;
  document.getElementById("resumo-subtotal").textContent = brl(subtotal);
  document.getElementById("resumo-total").textContent = brl(total);
  document.getElementById("resumo-parcelas").textContent =
    `Em até 3x de ${brl(total / 3)} sem juros`;

  const linhaDesconto = document.getElementById("linha-desconto-cupom");
  if (desconto > 0) {
    linhaDesconto.classList.remove("d-none");
    document.getElementById("resumo-desconto").textContent = `- ${brl(desconto)}`;
  } else {
    linhaDesconto.classList.add("d-none");
  }

  const freteEl = document.getElementById("resumo-frete");
  if (subtotal >= FRETE_GRATIS_LIMITE || (cupomAtivo && CUPONS[cupomAtivo].tipo === "frete")) {
    freteEl.innerHTML = '<span class="text-success fw-semibold">GRÁTIS</span>';
  } else {
    freteEl.textContent = "Calculado no checkout";
  }
}
