import apiV2 from '../utils/apiV2.jsx'
import TicketCost from './TicketCost.jsx'
import TicketFollowup from './TicketFollowup.jsx'
import TicketDocument from './TicketDocument.jsx'
import TicketTeamMember from './TicketTeamMember.jsx'

export const TICKET_STATUS = {
    NEW: 1, VALIDATION: 10, IN_PROGRESS_ASSIGNED: 2,
    IN_PROGRESS_PLANNED: 3, PENDING: 4, SOLVED: 5, CLOSED: 6
}

export const TICKET_PRIORITY = { VERY_LOW: 1, LOW: 2, MEDIUM: 3, HIGH: 4, VERY_HIGH: 5 }
export const TICKET_TYPE = { INCIDENT: 1, REQUEST: 2 }
export const TICKET_VALIDATION_STATUS = { NONE: 1, WAITING: 2, ACCEPTED: 3, REFUSED: 4 }

export const TICKET_STATUS_LABELS = {
    [TICKET_STATUS.NEW]: 'Nouveau',
    [TICKET_STATUS.VALIDATION]: 'Validation',
    [TICKET_STATUS.IN_PROGRESS_ASSIGNED]: 'En cours (Attribue)',
    [TICKET_STATUS.IN_PROGRESS_PLANNED]: 'En cours (Planifie)',
    [TICKET_STATUS.PENDING]: 'En attente',
    [TICKET_STATUS.SOLVED]: 'Resolu',
    [TICKET_STATUS.CLOSED]: 'Clos'
}

class Ticket {
    endpoint = 'Assistance/Ticket'

    constructor(data = {}) {
        this.id = data.id ?? null
        this.name = data.name ?? ''
        this.content = data.content ?? ''
        this.external_id = data.external_id ?? ''
        this.is_deleted = data.is_deleted ?? false
        
        // Relations simples (Objets normalisés { id, name })
        this.user_recipient = data.user_recipient ?? null
        this.user_editor = data.user_editor ?? null
        this.category = data.category ?? null
        this.location = data.location ?? null
        this.entity = data.entity ?? null
        this.request_type = data.request_type ?? null
        
        // Indicateurs et types numériques
        this.urgency = data.urgency ?? TICKET_PRIORITY.MEDIUM
        this.impact = data.impact ?? TICKET_PRIORITY.MEDIUM
        this.priority = data.priority ?? TICKET_PRIORITY.MEDIUM
        this.type = data.type ?? TICKET_TYPE.INCIDENT
        this.global_validation = data.global_validation ?? TICKET_VALIDATION_STATUS.NONE
        
        // 2. CORRECTION: Gestion hybride du statut (supporte ID direct ou objet GLPI)
        if (data.status && typeof data.status === 'object') {
            this.status = data.status.id ?? TICKET_STATUS.NEW
        } else {
            this.status = data.status ?? TICKET_STATUS.NEW
        }
        
        // Dates (Formats attendus : YYYY-MM-DD HH:mm:ss)
        this.date = data.date ?? null
        this.date_creation = data.date_creation ?? null
        this.date_mod = data.date_mod ?? null
        this.date_solve = data.date_solve ?? null
        this.date_close = data.date_close ?? null
        this.resolution_date = data.resolution_date ?? null
        
        // SLAs / OLAs
        this.sla_ttr = data.sla_ttr ?? null
        this.sla_tto = data.sla_tto ?? null
        this.ola_ttr = data.ola_ttr ?? null
        this.ola_tto = data.ola_tto ?? null
        
        // Sous-collections
        this.team = data.team ?? []
        this.costs = data.costs ?? []
    }

    static fromData(data) {
        const obj = Object.create(Ticket.prototype)
        Object.assign(obj, data)
        obj.endpoint = 'Assistance/Ticket'
        
        // Normalisation du statut à la réception pour compatibilité interne
        if (data.status && typeof data.status === 'object') {
            obj.status = data.status.id ?? TICKET_STATUS.NEW
        } else {
            obj.status = data.status ?? TICKET_STATUS.NEW
        }
        return obj
    }

