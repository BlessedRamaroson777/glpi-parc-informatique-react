import { useImport }      from "../hooks/useImport.jsx"
import LogPanel           from "../components/LogPanel.jsx"
import ImportStepper      from "../components/ImportStepper.jsx"
import "../styles/import.css"

// ── Métadonnées des 3 fichiers pour l'UI ────────────────────────────────────

const FILE_META = [
    {
        slot:    "file1",
        label:   "Feuille 1 — Assets",
        desc:    "Ordinateurs & moniteur (10 lignes) : Name, Status, Location, Manufacturer, Model…",
        icon:    "🖥️",
        accept:  ".csv",
    },
    {
        slot:    "file2",
        label:   "Feuille 2 — Tickets",
        desc:    "Tickets d'incidents (2 lignes) : Ref, Date, Type, Titre, Description, Items liés…",
        icon:    "🎫",
        accept:  ".csv",
    },
    {
        slot:    "file3",
        label:   "Feuille 3 — Coûts",
        desc:    "Coûts de tickets (2 lignes) : Num_Ticket, Duration_second, Time_Cost, Fixed_Cost",
        icon:    "💰",
        accept:  ".csv",
    },
]

// ── Dropzone ─────────────────────────────────────────────────────────────────

function Dropzone({ meta, fileName, onChange, disabled }) {
    const hasFile = Boolean(fileName)

    function handleChange(e) {
        const file = e.target.files?.[0]
        if (file) onChange(file)
    }

    function handleDrop(e) {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) onChange(file)
    }

    return (
        <label
            className={`import-dropzone ${hasFile ? "import-dropzone--loaded" : ""}`}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept={meta.accept}
                disabled={disabled}
                onChange={handleChange}
                className="import-dropzone__input"
            />
            <span className="import-dropzone__icon">{meta.icon}</span>
            <span className="import-dropzone__label">{meta.label}</span>
            <span className="import-dropzone__desc">{meta.desc}</span>
            {hasFile
                ? <span className="import-dropzone__file">📄 {fileName}</span>
                : <span className="import-dropzone__hint">Glisser-déposer ou cliquer pour choisir</span>
            }
        </label>
    )
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function Import() {
    const {
        files,
        fileNames,
        setFile,
        logs,
        clearLogs,
        busy,
        dryRun,
        canImport,
        steps,
        currentStep,
        doneSteps,
        errorStep,
        handleImport,
    } = useImport()

    const hasAnyStep = currentStep !== null || doneSteps.size > 0

    return (
        <section className="import-page">
            <header className="import-header">
                <h1 className="import-header__title">Import de données GLPI</h1>
                <p className="import-header__sub">
                    Importer les 3 fichiers CSV dans l'ordre pour peupler GLPI avec les assets, tickets et coûts.
                </p>
                {dryRun && (
                    <div className="import-dryrun-badge">
                        🧪 Mode DRY-RUN actif — aucune donnée ne sera insérée en base
                    </div>
                )}
            </header>

            {/* ── Dropzones ────────────────────────────────────────────── */}
            <div className="import-dropzones">
                {FILE_META.map(meta => (
                    <Dropzone
                        key={meta.slot}
                        meta={meta}
                        fileName={fileNames[meta.slot]}
                        onChange={file => setFile(meta.slot, file)}
                        disabled={busy}
                    />
                ))}
            </div>

            {/* ── Stepper ──────────────────────────────────────────────── */}
            {hasAnyStep && (
                <div className="import-stepper-wrap">
                    <ImportStepper
                        steps={steps}
                        current={currentStep}
                        done={doneSteps}
                        error={errorStep}
                    />
                </div>
            )}

            {/* ── Actions ──────────────────────────────────────────────── */}
            <div className="import-actions">
                <button
                    className="import-btn import-btn--primary"
                    onClick={handleImport}
                    disabled={!canImport}
                >
                    {busy
                        ? <><span className="import-spinner" /> Import en cours…</>
                        : `Importer${dryRun ? " (DRY-RUN)" : ""}`
                    }
                </button>

                {logs.length > 0 && (
                    <button
                        className="import-btn import-btn--ghost"
                        onClick={clearLogs}
                        disabled={busy}
                    >
                        🗑 Vider les logs
                    </button>
                )}
            </div>

            {/* ── Logs ─────────────────────────────────────────────────── */}
            <LogPanel logs={logs} onClear={clearLogs} maxHeight="400px" />
        </section>
    )
}