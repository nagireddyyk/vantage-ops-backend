import * as admin from '../services/admin.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const summary = asyncHandler(async (req, res) => res.json(await admin.summary()))
export const customers = asyncHandler(async (req, res) => res.json(await admin.customers()))
export const customerDetail = asyncHandler(async (req, res) => res.json(await admin.customerDetail(req.params.id)))

export const updateCustomerStatus = asyncHandler(async (req, res) => res.json(await admin.updateCustomerStatus(req.params.id, req.body.accountStatus)))

export const salesUsers = asyncHandler(async (req, res) => res.json(await admin.salesUsers()))
export const salesPerformance = asyncHandler(async (req, res) => res.json(await admin.salesPerformance()))
