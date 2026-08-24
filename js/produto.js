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
  renderizarGaleria();
  renderizarInformacoes();
  renderizarTamanhos();
  wireQuantidade();
  wireBotoesAcao();
  renderizarAvaliacoes();
  renderizarRelacionados();

  document.getElementById("conteudo-produto").classList.remove("d-none");
});

/* ---------------- Galeria ---------------- */

function renderizarGaleria() {
  const principal = document.getElementById("imagem-principal");
  const thumbs = document.getElementById("lista-thumbs");

  const urls = [0, 1, 2].map((i) => imagemProduto(produtoAtual, i));

  principal.src = urls[0];
  principal.alt = produtoAtual.nome;
  principal.onerror = () => {
    principal.onerror = null;
    principal.src = fallbackImagem(`${produtoAtual.id}-0`);
  };

  thumbs.innerHTML = urls
    .map(
      (url, i) => `
    <button type="button" class="thumb-btn ${i === 0 ? "active" : ""}" data-src="${url}"
      aria-label="Imagem ${i + 1}">
      <img src="${url}" alt="" loading="lazy"
        onerror="this.onerror=null;this.src='${fallbackImagem(produtoAtual.id + "-" + i, 160, 180)}'">
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
    addToCart(produtoAtual.id, Number(document.getElementById("input-qty").value), tamanhoSelecionado);
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
}

function sincronizarBotaoFav() {
  const btn = document.getElementById("btn-favoritar");
  const ativo = isFav(produtoAtual.id);
  btn.classList.toggle("active", ativo);
  btn.innerHTML = `<i class="bi ${ativo ? "bi-heart-fill" : "bi-heart"}"></i>`;
}

/* ---------------- Avaliações ---------------- */

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

  const html = [0, 1, 2].map((i) => {
    const idx = (inicio + i) % nomes.length;
    const iniciais = nomes[idx]
      .split(" ")
      .map((parte) => parte[0])
      .join("")
      .replace(".", "");
    return `
    <div class="col-md-4">
      <div class="bg-surface-2 border-subtle rounded-3 p-3 h-100">
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="review-avatar">${iniciais}</span>
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

  document.getElementById("lista-avaliacoes").innerHTML = html;
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
