import { useState, useMemo } from "react"
import { RESET_CONFIG } from "../constants/resetEntities.jsx"
import { runReset } from "../services/resetService.jsx"

// Entités triées une seule fois au chargement du module
export const RESET_ENTITIES = Object.entries(RESET_CONFIG)
    .map(([key, cfg]) => ({ key, ...cfg }))
    .sort((a, b) => a.order - b.order)

/**
 * Hook encapsulant tout l'état et la logique de la page Réinitialisation.
 * @param {boolean} dryRun — active le mode simulation (défaut : true)
 */
export function useReset(dryRun = true) {
    const [selected, setSelected] = useState({})
    const [logs,     setLogs]     = useState([])
    const [busy,     setBusy]     = useState(false)

    // ── Sélection ────────────────────────────────────────────────────────

    const selectedCount = useMemo(
        () => RESET_ENTITIES.filter(e => selected[e.key]).length,
        [selected]
    )

    const allSelected = useMemo(
        () => RESET_ENTITIES.every(e => selected[e.key]),
        [selected]
    )

    function toggle(key) {
        setSelected(prev => ({ ...prev, [key]: !prev[key] }))
    }

    function toggleAll() {
        const next = {}
        RESET_ENTITIES.forEach(e => { next[e.key] = !allSelected })
        setSelected(next)
    }

    // ── Logs ─────────────────────────────────────────────────────────────

    function pushLog(msg, type = "info") {
        setLogs(prev => [...prev, { msg, type, ts: Date.now() }])
    }

    function clearLogs() {
        setLogs([])
    }

    // ── Action ───────────────────────────────────────────────────────────

    async function handleReset() {
        const active = RESET_ENTITIES.filter(e => selected[e.key])
        if (!active.length) return

        setBusy(true)
        setLogs([])

        try {
            await runReset(active, pushLog, dryRun)
        } catch (err) {
            pushLog(`Erreur : ${err.message}`, "error")
        } finally {
            setBusy(false)
        }
    }

    return {
        // sélection
        selected,
        toggle,
        toggleAll,
        allSelected,
        selectedCount,
        // logs
        logs,
        clearLogs,
        // état
        busy,
        dryRun,
        // action
        handleReset,
    }
}
