import apiV2 from '../../backoffice/utils/apiV2.jsx'

class Manufacturer {
    // 1. CORRECTION: Endpoint complet avec namespace requis par GLPI v2.3
    endpoint = 'Dropdowns/Manufacturer'

    constructor(data = {}) {
        this.id = data.id ?? null  // readOnly

        // Champs simples
        this.name = data.name ?? ''
        this.comment = data.comment ?? ''

        // Dates
        this.date_creation = data.date_creation ?? null  // datetime, readOnly
        this.date_mod = data.date_mod ?? null  // datetime, readOnly
    }

    static fromData(data) {
        const obj = Object.create(Manufacturer.prototype)
        Object.assign(obj, data)
        obj.endpoint = 'Dropdowns/Manufacturer'
        return obj
    }

    // Payload pour update() et save()
    _toPayload() {
        return {
            name: this.name,
            comment: this.comment
        }
    }

    _toCreatePayload() {
        return this._toPayload()
    }

    // --- CRUD ---------------------------------------------------------------

    async save() {
        const created = await apiV2.post(this.endpoint, this._toCreatePayload())
        return Manufacturer.fromData(created)
    }

    async getById(id) {
        const data = await apiV2.get(`${this.endpoint}/${id}`)
        return Manufacturer.fromData(data)
    }

    async getAll(params = {}) {
        const data = await apiV2.get(this.endpoint, params)
        return data.map(item => Manufacturer.fromData(item))
    }

    async update() {
        if (!this.id) throw new Error('Impossible de modifier un Manufacturer sans ID')
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, this._toPayload())
        return Manufacturer.fromData(updated)
    }

    // 2. CORRECTION: Changement du paramètre 'force' en 'purge' conforme à GLPI v2.3
    async delete(purge = false) {
        if (!this.id) throw new Error('Impossible de supprimer un Manufacturer sans ID')
        await apiV2.delete(`${this.endpoint}/${this.id}${purge ? '?purge=true' : ''}`)
    }

    // --- Méthodes spécifiques à Manufacturer --------------------------------

    /**
     * Rechercher des fabricants par nom (recherche partielle)
     * @param {string} searchTerm - Terme de recherche
     */
    async searchByName(searchTerm) {
        return await this.getAll({ filter: `name=*${searchTerm}*` })
    }

    /**
     * 3. CORRECTION: Méthode utilitaire interne pour interroger les éléments liés à ce fabricant.
     * Coupe court aux instanciations directes en boucle et élimine les dépendances circulaires.
     */
    async _getElementsByManufacturer(endpointPath) {
        if (!this.id) return []
        return await apiV2.get(endpointPath, { filter: `manufacturer.id==${this.id}` })
    }

    // --- Raccourcis de récupération des Actifs et Composants liés ----------

    async getComputers() { return await this._getElementsByManufacturer('Assets/Computer') }
    async getMonitors() { return await this._getElementsByManufacturer('Assets/Monitor') }
    async getPrinters() { return await this._getElementsByManufacturer('Dropdowns/Printer') }
    async getPeripherals() { return await this._getElementsByManufacturer('Assets/Peripheral') }
    async getPhones() { return await this._getElementsByManufacturer('Assets/Phone') }
    async getNetworkEquipments() { return await this._getElementsByManufacturer('Assets/NetworkEquipment') }
    
    async getSoftwares() { return await this._getElementsByManufacturer('Software') }
    async getCertificates() { return await this._getElementsByManufacturer('Management/Certificate') }
    async getBatteries() { return await this._getElementsByManufacturer('Component/Battery') }
    async getGraphicCards() { return await this._getElementsByManufacturer('Component/GraphicCard') }
    async getProcessors() { return await this._getElementsByManufacturer('Component/Processor') }
    async getMemories() { return await this._getElementsByManufacturer('Component/Memory') }
    async getHardDrives() { return await this._getElementsByManufacturer('Component/HardDrive') }
    async getNetworkCards() { return await this._getElementsByManufacturer('Component/NetworkCard') }
    async getSystemboards() { return await this._getElementsByManufacturer('Component/Systemboard') }
    async getPowerSupplies() { return await this._getElementsByManufacturer('Component/PowerSupply') }
    async getSoundCards() { return await this._getElementsByManufacturer('Component/SoundCard') }
    async getPCIDevices() { return await this._getElementsByManufacturer('Component/PciDevice') }
    async getSIMCards() { return await this._getElementsByManufacturer('Component/Simcard') }
    async getSensors() { return await this._getElementsByManufacturer('Component/Sensor') }
    async getFirmwares() { return await this._getElementsByManufacturer('Component/Firmware') }
    async getCameras() { return await this._getElementsByManufacturer('Component/Camera') }
    async getCases() { return await this._getElementsByManufacturer('Component/Case') }
    async getControllers() { return await this._getElementsByManufacturer('Component/Controller') }
    async getDrives() { return await this._getElementsByManufacturer('Component/Drive') }
    async getGenericDevices() { return await this._getElementsByManufacturer('Component/GenericDevice') }

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
        return data.map(item => Manufacturer.fromData(item))
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
        return data.map(item => Manufacturer.fromData(item))
    }

    async getInclApi(includeIds = []) {
        const ids = includeIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        if (ids.length === 0) return []

        const data = await apiV2.get(this.endpoint, { filter: `id=in=(${ids.join(',')})` })
        return data.map(item => Manufacturer.fromData(item))
    }

    async getExclApi(excludeIds = []) {
        const ids = excludeIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        if (ids.length === 0) return await this.getAll()

        const data = await apiV2.get(this.endpoint, { filter: `id=out=(${ids.join(',')})` })
        return data.map(item => Manufacturer.fromData(item))
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

    // --- Méthodes de validation et compteurs -------------------------------

    validate() {
        const errors = []
        if (!this.name || this.name.trim() === '') {
            errors.push('Le nom du fabricant est requis')
        }
        return errors
    }

    /**
     * Obtenir le nombre d'actifs principaux de ce fabricant
     */
    async getTotalAssets() {
        const computers = await this.getComputers()
        const monitors = await this.getMonitors()
        const printers = await this.getPrinters()
        const peripherals = await this.getPeripherals()
        const phones = await this.getPhones()
        const networkEquipments = await this.getNetworkEquipments()
        
        return {
            computers: computers.length,
            monitors: monitors.length,
            printers: printers.length,
            peripherals: peripherals.length,
            phones: phones.length,
            networkEquipments: networkEquipments.length,
            total: computers.length + monitors.length + printers.length + 
                   peripherals.length + phones.length + networkEquipments.length
        }
    }
}

export default Manufacturer