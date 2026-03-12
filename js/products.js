
window.DS = window.DS || {};

DS.renderProductGrid = (selector, items)=>{
  const root = document.querySelector(selector);
  if(!root) return;
  root.innerHTML = items.map(p => `
    <article class="product-card reveal">
      <a class="product-media" href="produto.html?id=${p.id}">
        <span class="product-chip">Coleção ${p.collection}</span>
        <img src="assets/images/${p.images?.[0] || ''}" alt="${p.name}" loading="lazy">
      </a>
      <div class="product-body">
        <div class="product-meta">
          <span>${p.category[0].toUpperCase() + p.category.slice(1)}</span>
          <span>${DS.stars(p.rating)} (${p.reviews})</span>
        </div>
        <h3><a href="produto.html?id=${p.id}">${p.name}</a></h3>
        <div class="price-row">
          <span class="price-old">${DS.formatBRL(p.compare_at)}</span>
          <span class="price-now">${DS.formatBRL(p.price)}</span>
        </div>
        <div class="product-note">🔥 ${p.sold} vendidos</div>
        <div class="product-actions">
          <a class="btn-outline" href="produto.html?id=${p.id}">Ver produto</a>
          <button class="btn" data-buy-now="${p.id}">Comprar</button>
        </div>
      </div>
    </article>
  `).join('');
  root.querySelectorAll('[data-buy-now]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const product = DS.getProduct(btn.dataset.buyNow);
      DS.addToCart({productId: product.id, size: product.sizes?.[0] || null, qty:1});
      alert('Produto adicionado ao carrinho.');
    })
  });
};

DS.renderPageProducts = (category, selector, limit=null)=>{
  let items = (window.PRODUCTS || []).filter(p => p.category === category);
  if(limit) items = items.slice(0, limit);
  DS.renderProductGrid(selector, items);
};

DS.renderFeatured = ()=>{
  const items = [
    'terno-preto-classico','terno-azul-marinho-premium','relogio-diamondsect-classic',
    'pulseira-diamondsect-cuban-steel','diamondsect-imperium','diamondsect-noir-elite'
  ].map(id => DS.getProduct(id)).filter(Boolean);
  DS.renderProductGrid('[data-featured-products]', items);
};

DS.setupCategoryFilter = ()=>{
  const pills = document.querySelectorAll('[data-filter]');
  const root = document.querySelector('[data-products-grid]');
  if(!pills.length || !root) return;
  pills.forEach(pill=>{
    pill.addEventListener('click', ()=>{
      pills.forEach(p=> p.classList.remove('active'));
      pill.classList.add('active');
      const category = pill.dataset.filter;
      const items = category === 'all' ? window.PRODUCTS : window.PRODUCTS.filter(p=> p.category === category);
      DS.renderProductGrid('[data-products-grid]', items);
    })
  });
};

