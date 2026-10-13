// What one reviewer wrote, as plain text. Used by "Copy all my notes" on the review page and by notes.html.
export const MARKS = { like: 'I like it', no: 'Not for me' };
export const PLANS = { favorite: 'Go with my favorite', mix: 'Mix pieces from several' };
export const label = (option) => `Option ${option.n} · ${option.name}`;

// doc: { who, notes, savedAt?, done? } as the notes function keeps it · options: the list from options.json
export function summarize({ who, notes, savedAt, done }, options) {
  const threads = notes.options ?? {};
  // every option in the list, then anything written about a number that is no longer in it
  const all = [...options, ...Object.keys(threads).filter((n) => !options.some((o) => o.n === Number(n))).map((n) => ({ n: Number(n), name: 'no longer in the list' }))];
  const favorite = all.find((o) => o.n === notes.favorite);
  const lines = [`Website options: notes from ${who}`];
  if (savedAt) lines.push(`Saved ${new Date(savedAt).toLocaleString()} · ${done ? 'sent with the Send button' : 'not sent yet (still writing)'}`);
  lines.push('', `Favorite: ${favorite ? label(favorite) : 'none yet'}`, `Plan: ${PLANS[notes.plan] ?? 'not chosen yet'}`);
  if (notes.overall?.trim()) lines.push('How to move forward:', notes.overall.trim());
  for (const option of all) {
    const { mark, messages = [] } = threads[option.n] ?? {};
    lines.push('', `${label(option)}: ${option === favorite ? 'Favorite' : MARKS[mark] ?? 'no mark'}`);
    for (const message of messages) lines.push(`  - ${message.text.trim().replace(/\n/g, '\n    ')}`);
  }
  return lines.join('\n');
}
