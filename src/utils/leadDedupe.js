// Helpers to recognise "the same enquiry submitted again".
// Two leads are the same enquiry when their content is identical (after ignoring case and extra spaces)
// AND they come from the same contact (same email, or same phone number ignoring spaces, dashes and +91).

const norm = (v) => String(v ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
export const phoneDigits = (v) => {
  const d = String(v ?? '').replace(/\D/g, '')
  return d.length > 10 ? d.slice(-10) : d // drop country code such as 91
}
const day = (v) => (v ? String(v).slice(0, 10) : '')

// What was asked for (not who asked).
export const contentKey = (r) => JSON.stringify([
  norm(r.need), norm(r.quantity), norm(r.useCase), norm(r.mode), norm(r.budget),
  day(r.requiredBy), Boolean(r.supportRequired), norm(r.additionalRequirements),
])

export function sameContact(a, b) {
  const ea = norm(a.email), eb = norm(b.email)
  if (ea && eb && ea === eb) return true
  const pa = phoneDigits(a.phone), pb = phoneDigits(b.phone)
  return Boolean(pa && pb && pa === pb)
}

export const isSameEnquiry = (a, b) => contentKey(a) === contentKey(b) && sameContact(a, b)

// Runs tasks with the same key one after another, so two identical requests arriving together
// (double click, retry) cannot both pass the "already exists?" check.
const tails = new Map()
export async function withLock(key, task) {
  const previous = tails.get(key) || Promise.resolve()
  let release
  const mine = new Promise((resolve) => { release = resolve })
  const tail = previous.then(() => mine)
  tails.set(key, tail)
  await previous
  try { return await task() } finally {
    release()
    if (tails.get(key) === tail) tails.delete(key)
  }
}
