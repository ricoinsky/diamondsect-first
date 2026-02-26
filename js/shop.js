// DIAMONDSECT — Shop (catálogo + grid + ordenação)
// Produtos ficam no localStorage (cadastrados no admin.html)
const LS_PRODUCTS = "diamondsect_products_v1";

function moneyBRL(v){
  try{ return Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }
  catch{ return "R$ 0,00"; }
}

function getProducts(){
  try{
    const raw = localStorage.getItem(LS_PRODUCTS);
    if(!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  }catch{
    return [];
  }
}

function setProducts(list){
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(list || []));
}

function getCart(){
  try{ return JSON.parse(localStorage.getItem("cart")) || []; }catch{ return []; }
}
function saveCart(cart){
  localStorage.setItem("cart", JSON.stringify(cart));
  window.DS?.updateCartCount?.();
}

function addToCart(id){
  const products = getProducts();
  const p = products.find(x => Number(x.id) === Number(id));
  if(!p){
    alert("Produto não encontrado (catálogo vazio).");
    return;
  }

  const cart = getCart();
  const item = cart.find(i => Number(i.id) === Number(id));
  if(item) item.qty += 1;
  else cart.push({ id:Number(id), qty:1 });

  saveCart(cart);
  alert("Produto adicionado ao carrinho!");
}

// expõe para o carrinho usar também
window.PRODUCTS = getProducts();

function sortProducts(list, mode){
  const arr = [...list];
  if(mode === "low") arr.sort((a,b)=> Number(a.price||0) - Number(b.price||0));
  else if(mode === "high") arr.sort((a,b)=> Number(b.price||0) - Number(a.price||0));
  else {
    // "best": mantém ordem do cadastro (ou soldScore se existir)
    arr.sort((a,b)=> (Number(b.soldScore||0) - Number(a.soldScore||0)));
  }
  return arr;
}

function renderGrid(){
  const grid = document.getElementById("shopGrid");
  const countEl = document.getElementById("resultCount");
  if(!grid) return;

  const category = document.body.dataset.category; // ternos, perfumaria, joias (ou undefined no index)
  const all = getProducts();
  window.PRODUCTS = all; // mantém em sincronia para cart.js
  window.DS?.updateCartCount?.();

  const filtered = category ? all.filter(p => p.category === category) : all;
  const sortSel = document.getElementById("sortSelect");
  const mode = sortSel?.value || "best";
  const list = sortProducts(filtered, mode);

  if(countEl) countEl.textContent = `${list.length} item(s)`;

  // Se estiver vazio, mostra estado bonito
  if(list.length === 0){
    grid.innerHTML = `
      <div class="card" style="grid-column:1/-1;">
        <div class="card__body">
          <div class="tag">Coleção em preparação</div>
          <h3 class="card__title" style="margin-top:10px;">Produtos ainda não cadastrados</h3>
          <p class="meta">Quando você cadastrar os produtos no <b>admin.html</b>, eles vão aparecer aqui automaticamente.</p>
          <a class="btn btn--light" href="admin.html">Abrir painel de cadastro</a>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(p => `
    <article class="card">
      <a class="card__img" href="#" onclick="return false;">
        <img src="${p.image || ""}" alt="${p.name || "Produto"}">
        <span class="badge">${(p.badge || "Premium")}</span>
      </a>
      <div class="card__body">
        <h3 class="card__title">${p.name || "Produto"}</h3>
        <div class="price">
          <span class="now">${moneyBRL(p.price || 0)}</span>
          ${p.compareAt ? `<span class="compare">${moneyBRL(p.compareAt)}</span>` : ``}
        </div>
        <div class="meta">${p.meta || "Alta qualidade • Edição limitada"}</div>
        <button class="btn btn--card" type="button" onclick="addToCart(${Number(p.id)})">Adicionar ao carrinho</button>
      </div>
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", ()=>{
  const sortSel = document.getElementById("sortSelect");
  sortSel?.addEventListener("change", renderGrid);
  renderGrid();
});