DS.renderProductDetails = ()=>{
  const root = document.querySelector('[data-product-root]');
  if(!root) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const p = DS.getProduct(id) || window.PRODUCTS?.[0];
  if(!p) return;

  document.title = `${p.name} | Diamondsect`;
  root.innerHTML = `
    <div class="breadcrumbs"><a href="index.html">Home</a> / <a href="${p.category}.html">${p.category}</a> / <span>${p.name}</span></div>
    <div class="page-grid">
      <div class="gallery">
        <div class="thumb-list">
          ${p.images.map((img,idx)=>`
            <button class="thumb ${idx===0?'active':''}" data-thumb="assets/images/${img}">
              <img src="assets/images/${img}" alt="${p.name}" loading="lazy">
            </button>`).join('')}
        </div>
        <div class="main-image">
          <img src="assets/images/${p.images[0]}" alt="${p.name}" id="mainProductImage">
        </div>
      </div>
      <div class="product-panel">
        <div class="rating-row">
          <span>${DS.stars(p.rating)} ${p.reviews} avaliações</span>
          <span class="sold-badge">🔥 ${p.sold} vendidos</span>
        </div>
        <div class="tag-row">
          <span class="tag">Coleção ${p.collection}</span>
          <span class="tag">${p.guarantee}</span>
          <span class="tag">${p.shipping_days}</span>
        </div>
        <h1 class="product-title">${p.name}</h1>
        <p class="section-copy" style="margin:0">${p.description}</p>
        <div class="price-row" style="margin-top:8px">
          <span class="price-old">${DS.formatBRL(p.compare_at)}</span>
          <span class="price-now">${DS.formatBRL(p.price)}</span>
        </div>
        <div class="stock-badge" id="stockMessage"></div>
        ${p.sizes?.length ? `
          <div>
            <h3>Selecionar tamanho</h3>
            <div class="size-grid">
              ${p.sizes.map((s,idx)=> `<button class="size-btn ${idx===0?'active':''}" data-size="${s}">${s}</button>`).join('')}
            </div>
          </div>` : ''}
        <div class="qty-row">
          <div class="qty-box">
            <button type="button" id="minusQty">−</button>
            <input id="qtyInput" value="1" inputmode="numeric">
            <button type="button" id="plusQty">+</button>
          </div>
          <button class="btn" id="addToCartButton">Adicionar ao carrinho</button>
          <a class="btn-outline" href="carrinho.html">Ir para o carrinho</a>
        </div>
        <div class="divider"></div>
        <div class="info-list">
          ${p.features.map(f => `<div class="info-item">✔ <span>${f}</span></div>`).join('')}
        </div>
        <div class="divider"></div>
        <div class="trust-grid">
          <div class="trust-item"><strong>Pagamento seguro</strong><div class="section-copy">PIX e cartão com estrutura pronta para integração real.</div></div>
          <div class="trust-item"><strong>Embalagem Premium</strong><div class="section-copy">Caixa Diamondsect + capa de terno + cartão da marca.</div></div>
          <div class="trust-item"><strong>Frete grátis</strong><div class="section-copy">Pedidos acima de R$600.</div></div>
          <div class="trust-item"><strong>Garantia Diamondsect</strong><div class="section-copy">Troca fácil em até 30 dias.</div></div>
        </div>
      </div>
    </div>
    ${p.category === 'ternos' ? `
      <section class="section">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Tamanho</th><th>Peito</th><th>Ombro</th><th>Cintura</th></tr></thead>
            <tbody>
              <tr><td>46</td><td>92–96 cm</td><td>44 cm</td><td>80 cm</td></tr>
              <tr><td>48</td><td>96–100 cm</td><td>45 cm</td><td>84 cm</td></tr>
              <tr><td>50</td><td>100–104 cm</td><td>46 cm</td><td>88 cm</td></tr>
              <tr><td>52</td><td>104–108 cm</td><td>47 cm</td><td>92 cm</td></tr>
              <tr><td>54</td><td>108–112 cm</td><td>48 cm</td><td>96 cm</td></tr>
            </tbody>
          </table>
        </div>
      </section>` : ''}
    <section class="section">
      <div class="banner">
        <div class="banner-grid">
          <div>
            <div class="eyebrow">Checkout inteligente</div>
            <h2 class="section-title" style="margin-bottom:8px">Complete seu estilo</h2>
            <p class="section-copy">No checkout, a Diamondsect oferece perfumes com preço especial para elevar o valor do pedido e a experiência da marca.</p>
          </div>
          <a class="btn" href="checkout.html">Finalizar compra</a>
        </div>
      </div>
    </section>
  `;

  const mainImage = document.getElementById('mainProductImage');
  root.querySelectorAll('[data-thumb]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      root.querySelectorAll('.thumb').forEach(t=> t.classList.remove('active'));
      btn.classList.add('active');
      mainImage.src = btn.dataset.thumb;
    })
  });

  let selectedSize = p.sizes?.[0] || null;
  const stockMessage = document.getElementById('stockMessage');
  const updateStock = ()=>{
    const current = selectedSize ? p.stock[selectedSize] : p.stock.default;
    stockMessage.textContent = current <= 3
      ? `⚠️ Apenas ${current} unidades restantes${selectedSize ? ` no tamanho ${selectedSize}` : ''}.`
      : `🔥 Alta procura — estoque limitado${selectedSize ? ` no tamanho ${selectedSize}` : ''}.`;
  };
  updateStock();

  root.querySelectorAll('[data-size]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      root.querySelectorAll('[data-size]').forEach(b=> b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.dataset.size;
      updateStock();
    })
  });

  const qtyInput = document.getElementById('qtyInput');
  document.getElementById('minusQty')?.addEventListener('click', ()=> qtyInput.value = Math.max(1, (+qtyInput.value || 1) - 1));
  document.getElementById('plusQty')?.addEventListener('click', ()=> qtyInput.value = Math.max(1, (+qtyInput.value || 1) + 1));
  document.getElementById('addToCartButton')?.addEventListener('click', ()=>{
    DS.addToCart({productId:p.id, size:selectedSize, qty:Math.max(1, +qtyInput.value || 1)});
    alert('Produto adicionado ao carrinho.');
  });
};

