/* ============================================================
   CosplayHub — Página de detalhes do produto
   ============================================================ */

let produtoAtual = null;
let tamanhoSelecionado = null;

document.addEventListener("DOMContentLoaded", () => {
  const id = param("id");
  produtoAtual = buscarProduto(id);

  if (!produtoAtual) {
    document.getElementById("produto-nao-encontrado").classList.remove("d-none");
    document.title = "Produto não encontrado | CosplayHub";
    return;
  }

  document.title = `${produtoAtual.nome} | CosplayHub`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = produtoAtual.descricao.slice(0, 160);
  const jsonld = document.getElementById("jsonld-product");
  if (jsonld) {
    const j = JSON.parse(jsonld.textContent);
    j.name = produtoAtual.nome;
    j.description = produtoAtual.descricao;
    j.image = imagemPrincipal(produtoAtual);
    j.offers.price = String(produtoAtual.preco);
    j.offers.availability = produtoAtual.estoque > 0
      ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
    jsonld.textContent = JSON.stringify(j, null, 2);
  }
  registrarVisto(produtoAtual.id);
  renderizarGaleria();
  renderizarInformacoes();
  renderizarTamanhos();
  wireQuantidade();
  wireBotoesAcao();
  wireFormAvaliacao();
  renderizarAvaliacoes();
  renderizarRelacionados();
  renderizarRecentes();
  aplicarReveals();

  document.getElementById("conteudo-produto").classList.remove("d-none");
});

/* ---------------- Galeria ---------------- */

function renderizarGaleria() {
  const principal = document.getElementById("imagem-principal");
  const thumbs = document.getElementById("lista-thumbs");

  const urls = galeriaProduto(produtoAtual);

  principal.onload = () => {
    principal.classList.add("carregada");
    const wrap = document.getElementById("principal-wrap");
    if (wrap) wrap.classList.add("ok");
  };
  principal.onerror = () => {
    principal.onerror = null;
    principal.src = fallbackImagem(`${produtoAtual.id}-0`);
  };

  principal.src = urls[0];
  principal.alt = produtoAtual.nome;

  thumbs.innerHTML = urls
    .map(
      (url, i) => `
    <button type="button" class="thumb-btn ${i === 0 ? "active" : ""}" data-src="${url}"
      aria-label="Imagem ${i + 1}">
      <img src="${url}" alt="" loading="lazy"
        onerror="this.onerror=null;this.src='${fallbackImagem(produtoAtual.id + "-" + i)}'">
    </button>`
    )
    .join("");

  thumbs.querySelectorAll(".thumb-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      thumbs.querySelectorAll(".thumb-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      principal.src = btn.dataset.src;
    })
  );

  const wrapPrincipal = document.getElementById("principal-wrap");
  if (wrapPrincipal) {
    wrapPrincipal.addEventListener("click", () => abrirLightbox(0));
    wrapPrincipal.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirLightbox(0); }
    });
  }
}

/* ---------------- Informações ---------------- */

function renderizarInformacoes() {
  const p = produtoAtual;
  const desconto = descontoPercentual(p);

  document.getElementById("breadcrumb-cat").textContent = nomeCategoria(p.categoria);
  document.getElementById("rotulo-categoria").textContent = nomeCategoria(p.categoria);
  document.getElementById("titulo-produto").textContent = p.nome;
  document.getElementById("avaliacao-estrelas").innerHTML = estrelasHTML(p.avaliacao);
  document.getElementById("nota-numero").textContent = p.avaliacao.toFixed(1);
  document.getElementById("qtd-avaliacoes").textContent = p.numAvaliacoes;
  document.getElementById("descricao-curta").textContent =
    p.descricao.split(". ").slice(0, 2).join(". ") + ".";
  document.getElementById("preco-principal").textContent = brl(p.preco);
  document.getElementById("parcela-sem-juros").textContent = brl(p.preco / 3);
  document.getElementById("qtd-avaliacoes-tab").textContent = p.numAvaliacoes;
  document.getElementById("descricao-completa").textContent = p.descricao;

  if (desconto) {
    document.getElementById("selo-desconto").classList.remove("d-none");
    document.getElementById("selo-desconto").textContent = `-${desconto}% OFF`;
    const badgeInline = document.getElementById("badge-desconto-inline");
    badgeInline.classList.remove("d-none");
    badgeInline.textContent = `- ${brl(p.precoAntigo - p.preco)}`;
    const antigo = document.getElementById("preco-antigo");
    antigo.classList.remove("d-none");
    antigo.textContent = brl(p.precoAntigo);
  }

  document.getElementById("lista-especificacoes").innerHTML = p.especificacoes
    .map((item) => `<li class="mb-2 text-muted-2"><i class="bi bi-check2-circle me-2" style="color:#8b5cf6"></i>${item}</li>`)
    .join("");

  if (p.estoque <= 10) {
    const aviso = document.getElementById("aviso-estoque");
    aviso.classList.remove("d-none");
    aviso.innerHTML = `<i class="bi bi-fire me-1"></i>Apenas ${p.estoque} em estoque!`;
  }
}

