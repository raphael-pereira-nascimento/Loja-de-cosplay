/* ============================================================
   CosplayHub — Landing page
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  renderCategorias();
  renderDestaques();
  renderNovidades();
  renderRecentes();
  iniciarContadorCupom();

  function renderCategorias() {
    const grid = document.getElementById("grid-categorias");
    grid.innerHTML = CATEGORIAS.map((c) => {
      const total = PRODUTOS.filter((p) => p.categoria === c.id).length;
      const url = IMAGENS_CATEGORIAS[c.id] || `https://loremflickr.com/640/400/${c.tag}?lock=80${CATEGORIAS.indexOf(c)}`;
      return `
      <div class="col">
        <a href="produtos.html?cat=${c.id}" class="category-card hover-lift">
          <img src="${url}"
            alt="${c.nome}" loading="lazy"
            onerror="this.onerror=null;this.src='https://picsum.photos/seed/ch-cat-${c.id}/640/400'">
          <span class="category-label font-display fs-5">
            <i class="bi ${c.icone} me-2"></i>${c.nome}
            <span class="category-count">${total} produtos</span>
          </span>
        </a>
      </div>`;
    }).join("");
  }

  function renderDestaques() {
    const grid = document.getElementById("grid-destaques");
    const destaques = PRODUTOS.filter((p) => p.destaque).slice(0, 8);
    grid.innerHTML = destaques.map(productCardHTML).join("");
  }

  function renderNovidades() {
    const grid = document.getElementById("grid-novidades");
    const novidades = PRODUTOS.filter((p) => p.novidade).slice(0, 4);
    grid.innerHTML = novidades.map(productCardHTML).join("");
  }

  function renderRecentes() {
    const secao = document.getElementById("secao-recentes-home");
    const grid = document.getElementById("grid-recentes");
    if (!secao || !grid) return;
    const recentes = produtosRecentes(8);
    if (recentes.length === 0) return;
    grid.innerHTML = recentes.slice(0, 4).map(productCardHTML).join("");
    secao.classList.remove("d-none");
  }

  /* Contador regressivo: reinicia à meia-noite */
  function iniciarContadorCupom() {
    const el = document.getElementById("contador-cupom");
    if (!el) return;

    function tictac() {
      const agora = new Date();
      const meiaNoite = new Date(agora);
      meiaNoite.setHours(24, 0, 0, 0);
      const resta = meiaNoite - agora;

      const h = String(Math.floor(resta / 3600000)).padStart(2, "0");
      const m = String(Math.floor((resta % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((resta % 60000) / 1000)).padStart(2, "0");

      el.textContent = `${h}:${m}:${s}`;
      setTimeout(tictac, 1000 - (resta % 1000));
    }

    tictac();
  }
});
