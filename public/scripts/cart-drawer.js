// FILE: /scripts/cart-drawer.js
// Depends on window.Cart from /scripts/cart-store.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const drawer   = $('[data-cart-drawer]');
  const overlay  = $('[data-cart-overlay]');
  const itemsEl  = $('[data-cart-items]');
  const subtotalEl = $('[data-subtotal]');
  const openBtn  = $('[data-cart-open]');
  const closeBtn = $('[data-cart-close]');
  const checkoutBtn = $('[data-checkout]');

  // free shipping progress (optional)
  const progressWrap = $('[data-ship-progress]');
  const bar = $('[data-ship-bar]');
  const note = $('[data-ship-note]');
  const threshold = progressWrap ? parseInt(progressWrap.dataset.threshold || '0', 10) : 0;

  function fmtUSD(cents) {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  function open() {
    if (!drawer || !overlay) return;
    drawer.hidden = false;
    overlay.hidden = false;
    requestAnimationFrame(() => {
      drawer.classList.add('is-open');
      overlay.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
    });
  }
  function close() {
    if (!drawer || !overlay) return;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      drawer.hidden = true;
      overlay.hidden = true;
    }, 250);
  }

  function render() {
    if (!itemsEl || !subtotalEl) return;

    const cart = window.Cart.all(); // [{id,name,unitCents,image,qty}]
    if (!cart.length) {
      itemsEl.innerHTML = `<li class="cart-item" style="border:0;padding:18px">Your cart is empty.</li>`;
      subtotalEl.textContent = fmtUSD(0);
      if (bar) bar.style.width = '0%';
      if (note) note.textContent = threshold ? `Spend ${fmtUSD(threshold)} for free shipping.` : '';
      return;
    }

    itemsEl.innerHTML = cart.map(i => {
      const line = i.unitCents * i.qty;
      const img = i.image || '/images/placeholder-84.png';
      return `
        <li class="cart-item" data-id="${i.id}">
          <img class="ci-thumb" src="${img}" alt="" 
               style="width:84px;height:84px;object-fit:cover;display:block" />
          <div class="ci-main">
            <div class="ci-row">
              <p class="ci-title">${i.name}</p>
              <strong class="ci-price">${fmtUSD(line)}</strong>
            </div>
            <div class="ci-row">
              <div class="qty">
                <button class="qty-btn" data-dec aria-label="Decrease">−</button>
                <input class="qty-input" type="number" min="1" value="${i.qty}" />
                <button class="qty-btn" data-inc aria-label="Increase">+</button>
              </div>
              <button class="icon-btn" data-remove aria-label="Remove">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6h18M8 6v12m8-12v12M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" 
                        fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
                Remove
              </button>
            </div>
          </div>
        </li>
      `;
    }).join('');

    const subtotal = cart.reduce((n, i) => n + i.unitCents * i.qty, 0);
    subtotalEl.textContent = fmtUSD(subtotal);

    // Free shipping progress
    if (threshold && bar && note) {
      const pct = Math.max(0, Math.min(100, Math.round((subtotal / threshold) * 100)));
      bar.style.width = `${pct}%`;
      note.textContent = subtotal >= threshold
        ? 'You’ve unlocked free shipping!'
        : `Spend ${fmtUSD(threshold - subtotal)} more for free shipping.`;
    }
  }

  // Event delegation inside drawer
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    // open/close
    if (t.closest('[data-cart-open]')) { open(); return; }
    if (t.closest('[data-cart-close]') || t === overlay) { close(); return; }

    // item row
    const row = t.closest('.cart-item');
    if (!row) return;
    const id = row.getAttribute('data-id');

    if (t.closest('[data-inc]')) {
      const item = window.Cart.all().find(x => x.id === id);
      if (item) window.Cart.setQty(id, item.qty + 1);
    }
    if (t.closest('[data-dec]')) {
      const item = window.Cart.all().find(x => x.id === id);
      if (item) window.Cart.setQty(id, Math.max(1, item.qty - 1));
    }
    if (t.closest('[data-remove]')) {
      window.Cart.remove(id);
    }
  });

  // qty input change
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (!t.classList.contains('qty-input')) return;
    const row = t.closest('.cart-item');
    const id = row?.getAttribute('data-id');
    const val = Math.max(1, parseInt(t.value || '1', 10) || 1);
    if (id) window.Cart.setQty(id, val);
  });

  // Checkout button (optional; if you handle elsewhere, remove)
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      const items = window.Cart.all();
      if (!items.length) return;
      try {
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items),
        });
        const data = await res.json();
        if (data?.url) window.location.href = data.url;
      } catch (err) {
        console.error('Checkout failed', err);
      }
    });
  }

  // React to cart updates from anywhere
  window.addEventListener('cart:updated', render);
  
  // NEW: allow other scripts to open the drawer on demand
  window.addEventListener('cart:open', open);

  // Initial
  render();
})();
