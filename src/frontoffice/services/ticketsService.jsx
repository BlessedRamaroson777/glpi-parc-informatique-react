import apiV1 from "../../common/utils/apiV1.jsx"
import apiV2 from "../../common/utils/apiV2.jsx"

/**
 * Creates a new ticket in GLPI
 * @param {Object} ticketData - e.g. { name: "...", content: "...", type: 1, urgency: 3 }
 */
export async function createTicket(ticketData) {
    try {
        // GLPI API expects data wrapped in an "input" object
        const response = await apiV1.createItem('Ticket', { input: ticketData });
        return response; // Usually { id: 123, message: "..." }
    } catch (error) {
        console.error("Error creating ticket:", error);
        throw error;
    }
}

/**
 * Links an asset (element) to a ticket
 * @param {number} tickets_id - The ID of the ticket
 * @param {string} itemtype - The GLPI itemtype (e.g. "Computer", "Monitor")
 * @param {number} items_id - The ID of the asset
 */
export async function linkElementToTicket(tickets_id, itemtype, items_id) {
    try {
        const payload = {
            input: {
                tickets_id,
                itemtype,
                items_id
            }
        };
        const response = await apiV1.createItem('Item_Ticket', payload);
        return response;
    } catch (error) {
        console.error(`Error linking ${itemtype} ${items_id} to ticket ${tickets_id}:`, error);
        throw error;
    }
}

// Récupérer les catégories ITIL
export async function getITILCategories() {
    const data = await apiV2.get("/api.php/v2.3/Dropdowns/ITILCategory?range=0-200");
    return Array.isArray(data) ? data : (data?.data ?? []);
}

// Récupérer les sources de demande
export async function getRequestTypes() {
    const data = await apiV2.get("/api.php/v2.3/Dropdowns/RequestType?range=0-200");
    return Array.isArray(data) ? data : (data?.data ?? []);
}

// Récupérer les localisations
export async function getLocations() {
    const data = await apiV2.get("/api.php/v2.3/Dropdowns/Location?range=0-200");
    return Array.isArray(data) ? data : (data?.data ?? []);
}

// Récupérer les utilisateurs pour les acteurs
export async function getUsers() {
    const data = await apiV2.get("/api.php/v2.3/Administration/User?range=0-200");
    return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function ajoutSolution (tickets_id, content) {
    // try {
    //     // GLPI API expects data wrapped in an "input" object
    //     const response = await apiV1.createItem("ITILSolution", { input: { 
    //         itemtype: "Ticket", 
    //         items_id: tickets_id, 
    //         content: content, 
    //         // solutiontypes_id: 0, // optionnel 
    //     }})
    //     return response; // Usually { id: 123, message: "..." }
    // } catch (error) {
    //     console.error("Error creating ticket:", error);
    //     throw error;
    // }
    return await apiV1.createItem("ITILSolution", {
        input: {
            itemtype: "Ticket",
            items_id: tickets_id,
            content: content,
            // solutiontypes_id: 0
        }
    });
}

export async function acceptSolution(solution_id) {
    apiV1.updateItem("ITILSolution", solution_id, {
        input: {
            status: 3   // accepté / validé (selon GLPI)
        }
    });
}

export async function refuseSolution(solution_id) {
    apiV1.updateItem("ITILSolution", solution_id, {
        input: {
            status: 4   // refusé / invalide (selon GLPI)
        }
    });
}

// TicketFollowup
export async function ajoutCommentaire (tickets_id, content) {
    // try {
    //     // GLPI API expects data wrapped in an "input" object
    //     const response = await apiV1.createItem("ITILSolution", { input: { 
    //         itemtype: "Ticket", 
    //         items_id: tickets_id, 
    //         content: content, 
    //         // solutiontypes_id: 0, // optionnel 
    //     }})
    //     return response; // Usually { id: 123, message: "..." }
    // } catch (error) {
    //     console.error("Error creating ticket:", error);
    //     throw error;
    // }
    apiV1.updateItem("Ticket", tickets_id, {
        input: {
            solution: content,
        }
    })
    // apiV2.post(`/api.php/v2/Assistance/Ticket/${tickets_id}/ITILSolution`, { content: content })
}

export async function ajoutDocumentCommentaire(document, tickets_id) {
    const formData = new FormData();

    formData.append("uploadManifest", JSON.stringify({
    input: {
        name: document.name,
        itemtype: "Ticket",
        items_id: tickets_id,
    }
    }));

    formData.append("filename[0]", file);

    fetch("/apirest.php/Document", {
    method: "POST",
    headers: {
        "Session-Token": sessionToken,
        "App-Token": appToken
    },
    body: formData
    });
}