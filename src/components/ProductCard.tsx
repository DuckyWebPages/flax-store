/* Images never stretch weirdly */
img { max-width: 100%; height: auto; }

/* Fixed 4:3 media box for all product cards */
.product-media { position: relative; width: 100%; background: #f9fafb; }
.product-media::before { content: ""; display: block; padding-top: 75%; } /* 4:3 */
.product-media > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }

/* Ensure cards stretch to match row height */
.prodpg__grid { align-items: stretch; }

/* The card already sets display:grid + gridTemplateRows via inline style.
   If you prefer class-based instead of inline, you can uncomment this:

.product-card {
  display: grid;
  grid-template-rows: auto 1fr auto; 
  height: 100%;
  gap: 10px;
}
*/

/* Optional: consistent bottom spacing under the button (if you want more air) */
/* .product-actions { padding-bottom: 6px; } */
