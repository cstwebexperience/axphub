/**
 * Modul comun — construiește și trimite emailul de comandă prin Resend.
 * Folosit de: api/stripe-webhook.js (card, la plată reușită) și api/order-notify.js (ramburs).
 *
 * order = {
 *   source:   "card" | "ramburs",
 *   paid:     boolean,
 *   orderId:  string,
 *   items:    [{ name, qty, totalRON }],   // totalRON = preț total linie în lei
 *   totalRON: number,                       // total comandă în lei
 *   customer: { nume, telefon, email, observatii },
 *   delivery: { method: "easybox" | "courier", text }
 * }
 */

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const fmtRON = (lei) =>
  (Number(lei || 0)).toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " RON";

async function sendOrderEmail(order) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[order-mail] RESEND_API_KEY lipsește — emailul nu a fost trimis.");
    return { ok: false, reason: "no_api_key" };
  }

  const FROM = process.env.MAIL_FROM || "AXP Hub Comenzi <onboarding@resend.dev>";
  const TO = (process.env.MAIL_TO || "axpcontact00293@gmail.com")
    .split(",").map((s) => s.trim()).filter(Boolean);

  const c = order.customer || {};
  const d = order.delivery || {};
  const isEasybox = d.method === "easybox";

  const statusBadge = order.paid
    ? `<span style="color:#16a34a;font-weight:700">PLATĂ CONFIRMATĂ (card)</span>`
    : `<span style="color:#d4711a;font-weight:700">RAMBURS — de încasat la livrare</span>`;

  const rows = (order.items || [])
    .map(
      (it) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee">${esc(it.name)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center">${esc(it.qty)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${fmtRON(it.totalRON)}</td>
        </tr>`
    )
    .join("");

  const livrareBlock = isEasybox
    ? `<tr><td style="padding:6px 0;color:#666;width:140px">Metodă livrare</td><td style="padding:6px 0;font-weight:600">📦 EasyBox Sameday</td></tr>
       <tr><td style="padding:6px 0;color:#666">Locker</td><td style="padding:6px 0">${esc(d.text || "")}</td></tr>`
    : `<tr><td style="padding:6px 0;color:#666;width:140px">Metodă livrare</td><td style="padding:6px 0;font-weight:600">🚚 Curier Sameday</td></tr>
       <tr><td style="padding:6px 0;color:#666">Adresă</td><td style="padding:6px 0">${esc(d.text || "")}</td></tr>`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#f6f7f9;padding:28px;border-radius:14px;color:#1a1a1a">
      <h2 style="margin:0 0 6px;color:#111">🛒 Comandă nouă — AXP Hub</h2>
      <p style="margin:0 0 22px">${statusBadge} · ${fmtRON(order.totalRON)}</p>

      <h3 style="margin:0 0 8px;font-size:15px;color:#333">Produse de pregătit</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #eee">
        <thead>
          <tr style="background:#fafafa">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;border-bottom:1px solid #eee">Produs</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;border-bottom:1px solid #eee">Cant.</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;border-bottom:1px solid #eee">Total</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="3" style="padding:12px;color:#999">(fără produse)</td></tr>`}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px;text-align:right;font-weight:700">Total comandă</td>
            <td style="padding:12px;text-align:right;font-weight:700;white-space:nowrap">${fmtRON(order.totalRON)}</td>
          </tr>
        </tfoot>
      </table>

      <h3 style="margin:22px 0 8px;font-size:15px;color:#333">Livrare</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;border:1px solid #eee;padding:8px 14px">
        ${livrareBlock}
      </table>

      <h3 style="margin:22px 0 8px;font-size:15px;color:#333">Client</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;border:1px solid #eee;padding:8px 14px">
        <tr><td style="padding:6px 0;color:#666;width:140px">Nume</td><td style="padding:6px 0;font-weight:600">${esc(c.nume || "—")}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Telefon</td><td style="padding:6px 0"><a href="tel:${esc(c.telefon)}">${esc(c.telefon || "—")}</a></td></tr>
        <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0"><a href="mailto:${esc(c.email)}">${esc(c.email || "—")}</a></td></tr>
        ${c.observatii ? `<tr><td style="padding:6px 0;color:#666;vertical-align:top">Observații</td><td style="padding:6px 0">${esc(c.observatii).replace(/\n/g, "<br>")}</td></tr>` : ""}
      </table>

      <p style="margin-top:22px;font-size:12px;color:#999">${order.orderId ? "Ref: " + esc(order.orderId) + " · " : ""}axphub.ro</p>
    </div>`;

  const subject = `🛒 Comandă ${order.paid ? "(card)" : "(ramburs)"} AXP Hub — ${fmtRON(order.totalRON)} — ${c.nume || ""}`.trim();

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: TO,
      reply_to: c.email || undefined,
      subject,
      html,
    }),
  });

  if (!r.ok) {
    const detail = await r.text();
    console.error("[order-mail] Resend error:", r.status, detail);
    return { ok: false, reason: "resend_error", detail };
  }
  console.log("[order-mail] Email comandă trimis către:", TO.join(", "));
  return { ok: true };
}

module.exports = { sendOrderEmail, fmtRON, esc };
