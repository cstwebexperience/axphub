/**
 * Notificare recenzie nouă — trimite email la magazin când un client lasă o recenzie,
 * ca să poată fi moderată/adăugată. Nu publică automat recenzia.
 */
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
    const r = body.review || {};
    const product = body.product || "—";

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(200).json({ success: true, note: "no_mail" });

    const FROM = process.env.MAIL_FROM || "AXP Hub <onboarding@resend.dev>";
    const TO = (process.env.MAIL_TO || "axpcontact00293@gmail.com").split(",").map(s => s.trim()).filter(Boolean);
    const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#f6f7f9;padding:24px;border-radius:12px">
        <h2 style="margin:0 0 16px">⭐ Recenzie nouă — de moderat</h2>
        <p style="margin:4px 0"><b>Produs:</b> ${esc(product)}</p>
        <p style="margin:4px 0"><b>Nume:</b> ${esc(r.name)}</p>
        <p style="margin:4px 0"><b>Notă:</b> ${esc(r.stars)} / 5</p>
        <div style="margin-top:12px;padding:14px;background:#fff;border-radius:8px;border:1px solid #eee">
          ${esc(r.text).replace(/\n/g, "<br>")}
        </div>
        <p style="margin-top:16px;font-size:12px;color:#999">Adaug-o manual în lista produsului dacă e ok. axphub.ro</p>
      </div>`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: TO, subject: `⭐ Recenzie nouă — ${product}`, html }),
    });
    if (!resp.ok) console.error("[review] Resend error:", resp.status, await resp.text());
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[review] Eroare:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
