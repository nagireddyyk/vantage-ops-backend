// Status lifecycles for quotations, leases, rentals and AMC tickets.
//
// transitions: { [fromStatus]: { [toStatus]: [who may make this change] } }
// Who: 'customer' = the customer who raised it, 'sales' = the assigned lead,
//      'admin' = super admin only. Super admins can also do everything a lead can.
// Change an actor here to change who is allowed (e.g. replace 'admin' with 'sales'
// on the "Pending Approval" rows to let leads send the offer without approval).
//
// workDone:  statuses that finish the lead's work on the item (the lead's work stage
//            becomes "Closed"; any other change after assignment is "In Progress").
// needsNote: statuses that require a reason/note from whoever sets them.

const SALES = ['sales']
const CUSTOMER = ['customer']
const BOTH = ['sales', 'customer']
const ADMIN = ['admin']

export const FLOWS = {
  // Buy requests
  quotation: {
    label: 'Quotation',
    initial: 'Submitted',
    statuses: ['Submitted', 'Assigned', 'Contacted', 'Won', 'Lost', 'Under Review', 'Quote Ready', 'Sent to Customer', 'Revision Requested', 'Accepted', 'Rejected', 'Expired', 'Cancelled', 'PO Sent'],
    transitions: {
      'Submitted': { Assigned: ADMIN, Cancelled: BOTH },
      'Assigned': { Contacted: SALES, Won: SALES, Lost: SALES, Cancelled: BOTH },
      'Contacted': { Won: SALES, Lost: SALES, Cancelled: BOTH },
      'Under Review': { 'Quote Ready': SALES, Rejected: SALES, Cancelled: BOTH },
      'Quote Ready': { 'Sent to Customer': SALES, 'Under Review': SALES, Expired: SALES, Cancelled: BOTH },
      'Sent to Customer': { Accepted: CUSTOMER, 'Revision Requested': CUSTOMER, Rejected: BOTH, Expired: SALES, Cancelled: BOTH },
      'Revision Requested': { 'Under Review': SALES, 'Quote Ready': SALES, Rejected: SALES, Cancelled: BOTH },
    },
    workDone: ['Won', 'Lost', 'Accepted', 'Rejected', 'Expired', 'Cancelled'],
    needsNote: ['Revision Requested'],
  },
  lease: {
    label: 'Lease',
    initial: 'Submitted',
    statuses: ['Submitted', 'Under Review', 'Pending Approval', 'Lease Offer Sent', 'Awaiting Customer Acceptance', 'Approved', 'Agreement Completed', 'Fulfilment', 'Active', 'Rejected', 'Cancelled', 'Expired', 'Terminated'],
    transitions: {
      'Submitted': { 'Under Review': SALES, Rejected: SALES, Cancelled: BOTH },
      'Under Review': { 'Pending Approval': SALES, Rejected: SALES, Cancelled: BOTH },
      'Pending Approval': { 'Lease Offer Sent': ADMIN, 'Under Review': ADMIN, Rejected: ADMIN, Cancelled: BOTH },
      'Lease Offer Sent': { 'Awaiting Customer Acceptance': SALES, Approved: CUSTOMER, Rejected: CUSTOMER, Expired: SALES, Cancelled: BOTH },
      'Awaiting Customer Acceptance': { Approved: CUSTOMER, Rejected: CUSTOMER, Expired: SALES, Cancelled: BOTH },
      'Approved': { 'Agreement Completed': SALES, Cancelled: BOTH },
      'Agreement Completed': { Fulfilment: SALES, Cancelled: SALES },
      'Fulfilment': { Active: SALES, Cancelled: SALES },
      'Active': { Terminated: SALES },
    },
    workDone: ['Active', 'Rejected', 'Cancelled', 'Expired', 'Terminated'],
    needsNote: ['Terminated'],
  },
  rental: {
    label: 'Rental',
    initial: 'Submitted',
    statuses: ['Submitted', 'Under Review', 'Pending Approval', 'Rental Offer Sent', 'Awaiting Customer Acceptance', 'Approved', 'Fulfilment', 'Active', 'Returned', 'Rejected', 'Cancelled', 'Expired', 'Terminated'],
    transitions: {
      'Submitted': { 'Under Review': SALES, Rejected: SALES, Cancelled: BOTH },
      'Under Review': { 'Pending Approval': SALES, Rejected: SALES, Cancelled: BOTH },
      'Pending Approval': { 'Rental Offer Sent': ADMIN, 'Under Review': ADMIN, Rejected: ADMIN, Cancelled: BOTH },
      'Rental Offer Sent': { 'Awaiting Customer Acceptance': SALES, Approved: CUSTOMER, Rejected: CUSTOMER, Expired: SALES, Cancelled: BOTH },
      'Awaiting Customer Acceptance': { Approved: CUSTOMER, Rejected: CUSTOMER, Expired: SALES, Cancelled: BOTH },
      'Approved': { Fulfilment: SALES, Cancelled: BOTH },
      'Fulfilment': { Active: SALES, Cancelled: SALES },
      'Active': { Returned: SALES, Terminated: SALES },
    },
    workDone: ['Active', 'Returned', 'Rejected', 'Cancelled', 'Expired', 'Terminated'],
    needsNote: ['Terminated'],
  },
  // AMC / support tickets
  ticket: {
    label: 'Ticket',
    initial: 'Open',
    statuses: ['Open', 'Assigned', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed', 'Reopened'],
    transitions: {
      'Open': { 'In Progress': SALES },
      'Assigned': { 'In Progress': SALES, 'Waiting on Customer': SALES, Resolved: SALES },
      'In Progress': { 'Waiting on Customer': SALES, Resolved: SALES },
      'Waiting on Customer': { 'In Progress': BOTH, Resolved: SALES },
      'Resolved': { Closed: BOTH, Reopened: CUSTOMER },
      'Reopened': { 'In Progress': SALES, Resolved: SALES },
    },
    workDone: ['Resolved', 'Closed'],
    needsNote: ['Reopened'],
  },
}

// Quote mode -> which flow its status follows.
export const QUOTE_FLOW_BY_MODE = { buy: 'quotation', lease: 'lease', rent: 'rental' }
export const TICKET_STATUS = FLOWS.ticket.statuses
// Every quote status, for filters and validation.
export const QUOTE_STATUS = [...new Set(['quotation', 'lease', 'rental'].flatMap((k) => FLOWS[k].statuses))]
// A quote can be turned into an order once the customer has accepted it.
export const ORDERABLE_QUOTE_STATUS = ['Accepted', 'Approved', 'Agreement Completed', 'Fulfilment', 'Active']
