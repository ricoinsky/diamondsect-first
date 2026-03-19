import { readPath, pushPath, updatePath } from "./firebase.js";
import { CART_KEY, updateCartCount, showToast } from "./main.js";

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
    <p>Proteção de compra: <b>Ativa</b></p>
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


function getSelectedPaymentMethod(){
  return document.querySelector('input[name="paymentMethod"]:checked')?.value || "cartao";
}

function setupPaymentUI(){
  const radios = document.querySelectorAll('input[name="paymentMethod"]');
  const cardFields = document.getElementById("cardFields");
  const pixFields = document.getElementById("pixFields");
  const cardOpt = document.querySelector("[data-method-card]");
  const pixOpt = document.querySelector("[data-method-pix]");
  const apply = () => {
    const method = getSelectedPaymentMethod();
    cardFields?.classList.toggle("hidden", method !== "cartao");
    pixFields?.classList.toggle("hidden", method !== "pix");
    cardOpt?.classList.toggle("active", method === "cartao");
    pixOpt?.classList.toggle("active", method === "pix");
  };
  radios.forEach(r => r.addEventListener("change", apply));
  apply();
}

function getPaymentData(){
  const method = getSelectedPaymentMethod();
  if(method === "pix"){
    return {
      method: "PIX",
      payerName: document.getElementById("pixName").value.trim(),
      payerCpf: document.getElementById("pixCpf").value.trim()
    };
  }
  return {
    method: "Cartão de crédito",
    cardName: document.getElementById("cardName").value.trim(),
    cardNumberMasked: document.getElementById("cardNumber").value.trim().replace(/\s+/g,'').replace(/.(?=.{4})/g, "•"),
    expiry: document.getElementById("cardExpiry").value.trim(),
    installments: document.getElementById("cardInstallments").value
  };
}

function validatePaymentData(payment){
  if(payment.method === "PIX"){
    return !!payment.payerName && !!payment.payerCpf;
  }
  return !!payment.cardName && !!payment.cardNumberMasked && !!payment.expiry;
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
  const payment = getPaymentData();
  if(!name || !phone){
    notice.innerHTML = '<div class="notice error">Preencha nome e WhatsApp.</div>'; return;
  }
  if(!validatePaymentData(payment)){
    notice.innerHTML = '<div class="notice error">Preencha os dados da forma de pagamento selecionada.</div>'; return;
  }
  const dbProducts = await readPath("products/products/items");
  for(const item of cart){
    const p = dbProducts[item.id];
    if(!p || Number(p.stock||0) < item.qty){
      notice.innerHTML = `<div class="notice error">Estoque insuficiente para ${item.name}.</div>`; return;
    }
  }
  const total = cart.reduce((s,i)=>s+(i.price*i.qty),0);
  const createdAt = new Date().toISOString();
  const paymentRecord = {
    customerName: name,
    customerPhone: phone,
    notes,
    method: payment.method,
    cardName: payment.cardName || "",
    cardNumberMasked: payment.cardNumberMasked || "",
    expiry: payment.expiry || "",
    installments: payment.installments || "",
    payerName: payment.payerName || "",
    payerCpf: payment.payerCpf || "",
    total,
    items: cart,
    createdAt
  };
  const order = {
    customerName:name,
    customerPhone:phone,
    notes,
    payment,
    items: cart,
    total,
    status:"Pendente",
    createdAt
  };
  try{
    await pushPath("payments", paymentRecord);
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
setupPaymentUI();
document.getElementById("checkoutBtn")?.addEventListener("click", checkout);