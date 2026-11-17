import * as users from '../services/user.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const profile = asyncHandler(async (req, res) => res.json(await users.getProfile(req.user.id)))
export const updateProfile = asyncHandler(async (req, res) => res.json(await users.updateProfile(req.user.id, req.body)))
export const changePassword = asyncHandler(async (req, res) => res.json(await users.changePassword(req.user.id, req.body)))
