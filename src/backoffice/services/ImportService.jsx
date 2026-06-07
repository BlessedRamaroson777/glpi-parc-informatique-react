/**
 * importService.jsx
 * ─────────────────
 * Orchestrateur central de l'import GLPI depuis les 3 CSV.
 *
 * Séquence :
 *   1. Feuille 1 → référentiels + users + assets         → registry.computers/monitors
 *   2. Feuille 2 → tickets + liaisons assets              → registry.ticketIds/ticketDates
 *   3. Feuille 3 → coûts de tickets                       (utilise registry.ticketIds)
 *
 * Un registre partagé est transmis entre les services pour résoudre les IDs
 * cross-fichiers (ex : nom d'asset CSV → ID GLPI pour les tickets).
 */

import { runFile1Import } from "./importFile1Service.jsx"
import { runFile2Import } from "./importFile2Service.jsx"
import { runFile3Import } from "./importFile3Service.jsx"
import { parseCsv }       from "../utils/importUtils.jsx"

// ── Étapes exposées pour le stepper UI ─────────────────────────────────────

export const IMPORT_STEPS = [
    { key: "file1_referentiels", label: "Référentiels (F1)"  },
    { key: "file1_users",        label: "Utilisateurs (F1)"  },
    { key: "file1_assets",       label: "Assets (F1)"        },
    { key: "file2_tickets",      label: "Tickets (F2)"       },
    { key: "file3_costs",        label: "Coûts (F3)"         },
]

// ── Orchestrateur ────────────────────────────────────────────────────────────

/**
 * Lance l'import complet des 3 fichiers.
 *
 * @param {{ file1: string, file2: string, file3: string }} csvTexts
 * @param {Function} pushLog        — callback(msg, type)
 * @param {Function} setCurrentStep — callback(stepKey) pour le stepper UI
 * @param {boolean}  dryRun
 */
export async function runFullImport(csvTexts, pushLog, setCurrentStep, dryRun = true) {
    const { file1, file2, file3 } = csvTexts

    // Registre partagé transmis entre les services
    const registry = {
        computers:   new Map(),
        monitors:    new Map(),
        userIds:     new Map(),
        ticketIds:   new Map(),
        ticketDates: new Map(),
    }

    if (dryRun) pushLog("Mode DRY-RUN — aucun appel POST réel", "info")

    // ── Feuille 1 ────────────────────────────────────────────────────────
    if (file1) {
        setCurrentStep("file1_referentiels")
        pushLog("═══ Feuille 1 : Assets ═══", "info")

        const f1Result = await runFile1Import(file1, pushLog, dryRun)

        // Enrichir le registre
        f1Result.computers.forEach((id, name) => registry.computers.set(name, id))
        f1Result.monitors.forEach((id, name)  => registry.monitors.set(name, id))
        f1Result.userIds.forEach((id, name)   => registry.userIds.set(name, id))

        setCurrentStep("file1_assets")
    } else {
        pushLog("⚠ Feuille 1 non fournie — assets ignorés", "warn")
    }

    // ── Feuille 2 ────────────────────────────────────────────────────────
    if (file2) {
        setCurrentStep("file2_tickets")
        pushLog("═══ Feuille 2 : Tickets ═══", "info")

        // Précalcule les dates pour les passer à Feuille 3
        const f2Rows = parseCsv(file2)
        f2Rows.forEach(row => {
            const [d, m, y] = row.Date.split("/")
            const dt = `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")} ${row.Heure}:00`
            registry.ticketDates.set(row.Ref_Ticket, dt)
        })

        const ticketIds = await runFile2Import(file2, pushLog, dryRun, registry)
        ticketIds.forEach((id, ref) => registry.ticketIds.set(ref, id))
    } else {
        pushLog("⚠ Feuille 2 non fournie — tickets ignorés", "warn")
    }

    // ── Feuille 3 ────────────────────────────────────────────────────────
    if (file3) {
        setCurrentStep("file3_costs")
        pushLog("═══ Feuille 3 : Coûts ═══", "info")
        await runFile3Import(file3, pushLog, dryRun, registry)
    } else {
        pushLog("⚠ Feuille 3 non fournie — coûts ignorés", "warn")
    }

    pushLog(
        dryRun
            ? "✓ DRY-RUN terminé — aucune donnée insérée"
            : "✓ Import complet terminé",
        "success"
    )

    return registry
}