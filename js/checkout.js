/* ============================================================
   CosplayHub — Fluxo de checkout em 3 etapas
   ============================================================ */

const FRETE_OPCOES = {
  economico: { label: "Econômico", valor: 19.9, prazo: "7 a 10 dias úteis" },
  expresso: { label: "Expresso", valor: 34.9, prazo: "2 a 4 dias úteis" },
  retirada: { label: "Retirada na loja", valor: 0, prazo: "Pronto em 3 dias úteis" },
};

const JUROS_MENSAL = 0.015;

const estado = {
  etapa: 1,
  telefone: "",
  endereco: {},
  frete: "economico",
  pagamento: "pix",
  parcelas: 1,
};

document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin("checkout.html")) return;

  const itens = cartDetailed();
  if (itens.length === 0) {
    document.getElementById("carrinho-vazio-checkout").classList.remove("d-none");
    document.title = "Carrinho vazio | CosplayHub";
    return;
  }

  iniciarCheckout();
});

function iniciarCheckout() {
  preencherUsuario();
  montarParcelas();
  wireMascaras();
  wireNavegacao();
  wireOpcoes();
  renderMiniItens();
  atualizarResumo();
  document.getElementById("checkout-conteudo").classList.remove("d-none");
}

/* ---------------- Etapa 1 ---------------- */

function preencherUsuario() {
  const sessao = getSession();
  const iniciais = sessao.nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  document.getElementById("avatar-usuario").textContent = iniciais;
  document.getElementById("nome-usuario").textContent = sessao.nome;
  document.getElementById("email-usuario").textContent = sessao.email;
}

/* ---------------- Navegação entre etapas ---------------- */

function wireNavegacao() {
  document.querySelectorAll("[data-proxima-etapa]").forEach((btn) =>
    btn.addEventListener("click", () => {
      irParaEtapa(Number(btn.dataset.proximaEtapa));
    })
  );

  document.getElementById("btn-confirmar-pedido").addEventListener("click", confirmarPedido);
}

function irParaEtapa(destino) {
  if (destino > estado.etapa && !validarEtapa(estado.etapa)) return;

  if (destino === 1 && estado.etapa === 1) {
    estado.telefone = document.getElementById("input-telefone").value;
  }
  if (destino === 3 && estado.etapa === 2) {
    capturarEndereco();
  }

  estado.etapa = destino;

  for (let i = 1; i <= 4; i++) {
    const secao =
      i === 4
        ? document.getElementById("etapa-sucesso")
        : document.getElementById(`etapa-${i}`);
    secao.classList.toggle("d-none", i !== destino);
  }

  if (destino < 4) {
    document.querySelectorAll("#steps-indicador .step").forEach((stepEl) => {
      const numero = Number(stepEl.dataset.step);
      const circle = stepEl.querySelector(".step-circle");
      const origIcon = circle.dataset.icon;
      stepEl.classList.toggle("current", numero === destino);
      stepEl.classList.toggle("done", numero < destino);
      circle.innerHTML = numero < destino
        ? '<i class="bi bi-check-lg"></i>'
        : `<i class="bi ${origIcon}"></i>`;
    });

    if (destino === 3) {
      renderRevisao();
      atualizarResumo();
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validarEtapa(etapa) {
  if (etapa === 1) {
    const telefone = document.getElementById("input-telefone");
    const ok = /^\(\d{2}\) \d{5}-\d{4}$/.test(telefone.value.trim());
    telefone.classList.toggle("is-invalid", !ok);
    if (!ok) showToast("Informe um telefone válido com DDD.", "warning");
    return ok;
  }

  if (etapa === 2) {
    const form = document.getElementById("form-etapa-2");
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      showToast("Preencha todos os campos obrigatórios de entrega.", "warning");
      return false;
    }
    return true;
  }

  if (etapa === 3) {
    if (estado.pagamento !== "cartao") return true;
    const form = document.getElementById("form-cartao");
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      showToast("Preencha os dados do cartão corretamente.", "warning");
      return false;
    }
    return true;
  }

  return true;
}

function capturarEndereco() {
  estado.endereco = {
    cep: document.getElementById("input-cep").value,
    rua: document.getElementById("input-rua").value.trim(),
    numero: document.getElementById("input-numero").value.trim(),
    complemento: document.getElementById("input-complemento").value.trim(),
    bairro: document.getElementById("input-bairro").value.trim(),
    cidade: document.getElementById("input-cidade").value.trim(),
    uf: document.getElementById("input-uf").value,
  };
}

/* ---------------- Máscaras e simulações ---------------- */

function wireMascaras() {
  const telefone = document.getElementById("input-telefone");
  telefone.addEventListener("input", () => {
    let v = telefone.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, v.length > 10 ? 7 : 6)}-${v.slice(v.length > 10 ? 7 : 6)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    telefone.value = v;
  });

  const cep = document.getElementById("input-cep");
  cep.addEventListener("input", () => {
    cep.value = cep.value
      .replace(/\D/g, "")
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, "$1-$2");
  });
  cep.addEventListener("blur", simularBuscaCEP);

  const cartaoNumero = document.getElementById("cartao-numero");
  cartaoNumero.addEventListener("input", () => {
    cartaoNumero.value = cartaoNumero.value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ");
  });

  const validade = document.getElementById("cartao-validade");
  validade.addEventListener("input", () => {
    let v = validade.value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    validade.value = v;
  });

  document.getElementById("cartao-cvv").addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 4);
  });

  document.getElementById("cartao-nome").addEventListener("input", function () {
    this.value = this.value.replace(/[0-9]/g, "").toUpperCase();
  });
}

