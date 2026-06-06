import apiV2 from '../../backoffice/utils/apiV2.jsx'
import ComputerInfocom from './ComputerInfocom.jsx'

class Computer {

    static ENDPOINT = 'Assets/Computer'

    constructor(data = {}) {
        this.id = data.id ?? null

        // Général
        this.name = data.name ?? ''
        this.comment = data.comment ?? ''

        // Identifiants
        this.serial = data.serial ?? ''
        this.otherserial = data.otherserial ?? ''
        this.uuid = data.uuid ?? ''

        // Etat
        this.is_deleted = data.is_deleted ?? false
        this.is_template = data.is_template ?? false
        this.template_name = data.template_name ?? ''
        this.is_dynamic = data.is_dynamic ?? false

        // Dates
        this.date_creation = data.date_creation ?? null
        this.date_mod = data.date_mod ?? null
        this.last_inventory_update = data.last_inventory_update ?? null
        this.last_boot = data.last_boot ?? null

        // Relations
        this.entity = data.entity ?? null
        this.location = data.location ?? null

        this.user = data.user ?? null
        this.user_tech = data.user_tech ?? null

        this.group = data.group ?? []
        this.group_tech = data.group_tech ?? []

        this.manufacturer = data.manufacturer ?? null
        this.type = data.type ?? null
        this.model = data.model ?? null
        this.status = data.status ?? null
    }

    static fromData(data) {
        return new Computer(data)
    }

    _toPayload() {
        const payload = {
            name: this.name,
            comment: this.comment,
            serial: this.serial,
            otherserial: this.otherserial,
            uuid: this.uuid,
            is_template: this.is_template,
            template_name: this.template_name,
            is_dynamic: this.is_dynamic,
            last_boot: this.last_boot
        }

        if (this.entity?.id) {
            payload.entity = {
                id: Number(this.entity.id)
            }
        }

        if (this.location?.id) {
            payload.location = {
                id: Number(this.location.id)
            }
        }

        if (this.manufacturer?.id) {
            payload.manufacturer = {
                id: Number(this.manufacturer.id)
            }
        }

        if (this.user?.id) {
            payload.user = {
                id: Number(this.user.id)
            }
        }

        if (this.user_tech?.id) {
            payload.user_tech = {
                id: Number(this.user_tech.id)
            }
        }

        if (this.type?.id) {
            payload.type = {
                id: Number(this.type.id)
            }
        }

        if (this.model?.id) {
            payload.model = {
                id: Number(this.model.id)
            }
        }

        if (this.status?.id) {
            payload.status = {
                id: Number(this.status.id)
            }
        }

        if (this.group?.length) {
            payload.group = this.group.map(group => ({
                id: Number(group.id)
            }))
        }

        if (this.group_tech?.length) {
            payload.group_tech = this.group_tech.map(group => ({
                id: Number(group.id)
            }))
        }

        return payload
    }

    // CRUD INSTANCE

    async save() {
        const data = await apiV2.post(
            Computer.ENDPOINT,
            this._toPayload()
        )

        return Computer.fromData(data)
    }

    async update() {
        if (!this.id) {
            throw new Error('Computer ID requis')
        }

        const data = await apiV2.patch(
            `${Computer.ENDPOINT}/${this.id}`,
            this._toPayload()
        )

        return Computer.fromData(data)
    }

    async delete(purge = false) {
        if (!this.id) {
            throw new Error('Computer ID requis')
        }

        await apiV2.delete(
            `${Computer.ENDPOINT}/${this.id}${purge ? '?purge=true' : ''}`
        )
    }

    // CRUD STATIC

    static async getById(id) {
        const data = await apiV2.get(
            `${Computer.ENDPOINT}/${id}`
        )

        return Computer.fromData(data)
    }

    static async getAll(params = {}) {
        const data = await apiV2.get(
            Computer.ENDPOINT,
            params
        )

        return data.map(item => Computer.fromData(item))
    }

    static async exists(id) {
        try {
            await Computer.getById(id)
            return true
        } catch {
            return false
        }
    }

    static async findOne(params = {}) {
        const list = await Computer.getAll({
            ...params,
            limit: 1
        })

        return list[0] ?? null
    }

    // FILTRES

    static async getByUser(userId) {
        return Computer.getAll({
            filter: `user.id==${Number(userId)}`
        })
    }

    static async getByManufacturer(manufacturerId) {
        return Computer.getAll({
            filter: `manufacturer.id==${Number(manufacturerId)}`
        })
    }

    static async getByLocation(locationId) {
        return Computer.getAll({
            filter: `location.id==${Number(locationId)}`
        })
    }

    static async getByModel(modelId) {
        return Computer.getAll({
            filter: `model.id==${Number(modelId)}`
        })
    }

    static async getByStatus(statusId) {
        return Computer.getAll({
            filter: `status.id==${Number(statusId)}`
        })
    }

    // RELATIONS

    async getInfocom() {
        if (!this.id) {
            return null
        }

        return ComputerInfocom.getByComputer(this.id)
    }

    // VALIDATION

    validate() {
        const errors = []

        if (!this.name?.trim()) {
            errors.push('Nom requis')
        }

        return errors
    }
}

export default Computer