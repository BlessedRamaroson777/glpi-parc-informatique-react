import { useState, useCallback } from "react"
import { runFullImport, IMPORT_STEPS } from "../services/importService.jsx"

const DRY_RUN = false   // false = vrais POST ; true = DRY-RUN simulation

/**
 * useImport — hook encapsulant tout l'état et la logique de la page Import.
 *
 * Expose :
 *   files         — { file1, file2, file3 } textes CSV
 *   fileNames     — { file1, file2, file3 } noms de fichiers
 *   setFile       — (slot: 'file1'|'file2'|'file3', file: File) => void
 *   logs          — array de { msg, type }
 *   clearLogs     — () => void
 *   busy          — boolean
 *   currentStep   — clé de l'étape en cours
 *   doneSteps     — Set<key>
 *   errorStep     — clé ou null
 *   handleImport  — () => void
 *   dryRun        — boolean
 *   steps         — IMPORT_STEPS (pour le stepper)
 */
export function useImport() {
    const [files,       setFiles]       = useState({ file1: null, file2: null, file3: null, file4: null })
    const [fileNames,   setFileNames]   = useState({ file1: "",   file2: "",   file3: "",   file4: "" })
    const [logs,        setLogs]        = useState([])
    const [busy,        setBusy]        = useState(false)
    const [currentStep, setCurrentStep] = useState(null)
    const [doneSteps,   setDoneSteps]   = useState(new Set())
    const [errorStep,   setErrorStep]   = useState(null)

    // ── Gestion des fichiers ─────────────────────────────────────────────

    const setFile = useCallback((slot, file) => {
        if (!file) {
            setFiles(prev     => ({ ...prev, [slot]: null }))
            setFileNames(prev => ({ ...prev, [slot]: "" }))
            return
        }

        // file4 (ZIP) → garder le File binaire, pas le lire comme texte
        if (slot === "file4") {
            setFiles(prev     => ({ ...prev, [slot]: file }))
            setFileNames(prev => ({ ...prev, [slot]: file.name }))
            return
        }

        const reader = new FileReader()
        reader.onload = e => {
            setFiles(prev     => ({ ...prev, [slot]: e.target.result }))
            setFileNames(prev => ({ ...prev, [slot]: file.name }))
        }
        reader.readAsText(file, "UTF-8")
    }, [])

    // ── Logs ─────────────────────────────────────────────────────────────

    function pushLog(msg, type = "info") {
        setLogs(prev => [...prev, { msg, type, ts: Date.now() }])
    }

    function clearLogs() {
        setLogs([])
    }

    // ── Stepper ──────────────────────────────────────────────────────────

    function advanceStep(key) {
        setDoneSteps(prev => {
            const next = new Set(prev)
            if (currentStep) next.add(currentStep)
            return next
        })
        setCurrentStep(key)
    }

    // ── Action principale ─────────────────────────────────────────────────

    async function handleImport() {
        setBusy(true)
        setLogs([])
        setDoneSteps(new Set())
        setCurrentStep(null)
        setErrorStep(null)

        try {
            await runFullImport(
                { file1: files.file1, file2: files.file2, file3: files.file3, file4: files.file4 },
                pushLog,
                advanceStep,
                DRY_RUN
            )
            // Marquer la dernière étape comme terminée
            setDoneSteps(prev => {
                const next = new Set(prev)
                IMPORT_STEPS.forEach(s => next.add(s.key))
                return next
            })
            setCurrentStep(null)
        } catch (err) {
            pushLog(`Erreur fatale : ${err.message}`, "error")
            setErrorStep(currentStep)
        } finally {
            setBusy(false)
        }
    }

    const canImport = Boolean(files.file1 || files.file2 || files.file3 || files.file4) && !busy

    return {
        // fichiers
        files,
        fileNames,
        setFile,
        // logs
        logs,
        clearLogs,
        // état
        busy,
        dryRun: DRY_RUN,
        canImport,
        // stepper
        steps: IMPORT_STEPS,
        currentStep,
        doneSteps,
        errorStep,
        // action
        handleImport,
    }
}
