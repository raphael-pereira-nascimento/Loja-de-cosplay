# 🎭 CosplayHub — E-commerce de Cosplay

Projeto educacional de um e-commerce completo de cosplays, fantasias e props, construído apenas com **front-end** (sem back-end). Todos os dados (carrinho, favoritos, usuários e pedidos) são persistidos no `localStorage` do navegador.

## 🚀 Como executar

Basta abrir o arquivo `index.html` em qualquer navegador moderno. Não há build nem dependências locais — tudo é carregado via CDN.

> **Conta demo:** `demo@demo.com` · senha `123456`

## 🛠️ Stack

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura semântica das 10 páginas |
| Bootstrap 5.3 (CDN) | Layout responsivo, componentes e tema dark |
| Bootstrap Icons (CDN) | Íconografia |
| Google Fonts | `Rajdhani` (títulos) + `Poppins` (texto) |
| JavaScript (ES6+) | Regras de negócio e persistência via `localStorage` |

## 🖼️ Banco de imagens gratuito

- **[LoremFlickr](https://loremflickr.com)** — imagens temáticas por palavra-chave (usado nos produtos), com parâmetro `lock` para consistência visual.
- **[Picsum Photos](https://picsum.photos)** — fallback automático caso alguma imagem falhe.

## 📄 Páginas

| Arquivo | Descrição |
|---|---|
| `index.html` | Landing page: hero carousel, categorias, destaques, banner promocional com cupom, novidades e depoimentos |
| `produtos.html` | Catálogo com busca instantânea, filtros (categoria, faixa de preço, promoções), ordenação e chips de filtros ativos |
| `produto.html?id=X` | Detalhes: galeria de fotos, seleção de tamanho, quantidade, favoritar, abas (descrição/especificações/avaliações) e produtos relacionados |
| `favoritos.html` | Lista de favoritos com opção de mover todos para o carrinho |
| `carrinho.html` | Itens com controle de quantidade, barra de progresso para frete grátis, cupons e resumo do pedido |
| `checkout.html` | Fluxo em 3 etapas: identificação → entrega (endereço + frete) → pagamento (Pix/cartão/boleto), com tela de confirmação |
| `pedidos.html` | Histórico de pedidos do usuário logado com status dinâmico |
| `login.html` / `cadastro.html` | Autenticação simulada com validações, medidor de força de senha e redirecionamento inteligente |

## 🧪 Cupons de teste

- `COSPLAY10` — 10% de desconto
- `FRETEGRATIS` — frete grátis

Frete grátis também é aplicado automaticamente acima de **R$ 499**.

## 💾 Dados salvos no localStorage

| Chave | Conteúdo |
|---|---|
| `ch_users` | Contas cadastradas (senha com hash didático — **não usar em produção**) |
| `ch_session` | Sessão atual do usuário |
| `ch_cart` | Itens do carrinho `{id, tamanho, qty}` |
| `ch_favs` | Ids dos produtos favoritados |
| `ch_coupon` | Cupom aplicado |
| `ch_orders` | Pedidos finalizados |

## ⚠️ Aviso

Projeto com fins exclusivamente educacionais. As senhas usam uma função hash simplificada apenas para fins didáticos e os pagamentos são totalmente simulados.
