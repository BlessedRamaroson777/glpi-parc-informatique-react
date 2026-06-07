import apiV2 from "../../common/utils/apiV2.jsx"
import apiV1 from "../../common/utils/apiV1.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"

const BASE_V2 = "/api.php/v2.3/Assets"
// Normalise un asset brut V2 en objet simple
function normalize(item, type) {
    return {
        id: item.id,
        name: item.name ?? "",
        type,
        serial: item.serial ?? null,
        status: item.status?.name ?? null,
        status_id: item.status?.id ?? null,
        entity: item.entity?.name ?? null,
        location: item.location?.name ?? null,
        user: item.user?.name ?? null,
        user_tech: item.user_tech?.name ?? null,
        manufacturer: item.manufacturer?.name ?? null,
        model: item.model?.name ?? null,
        date_creation: item.date_creation ?? null,
        date_mod: item.date_mod ?? null,
        comment: item.comment ?? null,
        is_deleted: item.is_deleted ?? false,
    }
}

// GET tous les assets d'un type
export async function getAssets(type) {
    const data = await apiV2.get(`${BASE_V2}/${type}`)
    return Array.isArray(data) ? data.map(item => normalize(item, type)) : []
}

// GET tous les types en parallèle
export async function getAllAssets() {
    const results = await Promise.all(
        ASSET_TYPES.map(async ({ key, label }) => {
            const items = await getAssets(key)
            return items.map(item => ({ ...item, typeLabel: label }))
        })
    )
    return results.flat()
}

// SEARCH via V1 (recherche partielle sur le nom)
export async function searchAssets(name, type = "Computer") {
    const res = await apiV1.search(type, {
        "criteria[0][field]": 1,
        "criteria[0][searchtype]": "contains",
        "criteria[0][value]": name,
        "rawdata": 1,
    })

    const items = Array.isArray(res?.data) ? res.data : []
    return items.map(item => ({
        id: item[2],
        name: item[1],
        serial: item[5] ?? null,
        status: item[31] ?? null,
        location: item[3] ?? null,
        type,
        typeLabel: ASSET_TYPES.find(t => t.key === type)?.label ?? type,
    }))
}