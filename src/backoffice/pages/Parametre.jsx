import { useEffect, useState } from "react"
import "../styles/parametre.css"
import ParametreLanguesCard from "../components/ParametreLanguesCard.jsx"
import ParametreStatutsCard from "../components/ParametreStatutsCard.jsx"
import ParametreTraductionsCard from "../components/ParametreTraductionsCard.jsx"
import ParametreCorrespondancesCard from "../components/ParametreCorrespondancesCard.jsx"
import ParametreKanbanColorsCard from "../components/ParametreKanbanColorsCard.jsx"
import { DEFAULT_KANBAN_COLORS } from "../../common/constants/TicketConstants.jsx";

const API = "http://localhost:5050"
export default function Parametre() {
    const [langues,  setLangues]  = useState([])
    const [statuts,  setStatuts]  = useState([])

    const [nomLangue, setNomLangue] = useState("")
    const [nomNouvelleLangue, setNomNouvelleLangue] = useState("")
    const [nomStatut, setNomStatut] = useState("")
    const [externalId, setExternalId] = useState("")

    const [selectedLangue, setSelectedLangue] = useState(null)
    const [traductions, setTraductions] = useState({})
    const [status, setStatus] = useState("")

    const [allTrads, setAllTrads] = useState([])
    const [kanbanColors, setKanbanColors] = useState(DEFAULT_KANBAN_COLORS)
    const [kanbanMessage, setKanbanMessage] = useState("")
    const [savingColors, setSavingColors] = useState(false)

    async function requestJSON(url, options) {
        const response = await fetch(url, options)
        const data = await response.json()
        if (!response.ok) {
            throw new Error(data?.error || "Erreur API")
        }
        console.log(data)
        return data
    }

    async function loadLangues() {
                const d = await requestJSON(`${API}/api/langues`)
        setLangues(d.langues || [])
    }

    async function loadStatuts() {
                const d = await requestJSON(`${API}/api/statuts`)
        setStatuts(d.statuts || [])
    }

    async function loadAllTrads() {
            const d = await requestJSON(`${API}/api/langue-statut`)
      setAllTrads(d.langueStatut || [])
    }

        async function loadKanbanColors() {
                const d = await requestJSON(`${API}/api/kanban-colors`)
                setKanbanColors({ ...DEFAULT_KANBAN_COLORS, ...(d.colors || {}) })
        }

        useEffect(() => {
                loadLangues()
                loadStatuts()
                loadAllTrads()
                loadKanbanColors()
        }, [])


    // ── Langues ──────────────────────────────────────────────────────────
    async function createLangue(e) {
        e.preventDefault()
        if (!nomLangue.trim()) return
        await requestJSON(`${API}/api/langues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nom: nomLangue }),
        })
        setNomLangue("")
        await loadLangues()
    }

    async function deleteLangue(id) {
        await requestJSON(`${API}/api/langues/${id}`, { method: "DELETE" })
        await loadLangues()
        await loadAllTrads()
    }

    // ── Statuts ──────────────────────────────────────────────────────────
    async function createStatut(e) {
        e.preventDefault()
        if (!nomStatut.trim()) return
        await requestJSON(`${API}/api/statuts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nom: nomStatut, externalId }),
        })
        setNomStatut(""); setExternalId("")
        await loadStatuts()
    }

    async function deleteStatut(id) {
        await requestJSON(`${API}/api/statuts/${id}`, { method: "DELETE" })
        await loadStatuts()
        await loadAllTrads()
    }

    // ── Traductions ───────────────────────────────────────────────────────
    async function selectLangue(l) {
        setSelectedLangue(l)
        const d = await requestJSON(`${API}/api/langue-statut/langue/${l.id}`)
        const map = {}
        ;(d.langueStatut || []).forEach(x => { map[x.statutId] = x.valeur })
        setTraductions(map)
        setStatus("")
    }

    function clearEdit() {
        setSelectedLangue(null)
        setTraductions({})
        setNomNouvelleLangue("")
    }

    async function saveLangueStatut(e) {
        e.preventDefault()
        setStatus("Sauvegarde en cours...")

        try {
            let langueId = selectedLangue?.id

            if (!langueId) {
                if (!nomNouvelleLangue.trim()) {
                    setStatus("Entrez un nom de langue")
                    return
                }
                const d = await requestJSON(`${API}/api/langues`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nom: nomNouvelleLangue.trim() }),
                })
                langueId = d.id
                setNomNouvelleLangue("")
            }

            const payload = statuts.map(s => ({
                statutId: s.id,
                valeur: traductions[s.id] || "",
            }))

            await requestJSON(`${API}/api/langue-statut/bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ langueId, traductions: payload }),
            })

            setStatus("Sauvegarde reussie")
            clearEdit()
            await loadLangues()
            await loadAllTrads()
        } catch (error) {
            setStatus(error.message || "Erreur de sauvegarde")
        }
    }

    function updateColor(key, value) {
        setKanbanColors(prev => ({ ...prev, [key]: value }))
    }

    async function saveKanbanColors(e) {
        e.preventDefault()
        setSavingColors(true)
        setKanbanMessage("Sauvegarde en cours...")
        try {
            await requestJSON(`${API}/api/kanban-colors`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ colors: kanbanColors }),
            })
            // console.log(kanbanColors)
            setKanbanMessage("Couleurs sauvegardees")
        } catch (error) {
            setKanbanMessage(error.message || "Erreur de sauvegarde")
        } finally {
            setSavingColors(false)
        }
    }

    async function resetKanbanColors() {
        setKanbanColors(DEFAULT_KANBAN_COLORS)
        setSavingColors(true)
        setKanbanMessage("Reinitialisation en cours...")
        try {
            await requestJSON(`${API}/api/kanban-colors`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ colors: DEFAULT_KANBAN_COLORS }),
            })
            setKanbanMessage("Couleurs reinitialisees")
        } catch (error) {
            setKanbanMessage(error.message || "Erreur de reinitialisation")
        } finally {
            setSavingColors(false)
        }
    }

    return (
        <div className="parametre-page">
            <h1>Paramètres</h1>

            <div className="parametre-grid">
                <ParametreLanguesCard
                    nomLangue={nomLangue}
                    onNomLangueChange={setNomLangue}
                    onCreateLangue={createLangue}
                    langues={langues}
                    onSelectLangue={selectLangue}
                    onDeleteLangue={deleteLangue}
                />

                <ParametreStatutsCard
                    nomStatut={nomStatut}
                    externalId={externalId}
                    onNomStatutChange={setNomStatut}
                    onExternalIdChange={setExternalId}
                    onCreateStatut={createStatut}
                    statuts={statuts}
                    onDeleteStatut={deleteStatut}
                />

                <ParametreTraductionsCard
                    selectedLangue={selectedLangue}
                    statuts={statuts}
                    traductions={traductions}
                    nomNouvelleLangue={nomNouvelleLangue}
                    status={status}
                    onNomNouvelleLangueChange={setNomNouvelleLangue}
                    onSave={saveLangueStatut}
                    onClearEdit={clearEdit}
                    onTraductionChange={(statutId, valeur) => {
                        setTraductions(prev => ({ ...prev, [statutId]: valeur }))
                    }}
                />

                <ParametreCorrespondancesCard allTrads={allTrads} />

                <ParametreKanbanColorsCard
                    colors={kanbanColors}
                    saving={savingColors}
                    message={kanbanMessage}
                    onColorChange={updateColor}
                    onSave={saveKanbanColors}
                    onReset={resetKanbanColors}
                />

            </div>
        </div>
    )
}