    // Génération du payload strict attendu par GLPI
    _toPayload() {
        const payload = {
            name: this.name,
            content: this.content,
            external_id: this.external_id,
            urgency: Number(this.urgency),
            impact: Number(this.impact),
            priority: Number(this.priority),
            type: Number(this.type),
            status: Number(this.status), // Envoi de l'ID numérique uniquement
            date: this.date,
            date_solve: this.date_solve,
            date_close: this.date_close,
            resolution_date: this.resolution_date,
            global_validation: Number(this.global_validation)
        }
        
        // Mapping des IDs d'objets relationnels
        if (this.category?.id) payload.category = { id: Number(this.category.id) }
        if (this.location?.id) payload.location = { id: Number(this.location.id) }
        if (this.user_recipient?.id) payload.user_recipient = { id: Number(this.user_recipient.id) }
        if (this.request_type?.id) payload.request_type = { id: Number(this.request_type.id) }
        if (this.sla_ttr?.id) payload.sla_ttr = { id: Number(this.sla_ttr.id) }
        if (this.sla_tto?.id) payload.sla_tto = { id: Number(this.sla_tto.id) }
        if (this.ola_ttr?.id) payload.ola_ttr = { id: Number(this.ola_ttr.id) }
        if (this.ola_tto?.id) payload.ola_tto = { id: Number(this.ola_tto.id) }
        
        return payload
    }

    // --- CRUD ---------------------------------------------------------------

    async save() {
        const created = await apiV2.post(this.endpoint, this._toPayload())
        return Ticket.fromData(created)
    }

    async getById(id) {
        const data = await apiV2.get(`${this.endpoint}/${id}`)
        return Ticket.fromData(data)
    }

    async getAll(params = {}) {
        const data = await apiV2.get(this.endpoint, params)
        return data.map(item => Ticket.fromData(item))
    }

    async update() {
        if (!this.id) throw new Error('Impossible de modifier sans ID')
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, this._toPayload())
        return Ticket.fromData(updated)
    }

    // 3. CORRECTION: Remplacement de ?force=true par ?purge=true pour GLPI v2.3
    async delete(purge = false) {
        if (!this.id) throw new Error('Impossible de supprimer sans ID')
        await apiV2.delete(`${this.endpoint}/${this.id}${purge ? '?purge=true' : ''}`)
    }

    // --- Méthodes spécifiques et sous-ressources ----------------------------

    async changeStatus(newStatusId) {
        if (!this.id) throw new Error('Identifiant du ticket manquant')
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, { status: Number(newStatusId) })
        this.status = Number(newStatusId)
        return Ticket.fromData(updated)
    }

    async getCosts() {
        const ticketCost = new TicketCost()
        return await ticketCost.getByTicket(this.id)
    }

    async addCost(costData) {
        const ticketCost = new TicketCost({ ticket: { id: this.id }, ...costData })
        return await ticketCost.save()
    }

    async getFollowups() {
        const followup = new TicketFollowup()
        return await followup.getByTicket(this.id)
    }

    async addFollowup(content, isPrivate = false) {
        const followup = new TicketFollowup({ ticket: { id: this.id }, content, is_private: isPrivate })
        return await followup.save()
    }

    async getDocuments() {
        const document = new TicketDocument()
        return await document.getByTicket(this.id)
    }

    async addDocument(documentId) {
        const doc = new TicketDocument({ ticket: { id: this.id }, document: { id: documentId } })
        return await doc.save()
    }

    async addTeamMember(memberId, memberType, role = 'Assigned') {
        const teamMember = new TicketTeamMember()
        return await teamMember.addToTicket(this.id, { id: memberId, type: memberType, role })
    }

    async removeTeamMember(memberId, memberType) {
        const teamMember = new TicketTeamMember()
        return await teamMember.removeFromTicket(this.id, memberId, memberType)
    }

    // --- Utilitaires et Validations ----------------------------------------

    validate() {
        const errors = []
        if (!this.name?.trim()) errors.push('Le nom du ticket est requis')
        if (!this.content?.trim()) errors.push('Le contenu du ticket est requis')
        return errors
    }

    getStatusLabel() {
        const currentId = typeof this.status === 'object' ? this.status?.id : this.status
        return TICKET_STATUS_LABELS[currentId] || 'Inconnu'
    }
}

export default Ticket