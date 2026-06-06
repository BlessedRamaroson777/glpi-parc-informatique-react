import apiV1 from "../../common/utils/apiV1.jsx"

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
