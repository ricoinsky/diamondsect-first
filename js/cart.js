
window.DS = window.DS || {};

DS.addToCart = ({productId, size=null, qty=1})=>{
  const product = DS.getProduct(productId);
  if(!product) return;

  const cart = DS.getCart();
  const key = `${productId}::${size || 'default'}`;
  const existing = cart.find(item => item.key === key);
  if(existing){
    existing.qty += qty;
  }else{
    cart.push({
      key,
      productId,
      size,
      qty,
      price: product.price,
      name: product.name,
      image: product.images?.[0] || '',
      collection: product.collection || ''
    });
  }
  DS.saveCart(cart);
  DS.updateCartCount();
};

DS.removeFromCart = (key)=>{
  const cart = DS.getCart().filter(item => item.key !== key);
  DS.saveCart(cart);
  DS.updateCartCount();
};

DS.changeQty = (key, nextQty)=>{
  const cart = DS.getCart();
  const item = cart.find(i=> i.key === key);
  if(!item) return;
  item.qty = Math.max(1, nextQty);
  DS.saveCart(cart);
  DS.updateCartCount();
};

DS.cartTotals = ()=>{
  const cart = DS.getCart();
  const subtotal = cart.reduce((n,i)=> n + i.price * i.qty, 0);
  const coupon = localStorage.getItem('ds_coupon') === 'DIAMOND10' ? Math.round(subtotal * 0.10) : 0;
  const shipping = subtotal >= 600 || subtotal === 0 ? 0 : 49;
  return {subtotal, coupon, shipping, total: subtotal - coupon + shipping};
};

document.addEventListener('DOMContentLoaded', ()=>{
  const couponForm = document.querySelector('[data-coupon-form]');
  if(couponForm){
    couponForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const input = couponForm.querySelector('input');
      const code = input.value.trim().toUpperCase();
      if(code === 'DIAMOND10'){
        localStorage.setItem('ds_coupon', 'DIAMOND10');
        alert('Cupom aplicado com sucesso.');
      }else{
        localStorage.removeItem('ds_coupon');
        alert('Cupom inválido. Use DIAMOND10 para testar o visual do checkout.');
      }
      location.reload();
    });
  }

  const checkoutForm = document.querySelector('[data-checkout-form]');
  if(checkoutForm){
    checkoutForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      localStorage.setItem('ds_last_order', JSON.stringify({
        number: 'DS' + Math.floor(Math.random() * 900000 + 100000),
        date: new Date().toLocaleString('pt-BR'),
        method: document.querySelector('.method.active')?.dataset.method || 'pix',
        total: DS.cartTotals().total
      }));
      DS.saveCart([]);
      localStorage.removeItem('ds_coupon');
      location.href = 'rastrear.html?success=1';
    });
  }
});
