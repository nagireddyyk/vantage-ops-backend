import { Op } from 'sequelize'
import { CATEGORIES, OPTIONS, categoryFields } from '../constants/index.js'
import { Product } from '../models/index.js'
import { AppError } from '../utils/AppError.js'
import { getOr404 } from '../utils/helpers.js'

// Normalizes and validates product specifications for a category.
// Accepts per field either an array ["8 GB","16 GB"] (price adjustment 0)
// or an object {"8 GB":0,"16 GB":3000}. Returns the object form.
export function normalizeSpecifications(category, input) {
  if (input === undefined || input === null || input === '') return {}
  if (typeof input !== 'object' || Array.isArray(input)) throw new AppError(400, 'specifications must be an object')
  const allowedFields = categoryFields(category)
  const out = {}
  for (const [field, raw] of Object.entries(input)) {
    if (!allowedFields.includes(field)) {
      throw new AppError(400, `Unknown specification "${field}" for ${category}. Allowed: ${allowedFields.join(', ')}`)
    }
    let values
    if (Array.isArray(raw)) values = Object.fromEntries(raw.map((v) => [String(v).trim(), 0]))
    else if (raw && typeof raw === 'object') values = raw
    else throw new AppError(400, `specifications.${field} must be an array of values or an object of {value: priceAdjustment}`)
    const normalized = {}
    for (const [value, adj] of Object.entries(values)) {
      const key = value.trim()
      const n = adj === '' || adj === null || adj === undefined ? 0 : Number(adj)
      if (!key) throw new AppError(400, `specifications.${field} has an empty value`)
      if (!Number.isFinite(n)) throw new AppError(400, `specifications.${field}["${key}"] price adjustment must be a number`)
      normalized[key] = n
    }
    if (!Object.keys(normalized).length) throw new AppError(400, `specifications.${field} needs at least one value`)
    out[field] = normalized
  }
  return out
}

const toBool = (v) => v === true || v === 1 || ['true', '1', 'yes'].includes(String(v).toLowerCase())
const pct = (v, name) => {
  if (v === undefined || v === null || v === '') return 3
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) throw new AppError(400, `${name} must be a number >= 0`)
  return n
}


// Validate optional model-specific rates. Null/undefined means this product has no custom rate card.
export function normalizePricingRates(input) {
  if (input === null || input === undefined || input === '') return null
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AppError(400, 'pricingRates must be an object or null')
  const out = { leaseRates: {}, cover: {}, quoteThreshold: null }
  for (const [months, value] of Object.entries(input.leaseRates || {})) {
    if (!['12', '24', '36', '48', '60'].includes(String(months))) throw new AppError(400, `Unsupported lease duration: ${months}`)
    const n = Number(value)
    if (!Number.isFinite(n) || n < 0 || n > 100) throw new AppError(400, `Lease rate for ${months} months must be between 0 and 100`)
    out.leaseRates[months] = n
  }
  for (const key of ['warranty1', 'amc1', 'amc3']) {
    if (input.cover?.[key] === undefined || input.cover?.[key] === null || input.cover?.[key] === '') continue
    const n = Number(input.cover[key])
    if (!Number.isFinite(n) || n < 0 || n > 100) throw new AppError(400, `Cover rate ${key} must be between 0 and 100`)
    out.cover[key] = n
  }
  if (input.quoteThreshold !== undefined && input.quoteThreshold !== null && input.quoteThreshold !== '') {
    const n = Number(input.quoteThreshold)
    if (!Number.isInteger(n) || n < 1 || n > 100000) throw new AppError(400, 'quoteThreshold must be a positive whole number')
    out.quoteThreshold = n
  }
  return out
}

const clean = (b) => {
  if (!b.category?.trim()) throw new AppError(400, 'category is required')
  if (!b.name?.trim()) throw new AppError(400, 'name (model name) is required')
  if (!b.brand?.toString().trim() || b.brand.toString().trim() === 'Unspecified') throw new AppError(400, 'brand is required')
  if (b.basePrice === undefined || b.basePrice === null || b.basePrice === '' || !Number.isFinite(Number(b.basePrice)) || Number(b.basePrice) <= 0) {
    throw new AppError(400, 'basePrice (buy price) greater than 0 is required')
  }
  if (b.available === undefined || b.available === null || b.available === '') throw new AppError(400, 'available (availability) is required')
  const rawCategory = String(b.category ?? '').trim()
  if (!rawCategory) throw new AppError(400, 'category is required')
  // Excel edits often change capitalization or add extra spaces. Resolve those
  // to the canonical category value used by the model enum.
  const category = CATEGORIES.find(
    (allowed) => allowed.toLowerCase() === rawCategory.toLowerCase()
  )
  if (!category) {
    throw new AppError(
      400,
      `Invalid category "${rawCategory}". Choose one of: ${CATEGORIES.join(', ')}`
    )
  }
  if (b.image && b.image.length > 400000) throw new AppError(400, 'Image too large (max ~300 KB)')
  return {
    name: b.name.trim(),
    modelNumber: b.modelNumber?.toString().trim() || null,
    brand: b.brand.toString().trim(),
    category,
    basePrice: Number(b.basePrice),
    rentPct: pct(b.rentPct, 'rentPct'),
    leasePct: pct(b.leasePct, 'leasePct'),
    available: toBool(b.available),
    specifications: normalizeSpecifications(category, b.specifications),
    ...(Object.prototype.hasOwnProperty.call(b, 'pricingRates') && { pricingRates: normalizePricingRates(b.pricingRates) }),
    ...(b.image && { image: b.image }),
  }
}

