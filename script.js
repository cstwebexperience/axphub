const products = [
  {
    id: "addicted",
    name: "Pudră de volum",
    type: "Red formula",
    price: 69,
    image: "assets/images/hero-frame-03.jpg",
    tone: "Negru / roșu",
    description:
      "Pentru par care cade repede. Ridica radacina, lasa finish mat si iti da control fara gel sau aspect incarcat.",
    bullets: ["Volum instant", "Finish mat", "Control uscat"]
  },
  {
    id: "dizzy",
    name: "Spray sare de mare",
    type: "Blue formula",
    price: 79,
    image: "assets/images/product-video-01.jpg",
    tone: "Negru / albastru",
    description:
      "Baza perfecta inainte de styling. Creeaza textura naturala, aderenta si volum lejer pentru par cu miscare.",
    bullets: ["Textura naturala", "Aderenta", "Volum lejer"]
  },
  {
    id: "obsession",
    name: "After shave cu caramel sărat",
    type: "Orange formula",
    price: 89,
    image: "assets/images/product-video-02.jpg",
    tone: "Negru / portocaliu",
    description:
      "Ultimul pas din rutina. Calmeaza senzatia dupa barbierit si lasa un finish fresh, curat, memorabil.",
    bullets: ["Fresh feel", "Dupa barbierit", "Finish curat"]
  }
];

const state = {
  cart: new Map()
};

const header = document.querySelector("[data-header]");
const productGrid = document.querySelector("[data-product-grid]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartItems = document.querySelector("[data-cart-items]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const cartTotal = document.querySelector("[data-cart-total]");
const cartCounts = document.querySelectorAll("[data-cart-count]");
const toast = document.querySelector("[data-toast]");
const mobileNav = document.querySelector("[data-mobile-nav]");
const heroCard = document.querySelector("[data-hero-card]");
const heroProductButtons = document.querySelectorAll("[data-hero-product]");
const tiltZone = document.querySelector("[data-tilt-zone]");
const tiltCard = document.querySelector("[data-tilt-card]");

const heroProductDetails = {
  addicted: {
    label: "Featured 01",
    name: "Pudră de volum",
    description: "Volume powder pentru textura uscata si control instant."
  },
  dizzy: {
    label: "Featured 02",
    name: "Spray sare de mare",
    description: "Sea salt spray pentru volum lejer si textura naturala."
  },
  obsession: {
    label: "Featured 03",
    name: "After shave cu caramel sărat",
    description: "After shave pentru un finish fresh dupa fiecare rutina."
  }
};

const currency = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0
});

function renderProducts() {
  productGrid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-media">
            <img src="${product.image}" alt="${product.name} ${product.type}" loading="lazy" />
            <span class="product-tag">${product.tone}</span>
          </div>
          <div class="product-body">
            <div>
              <div class="product-meta">
                <span>${product.type}</span>
                <strong class="price">${currency.format(product.price)}</strong>
              </div>
              <h3>${product.name}</h3>
              <p>${product.description}</p>
              <ul class="product-benefits">
                ${product.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
              </ul>
            </div>
            <button class="button button-primary" type="button" data-add-cart="${product.id}">
              🛒 Adaugă în coș
            </button>
          </div>
        </article>
      `
    )
    .join("");
}

function getCartTotal() {
  return [...state.cart.entries()].reduce((total, [id, qty]) => {
    const product = products.find((item) => item.id === id);
    return total + product.price * qty;
  }, 0);
}

function getCartCount() {
  return [...state.cart.values()].reduce((total, qty) => total + qty, 0);
}

function renderCart() {
  const entries = [...state.cart.entries()];

  cartItems.innerHTML = entries
    .map(([id, qty]) => {
      const product = products.find((item) => item.id === id);
      return `
        <div class="cart-line">
          <div>
            <strong>${product.name}</strong>
            <span>${product.type} · ${currency.format(product.price)}</span>
          </div>
          <div class="qty-controls" aria-label="Cantitate ${product.name}">
            <button type="button" data-decrease="${product.id}">-</button>
            <span>${qty}</span>
            <button type="button" data-increase="${product.id}">+</button>
          </div>
        </div>
      `;
    })
    .join("");

  const count = getCartCount();
  cartCounts.forEach((item) => {
    item.textContent = count;
  });

  cartTotal.textContent = currency.format(getCartTotal());
  cartEmpty.hidden = entries.length > 0;
}

function addToCart(id) {
  state.cart.set(id, (state.cart.get(id) || 0) + 1);
  renderCart();
  showToast("Produs adaugat in cos.");
}

function updateQuantity(id, direction) {
  const qty = state.cart.get(id) || 0;
  const nextQty = qty + direction;

  if (nextQty <= 0) {
    state.cart.delete(id);
  } else {
    state.cart.set(id, nextQty);
  }

  renderCart();
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function toggleMenu() {
  const isOpen = mobileNav.classList.toggle("is-open");
  document.body.classList.toggle("menu-open", isOpen);
}

function setHeroProduct(id) {
  const product = heroProductDetails[id];

  if (!product) {
    return;
  }

  heroProductButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.heroProduct === id);
  });

  if (heroCard) {
    heroCard.innerHTML = `
      <span>${product.label}</span>
      <strong>${product.name}</strong>
      <p>${product.description}</p>
    `;
  }
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-cart]");
  const increaseButton = event.target.closest("[data-increase]");
  const decreaseButton = event.target.closest("[data-decrease]");

  if (addButton) {
    addToCart(addButton.dataset.addCart);
    openCart();
  }

  if (increaseButton) {
    updateQuantity(increaseButton.dataset.increase, 1);
  }

  if (decreaseButton) {
    updateQuantity(decreaseButton.dataset.decrease, -1);
  }

  if (event.target.closest("[data-cart-open]")) {
    openCart();
  }

  if (event.target.closest("[data-cart-close]") || event.target === cartDrawer) {
    closeCart();
  }

  if (event.target.closest("[data-menu-toggle]")) {
    toggleMenu();
  }

  const heroProductButton = event.target.closest("[data-hero-product]");
  if (heroProductButton) {
    setHeroProduct(heroProductButton.dataset.heroProduct);
  }

  if (event.target.closest(".mobile-nav a")) {
    mobileNav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }
});

document.querySelector("[data-checkout]").addEventListener("click", () => {
  if (!getCartCount()) {
    showToast("Adaugă cel puțin un produs în coș.");
    return;
  }

  showToast("Stripe va fi conectat aici în pasul următor.");
});

window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 16);
});

if (tiltZone && tiltCard) {
  tiltZone.addEventListener("pointermove", (event) => {
    if (window.innerWidth < 960) {
      return;
    }

    const rect = tiltZone.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    tiltCard.style.transform = `rotate(-1.5deg) rotateX(${y * -5}deg) rotateY(${x * 7}deg) translate3d(${x * 10}px, ${y * 8}px, 0)`;
  });

  tiltZone.addEventListener("pointerleave", () => {
    tiltCard.style.transform = "";
  });
}

const revealScenes = document.querySelectorAll("[data-reveal]");

if (revealScenes.length) {
  const sceneObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    {
      threshold: 0.42
    }
  );

  revealScenes.forEach((scene) => sceneObserver.observe(scene));
}

renderProducts();
renderCart();
