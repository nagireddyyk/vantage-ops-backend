import { CATEGORIES } from '../constants/index.js'

// A product belongs to one of the configurator categories (see constants CATEGORIES).
// `specifications` holds the per-product configurator choices for that category:
//   { "<field name from OPTIONS[category]>": { "<allowed value>": <price adjustment in ₹> } }
// e.g. { "RAM": { "8 GB": 0, "16 GB": 3000 }, "Storage Type": { "SATA SSD": 0, "NVMe SSD": 2500 } }
// Fields not listed fall back to the category defaults in OPTIONS.
export default (sequelize, T) => sequelize.define('Product', {
  name: { type: T.STRING, allowNull: false, validate: { notEmpty: true } },
  // Not unique on its own: the same model number may exist under a different brand or category.
  // Uniqueness is the combination brand + modelNumber + category (see indexes below).
  modelNumber: { type: T.STRING(120) },
  brand: { type: T.STRING(150), defaultValue: 'Unspecified' },
  category: {
    type: T.STRING(100),
    allowNull: false,
    validate: { isIn: { args: [CATEGORIES], msg: `category must be one of: ${CATEGORIES.join(', ')}` } },
  },
  basePrice: { type: T.DOUBLE, allowNull: false, validate: { min: 0.01 } },
  rentPct: { type: T.DOUBLE, defaultValue: 3, validate: { min: 0 } },
  leasePct: { type: T.DOUBLE, defaultValue: 3, validate: { min: 0 } },
  available: { type: T.BOOLEAN, defaultValue: true },
  specifications: { type: T.JSON, defaultValue: {} },
  // Optional model-specific lease duration and cover-plan rates. Null means this model uses no custom rate card.
  pricingRates: { type: T.JSON, allowNull: true, defaultValue: null },
  image: T.TEXT('long'),
}, {
  tableName: 'products',
  freezeTableName: true,
  paranoid: true,
  indexes: [
    { fields: ['category'] },
    { fields: ['brand'] },
    { name: 'products_brand_model_category_unique', unique: true, fields: ['brand', 'modelNumber', 'category'] },
  ],
})