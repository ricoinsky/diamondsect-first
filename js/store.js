// ===== DIAMONDSECT — STORE (produtos, conta e carrinho por usuário) =====

const LS_PRODUCTS = "diamondsect_products_v1";
const LS_USERS = "diamondsect_users_v1";
const LS_SESSION = "diamondsect_session_v1";

function safeJSONParse(v, fallback){
  try{ return JSON.parse(v) ?? fallback; }catch{ return fallback; }
}

export function moneyBRL(v){
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

// ---------- Produtos ----------
export function getProducts(){
  const list = safeJSONParse(localStorage.getItem(LS_PRODUCTS), []);
  return Array.isArray(list) ? list : [];
}

export function saveProducts(list){
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(list || []));
}

// ---------- Conta / sessão ----------
export function getUsers(){
  const u = safeJSONParse(localStorage.getItem(LS_USERS), []);
  return Array.isArray(u) ? u : [];
}
export function saveUsers(users){
  localStorage.setItem(LS_USERS, JSON.stringify(users || []));
}

export function getSession(){
  return safeJSONParse(localStorage.getItem(LS_SESSION), null);
}
export function setSession(session){
  localStorage.setItem(LS_SESSION, JSON.stringify(session));
}
export function clearSession(){
  localStorage.removeItem(LS_SESSION);
}

export function getCartKey(){
  const s = getSession();
  if(s?.email) return `diamondsect_cart_${s.email.toLowerCase()}`;
  return "diamondsect_cart_guest";
}

// ---------- Carrinho ----------
export function getCart(){
  return safeJSONParse(localStorage.getItem(getCartKey()), []);
}

export function saveCart(cart){
  localStorage.setItem(getCartKey(), JSON.stringify(cart || []));
  updateCartCount();
}

export function updateCartCount(){
  const cart = getCart();
  const total = (cart || []).reduce((sum, item) => sum + Number(item.qty||0), 0);
  document.querySelectorAll(".cartcount").forEach(el => el.textContent = String(total));
}

export function findProduct(id){
  const list = getProducts();
  return list.find(p => Number(p.id) === Number(id));
}

export function clampQtyToStock(id, qty){
  const p = findProduct(id);
  const stock = Number(p?.stock ?? 0);
  if(stock <= 0) return 0;
  return Math.max(1, Math.min(stock, qty));
}

export function addToCart(id, qty=1){
  const p = findProduct(id);
  if(!p) return { ok:false, message:"Produto não encontrado." };

  const stock = Number(p.stock ?? 0);
  if(stock <= 0) return { ok:false, message:"Sem estoque no momento." };

  const cart = getCart();
  const item = cart.find(i => Number(i.id) === Number(id));
  const current = Number(item?.qty || 0);
  const next = Math.min(stock, current + Number(qty||1));

  if(item) item.qty = next;
  else cart.push({ id:Number(id), qty: next });

  saveCart(cart);

  if(next === stock) return { ok:true, message:"Adicionado (limite de estoque atingido)." };
  return { ok:true, message:"Produto adicionado ao carrinho." };
}

export function mergeGuestCartIntoUser(){
  const session = getSession();
  if(!session?.email) return;

  const guestKey = "diamondsect_cart_guest";
  const userKey = `diamondsect_cart_${session.email.toLowerCase()}`;

  const guest = safeJSONParse(localStorage.getItem(guestKey), []);
  const user = safeJSONParse(localStorage.getItem(userKey), []);

  if(!Array.isArray(guest) || !guest.length){
    updateCartCount();
    return;
  }

  const merged = Array.isArray(user) ? [...user] : [];
  for(const gi of guest){
    const existing = merged.find(x => Number(x.id) === Number(gi.id));
    if(existing) existing.qty = Number(existing.qty||0) + Number(gi.qty||0);
    else merged.push({ id:Number(gi.id), qty:Number(gi.qty||0) });
  }

  // respeita estoque real
  const fixed = merged
    .map(i => ({ id:Number(i.id), qty: clampQtyToStock(i.id, Number(i.qty||0)) }))
    .filter(i => i.qty > 0);

  localStorage.setItem(userKey, JSON.stringify(fixed));
  localStorage.removeItem(guestKey);
  updateCartCount();
}


// ---------- Pedidos / compras (para liberar avaliações) ----------
function getOrdersKeyByEmail(email){
  const e = String(email||"").trim().toLowerCase();
  return e ? `diamondsect_orders_${e}` : "diamondsect_orders_guest";
}

export function getOrders(){
  const s = getSession();
  if(!s?.email) return [];
  return safeJSONParse(localStorage.getItem(getOrdersKeyByEmail(s.email)), []);
}

export function saveOrders(list){
  const s = getSession();
  if(!s?.email) return;
  localStorage.setItem(getOrdersKeyByEmail(s.email), JSON.stringify(list || []));
}

export function hasPurchased(productId){
  const id = Number(productId);
  const orders = getOrders();
  for(const o of (orders||[])){
    const items = Array.isArray(o.items) ? o.items : [];
    if(items.some(it => Number(it.id) === id)) return true;
  }
  return false;
}

function makeOrderId(){
  // DS-YYYYMMDD-HHMMSS-XXXX
  const d = new Date();
  const pad = (n)=> String(n).padStart(2,"0");
  const y = d.getFullYear();
  const m = pad(d.getMonth()+1);
  const da = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const rnd = Math.random().toString(16).slice(2,6).toUpperCase();
  return `DS-${y}${m}${da}-${hh}${mm}${ss}-${rnd}`;
}

export function completePurchase({ shipping=0, discount=0, total=0 } = {}){
  const s = getSession();
  if(!s?.email){
    return { ok:false, code:"NO_SESSION", message:"Entre na sua conta para finalizar a compra e liberar avaliações." };
  }

  const cart = getCart();
  if(!cart?.length){
    return { ok:false, code:"EMPTY", message:"Seu carrinho está vazio." };
  }

  const products = getProducts();
  // valida estoque
  for(const it of cart){
    const p = products.find(x => Number(x.id) === Number(it.id));
    if(!p) return { ok:false, code:"NOT_FOUND", message:"Um produto do carrinho não foi encontrado." };
    const stock = Number(p.stock||0);
    if(stock <= 0) return { ok:false, code:"OUT", message:`${p.name} está sem estoque.` };
    if(Number(it.qty||0) > stock) return { ok:false, code:"STOCK", message:`Estoque insuficiente para ${p.name}.` };
  }

  // baixa estoque + aumenta soldScore
  const now = Date.now();
  for(const it of cart){
    const p = products.find(x => Number(x.id) === Number(it.id));
    p.stock = Math.max(0, Number(p.stock||0) - Number(it.qty||0));
    p.soldScore = Number(p.soldScore||0) + Number(it.qty||0);
    p.updatedAt = now;
  }
  saveProducts(products);

  // cria pedido
  const orderId = makeOrderId();
  const order = {
    id: orderId,
    email: s.email,
    name: s.name || "",
    createdAt: new Date().toISOString(),
    items: cart.map(it => {
      const p = products.find(x => Number(x.id) === Number(it.id));
      return {
        id: Number(it.id),
        qty: Number(it.qty||0),
        name: p?.name || "Produto",
        price: Number(p?.price||0)
      };
    }),
    shipping: Number(shipping||0),
    discount: Number(discount||0),
    total: Number(total||0),
    status: "paid_mock" // sem gateway real por enquanto
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders.slice(0, 50));

  // limpa carrinho
  saveCart([]);

  return { ok:true, code:"OK", message:"Compra confirmada!", orderId };
}