DS.renderCart = ()=>{
  const root = document.querySelector('[data-cart-root]');
  if(!root) return;
  const cart = DS.getCart();
  if(!cart.length){
    root.innerHTML = `<div class="empty-state"><h2>Seu carrinho está vazio.</h2><p class="section-copy">Escolha uma peça Diamondsect para começar.</p><a class="btn" href="ternos.html">Explorar produtos</a></div>`;
    const summary = document.querySelector('[data-summary-root]');
    if(summary) summary.innerHTML = '';
    return;
  }

  root.innerHTML = cart.map(item=>{
    const product = DS.getProduct(item.productId);
    return `
      <article class="cart-item">
        <img src="assets/images/${item.image}" alt="${item.name}">
        <div>
          <h3>${item.name}</h3>
          <div class="cart-meta">Coleção ${item.collection || '-'}<br>${item.size ? `Tamanho ${item.size}<br>` : ''}Entrega: ${product?.shipping_days || 'Até 10 dias úteis'}</div>
          <div class="cart-controls">
            <div class="qty-box">
              <button type="button" data-qty-minus="${item.key}">−</button>
              <input value="${item.qty}" readonly>
              <button type="button" data-qty-plus="${item.key}">+</button>
            </div>
            <button class="btn-outline" data-remove="${item.key}">Remover</button>
          </div>
        </div>
        <div><strong>${DS.formatBRL(item.price * item.qty)}</strong></div>
      </article>
    `;
  }).join('');

  root.querySelectorAll('[data-remove]').forEach(btn=> btn.addEventListener('click', ()=>{ DS.removeFromCart(btn.dataset.remove); location.reload(); }));
  root.querySelectorAll('[data-qty-minus]').forEach(btn=> btn.addEventListener('click', ()=>{ 
    const item = DS.getCart().find(i=> i.key === btn.dataset.qtyMinus); 
    DS.changeQty(btn.dataset.qtyMinus, (item?.qty || 1) - 1); location.reload(); 
  }));
  root.querySelectorAll('[data-qty-plus]').forEach(btn=> btn.addEventListener('click', ()=>{ 
    const item = DS.getCart().find(i=> i.key === btn.dataset.qtyPlus); 
    DS.changeQty(btn.dataset.qtyPlus, (item?.qty || 1) + 1); location.reload(); 
  }));

  const totals = DS.cartTotals();
  const summary = document.querySelector('[data-summary-root]');
  if(summary){
    const remaining = Math.max(0, 600 - totals.subtotal);
    summary.innerHTML = `
      <div class="summary-box">
        <h3>Resumo do pedido</h3>
        <div class="summary-line"><span>Subtotal</span><strong>${DS.formatBRL(totals.subtotal)}</strong></div>
        <div class="summary-line"><span>Desconto</span><strong>- ${DS.formatBRL(totals.coupon)}</strong></div>
        <div class="summary-line"><span>Frete</span><strong>${totals.shipping === 0 ? 'Grátis' : DS.formatBRL(totals.shipping)}</strong></div>
        <div class="divider"></div>
        <div class="summary-line total"><span>Total</span><strong>${DS.formatBRL(totals.total)}</strong></div>
        <div class="notice">${remaining > 0 ? `Adicione mais ${DS.formatBRL(remaining)} para ganhar frete grátis.` : 'Seu pedido já ganhou frete grátis.'}</div>
        <form data-coupon-form>
          <label>Cupom</label>
          <div style="display:flex; gap:10px; margin-top:8px">
            <input class="input" placeholder="Digite DIAMOND10">
            <button class="btn" type="submit">Aplicar</button>
          </div>
        </form>
        <a class="btn" href="checkout.html">Finalizar compra</a>
      </div>`;
  }
};

