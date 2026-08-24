/* ============================================================
   CosplayHub — Autenticação (login e cadastro)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  wireLogin();
  wireCadastro();
  wireTelefone();
});

/* ---------------- Login ---------------- */

function wireLogin() {
  const form = document.getElementById("form-login");
  if (!form) return;

  const senha = document.getElementById("login-senha");
  const toggle = document.getElementById("toggle-senha");
  toggle.addEventListener("click", () => {
    const visivel = senha.type === "text";
    senha.type = visivel ? "password" : "text";
    toggle.innerHTML = `<i class="bi ${visivel ? "bi-eye" : "bi-eye-slash"}"></i>`;
    toggle.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const alerta = document.getElementById("alerta-login");

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const email = document.getElementById("login-email").value.trim();
    const valorSenha = senha.value;

    if (loginUser(email, valorSenha)) {
      showToast(`Bem-vindo de volta! 🎭`, "success");
      setTimeout(() => {
        window.location.href = param("redirect") || "index.html";
      }, 600);
    } else {
      alerta.classList.remove("d-none");
      senha.value = "";
      senha.focus();
    }
  });
}

/* ---------------- Cadastro ---------------- */

function wireCadastro() {
  const form = document.getElementById("form-cadastro");
  if (!form) return;

  const senha = document.getElementById("cad-senha");
  senha.addEventListener("input", atualizarForcaSenha);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("alerta-email").classList.add("d-none");

    if (!validarCadastro(form)) return;

    registerUser({
      nome: document.getElementById("cad-nome").value.trim(),
      email: document.getElementById("cad-email").value.trim(),
      senha: senha.value,
      telefone: document.getElementById("cad-telefone").value,
      nascimento: document.getElementById("cad-nascimento").value,
    });

    loginUser(
      document.getElementById("cad-email").value.trim(),
      senha.value
    );

    showToast("Conta criada com sucesso! Bem-vindo ao CosplayHub! 🎉", "success");
    setTimeout(() => {
      window.location.href = param("redirect") || "index.html";
    }, 800);
  });
}

function validarCadastro(form) {
  const senha = document.getElementById("cad-senha").value;
  const senha2 = document.getElementById("cad-senha2");
  const email = document.getElementById("cad-email").value.trim();
  let valido = true;

  if (!form.checkValidity()) valido = false;

  if (senha !== senha2.value) {
    senha2.setCustomValidity("diferente");
    valido = false;
  } else {
    senha2.setCustomValidity("");
  }
  document.getElementById("senha2-feedback").textContent =
    senha && senha2.value && senha !== senha2.value
      ? "As senhas não coincidem."
      : "Repita a senha.";

  if (emailEmUso(email)) {
    document.getElementById("alerta-email").classList.remove("d-none");
    valido = false;
  }

  if (!valido) {
    form.classList.add("was-validated");
    showToast("Verifique os campos destacados.", "warning");
    return false;
  }
  return true;
}

function atualizarForcaSenha() {
  const senha = document.getElementById("cad-senha").value;
  let forca = 0;
  if (senha.length >= 6) forca += 34;
  if (/[A-Z]/.test(senha) || /[^a-zA-Z0-9]/.test(senha)) forca += 33;
  if (/\d/.test(senha)) forca += 33;

  const barra = document.getElementById("forca-senha");
  barra.style.width = `${forca}%`;
}

/* ---------------- Máscara compartilhada ---------------- */

function wireTelefone() {
  const telefone = document.getElementById("cad-telefone");
  if (!telefone) return;
  telefone.addEventListener("input", () => {
    let v = telefone.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, v.length > 10 ? 7 : 6)}-${v.slice(v.length > 10 ? 7 : 6)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    telefone.value = v;
  });
}
