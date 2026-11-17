import * as quotes from '../services/quote.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const list = asyncHandler(async (req, res) => res.json(await quotes.list(req.user)))
export const get = asyncHandler(async (req, res) => res.json(await quotes.get(req.user, req.params.id)))
export const create = asyncHandler(async (req, res) => res.status(201).json(await quotes.create(req.user, req.body)))
export const update = asyncHandler(async (req, res) => res.json(await quotes.update(req.user, req.params.id, req.body)))
export const share = asyncHandler(async (req, res) => res.json(await quotes.share(req.user, req.params.id)))
export const updateStatus = asyncHandler(async (req, res) => res.json(await quotes.updateStatus(req.user, req.params.id, req.body.status, req.body.note)))
export const requestRevision = asyncHandler(async (req, res) => res.json(await quotes.requestRevision(req.user, req.params.id)))
export const accept = asyncHandler(async (req, res) => res.json(await quotes.accept(req.user, req.params.id)))
export const reject = asyncHandler(async (req, res) => res.json(await quotes.reject(req.user, req.params.id)))

export const assign = asyncHandler(async (req, res) => res.json(await quotes.assign(req.params.id, req.body.salesUserId)))
export const updateWorkflow = asyncHandler(async (req, res) => res.json(await quotes.updateWorkflow(req.user, req.params.id, req.body.workflowStatus)))
