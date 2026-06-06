import apiV2 from '../../backoffice/utils/apiV2.jsx'

// Constantes pour la profondeur (rack units fractionnaires)
export const MONITOR_RACK_DEPTH = {
    QUARTER: 0.25,
    THIRD: 0.33,
    HALF: 0.5,
    FULL: 1
}

class MonitorModel {
    endpoint = 'Dropdowns/MonitorModel'

    constructor(data = {}) {
        this.id = data.id ?? null  // readOnly

        // Champs simples
        this.name = data.name ?? ''
        this.comment = data.comment ?? ''
        this.product_number = data.product_number ?? ''
        this.weight = data.weight ?? 0  // integer, minimum 0
        this.rack_units = data.rack_units ?? 1  // integer, minimum 1
        this.depth = data.depth ?? MONITOR_RACK_DEPTH.FULL  // float (0.25, 0.33, 0.5, 1)
        this.power_connections = data.power_connections ?? 0  // integer, minimum 0
        this.power_consumption = data.power_consumption ?? 0  // integer, minimum 0
        this.is_half_rack = data.is_half_rack ?? false

        // Images (readOnly - URLs de l'API GLPI)
        this.picture_front = data.picture_front ?? null  // readOnly
        this.picture_rear = data.picture_rear ?? null  // readOnly
        this.pictures = data.pictures ?? []  // readOnly

        // Dates
        this.date_creation = data.date_creation ?? null  // datetime, readOnly
        this.date_mod = data.date_mod ?? null  // datetime, readOnly
    }

    static fromData(data) {
        const obj = Object.create(MonitorModel.prototype)
        Object.assign(obj, data)
        obj.endpoint = 'Dropdowns/MonitorModel'
        return obj
    }

    // Payload pour update() et save()
    _toPayload() {
        return {
            name: this.name,
            comment: this.comment,
            product_number: this.product_number,
            weight: Number(this.weight),
            rack_units: Number(this.rack_units),
            depth: Number(this.depth),
            power_connections: Number(this.power_connections),
            power_consumption: Number(this.power_consumption),
            is_half_rack: this.is_half_rack
        }
    }

    _toCreatePayload() {
        return this._toPayload()
    }

    // --- CRUD ---------------------------------------------------------------

    async save() {
        const created = await apiV2.post(this.endpoint, this._toCreatePayload())
        return MonitorModel.fromData(created)
    }

    async getById(id) {
        const data = await apiV2.get(`${this.endpoint}/${id}`)
        return MonitorModel.fromData(data)
    }

    async getAll(params = {}) {
        const data = await apiV2.get(this.endpoint, params)
        return data.map(item => MonitorModel.fromData(item))
    }

    async update() {
        if (!this.id) throw new Error('Impossible de modifier un MonitorModel sans ID')
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, this._toPayload())
        return MonitorModel.fromData(updated)
    }

    // 2. CORRECTION: Remplacement de ?force=true par ?purge=true pour GLPI
    async delete(purge = false) {
        if (!this.id) throw new Error('Impossible de supprimer un MonitorModel sans ID')
        await apiV2.delete(`${this.endpoint}/${this.id}${purge ? '?purge=true' : ''}`)
    }

    // --- Méthodes spécifiques à MonitorModel -------------------------------

    async searchByName(searchTerm) {
        return await this.getAll({ filter: `name=*${searchTerm}*` })
    }

    async getByProductNumber(productNumber) {
        if (!productNumber) return []
        return await this.getAll({ filter: `product_number=="${String(productNumber).trim()}"` })
    }

    async getRackable() {
        return await this.getAll({ filter: `rack_units>0` })
    }

    async getHalfRack() {
        return await this.getAll({ filter: `is_half_rack==true` })
    }

    async getByRackUnits(rackUnits) {
        return await this.getAll({ filter: `rack_units==${rackUnits}` })
    }

    async getByDepth(depth) {
        return await this.getAll({ filter: `depth==${depth}` })
    }

    async getByWeightRange(minWeight, maxWeight) {
        const all = await this.getAll()
        return all.filter(model => model.weight >= minWeight && model.weight <= maxWeight)
    }

    async getByMaxPowerConsumption(maxConsumption) {
        return await this.getAll({ filter: `power_consumption<=${maxConsumption}` })
    }

    // 3. CORRECTION: Appel direct via API découplée pour supprimer la dépendance circulaire vers Monitor
    async getMonitors() {
        if (!this.id) return []
        return await apiV2.get('Assets/Monitor', { filter: `model.id==${this.id}` })
    }

    // --- Getters et formateurs ---------------------------------------------

    getDepthLabel() {
        const labels = {
            0.25: '1/4',
            0.33: '1/3',
            0.5: '1/2',
            1: 'Pleine'
        }
        return labels[this.depth] || `${this.depth}`
    }

    isRackable() {
        return this.rack_units > 0
    }

    getPictureFrontUrl() { return this.picture_front }
    getPictureRearUrl() { return this.picture_rear }
    getAllPicturesUrls() { return this.pictures || [] }

    getFormattedPowerConsumption(unit = 'W') {
        return `${this.power_consumption} ${unit}`
    }

    getFormattedWeight(unit = 'kg') {
        return `${this.weight} ${unit}`
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
        return data.map(item => MonitorModel.fromData(item))
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
        return data.map(item => MonitorModel.fromData(item))
    }

    async getInclApi(includeIds = []) {
        const ids = includeIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        if (ids.length === 0) return []

        const data = await apiV2.get(this.endpoint, { filter: `id=in=(${ids.join(',')})` })
        return data.map(item => MonitorModel.fromData(item))
    }

    async getExclApi(excludeIds = []) {
        const ids = excludeIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        if (ids.length === 0) return await this.getAll()

        const data = await apiV2.get(this.endpoint, { filter: `id=out=(${ids.join(',')})` })
        return data.map(item => MonitorModel.fromData(item))
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

    // --- Validations --------------------------------------------------------

    validate() {
        const errors = []
        
        if (!this.name || this.name.trim() === '') {
            errors.push('Le nom du modèle est requis')
        }
        if (this.weight < 0) {
            errors.push('Le poids ne peut pas être négatif')
        }
        if (this.rack_units < 0) {
            errors.push('La hauteur en U ne peut pas être négative')
        }
        if (this.power_connections < 0) {
            errors.push('Le nombre de connexions électriques ne peut pas être négatif')
        }
        if (this.power_consumption < 0) {
            errors.push('La consommation électrique ne peut pas être négative')
        }
        
        return errors
    }
}

export default MonitorModel