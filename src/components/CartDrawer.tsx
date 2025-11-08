// Minimal event hookup + render for Shopify cart
import { useEffect, useState } from "react";

type Money = { amount: string; currencyCode: string };
type CartLine = {
  id: string;
  quantity: number;
  cost?: { subtotalAmount?: Money };
  merchandise?: {
    id: string;
    title: string;
    product?: { title: string; handle: string; featuredImage?: { url: string; altText?: string } };
    price?: Money;
  };
};
type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost?: { subtotalAmount?: Money; totalAmount?: Money };
  lines: { edges: { node: CartLine }[] };
};

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    const onOpen = (e: any) => { setCart(e.detail.cart as Cart); setOpen(true); };
    const onInit = (e: any) => { setCart(e.detail.cart as Cart); };
    window.addEventListener("cart:open", onOpen as any);
    window.addEventListener("cart:init", onInit as any);
    return () => {
      window.removeEventListener("cart:open", onOpen as any);
      window.removeEventListener("cart:init", onInit as any);
    };
  }, []);

  const goCheckout = () => {
    if (!cart?.checkoutUrl) return alert("Missing checkout URL");
    window.location.href = cart.checkoutUrl;
  };

  return (
    <aside className={`cart-drawer ${open ? "is-open" : ""}`}>
      <header className="cd-head">
        <h3>Cart ({cart?.totalQuantity ?? 0})</h3>
        <button onClick={() => setOpen(false)}>Close</button>
      </header>

      <div className="cd-body">
        {!cart || cart.totalQuantity === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <ul className="cd-lines">
            {cart.lines.edges.map(({ node }) => {
              const img = node.merchandise?.product?.featuredImage;
              const title = node.merchandise?.product?.title || node.merchandise?.title || "Item";
              const price = node.merchandise?.price;
              return (
                <li key={node.id} className="cd-line">
                  {img?.url && <img src={img.url} alt={img.altText || title} className="cd-thumb" />}
                  <div className="cd-info">
                    <div className="cd-title">{title}</div>
                    <div className="cd-qty">Qty: {node.quantity}</div>
                    {price && (
                      <div className="cd-price">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: price.currencyCode })
                          .format(Number(price.amount))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className="cd-foot">
        <button className="btn-cta" disabled={!cart || cart.totalQuantity === 0} onClick={goCheckout}>
          Checkout
        </button>
      </footer>
    </aside>
  );
}
