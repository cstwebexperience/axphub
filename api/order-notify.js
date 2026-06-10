/**
 * Notificare comandă RAMBURS — trimite emailul la axpcontact imediat ce clientul
 * plasează o comandă cu plata la livrare (nu trece prin Stripe).
 */
const { sendOrderEmail } = require("./_send-order-email");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const items = body.items || [];
    const customer = body.customer || {};
    if (!items.length) return res.status(400).json({ error: "Coșul este gol." });

    const deliveryAddr = [
      customer.strada, customer.nr, customer.bloc_ap,
      customer.localitate, customer.judet, customer.cod_postal,
    ].filter(Boolean).join(", ");

    const isEasybox = customer.delivery_method === "easybox";
    const shipping = isEasybox ? 14 : 19;
    const subtotal = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 1), 0);

    const order = {
      source: "ramburs",
      paid: false,
      orderId: "RB-" + Date.now(),
      items: items.map((it) => ({
        name: it.label || "Produs",
        qty: it.qty || 1,
        totalRON: Number(it.price || 0) * Number(it.qty || 1),
      })),
      totalRON: subtotal + shipping,
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
          : deliveryAddr,
      },
    };

    const result = await sendOrderEmail(order);
    if (!result.ok) return res.status(502).json({ error: "Mail provider error" });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[order-notify] Eroare:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
