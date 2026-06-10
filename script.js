/* ═══════════════════════════════════════════
   AXP HUB — Store Logic
   ═══════════════════════════════════════════ */

const products = [
  {
    id: "addicted",
    label: "Addicted",
    type: "Volum Powder",
    price: 69,
    originalPrice: 89,
    image: "assets/images/addicted.jpeg",
    glow: "rgba(201, 48, 40, 0.45)",
    color: "rgb(201, 48, 40)",
    tagline: "Volum maxim, zero compromisuri.",
    intro: "Ai nevoie de volum, dar te temi să nu-ți agresezi părul? Pudra de volum Addicted este creată special pentru cei care își doresc un styling impecabil, dar sănătos.",
    features: [
      { t: "Prietenoasă cu firul de păr", d: "Produs blând, ideal pentru persoanele cu probleme de cădere a părului sau cu fir fragil și subțire." },
      { t: "Fixare naturală", d: "Nu rigidizează părul excesiv. Obții volum și textură, păstrând un aspect flexibil și natural." },
      { t: "Universală", d: "Indiferent de tipul tău de păr sau de stilul dorit, pudra se adaptează perfect nevoilor tale." },
      { t: "Simplu și eficient", d: "Styling curat, ușor de aplicat și ușor de spălat, care îți respectă scalpul." },
    ],
    outro: "Alege o coafură plină de viață fără să-ți sacrifici sănătatea părului. Cu AXP Hub Addicted, stilul tău devine o plăcere!",
    reviews: [],
  },
  {
    id: "dizzy",
    label: "Dizzy",
    type: "Sea Salt Spray",
    price: 79,
    originalPrice: 99,
    image: "assets/images/dizzy.jpeg",
    glow: "rgba(26, 127, 212, 0.45)",
    color: "rgb(26, 127, 212)",
    tagline: "Volum și sănătate, direct din natură.",
    intro: "Simți că părul tău este prea drept, moale sau lipsit de viață? Dizzy Sea Salt este soluția naturală pentru cei care vor volum fără să își sacrifice sănătatea firului de păr.",
    features: [
      { t: "Volum instant", d: "Oferă textură și densitate părului drept și subțire." },
      { t: "Finisaj natural", d: "Acel look relaxat, „de plajă”, fără ca părul să pară încărcat sau lipicios." },
      { t: "Protecție și respect", d: "Alegerea perfectă dacă te confrunți cu căderea părului și vrei să eviți produsele agresive sau chimice." },
      { t: "Puterea naturii", d: "Folosește minerale esențiale pentru a-ți disciplina părul într-un mod blând." },
    ],
    outro: "Mai simplu, mai sănătos, mai mult volum. Încearcă AXP Hub Dizzy și lasă natura să lucreze pentru părul tău!",
    reviews: [],
  },
  {
    id: "obsession",
    label: "Obsession",
    type: "After Shave",
    price: 89,
    originalPrice: 119,
    image: "assets/images/obsession.jpeg",
    glow: "rgba(212, 113, 26, 0.45)",
    color: "rgb(212, 113, 26)",
    tagline: "Esența masculinității absolute.",
    intro: "Transformă rutina bărbieritului într-o experiență senzorială de neuitat. Obsession nu este doar un aftershave, este semnătura bărbatului hotărât, care nu acceptă compromisuri.",
    features: [
      { t: "Aromă puternică și persistentă", d: "Un amestec magnetic de cafea intensă, caramel bogat și vanilie fină care emană forță și eleganță pe tot parcursul zilei." },
      { t: "Profil masculin", d: "Un miros cald, dulceag dar robust, creat special pentru bărbatul modern care vrea să lase o impresie de durată." },
      { t: "Îngrijire superioară", d: "Calmează instantaneu pielea după bărbierit, lăsând-o revigorată și fină la atingere." },
    ],
    outro: "„Nu doar miroase bine, impune respect.” Fii de neuitat. Alege intensitatea. Alege AXP Hub Obsession.",
    reviews: [],
  },
  {
    id: "bundle",
    label: "Pachet Full",
    type: "Addicted + Dizzy + Obsession",
    price: 197,
    originalPrice: 237,
    image: "assets/images/bundle.jpeg",
    bundle: true,
    tagline: "Rutina completă, într-un singur pachet.",
    intro: "Cele trei produse AXP Hub într-un singur pachet, la cel mai bun preț: volum, textură și un finish de neuitat.",
    features: [
      { t: "Addicted — Volum Powder", d: "Volum instant, finish mat, control uscat." },
      { t: "Dizzy — Sea Salt Spray", d: "Textură naturală, look de plajă, pre-styling." },
      { t: "Obsession — After Shave", d: "Aromă de cafea și caramel sărat, îngrijire premium." },
    ],
    outro: "Rutina completă AXP Hub — economisești față de cumpărarea separată.",
    reviews: [],
  }
];

