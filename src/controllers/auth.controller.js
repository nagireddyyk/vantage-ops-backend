import { OPTIONS } from '../constants/index.js'
import { FLOWS } from '../constants/statusFlows.js'
import * as auth from '../services/auth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const register = asyncHandler(async (req, res) => res.status(201).json(await auth.register(req.body)))
export const login = asyncHandler(async (req, res) => res.json(await auth.login(req.body)))
export const config = (req, res) => res.json({ options: OPTIONS, statusFlows: Object.fromEntries(Object.entries(FLOWS).map(([k, f]) => [k, { label: f.label, statuses: f.statuses }])) })