export function list({ q, category, brand, minPrice, maxPrice, includeUnavailable = 'false' }) {
  const where = {}
  if (includeUnavailable !== 'true') where.available = true
  if (category) where.category = category
  if (brand) where.brand = brand
  const price = {}
  if (minPrice !== undefined && minPrice !== '' && Number.isFinite(Number(minPrice))) price[Op.gte] = Number(minPrice)
  if (maxPrice !== undefined && maxPrice !== '' && Number.isFinite(Number(maxPrice))) price[Op.lte] = Number(maxPrice)
  if (Reflect.ownKeys(price).length) where.basePrice = price
  if (q) where[Op.or] = [
    { name: { [Op.like]: `%${q}%` } },
    { brand: { [Op.like]: `%${q}%` } },
    { modelNumber: { [Op.like]: `%${q}%` } },
  ]
  return Product.findAll({ where, order: [['id', 'ASC']] })
}

// Category list with the configurable fields (and default values) each one supports.
export const categories = () => CATEGORIES.map((name) => ({
  name,
  fields: Object.fromEntries(Object.entries(OPTIONS[name] || {}).map(([field, values]) => [field, Object.keys(values)])),
}))

export const get = (id) => getOr404(Product, { id }, 'Product')
export async function create(body) {
  const data = clean(body);

  data.modelNumber = null;

  const product = await Product.create(data);

  return product.update({
    modelNumber: `VP-${String(product.id).padStart(4, '0')}`,
  });
}
export const update = async (id, body) => (await get(id)).update(clean(body))
export const remove = async (id) => { await get(id); await Product.destroy({ where: { id } }) }

// Valid rows are saved; invalid rows are returned with row numbers so an admin can fix the sheet.
export async function importMany(rows, { updateExisting = true } = {}) {
  const summary = { total: rows.length, created: 0, updated: 0, failed: 0, errors: [] }
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    try {
      const data = clean(row)
      // A product is the same only when brand + model number + category all match.
      // paranoid:false also finds soft-deleted rows, which would otherwise hit the unique index.
      const existing = data.modelNumber
        ? await Product.findOne({ where: { brand: data.brand, modelNumber: data.modelNumber, category: data.category }, paranoid: false })
        : null
      if (existing && updateExisting) {
        if (existing.deletedAt) await existing.restore()
        await existing.update(data)
        summary.updated += 1
      }
      else if (existing) throw new Error(`${data.brand} / ${data.modelNumber} / ${data.category} already exists`)
      else {
        if (!data.modelNumber) {
          data.modelNumber = null
          const created = await Product.create(data)
          await created.update({ modelNumber: `VP-${String(created.id).padStart(4, '0')}` })
        } else await Product.create(data)
        summary.created += 1
      }
    } catch (error) {
      summary.failed += 1

      // Sequelize often reports only "Validation error" at the top level.
      // Return the field-level reasons so the spreadsheet can be corrected.
      const validationItems = [
        ...(Array.isArray(error?.errors) ? error.errors : []),
        ...(Array.isArray(error?.validationErrors) ? error.validationErrors : []),
      ]

      const details = validationItems
        .map((item) => {
          const field = item.path || item.validatorKey || item.field || 'field'
          const message = item.message || item.validatorKey || item.type || 'is invalid'
          return `${field}: ${message}`
        })
        .filter(Boolean)

      // Log the full server-side cause for debugging while returning a useful,
      // non-SQL-leaking message to the browser.
      console.error('[products/import] Row failed', {
        row: row?.__sourceRow || i + 2,
        name: row?.name || '',
        errorName: error?.name,
        message: error?.message,
        fields: error?.fields,
        parentMessage: error?.parent?.message,
        originalMessage: error?.original?.message,
        validation: details,
      })

      let message = details.length
        ? details.join('; ')
        : error?.parent?.message ||
          error?.original?.message ||
          error?.message ||
          'Invalid row'

      if (error?.name === 'SequelizeUniqueConstraintError') {
        const fields = Object.keys(error.fields || {})
        message = fields.length
          ? `Duplicate value for ${fields.join(', ')}. The same brand + model number + category already exists; enable update existing.`
          : 'Duplicate product. Check brand, model number and category.'
      }

      summary.errors.push({
        row: row?.__sourceRow || i + 2,
        name: row?.name || '',
        error: message,
      })
    }
  }
  return summary
}

// Admin: change buy price and rent / lease rates only.
export async function updatePricing(id, body) {
  const { basePrice, rentPct, leasePct, pricingRates } = body
  const p = await get(id)
  for (const [k, v] of Object.entries({ basePrice, rentPct, leasePct })) {
    if (v !== undefined && v !== '' && (!Number.isFinite(Number(v)) || Number(v) < 0 || (k === 'basePrice' && Number(v) <= 0))) {
      throw new AppError(400, `${k} has an invalid value`)
    }
  }
  return p.update({
    ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
    ...(rentPct !== undefined && { rentPct: Number(rentPct) }),
    ...(leasePct !== undefined && { leasePct: Number(leasePct) }),
    ...(Object.prototype.hasOwnProperty.call(body, 'pricingRates') && { pricingRates: normalizePricingRates(pricingRates) }),
  })
}