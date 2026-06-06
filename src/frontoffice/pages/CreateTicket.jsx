import React, { useState, useEffect } from "react";
import { createTicket, linkElementToTicket } from "../services/ticketsService.jsx";
import { getAllAssets } from "../services/assetsService.jsx";
import "../styles/create-ticket.css";

export default function CreateTicket() {
    const [formData, setFormData] = useState({
        name: "",
        content: "",
        type: 1, // 1 = Incident, 2 = Demande
        urgency: 3, // 1 = Très basse, 5 = Très haute
        impact: 3, // 1 = Très bas, 5 = Très haut
        priority: 3, // 1 = Très basse, 5 = Très haute (souvent calculée, mais on peut forcer)
    });

    const [allAssets, setAllAssets] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        // Pre-fetch assets so user can search
        getAllAssets().then((assets) => {
            setAllAssets(assets);
        }).catch(err => console.error("Error loading assets:", err));
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: ["type", "urgency", "impact", "priority"].includes(name) ? parseInt(value, 10) : value,
        }));
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setShowDropdown(true);
    };

    const addAsset = (asset) => {
        if (!selectedAssets.some((a) => a.id === asset.id && a.type === asset.type)) {
            setSelectedAssets((prev) => [...prev, asset]);
        }
        setSearchQuery("");
        setShowDropdown(false);
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
            // 1. Create the ticket
            const ticketRes = await createTicket(formData);
            
            // Si la création est réussie, l'API V1 renvoie généralement { id: 123, message: "..." }
            const ticketId = ticketRes?.id;

            if (!ticketId) {
                throw new Error("L'ID du ticket n'a pas pu être récupéré.");
            }

            // 2. Link selected elements
            if (selectedAssets.length > 0) {
                const linkPromises = selectedAssets.map(asset => 
                    linkElementToTicket(ticketId, asset.type, asset.id)
                );
                await Promise.all(linkPromises);
            }

            setStatus({ 
                type: 'success', 
                message: `Ticket #${ticketId} créé avec succès et ${selectedAssets.length} élément(s) associé(s).` 
            });
            
            // Reset form
            setFormData({ name: "", content: "", type: 1, urgency: 3, impact: 3, priority: 3 });
            setSelectedAssets([]);
            
        } catch (error) {
            setStatus({ type: 'error', message: 'Erreur lors de la création du ticket : ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    // Filter assets for dropdown
    const filteredAssets = searchQuery.trim() === "" 
        ? [] 
        : allAssets.filter(asset => 
            asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            asset.serial?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10); // Limit to 10 results for performance

    return (
        <section className="create-ticket-page">
            <div className="ticket-form-card">
                <div className="ticket-header">
                    <h1>Créer un Ticket</h1>
                    <p>Remplissez les informations ci-dessous pour signaler un incident ou faire une demande.</p>
                </div>

                {status && (
                    <div className={`status-message ${status.type}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Type de ticket</label>
                            <select name="type" className="form-control" value={formData.type} onChange={handleInputChange}>
                                <option value={1}>Incident</option>
                                <option value={2}>Demande</option>
                            </select>
                        </div>
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
                    </div>

                    <div className="form-group">
                        <label>Titre *</label>
                        <input 
                            type="text" 
                            name="name" 
                            className="form-control" 
                            placeholder="Ex: Problème d'accès à la messagerie"
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
                        
                        <div className="search-assets-wrapper">
                            <input 
                                type="text" 
                                className="form-control search-assets-input" 
                                placeholder="Rechercher un élément (nom ou numéro de série)..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setShowDropdown(true)}
                                // We delay hiding dropdown so clicks on options register
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            />
                            
                            {showDropdown && filteredAssets.length > 0 && (
                                <div className="assets-dropdown">
                                    {filteredAssets.map(asset => {
                                        const isSelected = selectedAssets.some(a => a.id === asset.id && a.type === asset.type);
                                        return (
                                            <div 
                                                key={`${asset.type}-${asset.id}`} 
                                                className={`asset-option ${isSelected ? 'selected' : ''}`}
                                                onClick={() => !isSelected && addAsset(asset)}
                                            >
                                                <span>{asset.name} {asset.serial ? `(${asset.serial})` : ''}</span>
                                                <span className="asset-badge">{asset.typeLabel || asset.type}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
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
