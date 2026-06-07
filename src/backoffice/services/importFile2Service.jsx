/**
 * importFile2Service.jsx
 * ─────────────────────
 * Importe les tickets depuis la Feuille 2 et lie les assets associés.
 *
 * Colonnes CSV :
 *   Ref_Ticket, Date, Heure, Type, Titre, Description, Status, Priority, Items
 *
 * Champs générés créativement pour satisfaire l'API GLPI :
 *   - urgency          = même valeur que priority (cohérence)
 *   - impact           = 3 (Medium, valeur neutre)
 *   - requesttypes_id  = 1 (Helpdesk)
 *   - users_id_recipient = 2 (compte admin GLPI par défaut)
 */

import { apiRequest } from "../../common/services/authService.jsx"
import apiV1 from "../../common/utils/apiV1.jsx"
import { parseCsv } from "../utils/importUtils.jsx"
import { F2 } from "../constants/importConstants.jsx"


// ── Mappings ────────────────────────────────────────────────────────────────

const TYPE_MAP = {
    "incident": 1,
    "request":  2,
    "demande":  2,
}

const STATUS_MAP = {
    "new":        1,
    "processing": 2,
    "pending":    4,
    "solved":     5,
    "closed":     6,
}

const PRIORITY_MAP = {
    "very low":  1,
    "low":       2,
    "medium":    3,
    "high":      4,
    "very high": 5,
    "major":     6,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Combine une date "DD/MM/YYYY" et une heure "HH:MM" en "YYYY-MM-DD HH:MM:SS"
 */
function combineDateTime(dateFr, heure) {
    const [d, m, y] = dateFr.split("/")
    return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")} ${heure}:00`
}

/**
 * Parse le champ Items : `["PC-ADM-001","MN-FORM-002"]` → string[]
 */
function parseItems(rawItems) {
    if (!rawItems) return []
    try {
        return JSON.parse(rawItems.replace(/""/g, '"'))
    } catch {
        return rawItems.replace(/[\[\]"]/g, "").split(",").map(s => s.trim()).filter(Boolean)
    }
}

/**
 * Résout le type d'item GLPI (Computer → 1, Monitor → 5)
 * à partir du nom d'asset et des registres.
 */
function resolveItemType(name, computers, monitors) {
    if (computers.has(name)) return { itemtype: "Computer", items_id: computers.get(name) }
    if (monitors.has(name))  return { itemtype: "Monitor",  items_id: monitors.get(name) }
    return null
}

// ── Import principal ─────────────────────────────────────────────────────────

/**
 * Importe tous les tickets de la Feuille 2.
 *
 * @param {string}   csvText   — contenu brut du CSV
 * @param {Function} pushLog   — callback(msg, type)
 * @param {boolean}  dryRun
 * @param {object}   registry  — { computers: Map<name,id>, monitors: Map<name,id> }
 *                               issu de runFile1Import
 * @returns {Map<ref_ticket, glpi_ticket_id>}
 */
export async function runFile2Import(csvText, pushLog, dryRun = false, registry = {}) {
    const rows = parseCsv(csvText)
    pushLog(`Feuille 2 — ${rows.length} tickets détectés`, "info")

    const { computers = new Map(), monitors = new Map() } = registry
    const ticketIds = new Map()   // ref_ticket → GLPI id

    for (const row of rows) {
        const ref       = row.Ref_Ticket
        const datetime  = combineDateTime(row.Date, row.Heure)
        const typeKey   = (row.Type   || "incident").toLowerCase()
        const statusKey = (row.Status || "new").toLowerCase()
        const prioKey   = (row.Priority || "medium").toLowerCase()
        const priority  = PRIORITY_MAP[prioKey] ?? 3

        const payload = {
            name:    row[F2.TITRE],
            content: row[F2.DESCRIPTION] || `${row[F2.TITRE]} — importé automatiquement`,
            external_id: row[F2.REF],    
            type:                TYPE_MAP[typeKey]   ?? 1,
            status:              STATUS_MAP[statusKey] ?? 1,
            priority,
            urgency:             priority,        // cohérence : urgency = priority
            impact:              3,               // Medium — valeur neutre
            requesttypes_id:     1,               // Helpdesk
            users_id_recipient:  2,               // compte admin GLPI par défaut
            date:                datetime,
            date_creation:       datetime,
        }

        pushLog(`  CREATE Ticket « ${row[F2.TITRE]} » (${datetime})`, "warn")

        let glpiId = `DRY-TICKET-${ref}`

        if (!dryRun) {
            // console.log("Payload ticket:", JSON.stringify({ input: payload }))
            // console.log("F2.TITRE =", F2.TITRE, "| valeur =", row[F2.TITRE])
            try {
                const res = await apiV1.createItem("Ticket", { input: payload })
                glpiId = res?.id ?? null
                if (glpiId) {
                    pushLog(`  ↳ Ticket créé id=${glpiId}`, "success")
                } else {
                    pushLog(`  ⚠ Erreur lors de la création du ticket (pas d'ID retourné)`, "error")
                }
            } catch (err) {
                pushLog(`  ⚠ Erreur lors de la création du ticket: ${err.message}`, "error")
                console.error("Erreur de création de ticket:", err)
            }
        }

        ticketIds.set(ref, glpiId)

        // ── Lier les assets (Items) ──────────────────────────────────────
        const itemNames = parseItems(row[F2.ITEMS])

        for (const assetName of itemNames) {
            const resolved = resolveItemType(assetName, computers, monitors)
            if (!resolved) {
                pushLog(`  ⚠ Asset « ${assetName} » non trouvé dans le registre`, "warn")
                continue
            }

            pushLog(`  LINK Ticket ${glpiId} ← ${assetName} (${resolved.itemtype})`, "warn")

            if (!dryRun) {
                await apiV1.createItem("Item_Ticket", {
                    input: {
                        tickets_id: glpiId,
                        itemtype:   resolved.itemtype,
                        items_id:   resolved.items_id,
                    }
                })
                pushLog(`  ↳ Lié`, "success")
            }
        }
    }

    pushLog(`Feuille 2 terminée ✓ (${ticketIds.size} tickets)`, "success")
    return ticketIds
}