/* ─── STATE ─── */
const state = {
  cart: new Map(),
  deliveryMode: "courier",    // "courier" | "easybox"
  paymentMethod: "card",      // "card" | "ramburs"
  selectedLocker: null,
};

const SHIPPING = { courier: 19, easybox: 14 };

/* ─── DOM ─── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const header         = $("[data-header]");
const productGrid    = $("[data-product-grid]");
const cartDrawer     = $("[data-cart-drawer]");
const cartItemsEl    = $("[data-cart-items]");
const cartEmptyEl    = $("[data-cart-empty]");
const cartTotalEl    = $("[data-cart-total]");
const cartCounts     = $$("[data-cart-count]");
const toast          = $("[data-toast]");
const mobileNav      = $("[data-mobile-nav]");

/* ─── CURRENCY ─── */
const fmt = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0
});

/* ─── EMAIL COMENZI (formsubmit.co, client-side, fără cheie) ─── */
const STORE_EMAIL = "axpcontact00293@gmail.com";

function buildOrder(items, customer, paid) {
  const isEasybox = customer.delivery_method === "easybox";
  const shipping  = isEasybox ? SHIPPING.easybox : SHIPPING.courier;
  const subtotal  = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 1), 0);
  return {
    paid,
    totalRON: subtotal + shipping,
    items: items.map(it => ({ name: it.label, qty: it.qty, totalRON: Number(it.price || 0) * Number(it.qty || 1) })),
    customer: {
      nume: `${customer.nume || ""} ${customer.prenume || ""}`.trim(),
      telefon: customer.telefon || "",
      email: customer.email || "",
      observatii: customer.obs || "",
    },
    delivery: {
      method: isEasybox ? "easybox" : "courier",
      text: isEasybox
        ? `EasyBox: ${customer.locker_name || ""} — ${customer.locker_addr || ""} (ID: ${customer.locker_id || ""})`
        : [customer.strada, customer.nr, customer.bloc_ap, customer.localitate, customer.judet, customer.cod_postal].filter(Boolean).join(", "),
    },
  };
}

