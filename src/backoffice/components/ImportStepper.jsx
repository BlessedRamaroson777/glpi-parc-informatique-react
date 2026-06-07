/**
 * ImportStepper — indicateur d'avancement multi-étapes.
 *
 * Props :
 *   steps    — array de { key: string, label: string, icon?: string }
 *   current  — key de l'étape en cours (null = pas commencé)
 *   done     — Set<key> des étapes terminées
 *   error    — key de l'étape en erreur (null si aucune)
 */
export default function ImportStepper({ steps = [], current = null, done = new Set(), error = null }) {
    return (
        <ol className="import-stepper">
            {steps.map((step, i) => {
                const isDone    = done.has(step.key)
                const isActive  = current === step.key
                const isError   = error === step.key
                const isPending = !isDone && !isActive && !isError

                let status = "pending"
                if (isDone)   status = "done"
                if (isActive) status = "active"
                if (isError)  status = "error"

                return (
                    <li key={step.key} className={`import-stepper__step import-stepper__step--${status}`}>
                        <span className="import-stepper__badge">
                            {isDone  ? "✓" :
                             isError ? "✕" :
                             isActive ? <span className="import-stepper__spinner" /> :
                             i + 1}
                        </span>
                        <span className="import-stepper__label">{step.label}</span>
                        {i < steps.length - 1 && (
                            <span className="import-stepper__connector" />
                        )}
                    </li>
                )
            })}
        </ol>
    )
}
