# 🎭 CosplayHub — E-commerce de Cosplay

Projeto educacional de um e-commerce completo de cosplays, fantasias e props, construído apenas com **front-end** (sem back-end). Todos os dados (carrinho, favoritos, usuários e pedidos) são persistidos no `localStorage` do navegador.

## 🚀 Como executar

Basta abrir o arquivo `index.html` em qualquer navegador moderno. Não há build nem dependências locais — tudo é carregado via CDN.

> **Conta demo:** `demo@demo.com` · senha `123456`

## 🛠️ Stack

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura semântica das 14 páginas |
| Bootstrap 5.3 (CDN) | Layout responsivo, componentes e tema dark |
| Bootstrap Icons (CDN) | Íconografia |
| Google Fonts | `Rajdhani` (títulos) + `Poppins` (texto) |
| JavaScript (ES6+) | Regras de negócio e persistência via `localStorage` |

## 🖼️ Banco de imagens gratuito

- **Flickr CC / Wikimedia Commons** (via API [Openverse](https://openverse.org)) — fotos reais e temáticas selecionadas manualmente por produto, com títulos verificados antes do uso.
- **[LoremFlickr](https://loremflickr.com)** — imagens temáticas por palavra-chave para produtos sem foto premium.
- **[Picsum Photos](https://picsum.photos)** — fallback automático caso alguma imagem falhe (`onerror`).

Créditos das fotografias: autores do Flickr/Wikimedia sob licenças Creative Commons (uso educacional).

## 📄 Páginas

| Arquivo | Descrição |
|---|---|
| `index.html` | Landing page: hero carousel, categorias, destaques, banner promocional com cupom e contador regressivo, novidades, vistos recentemente e depoimentos |
| `produtos.html` | Catálogo com busca instantânea, filtros (categoria, faixa de preço, tamanho, promoções), ordenação e chips de filtros ativos |
| `informacoes-produto.html?id=X` | Detalhes: galeria de fotos com skeleton, seleção de tamanho, quantidade, favoritar, compartilhar, avaliações da comunidade (salvas localmente) e relacionados + vistos recentemente |
| `favoritos.html` | Lista de favoritos com opção de mover todos para o carrinho |
| `carrinho.html` | Itens com controle de quantidade, barra de progresso para frete grátis, cupons e resumo do pedido |
| `checkout.html` | Fluxo em 3 etapas: identificação → entrega (endereço + frete) → pagamento (Pix/cartão/boleto), com tela de confirmação |
| `pedidos.html` | Histórico de pedidos do usuário logado com status dinâmico e rastreamento simulado em timeline animada |
| `login.html` / `cadastro.html` | Autenticação simulada com validações, medidor de força de senha e redirecionamento inteligente |
| `sobre.html` | Página institucional: história, números, missão/visão/valores e equipe |
| `faq.html` | Perguntas frequentes em accordion Bootstrap |
| `trocas.html` | Política de trocas/devoluções com passo a passo, condições e tabela de prazos de envio |
| `404.html` | Página de erro personalizada com busca e sugestões de produtos |
| `admin.html` | Painel administrativo demonstrativo (senha `admin123`) |

## ✨ Recursos especiais

- **Tema claro/escuro** — alternância na navbar com preferência salva (`ch_theme`), todo o CSS adaptado via variáveis
- **Mini-carrinho offcanvas** — abre automaticamente ao adicionar itens, com subtotal, progresso de frete grátis e ações rápidas
- **Autocomplete na busca** — sugestões com foto e preço enquanto digita (debounce 180 ms)
- **Vistos recentemente** — histórico dos últimos 12 produtos visitados (`ch_recentes`)
- **Avaliações da comunidade** — nota em estrelas + comentário salvos no navegador (`ch_reviews`)
- **Rastreamento simulado** — timeline animada por idade do pedido, com código de rastreio fictício
- **Animações on-scroll** — cards surgem suavemente via IntersectionObserver (respeita `prefers-reduced-motion`)
- **Skeleton loading** — shimmer nas imagens enquanto carregam
- **Compartilhar produto** — Web Share API com fallback de copiar link

## 🔐 Painel admin (demo)

Acesse `admin.html` com a senha **admin123** para ver métricas calculadas do localStorage:
clientes cadastrados, pedidos totais, receita, ticket médio, top 5 vendas, estoque crítico,
todos os pedidos e usuários. A sessão do admin fica em `sessionStorage`.

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
| `ch_recentes` | Últimos produtos visualizados (máx. 12) |
| `ch_reviews` | Avaliações escritas pelos usuários por produto |
| `ch_theme` | Tema escolhido (`dark` ou `light`) |

## ⚠️ Aviso

Projeto com fins exclusivamente educacionais. As senhas usam uma função hash simplificada apenas para fins didáticos e os pagamentos são totalmente simulados.
