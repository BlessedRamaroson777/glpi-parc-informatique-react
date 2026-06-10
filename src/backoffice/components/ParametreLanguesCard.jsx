export default function ParametreLanguesCard({
    nomLangue,
    onNomLangueChange,
    onCreateLangue,
    langues,
    onSelectLangue,
    onDeleteLangue,
}) {
    return (
        <div className="card">
            <h2>Langues</h2>
            <form onSubmit={onCreateLangue} className="card-form">
                <input
                    value={nomLangue}
                    onChange={e => onNomLangueChange(e.target.value)}
                    placeholder="Nom de la langue"
                />
                <button type="submit">Ajouter</button>
            </form>
            <ul className="item-list">
                {langues.map(l => (
                    <li key={l.id}>
                        <span>{l.nom}</span>
                        <div className="actions">
                            <button onClick={() => onSelectLangue(l)}>Editer</button>
                            <button onClick={() => onDeleteLangue(l.id)}>Supprimer</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
