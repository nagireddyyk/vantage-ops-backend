import * as orders from '../services/order.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const list = asyncHandler(async (req, res) => res.json(await orders.list(req.user)))
export const get = asyncHandler(async (req, res) => res.json(await orders.get(req.user, req.params.id)))
export const create = asyncHandler(async (req, res) => res.status(201).json(await orders.create(req.user, req.body)))
export const cancel = asyncHandler(async (req, res) => res.json(await orders.cancel(req.user, req.params.id)))
export const updateStatus = asyncHandler(async (req, res) => res.json(await orders.updateStatus(req.user, req.params.id, req.body.status)))
export const respondToOffer = asyncHandler(async (req, res) => res.json(await orders.respondToOffer(req.user, req.params.id, req.body.decision)))

export const assign = asyncHandler(async (req, res) => res.json(await orders.assign(req.params.id, req.body.salesUserId)))
export const updateWorkflow = asyncHandler(async (req, res) => res.json(await orders.updateWorkflow(req.user, req.params.id, req.body.workflowStatus)))
