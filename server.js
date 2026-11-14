import express from 'express';
import crypto from 'crypto';

const {
  PIXEL_ID,
  META_ACCESS_TOKEN,
  META_API_VERSION = 'v21.0',
  ALLOWED_ORIGINS = '',
  TEST_EVENT_CODE = '',
  PORT = 3000,
} = process.env;

if (!PIXEL_ID || !META_ACCESS_TOKEN) {
  console.error('PIXEL_ID dan META_ACCESS_TOKEN wajib diisi');
  process.exit(1);
}

const origins = ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
const ALLOWED_EVENTS = new Set([
  'Purchase', 'Lead', 'InitiateCheckout', 'AddToCart',
  'ViewContent', 'CompleteRegistration', 'AddPaymentInfo',
]);

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '10kb' }));

// ---------- CORS ----------
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ---------- Rate limit sederhana (60 req/menit/IP) ----------
const hits = new Map();
setInterval(() => hits.clear(), 60_000).unref();
app.use('/api', (req, res, next) => {
  const n = (hits.get(req.ip) || 0) + 1;
  hits.set(req.ip, n);
  if (n > 60) return res.status(429).json({ error: 'too_many_requests' });
  next();
});

// ---------- Cegah event_id yang sama terkirim 2x (refresh/retry) ----------
const seen = new Map();
setInterval(() => {
  const cutoff = Date.now() - 48 * 3600_000;
  for (const [k, t] of seen) if (t < cutoff) seen.delete(k);
}, 3600_000).unref();

// ---------- Helper ----------
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const isHashed = (v) => /^[a-f0-9]{64}$/.test(v);

const hashEmail = (e) => {
  if (!e) return null;
  const s = String(e).trim().toLowerCase();
  return isHashed(s) ? s : sha256(s);
};
const hashPhone = (p) => {
  if (!p) return null;
  const s = String(p).trim();
  if (isHashed(s)) return s;
  const digits = s.replace(/\D/g, ''); // wajib sudah pakai kode negara
  return digits ? sha256(digits) : null;
};
const hashText = (t) => (t ? sha256(String(t).trim().toLowerCase()) : null);

const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '' &&
      !(Array.isArray(v) && v.length === 0))
  );

// ---------- Endpoint ----------
app.get('/health', (_, res) => res.json({ ok: true }));

app.post('/api/meta-event', async (req, res) => {
  try {
    const b = req.body || {};

    if (!ALLOWED_EVENTS.has(b.event_name))
      return res.status(400).json({ error: 'invalid_event_name' });
    if (!b.event_id || typeof b.event_id !== 'string' || b.event_id.length > 128)
      return res.status(400).json({ error: 'event_id_required' });

    const key = `${b.event_name}:${b.event_id}`;
    if (seen.has(key)) return res.json({ ok: true, skipped: 'duplicate' });

    const now = Math.floor(Date.now() / 1000);
    let eventTime = Number(b.event_time) || now;
    if (eventTime > now || now - eventTime > 7 * 86400) eventTime = now;

    const custom_data = {};
    if (b.value !== undefined) {
      const v = Number(b.value);
      if (!Number.isFinite(v) || v < 0)
        return res.status(400).json({ error: 'invalid_value' });
      custom_data.value = v;
    }
    if (b.currency) {
      const c = String(b.currency).toUpperCase();
      if (!/^[A-Z]{3}$/.test(c))
        return res.status(400).json({ error: 'invalid_currency' });
      custom_data.currency = c;
    }
    if (b.event_name === 'Purchase' && (custom_data.value === undefined || !custom_data.currency))
      return res.status(400).json({ error: 'purchase_needs_value_and_currency' });
    if (Array.isArray(b.contents)) custom_data.contents = b.contents.slice(0, 50);
    if (b.order_id) custom_data.order_id = String(b.order_id);

    const em = hashEmail(b.email);
    const ph = hashPhone(b.phone);

    const user_data = clean({
      em: em ? [em] : null,
      ph: ph ? [ph] : null,
      fn: hashText(b.first_name) ? [hashText(b.first_name)] : null,
      ln: hashText(b.last_name) ? [hashText(b.last_name)] : null,
      external_id: b.external_id ? [hashText(b.external_id)] : null,
      client_ip_address: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip,
      client_user_agent: req.headers['user-agent'],
      fbp: b.fbp,
      fbc: b.fbc,
    });

    const body = {
      data: [clean({
        event_name: b.event_name,
        event_id: b.event_id,
        event_time: eventTime,
        action_source: 'website',
        event_source_url: b.event_source_url,
        user_data,
        custom_data: clean(custom_data),
      })],
      access_token: META_ACCESS_TOKEN,
    };
    if (TEST_EVENT_CODE) body.test_event_code = TEST_EVENT_CODE;

    const r = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${PIXEL_ID}/events`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    const json = await r.json().catch(() => ({}));

    if (!r.ok) {
      console.error('Meta error:', JSON.stringify(json));
      return res.status(502).json({ error: 'meta_rejected', detail: json.error?.message });
    }

    seen.set(key, Date.now());
    res.json({ ok: true, events_received: json.events_received, fbtrace_id: json.fbtrace_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.use(express.static('public'));
app.listen(PORT, () => console.log(`Meta CAPI server jalan di :${PORT}`));
