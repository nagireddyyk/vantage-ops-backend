import * as leads from '../services/lead.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

// 201 for a new enquiry; 200 with `duplicate: true` when the same enquiry was already saved.
const reply = (res, lead) => res.status(lead.duplicate ? 200 : 201).json(lead)
export const createPublic = asyncHandler(async (req, res) => reply(res, await leads.create(req.body, null, req.body.source === 'contact-us' ? 'contact-us' : 'website-whatsapp')))
export const create = asyncHandler(async (req, res) => reply(res, await leads.create(req.body, req.user, 'website')))
export const list = asyncHandler(async (req, res) => res.json(await leads.list(req.user)))
export const assign = asyncHandler(async (req, res) => res.json(await leads.assign(req.params.id, req.body.salesUserId)))
export const updateWorkflow = asyncHandler(async (req, res) => res.json(await leads.updateWorkflow(req.user, req.params.id, req.body.workflowStatus)))
