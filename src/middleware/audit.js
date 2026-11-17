import { AuditLog } from '../models/index.js'

// Logs successful administrative writes. Passwords, tokens and raw file data are never recorded.
export function auditAdminWrite(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return
    const entityType = req.baseUrl.split('/').filter(Boolean).at(-1) || 'admin'
    const entityId = req.params?.id || null
    const details = { method: req.method, path: req.originalUrl, statusCode: res.statusCode }
    AuditLog.create({ actorUserId: req.user?.id || null, action: `${req.method} ${req.route?.path || req.path}`, entityType, entityId, details })
      .catch((err) => console.error('Audit log write failed:', err.message))
  })
  next()
}
