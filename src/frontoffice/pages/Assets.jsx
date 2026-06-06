import React from "react"
import { getAllAssets } from "../services/assetsService.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"
import "../styles/assets.css"

const EMPTY_FILTERS = {
    name: "",
    type: "all",
    status: "",
    location: "",
    user: "",
    user_tech: "",
    manufacturer: "",
    model: "",
    serial: "",
    entity: "",
}

function Input({ label, value, onChange }) {
    return (
        <div className="filter-field">
            <label>{label}</label>
            <input type="text" value={value} onChange={onChange} />
        </div>
    )
}

function fmt(iso) {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("fr-FR")
}

function matches(asset, filters) {
    const contains = (field, val) =>
        !val || (field ?? "").toLowerCase().includes(val.toLowerCase())

    return (
        (filters.type === "all" || asset.type === filters.type) &&
        contains(asset.name, filters.name) &&
        contains(asset.status, filters.status) &&
        contains(asset.location, filters.location) &&
        contains(asset.user, filters.user) &&
        contains(asset.user_tech, filters.user_tech) &&
        contains(asset.manufacturer, filters.manufacturer) &&
        contains(asset.model, filters.model) &&
        contains(asset.serial, filters.serial) &&
        contains(asset.entity, filters.entity)
    )
}

export default function Assets() {
    const [assets, setAssets] = React.useState([])
    const [loading, setLoading] = React.useState(true)
    const [filters, setFilters] = React.useState(EMPTY_FILTERS)

    React.useEffect(() => {
        getAllAssets()
            .then(setAssets)
            .finally(() => setLoading(false))
    }, [])

    function set(key) {
        return e => setFilters(f => ({ ...f, [key]: e.target.value }))
    }

    function reset() {
        setFilters(EMPTY_FILTERS)
    }

    const filtered = assets.filter(a => matches(a, filters))
    const hasFilters = Object.entries(filters).some(([k, v]) =>
        k === "type" ? v !== "all" : v !== ""
    )

    return (
        <section className="assets-page">

            <div className="assets-header">
                <h1>Éléments</h1>
                <span>{filtered.length} résultat(s)</span>

                {hasFilters && (
                    <button onClick={reset}>Réinitialiser</button>
                )}
            </div>

            {/* FILTRES */}
            <div className="filters-grid">

                <div className="filter-field">
                    <label>Type</label>
                    <select value={filters.type} onChange={set("type")}>
                        <option value="all">Tous</option>
                        {ASSET_TYPES.map(t => (
                            <option key={t.key} value={t.key}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>

                <Input label="Nom" value={filters.name} onChange={set("name")} />
                <Input label="Statut" value={filters.status} onChange={set("status")} />
                <Input label="Localisation" value={filters.location} onChange={set("location")} />
                <Input label="Utilisateur" value={filters.user} onChange={set("user")} />
                <Input label="Technicien" value={filters.user_tech} onChange={set("user_tech")} />
                <Input label="Fabricant" value={filters.manufacturer} onChange={set("manufacturer")} />
                <Input label="Modèle" value={filters.model} onChange={set("model")} />
                <Input label="Série" value={filters.serial} onChange={set("serial")} />
                <Input label="Entité" value={filters.entity} onChange={set("entity")} />
            </div>

            {/* LISTE */}
            {loading ? (
                <p className="loading">Chargement…</p>
            ) : filtered.length === 0 ? (
                <p className="empty">Aucun élément trouvé</p>
            ) : (
                <ul className="assets-list">
                    {filtered.map(asset => (
                        <li key={`${asset.type}-${asset.id}`} className="asset-item">

                            <div className="asset-left">
                                <span className="asset-id">#{asset.id}</span>

                                <div>
                                    <div className="asset-name">{asset.name}</div>
                                    <div className="asset-meta">
                                        {[asset.location, asset.user, asset.serial]
                                            .filter(Boolean)
                                            .join(" · ") || "—"}
                                    </div>
                                </div>
                            </div>

                            <div className="asset-right">
                                <span className="badge">{asset.typeLabel}</span>
                                {asset.status && <span className="status">{asset.status}</span>}
                                <span className="date">{fmt(asset.date_creation)}</span>
                            </div>

                        </li>
                    ))}
                </ul>
            )}

        </section>
    )
}