function orderRef() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `AXP-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/* Text de confirmare/chitanță trimis CLIENTULUI (autoresponder, no-reply) */
function buildReceiptText(order, ref) {
  const linii = (order.items || [])
    .map(it => `  • ${it.qty} x ${it.name} — ${it.totalRON.toFixed(2)} RON`).join("\n");
  return [
    `Salut ${order.customer.nume || ""},`,
    ``,
    `Îți mulțumim pentru comanda plasată pe axphub.ro! Am primit-o cu succes.`,
    ``,
    `─────────────────────────────`,
    `CONFIRMARE COMANDĂ  ·  ${ref}`,
    `─────────────────────────────`,
    `Produse:`,
    linii || "  —",
    ``,
    `Livrare: ${order.delivery.method === "easybox" ? "EasyBox Sameday" : "Curier Sameday"}`,
    `  ${order.delivery.text || "-"}`,
    ``,
    `Plată: ${order.paid ? "Card bancar (online)" : "Ramburs la livrare"}`,
    `TOTAL: ${order.totalRON.toFixed(2)} RON`,
    `─────────────────────────────`,
    ``,
    `Te contactăm în curând pentru confirmarea finală și detaliile de livrare.`,
    `Ai întrebări? Scrie-ne pe WhatsApp: 0772 153 764.`,
    ``,
    `Mulțumim,`,
    `Echipa AXP Hub`,
    `axphub.ro`,
    ``,
    `(Acesta este un email automat de confirmare, te rugăm să nu răspunzi. Documentul fiscal îți va fi transmis separat.)`,
  ].join("\n");
}

async function sendOrderMail(order) {
  const ref = orderRef();
  const produse = (order.items || [])
    .map(it => `${it.qty}x ${it.name} — ${it.totalRON.toFixed(2)} RON`).join("\n");
  const payload = {
    _subject: `Comanda ${order.paid ? "(card)" : "(ramburs)"} AXP Hub — ${order.totalRON.toFixed(2)} RON — ${order.customer.nume}`,
    _template: "table",
    _captcha: "false",
    "Referinta": ref,
    "Status": order.paid ? "CARD - verifica plata in Stripe" : "RAMBURS - de incasat la livrare",
    "Total comanda": order.totalRON.toFixed(2) + " RON",
    "Produse": produse || "(fara produse)",
    "Livrare": (order.delivery.method === "easybox" ? "EasyBox — " : "Curier — ") + order.delivery.text,
    "Client": order.customer.nume || "-",
    "Telefon": order.customer.telefon || "-",
    "Email client": order.customer.email || "-",
    "Observatii": order.customer.observatii || "-",
  };
  /* Dacă clientul a lăsat email → primește confirmare automată (no-reply) */
  if (order.customer.email) {
    payload._replyto = order.customer.email;
    payload._autoresponder = buildReceiptText(order, ref);
  }
  try {
    await fetch("https://formsubmit.co/ajax/" + STORE_EMAIL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) { console.warn("Email comandă a eșuat:", e); }
}

/* ─── RENDER PRODUCTS ─── */
function renderProducts() {
  const regular = products.filter(p => !p.bundle);
  const bundle  = products.find(p => p.bundle);

  productGrid.innerHTML =
    regular.map(p => {
      const disc = Math.round((1 - p.price / p.originalPrice) * 100);
      return `
      <article class="product-card" data-card-id="${p.id}" style="--card-glow: ${p.glow}; --card-color: ${p.color}">
        <div class="product-card-badge">-${disc}%</div>
        <div class="product-card-img">
          <img src="${p.image}" alt="${p.label}" loading="lazy" />
        </div>
        <div class="product-card-info">
          <div>
            <div class="product-card-label">${p.label}</div>
            <div class="product-card-sub">${p.type}</div>
          </div>
          <div class="product-card-buy">
            <div class="product-card-prices">
              <span class="product-card-price-old">${fmt.format(p.originalPrice)}</span>
              <span class="product-card-price">${fmt.format(p.price)}</span>
            </div>
            <button class="btn btn-primary" type="button" data-add-cart="${p.id}">
              Adaugă în coș
            </button>
          </div>
        </div>
      </article>`;
    }).join("") +

    (bundle ? `
      <article class="product-card product-card-bundle" data-card-id="bundle">
        <div class="bundle-corner-tag">
          <span class="bct-pct">${Math.round((1 - bundle.price / bundle.originalPrice) * 100)}%</span>
          <span class="bct-off">OFF</span>
        </div>
        <div class="bundle-img">
          <img src="${bundle.image}" alt="Pachet Full" loading="lazy" />
        </div>
        <div class="bundle-info">
          <div>
            <div class="bundle-eyebrow">Rutina completă · Toate 3 produse</div>
            <div class="bundle-name">
              <span class="bn-red">PAC</span><span class="bn-blue">HET</span> <span class="bn-orange">FULL</span>
            </div>
            <div class="bundle-products-list">
              <span class="bn-red">Addicted</span>
              <span class="bundle-dot">·</span>
              <span class="bn-blue">Dizzy</span>
              <span class="bundle-dot">·</span>
              <span class="bn-orange">Obsession</span>
            </div>
          </div>
          <div class="bundle-buy">
            <div class="bundle-prices">
              <span class="bundle-price-old">${fmt.format(bundle.originalPrice)}</span>
              <div class="bundle-price">197 <span class="bn-red">R</span><span class="bn-blue">O</span><span class="bn-orange">N</span></div>
            </div>
            <button class="btn btn-primary bundle-btn" type="button" data-add-cart="bundle">
              Adaugă pachetul în coș
            </button>
          </div>
        </div>
      </article>` : "");
}

/* ─── CART ─── */
function getTotal() {
  return [...state.cart.entries()].reduce((sum, [id, qty]) => {
    const p = products.find((x) => x.id === id);
    return sum + p.price * qty;
  }, 0);
}

function getCount() {
  return [...state.cart.values()].reduce((sum, q) => sum + q, 0);
}

function renderCart() {
  const entries = [...state.cart.entries()];

  cartItemsEl.innerHTML = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    return `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${p.image}" alt="${p.label}">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.label}</div>
          <div class="cart-item-type">${p.type}</div>
          <div class="cart-item-price-row">
            <div class="qty-controls">
              <button type="button" data-decrease="${p.id}">−</button>
              <span>${qty}</span>
              <button type="button" data-increase="${p.id}">+</button>
            </div>
            <span class="cart-item-price">${fmt.format(p.price * qty)}</span>
          </div>
        </div>
        <button class="cart-item-remove" type="button" data-remove="${p.id}" aria-label="Șterge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
  }).join("");

  const count = getCount();
  cartCounts.forEach(el => el.textContent = count);
  cartTotalEl.textContent = fmt.format(getTotal());
  cartEmptyEl.hidden = entries.length > 0;
}

