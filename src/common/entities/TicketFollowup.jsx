import apiV2 from '../../backoffice/utils/apiV2.jsx'

class TicketFollowup {
    endpoint = 'Assistance/ITILFollowup'

    constructor(data = {}) {
        this.id = data.id ?? null

        // Extraction et normalisation de la relation polymorphique Ticket
        this.ticket = data.ticket ?? (data.items_id && data.itemtype === 'Ticket' ? { id: data.items_id } : null)
        
        this.content = data.content ?? ''
        this.is_private = data.is_private ?? false
        this.user = data.user ?? null
        this.user_editor = data.user_editor ?? null
        this.request_type = data.request_type ?? null
        this.date = data.date ?? null
        this.timeline_position = data.timeline_position ?? 1
        
        // Champs natifs et polymorphiques GLPI
        this.itemtype = data.itemtype ?? 'Ticket'
        this.items_id = data.items_id ?? null
        this.date_creation = data.date_creation ?? null
        this.date_mod = data.date_mod ?? null
        this.source_item_id = data.source_item_id ?? null
        this.source_of_item_id = data.source_of_item_id ?? null
    }

    static fromData(data) {
        const obj = Object.create(TicketFollowup.prototype)
        Object.assign(obj, data)
        obj.endpoint = 'Assistance/ITILFollowup'
        
        // Reconstruction de l'objet de relation ticket pour le client
        obj.ticket = data.ticket ?? (data.items_id && data.itemtype === 'Ticket' ? { id: data.items_id } : null)
        return obj
    }

    _toPayload() {
        const payload = {
            content: this.content,
            is_private: Boolean(this.is_private),
            date: this.date,
            timeline_position: Number(this.timeline_position)
        }
        
        if (this.request_type?.id) payload.request_type = { id: Number(this.request_type.id) }
        
        return payload
    }

    // 2. CORRECTION: Utilisation obligatoire d'itemtype et items_id pour cibler le ticket
    _toCreatePayload() {
        const payload = this._toPayload()
        payload.itemtype = 'Ticket'
        payload.items_id = this.ticket?.id ? Number(this.ticket.id) : Number(this.items_id)
        return payload
    }

    // --- CRUD ---------------------------------------------------------------

    async save() {
        const created = await apiV2.post(this.endpoint, this._toCreatePayload())
        return TicketFollowup.fromData(created)
    }

    async getById(id) {
        const data = await apiV2.get(`${this.endpoint}/${id}`)
        return TicketFollowup.fromData(data)
    }

    async getAll(params = {}) {
        const data = await apiV2.get(this.endpoint, params)
        return data.map(item => TicketFollowup.fromData(item))
    }

    async update() {
        if (!this.id) throw new Error('Impossible de modifier sans ID')
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, this._toPayload())
        return TicketFollowup.fromData(updated)
    }

    async delete() {
        if (!this.id) throw new Error('Impossible de supprimer sans ID')
        await apiV2.delete(`${this.endpoint}/${this.id}`)
    }

    // 2. CORRECTION: Filtrage RSQL basé sur la structure polymorphique réelle de GLPI
    async getByTicket(ticketId) {
        if (!ticketId) return []
        const data = await apiV2.get(this.endpoint, { 
            filter: `items_id==${ticketId};itemtype==Ticket` 
        })
        return data.map(item => TicketFollowup.fromData(item))
    }

    // --- Validations --------------------------------------------------------

    validate() {
        const errors = []
        if (!this.content?.trim()) errors.push('Le contenu est requis')
        if (!this.ticket?.id && !this.items_id && !this.id) {
            errors.push('Un ticket est requis pour la création')
        }
        return errors
    }
}

export default TicketFollowup