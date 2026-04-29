/* ═══════════════════════════════════════════
   AXP HUB — Store Logic
   ═══════════════════════════════════════════ */

const products = [
  {
    id: "addicted",
    name: "Pudră de volum",
    type: "Red formula",
    price: 69,
    image: "assets/images/hero-frame-03.jpg",
    description:
      "Ridică rădăcina, lasă finish mat și dă control fără gel sau aspect încărcat.",
    bullets: ["Volum instant", "Finish mat", "Control uscat"]
  },
  {
    id: "dizzy",
    name: "Spray sare de mare",
    type: "Blue formula",
    price: 79,
    image: "assets/images/product-video-01.jpg",
    description:
      "Baza perfectă înainte de styling. Creează textură naturală și volum lejer.",
    bullets: ["Textură naturală", "Aderență", "Volum lejer"]
  },
  {
    id: "obsession",
    name: "After shave cu caramel sărat",
    type: "Orange formula",
    price: 89,
    image: "assets/images/product-video-02.jpg",
    description:
      "Calmează senzația după bărbierit, lasă un finish fresh și memorabil.",
    bullets: ["Fresh feel", "După bărbierit", "Finish curat"]
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
      <article class="product-card">
        <div class="product-card-media">
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
          <span class="product-card-badge">${p.type}</span>
        </div>
        <div class="product-card-body">
          <div class="product-card-type">${p.type}</div>
          <h3 class="product-card-name">${p.name}</h3>
          <p class="product-card-desc">${p.description}</p>
          <div class="product-card-bottom">
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
  const addBtn = e.target.closest("[data-add-cart]");
  if (addBtn) { addToCart(addBtn.dataset.addCart); openCart(); }

  const incBtn = e.target.closest("[data-increase]");
  if (incBtn) updateQty(incBtn.dataset.increase, 1);

  const decBtn = e.target.closest("[data-decrease]");
  if (decBtn) updateQty(decBtn.dataset.decrease, -1);

  if (e.target.closest("[data-cart-open]")) openCart();
  if (e.target.closest("[data-cart-close]")) closeCart();
  if (e.target.closest("[data-menu-toggle]")) toggleMenu();

  if (e.target.closest(".mobile-nav a")) {
    mobileNav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }
});

$("[data-checkout]").addEventListener("click", () => {
  if (!getCount()) { showToast("Adaugă cel puțin un produs."); return; }
  showToast("Checkout va fi conectat cu Stripe.");
});

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
