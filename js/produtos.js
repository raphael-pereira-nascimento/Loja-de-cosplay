/* ============================================================
   CosplayHub — Catálogo (filtros, busca e ordenação)
   ============================================================ */

const TAMANHOS_FILTRO = ["P", "M", "G", "GG", "Único"];

const filtros = {
  q: "",
  cat: "",
  preco: "todos",
  tamanhos: [],
  promo: false,
  sort: "relevancia",
};

document.addEventListener("DOMContentLoaded", () => {
  montarListaCategorias();
  lerParametrosURL();
  wireEventos();
  aplicarFiltros();
});

function montarListaCategorias() {
  const lista = document.getElementById("lista-categorias");
  lista.innerHTML = CATEGORIAS.map(
    (c) => `
    <div class="form-check mb-2">
      <input class="form-check-input filtro-cat" type="radio" name="cat" id="cat-${c.id}" value="${c.id}">
      <label class="form-check-label small" for="cat-${c.id}">${c.nome}</label>
    </div>`
  ).join("");

  const boxTamanhos = document.getElementById("lista-tamanhos");
  if (boxTamanhos) {
    boxTamanhos.innerHTML = TAMANHOS_FILTRO.map(
      (t) => `
      <div class="col-6">
        <div class="form-check mb-1">
          <input class="form-check-input filtro-tam" type="checkbox" id="tam-${encodeURIComponent(t)}" value="${t}">
          <label class="form-check-label small" for="tam-${encodeURIComponent(t)}">${t}</label>
        </div>
      </div>`
    ).join("");
  }
}

function lerParametrosURL() {
  const q = param("q");
  const cat = param("cat");
  const sort = param("sort");
  const promo = param("promo");
  const preco = param("preco");
  const tam = param("tam");

  if (q) {
    filtros.q = q;
    document.querySelector('#filtro-busca input[name="q"]').value = q;
  }
  if (cat && CATEGORIAS.some((c) => c.id === cat)) {
    filtros.cat = cat;
    const radio = document.getElementById(`cat-${cat}`);
    if (radio) radio.checked = true;
  }
  if (sort) {
    filtros.sort = sort;
    document.getElementById("ordenar").value = sort;
  }
  if (promo === "1") {
    filtros.promo = true;
    document.getElementById("filtro-promo").checked = true;
  }
  if (preco && ["ate200", "ate500", "ate1000", "mais1000"].includes(preco)) {
    filtros.preco = preco;
    const radio = document.getElementById(`preco-${preco}`);
    if (radio) radio.checked = true;
  }
  if (tam) {
    const selecionados = tam.split(",").filter((t) => TAMANHOS_FILTRO.includes(t));
    filtros.tamanhos = selecionados;
    selecionados.forEach((t) => {
      const cb = document.getElementById(`tam-${encodeURIComponent(t)}`);
      if (cb) cb.checked = true;
    });
  }
}

function wireEventos() {
  const campoBusca = document.querySelector('#filtro-busca input[name="q"]');
  let timerBusca = null;
  campoBusca.addEventListener("input", () => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(() => {
      filtros.q = campoBusca.value.trim().toLowerCase();
      aplicarFiltros();
    }, 300);
  });

  document.querySelectorAll(".filtro-cat").forEach((radio) =>
    radio.addEventListener("change", () => {
      filtros.cat = radio.value;
      aplicarFiltros();
    })
  );

  document.querySelectorAll(".filtro-preco").forEach((radio) =>
    radio.addEventListener("change", () => {
      filtros.preco = radio.value;
      aplicarFiltros();
    })
  );

  document.querySelectorAll(".filtro-tam").forEach((check) =>
    check.addEventListener("change", () => {
      const marcados = [...document.querySelectorAll(".filtro-tam:checked")];
      filtros.tamanhos = marcados.map((c) => c.value);
      aplicarFiltros();
    })
  );

  document.getElementById("filtro-promo").addEventListener("change", (e) => {
    filtros.promo = e.target.checked;
    aplicarFiltros();
  });

  document.getElementById("ordenar").addEventListener("change", (e) => {
    filtros.sort = e.target.value;
    aplicarFiltros();
  });
}

function limparFiltros() {
  filtros.q = "";
  filtros.cat = "";
  filtros.preco = "todos";
  filtros.tamanhos = [];
  filtros.promo = false;
  filtros.sort = "relevancia";

  const busca = document.querySelector('#filtro-busca input[name="q"]');
  busca.value = "";
  document.getElementById("cat-todas").checked = true;
  document.getElementById("preco-todos").checked = true;
  document.querySelectorAll(".filtro-tam").forEach((c) => (c.checked = false));
  document.getElementById("filtro-promo").checked = false;
  document.getElementById("ordenar").value = "relevancia";

  window.history.replaceState({}, "", "produtos.html");
  aplicarFiltros();
}

