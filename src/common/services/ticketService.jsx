import apiV2 from "../utils/apiV2.jsx"
import apiV1 from "../utils/apiV1.jsx"
import { API } from "../constants/apiConfig.jsx";

const BASE = "/api.php/v2.3/Assistance/Ticket"

// GET ALL
export function getTickets(params = {}) {
    return apiV2.get(`${BASE}?start=0&limit=999`, params)
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

export function updateTicketStatus(ticket, status) {
    return apiV2.patch(`${BASE}/${ticket.id}`, {
        ...ticket,
        status: status
    })
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

export async function getTicketItems(ticketId) {
    const result = await apiV1.get("Item_Ticket", {
        "searchText[tickets_id]": ticketId,
    })

    return result
}

export async function loadStatusTranslations() {
  const langId = localStorage.getItem("langueId") || "1";
  
  // Utilisation d'un fetch standard si requestJSON n'est pas dispo globalement
  const response = await fetch(`http://localhost:5050/api/langue-statut/langue/${langId}`);
  const d = await response.json();

  const translations = {};
  (d.langueStatut || []).forEach(x => {
    translations[x.statutId] = x.valeur;
  });

  return translations; // ✓ On retourne l'objet mappé { "1": "Nouveau", "2": "En cours..." }
}

/**
 * Retourne les coûts de chaque ticket + les totaux globaux
 * @param {number[]} ticketIds - liste d'IDs de tickets
 * @returns {Promise<{ byTicket: Object, totals: Object }>}
 */
export async function getTicketsCosts(ticketIds) {
    const results = await Promise.allSettled(
        ticketIds.map(id =>
            apiV2.get(`${BASE}/${id}/Cost`)
                .then(data => ({ id, costs: Array.isArray(data) ? data : (data?.data ?? []) }))
                .catch(() => ({ id, costs: [] }))
        )
    );

    const byTicket = {};

    for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const { id, costs } = result.value;

        const totalDuration = costs.reduce((s, c) => s + (c.duration || c.actiontime || 0), 0);
        const totalFixed    = costs.reduce((s, c) => s + (c.cost_fixed || 0), 0);
        const totalMaterial = costs.reduce((s, c) => s + (c.cost_material || 0), 0);
        const totalTime     = costs.reduce((s, c) => {
            const h = (c.duration || c.actiontime || 0) / 3600;
            return s + (c.cost_time || 0) * h;
        }, 0);
        const totalGeneral  = totalFixed + totalMaterial + totalTime;

        byTicket[id] = {
            costs,
            totalDuration,  // en secondes
            totalFixed,
            totalMaterial,
            totalTime,      // coût horaire × heures
            totalGeneral,
        };
    }

    // Totaux globaux sur tous les tickets
    const totals = Object.values(byTicket).reduce(
        (acc, t) => ({
            totalDuration: acc.totalDuration + t.totalDuration,
            totalFixed:    acc.totalFixed    + t.totalFixed,
            totalMaterial: acc.totalMaterial + t.totalMaterial,
            totalTime:     acc.totalTime     + t.totalTime,
            totalGeneral:  acc.totalGeneral  + t.totalGeneral,
        }),
        { totalDuration: 0, totalFixed: 0, totalMaterial: 0, totalTime: 0, totalGeneral: 0 }
    );

    return { byTicket, totals };
}