const Stripe = require("stripe");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  const { items, customer } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: "Coșul este gol." });
  }

  const origin = req.headers.origin || "https://axphub.vercel.app";

  /* Adresa de livrare formatată pentru metadata */
  const deliveryInfo =
    customer.easybox_loc
      ? `EasyBox: ${customer.easybox_loc}, ${customer.oras_eb}`
      : `${customer.adresa}, ${customer.oras} ${customer.cod_postal || ""}`.trim();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      /* Produsele din coș — sumă dinamică */
      line_items: items.map((item) => ({
        price_data: {
          currency: "ron",
          product_data: {
            name: item.label,
            description: item.type,
          },
          unit_amount: item.price * 100, /* RON → bani */
        },
        quantity: item.qty,
      })),

      /* Date client pre-completate */
      customer_email: customer.email || undefined,

      /* Detalii livrare și contact salvate în metadata comenzii */
      metadata: {
        nume: `${customer.nume} ${customer.prenume}`,
        telefon: customer.telefon,
        livrare: deliveryInfo,
        observatii: customer.obs || "",
      },

      /* Pagini redirect după plată */
      success_url: `${origin}/?comanda=confirmata`,
      cancel_url:  `${origin}/`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Eroare la procesarea plății." });
  }
};