function produtoPassaNosFiltros(p) {
  if (filtros.q) {
    const alvo = `${p.nome} ${nomeCategoria(p.categoria)} ${p.descricao}`.toLowerCase();
    if (!alvo.includes(filtros.q)) return false;
  }
  if (filtros.cat && p.categoria !== filtros.cat) return false;

  if (
    filtros.tamanhos.length > 0 &&
    !p.tamanhos.some((t) => filtros.tamanhos.includes(t))
  ) {
    return false;
  }

  switch (filtros.preco) {
    case "ate200": if (p.preco > 200) return false; break;
    case "ate500": if (p.preco < 200 || p.preco > 500) return false; break;
    case "ate1000": if (p.preco < 500 || p.preco > 1000) return false; break;
    case "mais1000": if (p.preco <= 1000) return false; break;
  }

  if (filtros.promo && !descontoPercentual(p)) return false;
  return true;
}

function ordenarProdutos(lista) {
  const copia = [...lista];
  switch (filtros.sort) {
    case "menor-preco": copia.sort((a, b) => a.preco - b.preco); break;
    case "maior-preco": copia.sort((a, b) => b.preco - a.preco); break;
    case "mais-vendidos": copia.sort((a, b) => b.vendas - a.vendas); break;
    case "melhor-avaliados": copia.sort((a, b) => b.avaliacao - a.avaliacao); break;
    case "novidades": copia.sort((a, b) => Number(b.novidade) - Number(a.novidade)); break;
    default:
      copia.sort(
        (a, b) =>
          Number(b.destaque) - Number(a.destaque) || b.avaliacao - a.avaliacao
      );
  }
  return copia;
}

function renderizarChips() {
  const container = document.getElementById("chips-ativos");
  const chips = [];

  if (filtros.q) chips.push({ label: `<i class="bi bi-search me-1"></i>"${filtros.q}"`, limpar: "q" });
  if (filtros.cat) chips.push({ label: nomeCategoria(filtros.cat), limpar: "cat" });
  if (filtros.preco !== "todos") {
    const rotulos = { ate200: "Até R$200", ate500: "R$200–500", ate1000: "R$500–1.000", mais1000: "Acima de R$1.000" };
    chips.push({ label: rotulos[filtros.preco], limpar: "preco" });
  }
  if (filtros.promo) chips.push({ label: "Em promoção", limpar: "promo" });
  if (filtros.tamanhos.length > 0) {
    chips.push({
      label: `<i class="bi bi-rulers me-1"></i>Tam.: ${filtros.tamanhos.join(", ")}`,
      limpar: "tamanhos",
    });
  }

  container.innerHTML = chips
    .map(
      (chip) => `
    <button class="chip active border-0" data-limpar="${chip.limpar}">
      ${chip.label} <i class="bi bi-x-lg small"></i>
    </button>`
    )
    .join("");

  container.querySelectorAll("[data-limpar]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const qual = btn.dataset.limpar;
      if (qual === "q") {
        filtros.q = "";
        document.querySelector('#filtro-busca input[name="q"]').value = "";
      } else if (qual === "cat") {
        filtros.cat = "";
        document.getElementById("cat-todas").checked = true;
      } else if (qual === "preco") {
        filtros.preco = "todos";
        document.getElementById("preco-todos").checked = true;
      } else if (qual === "promo") {
        filtros.promo = false;
        document.getElementById("filtro-promo").checked = false;
      } else if (qual === "tamanhos") {
        filtros.tamanhos = [];
        document.querySelectorAll(".filtro-tam").forEach((c) => (c.checked = false));
      }
      aplicarFiltros();
    })
  );
}

function aplicarFiltros() {
  const resultados = ordenarProdutos(PRODUTOS.filter(produtoPassaNosFiltros));
  const grid = document.getElementById("grid-produtos");
  const vazio = document.getElementById("sem-resultados");

  grid.innerHTML = resultados.map(productCardHTML).join("");
  vazio.classList.toggle("d-none", resultados.length > 0);
  document.getElementById("contador-resultados").innerHTML =
    `<strong>${resultados.length}</strong> ${resultados.length === 1 ? "produto encontrado" : "produtos encontrados"}`;

  renderizarChips();
  sincronizarURL();
  aplicarReveals();
  if (typeof atualizarBarraComparacao === "function") atualizarBarraComparacao();
}

function sincronizarURL() {
  const params = new URLSearchParams();
  if (filtros.q) params.set("q", filtros.q);
  if (filtros.cat) params.set("cat", filtros.cat);
  if (filtros.preco !== "todos") params.set("preco", filtros.preco);
  if (filtros.tamanhos.length > 0) params.set("tam", filtros.tamanhos.join(","));
  if (filtros.promo) params.set("promo", "1");
  if (filtros.sort !== "relevancia") params.set("sort", filtros.sort);
  const qs = params.toString();
  const novaURL = qs ? `produtos.html?${qs}` : "produtos.html";
  window.history.replaceState({}, "", novaURL);
}
