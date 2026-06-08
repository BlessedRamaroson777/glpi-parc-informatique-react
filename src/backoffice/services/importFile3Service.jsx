import apiV1 from "../../common/utils/apiV1.jsx"
import apiV2 from "../../common/utils/apiV2.jsx"
import { parseCsv } from "../utils/importUtils.jsx"
import { F3 } from "../constants/importConstants.jsx"

function toFloat(str) {
    return parseFloat((str || "0").replace(",", ".")) || 0
}

function addSeconds(dateStr, seconds) {
    const d = new Date(dateStr)
    d.setSeconds(d.getSeconds() + Number(seconds))
    return d.toISOString().slice(0, 19).replace("T", " ")
}

export async function runFile3Import(csvText, pushLog, dryRun = false, registry = {}) {
    const rows = parseCsv(csvText)
    pushLog(`Feuille 3 — ${rows.length} lignes de coûts détectées`, "info")

    const ticketIds   = registry.ticketIds   instanceof Map ? registry.ticketIds   : new Map()
    const ticketDates = registry.ticketDates instanceof Map ? registry.ticketDates : new Map()

    let count = 0
    const costCounters = new Map()

    for (const row of rows) {
        const ref = row[F3.NUM_TICKET]

        // ── Résolution du ticket ─────────────────────────────────────────
        let glpiId    = ticketIds.get(ref) ?? null
        let beginDate = ticketDates.get(ref) ?? null

        if (!glpiId) {
            // Fallback : recherche via external_id en V2
            pushLog(`  ⚠ Ticket ref=${ref} absent du registre — recherche via external_id...`, "warn")
            try {
                const res = await apiV2.get(
                    "/api.php/v2/Assistance/Ticket",
                    { filter: `external_id=="${ref}"`, limit: 1 }
                )
                const list = Array.isArray(res) ? res : []
                if (list.length > 0) {
                    glpiId    = list[0].id
                    beginDate = beginDate ?? (list[0].date ?? list[0].date_creation ?? "")
                        .replace("T", " ").slice(0, 19)
                    pushLog(`  ↳ Ticket trouvé id=${glpiId}`, "success")
                }
            } catch {
                glpiId = null
            }
        }

        if (!glpiId) {
            pushLog(`  ⚠ Ticket ref=${ref} introuvable — ligne ignorée`, "warn")
            continue
        }

        // Fallback date si toujours absente
        if (!beginDate) {
            try {
                const t = await apiV2.get(`/api.php/v2/Assistance/Ticket/${glpiId}`)
                beginDate = (t?.date ?? t?.date_creation ?? "").replace("T", " ").slice(0, 19)
            } catch {
                beginDate = new Date().toISOString().slice(0, 19).replace("T", " ")
            }
        }

        const n = (costCounters.get(ref) ?? 0) + 1
        costCounters.set(ref, n)

        const duration = parseInt(row[F3.DURATION_SECOND], 10) || 0
        const endDate  = duration > 0 ? addSeconds(beginDate, duration) : beginDate

        const payload = {
            name:          `Coût intervention #${n}`,
            tickets_id:    Number(glpiId),
            duration,
            cost_time:     toFloat(row[F3.TIME_COST]),
            cost_fixed:    toFloat(row[F3.FIXED_COST]),
            cost_material: 0,
            begin_date:    beginDate,
            end_date:      endDate,
        }

        pushLog(`CREATE TicketCost « ${payload.name} » pour ticket #${glpiId} (fixed=${payload.cost_fixed}, time=${payload.cost_time})`, "warn")

        if (!dryRun) {
            try {
                const res = await apiV2.post(
                    `/api.php/v2/Assistance/Ticket/${glpiId}/Cost`,
                    payload
                )
                const record = Array.isArray(res) ? res[0] : res
                pushLog(`  ↳ Coût créé id=${record?.id ?? "?"}`, "success")
            } catch (err) {
                pushLog(`  ⚠ Erreur: ${err.message}`, "error")
                throw err
            }
        }

        count++
    }

    pushLog(`Feuille 3 terminée ✓ (${count} coûts importés)`, "success")
}