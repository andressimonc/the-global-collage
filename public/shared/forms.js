// Forms for all three sites: the contact form, the commission inquiry, every newsletter field.
// While SITE.formsLive is false (../config.js) a form validates and says thank you but sends NOTHING.
//
//   import { wireForm, prefillFromQuery } from '../shared/forms.js';
//
// EXPORTS
//   wireForm(form, { kind, onSuccess, onError } = {})   -> nothing. Call once per <form>; a second call on
//                the same form does nothing (so a site-wide script and a page script cannot send it twice).
//     kind       'contact' | 'commission' | 'newsletter' (required; throws on anything else)
//     onSuccess  optional, called with { kind, message, data } after the thank-you is on the page
//     onError    optional, called with { kind, message, field }. field is the first bad element when
//                the form did not validate, null when sending failed.
//   prefillFromQuery(form)   -> nothing. Sets <select name="reason"> from ?reason= in the address
//                (collecting | commission | services | press-exhibition | other). Unknown values are ignored.
//
// WHAT wireForm DOES TO YOUR FORM
//   - Turns off the browser's own bubbles (novalidate) and checks every `required` field and every email
//     field itself. Each bad field gets aria-invalid="true". The first one gets focus and a message in a
//     <span class="form-error"> placed directly after it. Both are cleared as soon as the visitor types there.
//   - Disables the submit button and sets aria-busy on the form while sending.
//   - Writes the outcome into <p class="form-status" aria-live="polite"> inside the form. It uses yours if
//     the form has one, else appends one. data-state on it is "sending", "success" or "error" (else empty).
//   - STYLE BOTH MESSAGES like this, or a one-row form (every newsletter field) breaks: the error lands
//     between the field and the button and pushes the button onto its own line.
//       .form-error, .form-status { display: block; order: 1; flex-basis: 100%; grid-column: 1 / -1; margin: 0; }
//       .form-status:empty { display: none; }
//     order: 1 moves the message below the field-and-button row, in a flex row and in a grid alike;
//     flex-basis and grid-column give it the full width there; margin: 0 drops the <p>'s own margins.
//   - Adds an invisible bot trap, <input name="company">, unless the form already has one.
//   - Sends every named field as one flat object, plus { kind, page: location.pathname }. On success
//     the form is reset.
//
// FIELD NAMES the function behind the forms expects (api/contact.js; longer text is refused)
//   contact      name (120)  email (200)  reason (one of the five values above)  message (5000)
//   commission   name (120)  email (200)  size (200)  budget (200)  concept (5000)  timeline (200)
//                place (300, optional)
//   newsletter   email (200)
//
// EXAMPLE
//   <form id="contact">
//     <label>Name <input name="name" autocomplete="name" required></label>
//     <label>Email <input name="email" type="email" autocomplete="email" required></label>
//     <label>Reason <select name="reason" required><option value="collecting">Collecting</option>…</select></label>
//     <label>Message <textarea name="message" required></textarea></label>
//     <button type="submit">Send</button>
//   </form>
//   const form = document.querySelector('#contact');
//   prefillFromQuery(form);
//   wireForm(form, { kind: 'contact' });
import { SITE } from './config.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // the same check api/contact.js makes
const THANKS = {
  contact: 'Thank you. I read every message myself.',
  commission: 'Thank you. I will send a direction and a quote.',
  newsletter: 'You are on the list.',
};
const PREVIEW_NOTE = ' (Preview: nothing was sent.)';
const FAILED = 'That did not send. Please try again, or email theglobalcollage@gmail.com.';
let forms = 0;

function problem(field) {
  const value = typeof field.value === 'string' ? field.value.trim() : '';
  const toggle = field.type === 'checkbox' || field.type === 'radio';
  if (field.required && (toggle ? field.validity.valueMissing : !value)) return field.tagName === 'SELECT' ? 'Please choose one.' : 'Please fill this in.';
  if (value && (field.type === 'email' || field.name === 'email') && !EMAIL.test(value)) return 'Please enter a valid email address.';
  return null;
}

// Resolves to null when it went through, or to a plain message for the visitor when it did not.
async function send(data) {
  if (!SITE.formsLive) {
    await new Promise((r) => setTimeout(r, 400)); // preview: nothing leaves the page
    return null;
  }
  try {
    const res = await fetch(SITE.formsEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) return null;
    const detail = res.status === 400 ? (await res.json().catch(() => null))?.error : null;
    return detail ? `${detail}.` : FAILED;
  } catch {
    return FAILED;
  }
}

export function wireForm(form, { kind, onSuccess, onError } = {}) {
  if (!THANKS[kind]) throw new Error('wireForm: kind must be "contact", "commission" or "newsletter"');
  if (form.dataset.tgcWired) return; // wired already: a second listener would send every message twice
  form.dataset.tgcWired = kind;
  form.noValidate = true;

  if (!form.elements.company) {
    const trap = document.createElement('input');
    Object.assign(trap, { type: 'text', name: 'company', tabIndex: -1, autocomplete: 'off' });
    trap.style.display = 'none'; // people never see it, and a field that is not displayed is skipped by browser autofill; bots fill it
    form.append(trap);
  }

  let status = form.querySelector('.form-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'form-status';
    form.append(status);
  }
  if (!status.hasAttribute('aria-live')) status.setAttribute('aria-live', 'polite');
  const say = (text, state) => { status.textContent = text; status.dataset.state = state; };

  const error = document.createElement('span'); // a span is valid inside a <label> that wraps its field
  error.className = 'form-error';
  error.id = `form-error-${++forms}`;
  const described = (field) => (field.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);

  function unmark(field) {
    field.removeAttribute('aria-invalid');
    const ids = described(field);
    if (!ids.includes(error.id)) return;
    error.remove();
    const rest = ids.filter((id) => id !== error.id);
    if (rest.length) field.setAttribute('aria-describedby', rest.join(' '));
    else field.removeAttribute('aria-describedby');
  }

  form.addEventListener('input', (event) => {
    if (event.target.hasAttribute?.('aria-invalid')) unmark(event.target);
  });

  let sending = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;

    const fields = [...form.elements].filter((el) => el.willValidate);
    fields.forEach(unmark);
    const bad = fields.filter(problem);
    if (bad.length) {
      for (const field of bad) field.setAttribute('aria-invalid', 'true');
      const [first] = bad;
      error.textContent = problem(first);
      first.after(error);
      first.setAttribute('aria-describedby', [...described(first), error.id].join(' '));
      first.focus();
      say('', '');
      onError?.({ kind, message: error.textContent, field: first });
      return;
    }

    const data = { ...Object.fromEntries(new FormData(form)), kind, page: location.pathname };
    const button = event.submitter ?? form.querySelector('button[type="submit"], button:not([type]), input[type="submit"]');
    sending = true;
    if (button) button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    say('', 'sending');

    const failure = await send(data);

    sending = false;
    if (button) button.disabled = false;
    form.removeAttribute('aria-busy');
    if (failure) {
      say(failure, 'error');
      onError?.({ kind, message: failure, field: null });
      return;
    }
    const message = THANKS[kind] + (SITE.formsLive ? '' : PREVIEW_NOTE);
    form.reset();
    say(message, 'success');
    onSuccess?.({ kind, message, data });
  });
}

export function prefillFromQuery(form) {
  const select = form.querySelector('select[name="reason"]');
  const reason = new URLSearchParams(location.search).get('reason');
  if (select && [...select.options].some((option) => option.value === reason)) select.value = reason;
}
