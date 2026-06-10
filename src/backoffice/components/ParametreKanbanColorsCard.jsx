const STATUS_OPTIONS = [
    { key: "status1", label: "Nouveau" },
    { key: "status2", label: "En cours attribue" },
    { key: "status5", label: "Resolu" },
]

export default function ParametreKanbanColorsCard({
    colors,
    saving,
    message,
    onColorChange,
    onSave,
    onReset,
}) {
    return (
        <div className="card">
            <h2>Couleurs Kanban</h2>
            <form className="card-form card-form-column" onSubmit={onSave}>
                <div className="kanban-colors-grid">
                    {STATUS_OPTIONS.map(option => (
                        <label key={option.key} className="color-field">
                            <span>{option.label}</span>
                            <input
                                type="color"
                                value={colors[option.key]}
                                onChange={e => onColorChange(option.key, e.target.value)}
                            />
                            <small>{colors[option.key]}</small>
                        </label>
                    ))}
                </div>
                <div className="actions">
                    <button type="submit" disabled={saving}>
                        {saving ? "Sauvegarde..." : "Sauvegarder"}
                    </button>
                    <button type="button" className="btn-ghost" onClick={onReset} disabled={saving}>
                        Reinitialiser
                    </button>
                </div>
            </form>
            {message && <p className="status-msg">{message}</p>}
        </div>
    )
}
