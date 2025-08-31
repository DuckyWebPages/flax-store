// public/scripts/cart-drawer.js
(function () {
  const $drawer = document.querySelector('[data-cart-drawer]');
  const $overlay = document.querySelector('[data-cart-overlay]');
  const $toast = document.querySelector('[data-cart-toast]');
  const $ship = document.querySelector('[data-ship-progress]');
  const $shipBar = document.querySelector('[data-ship-bar]');
  const $shipNote = document.querySelector('[data-ship-note]');
  const $subtotal = document.querySelector('[strong][data-subtotal], [data-subtotal]');
  const $items = document.querySelector('[data-cart-items]');
  const threshold = $ship ? parseInt($ship.dataset.threshold, 10) : 7500; // cents

  // ---------- Drawer open/close ----------
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

  // ---------- Line rendering ----------
  function fmtUSD(cents) {
    return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  function renderCart(cart) {
    if (!$items) return;
    const items = Array.isArray(cart?.items) ? cart.items : [];
    if (items.length === 0) {
      $items.innerHTML = `<li style="padding:14px;color:#555;">Your cart is empty.</li>`;
      // Also zero subtotal/ship bar
      setSubtotal(0);
      return;
    }
    $items.innerHTML = items.map(it => {
      const sku = String(it.sku);
      const name = it.name || sku;
      const img = it.image || '/images/placeholder.png';
      const qty = Math.max(1, Number(it.qty) || 1);
      const unit = Number(it.unitCents || 0);
      const line = unit * qty;
      return `
        <li class="cart-item" data-sku="${sku}">
          <img class="ci-thumb" src="${img}" alt="${name}" />
          <div class="ci-main">
            <div class="ci-row">
              <h4 class="ci-title">${name}</h4>
              <button class="icon-btn" data-remove="${sku}" aria-label="Remove">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2"/></svg>
              </button>
            </div>
            <div class="ci-row">
              <div class="qty">
                <button class="qty-btn" data-decr="${sku}" aria-label="Decrease">−</button>
                <input class="qty-input" data-qty="${sku}" type="number" min="1" value="${qty}" inputmode="numeric"/>
                <button class="qty-btn" data-incr="${sku}" aria-label="Increase">+</button>
              </div>
              <div class="ci-price" data-line="${sku}">${fmtUSD(line)}</div>
            </div>
          </div>
        </li>
      `;
    }).join('');
  }

  // ---------- Subtotal + free shipping ----------
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
      $subtotal.textContent = fmtUSD(cents);
    }
  }

  // ---------- Click handlers (delegated) ----------
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-open]')) { openCart(); }
    if (e.target.closest('[data-cart-close]') || e.target.closest('[data-cart-overlay]')) { closeCart(); }

    const inc = e.target.closest('[data-incr]'); const dec = e.target.closest('[data-decr]');
    if (inc || dec) {
      const sku = (inc || dec).dataset.incr || (inc || dec).dataset.decr;
      const $input = document.querySelector(`.qty-input[data-qty="${sku}"]`);
      if ($input) {
        const next = Math.max(1, parseInt($input.value || '1', 10) + (inc ? 1 : -1));
        $input.value = String(next);
        document.dispatchEvent(new CustomEvent('cart:updateQty', { detail: { sku, qty: next }}));
      }
    }

    const rem = e.target.closest('[data-remove]');
    if (rem) {
      const sku = rem.dataset.remove;
      document.dispatchEvent(new CustomEvent('cart:remove', { detail: { sku }}));
    }
  });

  // ---------- Toast + auto-open on add ----------
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
      openCart(); // comment out if you don’t want auto-open
    }
  });

  // ---------- Listen to cartStore events (EMITTED ON window) ----------
  window.addEventListener('cart:changed', (e) => {
    renderCart(e.detail?.cart);
  });
  window.addEventListener('cart:subtotal', (e) => {
    setSubtotal(Number(e.detail?.cents || 0));
  });
  window.addEventListener('cart:open', openCart);
  window.addEventListener('cart:close', closeCart);

  // ---------- Initial hydrate from localStorage ----------
  try {
    const raw = localStorage.getItem('cart');
    if (raw) {
      const cart = JSON.parse(raw);
      renderCart(cart);
      const cents = Array.isArray(cart?.items)
        ? cart.items.reduce((a, it) => a + (Number(it.unitCents || 0) * Number(it.qty || 0)), 0)
        : 0;
      setSubtotal(cents);
    } else {
      renderCart({ items: [] });
      setSubtotal(0);
    }
  } catch {
    renderCart({ items: [] });
    setSubtotal(0);
  }

  // Keyboard ESC to close
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });
})();
