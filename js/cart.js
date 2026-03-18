import { readPath, pushPath, updatePath } from "./firebase.js";
import { CART_KEY, updateCartCount } from "./main.js";

function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); }
function formatPrice(v){ return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

function renderCart(){
  const cart = getCart();
  const wrap = document.getElementById("cartItems");
  const summary = document.getElementById("cartSummary");
  if(!cart.length){
    wrap.innerHTML = '<div class="empty-state">Seu carrinho está vazio.</div>';
    summary.innerHTML = '<p>Total: R$ 0,00</p>';
    return;
  }
  wrap.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <b>${item.name}</b>
        <div class="info-text">${formatPrice(item.price)}</div>
        <div class="qty-row">
          <button class="qty-btn" data-act="minus" data-id="${item.id}">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-act="plus" data-id="${item.id}">+</button>
        </div>
      </div>
      <div>
        <b>${formatPrice(item.price * item.qty)}</b><br>
        <button class="btn btn-ghost remove-item" data-id="${item.id}" style="margin-top:10px">Remover</button>
      </div>
    </div>
  `).join("");
  const subtotal = cart.reduce((s,i)=>s+(i.price*i.qty),0);
  summary.innerHTML = `
    <p>Subtotal: <b>${formatPrice(subtotal)}</b></p>
    <p>Frete: <b>${subtotal >= 600 ? 'Grátis' : 'Calculado depois'}</b></p>
    <p>Total: <b>${formatPrice(subtotal)}</b></p>
  `;
  wrap.querySelectorAll(".qty-btn").forEach(btn => btn.addEventListener("click", () => {
    const id = btn.dataset.id, act = btn.dataset.act;
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if(!item) return;
    if(act === "plus") item.qty += 1;
    if(act === "minus") item.qty = Math.max(1, item.qty - 1);
    saveCart(cart); renderCart();
  }));
  wrap.querySelectorAll(".remove-item").forEach(btn => btn.addEventListener("click", () => {
    saveCart(getCart().filter(i => i.id !== btn.dataset.id)); renderCart();
  }));
}

async function checkout(){
  const notice = document.getElementById("checkoutNotice");
  const cart = getCart();
  if(!cart.length){
    notice.innerHTML = '<div class="notice error">Seu carrinho está vazio.</div>'; return;
  }
  const name = document.getElementById("checkoutName").value.trim();
  const phone = document.getElementById("checkoutPhone").value.trim();
  const notes = document.getElementById("checkoutNotes").value.trim();
  if(!name || !phone){
    notice.innerHTML = '<div class="notice error">Preencha nome e WhatsApp.</div>'; return;
  }
  const dbProducts = await readPath("products/products/items");
  for(const item of cart){
    const p = dbProducts[item.id];
    if(!p || Number(p.stock||0) < item.qty){
      notice.innerHTML = `<div class="notice error">Estoque insuficiente para ${item.name}.</div>`; return;
    }
  }
  const total = cart.reduce((s,i)=>s+(i.price*i.qty),0);
  const order = {
    customerName:name,
    customerPhone:phone,
    notes,
    items: cart,
    total,
    status:"Pendente",
    createdAt: new Date().toISOString()
  };
  try{
    const key = await pushPath("orders", order);
    for(const item of cart){
      const current = dbProducts[item.id];
      const newStock = Number(current.stock||0) - item.qty;
      await updatePath(`products/products/items/${item.id}`, { stock:newStock });
    }
    saveCart([]);
    renderCart();
    notice.innerHTML = `<div class="notice">Pedido ${key} gerado com sucesso. Agora você pode integrar PIX/cartão depois ou confirmar pelo WhatsApp.</div>`;
  }catch(e){
    notice.innerHTML = `<div class="notice error">Erro ao gerar pedido: ${e.message}</div>`;
  }
}

renderCart();
document.getElementById("checkoutBtn")?.addEventListener("click", checkout);