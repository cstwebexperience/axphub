/**
 * Stripe webhook — trimite email la axpcontact când o comandă cu CARD e PLĂTITĂ.
 * Se declanșează pe `checkout.session.completed` (doar comenzi plătite efectiv).
 */
const Stripe = require("stripe");
const { sendOrderEmail } = require("./_send-order-email");

// Stripe are nevoie de body-ul RAW pentru a verifica semnătura → dezactivăm parsarea.
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (err) {
    console.error("[webhook] Semnătură invalidă:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const li = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      const m = session.metadata || {};
      const order = {
        source: "card",
        paid: true,
        orderId: session.id,
        items: li.data.map((it) => ({
          name: it.description || "Produs",
          qty: it.quantity || 1,
          totalRON: (it.amount_total != null ? it.amount_total : it.amount_subtotal || 0) / 100,
        })),
        totalRON: (session.amount_total != null ? session.amount_total : 0) / 100,
        customer: {
          nume: m.nume || "",
          telefon: m.telefon || "",
          email: (session.customer_details && session.customer_details.email) || session.customer_email || "",
          observatii: m.observatii || "",
        },
        delivery: {
          method: m.delivery_method === "easybox" ? "easybox" : "courier",
          text: m.livrare || "",
        },
      };
      await sendOrderEmail(order);
    } catch (e) {
      console.error("[webhook] Eroare la trimiterea emailului de comandă:", e);
    }
  }

  return res.json({ received: true });
};
