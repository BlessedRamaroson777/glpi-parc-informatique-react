import apiV1 from "../../common/utils/apiV1.jsx"
import apiV2 from "../../common/utils/apiV2.jsx"
import { apiRequest } from "../../common/services/authService.jsx"
import { parseCsv } from "../utils/importUtils.jsx"
import { F2 } from "../constants/importConstants.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"
import { TICKET_STATUS_IMPORT, TICKET_TYPES_IMPORT, TICKET_PRIORITIES_EN } from "../../common/constants/TicketConstants.jsx"
import { getTicketById } from "../../common/services/ticketService.jsx";
import { arrayToMap } from "../utils/formatters.jsx"

const STATUS_MAP = arrayToMap(TICKET_STATUS_IMPORT)
const TYPE_MAP = arrayToMap(TICKET_TYPES_IMPORT)
const PRIORITY_MAP = arrayToMap(TICKET_PRIORITIES_EN)

// function combineDateTime(dateFr, heure) {
//     const [d, m, y] = dateFr.split("/")
//     return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")} ${heure}:00`
// }
function combineDateTime(dateRaw, heure) {
    if (!dateRaw || !heure) return null;

    const clean = String(dateRaw).trim();
    let y, m, d;

    if (clean.includes("-")) {
        [y, m, d] = clean.split("-");
    } else if (clean.includes("/")) {
        [d, m, y] = clean.split("/");
    } else {
        return `${clean} ${String(heure).trim()}:00`;
    }

    // ✅ Garder seulement si les 3 parties existent
    if (!y || !m || !d) return null;

    return `${String(y).trim()}-${String(m).trim().padStart(2,"0")}-${String(d).trim().padStart(2,"0")} ${String(heure).trim()}:00`;
}

function parseItems(rawItems) {
    if (!rawItems) return []
    try { return JSON.parse(rawItems.replace(/""/g, '"')) }
    catch { return rawItems.replace(/[\[\]"]/g, "").split(",").map(s => s.trim()).filter(Boolean) }
}
// en cas de duplication
// function parseItems(rawItems) {
//     if (!rawItems) return []
//     let items
//     try { items = JSON.parse(rawItems.replace(/""/g, '"')) }
//     catch { items = rawItems.replace(/[\[\]"]/g, "").split(",").map(s => s.trim()).filter(Boolean) }
//     return [...new Set(items)]  // ← dédup ici
// }

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
        const datetime = combineDateTime(row[F2.DATE], row[F2.HEURE])
        const priority = PRIORITY_MAP[(row[F2.PRIORITY] || "medium").toLowerCase()]
        let statutUpdate;
        if(STATUS_MAP[(row[F2.STATUS]).toLowerCase()] != 1){
            statutUpdate = STATUS_MAP[(row[F2.STATUS]).toLowerCase()]
        }

        // Payload V2 — noms de champs selon le schéma GLPI v2
        const payload = {
            name:               row[F2.TITRE],
            content:            row[F2.DESCRIPTION] || `${row[F2.TITRE]} — importé automatiquement`,
            external_id:        ref,
            type:               TYPE_MAP[(row[F2.TYPE]).toLowerCase()],
            status:             1, // Création toujours en "Nouveau" (1) — le statut final sera mis à jour après création si besoin
            priority,
            urgency:            priority,
            impact:             priority,
            // requesttypes_id:    1,
            // users_id_recipient: 2,
            date:               datetime,
            date_creation:      datetime,
        }

        pushLog(`CREATE Ticket « ${row[F2.TITRE]} » statut ${STATUS_MAP[(row[F2.STATUS]).toLowerCase()]} (${datetime})`, "warn")

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
                throw err
                // Fallback V1
                // pushLog(`  ↳ Tentative fallback V1...`, "warn")
                // try {
                //     const res2 = await apiV1.createItem("Ticket", { input: payload })
                //     glpiId = res2?.id ?? null
                //     if (!glpiId) throw new Error("Pas d'ID retourné (V1)")
                //     pushLog(`  ↳ Ticket créé via V1 id=${glpiId}`, "success")
                // } catch (err2) {
                //     pushLog(`  ⚠ Erreur V1 aussi: ${err2.message}`, "error")
                //     throw err2
                // }
            }
        }

        ticketIds.set(ref, glpiId)

        if (registry.ticketDates instanceof Map) {
            registry.ticketDates.set(ref, datetime)
        }

        // ── Lier les assets (via V1 — Item_Ticket n'existe pas en V2) ───

        const uniqueItems = [...new Set(parseItems(row[F2.ITEMS]))]
        for (const assetName of uniqueItems) {
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
            
            // console.log("ASSET", assetName)
            // console.log("RESOLVED", resolved)
            const linkPayload = {
                tickets_id: Number(glpiId),
                itemtype:   normalizeItemtype(resolved.itemtype),
                items_id:   Number(resolved.items_id),
            }
            // if (!Number.isFinite(linkPayload.tickets_id) || !Number.isFinite(linkPayload.items_id)) continue
            const tickets_id = Number(glpiId)
            const items_id   = Number(resolved.items_id)

            if (!Number.isFinite(tickets_id) || !Number.isFinite(items_id)) {
                pushLog(`  ⚠ IDs invalides — liaison ignorée (tickets_id=${tickets_id}, items_id=${items_id})`, "error")
                continue
            }

            pushLog(`LINK Ticket ${glpiId} ← ${assetName} (${linkPayload.itemtype})`, "warn")
            if (!dryRun) {
                try {
                    // console.log("LINK PAYLOAD", linkPayload)
                    await apiV1.createItem("Item_Ticket", { input: linkPayload })
                    pushLog(`  ↳ Lié`, "success")
                } catch (err) {
                    pushLog(`  ⚠ Erreur liaison: ${err.message}`, "error")
                    throw err
                }
            }
        }
        if (statutUpdate) {
            const ticketChanger = await getTicketById(glpiId)
            // const update = await updateTicketStatus(ticketChanger, newStatus)
            const payload = {
                ...ticketChanger,
                status: statutUpdate
            }
            try {
                await apiV2.patch(`/api.php/v2/Assistance/Ticket/${glpiId}`, payload)
                pushLog(`  ↳ Status ${statutUpdate} appliqué`, "success")
            } catch (err) {
                pushLog(`  ⚠ Erreur statut mis sur new: ${err.message}`, "error")
                throw err
            }
        }
    }

    pushLog(`Feuille 2 terminée ✓ (${ticketIds.size} tickets)`, "success")
    return ticketIds
}