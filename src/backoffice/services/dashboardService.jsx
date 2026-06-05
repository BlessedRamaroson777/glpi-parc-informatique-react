import apiV2 from "../utils/apiV2.jsx"

const BASE_V2 = "/api.php/v2.3"

const ASSET_TYPES = [
    { key: "Computer",         label: "Ordinateurs" },
    { key: "Monitor",          label: "Moniteurs" },
    { key: "Printer",          label: "Imprimantes" },
    { key: "Phone",            label: "Téléphones" },
    { key: "NetworkEquipment", label: "Équipements réseau" },
    { key: "Software",         label: "Logiciels" },
    { key: "Peripheral",       label: "Périphériques" },
]

async function countAsset(type) {
    const url = new URL(`${BASE_V2}/Assets/${type}`, window.location.origin)
    url.searchParams.append("limit", "0")

    const { getAccessToken } = await import("../services/authService")
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
    const [assetCounts, ticketStats] = await Promise.all([
        Promise.all(
            ASSET_TYPES.map(async ({ key, label }) => ({
                key,
                label,
                count: await countAsset(key),
            }))
        ),
        apiV2.get(`${BASE_V2}/Assistance/Stat/Ticket/Global`),
    ])

    return {
        assets: {
            total: assetCounts.reduce((sum, a) => sum + a.count, 0),
            byType: assetCounts,
        },
        tickets: ticketStats,
    }
}