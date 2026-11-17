import * as products from '../services/product.service.js'
import { priceLine } from '../services/pricing.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import XLSX from 'xlsx'
import { BRAND_FIELD, REQUIREMENT_FIELDS, categoryFields } from '../constants/index.js'

const headerAliases = {
  name: ['name', 'product', 'product name', 'productname', 'item', 'item name'],
  modelNumber: ['modelnumber', 'model number', 'sku', 'part number', 'partnumber', 'product code'],
  brand: ['brand', 'manufacturer', 'make'],
  category: ['category', 'product category', 'type'],
  basePrice: ['baseprice', 'base price', 'price', 'unit price', 'buy price', 'purchase price', 'mrp'],
  rentPct: ['rentpct', 'rent pct', 'rent percent', 'rental percent'],
  leasePct: ['leasepct', 'lease pct', 'lease percent'],
  available: ['available', 'active', 'enabled', 'availability'],
  specifications: ['specifications', 'specification', 'specs', 'attributes'],
  image: ['image', 'image url', 'imageurl', 'photo'],
}
const normalizeHeader = (value) => String(value ?? '').trim().toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ')
const compactHeader = (value) => normalizeHeader(value).replace(/\s/g, '')

// Spec columns: one column per category field, e.g. "RAM" = "8 GB; 16 GB=3000; 32 GB=8000".
// Values are separated by ";" or "|" (commas appear inside values such as "1,000–5,000");
// "=price" is an optional price adjustment. A "spec:" prefix ("spec:Category", "spec:Product")
// is needed when the field name collides with a core column. Brand/Requirement fields are
// derived from the product brand and quote mode, so they are not imported as specs.
const coreHeaders = new Set(Object.values(headerAliases).flat().map(normalizeHeader))
function addFieldColumns(row, normalized) {
  const category = String(row.category ?? '').trim()
  for (const field of categoryFields(category)) {
    if (field === BRAND_FIELD || REQUIREMENT_FIELDS.includes(field)) continue
    const bare = normalizeHeader(field)
    const header = normalized.has(`spec:${bare}`) ? `spec:${bare}` : (!coreHeaders.has(bare) && normalized.has(bare) ? bare : null)
    if (!header) continue
    const text = String(normalized.get(header) ?? '').trim()
    if (!text) continue
    const values = {}
    for (const token of text.split(/[;|]/).map((t) => t.trim()).filter(Boolean)) {
      const i = token.lastIndexOf('=')
      if (i > 0 && Number.isFinite(Number(token.slice(i + 1)))) values[token.slice(0, i).trim()] = Number(token.slice(i + 1))
      else values[token] = 0
    }
    row.specifications = { ...row.specifications, [field]: values }
  }
}
function mapRow(raw) {
  const normalized = new Map(Object.entries(raw).map(([key, value]) => [normalizeHeader(key), value]))
  const row = {}
  for (const [field, aliases] of Object.entries(headerAliases)) {
    const found = aliases.map(normalizeHeader).find((alias) => normalized.has(alias))
    if (found !== undefined) row[field] = normalized.get(found)
    else {
      const compactAliases = aliases.map(compactHeader)
      const key = [...normalized.keys()].find((header) => compactAliases.includes(compactHeader(header)))
      if (key !== undefined) row[field] = normalized.get(key)
    }
  }
  if (typeof row.specifications === 'string' && row.specifications.trim()) {
    try { row.specifications = JSON.parse(row.specifications) }
    catch { throw new Error('specifications must be valid JSON, e.g. {"RAM":{"8 GB":0,"16 GB":3000}}') }
  }
  if (!row.specifications || typeof row.specifications !== 'object') row.specifications = {}
  addFieldColumns(row, normalized)
  if (typeof row.available === 'string') row.available = !['false', 'no', '0', 'inactive'].includes(row.available.trim().toLowerCase())
  return row
}

export const list = asyncHandler(async (req, res) => res.json(await products.list({
  ...req.query,
  includeUnavailable: ['admin', 'superAdmin'].includes(req.user?.role) ? req.query.includeUnavailable : 'false',
})))
export const categories = (req, res) => res.json(products.categories())
export const get = asyncHandler(async (req, res) => res.json(await products.get(req.params.id)))
export const create = asyncHandler(async (req, res) => res.status(201).json(await products.create(req.body)))
export const update = asyncHandler(async (req, res) => res.json(await products.update(req.params.id, req.body)))
export const updatePricing = asyncHandler(async (req, res) => res.json(await products.updatePricing(req.params.id, req.body)))
export const remove = asyncHandler(async (req, res) => { await products.remove(req.params.id); res.status(204).end() })
export const price = asyncHandler(async (req, res) => res.json(await priceLine(req.body)))

export const importProducts = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload an .xlsx, .xls, or .csv file using the "file" field' })
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false })
  const sheetName = req.body.sheetName || workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return res.status(400).json({ error: `Sheet "${sheetName}" was not found`, availableSheets: workbook.SheetNames })
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, blankrows: false })
  if (!rawRows.length) return res.status(400).json({ error: 'The selected sheet has no product rows' })
  const headers = Object.keys(rawRows[0] || {}).map((key) => compactHeader(key))
  const requiredHeaders = ['name', 'modelNumber', 'brand', 'category', 'basePrice', 'available']
  const missingHeaders = requiredHeaders.filter((field) => !headerAliases[field].some((alias) => headers.includes(compactHeader(alias))))
  if (missingHeaders.length) {
    return res.status(400).json({
      error: `Missing mandatory column${missingHeaders.length > 1 ? 's' : ''}: ${missingHeaders.join(', ')}. Required columns are category, name, modelNumber, brand, basePrice, and available.`,
      missingHeaders,
      requiredHeaders,
      availableHeaders: Object.keys(rawRows[0] || {}),
    })
  }
  const rows = []
  const errors = []
  rawRows.forEach((raw, index) => {
    try {
      const row = mapRow(raw)
      if (!row.name && !row.modelNumber && !row.basePrice) return
      rows.push({ ...row, __sourceRow: index + 2 })
    } catch (error) {
      errors.push({ row: index + 2, error: error.message })
    }
  })
  if (!rows.length) {
    return res.status(400).json({
      error: 'No product rows found. Sheet1 in your provided workbook is a product-configuration/options matrix, not a product inventory list. Upload a sheet with columns such as name, category, basePrice, brand and modelNumber (optionally one column per category field, e.g. RAM).',
      availableSheets: workbook.SheetNames,
      parseErrors: errors,
    })
  }
  // Keep original spreadsheet row numbers in the response.
  const result = await products.importMany(rows, { updateExisting: req.body.updateExisting !== 'false' && req.body.updateExisting !== false })
  result.errors = [...errors, ...result.errors.map((item) => ({
    ...item,
    row: item.row || rows[item.row - 2]?.__sourceRow || item.row,
  }))].sort((a, b) => a.row - b.row)
  result.failed += errors.length
  result.total = rawRows.length
  res.status(200).json({ message: 'Product import completed', ...result, sheetName, availableSheets: workbook.SheetNames })
})
