import { onAuthStateChanged, auth, isAdmin } from "./firebase.js";

const CART_KEY = "diamondsect_cart_v1";

function getCart(){
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}
function updateCartCount(){
  const count = getCart().reduce((s, item) => s + item.qty, 0);
  document.querySelectorAll("[data-cart-count]").forEach(el => el.textContent = count);
}
updateCartCount();

onAuthStateChanged(auth, user => {
  const url = new URL(location.href);
  document.querySelectorAll(".nav a").forEach(a => {
    if(a.href === url.href) a.classList.add("active");
  });
  if(user && isAdmin(user)){
    const adminShortcut = document.createElement("a");
    adminShortcut.className = "btn btn-ghost mobile-only";
    adminShortcut.href = (location.pathname.includes("/admin/") ? "index.html" : "admin/index.html");
    adminShortcut.textContent = "Admin";
  }
});

export { CART_KEY, getCart, updateCartCount };