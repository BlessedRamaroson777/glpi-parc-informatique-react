import React, { useRef } from "react"
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

    // Références pour manipuler la valeur textuelle des inputs natifs
    const file1Ref = useRef(null)
    const file2Ref = useRef(null)
    const file3Ref = useRef(null)
    const file4Ref = useRef(null)

    const hasAnyStep = currentStep !== null || doneSteps.size > 0

    // Nettoie à la fois le hook d'importation et l'état visuel du DOM
    function handleClearFile(key, inputRef) {
        setFile(key, null)
        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }

    return (
        <section className="import-page">
            <h1>Import des données</h1>

            <div className="import-form">
                
                {/* CHAMP 1 : ÉQUIPEMENTS */}
                <div className="file-field-group">
                    <label>
                        Fichier des équipements
                        <input
                            type="file"
                            accept=".csv"
                            ref={file1Ref}
                            disabled={busy}
                            onChange={e => setFile("file1", e.target.files[0] || null)}
                        />
                    </label>
                    {fileNames?.file1 && (
                        <button
                            type="button"
                            className="clear-file-btn"
                            disabled={busy}
                            onClick={() => handleClearFile("file1", file1Ref)}
                        >
                            Reinitialiser
                        </button>
                    )}
                </div>

                {/* CHAMP 2 : TICKETS */}
                <div className="file-field-group">
                    <label>
                        Fichier des tickets
                        <input
                            type="file"
                            accept=".csv"
                            ref={file2Ref}
                            disabled={busy}
                            onChange={e => setFile("file2", e.target.files[0] || null)}
                        />
                    </label>
                    {fileNames?.file2 && (
                        <button
                            type="button"
                            className="clear-file-btn"
                            disabled={busy}
                            onClick={() => handleClearFile("file2", file2Ref)}
                        >
                            Reinitialiser
                        </button>
                    )}
                </div>

                {/* CHAMP 3 : COÛTS */}
                <div className="file-field-group">
                    <label>
                        Fichier des coûts
                        <input
                            type="file"
                            accept=".csv"
                            ref={file3Ref}
                            disabled={busy}
                            onChange={e => setFile("file3", e.target.files[0] || null)}
                        />
                    </label>
                    {fileNames?.file3 && (
                        <button
                            type="button"
                            className="clear-file-btn"
                            disabled={busy}
                            onClick={() => handleClearFile("file3", file3Ref)}
                        >
                            Reinitialiser
                        </button>
                    )}
                </div>
                
                {/* CHAMP 4 : IMAGES */}
                <div className="file-field-group">
                    <label>
                        Fichier des images
                        <input
                            type="file"
                            accept=".zip"
                            ref={file4Ref}
                            disabled={busy}
                            onChange={e => setFile("file4", e.target.files[0] || null)}
                        />
                    </label>
                    {fileNames?.file4 && (
                        <button
                            type="button"
                            className="clear-file-btn"
                            disabled={busy}
                            onClick={() => handleClearFile("file4", file4Ref)}
                        >
                            Reinitialiser
                        </button>
                    )}
                </div>

                <button onClick={handleImport} disabled={!canImport || busy} className="import-submit-btn">
                    Importer
                </button>
            </div>

            {busy && <p className="import-status">Import en cours...</p>}

            <LogPanel
                logs={logs}
                onClear={clearLogs}
                maxHeight="300px"
            />
        </section>
    )
}