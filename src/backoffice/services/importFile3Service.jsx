/**
 * importFile3Service.jsx
 * ─────────────────────
 * Importe les coûts de tickets depuis la Feuille 3.
 *
 * Colonnes CSV :
 *   Num_Ticket, Duration_second, Time_Cost, Fixed_Cost
 *
 * Champs générés créativement :
 *   - name        = "Coût intervention #N"
 *   - begin_date  = date du ticket correspondant (depuis ticketDates)
 *   - end_date    = begin_date + Duration_second
 */

import apiV1 from "../../common/utils/apiV1.jsx"
import { apiRequest } from "../../common/services/authService.jsx"
import { parseCsv } from "../utils/importUtils.jsx"
import { F3 } from "../constants/importConstants.jsx"


// ── Helper : virgule décimale → point ────────────────────────────────────────

function toFloat(str) {
    return parseFloat((str || "0").replace(",", ".")) || 0
}

// ── Helper : ajoute des secondes à une date ISO ───────────────────────────────

function addSeconds(dateStr, seconds) {
    const d = new Date(dateStr)
    d.setSeconds(d.getSeconds() + Number(seconds))
    return d.toISOString().slice(0, 19).replace("T", " ")
}

// ── Import principal ─────────────────────────────────────────────────────────

/**
 * Importe les coûts de la Feuille 3.
 *
 * @param {string}   csvText     — contenu brut du CSV
 * @param {Function} pushLog     — callback(msg, type)
 * @param {boolean}  dryRun
 * @param {object}   registry
 *   registry.ticketIds   — Map<ref_ticket_csv, glpi_ticket_id>
 *   registry.ticketDates — Map<ref_ticket_csv, "YYYY-MM-DD HH:MM:SS">
 */
export async function runFile3Import(csvText, pushLog, dryRun = false, registry = {}) {
    const rows = parseCsv(csvText)
    pushLog(`Feuille 3 — ${rows.length} lignes de coûts détectées`, "info")

    const { ticketIds = new Map(), ticketDates = new Map() } = registry
    let count = 0
    const costCounters = new Map()

    for (const row of rows) {
        const ref = row[F3.NUM_TICKET]

        // Cherche d'abord dans la Map en mémoire (import complet)
        // Sinon cherche dans GLPI via external_id (import F3 seul)
        let glpiId = ticketIds.get(ref)

        if (!glpiId) {
            const res = await apiRequest(
                `/api.php/v2/Assistance/Ticket?filter=external_id=="${ref}"`,
                { method: "GET" }
            )
            const tickets = Array.isArray(res) ? res : []
            glpiId = tickets[0]?.id ?? null
        }

        if (!glpiId) {
            pushLog(`  ⚠ Ticket ref=${ref} introuvable — ligne ignorée`, "warn")
            continue
        }

        // Pour ticketDates aussi — fallback via l'API
        let beginDate = ticketDates.get(ref)
        if (!beginDate) {
            const ticket = await apiRequest(
                `/api.php/v2/Assistance/Ticket/${glpiId}`,
                { method: "GET" }
            )
            beginDate = ticket?.date ?? new Date().toISOString().slice(0, 19).replace("T", " ")
        }
        const n = (costCounters.get(ref) ?? 0) + 1
        costCounters.set(ref, n)

        const duration  = parseInt(row[F3.DURATION_SECOND], 10) || 0
        const endDate   = duration > 0 ? addSeconds(beginDate, duration) : beginDate

        const payload = {
            name:           `Coût intervention #${n}`,
            tickets_id:     glpiId,
            actiontime:     duration,
            cost_time:      toFloat(row[F3.TIME_COST]),
            cost_fixed:     toFloat(row[F3.FIXED_COST]),
            cost_material:  0,                         // non fourni — généré à 0
            begin_date:     beginDate,
            end_date:       endDate,
        }

        pushLog(`  CREATE TicketCost « ${payload.name} » pour le ticket #${glpiId} (fixed=${payload.cost_fixed}, time=${payload.cost_time})`, "warn")

        if (!dryRun) {
            try {
                const url = `/api.php/v2/Assistance/Ticket/${glpiId}/Cost`
                const res = await apiRequest(url, {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(payload),
                })
                const record = Array.isArray(res) ? res[0] : res
                const newId  = record?.id ?? null
                pushLog(`  ↳ Coût créé id=${newId}`, "success")
            } catch (err) {
                pushLog(`  ⚠ Erreur: ${err.message}`, "error")
                throw new Error(`  ⚠ Erreur: ${err.message}`, "error")
            }
        }

        count++
    }

    pushLog(`Feuille 3 terminée ✓ (${count} coûts importés)`, "success")
}