/* ---------------- Tamanhos ---------------- */

function renderizarTamanhos() {
  const container = document.getElementById("opcoes-tamanho");
  container.innerHTML = produtoAtual.tamanhos
    .map(
      (t) => `
    <button type="button" class="size-btn ${t === produtoAtual.tamanhos[0] ? "active" : ""}"
      data-tamanho="${t}">${t}</button>`
    )
    .join("");

  tamanhoSelecionado = produtoAtual.tamanhos[0];
  atualizarLabelTamanho();

  container.querySelectorAll(".size-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      container.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      tamanhoSelecionado = btn.dataset.tamanho;
      atualizarLabelTamanho();
    })
  );

  if (produtoAtual.tamanhos.length === 1 && produtoAtual.tamanhos[0] === "Único") {
    document.getElementById("bloco-tamanhos").querySelector("p.fw-semibold").innerHTML =
      'Tamanho: <span class="text-muted-2 fw-normal">Único (ajustável)</span>';
  }
}

function atualizarLabelTamanho() {
  const label = document.getElementById("tamanho-selecionado");
  label.textContent = tamanhoSelecionado === "Único" ? "Único" : tamanhoSelecionado;
}

/* ---------------- Quantidade ---------------- */

function wireQuantidade() {
  const input = document.getElementById("input-qty");

  document.getElementById("qty-menos").addEventListener("click", () => {
    input.value = Math.max(1, Number(input.value) - 1);
  });

  document.getElementById("qty-mais").addEventListener("click", () => {
    input.value = Math.min(produtoAtual.estoque, Number(input.value) + 1);
    if (Number(input.value) >= produtoAtual.estoque) {
      showToast(`Estoque máximo: ${produtoAtual.estoque} unidades.`, "warning");
    }
  });

  input.addEventListener("change", () => {
    let v = parseInt(input.value, 10);
    if (isNaN(v)) v = 1;
    v = Math.max(1, Math.min(v, produtoAtual.estoque));
    input.value = v;
  });
}

/* ---------------- Ações ---------------- */

function wireBotoesAcao() {
  document.getElementById("btn-add-cart").addEventListener("click", () => {
    addToCart(produtoAtual.id, Number(document.getElementById("input-qty").value), tamanhoSelecionado);
  });

  document.getElementById("btn-comprar-agora").addEventListener("click", () => {
    addToCart(produtoAtual.id, Number(document.getElementById("input-qty").value), tamanhoSelecionado, false);
    window.location.href = "checkout.html";
  });

  sincronizarBotaoFav();
  document.getElementById("btn-favoritar").addEventListener("click", () => {
    toggleFav(produtoAtual.id);
    sincronizarBotaoFav();
    showToast(
      isFav(produtoAtual.id) ? "Adicionado aos favoritos!" : "Removido dos favoritos.",
      isFav(produtoAtual.id) ? "success" : "info"
    );
  });

  const btnShare = document.getElementById("btn-compartilhar");
  if (btnShare) btnShare.addEventListener("click", compartilharProduto);
}

async function compartilharProduto() {
  const url = location.href;
  const dados = {
    title: `${produtoAtual.nome} | CosplayHub`,
    text: `Confira "${produtoAtual.nome}" na CosplayHub!`,
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(dados);
    } else {
      await navigator.clipboard.writeText(url);
      showToast("Link copiado para a área de transferência!", "info");
    }
  } catch (erro) {
    if (erro && erro.name === "AbortError") return;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copiado para a área de transferência!", "info");
    } catch {
      window.prompt("Copie o link do produto:", url);
    }
  }
}

function sincronizarBotaoFav() {
  const btn = document.getElementById("btn-favoritar");
  const ativo = isFav(produtoAtual.id);
  btn.classList.toggle("active", ativo);
  btn.innerHTML = `<i class="bi ${ativo ? "bi-heart-fill" : "bi-heart"}"></i>`;
}

/* ---------------- Avaliações ---------------- */

function iniciaisNome(nome) {
  return nome
    .split(/\s+/)
    .map((parte) => parte[0] || "")
    .join("")
    .replace(".", "")
    .toUpperCase()
    .slice(0, 2);
}

