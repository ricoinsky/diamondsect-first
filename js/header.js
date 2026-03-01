import { getSession } from "./store.js";

function revealAdmin(){
  const link = document.querySelector(".admin-link");
  if(!link) return;

  const s = getSession();
  // Só mostra o botão Admin para conta autorizada.
  link.style.display = s?.isAdmin ? "inline-flex" : "none";
}

export function initSmartHeader(){
  revealAdmin();
  window.addEventListener("ds:session-changed", revealAdmin);
  const header = document.querySelector(".header");
  if(!header) return;

  let lastY = window.scrollY;
  let ticking = false;

  function onScroll(){
    const y = window.scrollY;

    if(y > 10) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");

    const diff = Math.abs(y - lastY);
    if(diff > 8){
      if(y > lastY && y > 120) header.classList.add("is-hidden");
      else if(y < lastY) header.classList.remove("is-hidden");
    }
    lastY = y;
    ticking = false;
  }

  window.addEventListener("scroll", ()=>{
    if(!ticking){
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive:true });
}
