import { auth, onAuthStateChanged, isAdmin, readPath, writePath, updatePath, removePath } from "./firebase.js";

const gateNotice = document.getElementById("adminGateNotice");
const tabs = document.querySelectorAll(".tab-btn");
const sections = {
  dashboard: document.getElementById("tab-dashboard"),
  products: document.getElementById("tab-products"),
  orders: document.getElementById("tab-orders"),
  new: document.getElementById("tab-new")
};

tabs.forEach(btn => btn.addEventListener("click", () => {
  tabs.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  Object.values(sections).forEach(s => s.classList.add("hidden"));
  sections[btn.dataset.tab].classList.remove("hidden");
}));

function notice(text, error=false){
  gateNotice.innerHTML = `<div class="notice ${error?'error':''}">${text}</div>`;
}
function formNotice(text, error=false){
  document.getElementById("adminFormNotice").innerHTML = `<div class="notice ${error?'error':''}">${text}</div>`;
}
function asMoney(v){ return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

async function loadAdmin(){
  const items = await readPath("products/products/items") || {};
  const orders = await readPath("orders") || {};
  const entries = Object.entries(items);
  document.getElementById("statProducts").textContent = entries.length;
  const orderEntries = Object.entries(orders);
  document.getElementById("statOrders").textContent = orderEntries.length;
  const soldMap = {};
  let units = 0;
  orderEntries.forEach(([,order]) => {
    (order.items || []).forEach(item => {
      soldMap[item.id] = (soldMap[item.id] || 0) + Number(item.qty||0);
      units += Number(item.qty||0);
    });
  });
  document.getElementById("statUnits").textContent = units;
  const top = Object.entries(soldMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  document.getElementById("topSellers").innerHTML = top.length ? `
    <table class="table">
      <thead><tr><th>Produto</th><th>Vendidos</th></tr></thead>
      <tbody>
      ${top.map(([id,qty]) => `<tr><td>${items[id]?.name || id}</td><td>${qty}</td></tr>`).join("")}
      </tbody>
    </table>` : `<p class="info-text">Ainda sem vendas registradas.</p>`;

  document.getElementById("productsTableWrap").innerHTML = `
    <table class="table">
      <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr></thead>
      <tbody>
        ${entries.map(([id,p]) => `
          <tr>
            <td><b>${p.name}</b><br><span class="info-text">${id}</span></td>
            <td>${p.category}</td>
            <td>${asMoney(p.price)}</td>
            <td>${p.stock}</td>
            <td>
              <button class="btn btn-ghost edit-product" data-id="${id}">Editar</button>
              <button class="btn btn-ghost del-product" data-id="${id}">Excluir</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>`;

  document.getElementById("ordersTableWrap").innerHTML = orderEntries.length ? `
    <table class="table">
      <thead><tr><th>Pedido</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>
        ${orderEntries.map(([id,o]) => `
          <tr>
            <td>${id}<br><span class="info-text">${(o.createdAt||"").replace("T"," ").slice(0,16)}</span></td>
            <td>${o.customerName || "-"}<br><span class="info-text">${o.customerPhone || ""}</span></td>
            <td>${(o.items || []).map(i => `${i.name} x${i.qty}`).join("<br>")}</td>
            <td>${asMoney(o.total)}</td>
            <td>${o.status || "Pendente"}</td>
          </tr>`).join("")}
      </tbody>
    </table>` : `<p class="info-text">Ainda não existem pedidos.</p>`;

  document.querySelectorAll(".edit-product").forEach(btn => btn.addEventListener("click", async () => {
    const p = items[btn.dataset.id];
    tabs.forEach(b => b.classList.remove("active"));
    document.querySelector('[data-tab="new"]').classList.add("active");
    Object.values(sections).forEach(s => s.classList.add("hidden"));
    sections.new.classList.remove("hidden");
    document.getElementById("p_id").value = btn.dataset.id;
    document.getElementById("p_name").value = p.name || "";
    document.getElementById("p_slug").value = p.slug || "";
    document.getElementById("p_category").value = p.category || "";
    document.getElementById("p_subcategory").value = p.subcategory || "";
    document.getElementById("p_price").value = p.price || 0;
    document.getElementById("p_stock").value = p.stock || 0;
    document.getElementById("p_badge").value = p.badge || "";
    document.getElementById("p_short").value = p.shortDescription || "";
    document.getElementById("p_description").value = p.description || "";
    document.getElementById("p_images").value = (p.images || []).join("\n");
    document.getElementById("p_specs").value = Object.entries(p.specs || {}).map(([k,v]) => `${k}: ${v}`).join("\n");
  }));

  document.querySelectorAll(".del-product").forEach(btn => btn.addEventListener("click", async () => {
    if(!confirm("Remover este produto?")) return;
    await removePath(`products/products/items/${btn.dataset.id}`);
    await loadAdmin();
  }));
}

document.getElementById("productForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("p_id").value.trim();
  if(!id){ formNotice("Informe o ID do produto.", true); return; }
  const specsRaw = document.getElementById("p_specs").value.split("\n").filter(Boolean);
  const specs = {};
  specsRaw.forEach(line => {
    const [k,...rest] = line.split(":");
    if(k && rest.length) specs[k.trim()] = rest.join(":").trim();
  });
  const payload = {
    name: document.getElementById("p_name").value.trim(),
    slug: document.getElementById("p_slug").value.trim(),
    category: document.getElementById("p_category").value,
    subcategory: document.getElementById("p_subcategory").value.trim(),
    price: Number(document.getElementById("p_price").value || 0),
    stock: Number(document.getElementById("p_stock").value || 0),
    badge: document.getElementById("p_badge").value.trim(),
    shortDescription: document.getElementById("p_short").value.trim(),
    description: document.getElementById("p_description").value.trim(),
    images: document.getElementById("p_images").value.split("\n").map(s => s.trim()).filter(Boolean),
    specs,
    active: true
  };
  await writePath(`products/products/items/${id}`, payload);
  formNotice("Produto salvo com sucesso.");
  await loadAdmin();
});

document.getElementById("resetProductForm")?.addEventListener("click", () => {
  document.getElementById("productForm").reset();
  document.getElementById("adminFormNotice").innerHTML = "";
});

onAuthStateChanged(auth, async user => {
  if(!user){
    notice("Você precisa entrar com o email administrador para usar este painel.", true);
    document.querySelectorAll("main .admin-card").forEach(el => el.classList.add("hidden"));
    return;
  }
  if(!isAdmin(user)){
    notice(`Acesso bloqueado para ${user.email}. Use o email administrador configurado.`, true);
    document.querySelectorAll("main .admin-card").forEach(el => el.classList.add("hidden"));
    return;
  }
  notice(`Admin autenticado: ${user.email}`);
  document.querySelectorAll("main .admin-card").forEach(el => el.classList.remove("hidden"));
  await loadAdmin();
});