// DIAMONDSECT — Admin (cadastro simples de produtos)
const LS_PRODUCTS = "diamondsect_products_v1";

function uid(){
  return Date.now() + Math.floor(Math.random()*1000);
}

function getProducts(){
  try{
    const raw = localStorage.getItem(LS_PRODUCTS);
    if(!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  }catch{ return []; }
}
function setProducts(list){
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(list || []));
  // mantém vitrine e carrinho em sincronia quando abrir outras páginas
  window.PRODUCTS = list || [];
}

function moneyBRL(v){
  return Number(v||0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
}

function qs(sel){ return document.querySelector(sel); }

function renderTable(){
  const tbody = qs("#prodTbody");
  const count = qs("#prodCount");
  const list = getProducts();

  if(count) count.textContent = `${list.length} produto(s) cadastrados`;
  if(!tbody) return;

  if(list.length === 0){
    tbody.innerHTML = `<tr><td colspan="6" style="color:rgba(255,255,255,.65);padding:16px 8px;">Nenhum produto cadastrado ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name || "-"}</td>
      <td><span class="tag">${p.category || "-"}</span></td>
      <td>${moneyBRL(p.price||0)}</td>
      <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.image || "-"}</td>
      <td>
        <button class="btn btn--ghost" type="button" data-edit="${p.id}">Editar</button>
        <button class="btn" type="button" data-del="${p.id}" style="margin-left:6px;">Excluir</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const id = Number(b.getAttribute("data-del"));
      const next = getProducts().filter(x => Number(x.id) !== id);
      setProducts(next);
      renderTable();
      alert("Produto removido.");
    });
  });

  tbody.querySelectorAll("[data-edit]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const id = Number(b.getAttribute("data-edit"));
      const p = getProducts().find(x => Number(x.id) === id);
      if(!p) return;

      qs("#pid").value = p.id;
      qs("#pname").value = p.name || "";
      qs("#pcat").value = p.category || "ternos";
      qs("#pprice").value = p.price || 0;
      qs("#pcompare").value = p.compareAt || "";
      qs("#pbadge").value = p.badge || "Premium";
      qs("#pmeta").value = p.meta || "";
      qs("#pimage").value = p.image || "";
      qs("#pdesc").value = p.description || "";
      qs("#saveBtn").textContent = "Salvar alterações";
      window.scrollTo({top:0, behavior:"smooth"});
    });
  });
}

function clearForm(){
  qs("#pid").value = "";
  qs("#pname").value = "";
  qs("#pcat").value = "ternos";
  qs("#pprice").value = "";
  qs("#pcompare").value = "";
  qs("#pbadge").value = "Premium";
  qs("#pmeta").value = "";
  qs("#pimage").value = "";
  qs("#pdesc").value = "";
  qs("#saveBtn").textContent = "Cadastrar produto";
}

function saveProduct(){
  const idRaw = qs("#pid").value.trim();
  const isEdit = !!idRaw;

  const p = {
    id: isEdit ? Number(idRaw) : uid(),
    name: qs("#pname").value.trim(),
    category: qs("#pcat").value,
    price: Number(String(qs("#pprice").value).replace(",", ".")) || 0,
    compareAt: qs("#pcompare").value ? (Number(String(qs("#pcompare").value).replace(",", ".")) || null) : null,
    badge: qs("#pbadge").value.trim() || "Premium",
    meta: qs("#pmeta").value.trim(),
    image: qs("#pimage").value.trim(),
    description: qs("#pdesc").value.trim(),
    soldScore: 0
  };

  if(!p.name){
    alert("Digite o nome do produto.");
    return;
  }
  if(!p.image){
    alert("Cole uma URL de imagem.");
    return;
  }

  const list = getProducts();

  if(isEdit){
    const idx = list.findIndex(x => Number(x.id) === p.id);
    if(idx >= 0) list[idx] = p;
    else list.push(p);
    setProducts(list);
    renderTable();
    clearForm();
    alert("Produto atualizado.");
    return;
  }

  list.push(p);
  setProducts(list);
  renderTable();
  clearForm();
  alert("Produto cadastrado.");
}

function exportJSON(){
  const list = getProducts();
  const out = JSON.stringify(list, null, 2);
  qs("#jsonArea").value = out;
  qs("#jsonArea").focus();
}

function importJSON(){
  const raw = qs("#jsonArea").value.trim();
  if(!raw){
    alert("Cole um JSON no campo.");
    return;
  }
  try{
    const list = JSON.parse(raw);
    if(!Array.isArray(list)) throw new Error("Formato inválido");
    // normalize ids
    const cleaned = list.map(x => ({
      id: Number(x.id || uid()),
      name: String(x.name||"").trim(),
      category: String(x.category||"ternos"),
      price: Number(x.price||0),
      compareAt: x.compareAt ? Number(x.compareAt) : null,
      badge: String(x.badge||"Premium"),
      meta: String(x.meta||""),
      image: String(x.image||""),
      description: String(x.description||""),
      soldScore: Number(x.soldScore||0)
    }));
    setProducts(cleaned);
    renderTable();
    alert("Importado com sucesso.");
  }catch(e){
    alert("JSON inválido. Verifique e tente novamente.");
  }
}

function resetCatalog(){
  if(!confirm("Zerar catálogo? Isso apaga TODOS os produtos cadastrados.")) return;
  setProducts([]);
  renderTable();
  clearForm();
}

document.addEventListener("DOMContentLoaded", ()=>{
  qs("#saveBtn")?.addEventListener("click", saveProduct);
  qs("#clearBtn")?.addEventListener("click", clearForm);
  qs("#exportBtn")?.addEventListener("click", exportJSON);
  qs("#importBtn")?.addEventListener("click", importJSON);
  qs("#resetBtn")?.addEventListener("click", resetCatalog);

  // seed is empty by default; don't auto-create products
  renderTable();
  clearForm();
});
