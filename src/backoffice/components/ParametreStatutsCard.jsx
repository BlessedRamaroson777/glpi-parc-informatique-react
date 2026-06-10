export default function ParametreStatutsCard({
    nomStatut,
    externalId,
    onNomStatutChange,
    onExternalIdChange,
    onCreateStatut,
    statuts,
    onDeleteStatut,
}) {
    return (
        <div className="card">
            <h2>Statuts</h2>
            <form onSubmit={onCreateStatut} className="card-form">
                <input
                    value={nomStatut}
                    onChange={e => onNomStatutChange(e.target.value)}
                    placeholder="Nom"
                />
                <input
                    value={externalId}
                    onChange={e => onExternalIdChange(e.target.value)}
                    placeholder="ID externe"
                />
                <button type="submit">Ajouter</button>
            </form>
            <ul className="item-list">
                {statuts.map(s => (
                    <li key={s.id}>
                        <span>{s.nom} <small style={{ color: "#9ca3af" }}>({s.externalId})</small></span>
                        <button onClick={() => onDeleteStatut(s.id)}>Supprimer</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
