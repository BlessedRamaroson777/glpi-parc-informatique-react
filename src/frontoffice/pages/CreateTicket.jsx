import React, { useState, useEffect } from "react";
import { 
    createTicket, 
    linkElementToTicket,
    getITILCategories,
    getRequestTypes,
    getLocations,
    getUsers
} from "../services/ticketsService.jsx";
import { getAllAssets } from "../services/assetsService.jsx";
import "../styles/create-ticket.css";
import apiV1 from "../../common/utils/apiV1.jsx";

export default function CreateTicket({ statusTicket: propStatusTicket }) {
    const [formData, setFormData] = useState({
        name: "",
        content: "",
        type: 1, // 1 = Incident, 2 = Demande
        urgency: 3, // 1 = Très basse, 5 = Très haute
        impact: 3, 
        priority: 3, 
        status: propStatusTicket ?? 1, // 1 = Nouveau, 2 = Attribué, etc.
        requesttypes_id: 1, // par défaut Helpdesk (1)
        itilcategories_id: 0,
        locations_id: 0,
        date: new Date().toISOString().slice(0, 16), // date courante modifiable (format datetime-local YYYY-MM-DDTHH:MM)
        // Acteurs
        _users_id_requester: "",
        _users_id_observer: "",
        _users_id_assign: "",
    });

    const [allAssets, setAllAssets] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(propStatusTicket ?? null);
    const [showDropdown, setShowDropdown] = useState(false);

    // Listes de référentiels chargées depuis GLPI
    const [categories, setCategories] = useState([]);
    const [requestTypes, setRequestTypes] = useState([]);
    const [locations, setLocations] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        // Chargement initial de tous les référentiels
        getAllAssets().then(setAllAssets).catch(console.error);
        getITILCategories().then(setCategories).catch(console.error);
        getRequestTypes().then(setRequestTypes).catch(console.error);
        getLocations().then(setLocations).catch(console.error);
        getUsers().then(setUsers).catch(console.error);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: ["type", "urgency", "impact", "priority", "status", "requesttypes_id", "itilcategories_id", "locations_id", "_users_id_requester", "_users_id_observer", "_users_id_assign"].includes(name) 
                ? (value === "" ? "" : parseInt(value, 10)) 
                : value,
        }));
    };

    const handleAssetSelect = (e) => {
        const val = e.target.value;
        if (!val) return;
        
        const [type, id] = val.split("-");
        const asset = allAssets.find(a => a.type === type && String(a.id) === id);
        
        if (asset && !selectedAssets.some((a) => a.id === asset.id && a.type === asset.type)) {
            setSelectedAssets((prev) => [...prev, asset]);
        }
        e.target.value = ""; // Reset de la sélection
    };

    const formatUserName = (u) => {
        const parts = [u.firstname, u.realname].filter(Boolean);
        if (parts.length > 0) return parts.join(" ");
        return u.name || u.login || u.username || `Utilisateur #${u.id}`;
    };

    const removeAsset = (assetToRemove) => {
        setSelectedAssets((prev) => 
            prev.filter(a => !(a.id === assetToRemove.id && a.type === assetToRemove.type))
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.content.trim()) {
            setStatus({ type: 'error', message: 'Veuillez remplir le titre et la description.' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            // Mettre en forme la date attendue par GLPI (YYYY-MM-DD HH:MM:SS)
            const formattedDate = formData.date.replace("T", " ") + ":00";
            
            // Construire le payload
            const payload = {
                name: formData.name,
                content: formData.content,
                type: formData.type,
                urgency: formData.urgency,
                impact: formData.impact,
                priority: formData.priority,
                status: formData.status,
                date: formattedDate,
                date_creation: formattedDate,
            };

            if (formData.requesttypes_id) payload.requesttypes_id = formData.requesttypes_id;
            if (formData.itilcategories_id) payload.itilcategories_id = formData.itilcategories_id;
            if (formData.locations_id) payload.locations_id = formData.locations_id;

            // 1. Créer le ticket
            const ticketRes = await createTicket(payload);
            const ticketId = ticketRes?.id;

            if (!ticketId) {
                throw new Error("L'ID du ticket n'a pas pu être récupéré.");
            }

            // 2. Lier les acteurs (Requesters, Observers, Assignees)
            // L'API GLPI requiert d'insérer dans Ticket_User pour lier des acteurs multiples,
            // ou de passer les champs `_users_id_requester`, `_users_id_observer`, `_users_id_assign` sous forme de tableaux ou IDs si géré par apiV1.
            // On peut créer des liaisons Ticket_User : type=1 (Requester), type=2 (Assignee), type=3 (Observer)
            // Faisons-le de manière robuste avec apiV1.createItem("Ticket_User") :
            const actorPromises = [];
            if (formData._users_id_requester) {
                actorPromises.push(apiV1.createItem("Ticket_User", { input: { tickets_id: ticketId, users_id: formData._users_id_requester, type: 1 } }));
            }
            if (formData._users_id_observer) {
                actorPromises.push(apiV1.createItem("Ticket_User", { input: { tickets_id: ticketId, users_id: formData._users_id_observer, type: 3 } }));
            }
            if (formData._users_id_assign) {
                actorPromises.push(apiV1.createItem("Ticket_User", { input: { tickets_id: ticketId, users_id: formData._users_id_assign, type: 2 } }));
            }
            if (actorPromises.length > 0) {
                await Promise.all(actorPromises);
            }

            // 3. Lier les éléments sélectionnés
            if (selectedAssets.length > 0) {
                const linkPromises = selectedAssets.map(asset => 
                    linkElementToTicket(ticketId, asset.type, asset.id)
                );
                await Promise.all(linkPromises);
            }

            setStatus({ 
                type: 'success', 
                message: `Ticket #${ticketId} créé avec succès.` 
            });
            
            // Réinitialiser
            setFormData({
                name: "",
                content: "",
                type: 1,
                urgency: 3,
                impact: 3,
                priority: 3,
                status: 1,
                requesttypes_id: 1,
                itilcategories_id: 0,
                locations_id: 0,
                date: new Date().toISOString().slice(0, 16),
                _users_id_requester: "",
                _users_id_observer: "",
                _users_id_assign: "",
            });
            setSelectedAssets([]);
            
        } catch (error) {
            setStatus({ type: 'error', message: 'Erreur lors de la création du ticket : ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const filteredAssets = searchQuery.trim() === "" 
        ? [] 
        : allAssets.filter(asset => 
            asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            asset.serial?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10);

    return (
        <section className="create-ticket-page">
            <div className="ticket-form-card">
                <div className="ticket-header">
                    <h1>Créer un Ticket</h1>
                    <p>Interface de création calquée sur le standard GLPI</p>
                </div>

                {status && (
                    <div className={`status-message ${status.type}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Première rangée : Date, Type, Catégorie */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Date d'ouverture</label>
                            <input 
                                type="datetime-local" 
                                name="date" 
                                className="form-control" 
                                value={formData.date} 
                                onChange={handleInputChange} 
                            />
                        </div>
                        <div className="form-group">
                            <label>Type</label>
                            <select name="type" className="form-control" value={formData.type} onChange={handleInputChange}>
                                <option value={1}>Incident</option>
                                <option value={2}>Demande</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Catégorie</label>
                            <select name="itilcategories_id" className="form-control" value={formData.itilcategories_id} onChange={handleInputChange}>
                                <option value={0}>-----</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.completename || c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Deuxième rangée : Statut, Source de la demande, Lieu */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Statut</label>
                            <select name="status" className="form-control" value={formData.status} onChange={handleInputChange}>
                                <option value={1}>Nouveau</option>
                                <option value={2}>Attribué</option>
                                <option value={3}>Planifié</option>
                                <option value={4}>En attente</option>
                                <option value={5}>Résolu</option>
                                <option value={6}>Clos</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Source de la demande</label>
                            <select name="requesttypes_id" className="form-control" value={formData.requesttypes_id} onChange={handleInputChange}>
                                {requestTypes.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Lieu</label>
                            <select name="locations_id" className="form-control" value={formData.locations_id} onChange={handleInputChange}>
                                <option value={0}>-----</option>
                                {locations.map(l => (
                                    <option key={l.id} value={l.id}>{l.completename || l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Troisième rangée : Urgence, Impact, Priorité */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Urgence</label>
                            <select name="urgency" className="form-control" value={formData.urgency} onChange={handleInputChange}>
                                <option value={1}>Très basse</option>
                                <option value={2}>Basse</option>
                                <option value={3}>Moyenne</option>
                                <option value={4}>Haute</option>
                                <option value={5}>Très haute</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Impact</label>
                            <select name="impact" className="form-control" value={formData.impact} onChange={handleInputChange}>
                                <option value={1}>Très bas</option>
                                <option value={2}>Bas</option>
                                <option value={3}>Moyen</option>
                                <option value={4}>Haut</option>
                                <option value={5}>Très haut</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Priorité</label>
                            <select name="priority" className="form-control" value={formData.priority} onChange={handleInputChange}>
                                <option value={1}>Très basse</option>
                                <option value={2}>Basse</option>
                                <option value={3}>Moyenne</option>
                                <option value={4}>Haute</option>
                                <option value={5}>Très haute</option>
                                <option value={6}>Majeure</option>
                            </select>
                        </div>
                    </div>

                    {/* Section Acteurs : Demandeur, Observateur, Attribué à */}
                    <div className="form-row border-section">
                        <div className="form-group">
                            <label>Demandeur</label>
                            <select name="_users_id_requester" className="form-control" value={formData._users_id_requester} onChange={handleInputChange}>
                                <option value="">-----</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{formatUserName(u)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Observateur</label>
                            <select name="_users_id_observer" className="form-control" value={formData._users_id_observer} onChange={handleInputChange}>
                                <option value="">-----</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{formatUserName(u)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Attribué à</label>
                            <select name="_users_id_assign" className="form-control" value={formData._users_id_assign} onChange={handleInputChange}>
                                <option value="">-----</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{formatUserName(u)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Titre *</label>
                        <input 
                            type="text" 
                            name="name" 
                            className="form-control" 
                            placeholder="Titre du ticket..."
                            value={formData.name} 
                            onChange={handleInputChange} 
                        />
                    </div>

                    <div className="form-group">
                        <label>Description *</label>
                        <textarea 
                            name="content" 
                            className="form-control" 
                            placeholder="Détaillez votre problème ou demande..."
                            value={formData.content} 
                            onChange={handleInputChange} 
                        />
                    </div>

                    <div className="elements-section">
                        <div className="elements-header">
                            <h3>Éléments associés</h3>
                        </div>
                        
                        <div className="form-group">
                            <select className="form-control" onChange={handleAssetSelect} defaultValue="">
                                <option value="">----- Sélectionnez un élément -----</option>
                                {allAssets.map(asset => (
                                    <option key={`${asset.type}-${asset.id}`} value={`${asset.type}-${asset.id}`}>
                                        {asset.name} {asset.serial ? `(${asset.serial})` : ''} - {asset.typeLabel || asset.type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="selected-assets">
                            {selectedAssets.map(asset => (
                                <div key={`sel-${asset.type}-${asset.id}`} className="selected-asset-chip">
                                    <span>{asset.name}</span>
                                    <button type="button" onClick={() => removeAsset(asset)}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? "Création en cours..." : "Soumettre le ticket"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
