import { findProduct, moneyBRL, addToCart, updateCartCount } from "./store.js";

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

function getId(){
  const u = new URL(location.href);
  return u.searchParams.get("id");
}

function setActiveThumb(src){
  qsa(".thumbbtn").forEach(b=> b.classList.toggle("is-active", b.getAttribute("data-src") === src));
  const img = qs("#pdpMainImg");
  if(img) img.src = src;
  const zoomImg = qs("#zoomImg");
  if(zoomImg) zoomImg.src = src;
}

function openZoom(){
  qs("#zoomModal")?.setAttribute("aria-hidden","false");
}
function closeZoom(){
  qs("#zoomModal")?.setAttribute("aria-hidden","true");
}

let zoom = 1;

function applyZoom(){
  const img = qs("#zoomImg");
  if(!img) return;
  img.style.transform = `scale(${zoom})`;
}

function zoomIn(){ zoom = Math.min(4, zoom + 0.25); applyZoom(); qs("#zoomVal").textContent = `${Math.round(zoom*100)}%`; }
function zoomOut(){ zoom = Math.max(1, zoom - 0.25); applyZoom(); qs("#zoomVal").textContent = `${Math.round(zoom*100)}%`; }
function zoomReset(){ zoom = 1; applyZoom(); qs("#zoomVal").textContent = "100%"; }

function render(){
  updateCartCount();

  const id = getId();
  const p = findProduct(id);

  const wrap = qs("#pdpWrap");
  if(!wrap) return;

  if(!p){
    wrap.innerHTML = `
      <div class="empty">
        <h2>Produto não encontrado</h2>
        <p>Esse item pode ter sido removido do catálogo.</p>
        <div style="height:12px"></div>
        <a class="btn" href="index.html">Voltar</a>
      </div>
    `;
    return;
  }

  const images = (p.images && p.images.length ? p.images : [p.image]).filter(Boolean);

  wrap.innerHTML = `
    <div class="pdp">
      <div class="panel">
        <div class="gallery">
          <div class="thumbs">
            ${images.map((src,i)=>`
              <button class="thumbbtn ${i===0?"is-active":""}" type="button" data-src="${src}">
                <img src="${src}" alt="Foto ${i+1} de ${p.name}">
              </button>
            `).join("")}
          </div>

          <div class="mainshot">
            <img id="pdpMainImg" src="${images[0]}" alt="${p.name}">
            <div class="zoomhint">Clique para zoom premium</div>
          </div>
        </div>
      </div>

      <aside class="panel">
        <h1>${p.name}</h1>
        <div class="sub">${p.description || "Descrição premium será adicionada por você depois no Admin."}</div>

        <div class="kv">
          <span class="pill"><strong>Categoria:</strong> ${p.category}</span>
          ${p.subcat ? `<span class="pill"><strong>Tipo:</strong> ${p.subcat}</span>` : ``}
          <span class="pill"><strong>Código:</strong> #${p.id}</span>
        </div>

        <div class="pricebox">
          <div class="now">${moneyBRL(p.price)}</div>
          <div class="stock">Estoque disponível: <b id="stockVal">${Number(p.stock||0)}</b></div>
        </div>

        <div class="qtyrow">
          <button class="qbtn" type="button" id="qtyMinus">−</button>
          <div class="qty" id="qtyVal">1</div>
          <button class="qbtn" type="button" id="qtyPlus">+</button>
        </div>

        <button class="btn" type="button" id="addBtn">Adicionar ao carrinho</button>
        <div class="warn" id="warnBox" style="display:none"></div>

        <div class="divider"></div>

        <div class="small">
          • Acabamento premium<br>
          • Garantia de 30 dias<br>
          • Envio seguro (prazo no checkout)
        </div>
      </aside>
    </div>
  `;

  // thumbs
  qsa(".thumbbtn").forEach(b=>{
    b.addEventListener("click", ()=> setActiveThumb(b.getAttribute("data-src")));
  });

  // zoom modal
  const main = qs("#pdpMainImg");
  main?.addEventListener("click", ()=>{
    zoomReset();
    openZoom();
  });

  // qty control
  let qty = 1;
  const stock = Number(p.stock||0);
  const qtyEl = qs("#qtyVal");
  const warn = qs("#warnBox");

  function warnMsg(msg){
    warn.style.display = "block";
    warn.textContent = msg;
    clearTimeout(window.__pdp_warn);
    window.__pdp_warn = setTimeout(()=>{ warn.style.display="none"; }, 2600);
  }

  qs("#qtyMinus")?.addEventListener("click", ()=>{
    qty = Math.max(1, qty - 1);
    qtyEl.textContent = String(qty);
  });
  qs("#qtyPlus")?.addEventListener("click", ()=>{
    qty = Math.min(Math.max(1, stock), qty + 1);
    qtyEl.textContent = String(qty);
    if(qty === stock) warnMsg("Você atingiu o limite do estoque disponível.");
  });

  qs("#addBtn")?.addEventListener("click", ()=>{
    const res = addToCart(p.id, qty);
    alert(res.message);
    updateCartCount();
  });
}

export function initProduct(){
  // zoom modal mount
  const modal = qs("#zoomModal");
  if(modal){
    qs("[data-zoom-close]")?.addEventListener("click", closeZoom);
    qs("#zoomBackdrop")?.addEventListener("click", closeZoom);
    qs("#zoomIn")?.addEventListener("click", zoomIn);
    qs("#zoomOut")?.addEventListener("click", zoomOut);
    qs("#zoomReset")?.addEventListener("click", zoomReset);

    // wheel zoom
    modal.addEventListener("wheel", (e)=>{
      if(modal.getAttribute("aria-hidden") !== "false") return;
      e.preventDefault();
      if(e.deltaY < 0) zoomIn(); else zoomOut();
    }, { passive:false });
  }

  render();
}
