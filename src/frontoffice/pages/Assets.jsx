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
    user_tech: "",
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
        contains(asset.user_tech, filters.user_tech) &&
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
                <Input label="Technicien" value={filters.user_tech} onChange={set("user_tech")} />
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
                <div className="table-responsive" style={{ overflowX: "auto", marginTop: "2rem" }}>
                    <table className="assets-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                        <thead style={{ background: "var(--bg-light)", borderBottom: "2px solid var(--border)" }}>
                            <tr>
                                <th style={{ padding: "1rem" }}>ID</th>
                                <th style={{ padding: "1rem" }}>Type</th>
                                <th style={{ padding: "1rem" }}>Nom</th>
                                <th style={{ padding: "1rem" }}>Série</th>
                                <th style={{ padding: "1rem" }}>Entité</th>
                                <th style={{ padding: "1rem" }}>Localisation</th>
                                <th style={{ padding: "1rem" }}>Utilisateur</th>
                                <th style={{ padding: "1rem" }}>Fabricant</th>
                                <th style={{ padding: "1rem" }}>Modèle</th>
                                <th style={{ padding: "1rem" }}>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(asset => (
                                <tr key={`${asset.type}-${asset.id}`} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-light)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>#{asset.id}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.85rem" }}>
                                            {asset.typeLabel}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem", fontWeight: "600" }}>{asset.name}</td>
                                    <td style={{ padding: "1rem" }}>{asset.serial || "—"}</td>
                                    <td style={{ padding: "1rem" }}>{asset.entity || "—"}</td>
                                    <td style={{ padding: "1rem" }}>{asset.location || "—"}</td>
                                    <td style={{ padding: "1rem" }}>{asset.user || "—"}</td>
                                    <td style={{ padding: "1rem" }}>{asset.manufacturer || "—"}</td>
                                    <td style={{ padding: "1rem" }}>{asset.model || "—"}</td>
                                    <td style={{ padding: "1rem" }}>{asset.status || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}