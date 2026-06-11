import apiV2 from "../../common/utils/apiV2.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"

const BASE_TICKET = "/api.php/v2.3/Assistance/Ticket"
const BASE_ASSET  = "/api.php/v2.3/Assets"

/**
 * Récupère l'ensemble des données du Dashboard en utilisant 
 * la méthode native de comptage via l'API v2 (Content-Range).
 */
export async function getDashboardData() {
    // Exécution parallèle de tous les comptages (Assets + Tickets avec filtres)
    const [
        assetCounts,
        ticketTotal,
        ticketIncident,
        ticketDemande,
    ] = await Promise.all([
        // 1. Comptage de chaque type d'asset défini dans la configuration
        Promise.all(ASSET_TYPES.map(async ({ key, label }) => ({
            key, 
            label,
            count: await apiV2.count(`${BASE_ASSET}/${key}`),
        }))),
        
        // 2. Comptage total des tickets
        apiV2.count(BASE_TICKET),
        
        // 3. Comptage des Incidents (type == 1)
        apiV2.count(BASE_TICKET, "type==1"),
        
        // 4. Comptage des Demandes (type == 2)
        apiV2.count(BASE_TICKET, "type==2"),
    ])

    // Structuration finale de la réponse pour le composant Dashboard React
    return {
        assets: {
            total: assetCounts.reduce((sum, a) => sum + a.count, 0),
            byType: assetCounts,
        },
        tickets: {
            total: ticketTotal,
            by_type: { 
                1: ticketIncident, 
                2: ticketDemande 
            }
        }
    }
}