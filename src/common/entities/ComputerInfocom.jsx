import apiV2 from '../../backoffice/utils/apiV2.jsx'

class ComputerInfocom {

    constructor(data = {}) {
        this.id = data.id ?? null

        this.computer_id =
            data.computer_id ??
            data.items_id ??
            null

        this.comment = data.comment ?? ''

        this.order_number = data.order_number ?? ''
        this.delivery_number = data.delivery_number ?? ''
        this.immo_number = data.immo_number ?? ''
        this.invoice_number = data.invoice_number ?? ''

        this.warranty_info = data.warranty_info ?? ''

        this.date_buy = data.date_buy ?? null
        this.date_use = data.date_use ?? null
        this.date_order = data.date_order ?? null
        this.date_delivery = data.date_delivery ?? null
        this.date_inventory = data.date_inventory ?? null
        this.date_warranty = data.date_warranty ?? null
        this.date_decommission = data.date_decommission ?? null

        this.value = data.value ?? 0
        this.warranty_value = data.warranty_value ?? 0
        this.warranty_duration = data.warranty_duration ?? 0

        this.amortization_type = data.amortization_type ?? 0
        this.amortization_time = data.amortization_time ?? 0
        this.amortization_coeff = data.amortization_coeff ?? 0

        this.budget = data.budget ?? null
        this.supplier = data.supplier ?? null
        this.business_criticity = data.business_criticity ?? null

        // Lecture seule
        this.itemtype = data.itemtype ?? 'Computer'
        this.is_recursive = data.is_recursive ?? false
        this.entity = data.entity ?? null
    }

    static fromData(data, computerId = null) {
        return new ComputerInfocom({
            ...data,
            computer_id:
                computerId ??
                data.computer_id ??
                data.items_id ??
                null
        })
    }

    _getEndpoint() {
        const computerId =
            this.computer_id ??
            this.items_id

        if (!computerId) {
            throw new Error(
                'computer_id requis'
            )
        }

        return `Assets/Computer/${Number(computerId)}/Infocom`
    }

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

            value: this.value,
            warranty_value: this.warranty_value,
            warranty_duration: this.warranty_duration,

            amortization_type: this.amortization_type,
            amortization_time: this.amortization_time,
            amortization_coeff: this.amortization_coeff
        }

        if (this.budget?.id) {
            payload.budget = {
                id: Number(this.budget.id)
            }
        }

        if (this.supplier?.id) {
            payload.supplier = {
                id: Number(this.supplier.id)
            }
        }

        if (this.business_criticity?.id) {
            payload.business_criticity = {
                id: Number(this.business_criticity.id)
            }
        }

        return payload
    }

    // =========================
    // CRUD INSTANCE
    // =========================

    async save() {
        const errors = this.validate()

        if (errors.length) {
            throw new Error(errors.join(', '))
        }

        const data = await apiV2.post(
            this._getEndpoint(),
            this._toPayload()
        )

        return ComputerInfocom.fromData(
            data,
            this.computer_id
        )
    }

    async update() {
        if (!this.id) {
            throw new Error(
                'Impossible de modifier sans ID'
            )
        }

        const errors = this.validate()

        if (errors.length) {
            throw new Error(errors.join(', '))
        }

        const data = await apiV2.patch(
            `${this._getEndpoint()}/${this.id}`,
            this._toPayload()
        )

        return ComputerInfocom.fromData(
            data,
            this.computer_id
        )
    }

    async delete() {
        if (!this.id) {
            throw new Error(
                'Impossible de supprimer sans ID'
            )
        }

        await apiV2.delete(
            `${this._getEndpoint()}/${this.id}`
        )
    }

    // =========================
    // CRUD STATIC
    // =========================

    static async getById(
        computerId,
        infocomId
    ) {
        const data = await apiV2.get(
            `Assets/Computer/${Number(computerId)}/Infocom/${Number(infocomId)}`
        )

        return ComputerInfocom.fromData(
            data,
            computerId
        )
    }

    static async getByComputer(computerId) {
        if (!computerId) {
            return null
        }

        try {
            const data = await apiV2.get(
                `Assets/Computer/${Number(computerId)}/Infocom`
            )

            if (!data) {
                return null
            }

            if (Array.isArray(data)) {
                if (data.length === 0) {
                    return null
                }

                return ComputerInfocom.fromData(
                    data[0],
                    computerId
                )
            }

            return ComputerInfocom.fromData(
                data,
                computerId
            )
        } catch {
            return null
        }
    }

    // =========================
    // VALIDATION
    // =========================

    validate() {
        const errors = []

        if (!this.computer_id && !this.id) {
            errors.push(
                'Ordinateur associé requis'
            )
        }

        if (this.value < 0) {
            errors.push(
                'Valeur financière invalide'
            )
        }

        if (this.warranty_value < 0) {
            errors.push(
                'Valeur de garantie invalide'
            )
        }

        if (this.warranty_duration < 0) {
            errors.push(
                'Durée de garantie invalide'
            )
        }

        if (this.amortization_time < 0) {
            errors.push(
                'Durée d’amortissement invalide'
            )
        }

        return errors
    }
}

export default ComputerInfocom