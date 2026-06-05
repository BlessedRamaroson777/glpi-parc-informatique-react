import apiV2 from '../utils/apiV2.jsx'

class Monitor {
    // 1. CORRECTION: Endpoint complet avec namespace requis par GLPI v2.3
    endpoint = 'Assets/Monitor'

    constructor(data = {}) {
        this.id = data.id ?? null  // readOnly

        // Champs simples
        this.name = data.name ?? ''
        this.comment = data.comment ?? ''
        this.serial = data.serial ?? ''
        this.otherserial = data.otherserial ?? ''
        this.contact = data.contact ?? ''
        this.contact_num = data.contact_num ?? ''
        this.is_deleted = data.is_deleted ?? false
        this.is_template = data.is_template ?? false
        this.template_name = data.template_name ?? ''
        this.is_dynamic = data.is_dynamic ?? false
        this.is_global = data.is_global ?? false
        this.uuid = data.uuid ?? null  // readOnly, format UUID
        this.ticket_tco = data.ticket_tco ?? 0  // float, minimum 0
        this.size = data.size ?? 0  // float, minimum 0
        this.last_inventory_update = data.last_inventory_update ?? null  // datetime, readOnly

        // Caractéristiques matérielles (booleens)
        this.has_microphone = data.has_microphone ?? false
        this.has_speaker = data.has_speaker ?? false
        this.has_subd = data.has_subd ?? false
        this.has_bnc = data.has_bnc ?? false
        this.has_dvi = data.has_dvi ?? false
        this.has_pivot = data.has_pivot ?? false
        this.has_hdmi = data.has_hdmi ?? false
        this.has_displayport = data.has_displayport ?? false

        // Relations (objets)
        this.entity = data.entity ?? null  // Entity
        this.location = data.location ?? null  // Location
        this.manufacturer = data.manufacturer ?? null  // Manufacturer
        this.user = data.user ?? null  // User
        this.user_tech = data.user_tech ?? null  // User
        this.type = data.type ?? null  // MonitorType
        this.model = data.model ?? null  // MonitorModel
        this.autoupdatesystem = data.autoupdatesystem ?? null  // AutoUpdateSystem
        this.status = data.status ?? null  // State

        // Relations (tableaux)
        this.group = data.group ?? []  // Group
        this.group_tech = data.group_tech ?? []  // Group

        // Champs readOnly
        this.is_recursive = data.is_recursive ?? false  // readOnly
        this.date_creation = data.date_creation ?? null  // datetime, readOnly
        this.date_mod = data.date_mod ?? null  // datetime, readOnly
    }

    static fromData(data) {
        const obj = Object.create(Monitor.prototype)
        Object.assign(obj, data)
        obj.endpoint = 'Assets/Monitor'
        return obj
    }

    // Payload pour update() et save()
    _toPayload() {
        return {
            name: this.name,
            comment: this.comment,
            serial: this.serial,
            otherserial: this.otherserial,
            contact: this.contact,
            contact_num: this.contact_num,
            is_template: this.is_template,
            template_name: this.template_name,
            is_dynamic: this.is_dynamic,
            is_global: this.is_global,
            ticket_tco: this.ticket_tco,
            size: this.size,
            has_microphone: this.has_microphone,
            has_speaker: this.has_speaker,
            has_subd: this.has_subd,
            has_bnc: this.has_bnc,
            has_dvi: this.has_dvi,
            has_pivot: this.has_pivot,
            has_hdmi: this.has_hdmi,
            has_displayport: this.has_displayport,
            
            // Relations objets mappées sur leur identifiant { id }
            entity: this.entity?.id ? { id: Number(this.entity.id) } : null,
            location: this.location?.id ? { id: Number(this.location.id) } : null,
            manufacturer: this.manufacturer?.id ? { id: Number(this.manufacturer.id) } : null,
            user: this.user?.id ? { id: Number(this.user.id) } : null,
            user_tech: this.user_tech?.id ? { id: Number(this.user_tech.id) } : null,
            type: this.type?.id ? { id: Number(this.type.id) } : null,
            model: this.model?.id ? { id: Number(this.model.id) } : null,
            autoupdatesystem: this.autoupdatesystem?.id ? { id: Number(this.autoupdatesystem.id) } : null,
            status: this.status?.id ? { id: Number(this.status.id) } : null,
            
            // Relations tableaux
            group: this.group.map(g => ({ id: Number(g.id) })),
            group_tech: this.group_tech.map(g => ({ id: Number(g.id) }))
        }
    }

