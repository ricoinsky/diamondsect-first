// ===== DIAMONDSECT — CART (Loja grande) =====

function moneyBRL(v){
  return Number(v||0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function getCart(){
  try{ return JSON.parse(localStorage.getItem("cart")) || []; }catch{ return []; }
}

function saveCart(cart){
  localStorage.setItem("cart", JSON.stringify(cart));
  window.DS?.updateCartCount?.();
}

function updateCartCount(){
  window.DS?.updateCartCount?.();
}

function findProduct(id){
  const list = window.PRODUCTS || [];
  return list.find(p => Number(p.id) === Number(id));
}

// ===== Cupom e frete (salvos no localStorage) =====
const LS_COUPON = "diamondsect_coupon_v1";
const LS_SHIP = "diamondsect_ship_v1";

function getCoupon(){
  try { return JSON.parse(localStorage.getItem(LS_COUPON)) || null; } catch { return null; }
}
function setCoupon(c){ localStorage.setItem(LS_COUPON, JSON.stringify(c)); }

function getShip(){
  try { return JSON.parse(localStorage.getItem(LS_SHIP)) || null; } catch { return null; }
}
function setShip(s){ localStorage.setItem(LS_SHIP, JSON.stringify(s)); }

function calcCouponDiscount(subtotal, coupon){
  if(!coupon) return 0;

  if(coupon.code === "DIAMOND10") return Math.round(subtotal * 0.10);
  if(coupon.code === "DIAMOND15") return Math.round(subtotal * 0.15);
  if(coupon.code === "VIP200") return 200;

  return 0;
}

function estimateShipping(subtotalAfterDiscount, ship){
  if(!ship) return 0;
  if(subtotalAfterDiscount >= 1500) return 0;
  return Number(ship.value||0);
}

function updateQty(id, delta){
  const cart = getCart();
  const item = cart.find(i => Number(i.id) === Number(id));
  if(!item) return;

  item.qty = Number(item.qty||0) + Number(delta||0);

  if(item.qty <= 0){
    saveCart(cart.filter(i => Number(i.id) !== Number(id)));
  } else {
    saveCart(cart);
  }
  renderCart();
}

function removeItem(id){
  saveCart(getCart().filter(i => Number(i.id) !== Number(id)));
  renderCart();
}

function setStatus(text){
  const pill = document.getElementById("statusPill");
  if(!pill) return;
  pill.style.display = "inline-flex";
  pill.innerHTML = `✓ ${text}`;
  setTimeout(()=>{ pill.style.display = "none"; }, 2200);
}

// ===== Recomendados =====
function renderReco(){
  const grid = document.getElementById("recoGrid");
  if(!grid) return;

  const cartIds = new Set(getCart().map(i => Number(i.id)));
  const all = (window.PRODUCTS || []).filter(p => !cartIds.has(Number(p.id)));

  const sorted = [...all].sort((a,b)=> (Number(b.soldScore||0) - Number(a.soldScore||0)));
  const pick = sorted.slice(0,6);

  if(pick.length === 0){
    grid.innerHTML = `<div class="small">Sem recomendados por enquanto.</div>`;
    return;
  }

  grid.innerHTML = pick.map(p => `
    <div class="reco-card">
      <img src="${p.image || ""}" alt="${p.name || "Produto"}">
      <div class="b">
        <p class="n">${p.name || "Produto"}</p>
        <p class="p">${moneyBRL(Number(p.price||0))}</p>
        <button type="button" data-reco="${p.id}">Adicionar</button>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll("[data-reco]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      addOne(btn.getAttribute("data-reco"));
      setStatus("Adicionado ao carrinho");
    });
  });
}

function addOne(id){
  const cart = getCart();
  const item = cart.find(i => Number(i.id) === Number(id));
  if(item) item.qty += 1;
  else cart.push({ id: Number(id), qty: 1 });
  saveCart(cart);
  renderCart();
}

// ✅ MOBILE BAR: some com carrinho vazio, e some quando o resumo estiver visível
function initMobileBarVisibility(){
  const bar = document.querySelector(".mobile-bar");
  if(!bar) return;

  // Se não estiver no carrinho, some 100%
  if(!document.body.classList.contains("cart-page")){
    bar.classList.remove("is-visible");
    return;
  }

  const summary = document.querySelector(".summary");

  function update(){
    const cart = getCart();
    const hasItems = cart.reduce((s,i)=> s + Number(i.qty||0), 0) > 0;

    // Carrinho vazio: nunca aparece
    if(!hasItems){
      bar.classList.remove("is-visible");
      return;
    }

    // Se o resumo não existir, por segurança esconde
    if(!summary){
      bar.classList.remove("is-visible");
      return;
    }

    // Se o resumo estiver visível na tela, some (evita duplicar botão)
    const rect = summary.getBoundingClientRect();
    const summaryVisible = rect.top < window.innerHeight && rect.bottom > 0;

    // Só aparece depois de rolar um pouco
    const y = window.scrollY || 0;

    if(y > 220 && !summaryVisible){
      bar.classList.add("is-visible");
    } else {
      bar.classList.remove("is-visible");
    }
  }

  update();
  window.addEventListener("scroll", update, { passive:true });
  window.addEventListener("resize", update);
}

function renderCart(){
  updateCartCount();

  const cartList = document.getElementById("cartList");
  const totalEl = document.getElementById("cartTotal");
  const mobileTotal = document.getElementById("mobileTotal");
  const itemsEl = document.getElementById("itemsCount");
  const subEl = document.getElementById("subTotal");
  const discEl = document.getElementById("discountVal");
  const shipEl = document.getElementById("shippingVal");

  if(!cartList || !totalEl || !itemsEl || !subEl || !discEl || !shipEl) return;

  const cart = getCart();

  // catálogo não carregou
  if(!(window.PRODUCTS && window.PRODUCTS.length)){
    cartList.innerHTML = `
      <div class="empty">
        <h2>Catálogo vazio</h2>
        <p>Cadastre produtos em <b>admin.html</b> para aparecerem na loja.</p>
        <a class="btn btn--light" href="admin.html">Abrir painel</a>
        <div style="height:10px"></div>
        <a class="btn" href="index.html">Voltar</a>
      </div>
    `;
    totalEl.textContent = moneyBRL(0);
    if(mobileTotal) mobileTotal.textContent = moneyBRL(0);
    itemsEl.textContent = "0";
    subEl.textContent = moneyBRL(0);
    discEl.textContent = moneyBRL(0);
    shipEl.textContent = moneyBRL(0);
    initMobileBarVisibility();
    return;
  }

  // carrinho vazio
  if(cart.length === 0){
    cartList.innerHTML = `
      <div class="empty">
        <h2>Seu carrinho está vazio</h2>
        <p>Adicione itens premium para continuar.</p>
        <a class="btn btn--light" href="index.html">Voltar para a loja</a>
      </div>
    `;
    totalEl.textContent = moneyBRL(0);
    if(mobileTotal) mobileTotal.textContent = moneyBRL(0);
    itemsEl.textContent = "0";
    subEl.textContent = moneyBRL(0);
    discEl.textContent = moneyBRL(0);
    shipEl.textContent = moneyBRL(0);
    renderReco();
    initMobileBarVisibility();
    return;
  }

  let subtotal = 0;
  let items = 0;

  cartList.innerHTML = cart.map(ci => {
    const p = findProduct(ci.id);
    if(!p) return "";

    const qty = Number(ci.qty||0);
    const price = Number(p.price||0);
    const line = price * qty;

    subtotal += line;
    items += qty;

    return `
      <div class="cart-item">
        <img src="${p.image || ""}" alt="${p.name || "Produto"}" />
        <div>
          <h3 class="ci-title">${p.name || "Produto"}</h3>
          <div class="ci-meta">Preço unitário: ${moneyBRL(price)}</div>

          <div class="ci-actions">
            <button class="qbtn" type="button" data-minus="${p.id}">−</button>
            <span class="qty">${qty}</span>
            <button class="qbtn" type="button" data-plus="${p.id}">+</button>
            <button class="rm" type="button" data-rm="${p.id}">Remover</button>
          </div>
        </div>

        <div class="ci-right">
          <div class="ci-price">${moneyBRL(line)}</div>
          <div class="ci-sub">Subtotal</div>
        </div>
      </div>
    `;
  }).join("");

  const coupon = getCoupon();
  const discount = calcCouponDiscount(subtotal, coupon);

  const ship = getShip();
  const shipping = estimateShipping(subtotal - discount, ship);

  const total = Math.max(0, subtotal - discount + shipping);

  itemsEl.textContent = String(items);
  subEl.textContent = moneyBRL(subtotal);
  discEl.textContent = moneyBRL(discount);
  shipEl.textContent = moneyBRL(shipping);
  totalEl.textContent = moneyBRL(total);
  if(mobileTotal) mobileTotal.textContent = moneyBRL(total);

  cartList.querySelectorAll("[data-plus]").forEach(btn => {
    btn.addEventListener("click", () => updateQty(btn.getAttribute("data-plus"), +1));
  });
  cartList.querySelectorAll("[data-minus]").forEach(btn => {
    btn.addEventListener("click", () => updateQty(btn.getAttribute("data-minus"), -1));
  });
  cartList.querySelectorAll("[data-rm]").forEach(btn => {
    btn.addEventListener("click", () => removeItem(btn.getAttribute("data-rm")));
  });

  renderReco();
  initMobileBarVisibility();
}

// ===== Eventos (cupom/frete/finalizar) =====
function initActions(){
  const couponInput = document.getElementById("couponInput");
  const applyCouponBtn = document.getElementById("applyCouponBtn");

  const cepInput = document.getElementById("cepInput");
  const calcShipBtn = document.getElementById("calcShipBtn");

  const finishBtn = document.getElementById("finishBtn");
  const mobileFinishBtn = document.getElementById("mobileFinishBtn");

  if(applyCouponBtn){
    applyCouponBtn.addEventListener("click", ()=>{
      const code = (couponInput?.value || "").trim().toUpperCase();

      if(!code){
        setCoupon(null);
        setStatus("Cupom removido");
        renderCart();
        return;
      }

      const valid = ["DIAMOND10","DIAMOND15","VIP200"];
      if(!valid.includes(code)){
        setStatus("Cupom inválido");
        return;
      }

      setCoupon({ code });
      setStatus(`Cupom aplicado: ${code}`);
      renderCart();
    });
  }

  if(calcShipBtn){
    calcShipBtn.addEventListener("click", ()=>{
      const cep = (cepInput?.value || "").replace(/\D/g,"");
      if(cep.length !== 8){
        setStatus("CEP inválido");
        return;
      }

      const last = Number(cep.slice(-1));
      const value = 19 + (last % 5) * 6;
      setShip({ cep, value });

      setStatus(`Frete estimado para ${cep.slice(0,5)}-${cep.slice(5)}: ${moneyBRL(value)}`);
      renderCart();
    });
  }

  function finish(){
    alert("Checkout será configurado depois (Pix/Cartão). Por enquanto: carrinho, cupom e frete já estão funcionando.");
  }

  if(finishBtn) finishBtn.addEventListener("click", finish);
  if(mobileFinishBtn) mobileFinishBtn.addEventListener("click", finish);
}

document.addEventListener("DOMContentLoaded", () => {
  initActions();
  renderCart();
  initMobileBarVisibility();
});
