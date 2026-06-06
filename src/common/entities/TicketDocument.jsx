import apiV2 from '../../backoffice/utils/apiV2.jsx'

class TicketDocument {
    // 1. CORRECTION: Endpoint officiel avec le namespace Attachment/ requis par GLPI v2.3
    endpoint = 'Attachment/Document_Item'

    constructor(data = {}) {
        this.id = data.id ?? null

        this.ticket = data.ticket ?? (data.items_id && data.itemtype === 'Ticket' ? { id: data.items_id } : null)
        this.document = data.document ?? (data.documents_id ? { id: data.documents_id } : null)
        this.date = data.date ?? null
        this.timeline_position = data.timeline_position ?? 1
        
        // Champs typés GLPI
        this.itemtype = data.itemtype ?? 'Ticket'
        this.items_id = data.items_id ?? null
        this.filepath = data.filepath ?? null
        this.date_creation = data.date_creation ?? null
    }

    static fromData(data) {
        const obj = Object.create(TicketDocument.prototype)
        Object.assign(obj, data)
        obj.endpoint = 'Attachment/Document_Item'
        
        // Reconstruction propre des objets pour le client
        obj.ticket = data.ticket ?? (data.items_id && data.itemtype === 'Ticket' ? { id: data.items_id } : null)
        obj.document = data.document ?? (data.documents_id ? { id: data.documents_id } : null)
        
        return obj
    }

    _toPayload() {
        return {
            timeline_position: Number(this.timeline_position),
            date: this.date
        }
    }

    // 2. CORRECTION: Formatage plat de la liaison et typage strict des IDs
    _toCreatePayload() {
        return {
            itemtype: 'Ticket',
            items_id: this.ticket?.id ? Number(this.ticket.id) : Number(this.items_id),
            document: this.document?.id ? { id: Number(this.document.id) } : null,
            timeline_position: Number(this.timeline_position),
            date: this.date
        }
    }

    // --- CRUD ---------------------------------------------------------------

    async save() {
        const created = await apiV2.post(this.endpoint, this._toCreatePayload())
        return TicketDocument.fromData(created)
    }

    async getById(id) {
        const data = await apiV2.get(`${this.endpoint}/${id}`)
        return TicketDocument.fromData(data)
    }

    async getAll(params = {}) {
        const data = await apiV2.get(this.endpoint, params)
        return data.map(item => TicketDocument.fromData(item))
    }

    async update() {
        if (!this.id) throw new Error('Impossible de modifier sans ID')
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, this._toPayload())
        return TicketDocument.fromData(updated)
    }

    async delete() {
        if (!this.id) throw new Error('Impossible de supprimer sans ID')
        await apiV2.delete(`${this.endpoint}/${this.id}`)
    }

    // --- Requêtes spécifiques ----------------------------------------------

    async getByTicket(ticketId) {
        if (!ticketId) return []
        // Requête RSQL propre combinant l'ID du ticket et le type de liaison
        const data = await apiV2.get(this.endpoint, { filter: `items_id==${ticketId};itemtype==Ticket` })
        return data.map(item => TicketDocument.fromData(item))
    }

    // --- Validations --------------------------------------------------------

    validate() {
        const errors = []
        if (!this.ticket?.id && !this.items_id && !this.id) errors.push('Un ticket est requis')
        if (!this.document?.id && !this.id) errors.push('Un document est requis')
        return errors
    }
}

export default TicketDocument