import { getProducts, moneyBRL, addToCart, updateCartCount } from "./store.js";
import { toast } from "./ui.js";

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

// --- Reviews (para mostrar média nas vitrines) ---
const REV_KEY = "ds_reviews_v1";
function loadAllReviews(){
  try{ return JSON.parse(localStorage.getItem(REV_KEY) || "{}") || {}; }catch{ return {}; }
}
function getReviews(productId){
  const all = loadAllReviews();
  const list = all[String(productId)] || [];
  return Array.isArray(list) ? list : [];
}
function avgRating(list){
  const r = (list || []).map(x=> Number(x.rating||0)).filter(x=> x>=1 && x<=5);
  if(!r.length) return { avg:0, count:0 };
  const sum = r.reduce((a,b)=>a+b,0);
  return { avg: sum / r.length, count: r.length };
}
function renderStars(value){
  const v = Math.max(0, Math.min(5, Number(value||0)));
  const full = Math.floor(v);
  const half = (v - full) >= 0.5;
  let out = "";
  for(let i=1;i<=5;i++){
    const state = i<=full ? "full" : (i===full+1 && half ? "half" : "empty");
    out += `<span class="star star--${state}" aria-hidden="true">★</span>`;
  }
  return `<div class="stars" aria-label="${v.toFixed(1)} de 5">${out}</div>`;
}

