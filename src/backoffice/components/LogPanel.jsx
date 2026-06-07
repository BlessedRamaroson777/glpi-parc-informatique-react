/**
 * LogPanel — composant réutilisable de console de logs.
 *
 * Props :
 *   logs    — array de { msg: string, type: 'info'|'success'|'warn'|'error' }
 *   onClear — callback pour vider les logs (optionnel)
 *   maxHeight — CSS max-height (défaut : "300px")
 */
export default function LogPanel({ logs = [], onClear, maxHeight = "300px" }) {
    if (!logs.length) return null

    return (
        <div className="log-panel" style={{ maxHeight }}>
            {onClear && (
                <button
                    className="log-panel__clear"
                    onClick={onClear}
                    title="Vider les logs"
                >
                    ✕
                </button>
            )}
            <div className="log-panel__body">
                {logs.map((entry, i) => (
                    <div key={i} className={`log-entry log-entry--${entry.type}`}>
                        <span className="log-entry__text">{entry.msg}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
