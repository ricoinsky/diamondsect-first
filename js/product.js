import { readPath } from "./firebase.js";
import { CART_KEY, updateCartCount } from "./main.js";

function formatPrice(value){
  return Number(value || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}
function addToCart(item){
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  const found = cart.find(p => p.id === item.id);
  if(found){ found.qty += 1; } else cart.push({...item, qty:1});
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  alert("Produto adicionado ao carrinho.");
}
async function init(){
  const wrap = document.getElementById("productDetail");
  const id = new URLSearchParams(location.search).get("id");
  const data = await readPath("products/products/items");
  const p = data?.[id];
  if(!p){
    wrap.innerHTML = '<div class="empty-state glass">Produto não encontrado.</div>';
    return;
  }
  const images = p.images || [];
  wrap.innerHTML = `
    <div class="breadcrumb"><a href="index.html">Home</a> / <a href="${p.category === 'terno' ? 'ternos.html' : 'joias.html'}">${p.category === 'terno' ? 'Ternos' : 'Joias'}</a> / <span>${p.name}</span></div>
    <div class="detail-layout">
      <div>
        <div class="gallery-main"><img id="mainImage" src="${images[0] || ''}" alt="${p.name}"></div>
        <div class="thumb-row">
          ${images.map((img,i)=>`<div class="thumb ${i===0?'active':''}" data-img="${img}"><img src="${img}" alt=""></div>`).join("")}
        </div>
      </div>
      <div class="detail-card">
        <div class="kicker">${p.subcategory || p.category || ""}</div>
        <h1 class="section-title" style="margin-top:8px">${p.name}</h1>
        <p class="info-text">${p.shortDescription || ""}</p>
        <div class="price" style="margin:18px 0">${formatPrice(p.price)}</div>
        <div class="promo-strip">${p.stock <= 5 ? `⚠ Últimas ${p.stock} unidades` : `✔ Em estoque: ${p.stock}`}</div>
        <p style="margin-top:18px;line-height:1.7;color:var(--muted)">${p.description || ""}</p>
        <div class="product-actions" style="margin-top:18px">
          <button class="btn btn-primary" id="buyBtn" ${p.stock<=0?'disabled':''}>Adicionar ao carrinho</button>
          <a class="btn btn-ghost" href="carrinho.html">Ir para carrinho</a>
        </div>
        <div class="spec-grid">
          ${Object.entries(p.specs || {}).map(([k,v]) => `<div class="spec"><b>${k}</b><span>${v}</span></div>`).join("")}
        </div>
      </div>
    </div>`;
  document.getElementById("buyBtn").addEventListener("click", ()=> addToCart({id, name:p.name, price:p.price, image:images[0] || ""}));
  document.querySelectorAll(".thumb").forEach(t => t.addEventListener("click", () => {
    document.getElementById("mainImage").src = t.dataset.img;
    document.querySelectorAll(".thumb").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
  }));
}
init();