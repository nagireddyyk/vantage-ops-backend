import * as tickets from '../services/ticket.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const list = asyncHandler(async (req, res) => res.json(await tickets.list(req.user)))
export const get = asyncHandler(async (req, res) => res.json(await tickets.get(req.user, req.params.id)))
export const create = asyncHandler(async (req, res) => res.status(201).json(await tickets.create(req.user, req.body)))
export const update = asyncHandler(async (req, res) => res.json(await tickets.update(req.user, req.params.id, req.body)))
export const customerUpdate = asyncHandler(async (req, res) => res.json(await tickets.customerUpdate(req.user, req.params.id, req.body)))
export const assign = asyncHandler(async (req, res) => res.json(await tickets.assign(req.user, req.params.id, req.body.salesUserId)))
export const updateWorkflow = asyncHandler(async (req, res) => res.json(await tickets.updateWorkflow(req.user, req.params.id, req.body.workflowStatus)))
