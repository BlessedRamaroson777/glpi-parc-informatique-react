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

export async function getTicketCout() {
  
  // Utilisation d'un fetch standard si requestJSON n'est pas dispo globalement
  const response = await fetch(`http://localhost:5050/api/coutsGeneral`);
  const d = await response.json();

  return d;

}

function toNum(v) {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return v;
    return parseFloat(String(v).replace(/\s/g, "").replace(",", ".")) || 0;
}

export async function getTicketsCosts(ticketIds) {
    const BATCH_SIZE = 10;
    const allResults = [];
    let done = 0;

    for (let i = 0; i < ticketIds.length; i += BATCH_SIZE) {
        const batch = ticketIds.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
            batch.map(id =>
                apiV2.get(`${BASE}/${id}/Cost`)
                    .then(data => ({ id, costs: Array.isArray(data) ? data : (data?.data ?? []) }))
                    .catch(() => ({ id, costs: [] }))
            )
        );
        allResults.push(...batchResults);
        done += batch.length;
    }

    const byTicket = {};

    for (const result of allResults) {
        if (result.status !== "fulfilled") continue;
        const { id, costs } = result.value;

        const totalDuration = costs.reduce((s, c) => s + toNum(c.duration ?? c.actiontime), 0);
        const totalFixed    = costs.reduce((s, c) => s + toNum(c.cost_fixed), 0);
        const totalMaterial = costs.reduce((s, c) => s + toNum(c.cost_material), 0);
        const totalTime     = costs.reduce((s, c) => {
            const h = toNum(c.duration ?? c.actiontime) / 3600;
            return s + Math.round(toNum(c.cost_time) * h * 100) / 100;
        }, 0);
        const totalGeneral  = costs.reduce((s, c) => {
            const h        = toNum(c.duration ?? c.actiontime) / 3600;
            const timePart = Math.round(toNum(c.cost_time) * h * 100) / 100;
            return s + timePart + toNum(c.cost_fixed);
        }, 0);

        byTicket[id] = { costs, totalDuration, totalFixed, totalMaterial, totalTime, totalGeneral };
    }

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

export async function getTicketsWithAssetTypes(tickets) {
    const results = [];
    for (const ticket of tickets) {
        try {
            const itemsRes = await getTicketItems(ticket.id);
            const items = Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data ?? []);

            if (items.length === 0) {
                results.push({ ...ticket, assetType: "Inconnu" });
                continue;
            }

            // Types distincts sur ce ticket
            const types = [...new Set(items.map(i => i.itemtype ?? "Inconnu"))];

            // Un "ticket" par type
            for (const assetType of types) {
                results.push({ ...ticket, assetType });
            }
        } catch {
            results.push({ ...ticket, assetType: "Inconnu" });
        }
    }
    return results;
}