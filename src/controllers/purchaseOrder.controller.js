import * as pos from '../services/purchaseOrder.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const list = asyncHandler(async (req, res) => res.json(await pos.list(req.user)))
export const get = asyncHandler(async (req, res) => res.json(await pos.get(req.user, req.params.id)))
export const create = asyncHandler(async (req, res) => res.status(201).json(await pos.create(req.user, req.body)))
export const approve = asyncHandler(async (req, res) => res.json(await pos.approve(req.params.id)))
export const reject = asyncHandler(async (req, res) => res.json(await pos.reject(req.params.id)))
export const assign = asyncHandler(async (req, res) => res.json(await pos.assign(req.params.id, req.body.salesUserId)))
export const updateWorkflow = asyncHandler(async (req, res) => res.json(await pos.updateWorkflow(req.user, req.params.id, req.body.workflowStatus)))