function simularBuscaCEP() {
  const cep = document.getElementById("input-cep");
  const digitos = cep.value.replace(/\D/g, "");
  if (digitos.length !== 8) return;

  if (!document.getElementById("input-rua").value) {
    document.getElementById("input-rua").value = "Avenida dos Heróis";
    document.getElementById("input-bairro").value = "Vila Nerd";
    document.getElementById("input-cidade").value = "São Paulo";
    document.getElementById("input-uf").value = "SP";
    showToast("Endereço preenchido automaticamente (simulação).", "info");
  }
}

/* ---------------- Opções de frete/pagamento ---------------- */

function wireOpcoes() {
  document.querySelectorAll('input[name="frete"]').forEach((radio) =>
    radio.addEventListener("change", () => {
      estado.frete = radio.value;
      atualizarResumo();
    })
  );

  document.querySelectorAll('input[name="pagamento"]').forEach((radio) =>
    radio.addEventListener("change", () => {
      estado.pagamento = radio.value;
      if (estado.pagamento === "cartao" && estado.parcelas === 1) estado.parcelas = 1;
      alternarBoxPagamento();
      atualizarResumo();
    })
  );

  document.getElementById("cartao-parcelas").addEventListener("change", (e) => {
    estado.parcelas = Number(e.target.value);
    atualizarResumo();
  });
}

function alternarBoxPagamento() {
  document.getElementById("box-cartao").classList.toggle("d-none", estado.pagamento !== "cartao");
  document.getElementById("box-pix").classList.toggle("d-none", estado.pagamento !== "pix");
  document.getElementById("box-boleto").classList.toggle("d-none", estado.pagamento !== "boleto");
}

function montarParcelas() {
  const select = document.getElementById("cartao-parcelas");
  select.innerHTML = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const semJuros = n <= 3;
    return `<option value="${n}" ${n === 1 ? "selected" : ""}>
      ${n}x de <span data-parcela="${n}"></span> ${semJuros ? "(sem juros)" : "(com juros)"}
    </option>`;
  }).join("");
}

/* ---------------- Cálculos ---------------- */

function calcularValores() {
  const itens = cartDetailed();
  const subtotal = cartSubtotal();
  const cupom = storeGet(KEYS.coupon, null);
  const regraCupom = cupom && CUPONS[cupom] ? CUPONS[cupom] : null;

  const descontoCupom = regraCupom && regraCupom.tipo === "percentual"
    ? (subtotal * regraCupom.valor) / 100
    : 0;

  const freteGratisAplicado =
    subtotal >= FRETE_GRATIS_LIMITE ||
    (regraCupom && regraCupom.tipo === "frete");

  const opcaoFrete = FRETE_OPCOES[estado.frete];
  const valorFrete =
    estado.frete === "retirada" || freteGratisAplicado ? 0 : opcaoFrete.valor;

  const base = subtotal - descontoCupom + valorFrete;

  let descontoPix = 0;
  let juros = 0;
  if (estado.pagamento === "pix") {
    descontoPix = base * 0.05;
  } else if (estado.pagamento === "cartao" && estado.parcelas > 3) {
    juros = base * JUROS_MENSAL * (estado.parcelas - 3);
  }

  const total = base - descontoPix + juros;

  return { itens, subtotal, base, descontoCupom, freteGratisAplicado, valorFrete, descontoPix, juros, total };
}

