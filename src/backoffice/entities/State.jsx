import apiV2 from '../utils/apiV2.jsx'

class State {
    endpoint = 'Dropdowns/State'

    constructor(data = {}) {
        this.id = data.id ?? null  // readOnly

        // Champs simples
        this.name = data.name ?? ''
        this.comment = data.comment ?? ''

        // Relations (objets)
        this.entity = data.entity ?? null  // Entity ({ id, name })
        this.parent = data.parent ?? null  // State ({ id, name })

        // Visibilités par type d'actif
        this.visibilities = data.visibilities ?? {
            computer: false,
            monitor: false,
            networkequipment: false,
            peripheral: false,
            phone: false,
            printer: false,
            softwarelicense: false,
            certificate: false,
            enclosure: false,
            pdu: false,
            line: false,
            rack: false,
            softwareversion: false,
            cluster: false,
            contract: false,
            appliance: false,
            databaseinstance: false,
            cable: false,
            unmanaged: false,
            passivedcequipment: false
        }

        // Champs readOnly
        this.completename = data.completename ?? ''  // readOnly
        this.level = data.level ?? 0  // readOnly
        this.is_recursive = data.is_recursive ?? false  // readOnly
        this.is_visible_helpdesk = data.is_visible_helpdesk ?? false

        // Dates
        this.date_creation = data.date_creation ?? null  // datetime, readOnly
        this.date_mod = data.date_mod ?? null  // datetime, readOnly
    }

    static fromData(data) {
        const obj = Object.create(State.prototype)
        Object.assign(obj, data)
        obj.endpoint = 'Dropdowns/State'
        return obj
    }

    // Payload pour update() et save()
    _toPayload() {
        return {
            name: this.name,
            comment: this.comment,
            is_visible_helpdesk: this.is_visible_helpdesk,
            
            // Relations objets mappées sur leur ID
            entity: this.entity ? { id: Number(this.entity.id) } : null,
            parent: this.parent ? { id: Number(this.parent.id) } : null,
            
            // Visibilités
            visibilities: this.visibilities
        }
    }

    _toCreatePayload() {
        return this._toPayload()
    }

    // --- CRUD ---------------------------------------------------------------

    async save() {
        const created = await apiV2.post(this.endpoint, this._toCreatePayload())
        return State.fromData(created)
    }

    async getById(id) {
        const data = await apiV2.get(`${this.endpoint}/${id}`)
        return State.fromData(data)
    }

    async getAll(params = {}) {
        const data = await apiV2.get(this.endpoint, params)
        return data.map(item => State.fromData(item))
    }

