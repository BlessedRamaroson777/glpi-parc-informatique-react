import { useReset, RESET_ENTITIES } from "../hooks/useReset.jsx"
import EntityChecklist              from "../components/EntityChecklist.jsx"
import LogPanel                     from "../components/LogPanel.jsx"
import "../styles/reinitialisation.css"

export default function Reinitialisation() {
    const {
        selected,
        toggle,
        toggleAll,
        allSelected,
        selectedCount,
        logs,
        clearLogs,
        busy,
        dryRun,
        handleReset,
    } = useReset(false)   // false = vrais DELETE ; true = DRY-RUN simulation

    return (
        <section className="reinit-page">
            <h1>Réinitialisation</h1>

            {dryRun && (
                <p className="reinit-dryrun">
                    🧪 Mode DRY-RUN actif — aucune suppression réelle
                </p>
            )}

            {/* Liste des entités à sélectionner */}
            <EntityChecklist
                entities={RESET_ENTITIES}
                selected={selected}
                onToggle={toggle}
                onToggleAll={toggleAll}
                allSelected={allSelected}
                showEndpoint
                showGroup
            />

            {/* Boutons d'action */}
            <div className="button-row">
                <button
                    onClick={handleReset}
                    disabled={busy || selectedCount === 0}
                >
                    {busy ? "En cours…" : `Réinitialiser (${selectedCount})`}
                </button>

                <button
                    onClick={clearLogs}
                    disabled={busy}
                    style={{ background: "none", color: "var(--text)", borderColor: "var(--border)" }}
                >
                    Effacer les logs
                </button>
            </div>

            {/* Console de logs */}
            <LogPanel logs={logs} onClear={clearLogs} />
        </section>
    )
}