// --- Placeholder premium (quando faltar imagem) ---
function svgDataURI(svg){
  const s = encodeURIComponent(svg).replace(/'/g,"%27").replace(/"/g,"%22");
  return `data:image/svg+xml,${s}`;
}
function placeholderSVG(title="Diamondsect", subtitle="Premium"){
  const t = String(title||"Diamondsect").slice(0,22);
  const sub = String(subtitle||"Premium").slice(0,22);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#0b0b0f"/>
        <stop offset="0.55" stop-color="#111118"/>
        <stop offset="1" stop-color="#07070b"/>
      </linearGradient>
      <radialGradient id="r" cx="30%" cy="20%" r="85%">
        <stop offset="0" stop-color="rgba(255,211,110,0.22)"/>
        <stop offset="1" stop-color="rgba(255,211,110,0)"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="1200" fill="url(#g)"/>
    <rect width="1200" height="1200" fill="url(#r)"/>
    <g opacity="0.85">
      <circle cx="980" cy="220" r="240" fill="rgba(255,255,255,0.04)"/>
      <circle cx="240" cy="980" r="260" fill="rgba(255,255,255,0.03)"/>
    </g>
    <text x="90" y="980" font-family="system-ui,-apple-system,Segoe UI,Roboto" font-size="54" font-weight="800" fill="rgba(255,255,255,0.86)">${t}</text>
    <text x="90" y="1048" font-family="system-ui,-apple-system,Segoe UI,Roboto" font-size="28" font-weight="600" fill="rgba(255,255,255,0.58)" letter-spacing="3">${sub.toUpperCase()}</text>
    <text x="90" y="140" font-family="system-ui,-apple-system,Segoe UI,Roboto" font-size="22" font-weight="700" fill="rgba(255,211,110,0.78)" letter-spacing="5">DIAMONDSECT</text>
  </svg>`;
  return svgDataURI(svg);
}


function getCategoryFromPage(){
  // suporta data-category no body
  const c = document.body?.dataset?.category;
  return c ? String(c) : "all";
}

function getSearchTerm(){
  const v = qs("#searchInput")?.value || "";
  return v.trim().toLowerCase();
}

function getSort(){
  return qs("#sortSelect")?.value || "best";
}

function normalizeProducts(list){
  // garante formato
  return (list || []).map((p, idx)=>({
    id: Number(p.id ?? (idx+1)),
    name: String(p.name || "Produto"),
    price: Number(p.price || 0),
    category: String(p.category || "outros"),
    subcat: p.subcat ? String(p.subcat) : "",
    stock: Number.isFinite(Number(p.stock)) ? Number(p.stock) : 0,
    soldScore: Number(p.soldScore || 0),
    image: String(p.image || p.images?.[0] || placeholderSVG(p.name||"Diamondsect", String(p.category||"Premium").toUpperCase())),
    images: Array.isArray(p.images) ? p.images.map(String) : (p.image ? [String(p.image)] : []),
    description: String(p.description || "")
  }));
}

function filterProducts(all){
  const category = getCategoryFromPage();
  const term = getSearchTerm();
  const hash = (location.hash || "").replace("#","").trim().toLowerCase();

  let out = normalizeProducts(all);

  if(category && category !== "all"){
    out = out.filter(p => p.category === category);
  }

  // subcat via hash (ex: #relogios)
  if(category === "joias" && hash){
    out = out.filter(p => (p.subcat || "").toLowerCase() === hash);
    // marca filtro ativo
    qsa("[data-subcat]").forEach(b=>{
      b.classList.toggle("is-active", (b.getAttribute("data-subcat")||"").toLowerCase() === hash);
    });
  }

  if(term){
    out = out.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description||"").toLowerCase().includes(term)
    );
  }

  // remove produtos sem estoque? NÃO. Mostrar, mas com badge.
  return out;
}

function sortProducts(list){
  const s = getSort();
  const out = [...list];
  if(s === "low") out.sort((a,b)=> a.price - b.price);
  else if(s === "high") out.sort((a,b)=> b.price - a.price);
  else out.sort((a,b)=> (b.soldScore||0) - (a.soldScore||0) || a.price - b.price);
  return out;
}

function productCard(p){
  const isOut = Number(p.stock||0) <= 0;
  const badge = isOut ? "Sem estoque" : (p.stock <= 3 ? `Últimas ${p.stock}` : "Premium");
  const badgeHtml = `<span class="badge">${badge}</span>`;

  return `
    <article class="card">
      <a class="card__img" href="product.html?id=${encodeURIComponent(p.id)}" aria-label="Ver ${p.name}">
        ${badgeHtml}
        <img src="${p.image}" alt="${p.name}">
      </a>

      <div class="card__body">
        <h3 class="card__title">${p.name}</h3>

        ${(()=>{ const rr=avgRating(getReviews(p.id)); return rr.count ? `<div class="card__rating">${renderStars(rr.avg)}<span class="muted">${rr.avg.toFixed(1)} • ${rr.count}</span></div>` : `<div class="card__rating"><span class="muted">Sem avaliações</span></div>`; })()}

        <div class="price">
          <span class="now">${moneyBRL(p.price)}</span>
        </div>

        <div class="meta">${isOut ? "Indisponível no momento" : `Estoque: ${p.stock}`}</div>

        <button class="btn btn--card" type="button" data-add="${p.id}" ${isOut ? "disabled" : ""}>
          ${isOut ? "Indisponível" : "Adicionar ao carrinho"}
        </button>
      </div>
    </article>
  `;
}

function render(){
  const grid = qs("#shopGrid") || qs("#products") || qs("#product-list");
  if(!grid) return;

  const all = getProducts();
  const filtered = sortProducts(filterProducts(all));

  // expõe pro cart.js (compat)
  window.PRODUCTS = normalizeProducts(all);

  const countEl = qs("#resultCount");
  if(countEl) countEl.textContent = `${filtered.length} item(s)`;

  if(!filtered.length){
    grid.innerHTML = `
      <div class="empty" style="grid-column:1 / -1">
        <h2 style="font-size:18px;letter-spacing:.08em;text-transform:uppercase">Em breve</h2>
        <p>Nossos lançamentos estão sendo preparados. Volte em instantes.</p>
        <div style="height:12px"></div>
        <a class="btn" href="index.html">Voltar ao início</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(productCard).join("");

  qsa("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-add");
      const res = addToCart(id, 1);
      toast(res.message);
    });
  });
}

export function initShop(){
  updateCartCount();

  const search = qs("#searchInput");
  const sort = qs("#sortSelect");
  search?.addEventListener("input", render);
  sort?.addEventListener("change", render);

  // filtros joias
  qsa("[data-subcat]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const sc = (b.getAttribute("data-subcat")||"").toLowerCase();
      if(sc) location.hash = sc;
      else location.hash = "";
      render();
    });
  });

  window.addEventListener("hashchange", render);
  render();
}
