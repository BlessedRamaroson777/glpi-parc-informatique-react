import React, { useState, useEffect } from "react";
import { 
    ajoutCommentaire
} from "../services/ticketsService.jsx";
import { getAllAssets } from "../services/assetsService.jsx";
import "../styles/create-ticket.css";
import apiV1 from "../../common/utils/apiV1.jsx";

export default function Solution({idTicket : id}) {
    const [loading, setLoading] = useState(false);
    const [commentaire, setCommentaire] = useState("");
    const [status, setStatus] = useState(null);
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        if(!id) {
            setStatus({ type: 'error', message: 'ID du ticket manquant pour ajouter une solution.' });
            setLoading(false);
            return;
        }
        

        try {
            // 1. Créer le ticket
            const ticketRes = await ajoutCommentaire(id, commentaire);
            console.log(ticketRes)

            setStatus({ 
                type: 'success', 
                message: `Commentaire ajouté au ticket #${id} avec succès.` 
            });
                        
        } catch (error) {
            setStatus({ type: 'error', message: 'Erreur lors de la création du commentaire : ' + error.message });
        } finally {
            setLoading(false);
        }
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: ["type", "urgency", "impact", "priority", "status", "requesttypes_id", "itilcategories_id", "locations_id", "_users_id_requester", "_users_id_observer", "_users_id_assign"].includes(name) 
                ? (value === "" ? "" : parseInt(value, 10)) 
                : value,
        }));
    };

    return (
        <section className="create-ticket-page">
            <div className="ticket-form-card">
                <div className="ticket-header">
                    <h1>Ajouter une solution</h1>
                </div>

                {status && (
                    <div className={`status-message ${status.type}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Commentaire</label>
                        <textarea 
                            name="content" 
                            className="form-control" 
                            placeholder="Détaillez votre problème ou demande..."
                            value={commentaire} 
                            onChange={(e) => setCommentaire(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? "Création en cours..." : "Soumettre le commentaire"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
