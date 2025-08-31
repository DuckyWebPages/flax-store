// src/scripts/cartStore.js
// Minimal event-driven cart with localStorage persistence.
// Exposes window.cartStore and dispatches custom events:
//   cart:changed {cart}, cart:count {count}, cart:subtotal {cents},
//   cart:itemAdded {item}, cart:itemRemoved {sku, qty}, cart:open, cart:close

(function () {
  const LS_KEY = 'cart';
  const state = { items: [] }; // { sku, name, unitCents, image, qty }

  // --- Utils
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const idxBySku = (sku) => state.items.findIndex((i) => i.sku === sku);
  const load = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.items)) {
          state.items = parsed.items.map((it) => ({
            sku: String(it.sku),
            name: String(it.name || ''),
            unitCents: Number(it.unitCents || 0),
            image: it.image || '',
            qty: Math.max(1, Number(it.qty || 1)),
          }));
        }
      }
    } catch {}
  };
  const save = () => {
    localStorage.setItem(LS_KEY, JSON.stringify({ items: state.items }));
  };
  const count = () => state.items.reduce((a, it) => a + (Number(it.qty) || 0), 0);
  const subtotalCents = () =>
    state.items.reduce((a, it) => a + (Number(it.unitCents || 0) * Number(it.qty || 0)), 0);

  const broadcast = () => {
    const c = count();
    const sub = subtotalCents();
    emit('cart:changed', { cart: clone(state) });
    emit('cart:count', { count: c });
    emit('cart:subtotal', { cents: sub });
  };

  // --- Core mutations
  function addItem({ sku, name = '', unitCents = 0, image = '', qty = 1 }) {
    if (!sku) return;
    qty = Math.max(1, Number(qty) || 1);
    unitCents = Number(unitCents) || 0;
    const i = idxBySku(sku);
    if (i >= 0) {
      state.items[i].qty = Math.max(1, (Number(state.items[i].qty) || 1) + qty);
      if (name) state.items[i].name = name;
      if (image) state.items[i].image = image;
      if (unitCents) state.items[i].unitCents = unitCents;
    } else {
      state.items.push({ sku, name, unitCents, image, qty });
    }
    save(); broadcast(); emit('cart:itemAdded', { item: { sku, qty } });
  }

  function setQty(sku, qty) {
    const i = idxBySku(sku); if (i < 0) return;
    qty = Math.max(1, Number(qty) || 1);
    state.items[i].qty = qty;
    save(); broadcast();
  }

  function removeItem(sku, qty = null) {
    const i = idxBySku(sku); if (i < 0) return;
    if (qty == null) {
      const removedQty = state.items[i].qty;
      state.items.splice(i, 1);
      save(); broadcast(); emit('cart:itemRemoved', { sku, qty: removedQty });
      return;
    }
    qty = Math.max(1, Number(qty) || 1);
    state.items[i].qty -= qty;
    if (state.items[i].qty <= 0) state.items.splice(i, 1);
    save(); broadcast(); emit('cart:itemRemoved', { sku, qty });
  }

  function clear() { state.items = []; save(); broadcast(); }

  // --- Public API
  const api = {
    getCart: () => clone(state),
    getCount: () => count(),
    getSubtotalCents: () => subtotalCents(),
    addItem,
    setQty,
    removeItem,
    clear,
    openCart: () => emit('cart:open'),
    closeCart: () => emit('cart:close'),
  };

  // --- Wire global for easy access
  window.cartStore = api;

  // --- Event bridges (so your UI can be dumb)
  // Buttons like: <button class="add-to-cart" data-sku="fhl-single" data-name="Flax Hull" data-price="4995" data-image="/img.jpg" data-qty="1">
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const sku = btn.dataset.sku;
    api.addItem({
      sku,
      name: btn.dataset.name || sku,
      unitCents: btn.dataset.price ? Number(btn.dataset.price) : 0, // if omitted, keep 0 so your cart can look up price by SKU
      image: btn.dataset.image || '',
      qty: btn.dataset.qty ? Number(btn.dataset.qty) : 1,
    });
    // Optional: auto-open on add (comment out if you don't want this)
    api.openCart();
  });

  // From CartDrawer controls:
  document.addEventListener('cart:updateQty', (e) => {
    const { sku, qty } = e.detail || {};
    if (sku) api.setQty(sku, qty);
  });
  document.addEventListener('cart:remove', (e) => {
    const { sku, qty } = e.detail || {};
    if (sku) {
      if (qty) api.removeItem(sku, qty);
      else api.removeItem(sku); // remove line
    }
  });
  document.addEventListener('cart:clear', () => api.clear());

  // Initial load + broadcast
  load(); broadcast();
})();
