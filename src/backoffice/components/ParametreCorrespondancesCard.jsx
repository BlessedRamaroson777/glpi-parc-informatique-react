export default function ParametreCorrespondancesCard({ allTrads }) {
    return (
        <div className="card">
            <h2>Correspondances</h2>
            <ul className="item-list">
                {allTrads.map(t => (
                    <li key={t.id}>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{t.langueNom}</span>
                        <span>{t.statutNom}</span>
                        <span style={{ fontWeight: 500 }}>{t.valeur || "-"}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
