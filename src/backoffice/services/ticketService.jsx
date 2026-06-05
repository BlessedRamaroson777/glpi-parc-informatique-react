import { apiRequest } from "../utils/apiV2.jsx"
import Ticket from "../entities/Ticket.jsx"

const BASE = "Assistance/Ticket"

// ───────────────────────── GET ALL ─────────────────────────
export async function getTickets(params = {}) {
    return apiRequest(BASE, {
        method: "GET",
        ...params,
    })
}

// ───────────────────────── GET BY ID ─────────────────────────
export async function getTicketById(id) {
    if (!id) throw new Error("ID requis")

    return apiRequest(`${BASE}/${id}`, {
        method: "GET",
    })
}

// ───────────────────────── DELETE ─────────────────────────
export async function deleteTicket(id, purge = false) {
    if (!id) throw new Error("ID requis")

    return apiRequest(
        `${BASE}/${id}${purge ? "?purge=true" : ""}`,
        {
            method: "DELETE",
        }
    )
}

// ───────────────────────── CREATE ─────────────────────────
export async function createTicket(ticket) {
    return apiRequest(BASE, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(ticket.toPayload()),
    })
}

// ───────────────────────── UPDATE ─────────────────────────
export async function updateTicket(ticket) {
    if (!ticket.id) throw new Error("ID requis")

    return apiRequest(`${BASE}/${ticket.id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(ticket.toPayload()),
    })
}

// ───────────────────────── SEARCH BY NAME ─────────────────────────
export async function getTicketsByName(name) {
    if (!name) return []

    return apiRequest(
        `${BASE}?filter=name=*${encodeURIComponent(name)}*`,
        {
            method: "GET",
        }
    )
}

// ───────────────────────── GET FULL TICKET ─────────────────────────
export async function getTicketFull(id) {
    const ticket = await getTicketById(id)

    const [followups, costs, documents] = await Promise.all([
        apiRequest(`Assistance/Ticket/${id}/Timeline/Followup`),
        apiRequest(`Assistance/Ticket/${id}/Cost`),
        apiRequest(`Assistance/Ticket/${id}/Timeline/Document`)
    ])

    return {
        ticket,
        followups,
        costs,
        documents
    }
}