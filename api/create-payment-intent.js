/**
 * Creează un PaymentIntent Stripe pentru plata cu cardul EMBEDDED (Payment Element).
 * Suma se calculează SERVER-SIDE din prețuri autoritare (nu din ce trimite clientul),
 * ca să nu poată fi modificată din browser.
 */
const Stripe = require("stripe");

// Prețuri oficiale (RON) — sursa de adevăr pentru sumă
const PRICES = {
  "Addicted": 69,
  "Dizzy": 79,
  "Obsession": 89,
  "Pachet Full": 197,
};
const SHIPPING = { courier: 19, easybox: 14 };

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_")) {
    return res.status(500).json({ error: "Stripe nu este configurat (lipsește STRIPE_SECRET_KEY)." });
  }
  const stripe = Stripe(key);

  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const items = (body && body.items) || [];
    const customer = (body && body.customer) || {};
    if (!items.length) return res.status(400).json({ error: "Coșul este gol." });

    const isEasybox = customer.delivery_method === "easybox";
    const shipping = isEasybox ? SHIPPING.easybox : SHIPPING.courier;

    // Subtotal din prețuri server-side (după label)
    let subtotal = 0;
    for (const it of items) {
      const unit = PRICES[it.label];
      if (unit == null) return res.status(400).json({ error: `Produs necunoscut: ${it.label}` });
      subtotal += unit * Math.max(1, Number(it.qty) || 1);
    }
    const amount = Math.round((subtotal + shipping) * 100); // în bani

    const livrare = isEasybox
      ? `EasyBox: ${customer.locker_name || ""} — ${customer.locker_addr || ""} (ID: ${customer.locker_id || ""})`
      : [customer.strada, customer.nr, customer.bloc_ap, customer.localitate, customer.judet, customer.cod_postal].filter(Boolean).join(", ");

    const pi = await stripe.paymentIntents.create({
      amount,
      currency: "ron",
      // Card + Apple Pay + Google Pay + Link, toate în pagină (fără redirect)
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      receipt_email: customer.email || undefined,
      description: `Comandă AXP Hub — ${customer.nume || ""} ${customer.prenume || ""}`.trim(),
      metadata: {
        nume: `${customer.nume || ""} ${customer.prenume || ""}`.trim(),
        telefon: customer.telefon || "",
        email: customer.email || "",
        livrare,
        produse: items.map((it) => `${it.qty}x ${it.label}`).join(", ").slice(0, 500),
      },
    });

    res.json({ clientSecret: pi.client_secret, amount });
  } catch (err) {
    console.error("[payment-intent] Eroare:", err.message);
    res.status(500).json({ error: "Eroare la inițierea plății." });
  }
};
