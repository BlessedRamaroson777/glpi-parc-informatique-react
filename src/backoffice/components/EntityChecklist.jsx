/**
 * EntityChecklist — liste de checkboxes pour sélectionner des entités GLPI.
 *
 * Props :
 *   entities      — array de { key, label, endpoint, group?, description? }
 *   selected      — { [key]: boolean }
 *   onToggle      — (key) => void
 *   onToggleAll   — () => void
 *   allSelected   — boolean
 *   showEndpoint  — boolean (affiche l'endpoint sous le label, défaut : true)
 *   showGroup     — boolean (affiche les groupes, défaut : true)
 */
export default function EntityChecklist({
    entities = [],
    selected  = {},
    onToggle,
    onToggleAll,
    allSelected   = false,
    showEndpoint  = true,
    showGroup     = true,
}) {
    // Regrouper par group
    const groups = entities.reduce((acc, entity) => {
        const g = entity.group ?? "Autres"
        if (!acc[g]) acc[g] = []
        acc[g].push(entity)
        return acc
    }, {})

    return (
        <div className="entity-checklist">
            {/* Tout sélectionner */}
            <label className="entity-checklist__toggle-all">
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleAll}
                />
                <strong>Tout sélectionner</strong>
            </label>

            {/* Groupes */}
            {Object.entries(groups).map(([groupName, items]) => (
                <div key={groupName} className="entity-checklist__group">
                    {showGroup && (
                        <p className="entity-checklist__group-title">{groupName}</p>
                    )}
                    <div className="entity-checklist__grid">
                        {items.map(entity => (
                            <label key={entity.key} className="entity-checklist__item">
                                <input
                                    type="checkbox"
                                    checked={Boolean(selected[entity.key])}
                                    onChange={() => onToggle(entity.key)}
                                />
                                <span className="entity-checklist__info">
                                    <span className="entity-checklist__label">{entity.label}</span>
                                    {showEndpoint && entity.endpoint && (
                                        <code className="entity-checklist__endpoint">
                                            {entity.endpoint}
                                        </code>
                                    )}
                                    {entity.description && (
                                        <span className="entity-checklist__desc">
                                            {entity.description}
                                        </span>
                                    )}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