    async update() {
        if (!this.id) throw new Error('Impossible de modifier un State sans ID')
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, this._toPayload())
        return State.fromData(updated)
    }

    async delete(purge = false) {
        if (!this.id) throw new Error('Impossible de supprimer un State sans ID')
        await apiV2.delete(`${this.endpoint}/${this.id}${purge ? '?purge=true' : ''}`)
    }

    // --- Méthodes spécifiques à State --------------------------------------

    /**
     * Récupérer les sous-statuts
     */
    async getChildren() {
        return await this.getAll({ filter: `parent.id==${this.id}` })
    }

    /**
     * Récupérer le statut parent
     */
    async getParent() {
        if (!this.parent || !this.parent.id) return null
        return await this.getById(this.parent.id)
    }

    /**
     * Récupérer l'arborescence complète des parents
     */
    async getParentTree() {
        const tree = []
        let current = this
        
        while (current.parent && current.parent.id) {
            const parent = await this.getById(current.parent.id)
            tree.unshift(parent)
            current = parent
        }
        
        return tree
    }

    /**
     * Rechercher des statuts par nom (recherche partielle)
     * @param {string} searchTerm - Terme de recherche
     */
    async searchByName(searchTerm) {
        return await this.getAll({ filter: `name=*${searchTerm}*` })
    }

    /**
     * Récupérer les statuts racine (sans parent)
     */
    async getRootStates() {
        return await this.getAll({ filter: `parent.id==null` })
    }

    /**
     * Récupérer les statuts visibles dans le helpdesk
     */
    async getHelpdeskVisible() {
        return await this.getAll({ filter: `is_visible_helpdesk==true` })
    }

    /**
     * Récupérer les statuts visibles pour un type d'actif spécifique
     * @param {string} assetType - Type d'actif (computer, monitor, printer, etc.)
     */
    async getVisibleForAssetType(assetType) {
        const all = await this.getAll()
        return all.filter(state => state.visibilities?.[assetType] === true)
    }

    /**
     * Activer/Désactiver la visibilité pour un type d'actif
     * @param {string} assetType - Type d'actif
     * @param {boolean} visible - Visible ou non
     */
    async setVisibility(assetType, visible) {
        if (!this.visibilities) {
            this.visibilities = {}
        }
        this.visibilities[assetType] = visible
        return await this.update()
    }

    /**
     * Méthode générique interne pour interroger les actifs liés à ce statut
     * Évite d'importer toutes les classes de composants et élimine les dépendances circulaires.
     */
    async _getAssetsByStatus(endpointPath) {
        if (!this.id) return []
        return await apiV2.get(endpointPath, { filter: `states.id==${this.id}` })
    }

    // --- Raccourcis de récupération des Actifs liés au statut ---------------

    async getComputers() { return await this._getAssetsByStatus('Assets/Computer') }
    async getMonitors() { return await this._getAssetsByStatus('Assets/Monitor') }
    async getPrinters() { return await this._getAssetsByStatus('Dropdowns/Printer') } // ou Assets/Printer selon ton setup
    async getPeripherals() { return await this._getAssetsByStatus('Assets/Peripheral') }
    async getPhones() { return await this._getAssetsByStatus('Assets/Phone') }
    async getNetworkEquipments() { return await this._getAssetsByStatus('Assets/NetworkEquipment') }
    async getRacks() { return await this._getAssetsByStatus('Assets/Rack') }
    async getCertificates() { return await this._getAssetsByStatus('Management/Certificate') }
    async getLicenses() { return await this._getAssetsByStatus('Management/SoftwareLicense') }
    async getContracts() { return await this._getAssetsByStatus('Management/Contract') }
    async getAppliances() { return await this._getAssetsByStatus('Assets/Appliance') }
    async getCables() { return await this._getAssetsByStatus('Assets/Cable') }
    async getLines() { return await this._getAssetsByStatus('Assets/Line') }
    async getEnclosures() { return await this._getAssetsByStatus('Assets/Enclosure') }
    async getPDUs() { return await this._getAssetsByStatus('Assets/Pdu') }
    async getClusters() { return await this._getAssetsByStatus('Assets/Cluster') }
    async getPassiveDCEquipments() { return await this._getAssetsByStatus('Assets/PassiveDcEquipment') }

    /**
     * Obtenir le nombre total d'actifs par type
     */
    async getAssetCounts() {
        return {
            computers: (await this.getComputers()).length,
            monitors: (await this.getMonitors()).length,
            printers: (await this.getPrinters()).length,
            peripherals: (await this.getPeripherals()).length,
            phones: (await this.getPhones()).length,
            networkEquipments: (await this.getNetworkEquipments()).length,
            racks: (await this.getRacks()).length,
            certificates: (await this.getCertificates()).length,
            licenses: (await this.getLicenses()).length,
            contracts: (await this.getContracts()).length,
            appliances: (await this.getAppliances()).length,
            cables: (await this.getCables()).length,
            lines: (await this.getLines()).length,
            enclosures: (await this.getEnclosures()).length,
            pdus: (await this.getPDUs()).length,
            clusters: (await this.getClusters()).length,
            passiveDCEquipments: (await this.getPassiveDCEquipments()).length
        }
    }

    /**
     * Obtenir la liste des types d'actifs pour lesquels ce statut est visible
     */
    getVisibleAssetTypes() {
        if (!this.visibilities) return []
        
        return Object.entries(this.visibilities)
            .filter(([_, visible]) => visible === true)
            .map(([type]) => type)
    }

    // --- Utilitaires côté client (Filtrage sur tableaux JS) ----------------

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

    // --- Utilitaires côté serveur (Requêtes filtres RSQL à l'API) -----------

    async getByApi(fieldName, value) {
        if (value === undefined || value === null || value === '') return []

        const values = Array.isArray(value) ? value : [value]
        const normalized = values.map(v => String(v).trim()).filter(s => s !== '')
        if (normalized.length === 0) return []

        const filter = normalized.length === 1
            ? `${fieldName}=="${normalized[0]}"`
            : `${fieldName}=in=(${normalized.join(',')})`

        const data = await apiV2.get(this.endpoint, { filter })
        return data.map(item => State.fromData(item))
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
        return data.map(item => State.fromData(item))
    }

    async getInclApi(includeIds = []) {
        const ids = includeIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        if (ids.length === 0) return []

        const data = await apiV2.get(this.endpoint, { filter: `id=in=(${ids.join(',')})` })
        return data.map(item => State.fromData(item))
    }

    async getExclApi(excludeIds = []) {
        const ids = excludeIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        if (ids.length === 0) return await this.getAll()

        const data = await apiV2.get(this.endpoint, { filter: `id=out=(${ids.join(',')})` })
        return data.map(item => State.fromData(item))
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

    // --- Méthodes de validation --------------------------------------------

    validate() {
        const errors = []
        
        if (!this.name || this.name.trim() === '') {
            errors.push('Le nom du statut est requis')
        }
        
        return errors
    }

    getFormattedPath() {
        return this.completename || this.name
    }

    getIndentLevel() {
        return this.level || 0
    }

    getIndentPrefix() {
        return '  '.repeat(this.level || 0)
    }

    getIndentedName() {
        return `${this.getIndentPrefix()}${this.name}`
    }
}

export default State