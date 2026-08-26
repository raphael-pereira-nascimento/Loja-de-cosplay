/* ============================================================
   CosplayHub — Núcleo compartilhado
   Armazenamento, carrinho, favoritos, sessão, header e footer
   ============================================================ */

const KEYS = {
  users: "ch_users",
  session: "ch_session",
  cart: "ch_cart",
  favs: "ch_favs",
  coupon: "ch_coupon",
  orders: "ch_orders",
  recentes: "ch_recentes",
  reviews: "ch_reviews",
  newsletter: "ch_newsletter",
  compare: "ch_compare",
};

const FRETE_GRATIS_LIMITE = 499;
const CUPONS = {
  COSPLAY10: { tipo: "percentual", valor: 10 },
  FRETEGRATIS: { tipo: "frete", valor: 0 },
  BIRTHDAY15: { tipo: "percentual", valor: 15 },
};

/* ---------------- Utilidades ---------------- */

function brl(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function param(nome) {
  return new URLSearchParams(location.search).get(nome);
}

function storeGet(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto === null ? padrao : JSON.parse(bruto);
  } catch {
    return padrao;
  }
}

function storeSet(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function hashDemo(texto) {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = (h * 33) ^ texto.charCodeAt(i);
  return String(h >>> 0);
}

function escapeHTML(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

/* ---------------- Carrinho ---------------- */

function cartItems() {
  return storeGet(KEYS.cart, []);
}

function cartDetailed() {
  return cartItems()
    .map((item) => {
      const produto = buscarProduto(item.id);
      if (!produto) return null;
      return { ...produto, tamanho: item.tamanho, qty: item.qty, linhaTotal: produto.preco * item.qty };
    })
    .filter(Boolean);
}

function cartCount() {
  return cartItems().reduce((soma, i) => soma + i.qty, 0);
}

function cartSubtotal() {
  return cartItems().reduce((soma, i) => {
    const produto = buscarProduto(i.id);
    return produto ? soma + produto.preco * i.qty : soma;
  }, 0);
}

function addToCart(id, qty = 1, tamanho = null, abrirDrawer = true) {
  const produto = buscarProduto(id);
  if (!produto) return;
  const tamanhoFinal = tamanho || produto.tamanhos[0];
  const itens = cartItems();
  const existente = itens.find((i) => i.id === produto.id && i.tamanho === tamanhoFinal);
  if (existente) {
    existente.qty = Math.min(existente.qty + qty, produto.estoque);
  } else {
    itens.push({ id: produto.id, tamanho: tamanhoFinal, qty: Math.min(qty, produto.estoque) });
  }
  storeSet(KEYS.cart, itens);
  updateBadges();
  atualizarMiniCarrinho();
  if (abrirDrawer) abrirMiniCarrinho();
}

function setQtyItem(id, tamanho, qty) {
  const itens = cartItems();
  const item = itens.find((i) => i.id === id && i.tamanho === tamanho);
  if (!item) return;
  const produto = buscarProduto(id);
  item.qty = Math.max(1, Math.min(qty, produto ? produto.estoque : 99));
  storeSet(KEYS.cart, itens);
  updateBadges();
  atualizarMiniCarrinho();
}

function removeItemCart(id, tamanho) {
  storeSet(KEYS.cart, cartItems().filter((i) => !(i.id === id && i.tamanho === tamanho)));
  updateBadges();
  atualizarMiniCarrinho();
}

function clearCart() {
  storeSet(KEYS.cart, []);
  updateBadges();
  atualizarMiniCarrinho();
}

/* ---------------- Favoritos ---------------- */

function getFavs() {
  return storeGet(KEYS.favs, []);
}

function isFav(id) {
  return getFavs().includes(Number(id));
}

function toggleFav(id) {
  id = Number(id);
  let favs = getFavs();
  let adicionou = false;
  if (favs.includes(id)) {
    favs = favs.filter((f) => f !== id);
  } else {
    favs.push(id);
    adicionou = true;
  }
  storeSet(KEYS.favs, favs);
  updateBadges();
  return adicionou;
}

/* ---------------- Sessão / Autenticação ---------------- */

function getUsers() {
  return storeGet(KEYS.users, []);
}

function getSession() {
  return storeGet(KEYS.session, null);
}

function registerUser(dados) {
  const users = getUsers();
  users.push({
    id: Date.now(),
    nome: dados.nome,
    email: dados.email.toLowerCase(),
    senha: hashDemo(dados.senha),
    telefone: dados.telefone || "",
    nascimento: dados.nascimento || "",
  });
  storeSet(KEYS.users, users);
}

function emailEmUso(email) {
  return getUsers().some((u) => u.email === email.toLowerCase());
}

function loginUser(email, senha) {
  const user = getUsers().find(
    (u) => u.email === email.toLowerCase() && u.senha === hashDemo(senha)
  );
  if (user) {
    storeSet(KEYS.session, { id: user.id, nome: user.nome, email: user.email });
    return true;
  }
  return false;
}

function logoutUser() {
  localStorage.removeItem(KEYS.session);
  window.location.href = "index.html";
}

function requireLogin(redirectUrl) {
  if (!getSession()) {
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
    return false;
  }
  return true;
}

function ensureSeed() {
  if (getUsers().length === 0) {
    registerUser({ nome: "Usuário Demo", email: "demo@demo.com", senha: "123456" });
  }
}

/* ---------------- Pedidos ---------------- */

function getOrders() {
  const sessao = getSession();
  const todas = storeGet(KEYS.orders, []);
  return sessao ? todas.filter((o) => o.userId === sessao.id) : [];
}

/* ---------------- Toasts ---------------- */

function showToast(mensagem, variante = "success", opcoes = {}) {
  const container = document.getElementById("toast-root");
  if (!container) return;
  const icones = {
    success: "bi-check-circle-fill text-success",
    danger: "bi-x-octagon-fill text-danger",
    warning: "bi-exclamation-triangle-fill text-warning",
    info: "bi-info-circle-fill text-info",
  };
  const btnHTML = opcoes.btn
    ? `<a href="${escapeHTML(opcoes.btn.href)}" class="toast-action-btn" data-bs-dismiss="toast">${escapeHTML(opcoes.btn.texto)}</a>`
    : "";
  const el = document.createElement("div");
  el.className = "toast align-items-center border-subtle bg-surface-2";
  el.setAttribute("role", "alert");
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${icones[variante] || icones.info} fs-5"></i>
        <span>${mensagem}</span>
        ${btnHTML}
      </div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
    </div>`;
  container.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay: 4000 });
  el.addEventListener("hidden.bs.toast", () => el.remove());
  toast.show();
}

/* ---------------- Renderizadores ---------------- */

function estrelasHTML(avaliacao) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (avaliacao >= i) html += '<i class="bi bi-star-fill"></i>';
    else if (avaliacao >= i - 0.5) html += '<i class="bi bi-star-half"></i>';
    else html += '<i class="bi bi-star"></i>';
  }
  return `<span class="stars">${html}</span>`;
}

function descontoPercentual(p) {
  if (!p.precoAntigo || p.precoAntigo <= p.preco) return null;
  return Math.round((1 - p.preco / p.precoAntigo) * 100);
}

function productCardHTML(p) {
  const desconto = descontoPercentual(p);
  const badge = desconto
    ? `<span class="discount-badge">-${desconto}%</span>`
    : p.novidade
      ? '<span class="new-badge">NOVO</span>'
      : "";
  const favoritado = isFav(p.id);
  return `
  <div class="col-6 col-md-4 col-xl-3">
    <div class="card product-card h-100">
      <div class="product-thumb img-skeleton">
        ${badge}
        <button class="fav-btn ${favoritado ? "active" : ""}" type="button"
          aria-label="Favoritar" onclick="toggleFavBtn(this, ${p.id})">
          <i class="bi ${favoritado ? "bi-heart-fill" : "bi-heart"}"></i>
        </button>
        <div class="compare-check">
          <input type="checkbox" id="cmp-${p.id}" ${getCompare().includes(p.id) ? "checked" : ""}
            onchange="toggleCompare(${p.id})">
          <label for="cmp-${p.id}"><i class="bi bi-arrow-left-right"></i></label>
        </div>
        <a href="informacoes-produto.html?id=${p.id}" class="d-block text-decoration-none">
          <img src="${imagemThumbnail(p)}" alt="${p.nome}" loading="lazy" class="img-fade"
            onload="this.classList.add('carregada');this.parentElement.parentElement.classList.add('ok')"
            onerror="this.onerror=null;this.classList.add('carregada');this.parentElement.parentElement.classList.add('ok');this.src='${fallbackImagem(p.id)}'">
        </a>
      </div>
      <div class="card-body d-flex flex-column p-3">
        <small class="text-uppercase fw-semibold" style="font-size:.68rem;color:#a78bfa">${nomeCategoria(p.categoria)}</small>
        <h6 class="product-name mt-1 mb-1 fs-6"><a href="informacoes-produto.html?id=${p.id}">${p.nome}</a></h6>
        <div class="d-flex align-items-center gap-1 mb-2">
          ${estrelasHTML(p.avaliacao)}
          <small class="text-muted-2 ms-1">(${p.numAvaliacoes})</small>
        </div>
        <div class="mb-2">
          <span class="fw-bold fs-6">${brl(p.preco)}</span>
          ${p.precoAntigo ? `<span class="price-old text-muted-2 ms-1">${brl(p.precoAntigo)}</span>` : ""}
        </div>
        <button type="button" class="btn btn-gradient btn-sm w-100 mt-auto" onclick="addFromCard(${p.id})">
          <i class="bi bi-bag-plus me-1"></i> Adicionar
        </button>
      </div>
    </div>
  </div>`;
}

function toggleFavBtn(btn, id) {
  const adicionou = toggleFav(id);
  btn.classList.toggle("active", adicionou);
  const icone = btn.querySelector("i");
  icone.classList.toggle("bi-heart-fill", adicionou);
  icone.classList.toggle("bi-heart", !adicionou);
  showToast(adicionou ? "Adicionado aos favoritos!" : "Removido dos favoritos.", adicionou ? "success" : "info");
}

function addFromCard(id) {
  addToCart(id, 1, null);
}

/* ---------------- Header e Footer ---------------- */

function headerTemplate() {
  const pagina = location.pathname.split("/").pop() || "index.html";
  const ativo = (arquivo) => (pagina === arquivo ? 'class="nav-link active" aria-current="page"' : 'class="nav-link"');
  const sessao = getSession();

  const userArea = sessao
    ? `
    <li class="nav-item dropdown">
      <a class="nav-link dropdown-toggle d-flex align-items-center gap-1" href="#" role="button"
        data-bs-toggle="dropdown" aria-expanded="false">
        <i class="bi bi-person-circle fs-5"></i>
        <span class="d-lg-none d-xl-inline">${sessao.nome.split(" ")[0]}</span>
      </a>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><h6 class="dropdown-header">${sessao.email}</h6></li>
        <li><a class="dropdown-item" href="pedidos.html"><i class="bi bi-box-seam me-2"></i>Meus pedidos</a></li>
        <li><a class="dropdown-item" href="favoritos.html"><i class="bi bi-heart me-2"></i>Favoritos</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><button class="dropdown-item text-danger" onclick="logoutUser()"><i class="bi bi-box-arrow-right me-2"></i>Sair</button></li>
      </ul>
    </li>`
    : `
    <li class="nav-item">
      <a href="login.html" class="btn btn-gradient btn-sm px-3 ms-lg-2 mt-2 mt-lg-0">
        <i class="bi bi-person me-1"></i>Entrar
      </a>
    </li>`;

  const categoriasItens = CATEGORIAS.map(
    (c) => `
    <li><a class="dropdown-item" href="produtos.html?cat=${c.id}">
      <i class="bi ${c.icone} me-2"></i>${c.nome}
    </a></li>`
  ).join("");

  return `
  <div class="topbar py-1 text-white text-center">
    <i class="bi bi-truck me-1"></i> Frete GRÁTIS em compras acima de ${brl(FRETE_GRATIS_LIMITE)} • Use o cupom <strong>COSPLAY10</strong> e ganhe 10% OFF
  </div>
  <nav class="navbar navbar-expand-lg navbar-ch sticky-top py-2">
    <div class="container">
      <a class="navbar-brand d-flex align-items-center gap-2 m-0" href="index.html">
        <span class="brand-icon"><i class="bi bi-masks"></i></span>
        <span class="font-display fw-bold fs-4 text-gradient">COSPLAYHUB</span>
      </a>
      <button class="navbar-toggler border-subtle" type="button" data-bs-toggle="collapse"
        data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Abrir menu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav mx-lg-3 mt-3 mt-lg-0">
          <li class="nav-item"><a ${ativo("index.html")} href="index.html">Início</a></li>
          <li class="nav-item"><a ${ativo("produtos.html")} href="produtos.html">Produtos</a></li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="produtos.html" role="button"
              data-bs-toggle="dropdown" aria-expanded="false">Categorias</a>
            <ul class="dropdown-menu">${categoriasItens}</ul>
          </li>
          <li class="nav-item"><a class="nav-link" href="produtos.html?promo=1">% Promoções</a></li>
        </ul>
        <form class="nav-search d-flex flex-grow-1 my-3 my-lg-0 me-lg-3" role="search" id="header-search" autocomplete="off">
          <div class="search-wrap">
            <div class="input-group">
              <input type="search" class="form-control" placeholder="Buscar cosplay, acessório..." aria-label="Buscar" name="q" id="search-input">
              <button class="btn btn-outline-brand" type="submit"><i class="bi bi-search"></i></button>
            </div>
            <div class="search-drop" id="search-drop"></div>
          </div>
        </form>
        <ul class="navbar-nav flex-row align-items-center gap-1 ms-auto mt-2 mt-lg-0">
          <li class="nav-item">
            <button type="button" class="icon-btn d-block border-0 bg-transparent"
              onclick="alternarTema()" aria-label="Alternar tema claro/escuro" title="Alternar tema claro/escuro">
              <i class="bi bi-moon-stars-fill theme-icon-dark"></i>
              <i class="bi bi-sun-fill theme-icon-light"></i>
            </button>
          </li>
          <li class="nav-item position-relative">
            <a class="icon-btn d-block" href="favoritos.html" aria-label="Favoritos">
              <i class="bi bi-heart"></i>
              <span class="badge-bubble d-none" id="badge-favs">0</span>
            </a>
          </li>
          <li class="nav-item position-relative">
            <a class="icon-btn d-block" href="carrinho.html" aria-label="Carrinho">
              <i class="bi bi-bag"></i>
              <span class="badge-bubble d-none" id="badge-cart">0</span>
            </a>
          </li>
          ${userArea}
        </ul>
      </div>
    </div>
  </nav>`;
}

function footerTemplate() {
  const categoriasLinks = CATEGORIAS.map(
    (c) => `<li class="mb-2"><a href="produtos.html?cat=${c.id}">${c.nome}</a></li>`
  ).join("");

  return `
  <footer class="footer pt-5 pb-4 mt-auto">
    <div class="container">
      <div class="row g-4 pb-4 border-bottom border-subtle">
        <div class="col-lg-6">
          <h5 class="font-display fw-bold">Receba novidades & cupons</h5>
          <p class="text-muted-2 mb-3">Cadastre-se e receba ofertas exclusivas antes de todo mundo.</p>
          <form id="newsletter-form" class="d-flex gap-2 flex-sm-row flex-column" novalidate>
            <input type="email" class="form-control" placeholder="Seu melhor e-mail" required aria-label="E-mail para newsletter">
            <button class="btn btn-gradient px-4 text-nowrap" type="submit">Inscrever</button>
          </form>
        </div>
        <div class="col-lg-6 d-flex align-items-center justify-content-lg-end">
          <div class="d-flex gap-3 fs-4 text-muted-2">
            <i class="bi bi-qr-code" title="Pix"></i>
            <i class="bi bi-credit-card" title="Cartão de crédito"></i>
            <i class="bi bi-upc-scan" title="Boleto"></i>
            <i class="bi bi-cash-coin" title="Dinheiro/Pix"></i>
            <i class="bi bi-shield-check" title="Compra segura"></i>
          </div>
        </div>
      </div>

      <div class="row g-4 py-4">
        <div class="col-md-4 col-lg-3">
          <a class="navbar-brand d-flex align-items-center gap-2 m-0 mb-3" href="index.html">
            <span class="brand-icon"><i class="bi bi-masks"></i></span>
            <span class="font-display fw-bold fs-4 text-gradient">COSPLAYHUB</span>
          </a>
          <p class="text-muted-2 small">A maior loja de cosplays e props colecionáveis do Brasil. Vista seu personagem favorito com qualidade premium.</p>
          <div class="d-flex gap-2 mt-3">
            <a href="#" class="social-btn" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
            <a href="#" class="social-btn" aria-label="TikTok"><i class="bi bi-tiktok"></i></a>
            <a href="#" class="social-btn" aria-label="YouTube"><i class="bi bi-youtube"></i></a>
            <a href="#" class="social-btn" aria-label="Discord"><i class="bi bi-discord"></i></a>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg-3">
          <h6 class="fw-bold mb-3">Categorias</h6>
          <ul class="list-unstyled">${categoriasLinks}</ul>
        </div>
        <div class="col-6 col-md-4 col-lg-3">
          <h6 class="fw-bold mb-3">Institucional</h6>
          <ul class="list-unstyled">
            <li class="mb-2"><a href="sobre.html">Sobre nós</a></li>
            <li class="mb-2"><a href="trocas.html">Trocas e devoluções</a></li>
            <li class="mb-2"><a href="trocas.html#prazos">Prazos de envio</a></li>
            <li class="mb-2"><a href="faq.html">Perguntas frequentes</a></li>
            <li class="mb-2"><a href="mailto:trabalhe@cosplayhub.com.br">Trabalhe conosco</a></li>
          </ul>
        </div>
        <div class="col-md-8 col-lg-3">
          <h6 class="fw-bold mb-3">Contato</h6>
          <ul class="list-unstyled text-muted-2">
            <li class="mb-2"><i class="bi bi-geo-alt me-2"></i>Rua dos Heróis, 42 — São Paulo/SP</li>
            <li class="mb-2"><i class="bi bi-whatsapp me-2"></i>(11) 90000-0000</li>
            <li class="mb-2"><i class="bi bi-envelope me-2"></i>contato@cosplayhub.com.br</li>
            <li class="mb-2"><i class="bi bi-clock me-2"></i>Seg a Sex, 9h às 18h</li>
          </ul>
        </div>
      </div>

      <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 pt-3 border-top border-subtle small text-muted-2">
        <span>© 2026 CosplayHub — Projeto educacional. Todos os direitos reservados.</span>
        <span>Desenvolvido com <i class="bi bi-bootstrap-fill text-primary"></i> Bootstrap 5 + HTML5 · <a href="creditos.html" class="text-decoration-none" style="color:var(--ch-brand-soft)">Créditos</a></span>
      </div>
    </div>
  </footer>`;
}

function updateBadges() {
  const badgeCart = document.getElementById("badge-cart");
  const badgeFavs = document.getElementById("badge-favs");
  if (badgeCart) {
    const total = cartCount();
    badgeCart.textContent = total > 99 ? "99+" : total;
    badgeCart.classList.toggle("d-none", total === 0);
  }
  if (badgeFavs) {
    const total = getFavs().length;
    badgeFavs.textContent = total > 99 ? "99+" : total;
    badgeFavs.classList.toggle("d-none", total === 0);
  }
}

function wireChromeEvents() {
  initAutocomplete();

  const news = document.getElementById("newsletter-form");
  if (news) {
    news.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!news.checkValidity()) {
        news.classList.add("was-validated");
        return;
      }
      const emailInscrito = news.querySelector("input[type=email]").value.trim().toLowerCase();
      if (emailInscrito) {
        const lista = storeGet(KEYS.newsletter, []);
        if (!lista.includes(emailInscrito)) {
          lista.push(emailInscrito);
          storeSet(KEYS.newsletter, lista);
        }
      }
      showToast("Inscrição realizada! Confira seu e-mail.", "success");
      news.reset();
      news.classList.remove("was-validated");
    });
  }
}

/* ---------------- Autocomplete da busca ---------------- */

function initAutocomplete() {
  const form = document.getElementById("header-search");
  const input = document.getElementById("search-input");
  const drop = document.getElementById("search-drop");
  if (!form || !input || !drop) return;

  let timer = null;
  const fechar = () => drop.classList.remove("show");

  function buscar(termo) {
    const q = termo.toLowerCase();
    if (q.length < 2) { fechar(); return; }

    const hits = PRODUTOS.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        nomeCategoria(p.categoria).toLowerCase().includes(q)
    ).slice(0, 6);

    if (hits.length === 0) {
      drop.innerHTML = `
        <span class="d-block px-3 py-3 text-muted-2 small">
          <i class="bi bi-emoji-frown me-2"></i>Nada encontrado para "${termo}"
        </span>`;
      drop.classList.add("show");
      return;
    }

    drop.innerHTML =
      hits.map((p) => `
        <a class="search-hit" href="informacoes-produto.html?id=${p.id}">
          <img src="${imagemPrincipal(p)}" alt="" loading="lazy"
            onerror="this.style.display='none'">
          <span class="flex-grow-1 overflow-hidden">
            <span class="search-hit-nome d-block fw-semibold">${p.nome}</span>
            <small class="text-muted-2">${nomeCategoria(p.categoria)}</small>
          </span>
          <strong class="text-gradient fs-6 text-nowrap">${brl(p.preco)}</strong>
        </a>`).join("") +
      `<a class="search-hit search-all justify-content-center" href="produtos.html?q=${encodeURIComponent(termo)}">
         Ver todos os resultados <i class="bi bi-arrow-right ms-1"></i>
       </a>`;
    drop.classList.add("show");
  }

  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => buscar(input.value.trim()), 180);
  });
  input.addEventListener("focus", () => {
    if (input.value.trim().length >= 2) buscar(input.value.trim());
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    fechar();
    const q = input.value.trim();
    window.location.href = q ? `produtos.html?q=${encodeURIComponent(q)}` : "produtos.html";
  });
  document.addEventListener("click", (e) => {
    if (!form.contains(e.target)) fechar();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fechar();
  });
}

function renderChrome() {
  ensureSeed();
  initTema();
  if (!document.getElementById("skip-link")) {
    document.body.insertAdjacentHTML("afterbegin",
      '<a href="#main-content" class="visually-hidden-focusable position-absolute top-0 start-0 m-2 px-3 py-2 rounded-3 z-3" style="background:var(--ch-primary);color:#fff;font-weight:600">Pular para o conteúdo</a>');
  }
  document.getElementById("site-header").innerHTML = headerTemplate();
  document.getElementById("site-footer").innerHTML = footerTemplate();
  injectMiniCarrinho();
  injectCompareBar();
  wireChromeEvents();
  updateBadges();
  verificarCupomAniversario();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  document.body.classList.add("page-transition");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add("visible");
    });
  });
}

document.addEventListener("DOMContentLoaded", renderChrome);

/* ============================================================
   Extras v2 — tema, mini-carrinho, reveal, vistos recentes
   ============================================================ */

/* ---------------- Tema claro/escuro ---------------- */

const THEME_KEY = "ch_theme";

function initTema() {
  const salvo = localStorage.getItem(THEME_KEY);
  if (salvo === "light" || salvo === "dark") {
    document.documentElement.setAttribute("data-bs-theme", salvo);
  }
}

function alternarTema() {
  const atual = document.documentElement.getAttribute("data-bs-theme") || "dark";
  const novo = atual === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", novo);
  localStorage.setItem(THEME_KEY, novo);
}

initTema();

/* ---------------- Vistos recentemente ---------------- */

function registrarVisto(id) {
  const lista = storeGet(KEYS.recentes, []).filter((r) => r !== Number(id));
  lista.unshift(Number(id));
  storeSet(KEYS.recentes, lista.slice(0, 12));
}

function produtosRecentes(qtd = 8) {
  const ids = storeGet(KEYS.recentes, []);
  const vistos = [];
  for (const id of ids) {
    const p = buscarProduto(id);
    if (p) vistos.push(p);
    if (vistos.length >= qtd) break;
  }
  return vistos;
}

/* ---------------- Avaliações de usuários ---------------- */

function getUserReviews(idProduto) {
  return storeGet(KEYS.reviews, {})[Number(idProduto)] || [];
}

function addUserReview(idProduto, avaliacao) {
  const todas = storeGet(KEYS.reviews, {});
  const chave = Number(idProduto);
  if (!todas[chave]) todas[chave] = [];
  todas[chave].push(avaliacao);
  storeSet(KEYS.reviews, todas);
}

/* ---------------- Mini-carrinho (offcanvas) ---------------- */

function miniCarrinhoTemplate() {
  return `
  <div class="offcanvas offcanvas-end bg-surface" tabindex="-1"
    id="mini-carrinho" aria-labelledby="mini-carrinho-titulo">
    <div class="offcanvas-header py-3">
      <h5 class="offcanvas-title font-display fw-bold m-0" id="mini-carrinho-titulo">
        <i class="bi bi-bag-check me-2"></i>Meu carrinho
      </h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar"></button>
    </div>
    <div class="offcanvas-body overflow-auto" id="mini-carrinho-itens"></div>
    <div class="p-3" id="mini-carrinho-footer"></div>
  </div>`;
}

function injectMiniCarrinho() {
  if (!document.getElementById("mini-carrinho")) {
    document.body.insertAdjacentHTML("beforeend", miniCarrinhoTemplate());
    document.getElementById("mini-carrinho").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mini-action]");
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const tamanho = btn.dataset.tamanho;
      const item = cartItems().find((i) => i.id === id && i.tamanho === tamanho);
      const action = btn.dataset.miniAction;
      if (action === "inc") setQtyItem(id, tamanho, (item ? item.qty : 1) + 1);
      else if (action === "dec") setQtyItem(id, tamanho, (item ? item.qty : 2) - 1);
      else if (action === "rem") removeItemCart(id, tamanho);
    });
  }
  atualizarMiniCarrinho();
}

function atualizarMiniCarrinho() {
  const box = document.getElementById("mini-carrinho-itens");
  const foot = document.getElementById("mini-carrinho-footer");
  if (!box || !foot) return;

  const itens = cartDetailed();
  if (itens.length === 0) {
    box.innerHTML = `
      <div class="empty-state my-auto w-100 py-5">
        <div class="icon-ring"><i class="bi bi-bag"></i></div>
        <h6 class="fw-bold mb-1">Seu carrinho está vazio</h6>
        <p class="text-muted-2 small mb-3">Que tal um cosplay novinho?</p>
        <a href="produtos.html" class="btn btn-outline-brand btn-sm">Ver produtos</a>
      </div>`;
    foot.innerHTML = "";
    return;
  }

  box.innerHTML = itens.map((item) => `
    <div class="mini-item">
      <img src="${imagemPrincipal(item)}" alt="${item.nome}" loading="lazy"
        onerror="this.onerror=null;this.src='${fallbackImagem(item.id)}'">
      <div style="min-width:0" class="flex-grow-1">
        <a href="informacoes-produto.html?id=${item.id}" class="mini-item-nome fw-semibold d-block">${item.nome}</a>
        <small class="text-muted-2">Tam.: ${item.tamanho} • ${brl(item.preco)}</small>
        <div class="d-flex align-items-center justify-content-between mt-2 gap-2">
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="mini-qtd-btn" data-mini-action="dec"
              data-id="${item.id}" data-tamanho="${item.tamanho}" aria-label="Diminuir quantidade"><i class="bi bi-dash-lg"></i></button>
            <span class="small fw-semibold">${item.qty}</span>
            <button type="button" class="mini-qtd-btn" data-mini-action="inc"
              data-id="${item.id}" data-tamanho="${item.tamanho}" aria-label="Aumentar quantidade"><i class="bi bi-plus-lg"></i></button>
          </div>
          <div class="d-flex align-items-center gap-2">
            <strong class="small">${brl(item.linhaTotal)}</strong>
            <button type="button" class="btn btn-sm text-danger p-1 lh-1"
              data-mini-action="rem" data-id="${item.id}" data-tamanho="${item.tamanho}" aria-label="Remover item"><i class="bi bi-trash3"></i></button>
          </div>
        </div>
      </div>
    </div>`).join("");

  const subtotal = cartSubtotal();
  const faltaFrete = FRETE_GRATIS_LIMITE - subtotal;
  foot.innerHTML = `
    ${
      faltaFrete > 0
        ? `<p class="small text-muted-2 mb-2"><i class="bi bi-truck me-1"></i>Faltam <strong>${brl(faltaFrete)}</strong> para frete grátis!</p>`
        : `<p class="small text-success mb-2"><i class="bi bi-truck me-1"></i><strong>Você ganhou frete grátis!</strong></p>`
    }
    <div class="d-flex justify-content-between align-items-center mb-3">
      <span class="text-muted-2">Subtotal (${cartCount()} ${cartCount() === 1 ? "item" : "itens"})</span>
      <strong class="fs-5">${brl(subtotal)}</strong>
    </div>
    <div class="d-grid gap-2">
      <a href="checkout.html" class="btn btn-gradient"><i class="bi bi-credit-card me-1"></i>Finalizar compra</a>
      <a href="carrinho.html" class="btn btn-outline-brand btn-sm">Ver carrinho completo</a>
    </div>`;
}

function abrirMiniCarrinho() {
  const el = document.getElementById("mini-carrinho");
  if (!el || typeof bootstrap === "undefined") return;
  bootstrap.Offcanvas.getOrCreateInstance(el).show();
}

/* ---------------- Reveal on-scroll ---------------- */

const observadorReveal =
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada, i) => {
            if (!entrada.isIntersecting) return;
            setTimeout(() => entrada.target.classList.add("reveal-in"), i * 55);
            observadorReveal.unobserve(entrada.target);
          });
        },
        { threshold: 0.06 }
      )
    : null;

const SELETORES_REVEAL =
  ".section-title-bar, .category-card, .product-card, .testimonial-card, .promo-banner, .filter-card";

function aplicarReveals(seletor) {
  if (!observadorReveal) return;
  document.querySelectorAll(seletor || SELETORES_REVEAL).forEach((el) => {
    if (el.dataset.revealDone) return;
    el.dataset.revealDone = "1";
    el.classList.add("reveal");
    observadorReveal.observe(el);
  });
}

setTimeout(() => aplicarReveals(), 300);

/* ---------------- Comparação de produtos ---------------- */

function getCompare() {
  return storeGet(KEYS.compare, []);
}

function toggleCompare(id) {
  id = Number(id);
  let lista = getCompare();
  if (lista.includes(id)) {
    lista = lista.filter((c) => c !== id);
  } else if (lista.length < 2) {
    lista.push(id);
  } else {
    showToast("Você pode comparar no máximo 2 produtos.", "warning");
    return;
  }
  storeSet(KEYS.compare, lista);
  atualizarBarraComparacao();
}

function injectCompareBar() {
  if (document.getElementById("compare-bar")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <div class="compare-bar" id="compare-bar">
      <div class="container d-flex align-items-center justify-content-between">
        <span class="small" id="compare-info"><i class="bi bi-arrow-left-right me-1"></i>Comparar: <strong>0</strong>/2 selecionados</span>
        <a href="#" class="btn btn-gradient btn-sm disabled" id="compare-btn" aria-disabled="true">
          <i class="bi bi-table me-1"></i>Comparar agora
        </a>
      </div>
    </div>`);
}

function atualizarBarraComparacao() {
  const barra = document.getElementById("compare-bar");
  if (!barra) return;
  const lista = getCompare();
  const info = document.getElementById("compare-info");
  const btn = document.getElementById("compare-btn");
  barra.classList.toggle("visivel", lista.length > 0);
  if (info) info.innerHTML = `<i class="bi bi-arrow-left-right me-1"></i>Comparar: <strong>${lista.length}</strong>/2 selecionados`;
  if (btn) {
    if (lista.length === 2) {
      btn.href = `comparar.html?id=${lista[0]}&id=${lista[1]}`;
      btn.classList.remove("disabled");
      btn.setAttribute("aria-disabled", "false");
    } else {
      btn.href = "#";
      btn.classList.add("disabled");
      btn.setAttribute("aria-disabled", "true");
    }
  }
}

/* ---------------- Cupom de aniversário ---------------- */

function verificarCupomAniversario() {
  const sessao = getSession();
  if (!sessao) return;
  const user = getUsers().find((u) => u.id === sessao.id);
  if (!user || !user.nascimento) return;
  const hoje = new Date();
  const nasc = new Date(user.nascimento);
  if (hoje.getMonth() === nasc.getMonth() && hoje.getDate() === nasc.getDate()) {
    const atual = storeGet(KEYS.coupon, null);
    if (atual !== "BIRTHDAY15") {
      storeSet(KEYS.coupon, "BIRTHDAY15");
      showToast("Feliz aniversário! Cupom BIRTHDAY15 (15% OFF) aplicado!", "success", {
        btn: { texto: "Ver carrinho", href: "carrinho.html" },
      });
    }
  }
}
