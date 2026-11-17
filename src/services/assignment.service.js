import { User } from '../models/index.js'
import { AppError } from '../utils/AppError.js'

// Leads are users with role "sales". Only an active lead can receive work.
export async function findActiveLead(userId) {
  const lead = await User.findOne({ where: { id: userId, role: 'sales', accountStatus: 'Active' } })
  if (!lead) throw new AppError(400, 'Select an active lead')
  return lead
}
export const leadName = (lead) => lead.name || lead.email

export const LEAD_WORKFLOW = ['In Progress', 'Closed']
