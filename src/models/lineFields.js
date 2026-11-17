import { MODES } from '../constants/index.js'

// Columns shared by quotes and orders (one configured product line).
export const lineFields = (T) => ({
  item: T.STRING(500), options: T.JSON, mode: T.ENUM(...MODES), qty: T.INTEGER, amount: T.DOUBLE,
})