function removeFromCart(id) {
  state.cart.delete(id);
  renderCart();
}

function addToCart(id) {
  state.cart.set(id, (state.cart.get(id) || 0) + 1);
  renderCart();
  showToast("Produs adăugat în coș ✓");
}

function updateQty(id, dir) {
  const qty = (state.cart.get(id) || 0) + dir;
  if (qty <= 0) state.cart.delete(id);
  else state.cart.set(id, qty);
  renderCart();
}

function openCart() {
  cartDrawer.classList.add("is-open");
  document.body.classList.add("cart-open");
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  document.body.classList.remove("cart-open");
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

/* ─── PRODUCT DETAIL (eMAG-style) ─── */
const pdOverlay = $("[data-pd-overlay]");
const pdContent = $("[data-pd-content]");

function starsHTML(n) {
  const full = Math.round(n);
  let s = "";
  for (let i = 1; i <= 5; i++) {
    s += `<svg class="pd-star ${i <= full ? "is-on" : ""}" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`;
  }
  return s;
}

function reviewHTML(r) {
  return `
    <div class="pd-review">
      <div class="pd-review-head">
        <div class="pd-review-avatar">${(r.name || "?").charAt(0)}</div>
        <div>
          <div class="pd-review-name">${r.name || "Anonim"}</div>
          <div class="pd-review-stars">${starsHTML(r.stars || 5)}</div>
        </div>
        <span class="pd-review-date">${r.date || ""}</span>
      </div>
      <p class="pd-review-text">${(r.text || "").replace(/</g, "&lt;")}</p>
    </div>`;
}

function openProductDetail(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const disc = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  const reviews = p.reviews || [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + (Number(r.stars) || 0), 0) / reviews.length : 0;
  const hasPurchased = localStorage.getItem("axp_purchased") === "1";
  const accent = p.color || "var(--text)";

  pdContent.innerHTML = `
    <div class="pd-grid" style="--pd-accent:${accent}">
      <div class="pd-media">
        <img src="${p.image}" alt="${p.label}" />
      </div>
      <div class="pd-info">
        <div class="pd-eyebrow">${p.type}</div>
        <h2 class="pd-title">${p.label}</h2>
        ${p.tagline ? `<p class="pd-tagline">${p.tagline}</p>` : ""}
        <div class="pd-rating-row">
          ${reviews.length
            ? `<span class="pd-rating-stars">${starsHTML(avg)}</span><span class="pd-rating-val">${avg.toFixed(1)}</span><span class="pd-rating-count">(${reviews.length} ${reviews.length === 1 ? "recenzie" : "recenzii"})</span>`
            : `<span class="pd-rating-count">Fără recenzii încă</span>`}
        </div>
        <div class="pd-prices">
          ${p.originalPrice ? `<span class="pd-price-old">${fmt.format(p.originalPrice)}</span>` : ""}
          <span class="pd-price">${fmt.format(p.price)}</span>
          ${disc ? `<span class="pd-disc">-${disc}%</span>` : ""}
        </div>
        <p class="pd-intro">${p.intro || ""}</p>
        <div class="pd-actions">
          <button class="btn btn-primary pd-add" type="button" data-add-cart="${p.id}">Adaugă în coș</button>
        </div>
        <div class="pd-trust">
          <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>Livrare 1–4 zile</span>
          <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Plată securizată</span>
          <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Retur 14 zile</span>
        </div>
      </div>
    </div>

    <div class="pd-section">
      <h3 class="pd-section-title">Descriere</h3>
      <ul class="pd-features">
        ${(p.features || []).map(f => `<li><strong>${f.t}.</strong> ${f.d}</li>`).join("")}
      </ul>
      ${p.outro ? `<p class="pd-outro">${p.outro}</p>` : ""}
    </div>

    <div class="pd-section">
      <div class="pd-reviews-head">
        <h3 class="pd-section-title">Recenzii (${reviews.length})</h3>
        ${reviews.length ? `<div class="pd-reviews-summary"><span class="pd-rating-stars">${starsHTML(avg)}</span><strong>${avg.toFixed(1)}</strong> / 5</div>` : ""}
      </div>
      <div class="pd-reviews-list" data-pd-reviews>
        ${reviews.length ? reviews.map(reviewHTML).join("") : `<p class="pd-no-reviews">Acest produs nu are încă recenzii.</p>`}
      </div>

      ${hasPurchased ? `
      <form class="pd-review-form" data-pd-review-form data-product="${p.id}">
        <h4>Scrie o recenzie</h4>
        <div class="pd-form-row">
          <input type="text" name="name" placeholder="Numele tău" required />
          <select name="stars" aria-label="Notă">
            <option value="5">★★★★★ (5)</option>
            <option value="4">★★★★ (4)</option>
            <option value="3">★★★ (3)</option>
            <option value="2">★★ (2)</option>
            <option value="1">★ (1)</option>
          </select>
        </div>
        <textarea name="text" placeholder="Părerea ta despre produs..." required></textarea>
        <button class="btn btn-primary" type="submit">Trimite recenzia</button>
      </form>` : `
      <div class="pd-review-locked">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>Doar clienții care au cumpărat pot lăsa o recenzie. După ce comanzi, vei putea scrie aici părerea ta.</span>
      </div>`}
    </div>
  `;

  pdOverlay.classList.add("is-open");
  pdOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("pd-open");
  pdContent.scrollTop = 0;
}

function closeProductDetail() {
  pdOverlay.classList.remove("is-open");
  pdOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("pd-open");
}

/* Submit recenzie — trimite la magazin spre moderare (NU se publică automat) */
document.addEventListener("submit", async (e) => {
  const form = e.target.closest("[data-pd-review-form]");
  if (!form) return;
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const productId = form.dataset.product;
  const product = products.find(x => x.id === productId);
  const review = {
    name: (data.name || "Anonim").trim(),
    stars: Number(data.stars || 5),
    date: new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" }),
    text: (data.text || "").trim(),
  };
  if (!review.text) return;

  form.reset();
  showToast("Mulțumim! Recenzia ta a fost trimisă spre verificare ✓");

  /* Notifică magazinul prin email (client-side, best-effort) — se adaugă manual după verificare */
  try {
    await fetch("https://formsubmit.co/ajax/" + STORE_EMAIL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: `Recenzie nouă — ${product ? product.label : productId}`,
        _template: "table",
        _captcha: "false",
        "Produs": product ? product.label : productId,
        "Nume": review.name,
        "Nota": review.stars + " / 5",
        "Recenzie": review.text,
        "Actiune": "De moderat / adaugat manual",
      }),
    });
  } catch (err) { console.warn("review notify failed:", err); }
});

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-pd-close]") || e.target === pdOverlay) closeProductDetail();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && pdOverlay.classList.contains("is-open")) closeProductDetail();
});

