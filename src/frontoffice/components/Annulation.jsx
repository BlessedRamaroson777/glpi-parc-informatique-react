import React, { useState, useEffect } from "react";
import { 
    ajoutCout
} from "../services/ticketsService.jsx";
import { getAllAssets } from "../services/assetsService.jsx";
import "../styles/create-ticket.css";
import apiV1 from "../../common/utils/apiV1.jsx";
import apiV2 from "../../common/utils/apiV2.jsx";
import { API } from "../../common/constants/apiConfig.jsx";
const BASE = "/api.php/v2.3/Assistance/Ticket"


export default function Solution({idTicket : id}) {
    const [loading, setLoading] = useState(false);
    const [Cout, setCout] = useState("");
    const [status, setStatus] = useState(null);
    const [grouped, setGrouped] = React.useState([])
    
    async function requestJSON(url, options) {
        const response = await fetch(url, options)
        const data = await response.json()
        if (!response.ok) {
            throw new Error(data?.error || "Erreur API")
        }
        console.log(data)
        return data
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        if (!id) {
            setStatus({ type: "error", message: "ID du ticket manquant." })
            setLoading(false)
            return
        }
        if (!Cout.trim()) {
            setLoading(false)
            return
        }

        try {
            // 1. Récupérer les assets liés au ticket via V1
            const itemsRes = await apiV1.get(`Ticket/${id}/Item_Ticket`)
            const items = Array.isArray(itemsRes) ? itemsRes : (itemsRes?.data ?? [])

            const montantTotal = parseFloat(Cout)
            const nbItems = items.length || 1
            const montantParItem = montantTotal / nbItems
            // const montantParItem = Math.round((montantTotal / nbItems) * 100) / 100

            if (items.length === 0) {
                // Pas d'asset lié → insérer une ligne sans assetId
            //     console.log("POST body →", {
            //     valeur: montantParItem,
            //     ticketId: id,
            //     assetId: item.items_id,
            //     assetType: item.itemtype,
            // })
                await fetch(`${API}/api/couts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        valeur: montantTotal,
                        ticketId: id,
                        assetId: null,
                        assetType: null,
                    }),
                })
            } else {
                // Une ligne par asset
                const now = new Date().toISOString();
                const res = await apiV2.get(`${BASE}/${id}/Cost`);
                const costs = Array.isArray(res) ? res : res?.data ?? [];
                let totalCost;
                if (costs.length == 0){
                    totalCost = 0
                }
                else{
                    totalCost = costs.reduce((sum, cost) => {
                        const fixed = cost.cost_fixed || 0;
                        const material = cost.cost_material || 0;

                        const durationHours = (cost.duration || 0) / 3600;
                        const timeCost = (cost.cost_time || 0) * durationHours;

                        return sum + fixed + timeCost + material;
                    }, 0);
                    // console.log(res)
                    // console.log(totalCost)

                }
                const farany = await fetch(`${API}/api/coutsLast/${id}`)
                const data = await farany.json();
                const donnee = data.couts;
                // if(donnee.length!==0){
                //     console.log(donnee);
                // }
                const valeurFaranay = donnee[0].valeurInitial;
                    console.log(valeurFaranay);
                const reouverture = valeurFaranay * montantTotal / 100
                const montantReouvertureParItem = reouverture / nbItems



                // const effacer = donnee.map(item =>
                //     fetch(`${API}/api/couts`, {
                //         method: "POST",
                //         headers: { "Content-Type": "application/json" },
                //         body: JSON.stringify({
                //             valeur: montantParItem,
                //             ticketId: id,
                //             assetType: item.itemtype, // ex: "Computer", "Phone", "Monitor"
                //             typeCout: "reouverture", 
                //             glpiCout: totalCost,
                //             heure: now       , 
                //             valeurInitial: montantTotal                          
                //         }),
                //     })
                // )
                const azo = await Promise.all(items.map(item =>
                    fetch(`${API}/api/couts`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            valeur: montantReouvertureParItem,
                            ticketId: id,
                            assetType: item.itemtype, // ex: "Computer", "Phone", "Monitor"
                            typeCout: "reouverture", 
                            glpiCout: totalCost,
                            heure: now       , 
                            valeurInitial: montantTotal                          
                        }),
                    })
                ))
                console.log(await azo[0].text())
            }

            setStatus({ type: "success", message: `Coût ajouté au ticket #${id}.` })
            setCout("")
        } catch (error) {
            setStatus({ type: "error", message: "Erreur : " + error.message })
        } finally {
            setLoading(false)
        }
    }

    async function handleAnnulation (e){
    console.log("BOUTON ANNULER CLIQUÉ");
        e.preventDefault()

        setLoading(true)

        if (!id) {
            setStatus({ type: "error", message: "ID du ticket manquant." })
            setLoading(false)
            return
        }

        try {
            // const montantParItem = Math.round((montantTotal / nbItems) * 100) / 100
            const farany = await fetch(`${API}/api/coutsLast/${id}`)
            const data = await farany.json();
            const donnee = Array.isArray(data.couts) ? data.couts : [];
            console.log("API RESPONSE =", data);
            console.log("DONNEE =", data.couts);
            if(donnee.length!==0){
                console.log(donnee);
                // const effacer = await Promise.all(donnee.map(item =>
                //     fetch(`${API}/api/couts/${item.id}`, {
                //         method: "DELETE"
                //     }))
                // )
            }
            const effacer = await Promise.all(
                donnee.map(item =>
                    fetch(`${API}/api/couts/${item.id}`, {
                        method: "DELETE"
                    })
                )
            );

            console.log(effacer);

            for (const r of effacer) {
                console.log(await r.json());
            }


            setStatus({ type: "success", message: `Annulation du dernier cout du ticket #${id}.` })
            setCout("")
        } catch (error) {
            setStatus({ type: "error", message: "Erreur : " + error.message })
        } finally {
            setLoading(false)
        }

    }

    return (
        <section className="create-ticket-page">
            <div className="ticket-form-card">
                <button
                    type="button"
                    onClick={handleAnnulation}
                >
                    Annuler
                </button>
                <div className="ticket-header">
                    <h1>Annulation ou reouverture</h1>
                </div>

                {status && (
                    <div className={`status-message ${status.type}`}>
                        {status.message}
                    </div>
                )}

                
                    <form onSubmit={handleSubmit} className="card-form">
                        <div className="form-group">
                            <label>Cout de reouverture</label>
                            <input
                                value={Cout}
                                onChange={e => setCout(e.target.value)}
                                placeholder="Inserer le cout de reouverture"
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? "Création en cours..." : "Soumettre le Cout"}
                            </button>
                        </div>
                    </form>
            </div>
        </section>
    );
}
