import * as salesUsers from '../services/salesUser.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
export const list = asyncHandler(async (_req, res) => res.json(await salesUsers.list()))
export const create = asyncHandler(async (req, res) => res.status(201).json(await salesUsers.create(req.body)))
export const update = asyncHandler(async (req, res) => res.json(await salesUsers.update(req.params.id, req.body)))
export const remove = asyncHandler(async (req, res) => res.json(await salesUsers.remove(req.params.id)))
