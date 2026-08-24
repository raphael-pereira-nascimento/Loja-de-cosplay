/* ============================================================
   CosplayHub — Landing page
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  renderCategorias();
  renderDestaques();
  renderNovidades();

  function renderCategorias() {
    const grid = document.getElementById("grid-categorias");
    grid.innerHTML = CATEGORIAS.map((c) => {
      const total = PRODUTOS.filter((p) => p.categoria === c.id).length;
      return `
      <div class="col">
        <a href="produtos.html?cat=${c.id}" class="category-card hover-lift">
          <img src="https://loremflickr.com/640/400/${c.tag}?lock=80${CATEGORIAS.indexOf(c)}"
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
});
