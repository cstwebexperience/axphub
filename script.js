/* ═══════════════════════════════════════════
   AXP HUB — Store Logic
   ═══════════════════════════════════════════ */

const products = [
  {
    id: "addicted",
    label: "Addicted",
    type: "Volum Powder",
    price: 69,
    image: "assets/images/addicted.jpeg",
    glow: "rgba(201, 48, 40, 0.45)",
    color: "rgb(201, 48, 40)",
  },
  {
    id: "dizzy",
    label: "Dizzy",
    type: "Sea Salt Spray",
    price: 79,
    image: "assets/images/dizzy.jpeg",
    glow: "rgba(26, 127, 212, 0.45)",
    color: "rgb(26, 127, 212)",
  },
  {
    id: "obsession",
    label: "Obsession",
    type: "After Shave",
    price: 89,
    image: "assets/images/obsession.jpeg",
    glow: "rgba(212, 113, 26, 0.45)",
    color: "rgb(212, 113, 26)",
  }
];

/* ─── STATE ─── */
const state = { cart: new Map() };

/* ─── DOM ─── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const header = $("[data-header]");
const productGrid = $("[data-product-grid]");
const cartDrawer = $("[data-cart-drawer]");
const cartItemsEl = $("[data-cart-items]");
const cartEmptyEl = $("[data-cart-empty]");
const cartTotalEl = $("[data-cart-total]");
const cartCounts = $$("[data-cart-count]");
const toast = $("[data-toast]");
const mobileNav = $("[data-mobile-nav]");

/* ─── CURRENCY ─── */
const fmt = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0
});

/* ─── RENDER PRODUCTS ─── */
function renderProducts() {
  productGrid.innerHTML = products
    .map(
      (p) => `
      <article class="product-card" data-card-id="${p.id}" style="--card-glow: ${p.glow}; --card-color: ${p.color}">
        <div class="product-card-img">
          <img src="${p.image}" alt="${p.label}" loading="lazy" />
        </div>
        <div class="product-card-info">
          <div>
            <div class="product-card-label">${p.label}</div>
            <div class="product-card-sub">${p.type}</div>
          </div>
          <div class="product-card-buy">
            <span class="product-card-price">${fmt.format(p.price)}</span>
            <button class="btn btn-primary" type="button" data-add-cart="${p.id}">
              Adaugă în coș
            </button>
          </div>
        </div>
      </article>
    `
    )
    .join("");
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

  cartItemsEl.innerHTML = entries
    .map(([id, qty]) => {
      const p = products.find((x) => x.id === id);
      return `
        <div class="cart-line">
          <div>
            <strong>${p.name}</strong>
            <span>${p.type} · ${fmt.format(p.price)}</span>
          </div>
          <div class="qty-controls">
            <button type="button" data-decrease="${p.id}">−</button>
            <span>${qty}</span>
            <button type="button" data-increase="${p.id}">+</button>
          </div>
        </div>
      `;
    })
    .join("");

  const count = getCount();
  cartCounts.forEach((el) => (el.textContent = count));
  cartTotalEl.textContent = fmt.format(getTotal());
  cartEmptyEl.hidden = entries.length > 0;
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

/* ─── MENU ─── */
function toggleMenu() {
  const open = mobileNav.classList.toggle("is-open");
  document.body.classList.toggle("menu-open", open);
}

/* ─── EVENT DELEGATION ─── */
document.addEventListener("click", (e) => {
  /* Relief pop on any product card click */
  const card = e.target.closest("[data-card-id]");
  if (card) {
    card.classList.remove("is-popped");
    void card.offsetWidth;
    card.classList.add("is-popped");
    card.addEventListener("animationend", () => card.classList.remove("is-popped"), { once: true });
  }

  const addBtn = e.target.closest("[data-add-cart]");
  if (addBtn) { addToCart(addBtn.dataset.addCart); openCart(); }

  const incBtn = e.target.closest("[data-increase]");
  if (incBtn) updateQty(incBtn.dataset.increase, 1);

  const decBtn = e.target.closest("[data-decrease]");
  if (decBtn) updateQty(decBtn.dataset.decrease, -1);

  if (e.target.closest("[data-cart-open]")) openCart();
  if (e.target.closest("[data-cart-close]")) closeCart();
  if (e.target.closest("[data-menu-toggle]")) toggleMenu();
  if (e.target.closest("[data-checkout-close]")) closeCheckout();
  if (e.target === checkoutOverlay) closeCheckout();
  if (e.target.closest("[data-pay]")) handlePay();

  if (e.target.closest(".mobile-nav a")) {
    mobileNav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }
});

/* ─── CHECKOUT ─── */
const checkoutOverlay  = $("[data-checkout-overlay]");
const checkoutItemsEl2 = $("[data-checkout-items]");
const checkoutTotalSide = $("[data-checkout-total-side]");
const checkoutTotalFoot = $("[data-checkout-total-foot]");
const checkoutFormEl   = $("[data-checkout-form]");

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

function renderCheckoutSummary() {
  const entries = [...state.cart.entries()];
  checkoutItemsEl2.innerHTML = entries.map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    return `
      <div class="checkout-item">
        <div class="checkout-item-img"><img src="${p.image}" alt="${p.label}"></div>
        <div style="flex:1">
          <div class="checkout-item-name">${p.label}</div>
          <div class="checkout-item-sub">${p.type}</div>
          <div class="checkout-item-qty">Cantitate: ${qty}</div>
        </div>
        <div class="checkout-item-price">${fmt.format(p.price * qty)}</div>
      </div>
    `;
  }).join('<div class="checkout-sep"></div>');
  const total = fmt.format(getTotal());
  checkoutTotalSide.textContent = total;
  checkoutTotalFoot.textContent = total;
}

async function handlePay() {
  const form = checkoutFormEl;
  const btn  = $("[data-pay]");

  const required = form.querySelectorAll("[required]");
  let valid = true;
  required.forEach(el => {
    const empty = !el.value.trim();
    el.classList.toggle("is-error", empty);
    if (empty) valid = false;
  });
  if (!valid) { showToast("Completează câmpurile obligatorii."); return; }

  /* Colectează datele din formular */
  const data    = Object.fromEntries(new FormData(form));
  const items   = [...state.cart.entries()].map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    return { label: p.label, type: p.type, price: p.price, qty };
  });

  /* Loading state */
  btn.disabled    = true;
  btn.textContent = "Se procesează...";

  try {
    const res  = await fetch("/api/create-checkout", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ items, customer: data }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    window.location.href = json.url; /* redirect la Stripe Checkout */
  } catch (err) {
    showToast(err.message || "Eroare. Încearcă din nou.");
    btn.disabled    = false;
    btn.textContent = "Plătește acum →";
  }
}

$("[data-checkout]").addEventListener("click", openCheckout);

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

/* Confirmare după redirect Stripe */
if (window.location.search.includes("comanda=confirmata")) {
  showToast("Comandă confirmată! Îți mulțumim — te contactăm în curând. ✓");
  history.replaceState(null, "", "/");
}
