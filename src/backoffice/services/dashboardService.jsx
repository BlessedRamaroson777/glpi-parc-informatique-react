import apiV2 from "../../common/utils/apiV2.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"

const BASE_V2 = "/api.php/v2.3"


async function countAsset(type) {
    const url = new URL(`${BASE_V2}/Assets/${type}`, window.location.origin)
    url.searchParams.append("limit", "0")

    const { getAccessToken } = await import("../../common/services/authService.jsx")
    const token = getAccessToken()

    const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })

    const range = res.headers.get("Content-Range")
    if (!range) return 0
    return parseInt(range.split("/")[1]) || 0
}

export async function getDashboardData() {
    const { getAccessToken } = await import("../../common/services/authService.jsx")
    const token = getAccessToken()

    async function count(endpoint, filter = '') {
        const url = new URL(endpoint, window.location.origin)
        url.searchParams.append("limit", "0")
        // RSQL filter format: wrap in parentheses and pass correctly encoded
        if (filter) {
            url.searchParams.append("filter", `(${filter})`)
        }
        
        console.debug(`[Dashboard] Fetching ${endpoint} with filter: ${filter}`, url.toString())
        
        const res = await fetch(url.toString(), {
            headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            }
        })
        
        if (!res.ok) {
            console.error(`[Dashboard] API error ${res.status} on ${endpoint}`)
            return 0
        }
        
        const range = res.headers.get("Content-Range")
        const count = range ? parseInt(range.split("/")[1]) || 0 : 0
        console.debug(`[Dashboard] ${endpoint} filter:"${filter}" → count: ${count}`)
        return count
    }

    const BASE_TICKET = "/api.php/v2.3/Assistance/Ticket"
    const BASE_ASSET  = "/api.php/v2.3/Assets"

    const [
        assetCounts,
        ticketTotal,
        ticketIncident,
        ticketDemande,
        ticketNouveau,
        ticketAttribue,
        ticketPlanifie,
        ticketAttente,
        ticketResolu,
        ticketClos,
    ] = await Promise.all([
        Promise.all(ASSET_TYPES.map(async ({ key, label }) => ({
            key, label,
            count: await count(`${BASE_ASSET}/${key}`),
        }))),
        count(BASE_TICKET),
        count(BASE_TICKET, "type==1"),
        count(BASE_TICKET, "type==2"),
        count(BASE_TICKET, "status==1"),
        count(BASE_TICKET, "status==2"),
        count(BASE_TICKET, "status==3"),
        count(BASE_TICKET, "status==4"),
        count(BASE_TICKET, "status==5"),
        count(BASE_TICKET, "status==6"),
    ])

    return {
        assets: {
            total: assetCounts.reduce((sum, a) => sum + a.count, 0),
            byType: assetCounts,
        },
        tickets: {
            total: ticketTotal,
            by_type:   { incident: ticketIncident, request: ticketDemande },
            by_status: {
                new:      ticketNouveau,
                assigned: ticketAttribue,
                planned:  ticketPlanifie,
                waiting:  ticketAttente,
                solved:   ticketResolu,
                closed:   ticketClos,
            }
        }
    }
}