function avatarHTML(nome, semente) {
  const iniciais = iniciaisNome(nome);
  const s = Math.abs(semente);
  const genero = s % 2 === 0 ? "women" : "men";
  const n = (s % 99) + 1;
  const nomeSeguro = escapeHTML(nome);
  return `
  <span class="review-avatar" role="img" aria-label="Foto de ${nomeSeguro}">
    <img src="https://randomuser.me/api/portraits/${genero}/${n}.jpg" alt="Foto de ${nomeSeguro}" loading="lazy"
      onerror="this.remove()">
    <span class="avatar-fallback">${iniciais}</span>
  </span>`;
}

function cardAvaliacaoUsuario(a) {
  return `
  <div class="col-md-4">
    <div class="rounded-3 p-3 h-100"
      style="background:rgba(var(--ch-primary-rgb),.07);border:1px solid rgba(var(--ch-primary-rgb),.35)">
      <div class="d-flex align-items-center gap-2 mb-2">
        ${avatarHTML(a.nome, a.nome.charCodeAt(0) * 7 + a.data.length)}
        <div>
          <strong class="d-block small">${escapeHTML(a.nome)}</strong>
          ${estrelasHTML(a.nota)}
        </div>
        <i class="bi bi-person-check-fill ms-auto" title="Avaliação de cliente do site" style="color:var(--ch-primary)"></i>
      </div>
      <p class="small text-muted-2 mb-1">${escapeHTML(a.texto)}</p>
      <small class="text-muted-2"><i class="bi bi-clock me-1"></i>${new Date(a.data).toLocaleDateString("pt-BR")}</small>
    </div>
  </div>`;
}

function renderizarAvaliacoes() {
  const nomes = ["Marina R.", "João Pedro S.", "Camila T.", "Diego F.", "Beatriz L.", "Rafael M."];
  const comentarios = [
    "Qualidade impressionante, superou o que eu esperava pelo preço. Recomendo demais!",
    "Caimento perfeito e acabamento impecável. Recebi vários elogios no evento.",
    "Chegou antes do prazo, muito bem embalado. Com certeza comprarei novamente.",
    "Material resistente e confortável para usar o dia inteiro. Nota 10!",
    "Atendimento excelente e produto fiel às fotos do site.",
    "Melhor compra do ano! O detalhe das costuras faz toda a diferença.",
  ];
  const inicio = produtoAtual.id % nomes.length;

  const fake = [0, 1, 2].map((i) => {
    const idx = (inicio + i) % nomes.length;
    return `
    <div class="col-md-4">
      <div class="bg-surface-2 border-subtle rounded-3 p-3 h-100">
        <div class="d-flex align-items-center gap-2 mb-2">
          ${avatarHTML(nomes[idx], idx * 37 + produtoAtual.id * 11 + inicio * 7)}
          <div>
            <strong class="d-block small">${nomes[idx]}</strong>
            ${estrelasHTML(Math.max(4, Math.round(produtoAtual.avaliacao)))}
          </div>
        </div>
        <p class="small text-muted-2 mb-1">${comentarios[(idx + i) % comentarios.length]}</p>
        <small class="text-muted-2"><i class="bi bi-patch-check-fill me-1" style="color:#10b981"></i>Compra verificada</small>
      </div>
    </div>`;
  }).join("");

  const usuarios = getUserReviews(produtoAtual.id).slice().reverse();
  document.getElementById("lista-avaliacoes").innerHTML = usuarios.map(cardAvaliacaoUsuario).join("") + fake;

  const total = produtoAtual.numAvaliacoes + usuarios.length;
  document.getElementById("qtd-avaliacoes").textContent = total;
  document.getElementById("qtd-avaliacoes-tab").textContent = total;
}

function wireFormAvaliacao() {
  const form = document.getElementById("form-avaliacao");
  if (!form || !produtoAtual) return;

  const sessao = getSession();
  if (sessao) document.getElementById("avaliador-nome").value = sessao.nome;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const erro = document.getElementById("avaliacao-erro");
    const mostrarErro = (msg) => {
      erro.textContent = msg;
      erro.classList.remove("d-none");
    };

    const marcada = form.querySelector('input[name="nota"]:checked');
    const nota = marcada ? Number(marcada.value) : 0;
    const nome = document.getElementById("avaliador-nome").value.trim();
    const texto = document.getElementById("avaliador-texto").value.trim();

    erro.classList.add("d-none");
    if (!nota) return mostrarErro("Escolha uma nota em estrelas.");
    if (nome.length < 2) return mostrarErro("Informe seu nome.");
    if (texto.length < 10) return mostrarErro("O comentário precisa ter pelo menos 10 caracteres.");

    addUserReview(produtoAtual.id, { nome, nota, texto, data: Date.now() });
    form.reset();
    renderizarAvaliacoes();
    showToast("Avaliação publicada. Obrigado por compartilhar!", "success");
  });
}