/* ─── MENU ─── */
function toggleMenu() {
  const open = mobileNav.classList.toggle("is-open");
  document.body.classList.toggle("menu-open", open);
}

/* ─── EVENT DELEGATION ─── */
document.addEventListener("click", (e) => {
  /* Adaugă în coș — are prioritate, nu deschide pagina de produs */
  const addBtn = e.target.closest("[data-add-cart]");
  if (addBtn) {
    addToCart(addBtn.dataset.addCart);
    openCart();
    return;
  }

  /* Click pe card (oriunde în afara butonului) → deschide pagina de produs */
  const card = e.target.closest("[data-card-id]");
  if (card && !e.target.closest("[data-pd-overlay]")) {
    openProductDetail(card.dataset.cardId);
    return;
  }

  const incBtn = e.target.closest("[data-increase]");
  if (incBtn) updateQty(incBtn.dataset.increase, 1);

  const decBtn = e.target.closest("[data-decrease]");
  if (decBtn) updateQty(decBtn.dataset.decrease, -1);

  const removeBtn = e.target.closest("[data-remove]");
  if (removeBtn) removeFromCart(removeBtn.dataset.remove);

  if (e.target.closest("[data-cart-open]"))      openCart();
  if (e.target.closest("[data-cart-close]"))     closeCart();
  if (e.target.closest("[data-menu-toggle]"))    toggleMenu();
  if (e.target.closest("[data-checkout-close]")) closeCheckout();
  if (e.target === checkoutOverlay)              closeCheckout();
  if (e.target.closest("[data-pay]"))            handlePay();

  /* Delivery option cards */
  const deliveryCard = e.target.closest("[data-delivery-card]");
  if (deliveryCard) {
    setDeliveryMode(deliveryCard.dataset.deliveryCard);
    $$("[data-delivery-card]").forEach(c => c.classList.toggle("is-active", c === deliveryCard));
  }

  /* Payment option cards */
  const paymentCard = e.target.closest("[data-payment-card]");
  if (paymentCard) {
    state.paymentMethod = paymentCard.dataset.paymentCard;
    $$("[data-payment-card]").forEach(c => c.classList.toggle("is-active", c === paymentCard));
  }

  /* EasyBox: schimbă locker-ul selectat */
  if (e.target.closest("#eb-change-btn")) {
    const card = $("#eb-selected-card");
    if (card) card.hidden = true;
    state.selectedLocker = null;
    if (_map) _map.closePopup();
  }

  if (e.target.closest(".mobile-nav a")) {
    mobileNav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }
});

