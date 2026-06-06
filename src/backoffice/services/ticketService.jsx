import apiV2 from "../utils/apiV2.jsx"
import apiV1 from "../utils/apiV1.jsx"

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

// SEARCH impossible avec v2, on utilise donc v1 pour cette fonctionnalité spécifique (exemple de compatibilité ascendante)
export async function searchTickets(name) {
    const res = await apiV1.search("Ticket", {
        "searchText[1]": name,
        "rawdata": 1,
    })

    const items = Array.isArray(res?.data) ? res.data : []
    return items.map(item => ({
        id:            item[2],
        name:          item[1],
        status:        item[12],
        priority:      item[3],
        type:          item[4],
        date_creation: item[15],
        date_mod:      item[19],
    }))
}

export function getTicketItems(ticketId) {
    return apiV1.get("Item_Ticket", {
        "searchText[tickets_id]": ticketId,
        "expand_dropdowns": true,
    })
}