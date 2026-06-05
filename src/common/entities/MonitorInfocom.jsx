import apiV2 from '../utils/apiV2.jsx'

class MonitorInfocom {
    // 1. CORRECTION: Endpoint complet avec namespace requis par GLPI v2.3
    endpoint = 'Management/Infocom'

    constructor(data = {}) {
        this.id = data.id ?? null
        
        // Identifiants polymorphes GLPI
        this.itemtype = data.itemtype ?? 'Monitor'
        this.items_id = data.items_id ?? data.monitor_id ?? null
        
        // Alias pratique pour le reste de l'application
        this.monitor_id = this.items_id

        // Champs simples
        this.comment = data.comment ?? ''
        this.order_number = data.order_number ?? ''
        this.delivery_number = data.delivery_number ?? ''
        this.immo_number = data.immo_number ?? ''
        this.invoice_number = data.invoice_number ?? ''
        this.warranty_info = data.warranty_info ?? ''
        
        // Dates (Formats attendus : YYYY-MM-DD ou YYYY-MM-DD HH:mm:ss)
        this.date_buy = data.date_buy ?? null
        this.date_use = data.date_use ?? null
        this.date_order = data.date_order ?? null
        this.date_delivery = data.date_delivery ?? null
        this.date_inventory = data.date_inventory ?? null
        this.date_warranty = data.date_warranty ?? null
        this.date_decommission = data.date_decommission ?? null
        
        // Valeurs numériques et amortissements
        this.value = data.value ?? 0
        this.warranty_value = data.warranty_value ?? 0
        this.warranty_duration = data.warranty_duration ?? 0
        this.amortization_type = data.amortization_type ?? 0
        this.amortization_time = data.amortization_time ?? 0
        this.amortization_coeff = data.amortization_coeff ?? 0
        
        // Relations (objets)
        this.budget = data.budget ?? null
        this.supplier = data.supplier ?? null
        this.business_criticity = data.business_criticity ?? null
        this.entity = data.entity ?? null
        this.is_recursive = data.is_recursive ?? false
    }

    static fromData(data) {
        const obj = Object.create(MonitorInfocom.prototype)
        Object.assign(obj, data)
        obj.endpoint = 'Management/Infocom'
        // Synchronisation des alias d'identifiants
        obj.monitor_id = obj.items_id
        return obj
    }

    // Payload de base pour update() et save()
    _toPayload() {
        const payload = {
            comment: this.comment,
            order_number: this.order_number,
            delivery_number: this.delivery_number,
            immo_number: this.immo_number,
            invoice_number: this.invoice_number,
            warranty_info: this.warranty_info,
            date_buy: this.date_buy,
            date_use: this.date_use,
            date_order: this.date_order,
            date_delivery: this.date_delivery,
            date_inventory: this.date_inventory,
            date_warranty: this.date_warranty,
            date_decommission: this.date_decommission,
            value: Number(this.value),
            warranty_value: Number(this.warranty_value),
            warranty_duration: Number(this.warranty_duration),
            amortization_type: Number(this.amortization_type),
            amortization_time: Number(this.amortization_time),
            amortization_coeff: Number(this.amortization_coeff)
        }
        
        // Cast propre des relations
        if (this.budget?.id) payload.budget = { id: Number(this.budget.id) }
        if (this.supplier?.id) payload.supplier = { id: Number(this.supplier.id) }
        if (this.business_criticity?.id) payload.business_criticity = { id: Number(this.business_criticity.id) }
        
        return payload
    }

    // Payload complet exigé à la création d'une liaison Infocom
    _toCreatePayload() {
        return {
            itemtype: 'Monitor',
            items_id: Number(this.items_id ?? this.monitor_id),
            ...this._toPayload()
        }
    }

    // --- CRUD ---------------------------------------------------------------

    async save() {
        const created = await apiV2.post(this.endpoint, this._toCreatePayload())
        return MonitorInfocom.fromData(created)
    }

    async getById(id) {
        const data = await apiV2.get(`${this.endpoint}/${id}`)
        return MonitorInfocom.fromData(data)
    }

    /**
     * Récupérer l'Infocom lié à un moniteur spécifique
     * @param {number} monitorId - ID du moniteur
     */
    async getByMonitor(monitorId) {
        const data = await apiV2.get(this.endpoint, { 
            filter: `items_id==${monitorId};itemtype=="Monitor"` 
        })
        return data.length > 0 ? MonitorInfocom.fromData(data[0]) : null
    }

    async update() {
        if (!this.id) throw new Error('Impossible de modifier sans ID')
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, this._toPayload())
        return MonitorInfocom.fromData(updated)
    }

    async delete() {
        if (!this.id) throw new Error('Impossible de supprimer sans ID')
        await apiV2.delete(`${this.endpoint}/${this.id}`)
    }

    // --- Validations --------------------------------------------------------

    validate() {
        const errors = []
        if (!this.items_id && !this.monitor_id && !this.id) {
            errors.push('L\'identifiant du moniteur (monitor_id) est requis')
        }
        if (this.value < 0) {
            errors.push('La valeur financière globale ne peut pas être négative')
        }
        if (this.warranty_value < 0) {
            errors.push('La valeur de garantie ne peut pas être négative')
        }
        return errors
    }
}

export default MonitorInfocom