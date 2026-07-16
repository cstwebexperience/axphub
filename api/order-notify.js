/**
 * Trimite emailuri de comandă prin RESEND (server-side, automat, fără activare).
 * Model ca allinmediafactory/api/contact.js.
 * - Owner (axpcontact00293) primește TOATE detaliile: nume, telefon, adresă/EasyBox, produse.
 * - Clientul primește confirmare (noreply) cu ce a cumpărat + „ajunge în câteva zile".
 * Se apelează la orice comandă (card, după plată, sau ramburs, la plasare).
 */
const PRICES = { "Addicted": 69, "Dizzy": 79, "Obsession": 89, "Pachet Full": 197 };
const SHIPPING = { courier: 19, easybox: 14 };

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ron = (n) => Number(n || 0).toFixed(2).replace(".", ",") + " RON";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Email neconfigurat (lipsește RESEND_API_KEY)." });

  const OWNER = (process.env.MAIL_TO || "axpcontact00293@gmail.com").split(",").map(s => s.trim()).filter(Boolean);
  const FROM = process.env.MAIL_FROM || "AXP Hub <onboarding@resend.dev>";

  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const items = (body && body.items) || [];
    const customer = (body && body.customer) || {};
    const paid = !!(body && body.paid);
    if (!items.length) return res.status(400).json({ error: "Coșul este gol." });

    const isEasybox = customer.delivery_method === "easybox";
    const shipping = isEasybox ? SHIPPING.easybox : SHIPPING.courier;
    let subtotal = 0;
    const rows = items.map((it) => {
      const unit = PRICES[it.label] != null ? PRICES[it.label] : Number(it.price) || 0;
      const qty = Math.max(1, Number(it.qty) || 1);
      const line = unit * qty;
      subtotal += line;
      return { name: it.label, qty, line };
    });
    const total = subtotal + shipping;

    const nume = `${customer.nume || ""} ${customer.prenume || ""}`.trim();
    const livrare = isEasybox
      ? `EasyBox: ${customer.locker_name || ""} — ${customer.locker_addr || ""} (ID: ${customer.locker_id || ""})`
      : [customer.adresa, customer.localitate, customer.judet, customer.cod_postal].filter(Boolean).join(", ");
    const ref = "AXP-" + Date.now().toString().slice(-8);

    const rowsHtml = rows.map(r => `
      <tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${esc(r.name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${r.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${ron(r.line)}</td></tr>`).join("");

    const logo = "https://axphub.ro/assets/images/logo-black.png";

    const table = `
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden">
        <thead><tr style="background:#fafafa">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888">Produs</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#888">Cant.</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#888">Total</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot>
          <tr><td colspan="2" style="padding:8px 12px;text-align:right;color:#666">Livrare</td><td style="padding:8px 12px;text-align:right">${ron(shipping)}</td></tr>
          <tr><td colspan="2" style="padding:10px 12px;text-align:right;font-weight:700">TOTAL</td><td style="padding:10px 12px;text-align:right;font-weight:700">${ron(total)}</td></tr>
        </tfoot>
      </table>`;

    // ─── Email către CLIENT (confirmare) ───
    const customerHtml = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f6f7f9;padding:28px;border-radius:14px;color:#1a1a1a">
        <img src="${logo}" alt="AXP Hub" style="height:38px;margin-bottom:20px">
        <h2 style="margin:0 0 6px">Mulțumim că ai cumpărat produsele AXP Hub! 🖤</h2>
        <p style="margin:0 0 18px;color:#555">Comanda ta a fost înregistrată cu succes și <strong>va ajunge în 1–4 zile lucrătoare</strong> prin Sameday.</p>
        ${table}
        <p style="margin:18px 0 4px"><strong>Livrare:</strong> ${esc(livrare)}</p>
        <p style="margin:4px 0"><strong>Plată:</strong> ${paid ? "Card (online)" : "Ramburs la livrare"}</p>
        <p style="margin:18px 0 0;font-size:13px;color:#888">Ai întrebări? WhatsApp: 0772 153 764 · axphub.ro<br>Acesta este un email automat de confirmare — te rugăm să nu răspunzi.</p>
      </div>`;

    // ─── Email către MAGAZIN (owner) cu toate detaliile ───
    const ownerHtml = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f6f7f9;padding:24px;border-radius:12px">
        <h2 style="margin:0 0 4px">🛒 Comandă nouă — ${paid ? "CARD (plătit)" : "RAMBURS"}</h2>
        <p style="margin:0 0 16px;color:#16a34a;font-weight:700">${ron(total)} · Ref ${ref}</p>
        ${table}
        <h3 style="margin:18px 0 6px;font-size:15px">Unde se trimite</h3>
        <p style="margin:4px 0"><b>Nume:</b> ${esc(nume)}</p>
        <p style="margin:4px 0"><b>Telefon:</b> ${esc(customer.telefon || "-")}</p>
        <p style="margin:4px 0"><b>Email:</b> ${esc(customer.email || "-")}</p>
        <p style="margin:4px 0"><b>Livrare:</b> ${esc(livrare)}</p>
        ${customer.obs ? `<p style="margin:4px 0"><b>Observații:</b> ${esc(customer.obs)}</p>` : ""}
      </div>`;

    const send = (to, subject, html, replyTo) => fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html, reply_to: replyTo || undefined }),
    }).then(async r => { if (!r.ok) console.error("[resend]", to, r.status, await r.text()); return r.ok; });

    // Owner mereu; client dacă a lăsat email
    const results = await Promise.all([
      send(OWNER, `🛒 Comandă nouă AXP Hub — ${ron(total)} — ${nume}`, ownerHtml, customer.email),
      customer.email ? send([customer.email], "Comanda ta AXP Hub — confirmare ✓", customerHtml, OWNER[0]) : Promise.resolve(true),
    ]);

    return res.status(200).json({ success: true, owner: results[0], customer: results[1] });
  } catch (err) {
    console.error("[order-notify] Eroare:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
