import { useState } from "react"
import { apiRequest } from "../../common/services/authService.jsx"
import { RESET_CONFIG, PROTECTED_IDS } from "../constants/resetEntities.jsx"

const DRY_RUN = true

function normalizeItems(payload) {
    if (Array.isArray(payload)) return payload
    if (payload?.data && Array.isArray(payload.data)) return payload.data
    return []
}

const ENTITIES = Object.entries(RESET_CONFIG)
    .map(([key, cfg]) => ({ key, ...cfg }))
    .sort((a, b) => a.order - b.order)

export default function Reinitialisation() {
    const [selected, setSelected] = useState({})
    const [logs, setLogs]         = useState([])
    const [busy, setBusy]         = useState(false)

    const selectedCount = ENTITIES.filter(e => selected[e.key]).length

    function toggle(key) {
        setSelected(prev => ({ ...prev, [key]: !prev[key] }))
    }

    function toggleAll() {
        const allOn = ENTITIES.every(e => selected[e.key])
        const next  = {}
        ENTITIES.forEach(e => { next[e.key] = !allOn })
        setSelected(next)
    }

    function pushLog(msg, type = "info") {
        setLogs(prev => [...prev, { msg, type }])
    }

    async function deleteEntity(entity) {
        const { key, endpoint } = entity
        const isSubResource     = endpoint.includes("{id}")

        if (isSubResource) {
            const parentKey = entity.dependencies?.[0]
            const parentCfg = RESET_CONFIG[parentKey]
            if (!parentCfg) return

            const parents = normalizeItems(await apiRequest(`/api.php/v2/${parentCfg.endpoint}`, { method: "GET" }))
            for (const parent of parents) {
                const url   = `/api.php/v2/${endpoint.replace("{id}", parent.id)}`
                const items = normalizeItems(await apiRequest(url, { method: "GET" }))
                for (const item of items) {
                    pushLog(`DELETE ${url}/${item.id}`, "warn")
                    if (!DRY_RUN) await apiRequest(`${url}/${item.id}?force=true`, { method: "DELETE" })
                }
            }
        } else {
            const url   = `/api.php/v2/${endpoint}`
            const items = normalizeItems(await apiRequest(url, { method: "GET" }))
            const skip  = PROTECTED_IDS[key] ?? []
            for (const item of items) {
                if (skip.includes(item.id)) { pushLog(`SKIP ${key} #${item.id}`, "warn"); continue }
                pushLog(`DELETE ${url}/${item.id}`, "warn")
                if (!DRY_RUN) await apiRequest(`${url}/${item.id}?force=true`, { method: "DELETE" })
            }
        }
    }

    async function handleReset() {
        const active = ENTITIES.filter(e => selected[e.key])
        if (!active.length) return

        setBusy(true)
        setLogs([])
        if (DRY_RUN) pushLog("Mode DRY-RUN — aucune suppression réelle", "info")

        try {
            for (const entity of active) {
                pushLog(`▶ ${entity.label}`, "info")
                await deleteEntity(entity)
                pushLog(`✓ ${entity.label}`, "success")
            }
            pushLog(DRY_RUN ? "DRY-RUN terminé" : "Réinitialisation terminée", "success")
        } catch (e) {
            pushLog(`Erreur : ${e.message}`, "error")
        } finally {
            setBusy(false)
        }
    }

    return (
        <section className="reinit-page">
            <h1>Réinitialisation</h1>
            {DRY_RUN && <p className="reinit-dryrun">Mode DRY-RUN actif — aucune suppression réelle</p>}

            <label className="reinit-label" style={{ marginBottom: 12 }}>
                <input type="checkbox" onChange={toggleAll} checked={ENTITIES.every(e => selected[e.key])} />
                Tout sélectionner
            </label>

            <div className="form-grid">
                {ENTITIES.map(entity => (
                    <label key={entity.key} className="reinit-label">
                        <input
                            type="checkbox"
                            checked={Boolean(selected[entity.key])}
                            onChange={() => toggle(entity.key)}
                        />
                        <div>
                            <span>{entity.label}</span>
                            <code className="reinit-endpoint">{entity.endpoint}</code>
                        </div>
                    </label>
                ))}
            </div>

            <div className="button-row">
                <button onClick={handleReset} disabled={busy || selectedCount === 0}>
                    {busy ? "En cours…" : `Réinitialiser (${selectedCount})`}
                </button>
                <button onClick={() => setLogs([])} disabled={busy} style={{ background: "none", color: "var(--text)", borderColor: "var(--border)" }}>
                    Effacer les logs
                </button>
            </div>

            {logs.length > 0 && (
                <div className="status">
                    {logs.map((entry, i) => (
                        <div key={i} className={`reinit-log-${entry.type}`}>{entry.msg}</div>
                    ))}
                </div>
            )}
        </section>
    )
}