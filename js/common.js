// DIAMONDSECT — common helpers (cart count + smart header)
(function(){
  function getCart(){
    try{ return JSON.parse(localStorage.getItem("cart")) || []; }catch{ return []; }
  }
  function updateCartCount(){
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + Number(item.qty||0), 0);
    document.querySelectorAll(".cartcount").forEach(el => el.textContent = total);
  }

  function initSmartHeader(){
    const header = document.querySelector(".header");
    if(!header) return;

    let lastY = window.scrollY;
    let ticking = false;

    function run(){
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
        requestAnimationFrame(run);
        ticking = true;
      }
    }, { passive:true });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    updateCartCount();
    initSmartHeader();
  });

  // expose to other scripts if needed
  window.DS = window.DS || {};
  window.DS.updateCartCount = updateCartCount;
})();