/* ─── CHECKOUT ─── */
const checkoutOverlay    = $("[data-checkout-overlay]");
const checkoutItemsEl2   = $("[data-checkout-items]");
const checkoutTotalSide  = $("[data-checkout-total-side]");
const checkoutSubtotalEl = $("[data-checkout-subtotal]");
const checkoutShippingEl = $("[data-checkout-shipping]");
const shippingLabelEl    = $("[data-shipping-label]");
const checkoutFormEl     = $("[data-checkout-form]");

function openCheckout() {
  if (!getCount()) { showToast("Adaugă cel puțin un produs."); return; }
  closeCart();
  renderCheckoutSummary();
  checkoutOverlay.classList.add("is-open");
  checkoutOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("checkout-open");
}

function closeCheckout() {
  checkoutOverlay.classList.remove("is-open");
  checkoutOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("checkout-open");
}

function updateCheckoutTotals() {
  const subtotal = getTotal();
  const shipping = SHIPPING[state.deliveryMode] || 19;
  if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = fmt.format(subtotal);
  if (checkoutShippingEl) checkoutShippingEl.textContent = fmt.format(shipping);
  if (checkoutTotalSide)  checkoutTotalSide.textContent  = fmt.format(subtotal + shipping);
  if (shippingLabelEl)    shippingLabelEl.textContent    = state.deliveryMode === "easybox" ? "Livrare (EasyBox)" : "Livrare (curier)";
}

function renderCheckoutSummary() {
  const entries = [...state.cart.entries()];
  checkoutItemsEl2.innerHTML = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    return `
      <div class="ck-order-item">
        <div class="ck-order-img"><img src="${p.image}" alt="${p.label}"></div>
        <div class="ck-order-info">
          <span class="ck-order-name">${p.label}</span>
          <span class="ck-order-sub">${p.type} × ${qty}</span>
        </div>
        <span class="ck-order-price">${fmt.format(p.price * qty)}</span>
      </div>
    `;
  }).join("");
  updateCheckoutTotals();
  updateDeliveryBadge();
}

function updateDeliveryBadge() {
  const el = $("[data-delivery-badge-text]");
  if (!el) return;
  if (state.deliveryMode === "easybox" && state.selectedLocker) {
    el.innerHTML = `EasyBox: <strong style="color:var(--text)">${state.selectedLocker.name}</strong><br/><span style="font-size:11px;color:var(--text-muted)">${state.selectedLocker.city}</span>`;
  } else if (state.deliveryMode === "easybox") {
    el.innerHTML = `Ridicare din <strong style="color:var(--text)">EasyBox Sameday</strong><br/>Alege un locker din hartă`;
  } else {
    el.innerHTML = `Livrare prin <strong style="color:var(--text)">curier Sameday</strong><br/>2–4 zile lucrătoare`;
  }
}

async function handlePay() {
  const form = checkoutFormEl;
  const btn  = $("[data-pay]");

  /* Validare câmpuri common (nume, prenume, telefon) */
  let valid = true;
  form.querySelectorAll("[required]").forEach(el => {
    const empty = !el.value.trim();
    el.classList.toggle("is-error", empty);
    if (empty) valid = false;
  });
  if (!valid) {
    showToast("Completează câmpurile obligatorii.");
    return;
  }

  /* Validare EasyBox */
  if (state.deliveryMode === "easybox" && !state.selectedLocker) {
    showToast("Selectează un EasyBox din hartă.");
    /* Scroll / focus pe harta EasyBox */
    const panel = $("[data-panel='easybox']");
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const data  = Object.fromEntries(new FormData(form));
  const items = [...state.cart.entries()].map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    return { label: p.label, type: p.type, price: p.price, qty };
  });

  btn.disabled    = true;
  btn.textContent = "Se procesează...";

  /* Ramburs — fără Stripe; trimitem emailul de comandă la magazin (client-side) */
  if (state.paymentMethod === "ramburs") {
    await sendOrderMail(buildOrder(items, data, false));
    localStorage.setItem("axp_purchased", "1");  /* deblochează recenziile */
    closeCheckout();
    state.cart.clear();
    renderCart();
    showToast("Comandă plasată! Te contactăm în curând pentru confirmare. ✓");
    return;
  }

  /* Card — Stripe. Salvăm comanda ca să trimitem emailul după plata reușită. */
  try {
    sessionStorage.setItem("axp_pending_order", JSON.stringify(buildOrder(items, data, true)));
    const res  = await fetch("/api/create-checkout", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ items, customer: data }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    window.location.href = json.url;
  } catch (err) {
    showToast(err.message || "Eroare. Încearcă din nou.");
    btn.disabled    = false;
    btn.textContent = "Plasează comanda →";
  }
}

