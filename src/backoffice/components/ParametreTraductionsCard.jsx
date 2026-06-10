export default function ParametreTraductionsCard({
    selectedLangue,
    statuts,
    traductions,
    nomNouvelleLangue,
    status,
    onNomNouvelleLangueChange,
    onSave,
    onClearEdit,
    onTraductionChange,
}) {
    return (
        <div className="card card-highlighted">
            <h2>
                Traductions
                {selectedLangue && <span className="badge">{selectedLangue.nom}</span>}
            </h2>
            <form onSubmit={onSave} className="card-form">
                {!selectedLangue && (
                    <input
                        value={nomNouvelleLangue}
                        onChange={e => onNomNouvelleLangueChange(e.target.value)}
                        placeholder="Nom de la nouvelle langue"
                    />
                )}
                <button type="submit">
                    {selectedLangue ? "Mettre a jour" : "Creer langue"}
                </button>
                {selectedLangue && (
                    <button type="button" className="btn-ghost" onClick={onClearEdit}>
                        Annuler
                    </button>
                )}
            </form>
            <ul className="item-list">
                {statuts.map(s => (
                    <li key={s.id} className="trad-row">
                        <b>{s.nom}</b>
                        <input
                            className="trad-input"
                            value={traductions[s.id] || ""}
                            onChange={e => onTraductionChange(s.id, e.target.value)}
                        />
                    </li>
                ))}
            </ul>
            {status && <p className="status-msg">{status}</p>}
        </div>
    )
}
