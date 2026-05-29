// api/session/[id].js — proxy GET a Stripe Checkout Session so the return
// page can confirm payment_status === "paid" without exposing the secret key.

const STRIPE_API = "https://api.stripe.com/v1";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY not configured" });
    return;
  }
  const id = req.query.id;
  if (!/^cs_(test|live)_[A-Za-z0-9_]+$/.test(String(id || ""))) {
    res.status(400).json({ error: "bad session id" });
    return;
  }
  try {
    const r = await fetch(
      `${STRIPE_API}/checkout/sessions/${encodeURIComponent(id)}`,
      { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } },
    );
    const text = await r.text();
    let s;
    try { s = JSON.parse(text); } catch { s = { raw: text }; }
    if (!r.ok) {
      res.status(r.status).json({ error: s.error?.message || text });
      return;
    }
    res.status(200).json({
      id: s.id,
      status: s.status,
      payment_status: s.payment_status,
      amount_total: s.amount_total,
      currency: s.currency,
      customer_email: s.customer_details?.email || s.customer_email,
      payment_intent: s.payment_intent,
      livemode: s.livemode,
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "internal error" });
  }
}
