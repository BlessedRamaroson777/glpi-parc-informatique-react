import apiV1 from "../../common/utils/apiV1.jsx"
import apiV2 from "../../common/utils/apiV2.jsx"
import { apiRequest } from "../../common/services/authService.jsx"
import { parseCsv } from "../utils/importUtils.jsx"
import { F2 } from "../constants/importConstants.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"

const TYPE_MAP     = { "incident": 1, "request": 2, "demande": 2 }
const STATUS_MAP   = { "new": 1, "processing": 2, "pending": 4, "solved": 5, "closed": 6 }
const PRIORITY_MAP = { "very low": 1, "low": 2, "medium": 3, "high": 4, "very high": 5, "major": 6 }

function combineDateTime(dateFr, heure) {
    const [d, m, y] = dateFr.split("/")
    return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")} ${heure}:00`
}

function parseItems(rawItems) {
    if (!rawItems) return []
    try { return JSON.parse(rawItems.replace(/""/g, '"')) }
    catch { return rawItems.replace(/[\[\]"]/g, "").split(",").map(s => s.trim()).filter(Boolean) }
}

function resolveItemType(name, assetRegistry) {
    for (const [itemtype, map] of assetRegistry) {
        if (map.has(name)) return { itemtype, items_id: map.get(name) }
    }
    return null
}

async function findAssetByName(assetName) {

    for (const asset of ASSET_TYPES) {
        try {
            const type = asset.key

            const res = await apiRequest(
                `/api.php/v2/Assets/${asset.key}?filter=name=="${assetName}"`,
                { method: "GET" }
            )

            if (Array.isArray(res) && res.length > 0) {
                return {
                    itemtype: asset.key === "Socket" ? "Glpi\\Socket" : asset.key,
                    items_id: res[0].id
                }
            }
        } 
        catch (err) {
            console.error(err)
            throw err
        }
    }

    return null
}

function normalizeItemtype(itemtype) {
    const value = String(itemtype ?? "").trim()
    const aliases = { Socket: "Glpi\\Socket" }
    return aliases[value] ?? value
}

export async function runFile2Import(csvText, pushLog, dryRun = false, registry = {}) {
    const rows = parseCsv(csvText)
    pushLog(`Feuille 2 — ${rows.length} tickets détectés`, "info")

    const { assetRegistry = new Map() } = registry
    const ticketIds = new Map()

    for (const row of rows) {
        const ref      = row[F2.REF]
        const datetime = combineDateTime(row.Date, row.Heure)
        const priority = PRIORITY_MAP[(row.Priority || "medium").toLowerCase()] ?? 3

        // Payload V2 — noms de champs selon le schéma GLPI v2
        const payload = {
            name:               row[F2.TITRE],
            content:            row[F2.DESCRIPTION] || `${row[F2.TITRE]} — importé automatiquement`,
            external_id:        ref,
            type:               TYPE_MAP[(row.Type   || "incident").toLowerCase()] ?? 1,
            status:             STATUS_MAP[(row.Status || "new").toLowerCase()]    ?? 1,
            priority,
            urgency:            priority,
            impact:             priority,
            // requesttypes_id:    1,
            // users_id_recipient: 2,
            date:               datetime,
            date_creation:      datetime,
        }

        pushLog(`CREATE Ticket « ${row[F2.TITRE]} » (${datetime})`, "warn")

        let glpiId = `DRY-TICKET-${ref}`

        if (!dryRun) {
            try {
                // Création via V2
                const res = await apiV2.post("/api.php/v2/Assistance/Ticket", payload)
                glpiId = res?.id ?? null
                if (!glpiId) throw new Error("Pas d'ID retourné")
                pushLog(`  ↳ Ticket créé id=${glpiId}`, "success")

                // Vérifier la valeur réellement persistée sur le ticket créé
                try {
                    const createdTicket = await apiV2.get(`/api.php/v2/Assistance/Ticket/${glpiId}`)
                    if (createdTicket?.external_id !== null && createdTicket?.external_id !== undefined) {
                        pushLog(`  ↳ external_id=${createdTicket.external_id}`, "success")
                    } else {
                        pushLog(`  ℹ external_id absent du ticket lu après création`, "warn")
                    }
                } catch {
                    pushLog(`  ℹ Impossible de relire le ticket pour vérifier external_id`, "warn")
                }

            } catch (err) {
                pushLog(`  ⚠ Erreur ticket (V2): ${err.message}`, "error")
                // Fallback V1
                pushLog(`  ↳ Tentative fallback V1...`, "warn")
                try {
                    const res2 = await apiV1.createItem("Ticket", { input: payload })
                    glpiId = res2?.id ?? null
                    if (!glpiId) throw new Error("Pas d'ID retourné (V1)")
                    pushLog(`  ↳ Ticket créé via V1 id=${glpiId}`, "success")
                } catch (err2) {
                    pushLog(`  ⚠ Erreur V1 aussi: ${err2.message}`, "error")
                    throw err2
                }
            }
        }

        ticketIds.set(ref, glpiId)

        if (registry.ticketDates instanceof Map) {
            registry.ticketDates.set(ref, datetime)
        }

        // ── Lier les assets (via V1 — Item_Ticket n'existe pas en V2) ───
        for (const assetName of parseItems(row[F2.ITEMS])) {
            // const resolved = resolveItemType(assetName, assetRegistry)
            // const resolved = await findAssetByName(assetName)
            let resolved = resolveItemType(assetName, assetRegistry)

            if (!resolved) {
                try{
                    resolved = await findAssetByName(assetName)
                }
                catch(err) {
                    throw err
                }
            }
            
            const linkPayload = {
                tickets_id: Number(glpiId),
                itemtype:   normalizeItemtype(resolved.itemtype),
                items_id:   Number(resolved.items_id),
            }
            if (!Number.isFinite(linkPayload.tickets_id) || !Number.isFinite(linkPayload.items_id)) continue

            pushLog(`LINK Ticket ${glpiId} ← ${assetName} (${linkPayload.itemtype})`, "warn")
            if (!dryRun) {
                try {
                    await apiV1.createItem("Item_Ticket", { input: linkPayload })
                    pushLog(`  ↳ Lié`, "success")
                } catch (err) {
                    pushLog(`  ⚠ Erreur liaison: ${err.message}`, "error")
                    throw err
                }
            }
        }
    }

    pushLog(`Feuille 2 terminée ✓ (${ticketIds.size} tickets)`, "success")
    return ticketIds
}