import { useEffect, useState } from "react"
import "../styles/parametre.css"

const API = "http://localhost:5050"

export default function Parametre() {
    const [langues,  setLangues]  = useState([])
    const [statuts,  setStatuts]  = useState([])

    const [nomLangue, setNomLangue] = useState("")
    const [nomStatut, setNomStatut] = useState("")
    const [externalId, setExternalId] = useState("")

    const [selectedLangue, setSelectedLangue] = useState(null)
    const [traductions, setTraductions] = useState({})
    const [status, setStatus] = useState("")

    async function loadLangues() {
        const r = await fetch(`${API}/api/langues`)
        const d = await r.json()
        setLangues(d.langues || [])
    }

    async function loadStatuts() {
        const r = await fetch(`${API}/api/statuts`)
        const d = await r.json()
        setStatuts(d.statuts || [])
    }

    useEffect(() => { loadLangues(); loadStatuts() }, [])

    // ── Langues ──────────────────────────────────────────────────────────
    async function createLangue(e) {
        e.preventDefault()
        if (!nomLangue.trim()) return
        await fetch(`${API}/api/langues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nom: nomLangue }),
        })
        setNomLangue("")
        loadLangues()
    }

    async function deleteLangue(id) {
        await fetch(`${API}/api/langues/${id}`, { method: "DELETE" })
        loadLangues()
    }

    // ── Statuts ──────────────────────────────────────────────────────────
    async function createStatut(e) {
        e.preventDefault()
        if (!nomStatut.trim()) return
        await fetch(`${API}/api/statuts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nom: nomStatut, externalId }),
        })
        setNomStatut(""); setExternalId("")
        loadStatuts()
    }

    async function deleteStatut(id) {
        await fetch(`${API}/api/statuts/${id}`, { method: "DELETE" })
        loadStatuts()
    }

    // ── Traductions ───────────────────────────────────────────────────────
    async function selectLangue(l) {
        setSelectedLangue(l)
        const r = await fetch(`${API}/api/langue-statut/langue/${l.id}`)
        const d = await r.json()
        const map = {}
        d.langueStatut.forEach(x => { map[x.statutId] = x.valeur })
        setTraductions(map)
    }

    function clearEdit() {
        setSelectedLangue(null); setTraductions({}); setStatus("")
    }

    async function saveLangueStatut(e) {
        e.preventDefault()
        setStatus("Saving...")

        let langueId = selectedLangue?.id

        if (!langueId) {
            if (!nomLangue.trim()) {
                setStatus("Entrez un nom de langue")
                return
            }
            const r = await fetch(`${API}/api/langues`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom: nomLangue }),
            })
            const d = await r.json()
            langueId = d.id
            setNomLangue("")
            loadLangues()
        }

        const payload = statuts.map(s => ({
            statutId: s.id,
            valeur: traductions[s.id] || "",
        }))

        await fetch(`${API}/api/langue-statut/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ langueId, traductions: payload }),
        })

        setStatus("Sauvegardé ✓")
        clearEdit()
        loadLangues()
    }

    return (
        <div className="parametre-page">
            <h1>Paramètres</h1>

            <div className="parametre-grid">

                {/* Langues */}
                <div className="card">
                    <h2>Langues</h2>
                    <form onSubmit={createLangue} className="card-form">
                        <input
                            value={nomLangue}
                            onChange={e => setNomLangue(e.target.value)}
                            placeholder="Nom de la langue"
                        />
                        <button type="submit">Ajouter</button>
                    </form>
                    <ul className="item-list">
                        {langues.map(l => (
                            <li key={l.id}>
                                <span>{l.nom}</span>
                                <div className="actions">
                                    <button onClick={() => selectLangue(l)}>Éditer</button>
                                    <button onClick={() => deleteLangue(l.id)}>Supprimer</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Statuts */}
                <div className="card">
                    <h2>Statuts</h2>
                    <form onSubmit={createStatut} className="card-form">
                        <input
                            value={nomStatut}
                            onChange={e => setNomStatut(e.target.value)}
                            placeholder="Nom"
                        />
                        <input
                            value={externalId}
                            onChange={e => setExternalId(e.target.value)}
                            placeholder="ID externe"
                        />
                        <button type="submit">Ajouter</button>
                    </form>
                    <ul className="item-list">
                        {statuts.map(s => (
                            <li key={s.id}>
                                <span>{s.nom} <small style={{ color: "#9ca3af" }}>({s.externalId})</small></span>
                                <button onClick={() => deleteStatut(s.id)}>Supprimer</button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Traductions */}
                <div className="card" style={{ borderColor: "var(--primary)", borderWidth: 2 }}>
                    <h2>
                        Traductions
                        {selectedLangue && <span className="badge">{selectedLangue.nom}</span>}
                    </h2>
                    <form onSubmit={saveLangueStatut} className="card-form">
                        {!selectedLangue && (
                            <input
                                value={nomLangue}
                                onChange={e => setNomLangue(e.target.value)}
                                placeholder="Nom de la nouvelle langue"
                            />
                        )}
                        <button type="submit">
                            {selectedLangue ? "Mettre à jour" : "Créer langue"}
                        </button>
                        {selectedLangue && (
                            <button type="button" className="btn-ghost" onClick={clearEdit}>
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
                                    onChange={e => setTraductions(p => ({ ...p, [s.id]: e.target.value }))}
                                />
                            </li>
                        ))}
                    </ul>
                    {status && <p className="status-msg">{status}</p>}
                </div>

            </div>
        </div>
    )
}