$("[data-checkout]").addEventListener("click", openCheckout);

/* ─── DELIVERY MODE ─── */
function setDeliveryMode(mode) {
  state.deliveryMode = mode;

  /* Toggle panels */
  $$("[data-panel]").forEach(p => { p.hidden = p.dataset.panel !== mode; });

  /* Toggle required pe câmpurile de adresă */
  $$("[data-required-in]").forEach(el => {
    el.required = el.dataset.requiredIn === mode;
    el.classList.remove("is-error");
  });

  /* Hidden input */
  const dmInput = $("#delivery-method-input");
  if (dmInput) dmInput.value = mode;

  updateCheckoutTotals();
  updateDeliveryBadge();

  if (mode === "easybox") {
    setTimeout(() => initEasyboxMap(), 80);
  }
}

/* ─── EASYBOX MAP (eMag-style) ─── */
let _map          = null;
let _clusterGroup = null;
let _allLockers   = [];
let _filtered     = [];
let _markers      = {};
let _mapReady     = false;

function ebMarkerIcon(selected) {
  return L.divIcon({
    className: "",
    html: `<div class="eb-marker-icon${selected ? " is-selected" : ""}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    </div>`,
    iconSize:    [34, 34],
    iconAnchor:  [17, 17],
    popupAnchor: [0, -20],
  });
}

function renderLockerList(lockers) {
  const list = $("#eb-locker-list");
  if (!list) return;
  if (!lockers.length) {
    list.innerHTML = `<div class="eb-list-empty">Niciun locker în această zonă.</div>`;
    return;
  }
  list.innerHTML = lockers.map((locker, i) => `
    <div class="eb-list-item${state.selectedLocker?.id === locker.id ? " is-active" : ""}" data-list-id="${locker.id}">
      ${i === 0 ? `<div class="eb-list-badge"><svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Recomandat</div>` : ""}
      <div class="eb-list-name">${locker.name}</div>
      <div class="eb-list-addr">${[locker.addr, locker.city].filter(Boolean).join(", ")}</div>
    </div>
  `).join("");
}

function applyFilters() {
  const city   = $("#eb-city")?.value   || "";
  const search = ($("#eb-search")?.value || "").toLowerCase().trim();

  _filtered = _allLockers.filter(l => {
    if (city && l.city !== city) return false;
    if (search && !l.name.toLowerCase().includes(search)
               && !(l.addr||"").toLowerCase().includes(search)
               && !(l.city||"").toLowerCase().includes(search)) return false;
    return true;
  });

  if (_clusterGroup) {
    _clusterGroup.clearLayers();
    _filtered.forEach(l => { if (_markers[l.id]) _clusterGroup.addLayer(_markers[l.id]); });
    if (_filtered.length && (city || search)) {
      const valid = _filtered.filter(l => l.lat && l.lng);
      if (valid.length) {
        const bounds = L.latLngBounds(valid.map(l => [l.lat, l.lng]));
        if (bounds.isValid()) _map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
      }
    }
  }
  renderLockerList(_filtered.slice(0, 100));
}

