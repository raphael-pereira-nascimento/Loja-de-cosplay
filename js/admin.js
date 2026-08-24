/* ============================================================
   CosplayHub — Painel administrativo (simulador educacional)
   Lê dados do localStorage e monta métricas fictícias.
   Senha demo: admin123
   ============================================================ */

const ADMIN_SENHA = "admin123";
const ADMIN_SESSAO = sessionStorage;

document.addEventListener("DOMContentLoaded", () => {
  wireLogin();
  if (ADMIN_SESSAO.getItem("ch_admin_ok") === "1") abrirPainel();
});

function wireLogin() {
  const form = document.getElementById("form-admin-login");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const senha = document.getElementById("senha-admin").value;
    const erro = document.getElementById("erro-senha");

    if (senha === ADMIN_SENHA) {
      erro.classList.add("d-none");
      ADMIN_SESSAO.setItem("ch_admin_ok", "1");
      showToast("Bem-vindo(a), admin!", "success");
      abrirPainel();
    } else {
      erro.classList.remove("d-none");
      document.getElementById("senha-admin").focus();
    }
  });
}

function sairAdmin() {
  ADMIN_SESSAO.removeItem("ch_admin_ok");
  location.reload();
}

function abrirPainel() {
  document.getElementById("portao-admin").classList.add("d-none");
  document.getElementById("conteudo-admin").classList.remove("d-none");
  renderMetricas();
  renderMaisVendidos();
  renderEstoqueBaixo();
  renderTabelaPedidos();
  renderTabelaUsuarios();
}

/* ---------------- Métricas ---------------- */

function renderMetricas() {
  const usuarios = getUsers();
  const todosPedidos = storeGet(KEYS.orders, []);
  const receita = todosPedidos.reduce((s, p) => s + p.valores.total, 0);
  const ticket = todosPedidos.length ? receita / todosPedidos.length : 0;
  const itensVendidos = todosPedidos.reduce(
    (s, p) => s + p.itens.reduce((s2, i) => s2 + i.qty, 0), 0
  );

  const cards = [
    { icone: "bi-people", cor: "text-success", valor: usuarios.length, rotulo: "clientes cadastrados" },
    { icone: "bi-receipt", cor: "text-info", valor: todosPedidos.length, rotulo: "pedidos realizados" },
    { icone: "bi-cash-stack", cor: "text-warning", valor: brl(receita), rotulo: "receita total" },
    { icone: "bi-graph-up-arrow", cor: "", valor: brl(ticket), rotulo: `ticket médio · ${itensVendidos} itens vendidos` },
  ];

  document.getElementById("cards-metricas").innerHTML = cards.map((c) => `
    <div class="col">
      <div class="stat-card p-4 h-100">
        <i class="bi ${c.icone} fs-3 ${c.cor}"></i>
        <h3 class="font-display fw-bold mt-2 mb-0">${c.valor}</h3>
        <small class="text-muted-2">${c.rotulo}</small>
      </div>
    </div>`).join("");
}

/* ---------------- Mais vendidos (barras) ---------------- */

function renderMaisVendidos() {
  const top5 = [...PRODUTOS].sort((a, b) => b.vendas - a.vendas).slice(0, 5);
  const maximo = top5[0] ? top5[0].vendas : 1;

  document.getElementById("lista-mais-vendidos").innerHTML = top5.map((p) => `
    <div class="bar-row">
      <span class="text-truncate" style="width:38%" title="${p.nome}">
        <a href="produto.html?id=${p.id}" class="text-decoration-none">${p.nome}</a>
      </span>
      <span class="bar-track">
        <span class="bar-fill d-block" style="width:${Math.max(8, Math.round((p.vendas / maximo) * 100))}%"></span>
      </span>
      <strong class="small text-nowrap">${p.vendas} vendas</strong>
    </div>`).join("");
}

/* ---------------- Estoque baixo ---------------- */

function renderEstoqueBaixo() {
  const criticos = PRODUTOS.filter((p) => p.estoque <= 10).sort((a, b) => a.estoque - b.estoque);

  document.getElementById("lista-estoque-baixo").innerHTML =
    criticos.length === 0
      ? '<p class="small text-muted-2 mb-0">Nenhum produto em estoque crítico.</p>'
      : criticos.slice(0, 6).map((p) => `
        <div class="bar-row">
          <span class="text-truncate" style="width:52%" title="${p.nome}">
            <a href="produto.html?id=${p.id}" class="text-decoration-none">${p.nome}</a>
          </span>
          <span class="ms-auto"><span class="badge rounded-pill text-bg-warning">${p.estoque} un.</span></span>
        </div>`).join("");
}

/* ---------------- Tabela de pedidos ---------------- */

function renderTabelaPedidos() {
  const pedidos = storeGet(KEYS.orders, [])
    .sort((a, b) => b.data.localeCompare(a.data));

  const corpo = document.getElementById("tabela-pedidos");
  const nota = document.getElementById("nota-pedidos");

  if (pedidos.length === 0) {
    corpo.innerHTML = `
      <tr><td colspan="5" class="text-center text-muted-2 py-4">
        Nenhum pedido registrado neste navegador ainda.
      </td></tr>`;
    nota.textContent = "";
    return;
  }

  corpo.innerHTML = pedidos.map((p) => {
    const cliente = nomeCliente(p.userId);
    return `
    <tr>
      <td><strong class="font-display">${p.numero}</strong></td>
      <td>${cliente}</td>
      <td>${new Date(p.data).toLocaleDateString("pt-BR")}</td>
      <td>${p.itens.reduce((s, i) => s + i.qty, 0)}</td>
      <td class="text-end fw-bold">${brl(p.valores.total)}</td>
    </tr>`;
  }).join("");

  nota.textContent = `Mostrando os ${Math.min(pedidos.length, pedidos.length)} últimos pedidos de todos os clientes deste navegador.`;
}

function nomeCliente(userId) {
  const user = getUsers().find((u) => u.id === userId);
  return user ? user.nome : `Usuário #${userId}`;
}

/* ---------------- Tabela de usuários ---------------- */

function renderTabelaUsuarios() {
  const usuarios = [...getUsers()].sort((a, b) => a.id - b.id);
  const pedidos = storeGet(KEYS.orders, []);

  document.getElementById("tabela-usuarios").innerHTML = usuarios.map((u, i) => {
    const qtdPedidos = pedidos.filter((p) => p.userId === u.id).length;
    return `
    <tr>
      <td class="text-muted-2">${i + 1}</td>
      <td><strong>${escapeHTML(u.nome)}</strong></td>
      <td>${escapeHTML(u.email)}</td>
      <td class="text-end">${qtdPedidos}</td>
    </tr>`;
  }).join("");
}