    _toCreatePayload() {
        return this._toPayload()
    }

    // --- CRUD ---------------------------------------------------------------

    async save() {
        const created = await apiV2.post(this.endpoint, this._toCreatePayload())
        return Monitor.fromData(created)
    }

    async getById(id) {
        const data = await apiV2.get(`${this.endpoint}/${id}`)
        return Monitor.fromData(data)
    }

    async getAll(params = {}) {
        const data = await apiV2.get(this.endpoint, params)
        return data.map(item => Monitor.fromData(item))
    }

    async update() {
        if (!this.id) throw new Error('Impossible de modifier un Monitor sans ID')
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, this._toPayload())
        return Monitor.fromData(updated)
    }

    // 2. CORRECTION: Utilisation du paramètre de purge GLPI réglementaire
    async delete(purge = false) {
        if (!this.id) throw new Error('Impossible de supprimer un Monitor sans ID')
        await apiV2.delete(`${this.endpoint}/${this.id}${purge ? '?purge=true' : ''}`)
    }

    // --- Méthodes spécifiques à Monitor ------------------------------------

    async getByStatus(statusId) {
        return await this.getAll({ filter: `status.id==${statusId}` })
    }

    async getByUser(userId) {
        return await this.getAll({ filter: `user.id==${userId}` })
    }

    async getByTech(userId) {
        return await this.getAll({ filter: `user_tech.id==${userId}` })
    }

    async getByModel(modelId) {
        return await this.getAll({ filter: `model.id==${modelId}` })
    }

    async getByManufacturer(manufacturerId) {
        return await this.getAll({ filter: `manufacturer.id==${manufacturerId}` })
    }

    async getByMonitorType(monitorTypeId) {
        return await this.getAll({ filter: `type.id==${monitorTypeId}` })
    }

    async getByLocation(locationId) {
        return await this.getAll({ filter: `location.id==${locationId}` })
    }

    async getByEntity(entityId) {
        return await this.getAll({ filter: `entity.id==${entityId}` })
    }

    async searchByName(searchTerm) {
        return await this.getAll({ filter: `name=*${searchTerm}*` })
    }

    async getBySizeRange(minSize, maxSize) {
        const all = await this.getAll()
        return all.filter(monitor => monitor.size >= minSize && monitor.size <= maxSize)
    }

    async getByFeature(feature, value = true) {
        const all = await this.getAll()
        return all.filter(monitor => monitor[feature] === value)
    }

    async getHDMIMonitors() { return await this.getByFeature('has_hdmi', true) }
    async getDVIMonitors() { return await this.getByFeature('has_dvi', true) }
    async getDisplayPortMonitors() { return await this.getByFeature('has_displayport', true) }
    async getPivotMonitors() { return await this.getByFeature('has_pivot', true) }

    async getGlobalMonitors() {
        return await this.getAll({ filter: `is_global==true` })
    }

    async getDeleted() {
        return await this.getAll({ filter: `is_deleted==true` })
    }

    async restore() {
        if (!this.id) throw new Error('Impossible de restaurer un Monitor sans ID')
        this.is_deleted = false
        return await this.update()
    }

    // 3. CORRECTION: Méthode utilitaire pour appeler les liaisons de composants et contrats sans imports cycliques
    async _getItemsByMonitor(endpointPath, queryKey = 'items_id') {
        if (!this.id) return []
        // Gestion générique pour s'adapter aux sous-tables (Infocom, TicketItem, etc.)
        const filter = queryKey.includes('.') ? `${queryKey}==${this.id}` : `${queryKey}==${this.id};itemtype=="Monitor"`
        return await apiV2.get(endpointPath, { filter })
    }

    // --- Accès aux Liaisons, Documents et Éléments Financiers --------------

    async getInfocom() { 
        return await this._getItemsByMonitor('Management/Infocom', 'items_id') 
    }

    async getTickets() { 
        return await this._getItemsByMonitor('Assistance/TicketItem') 
    }

    async getContracts() { 
        return await this._getItemsByMonitor('Management/ContractItem') 
    }

    async getDocuments() { 
        return await this._getItemsByMonitor('Management/DocumentItem') 
    }

    async getNetworkCards() { 
        return await this._getItemsByMonitor('Component/NetworkCard', 'monitor.id') 
    }

    // --- Utilitaires côté client (Filtres JS) ------------------------------

    async getBy(fieldName, value) {
        if (value === undefined || value === null || value === '') return []

        const all = await this.getAll()
        const values = Array.isArray(value) ? value : [value]
        const normalized = values.map(v => String(v))

        return all.filter(item => {
            const v = item[fieldName]
            if (v === undefined || v === null) return false
            if (Array.isArray(v)) return v.map(String).some(iv => normalized.includes(iv))
            return normalized.includes(String(v))
        })
    }

    async getByNot(fieldName, value) {
        if (value === undefined || value === null || value === '') return await this.getAll()

        const all = await this.getAll()
        const values = Array.isArray(value) ? value : [value]
        const normalized = values.map(v => String(v))

        return all.filter(item => {
            const v = item[fieldName]
            if (v === undefined || v === null) return true
            if (Array.isArray(v)) return !v.map(String).some(iv => normalized.includes(iv))
            return !normalized.includes(String(v))
        })
    }

    async getIncl(includeIds = []) {
        const included = new Set(includeIds.map(id => Number(id)))
        const all = await this.getAll()
        return all.filter(item => included.has(Number(item.id)))
    }

    async getExcl(excludeIds = []) {
        const excluded = new Set(excludeIds.map(id => Number(id)))
        const all = await this.getAll()
        return all.filter(item => !excluded.has(Number(item.id)))
    }

    // --- Utilitaires côté serveur (Filtres RSQL) ---------------------------

    async getByApi(fieldName, value) {
        if (value === undefined || value === null || value === '') return []

        const values = Array.isArray(value) ? value : [value]
        const normalized = values.map(v => String(v).trim()).filter(s => s !== '')
        if (normalized.length === 0) return []

        const filter = normalized.length === 1
            ? `${fieldName}=="${normalized[0]}"`
            : `${fieldName}=in=(${normalized.join(',')})`

        const data = await apiV2.get(this.endpoint, { filter })
        return data.map(item => Monitor.fromData(item))
    }

    async getByNotApi(fieldName, value) {
        if (value === undefined || value === null || value === '') return []

        const values = Array.isArray(value) ? value : [value]
        const normalized = values.map(v => String(v).trim()).filter(s => s !== '')
        if (normalized.length === 0) return []

        const filter = normalized.length === 1
            ? `${fieldName}!="${normalized[0]}"`
            : `${fieldName}=out=(${normalized.join(',')})`

        const data = await apiV2.get(this.endpoint, { filter })
        return data.map(item => Monitor.fromData(item))
    }

    async getInclApi(includeIds = []) {
        const ids = includeIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        if (ids.length === 0) return []

        const data = await apiV2.get(this.endpoint, { filter: `id=in=(${ids.join(',')})` })
        return data.map(item => Monitor.fromData(item))
    }

    async getExclApi(excludeIds = []) {
        const ids = excludeIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        if (ids.length === 0) return await this.getAll()

        const data = await apiV2.get(this.endpoint, { filter: `id=out=(${ids.join(',')})` })
        return data.map(item => Monitor.fromData(item))
    }

    async exists(id) {
        try {
            await this.getById(id)
            return true
        } catch {
            return false
        }
    }

    async findOne(params = {}) {
        const data = await this.getAll({ ...params, limit: 1 })
        return data.length > 0 ? data[0] : null
    }

    // --- Validations et Getters --------------------------------------------

    validate() {
        const errors = []
        if (!this.name || this.name.trim() === '') {
            errors.push('Le nom du moniteur est requis')
        }
        if (this.ticket_tco < 0) {
            errors.push('Le TCO ne peut pas être négatif')
        }
        if (this.size < 0) {
            errors.push('La taille ne peut pas être négative')
        }
        return errors
    }

    isInTrash() { return this.is_deleted === true }
    isTemplate() { return this.is_template === true }
    isGlobal() { return this.is_global === true }

    getAvailableConnections() {
        const connections = []
        if (this.has_hdmi) connections.push('HDMI')
        if (this.has_dvi) connections.push('DVI')
        if (this.has_displayport) connections.push('DisplayPort')
        if (this.has_subd) connections.push('Sub-D (VGA)')
        if (this.has_bnc) connections.push('BNC')
        return connections
    }
}

export default Monitor