/* ---------------- Renderização ---------------- */

function renderMiniItens() {
  const { itens } = calcularValores();
  document.getElementById("mini-itens").innerHTML = itens
    .map(
      (p) => `
    <div class="d-flex gap-3 align-items-center">
      <img src="${imagemPrincipal(p)}" alt="${p.nome}" width="52" height="64"
        class="rounded-3 border-subtle" style="object-fit:cover"
        onerror="this.onerror=null;this.src='${fallbackImagem(p.id + "-ck")}'">
      <div class="flex-grow-1 small">
        <strong class="d-block text-truncate">${p.nome}</strong>
        <span class="text-muted-2">${p.qty}x · Tam: ${p.tamanho}</span>
      </div>
      <strong class="small">${brl(p.linhaTotal)}</strong>
    </div>`
    )
    .join("");
}

function renderRevisao() {
  const box = document.getElementById("box-revisao");
  const opcaoFrete = FRETE_OPCOES[estado.frete];

  const metodoLabel = { pix: "Pix (5% OFF)", cartao: `Cartão de crédito (${estado.parcelas}x)`, boleto: "Boleto bancário" };
  const e = estado.endereco;

  box.innerHTML = `
    <div class="row g-4 small">
      <div class="col-md-6">
        <p class="fw-bold mb-1"><i class="bi bi-person me-1"></i>Cliente</p>
        <p class="text-muted-2 mb-0">${getSession().nome}<br>${estado.telefone || "(telefone não informado)"}</p>
      </div>
      <div class="col-md-6">
        <p class="fw-bold mb-1"><i class="bi bi-truck me-1"></i>Entrega — ${opcaoFrete.label}</p>
        <p class="text-muted-2 mb-0">
          ${e.rua}, ${e.numero}${e.complemento ? " — " + e.complemento : ""}<br>
          ${e.bairro} · ${e.cidade}/${e.uf} · CEP ${e.cep}
        </p>
      </div>
      <div class="col-md-6">
        <p class="fw-bold mb-1"><i class="bi bi-credit-card me-1"></i>Pagamento</p>
        <p class="text-muted-2 mb-0">${metodoLabel[estado.pagamento]}</p>
      </div>
      <div class="col-md-6">
        <p class="fw-bold mb-1"><i class="bi bi-clock-history me-1"></i>Prazo estimado</p>
        <p class="text-muted-2 mb-0">${opcaoFrete.prazo}</p>
      </div>
    </div>`;
}

function atualizarResumo() {
  const v = calcularValores();
  const opcaoFrete = FRETE_OPCOES[estado.frete];

  document.querySelectorAll("[data-preco-frete]").forEach((el) => {
    const codigo = el.dataset.precoFrete;
    el.innerHTML =
      codigo !== "retirada" && v.freteGratisAplicado
        ? '<span class="text-success">GRÁTIS</span>'
        : brl(FRETE_OPCOES[codigo].valor);
  });

  document.getElementById("ck-subtotal").textContent = brl(v.subtotal);

  const linhaCupom = document.getElementById("ck-linha-cupom");
  if (v.descontoCupom > 0) {
    linhaCupom.classList.remove("d-none");
    document.getElementById("ck-cupom-codigo").textContent = storeGet(KEYS.coupon, "");
    document.getElementById("ck-desconto-cupom").textContent = `- ${brl(v.descontoCupom)}`;
  } else {
    linhaCupom.classList.add("d-none");
  }

  document.getElementById("ck-frete").innerHTML = v.valorFrete === 0
    ? '<span class="text-success fw-semibold">GRÁTIS</span>'
    : brl(v.valorFrete);

  const linhaPix = document.getElementById("ck-linha-pix");
  linhaPix.classList.toggle("d-none", v.descontoPix === 0);
  if (v.descontoPix > 0) document.getElementById("ck-desconto-pix").textContent = `- ${brl(v.descontoPix)}`;

  const linhaJuros = document.getElementById("ck-linha-juros");
  linhaJuros.classList.toggle("d-none", v.juros === 0);
  if (v.juros > 0) {
    document.getElementById("ck-parcelas-juros").textContent = estado.parcelas;
    document.getElementById("ck-valor-juros").textContent = brl(v.juros);
  }

  document.getElementById("ck-total").textContent = brl(v.total);

  const info = document.getElementById("ck-parcela-info");
  if (estado.pagamento === "pix") {
    info.textContent = `Aprovação imediata via Pix.`;
  } else if (estado.pagamento === "cartao") {
    info.textContent = `${estado.parcelas}x de ${brl(v.total / estado.parcelas)}${estado.parcelas <= 3 ? " sem juros" : " com juros"}.`;
  } else {
    info.textContent = "Boleto vence em até 3 dias úteis.";
  }

  atualizarOpcoesParcelas(v.base);
}

