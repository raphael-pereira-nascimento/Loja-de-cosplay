/* ============================================================
   CosplayHub — Página de favoritos
   ============================================================ */

document.addEventListener("DOMContentLoaded", renderFavoritos);

function renderFavoritos() {
  const ids = getFavs();
  const grid = document.getElementById("grid-favoritos");
  const vazio = document.getElementById("sem-favoritos");
  const btnTodos = document.getElementById("btn-add-todos-carrinho");
  const contador = document.getElementById("contador-favs");

  if (ids.length === 0) {
    grid.innerHTML = "";
    vazio.classList.remove("d-none");
    btnTodos.classList.add("d-none");
    contador.textContent = "Você ainda não salvou nenhum item.";
    return;
  }

  const produtos = ids.map(buscarProduto).filter(Boolean);
  grid.innerHTML = produtos.map(productCardHTML).join("");
  vazio.classList.add("d-none");
  btnTodos.classList.remove("d-none");
  contador.textContent =
    produtos.length === 1
      ? "1 produto salvo na sua lista."
      : `${produtos.length} produtos salvos na sua lista.`;
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-add-todos-carrinho")) {
    const produtos = getFavs().map(buscarProduto).filter(Boolean);
    produtos.forEach((p) => addToCart(p.id, 1, null));
    showToast(`${produtos.length} itens movidos para o carrinho!`, "success");
  }
});