function selectLocker(locker) {
  state.selectedLocker = locker;

  Object.entries(_markers).forEach(([id, m]) => m.setIcon(ebMarkerIcon(id === locker.id)));

  $$(".eb-list-item").forEach(el => el.classList.toggle("is-active", el.dataset.listId === locker.id));
  const activeItem = $(`[data-list-id="${locker.id}"]`);
  if (activeItem) {
    const wrap = activeItem.closest(".eb-list-wrap");
    if (wrap) wrap.scrollTo({ top: activeItem.offsetTop - 20, behavior: "smooth" });
  }

  const card = $("#eb-selected-card");
  if (card) {
    card.hidden = false;
    card.querySelector(".eb-selected-name").textContent = locker.name;
    card.querySelector(".eb-selected-addr").textContent = [locker.addr, locker.city].filter(Boolean).join(", ");
  }

  const $id   = $("#locker-id-input");
  const $name = $("#locker-name-input");
  const $addr = $("#locker-addr-input");
  if ($id)   $id.value   = locker.id;
  if ($name) $name.value = locker.name;
  if ($addr) $addr.value = [locker.addr, locker.city].filter(Boolean).join(", ");

  if (_map) _map.closePopup();
  updateDeliveryBadge();
}

window.selectLockerById = function(id) {
  const locker = _allLockers.find(l => l.id === id);
  if (locker) selectLocker(locker);
};

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }
    const cssUrls = [
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css",
      "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css",
    ];
    cssUrls.forEach(href => {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href;
      document.head.appendChild(l);
    });
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => {
      const mc = document.createElement("script");
      mc.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
      mc.onload = resolve; mc.onerror = reject;
      document.head.appendChild(mc);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ─── SAMEDAY LOCKER PLUGIN SDK ─── */
const SAMEDAY_CLIENT_ID = "832aaa5a-92e4-44ed-a055-7103f7be5012";
const SAMEDAY_API_USER  = "axpcontact00293@gmail.com";

let _sdkReady = false;

function initEasyboxSDK() {
  if (_sdkReady) return;
  if (typeof window.LockerPlugin === "undefined") {
    console.warn("[EasyBox] SDK Sameday nu s-a încărcat.");
    return;
  }
  _sdkReady = true;

  window.LockerPlugin.init({
    clientId:    SAMEDAY_CLIENT_ID,
    apiUsername: SAMEDAY_API_USER,
    countryCode: "RO",
    langCode:    "ro",
    theme:       "light",
    filters:     [{ showLockers: true }, { showPudos: false }],
  });

  const plugin = window.LockerPlugin.getInstance();

  plugin.subscribe(function(msg) {
    plugin.close();
    const name = msg.name || "";
    const addr = [msg.address, msg.city].filter(Boolean).join(", ");
    const id   = String(msg.lockerId || "");

    $("#locker-id-input").value   = id;
    $("#locker-name-input").value = name;
    $("#locker-addr-input").value = addr;

    const card = $("#eb-selected-card");
    if (card) {
      card.querySelector(".eb-selected-name").textContent = name;
      card.querySelector(".eb-selected-addr").textContent = addr;
      card.hidden = false;
    }
    state.selectedLocker = { id, name, addr };
    updateDeliveryBadge();
  });

  $("#eb-open-btn")?.addEventListener("click",   () => plugin.open());
  $("#eb-change-btn")?.addEventListener("click", () => plugin.open());
}

function initEasyboxMap() {
  setTimeout(initEasyboxSDK, 80);
}

/* ─── SCROLL: Header ─── */
window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
}, { passive: true });

/* ─── SCROLL: Showcase reveal ─── */
const slides = $$("[data-reveal]");
if (slides.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    },
    { threshold: 0.25 }
  );
  slides.forEach((slide) => observer.observe(slide));
}

/* ─── INIT ─── */
renderProducts();
renderCart();

if (window.location.search.includes("comanda=confirmata")) {
  /* Plată cu card reușită → trimitem emailul de comandă la magazin */
  const pending = sessionStorage.getItem("axp_pending_order");
  if (pending) {
    try { sendOrderMail(JSON.parse(pending)); } catch (e) { console.warn(e); }
    sessionStorage.removeItem("axp_pending_order");
  }
  localStorage.setItem("axp_purchased", "1");  /* deblochează recenziile */
  showToast("Comandă confirmată! Îți mulțumim — te contactăm în curând. ✓");
  history.replaceState(null, "", "/");
}

/* ─── COOKIE BANNER ─── */
(function initCookieBanner() {
  const banner = $("[data-cookie-banner]");
  if (!banner) return;
  const KEY = "axp_cookie_consent";
  if (localStorage.getItem(KEY)) return;        // deja a ales
  banner.hidden = false;
  const close = (val) => {
    localStorage.setItem(KEY, val);
    banner.hidden = true;
  };
  banner.querySelector("[data-cookie-accept]")?.addEventListener("click", () => close("accepted"));
  banner.querySelector("[data-cookie-reject]")?.addEventListener("click", () => close("rejected"));
})();
