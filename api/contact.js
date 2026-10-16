// POST /api/contact — emails a form from the site to Camila through FormSubmit. JSON in, JSON out.
// The body names its kind; every field is a string and must fit its limit:
//   contact     { kind, name, email, reason, message }      reason: collecting | commission | services | press-exhibition | other
//   commission  { kind, name, email, size, budget, concept, timeline, place? }
//   newsletter  { kind, email }
// Optional on all three: page (where the form was), company (the bot trap: filled = dropped quietly).
// Answers 200 { ok: true }, 400 { error: 'Check the … field' | 'Bad request' }, 502 { error: 'Send failed' }.
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

  const lines = Object.entries(f).filter(([, value]) => value).map(([name, value]) => {
    if (LONG.includes(name)) return `${label(name)}:\n${value}`;
    return `${label(name)}: ${name === 'reason' ? REASONS[value] : value}`;
  });
  if (typeof data.page === 'string' && data.page.trim()) lines.push(`Sent from: ${oneLine(data.page.trim()).slice(0, 200)}`);

  // FormSubmit sends it to her inbox: free, no account, no key. Nothing arrives until she clicks "Activate" in
  // the one email FormSubmit sends her after the first message from the live site. FormSubmit knows the site by
  // its address (the Referer). CONTACT_TO on the host overrides her address.
  const to = process.env.CONTACT_TO || 'theglobalcollage@gmail.com'; // her public address, printed in every footer
  let sent, answer;
  try {
    sent = await fetch(`https://formsubmit.co/ajax/${to}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Referer: new URL(request.url).origin + '/' },
      body: JSON.stringify({ _subject: SUBJECT[data.kind](f), _replyto: f.email, _template: 'box', message: lines.join('\n') }),
    });
    answer = await sent.json().catch(() => null);
  } catch (err) {
    console.error('contact: mail service unreachable', err);
    return reply(502, { error: 'Send failed' });
  }
  // its answer is { success: "true" | "false", message }; "false" before she has activated the form
  if (!sent.ok || String(answer?.success) !== 'true') {
    console.error('contact: send failed', sent.status, answer?.message ?? '');
    return reply(502, { error: 'Send failed' });
  }
  return reply(200, { ok: true });
}
