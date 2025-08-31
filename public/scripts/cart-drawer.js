// public/scripts/cart-drawer.js
(function () {
  const $drawer = document.querySelector('[data-cart-drawer]');
  const $overlay = document.querySelector('[data-cart-overlay]');
  const $toast = document.querySelector('[data-cart-toast]');
  const $ship = document.querySelector('[data-ship-progress]');
  const $shipBar = document.querySelector('[data-ship-bar]');
  const $shipNote = document.querySelector('[data-ship-note]');
  const $subtotal = document.querySelector('[strong][data-subtotal], [data-subtotal]');
  const threshold = $ship ? parseInt($ship.dataset.threshold, 10) : 7500; // cents

  function openCart() {
    if (!$drawer || !$overlay) return;
    $drawer.hidden = false; $overlay.hidden = false;
    requestAnimationFrame(() => {
      $drawer.classList.add('is-open');
      $overlay.classList.add('is-open');
      $drawer.setAttribute('aria-hidden', 'false');
    });
  }
  function closeCart() {
    if (!$drawer || !$overlay) return;
    $drawer.classList.remove('is-open');
    $overlay.classList.remove('is-open');
    $drawer.setAttribute('aria-hidden', 'true');
    setTimeout(() => { $drawer.hidden = true; $overlay.hidden = true; }, 280);
  }

  // Click handlers
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-open]')) { openCart(); }
    if (e.target.closest('[data-cart-close]') || e.target.closest('[data-cart-overlay]')) { closeCart(); }

    const inc = e.target.closest('[data-incr]'); const dec = e.target.closest('[data-decr]');
    if (inc || dec) {
      const sku = (inc || dec).dataset.incr || (inc || dec).dataset.decr;
      const input = document.querySelector(`.qty-input[data-qty="${sku}"]`);
      if (input) {
        const val = Math.max(1, parseInt(input.value || '1', 10) + (inc ? 1 : -1));
        input.value = val;
        document.dispatchEvent(new CustomEvent('cart:updateQty', { detail: { sku, qty: val }}));
      }
    }

    const rem = e.target.closest('[data-remove]');
    if (rem) {
      const sku = rem.dataset.remove;
      document.dispatchEvent(new CustomEvent('cart:remove', { detail: { sku }}));
    }
  });

  // Free shipping progress updater
  function setSubtotal(cents) {
    if ($ship && $shipBar && $shipNote) {
      const pct = Math.max(0, Math.min(1, cents / threshold));
      $shipBar.style.width = (pct * 100).toFixed(0) + '%';
      if (cents >= threshold) {
        $shipNote.textContent = 'You’ve unlocked free shipping!';
      } else {
        const remaining = ((threshold - cents) / 100).toFixed(2);
        $shipNote.textContent = `Spend $${remaining} more for free shipping.`;
      }
    }
    if ($subtotal) {
      $subtotal.textContent = (cents/100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
    }
  }

  document.addEventListener('cart:subtotal', (e) => setSubtotal(e.detail.cents));
  document.addEventListener('cart:open', openCart);
  document.addEventListener('cart:close', closeCart);

  function showToast(msg = 'Added to cart') {
    if (!$toast) return;
    $toast.textContent = msg;
    $toast.hidden = false;
    requestAnimationFrame(() => $toast.classList.add('show'));
    setTimeout(() => { $toast.classList.remove('show'); setTimeout(()=>{$toast.hidden = true;}, 250); }, 1600);
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (btn) {
      showToast();
      openCart(); // comment this out if you don't want auto-open
    }
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });
})();

