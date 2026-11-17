import { BRAND_FIELD, MODES, OPTIONS, REQUIREMENT_FIELDS } from '../constants/index.js'
import { Product } from '../models/index.js'
import { AppError } from '../utils/AppError.js'
import { oneOf } from '../utils/helpers.js'

// Choices a customer may pick for one field of a product:
// the product's own specifications win, otherwise the category defaults apply.
export function effectiveOptions(product) {
  const defaults = OPTIONS[product.category] || {}
  const specs = product.specifications || {}
  const result = {}
  for (const [field, values] of Object.entries(defaults)) {
    if (specs[field] && Object.keys(specs[field]).length) result[field] = { values: specs[field], pinned: true }
    else if (field === BRAND_FIELD && product.brand && product.brand !== 'Unspecified') {
      result[field] = { values: { [product.brand]: 0 }, pinned: true }
    } else result[field] = { values, pinned: false }
  }
  return result
}

export const LEASE_TENURES = [12, 24, 36, 48, 60]
// Customer cover-plan id -> key stored in product.pricingRates.cover (admin screen: 1 year / 2 years / 3 years).
export const COVER_PLANS = { noAmc: null, '1year': 'warranty1', '2years': 'amc1', '3years': 'amc3' }
// Used only when the admin has not saved a rate for that plan/tenure on the model.
export const DEFAULT_COVER_PCT = { warranty1: 5, amc1: 8, amc3: 20 }

const pctOrNull = (v) => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))

// Monthly lease % for a tenure: the admin's rate for that model + tenure, else the model's default leasePct (3).
export function leasePctFor(product, leaseMonths) {
  const custom = pctOrNull(product.pricingRates?.leaseRates?.[String(leaseMonths)])
  if (custom !== null) return { pct: custom, custom: true }
  return { pct: Number(product.leasePct ?? 3), custom: false }
}

// Cover-plan % of device price: the admin's rate for that model, else the standard default.
export function coverPctFor(product, coverPlan) {
  const key = COVER_PLANS[coverPlan]
  if (!key) return 0
  const custom = pctOrNull(product.pricingRates?.cover?.[key])
  return custom !== null ? custom : DEFAULT_COVER_PCT[key]
}

// Prices one configured product line. Always computed server-side.
export async function priceLine({ productId, options = {}, mode = 'buy', qty = 1, leaseMonths, coverPlan = 'noAmc' }) {
  const product = await Product.findByPk(productId)
  if (!product || !product.available) throw new AppError(404, 'Product is unavailable')
  oneOf(mode, MODES, 'mode')
  qty = Number(qty)
  if (!Number.isInteger(qty) || qty < 1 || qty > 500) throw new AppError(400, 'qty must be 1–500')

  const modeLabel = mode[0].toUpperCase() + mode.slice(1)
  const chosen = {}
  let unit = Number(product.basePrice)
  for (const [name, { values, pinned }] of Object.entries(effectiveOptions(product))) {
    let v = options[name]
    // Requirement (Buy/Lease/Rent) follows the quote mode instead of being asked twice.
    if (REQUIREMENT_FIELDS.includes(name) && modeLabel in values) v = modeLabel
    // Unselected fields are skipped unless the product pins them (then the first value is the base config).
    if (v === undefined || v === null || v === '') {
      if (!pinned) continue
      v = Object.keys(values)[0]
    }
    if (!Object.hasOwn(values, v)) throw new AppError(400, `Invalid ${name}: ${v}`)
    chosen[name] = v
    unit += Number(values[v]) || 0
  }

  // Lease: monthly rate depends on the tenure the customer picked.
  const months = leaseMonths === undefined || leaseMonths === null || leaseMonths === '' ? 12 : Number(leaseMonths)
  if (mode === 'lease' && !LEASE_TENURES.includes(months)) throw new AppError(400, `leaseMonths must be one of: ${LEASE_TENURES.join(', ')}`)
  const lease = leasePctFor(product, months)

  // Cover plan: % of the device (buy) price, added once per unit.
  const coverKey = String(coverPlan || 'noAmc')
  if (!Object.hasOwn(COVER_PLANS, coverKey)) throw new AppError(400, `coverPlan must be one of: ${Object.keys(COVER_PLANS).join(', ')}`)
  const coverPct = coverPctFor(product, coverKey)
  const coverUnit = (unit * coverPct) / 100

  const prices = { buy: unit, rent: (unit * product.rentPct) / 100, lease: (unit * lease.pct) / 100 }
  const detail = Object.values(chosen).join(', ')
  return {
    productId: product.id, mode, qty, options: chosen, prices,
    leaseMonths: mode === 'lease' ? months : null,
    leasePct: mode === 'lease' ? lease.pct : null,
    coverPlan: coverKey, coverPlanPct: coverPct, coverUnit, coverAmount: coverUnit * qty,
    baseAmount: prices[mode] * qty,
    amount: prices[mode] * qty + coverUnit * qty,
    item: (detail ? `${product.name} (${detail})` : product.name).slice(0, 500),
  }
}
