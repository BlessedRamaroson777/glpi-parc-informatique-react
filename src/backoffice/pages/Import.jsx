import { useImport }      from "../hooks/useImport.jsx"
import LogPanel           from "../components/LogPanel.jsx"
import ImportStepper      from "../components/ImportStepper.jsx"
import "../styles/import.css"

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
            <h1>Import des données</h1>

            <div className="import-form">
                <label>
                    Fichier des équipements
                    <input
                        type="file"
                        accept=".csv"
                        onChange={e => setFile("file1", e.target.files[0])}
                    />
                </label>

                <label>
                    Fichier des tickets
                    <input
                        type="file"
                        accept=".csv"
                        onChange={e => setFile("file2", e.target.files[0])}
                    />
                </label>

                <label>
                    Fichier des coûts
                    <input
                        type="file"
                        accept=".csv"
                        onChange={e => setFile("file3", e.target.files[0])}
                    />
                </label>

                <button onClick={handleImport}>
                    Importer
                </button>
            </div>

            {busy && <p>Import en cours...</p>}

            <LogPanel
                logs={logs}
                onClear={clearLogs}
                maxHeight="300px"
            />
        </section>
    )
}