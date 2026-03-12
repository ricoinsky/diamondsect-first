
window.DS = window.DS || {};
DS.formatBRL = (v)=> new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
DS.getCart = ()=> JSON.parse(localStorage.getItem('ds_cart') || '[]');
DS.saveCart = (cart)=> localStorage.setItem('ds_cart', JSON.stringify(cart));
DS.updateCartCount = ()=>{
  const count = DS.getCart().reduce((n,i)=> n + (i.qty || 1), 0);
  document.querySelectorAll('[data-cart-count]').forEach(el=> el.textContent = count);
};
DS.getProduct = (id)=> (window.PRODUCTS || []).find(p=> p.id === id);
DS.stars = (rating=5)=> '★★★★★'.slice(0, Math.round(rating));

document.addEventListener('DOMContentLoaded', ()=>{
  DS.updateCartCount();

  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const nav = document.querySelector('.nav');
  if(mobileToggle && nav){
    mobileToggle.addEventListener('click', ()=>{
      nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
      nav.style.position = 'absolute';
      nav.style.top = '72px';
      nav.style.right = '16px';
      nav.style.flexDirection = 'column';
      nav.style.padding = '16px';
      nav.style.background = '#111';
      nav.style.border = '1px solid rgba(255,255,255,.08)';
      nav.style.borderRadius = '16px';
      nav.style.minWidth = '220px';
    });
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting) entry.target.classList.add('in');
    });
  }, {threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=> io.observe(el));

  document.querySelectorAll('[data-newsletter]').forEach(form=>{
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      alert('Cadastro recebido. A Diamondsect entrará em contato com novidades em breve.');
      form.reset();
    })
  });
});
