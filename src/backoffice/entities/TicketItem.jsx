import apiV1 from '../utils/apiV1.jsx'
import apiV2 from '../utils/apiV2.jsx'

class TicketItem {

    constructor(data = {}, version = 'v2') {
        this.id = data.id ?? null
        this.tickets_id = data.tickets_id ?? null
        this.itemtype = data.itemtype ?? ''
        this.items_id = data.items_id ?? null
        this.date_creation = data.date_creation ?? null
        this.date_mod = data.date_mod ?? null
        
        // On mémorise la version choisie pour cette instance
        this._apiVersion = version 
    }

    /**
     * Fabrique une instance en spécifiant la version d'API désirée
     */
    static fromData(data, version = 'v2') {
        return new TicketItem(data, version)
    }

    /**
     * Détermine dynamiquement l'endpoint et le client à utiliser
     */
    static _getApiTarget(version = 'v2') {
        if (version === 'v1') {
            return {
                client: apiV1,
                endpoint: 'Ticket_Item',
                isV1: true
            }
        }
        // Par défaut : API v2 (Proxy mode)
        return {
            client: apiV2,
            endpoint: 'Support/Ticket_Item',
            isV1: false
        }
    }

    /**
     * Formate les données selon les exigences de la version v1 ou v2
     */
    _toPayload(isV1) {
        const fields = {
            tickets_id: this.tickets_id ? Number(this.tickets_id) : null,
            itemtype: this.itemtype,
            items_id: this.items_id ? Number(this.items_id) : null
        }

        // La v1 de GLPI exige l'encapsulation dans un objet "input"
        return isV1 ? { input: fields } : fields
    }

    // ==========================================
    // METHODES D'INSTANCE (CRUD)
    // ==========================================

    async save() {
        const errors = this.validate()
        if (errors.length > 0) {
            throw new Error(`Validation échouée: ${errors.join(', ')}`)
        }

        const { client, endpoint, isV1 } = TicketItem._getApiTarget(this._apiVersion)
        let data

        if (isV1) {
            data = await client.createItem(endpoint, this._toPayload(true))
        } else {
            data = await client.post(endpoint, this._toPayload(false))
        }

        const responseData = Array.isArray(data) ? data[0] : data
        return TicketItem.fromData({ ...this, id: responseData.id }, this._apiVersion)
    }

    async update() {
        if (!this.id) throw new Error('ID requis pour la mise à jour')

        const { client, endpoint, isV1 } = TicketItem._getApiTarget(this._apiVersion)
        let data

        if (isV1) {
            data = await client.updateItem(endpoint, this.id, this._toPayload(true))
        } else {
            data = await client.patch(`${endpoint}/${this.id}`, this._toPayload(false))
        }

        return TicketItem.fromData(data, this._apiVersion)
    }

    async delete(purge = true) {
        if (!this.id) throw new Error('ID requis pour la suppression')

        const { client, endpoint, isV1 } = TicketItem._getApiTarget(this._apiVersion)
        const url = `${endpoint}/${this.id}${purge ? '?purge=true' : ''}`

        if (isV1) {
            await client.delete(url) // Le wrapper v1 a sa propre méthode delete
        } else {
            await client.delete(url) // Le wrapper v2 utilise aussi sa méthode delete
        }
    }

    // ==========================================
    // METHODES STATIQUES (RECHERCHE)
    // ==========================================

    static async getById(id, version = 'v2') {
        const { client, endpoint, isV1 } = TicketItem._getApiTarget(version)
        const data = isV1 
            ? await client.getItem(endpoint, id)
            : await client.get(`${endpoint}/${id}`)

        return TicketItem.fromData(data, version)
    }

    static async getAll(params = {}, version = 'v2') {
        const { client, endpoint, isV1 } = TicketItem._getApiTarget(version)
        let data

        if (isV1) {
            data = await client.getList(endpoint, params.range, params)
        } else {
            data = await client.get(endpoint, params)
        }

        if (!Array.isArray(data)) return []
        return data.map(item => TicketItem.fromData(item, version))
    }

    /**
     * Filtre par Ticket (v1 ou v2 au choix)
     */
    static async getByTicket(ticketId, version = 'v2') {
        if (version === 'v1') {
            return TicketItem.getAll({ tickets_id: Number(ticketId) }, 'v1')
        }
        return TicketItem.getAll({ filter: `tickets_id==${Number(ticketId)}` }, 'v2')
    }

    /**
     * Filtre par Matériel (v1 ou v2 au choix)
     */
    static async getByItem(itemtype, itemId, version = 'v2') {
        if (version === 'v1') {
            return TicketItem.getAll({ itemtype: itemtype, items_id: Number(itemId) }, 'v1')
        }
        return TicketItem.getAll({ filter: `itemtype==${itemtype};items_id==${Number(itemId)}` }, 'v2')
    }

    // ==========================================
    // VALIDATION LOGIQUE
    // ==========================================

    validate() {
        const errors = []
        if (!this.tickets_id) errors.push('tickets_id requis')
        if (!this.itemtype?.trim()) errors.push('itemtype requis')
        if (!this.items_id) errors.push('items_id requis')
        return errors
    }
}

export default TicketItem