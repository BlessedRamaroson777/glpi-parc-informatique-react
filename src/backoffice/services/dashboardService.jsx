import apiV2 from "../../common/utils/apiV2.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"

const BASE_V2 = "/api.php/v2.3"
import apiV1 from "../../common/utils/apiV1.jsx"


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

async function countTicketsV1(criteria = {}) {
    const res = await apiV1.search("Ticket", { ...criteria, limit: 0 })
    return res?.totalcount ?? 0
}


export async function getDashboardData() {
    const { getAccessToken } = await import("../../common/services/authService.jsx")
    const token = getAccessToken()

    async function count(endpoint, filter = '') {
        const url = new URL(endpoint, window.location.origin)

        url.searchParams.append("limit", "0")

        if (filter) {
            url.searchParams.append("filter", filter)
        }

        const res = await fetch(url.toString(), {
            headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            }
        })

        console.log(
            filter,
            res.headers.get("Content-Range")
        )

        const data = await res.clone().json()
        console.log(data)

        const range = res.headers.get("Content-Range")

        return range
            ? parseInt(range.split("/")[1]) || 0
            : 0
    }

    const BASE_TICKET = "/api.php/v2.3/Assistance/Ticket"
    const BASE_ASSET  = "/api.php/v2.3/Assets"

    // const [
    //     assetCounts,
    //     ticketTotal,
    //     ticketIncident,
    //     ticketDemande,
    // ] = await Promise.all([
    //     Promise.all(ASSET_TYPES.map(async ({ key, label }) => ({
    //         key, label,
    //         count: await count(`${BASE_ASSET}/${key}`),
    //     }))),
    //     count(BASE_TICKET),
    //     count(BASE_TICKET, "type==1"),
    //     count(BASE_TICKET, "type==2"),
    // ])
    
    // dans getDashboardData() :
    const [
        assetCounts,
        ticketTotal,
        ticketIncident,
        ticketDemande,
    ] = await Promise.all([
        Promise.all(ASSET_TYPES.map(async ({ key, label }) => ({
            key, label,
            count: await apiV2.count(`${BASE_ASSET}/${key}`),
        }))),
        apiV2.count(BASE_TICKET),
        apiV2.count(BASE_TICKET, "type==1"),
        apiV2.count(BASE_TICKET, "type==2"),
    ])

    return {
        assets: {
            total: assetCounts.reduce((sum, a) => sum + a.count, 0),
            byType: assetCounts,
        },
        tickets: {
            total: ticketTotal,
            by_type: { 1: ticketIncident, 2: ticketDemande }
        }
    }
}