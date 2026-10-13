// POST /api/contact — emails a form from the site to Camila through Resend. JSON in, JSON out.
// The body names its kind; every field is a string and must fit its limit:
//   contact     { kind, name, email, reason, message }      reason: collecting | commission | services | press-exhibition | other
//   commission  { kind, name, email, size, budget, concept, timeline, place? }
//   newsletter  { kind, email }
// Optional on all three: page (where the form was), company (the bot trap: filled = dropped quietly).
// Answers 200 { ok: true }, 400 { error: 'Check the … field' | 'Bad request' }, 500 { error: 'Not set up' },
// 502 { error: 'Send failed' }.
// The host must set RESEND_API_KEY, CONTACT_TO and CONTACT_FROM.
// ponytail: no rate limit; add a host firewall rule or a captcha if spam shows up.
// ponytail: a newsletter sign-up is only an email to CONTACT_TO; send it to a list provider when one is chosen.
const LIMITS = {
  contact: { name: 120, email: 200, reason: 40, message: 5000 },
  commission: { name: 120, email: 200, size: 200, budget: 200, concept: 5000, timeline: 200, place: 300 },
  newsletter: { email: 200 },
};
const OPTIONAL = ['place'];
const LONG = ['message', 'concept']; // these keep their line breaks: they only ever reach the body of the email
const REASONS = { collecting: 'Collecting', commission: 'Commission', services: 'Services', 'press-exhibition': 'Press or Exhibition', other: 'Other' };
const SUBJECT = {
  contact: (f) => `Website message from ${f.name} (${REASONS[f.reason]})`,
  commission: (f) => `Commission inquiry from ${f.name}`,
  newsletter: (f) => `Newsletter sign-up: ${f.email}`,
};

const reply = (status, body) => Response.json(body, { status });
const oneLine = (s) => s.replace(/\s+/g, ' ');
const label = (name) => name[0].toUpperCase() + name.slice(1);

export async function POST(request) {
  let data;
  try { data = await request.json(); } catch { return reply(400, { error: 'Bad request' }); }
  if (!data || typeof data !== 'object') return reply(400, { error: 'Bad request' });
  if (data.company) return reply(200, { ok: true }); // honeypot: people never see this field, bots fill it
  if (typeof data.kind !== 'string' || !Object.hasOwn(LIMITS, data.kind)) return reply(400, { error: 'Bad request' });

  const f = {};
  for (const [name, max] of Object.entries(LIMITS[data.kind])) {
    const value = typeof data[name] === 'string' ? data[name].trim() : '';
    if (value.length > max || (!value && !OPTIONAL.includes(name))) return reply(400, { error: `Check the ${name} field` });
    f[name] = LONG.includes(name) ? value : oneLine(value);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return reply(400, { error: 'Check the email field' });
  if ('reason' in f && !Object.hasOwn(REASONS, f.reason)) return reply(400, { error: 'Check the reason field' });

  const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
    console.error('contact: mail settings are missing');
    return reply(500, { error: 'Not set up' });
  }

  const lines = Object.entries(f).filter(([, value]) => value).map(([name, value]) => {
    if (LONG.includes(name)) return `${label(name)}:\n${value}`;
    return `${label(name)}: ${name === 'reason' ? REASONS[value] : value}`;
  });
  if (typeof data.page === 'string' && data.page.trim()) lines.push(`Sent from: ${oneLine(data.page.trim()).slice(0, 200)}`);

  let sent;
  try {
    sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: CONTACT_FROM, to: CONTACT_TO, reply_to: f.email, subject: SUBJECT[data.kind](f), text: lines.join('\n') }),
    });
  } catch (err) {
    console.error('contact: mail service unreachable', err);
    return reply(502, { error: 'Send failed' });
  }
  if (!sent.ok) {
    console.error('contact: send failed', sent.status, await sent.text());
    return reply(502, { error: 'Send failed' });
  }
  return reply(200, { ok: true });
}
