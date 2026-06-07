import React from "react"
import { getAllAssets } from "../services/assetsService.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"
import "../styles/assets.css"

const EMPTY_FILTERS = {
    type: "all",
    name: "",
    serial: "",
    entity: "",
    location: "",
    user: "",
    // user_tech: "",
    manufacturer: "",
    model: "",
    status: "",
}

function Input({ label, value, onChange }) {
    return (
        <div className="filter-field">
            <label>{label}</label>
            <input type="text" value={value} onChange={onChange} />
        </div>
    )
}

function DropdownFilter({ label, value, onChange, options }) {
    return (
        <div className="filter-field">
            <label>{label}</label>
            <select value={value} onChange={onChange}>
                <option value="">Tous</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
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
        
    const exactMatch = (field, val) =>
        !val || (field ?? "") === val

    return (
        (filters.type === "all" || asset.type === filters.type) &&
        contains(asset.name, filters.name) &&
        contains(asset.serial, filters.serial) &&
        contains(asset.user, filters.user) &&
        // contains(asset.user_tech, filters.user_tech) &&
        exactMatch(asset.status, filters.status) &&
        exactMatch(asset.location, filters.location) &&
        exactMatch(asset.manufacturer, filters.manufacturer) &&
        exactMatch(asset.model, filters.model) &&
        exactMatch(asset.entity, filters.entity)
    )
}

function getUniqueValues(assets, key) {
    const values = assets.map(a => a[key]).filter(Boolean)
    return [...new Set(values)].sort()
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
    
    const locations = getUniqueValues(assets, "location")
    const entities = getUniqueValues(assets, "entity")
    const manufacturers = getUniqueValues(assets, "manufacturer")
    const models = getUniqueValues(assets, "model")
    const statuses = getUniqueValues(assets, "status")

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
                <Input label="Série" value={filters.serial} onChange={set("serial")} />
                <DropdownFilter label="Entité" value={filters.entity} onChange={set("entity")} options={entities} />
                <DropdownFilter label="Localisation" value={filters.location} onChange={set("location")} options={locations} />
                <Input label="Utilisateur" value={filters.user} onChange={set("user")} />
                {/* <Input label="Technicien" value={filters.user_tech} onChange={set("user_tech")} /> */}
                <DropdownFilter label="Fabricant" value={filters.manufacturer} onChange={set("manufacturer")} options={manufacturers} />
                <DropdownFilter label="Modèle" value={filters.model} onChange={set("model")} options={models} />
                <DropdownFilter label="Statut" value={filters.status} onChange={set("status")} options={statuses} />
            </div>

            {/* LISTE */}
            {loading ? (
                <p className="loading">Chargement…</p>
            ) : filtered.length === 0 ? (
                <p className="empty">Aucun élément trouvé</p>
            ) : (
                <div className="table-responsive">
                    <table className="assets-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Type</th>
                                <th>Nom</th>
                                <th>Série</th>
                                <th>Entité</th>
                                <th>Localisation</th>
                                <th>Utilisateur</th>
                                <th>Fabricant</th>
                                <th>Modèle</th>
                                <th>Statut</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filtered.map(asset => (
                                <tr key={`${asset.type}-${asset.id}`}>
                                    <td className="asset-id">#{asset.id}</td>

                                    <td>
                                        <span className="asset-type">
                                            {asset.typeLabel}
                                        </span>
                                    </td>

                                    <td className="asset-name">
                                        {asset.name}
                                    </td>

                                    <td>{asset.serial || "—"}</td>
                                    <td>{asset.entity || "—"}</td>
                                    <td>{asset.location || "—"}</td>
                                    <td>{asset.user || "—"}</td>
                                    <td>{asset.manufacturer || "—"}</td>
                                    <td>{asset.model || "—"}</td>
                                    <td>{asset.status || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}