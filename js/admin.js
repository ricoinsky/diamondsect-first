import { getProducts, saveProducts } from "./store.js";
import { toast } from "./ui.js";

function qs(sel){ return document.querySelector(sel); }
function esc(s){ return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

function normalizeImages(str){
  return String(str||"")
    .split(",")
    .map(s=>s.trim())
    .filter(Boolean);
}

function normalizeIds(str){
  return String(str||"")
    .split(",")
    .map(s=>Number(String(s).trim()))
    .filter(n=>Number.isFinite(n) && n > 0);
}


// ===== Reviews (admin) =====
const REV_KEY = "ds_reviews_v1";
function loadAllReviews(){
  try{ return JSON.parse(localStorage.getItem(REV_KEY) || "{}") || {}; }catch{ return {}; }
}
function saveAllReviews(obj){
  try{ localStorage.setItem(REV_KEY, JSON.stringify(obj || {})); }catch{}
}
function renderReviews(){
  const tbody = qs("#admRevBody");
  const countEl = qs("#admRevCount");
  if(!tbody || !countEl) return;

  const products = getProducts();
  const byId = new Map(products.map(p=>[String(p.id), p]));

  const all = loadAllReviews();
  const rows = [];
  Object.keys(all).forEach(pid=>{
    const list = Array.isArray(all[pid]) ? all[pid] : [];
    list.forEach(r=> rows.push({ pid, r }));
  });

  // ordena: mais recente primeiro
  rows.sort((a,b)=> (new Date(b.r?.date||0)).getTime() - (new Date(a.r?.date||0)).getTime());

  countEl.textContent = String(rows.length);

  if(!rows.length){
    tbody.innerHTML = `<tr><td colspan="6" style="padding:14px;color:rgba(255,255,255,.7)">Sem avaliações ainda.</td></tr>`;
    return;
  }

  const fmt = (iso)=>{
    try{ const d = new Date(iso); return d.toLocaleDateString("pt-BR"); }catch{ return ""; }
  };

  tbody.innerHTML = rows.map(({pid,r})=>{
    const p = byId.get(String(pid));
    const pname = p ? `#${p.id} — ${p.name}` : `#${pid}`;
    const stars = "★".repeat(Math.max(0, Math.min(5, Number(r.rating||0)))) + "☆".repeat(Math.max(0, 5-Math.max(0,Math.min(5,Number(r.rating||0)))));
    const rid = esc(r.id || "");
    return `
      <tr>
        <td>${esc(pname)}</td>
        <td>${esc(stars)}</td>
        <td>${esc(r.name||"Cliente")}</td>
        <td style="max-width:520px;white-space:normal">${esc(r.comment||"")}</td>
        <td>${esc(fmt(r.date))}</td>
        <td>
          <button class="btn btn--mini" data-rmrev="${esc(pid)}::${rid}">Remover</button>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-rmrev]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const v = btn.getAttribute("data-rmrev") || "";
      const [pid, rid] = v.split("::");
      if(!pid || !rid) return;
      if(!confirm("Remover esta avaliação?")) return;
      const all = loadAllReviews();
      const list = Array.isArray(all[pid]) ? all[pid] : [];
      all[pid] = list.filter(x => String(x.id||"") !== String(rid));
      saveAllReviews(all);
      toast("Avaliação removida ✅");
      renderReviews();
    });
  });
}

function render(){
  const tbody = qs("#admBody");
  const list = getProducts();

  qs("#admCount").textContent = String(list.length);

  if(!tbody) return;

  if(!list.length){
    tbody.innerHTML = `<tr><td colspan="7" style="padding:14px;color:rgba(255,255,255,.7)">Nenhum produto cadastrado ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p=>`
    <tr>
      <td>#${esc(p.id)}</td>
      <td>${esc(p.name)}</td>
      <td>${esc(p.category)}</td>
      <td>${esc(p.subcat||"-")}</td>
      <td>${Number(p.stock||0)}</td>
      <td>${Number(p.price||0).toFixed(2)}</td>
      <td><button data-edit="${p.id}" class="btn btn--mini" type="button">Editar</button>
          <button data-del="${p.id}" class="btn btn--mini" type="button" style="margin-left:6px">Apagar</button></td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const id = b.getAttribute("data-del");
      if(!confirm("Apagar esse produto?")) return;
      saveProducts(list.filter(x => Number(x.id) !== Number(id)));
      render();
    });
  });

  tbody.querySelectorAll("[data-edit]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const id = b.getAttribute("data-edit");
      const p = list.find(x => Number(x.id) === Number(id));
      if(!p) return;
      fillForm(p);
      window.scrollTo({ top:0, behavior:"smooth" });
    });
  });
}

function fillForm(p){
  qs("#pid").value = p.id ?? "";
  qs("#pname").value = p.name ?? "";
  qs("#pcat").value = p.category ?? "ternos";
  qs("#psub").value = p.subcat ?? "";
  qs("#pprice").value = p.price ?? 0;
  qs("#pstock").value = p.stock ?? 0;
  qs("#pimg").value = p.image ?? "";
  qs("#pimgs").value = (Array.isArray(p.images) ? p.images.join(", ") : "");
  qs("#pvideo").value = p.video ?? "";
  qs("#plook").value = (Array.isArray(p.lookIds) ? p.lookIds.join(", ") : "");
  qs("#pdesc").value = p.description ?? "";
  qs("#psold").value = p.soldScore ?? 0;
}

function clearForm(){
  qs("#pid").value = "";
  qs("#pname").value = "";
  qs("#pcat").value = "ternos";
  qs("#psub").value = "";
  qs("#pprice").value = 0;
  qs("#pstock").value = 0;
  qs("#pimg").value = "";
  qs("#pimgs").value = "";
  qs("#pvideo").value = "";
  qs("#plook").value = "";
  qs("#pdesc").value = "";
  qs("#psold").value = 0;
}

function saveFromForm(){
  const list = getProducts();
  const id = Number(qs("#pid").value || 0) || (Date.now());
  const obj = {
    id,
    name: qs("#pname").value.trim(),
    category: qs("#pcat").value.trim(),
    subcat: qs("#psub").value.trim(),
    price: Number(qs("#pprice").value || 0),
    stock: Number(qs("#pstock").value || 0),
    image: qs("#pimg").value.trim(),
    images: normalizeImages(qs("#pimgs").value),
    video: qs("#pvideo").value.trim(),
    lookIds: normalizeIds(qs("#plook").value),
    description: qs("#pdesc").value.trim(),
    soldScore: Number(qs("#psold").value || 0),
  };

  if(!obj.name) return toast("Informe o nome do produto.");
  if(!obj.image && obj.images.length) obj.image = obj.images[0];
  if(!obj.image) obj.image = "https://images.unsplash.com/photo-1520975682071-aacbc3f4a78a?auto=format&fit=crop&w=1200&q=70";
  if(!obj.images.length) obj.images = [obj.image];

  const existingIdx = list.findIndex(x => Number(x.id) === Number(id));
  if(existingIdx >= 0) list[existingIdx] = obj;
  else list.push(obj);

  saveProducts(list);
  clearForm();
  render();
  renderReviews();
  toast("Salvo ✅");
}

function wipeAll(){
  if(!confirm("Isso vai apagar TODOS os produtos do catálogo. Confirma?")) return;
  saveProducts([]);
  render();
  renderReviews();
}

export function initAdmin(){
  qs("#saveBtn")?.addEventListener("click", saveFromForm);
  qs("#clearBtn")?.addEventListener("click", clearForm);
  qs("#wipeBtn")?.addEventListener("click", wipeAll);

  // primeiro load: se já tiver produtos do seu projeto antigo, você pode apagar aqui.
  render();
  renderReviews();
}
