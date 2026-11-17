import { FLOWS, QUOTE_FLOW_BY_MODE } from '../constants/statusFlows.js'
import { AppError } from '../utils/AppError.js'
import { isAdmin } from '../utils/helpers.js'

export const quoteFlowKey = (quote) => QUOTE_FLOW_BY_MODE[quote.mode] || 'quotation'

// Which roles in FLOWS the signed-in user acts as. Super admins can do everything a lead can.
export function actorsOf(user) {
  if (isAdmin(user)) return ['sales', 'admin']
  if (user?.role === 'sales') return ['sales']
  return ['customer']
}

export function allowedNext(flowKey, status, user) {
  const mine = actorsOf(user)
  return Object.entries(FLOWS[flowKey].transitions[status] || {})
    .filter(([, who]) => who.some((w) => mine.includes(w)))
    .map(([to]) => to)
}

// Adds what the UI needs to show the right buttons for the signed-in user.
export function decorate(flowKey, user, record) {
  const json = typeof record.toJSON === 'function' ? record.toJSON() : record
  const flow = FLOWS[flowKey]
  return { ...json, flow: flowKey, flowLabel: flow.label, allowedNext: allowedNext(flowKey, json.status, user), noteRequired: flow.needsNote }
}

const roleLabel = (user) => (isAdmin(user) ? 'admin' : user.role === 'sales' ? 'lead' : 'customer')

// Validates and applies one status change; returns the new status and the history entry.
// Also keeps the lead's work stage (workflowStatus) in step with the status once the item is assigned.
export async function transition({ flowKey, record, to, user, note, historyField }) {
  const flow = FLOWS[flowKey]
  const from = record.status
  const options = flow.transitions[from]
  if (!flow.statuses.includes(to)) throw new AppError(400, `status must be one of: ${flow.statuses.join(', ')}`)
  if (!options || !(to in options)) {
    throw new AppError(409, options ? `Cannot move from "${from}" to "${to}". Allowed: ${Object.keys(options).join(', ')}` : `"${from}" is a final status`)
  }
  if (!options[to].some((w) => actorsOf(user).includes(w))) throw new AppError(403, `You cannot set the status to "${to}"`)
  const text = String(note || '').trim().slice(0, 1000)
  if (flow.needsNote.includes(to) && !text) throw new AppError(400, `Please add a note for "${to}"`)

  const entry = { from, to, by: roleLabel(user), name: user.name || user.email || null, at: new Date().toISOString(), ...(text && { note: text }) }
  const history = [...(record[historyField] || []), historyField === 'updates' ? { ...entry, message: text || `Status changed: ${from} → ${to}`, type: 'status', status: to } : entry]
  const changes = { status: to, [historyField]: history }
  if (record.assignedToUserId) changes.workflowStatus = flow.workDone.includes(to) ? 'Closed' : 'In Progress'
  return record.update(changes)
}
