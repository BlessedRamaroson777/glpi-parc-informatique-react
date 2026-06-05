import apiV2 from "../utils/apiV2.jsx"

const BASE = "/api.php/v2.3/Assistance/Ticket"

// GET ALL
export function getTickets(params = {}) {
    return apiV2.get(BASE, params)
}

// GET BY ID
export function getTicketById(id) {
    return apiV2.get(`${BASE}/${id}`)
}

// DELETE
export function deleteTicket(id, purge = false) {
    return apiV2.delete(`${BASE}/${id}${purge ? '?purge=true' : ''}`)
}

// CREATE
export function createTicket(ticket) {
    return apiV2.post(BASE, ticket.toPayload())
}

// UPDATE
export function updateTicket(ticket) {
    return apiV2.patch(`${BASE}/${ticket.id}`, ticket.toPayload())
}

// SEARCH
export function searchTickets(name) {
    return apiV2.get(BASE, {
        filter: `name=*${name}*`
    })
}