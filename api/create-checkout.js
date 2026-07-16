/**
 * Creează o sesiune Stripe Checkout (pagină completă găzduită de Stripe):
 * - card + Apple Pay + Google Pay + Link
 * - colectează nume + telefon, review înainte de plată
 * - prețuri autoritare server-side (nu se pot modifica din browser)
 * - Stripe trimite automat clientului emailul de confirmare (dacă e activat în Settings → Emails)
 */
const Stripe = require("stripe");

const PRICES = { "Addicted": 69, "Dizzy": 79, "Obsession": 89, "Pachet Full": 197 };
const SHIPPING = { courier: 19, easybox: 14 };

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_")) return res.status(500).json({ error: "Stripe neconfigurat." });
  const stripe = Stripe(key);

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const items = (body && body.items) || [];
  const customer = (body && body.customer) || {};
  if (!items.length) return res.status(400).json({ error: "Coșul este gol." });

  const origin = req.headers.origin || "https://axphub.ro";
  const isEasybox = customer.delivery_method === "easybox";
  const shipping = isEasybox ? SHIPPING.easybox : SHIPPING.courier;

  const deliveryInfo = isEasybox
    ? `EasyBox: ${customer.locker_name || ""} — ${customer.locker_addr || ""} (ID: ${customer.locker_id || ""})`
    : [customer.adresa, customer.localitate, customer.judet, customer.cod_postal].filter(Boolean).join(", ");

  try {
    // Produse — preț autoritar server-side (după label)
    const line_items = [];
    for (const it of items) {
      const unit = PRICES[it.label];
      if (unit == null) return res.status(400).json({ error: `Produs necunoscut: ${it.label}` });
      line_items.push({
        price_data: {
          currency: "ron",
          product_data: { name: it.label, description: it.type || undefined },
          unit_amount: unit * 100,
        },
        quantity: Math.max(1, Number(it.qty) || 1),
      });
    }
    // Livrare ca linie separată
    line_items.push({
      price_data: {
        currency: "ron",
        product_data: { name: isEasybox ? "Livrare EasyBox Sameday" : "Livrare curier Sameday" },
        unit_amount: shipping * 100,
      },
      quantity: 1,
    });

    const metadata = {
      nume: `${customer.nume || ""} ${customer.prenume || ""}`.trim(),
      telefon: customer.telefon || "",
      email: customer.email || "",
      livrare: deliveryInfo,
      metoda_livrare: isEasybox ? "EasyBox Sameday" : "Curier Sameday",
      observatii: customer.obs || "",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      locale: "ro",
      customer_email: customer.email || undefined,
      phone_number_collection: { enabled: true },
      metadata,
      payment_intent_data: {
        description: `Comandă AXP Hub — ${metadata.nume}`,
        metadata,
      },
      custom_text: {
        submit: { message: "Comanda ajunge în 1–4 zile lucrătoare prin Sameday. Vei primi un email de confirmare." },
      },
      success_url: `${origin}/?comanda=confirmata`,
      cancel_url: `${origin}/?comanda=anulata`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Eroare la procesarea plății." });
  }
};
