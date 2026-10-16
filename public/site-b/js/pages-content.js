// The Global Collage — Site B, the content pages: the commission inquiry and the contact form.
// Everything else on these pages (arrivals, the planet and menu, the cart, newsletter fields) is js/site.js.
// In preview the forms validate and say thank you but send nothing (shared/forms.js).
import { wireForm, prefillFromQuery } from '../../shared/forms.js';

for (const form of document.querySelectorAll('form[data-form="contact"], form[data-form="commission"]')) {
  if (form.dataset.form === 'contact') prefillFromQuery(form);   // ?reason=services and the like
  wireForm(form, { kind: form.dataset.form });
}
