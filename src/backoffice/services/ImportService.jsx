import { runFile1Import } from "./importFile1Service.jsx"
import { runFile2Import } from "./importFile2Service.jsx"
import { runFile3Import } from "./importFile3Service.jsx"
import { runFile4Import } from "./importFile4Service.jsx"
import { runResetForAll } from "../services/resetService.jsx"
import { parseCsv }       from "../utils/importUtils.jsx"

export const IMPORT_STEPS = [
    { key: "file1_referentiels", label: "Référentiels (F1)"  },
    { key: "file1_users",        label: "Utilisateurs (F1)"  },
    { key: "file1_assets",       label: "Assets (F1)"        },
    { key: "file2_tickets",      label: "Tickets (F2)"       },
    { key: "file3_costs",        label: "Coûts (F3)"         },
    { key: "file4_images",       label: "Images (F4)"        },
]

export async function runFullImport(csvTexts, pushLog, setCurrentStep, dryRun = true) {
    const { file1, file2, file3, file4 } = csvTexts

    const registry = {
        computers:     new Map(),
        monitors:      new Map(),
        assetRegistry: new Map(),
        userIds:       new Map(),
        ticketIds:     new Map(),
        ticketDates:   new Map(),
    }

    if (dryRun) pushLog("Mode DRY-RUN — aucun appel POST réel", "info")

    try {
        // ── Feuille 1 ────────────────────────────────────────────────────
        if (file1) {
            setCurrentStep("file1_referentiels")
            pushLog("═══ Feuille 1 : Assets ═══", "info")
            const f1Result = await runFile1Import(file1, pushLog, dryRun)
            f1Result.assetRegistry.forEach((map, type) => {
                if (!registry.assetRegistry.has(type)) registry.assetRegistry.set(type, new Map())
                map.forEach((id, name) => registry.assetRegistry.get(type).set(name, id))
            })
            f1Result.computers.forEach((id, name) => registry.computers.set(name, id))
            f1Result.monitors.forEach((id, name)  => registry.monitors.set(name, id))
            f1Result.userIds.forEach((id, name)   => registry.userIds.set(name, id))
            setCurrentStep("file1_assets")
        } else {
            pushLog("⚠ Feuille 1 non fournie — assets ignorés", "warn")
        }

        // ── Feuille 2 ────────────────────────────────────────────────────
        if (file2) {
            setCurrentStep("file2_tickets")
            pushLog("═══ Feuille 2 : Tickets ═══", "info")

            // Pré-remplir ticketDates depuis le CSV (comme avant)
            const f2Rows = parseCsv(file2)
            f2Rows.forEach(row => {
                const [d, m, y] = row.Date.split("/")
                const dt = `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")} ${row.Heure}:00`
                registry.ticketDates.set(row.Ref_Ticket, dt)
            })

            // F2 retourne maintenant { ticketIds, ticketDates }
            const f2Result = await runFile2Import(file2, pushLog, dryRun, registry)

            // Compatibilité : F2 peut retourner une Map (ancien) ou { ticketIds, ticketDates } (nouveau)
            const returnedMap = f2Result instanceof Map ? f2Result : f2Result?.ticketIds
            if (returnedMap instanceof Map) {
                returnedMap.forEach((id, ref) => registry.ticketIds.set(ref, id))
            }
            // Récupère aussi les ticketDates si F2 les retourne
            if (f2Result?.ticketDates instanceof Map) {
                f2Result.ticketDates.forEach((dt, ref) => registry.ticketDates.set(ref, dt))
            }
        } else {
            pushLog("⚠ Feuille 2 non fournie — tickets ignorés", "warn")
        }

        // ── Feuille 3 ────────────────────────────────────────────────────
        if (file3) {
            setCurrentStep("file3_costs")
            pushLog("═══ Feuille 3 : Coûts ═══", "info")
            await runFile3Import(file3, pushLog, dryRun, registry)
        } else {
            pushLog("⚠ Feuille 3 non fournie — coûts ignorés", "warn")
        }

        // ── Feuille 4 ────────────────────────────────────────────────────
        if (file4) {
            setCurrentStep("file4_images")
            pushLog("═══ Feuille 4 : Images ═══", "info")
            await runFile4Import(file4, pushLog, dryRun, registry)
        } else {
            pushLog("⚠ Feuille 4 non fournie — images ignorées", "warn")
        }

        pushLog(dryRun ? "✓ DRY-RUN terminé" : "✓ Import complet terminé", "success")

    } catch (err) {
        pushLog(`❌ Erreur fatale : ${err.message}`, "error")

        if (!dryRun) {
            pushLog("⏳ Rollback en cours — réinitialisation des données importées…", "warn")
            try {
                await runResetForAll(pushLog, false)
                pushLog("✓ Rollback terminé", "success")
            } catch (resetErr) {
                pushLog(`⚠ Erreur pendant le rollback : ${resetErr.message}`, "error")
            }
        }

        throw err
    }

    return registry
}