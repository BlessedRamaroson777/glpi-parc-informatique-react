import apiV2 from '../utils/apiV2.jsx'

class TicketCost {
    endpoint = 'Assistance/TicketCost'

    constructor(data = {}) {
        this.id = data.id ?? null

        // Relations (objets)
        this.ticket = data.ticket ?? null
        this.budget = data.budget ?? null
        this.entity = data.entity ?? null

        // Champs simples
        this.name = data.name ?? ''
        this.comment = data.comment ?? ''

        // Dates
        this.date_begin = data.date_begin ?? null
        this.date_end = data.date_end ?? null

        // Numériques
        this.duration = data.duration ?? 0
        this.cost_time = data.cost_time ?? 0      // Coût horaire
        this.cost_fixed = data.cost_fixed ?? 0    // Coût fixe
        this.cost_material = data.cost_material ?? 0 // Coût matériel
    }

    static fromData(data) {
        const obj = Object.create(TicketCost.prototype)
        Object.assign(obj, data)
        obj.endpoint = 'Assistance/TicketCost'
        return obj
    }

    _toPayload() {
        const payload = {
            name: this.name,
            comment: this.comment,
            date_begin: this.date_begin,
            date_end: this.date_end,
            duration: Number(this.duration),
            cost_time: Number(this.cost_time),
            cost_fixed: Number(this.cost_fixed),
            cost_material: Number(this.cost_material)
        }
        
        if (this.ticket?.id) payload.ticket = { id: Number(this.ticket.id) }
        if (this.budget?.id) payload.budget = { id: Number(this.budget.id) }
        
        return payload
    }

    _toCreatePayload() {
        return this._toPayload()
    }

    // --- CRUD ---------------------------------------------------------------

    async save() {
        const created = await apiV2.post(this.endpoint, this._toCreatePayload())
        return TicketCost.fromData(created)
    }

    async getById(id) {
        const data = await apiV2.get(`${this.endpoint}/${id}`)
        return TicketCost.fromData(data)
    }

    async getAll(params = {}) {
        const data = await apiV2.get(this.endpoint, params)
        return data.map(item => TicketCost.fromData(item))
    }

    async update() {
        if (!this.id) throw new Error('Impossible de modifier sans ID')
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, this._toPayload())
        return TicketCost.fromData(updated)
    }

    async delete() {
        if (!this.id) throw new Error('Impossible de supprimer sans ID')
        await apiV2.delete(`${this.endpoint}/${this.id}`)
    }

    // 2. CORRECTION: Utilisation de tickets_id au lieu de ticket.id pour l'API GLPI
    async getByTicket(ticketId) {
        if (!ticketId) return []
        const data = await apiV2.get(this.endpoint, { filter: `tickets_id==${ticketId}` })
        return data.map(item => TicketCost.fromData(item))
    }

    // --- Validations et Utilitaires -----------------------------------------

    validate() {
        const errors = []
        if (!this.name?.trim()) errors.push('Le nom est requis')
        if (!this.ticket?.id) errors.push('Un ticket est requis')
        if (this.duration < 0) errors.push('La durée ne peut pas être négative')
        if (this.cost_time < 0) errors.push('Le coût horaire ne peut pas être négatif')
        if (this.cost_fixed < 0) errors.push('Le coût fixe ne peut pas être négatif')
        if (this.cost_material < 0) errors.push('Le coût matériel ne peut pas être négatif')
        return errors
    }

    // 3. CORRECTION: Application de la formule du coût réel (Coût horaire * Durée)
    // Si ta durée est stockée en secondes dans GLPI (souvent le cas), diviser par 3600.
    // Si elle est déjà saisie en heures dans ton interface, garde la multiplication directe.
    getTotalCost() {
        const hours = (this.duration || 0) / 3600; // GLPI stocke la durée en secondes
        const timeCostCalculated = (this.cost_time || 0) * hours;
        
        return (this.cost_fixed || 0) + (this.cost_material || 0) + timeCostCalculated;
    }
}

export default TicketCost