DS.renderCheckout = ()=>{
  const root = document.querySelector('[data-checkout-root]');
  if(!root) return;
  const cart = DS.getCart();
  const totals = DS.cartTotals();
  const perfumes = ['diamondsect-noir-elite','diamondsect-golden-dominion','diamondsect-imperium'].map(id=> DS.getProduct(id)).filter(Boolean);

  root.innerHTML = `
    <div class="checkout-grid">
      <form class="checkout-card" data-checkout-form>
        <div class="eyebrow">Checkout</div>
        <h1 class="section-title" style="font-size:2.4rem">Finalize seu pedido</h1>
        <div class="contact-grid">
          <div><label>Nome completo</label><input required class="input" placeholder="Seu nome"></div>
          <div><label>E-mail</label><input required class="input" type="email" value="rickgoncallvess@gmail.com"></div>
          <div><label>WhatsApp</label><input class="input" placeholder="+55 11 99999-9999"></div>
          <div><label>CEP</label><input class="input" placeholder="00000-000"></div>
          <div><label>Cidade</label><input class="input" placeholder="Sua cidade"></div>
          <div><label>Estado</label><input class="input" placeholder="UF"></div>
          <div style="grid-column:1/-1"><label>Endereço</label><input class="input" placeholder="Rua, número e complemento"></div>
        </div>
        <div class="divider"></div>
        <h3>Pagamento</h3>
        <div class="checkout-methods">
          <button type="button" class="method active" data-method="pix"><span>PIX</span><strong>QR Code e código copia e cola</strong></button>
          <button type="button" class="method" data-method="cartao"><span>Cartão</span><strong>Estrutura pronta para Mercado Pago / Stripe</strong></button>
        </div>
        <div class="notice">Este checkout está pronto visualmente para GitHub Pages. Para cobrança real, conecte Mercado Pago ou Stripe depois.</div>
        <div class="divider"></div>
        <h3>Adicione ao seu pedido</h3>
        <div class="order-bump">
          ${perfumes.map(p=>`
            <label class="bump-item">
              <img src="assets/images/${p.images[0]}" alt="${p.name}">
              <div>
                <strong>${p.name}</strong>
                <div class="cart-meta">${p.short}</div>
              </div>
              <div>
                <div class="price-old">${DS.formatBRL(p.compare_at)}</div>
                <div><strong>${DS.formatBRL(p.price-70)}</strong></div>
                <input type="checkbox" data-bump="${p.id}">
              </div>
            </label>
          `).join('')}
        </div>
        <button class="btn" type="submit" style="margin-top:18px">Confirmar pedido</button>
      </form>
      <div class="checkout-card">
        <h3>Resumo</h3>
        <div class="cart-list">
          ${cart.map(item=> `<div class="summary-line"><span>${item.name}${item.size ? ` · ${item.size}` : ''} × ${item.qty}</span><strong>${DS.formatBRL(item.qty * item.price)}</strong></div>`).join('')}
        </div>
        <div class="divider"></div>
        <div class="summary-line"><span>Subtotal</span><strong>${DS.formatBRL(totals.subtotal)}</strong></div>
        <div class="summary-line"><span>Desconto</span><strong>- ${DS.formatBRL(totals.coupon)}</strong></div>
        <div class="summary-line"><span>Frete</span><strong>${totals.shipping === 0 ? 'Grátis' : DS.formatBRL(totals.shipping)}</strong></div>
        <div class="divider"></div>
        <div class="summary-line total"><span>Total</span><strong>${DS.formatBRL(totals.total)}</strong></div>
        <div class="notice">Frete grátis acima de R$600 · Entrega em até 10 dias úteis · Troca fácil em 30 dias.</div>
      </div>
    </div>
  `;
  root.querySelectorAll('.method').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      root.querySelectorAll('.method').forEach(x=> x.classList.remove('active'));
      btn.classList.add('active');
    })
  });
};

DS.renderOrderTracking = ()=>{
  const root = document.querySelector('[data-tracking-root]');
  if(!root) return;
  const last = JSON.parse(localStorage.getItem('ds_last_order') || 'null');
  const params = new URLSearchParams(location.search);
  root.innerHTML = last ? `
    <div class="search-card">
      ${params.get('success') ? '<div class="notice">Pedido confirmado com sucesso.</div>' : ''}
      <div class="eyebrow">Rastrear pedido</div>
      <h1 class="section-title" style="font-size:2.5rem">Pedido ${last.number}</h1>
      <p class="section-copy">Última atualização: pagamento aprovado, preparação em andamento.</p>
      <div class="trust-grid">
        <div class="trust-item"><strong>Data do pedido</strong><div>${last.date}</div></div>
        <div class="trust-item"><strong>Pagamento</strong><div>${last.method.toUpperCase()}</div></div>
        <div class="trust-item"><strong>Total</strong><div>${DS.formatBRL(last.total)}</div></div>
        <div class="trust-item"><strong>Entrega estimada</strong><div>Até 10 dias úteis</div></div>
      </div>
    </div>` : `
    <div class="empty-state">
      <h2>Nenhum pedido encontrado.</h2>
      <p class="section-copy">Finalize um pedido para acompanhar o rastreio por aqui.</p>
      <a class="btn" href="index.html">Voltar para a loja</a>
    </div>`;
};

document.addEventListener('DOMContentLoaded', ()=>{
  DS.renderFeatured();
  DS.renderProductDetails();
  DS.renderCart();
  DS.renderCheckout();
  DS.renderOrderTracking();

  const grid = document.querySelector('[data-products-grid]');
  if(grid){
    const category = grid.dataset.category;
    DS.renderPageProducts(category, '[data-products-grid]');
  }
  DS.setupCategoryFilter();
});