/* ---------------- Vistos recentemente ---------------- */

function renderizarRecentes() {
  const secao = document.getElementById("secao-recentes");
  const grid = document.getElementById("grid-recentes-produto");
  if (!secao || !grid) return;

  const recentes = produtosRecentes(8).filter((p) => p.id !== produtoAtual.id).slice(0, 4);
  if (recentes.length === 0) return;

  grid.innerHTML = recentes.map(productCardHTML).join("");
  secao.classList.remove("d-none");
}

/* ---------------- Relacionados ---------------- */

function renderizarRelacionados() {
  const mesmaCategoria = PRODUTOS.filter(
    (p) => p.categoria === produtoAtual.categoria && p.id !== produtoAtual.id
  );
  const outros = PRODUTOS.filter(
    (p) => p.categoria !== produtoAtual.categoria && p.id !== produtoAtual.id
  ).sort(() => 0.5 - Math.random());

  const relacionados = [...mesmaCategoria, ...outros].slice(0, 4);
  document.getElementById("grid-relacionados").innerHTML =
    relacionados.map(productCardHTML).join("");
}

/* ---------------- Guia de tamanhos ---------------- */

function abrirGuiaTamanhos() {
  const el = document.getElementById("modal-guia-tamanhos");
  if (el) bootstrap.Modal.getOrCreateInstance(el).show();
}

/* ---------------- Lightbox ---------------- */

let lightboxIndex = 0;
let lightboxTrigger = null;

function abrirLightbox(index) {
  const urls = galeriaProduto(produtoAtual);
  lightboxIndex = index;
  lightboxTrigger = document.activeElement;

  let lb = document.getElementById("ch-lightbox");
  if (!lb) {
    document.body.insertAdjacentHTML("beforeend", `
      <div id="ch-lightbox" class="ch-lightbox" role="dialog" aria-modal="true" aria-label="Galeria de imagens">
        <button type="button" class="ch-lightbox-btn ch-lightbox-close" aria-label="Fechar"><i class="bi bi-x-lg"></i></button>
        <button type="button" class="ch-lightbox-btn ch-lightbox-prev" aria-label="Anterior"><i class="bi bi-chevron-left"></i></button>
        <button type="button" class="ch-lightbox-btn ch-lightbox-next" aria-label="Próximo"><i class="bi bi-chevron-right"></i></button>
        <img src="" alt="">
        <span class="ch-lightbox-counter"></span>
      </div>`);
    lb = document.getElementById("ch-lightbox");

    lb.querySelector(".ch-lightbox-close").addEventListener("click", fecharLightbox);
    lb.querySelector(".ch-lightbox-prev").addEventListener("click", () => navegarLightbox(-1));
    lb.querySelector(".ch-lightbox-next").addEventListener("click", () => navegarLightbox(1));
    lb.addEventListener("click", (e) => { if (e.target === lb) fecharLightbox(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("aberto")) return;
      if (e.key === "Escape") { fecharLightbox(); return; }
      if (e.key === "ArrowLeft") { navegarLightbox(-1); return; }
      if (e.key === "ArrowRight") { navegarLightbox(1); return; }
      if (e.key === "Tab") {
        const focusable = lb.querySelectorAll("button");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  atualizarLightboxImagem(urls);
  lb.classList.add("aberto");
  document.body.style.overflow = "hidden";
  lb.querySelector(".ch-lightbox-close").focus();
}

function navegarLightbox(direcao) {
  const urls = galeriaProduto(produtoAtual);
  lightboxIndex = (lightboxIndex + direcao + urls.length) % urls.length;
  atualizarLightboxImagem(urls);
}

function atualizarLightboxImagem(urls) {
  const lb = document.getElementById("ch-lightbox");
  const img = lb.querySelector("img");
  const counter = lb.querySelector(".ch-lightbox-counter");
  img.src = urls[lightboxIndex];
  img.alt = produtoAtual.nome;
  counter.textContent = `${lightboxIndex + 1} / ${urls.length}`;
}

function fecharLightbox() {
  const lb = document.getElementById("ch-lightbox");
  if (lb) {
    lb.classList.remove("aberto");
    document.body.style.overflow = "";
    if (lightboxTrigger) { lightboxTrigger.focus(); lightboxTrigger = null; }
  }
}
