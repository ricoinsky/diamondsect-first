import { readPath } from "./firebase.js";
import { updateCartCount, CART_KEY } from "./main.js";

function formatPrice(value){
  return Number(value || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}
function stockLabel(product){
  if(product.stock <= 0) return '<span class="stock out">Produto esgotado</span>';
  if(product.stock <= 5) return `<span class="stock low">⚠ Últimas ${product.stock} unidades</span>`;
  return `<span class="stock">Em estoque: ${product.stock}</span>`;
}
function addToCart(item){
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  const found = cart.find(p => p.id === item.id);
  if(found){ found.qty += 1; }
  else cart.push({...item, qty:1});
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  alert("Produto adicionado ao carrinho.");
}
function card(id, product){
  const image = product.images?.[0] || "";
  return `
  <article class="product-card">
    <div class="product-media">
      <a href="produto.html?id=${id}">
        <img src="${image}" alt="${product.name}">
      </a>
    </div>
    <div class="product-body">
      <div class="kicker">${product.subcategory || product.category || ""}</div>
      <div class="product-title">${product.name}</div>
      <div class="product-desc">${product.shortDescription || ""}</div>
      <div class="price-row">
        <div class="price">${formatPrice(product.price)}</div>
        ${product.badge ? `<span class="status-pill">${product.badge}</span>` : ""}
      </div>
      ${stockLabel(product)}
      <div class="product-actions">
        <a class="btn btn-ghost" href="produto.html?id=${id}">Ver produto</a>
        <button class="btn btn-primary add-cart" data-id="${id}" ${product.stock<=0?"disabled":""}>Adicionar</button>
      </div>
    </div>
  </article>`;
}

async function init(){
  const container = document.querySelector("[data-products-grid]");
  if(!container) return;
  const data = await readPath("products/products/items");
  const entries = Object.entries(data || {}).filter(([,p]) => p.active !== false);
  const category = container.dataset.category;
  const limit = Number(container.dataset.limit || 0);
  let filtered = entries;
  if(category) filtered = filtered.filter(([,p]) => p.category === category);
  if(limit) filtered = filtered.slice(0, limit);
  if(!filtered.length){
    container.innerHTML = '<div class="empty-state glass">Nenhum produto disponível.</div>';
    return;
  }
  container.innerHTML = filtered.map(([id,p]) => card(id,p)).join("");
  container.querySelectorAll(".add-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const product = data[id];
      addToCart({ id, name:product.name, price:product.price, image:product.images?.[0] || "" });
    });
  });
}
init();