function atualizarOpcoesParcelas(baseSemJuros) {
  if (estado.pagamento !== "cartao") return;
  document.querySelectorAll("#cartao-parcelas option").forEach((option) => {
    const n = Number(option.value);
    const comJuros = n > 3 ? baseSemJuros * (1 + JUROS_MENSAL * (n - 3)) : baseSemJuros;
    option.querySelector(`[data-parcela="${n}"]`).textContent = brl(comJuros / n);
  });
}

/* ---------------- Confirmação ---------------- */

function confirmarPedido() {
  if (!validarEtapa(3)) return;
  if (cartDetailed().length === 0) {
    showToast("Seu carrinho está vazio.", "danger");
    return;
  }

  const v = calcularValores();
  const sessao = getSession();
  const opcaoFrete = FRETE_OPCOES[estado.frete];
  const agora = new Date();

  const pedido = {
    numero: "CH" + String(Date.now()).slice(-8),
    data: agora.toISOString(),
    userId: sessao.id,
    cliente: { nome: sessao.nome, email: sessao.email, telefone: estado.telefone },
    itens: v.itens.map((p) => ({ id: p.id, nome: p.nome, tamanho: p.tamanho, qty: p.qty, preco: p.preco })),
    endereco: estado.endereco,
    entrega: { ...opcaoFrete, codigo: estado.frete },
    pagamento: {
      metodo: estado.pagamento,
      parcelas: estado.pagamento === "cartao" ? estado.parcelas : 1,
    },
    valores: {
      subtotal: v.subtotal,
      descontoCupom: v.descontoCupom,
      frete: v.valorFrete,
      descontoPix: v.descontoPix,
      juros: v.juros,
      total: v.total,
    },
  };

  v.itens.forEach((item) => {
    const prod = buscarProduto(item.id);
    if (prod) prod.estoque = Math.max(0, prod.estoque - item.qty);
  });

  const pedidos = storeGet(KEYS.orders, []);
  pedidos.push(pedido);
  storeSet(KEYS.orders, pedidos);

  clearCart();
  localStorage.removeItem(KEYS.coupon);

  document.getElementById("resumo-sucesso").innerHTML = `
    <div class="row g-3 text-start small">
      <div class="col-sm-6"><span class="text-muted-2 d-block">Número do pedido</span><strong class="fs-6 font-display">${pedido.numero}</strong></div>
      <div class="col-sm-6"><span class="text-muted-2 d-block">Data</span><strong>${agora.toLocaleString("pt-BR")}</strong></div>
      <div class="col-sm-6"><span class="text-muted-2 d-block">Pagamento</span><strong>${pedido.pagamento.metodo.toUpperCase()}${pedido.pagamento.metodo === "cartao" ? ` · ${pedido.pagamento.parcelas}x` : ""}</strong></div>
      <div class="col-sm-6"><span class="text-muted-2 d-block">Total pago</span><strong class="fs-6 text-success">${brl(pedido.valores.total)}</strong></div>
      <div class="col-12"><span class="text-muted-2 d-block">Entrega prevista</span><strong>${opcaoFrete.prazo} · ${pedido.endereco.cidade}/${pedido.endereco.uf}</strong></div>
    </div>`;

  document.getElementById("aside-resumo").classList.add("d-none");
  document.getElementById("steps-indicador").classList.add("d-none");
  irParaEtapa(4);
  updateBadges();
}
