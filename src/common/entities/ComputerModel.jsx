import apiV2 from '../utils/apiV2.jsx'

export const RACK_DEPTH = {
    QUARTER: 0.25,
    THIRD: 0.33,
    HALF: 0.5,
    FULL: 1
}

class ComputerModel {

    static ENDPOINT = 'Dropdowns/ComputerModel'

    constructor(data = {}) {
        this.id = data.id ?? null

        this.name = data.name ?? ''
        this.comment = data.comment ?? ''

        this.product_number = data.product_number ?? ''

        this.weight = data.weight ?? 0
        this.rack_units = data.rack_units ?? 1
        this.depth = data.depth ?? RACK_DEPTH.FULL

        this.power_connections =
            data.power_connections ?? 0

        this.power_consumption =
            data.power_consumption ?? 0

        this.is_half_rack =
            data.is_half_rack ?? false

        // Lecture seule
        this.picture_front =
            data.picture_front ?? null

        this.picture_rear =
            data.picture_rear ?? null

        this.pictures =
            data.pictures ?? []

        this.date_creation =
            data.date_creation ?? null

        this.date_mod =
            data.date_mod ?? null
    }

    static fromData(data) {
        return new ComputerModel(data)
    }

    _toPayload() {
        return {
            name: this.name,
            comment: this.comment,
            product_number: this.product_number,

            weight: Number(this.weight),
            rack_units: Number(this.rack_units),
            depth: Number(this.depth),

            power_connections:
                Number(this.power_connections),

            power_consumption:
                Number(this.power_consumption),

            is_half_rack:
                Boolean(this.is_half_rack)
        }
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
            ComputerModel.ENDPOINT,
            this._toPayload()
        )

        return ComputerModel.fromData(data)
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
            `${ComputerModel.ENDPOINT}/${this.id}`,
            this._toPayload()
        )

        return ComputerModel.fromData(data)
    }

    async delete(purge = false) {
        if (!this.id) {
            throw new Error(
                'Impossible de supprimer sans ID'
            )
        }

        await apiV2.delete(
            `${ComputerModel.ENDPOINT}/${this.id}${purge ? '?purge=true' : ''}`
        )
    }

    // =========================
    // CRUD STATIC
    // =========================

    static async getById(id) {
        const data = await apiV2.get(
            `${ComputerModel.ENDPOINT}/${id}`
        )

        return ComputerModel.fromData(data)
    }

    static async getAll(params = {}) {
        const data = await apiV2.get(
            ComputerModel.ENDPOINT,
            params
        )

        return data.map(item =>
            ComputerModel.fromData(item)
        )
    }

    static async exists(id) {
        try {
            await ComputerModel.getById(id)
            return true
        } catch {
            return false
        }
    }

    static async findOne(params = {}) {
        const list = await ComputerModel.getAll({
            ...params,
            limit: 1
        })

        return list[0] ?? null
    }

    // =========================
    // RELATIONS
    // =========================

    async getComputers() {
        if (!this.id) {
            return []
        }

        return await apiV2.get(
            'Assets/Computer',
            {
                filter: `model.id==${this.id}`
            }
        )
    }

    // =========================
    // UTILITAIRES
    // =========================

    isRackable() {
        return this.rack_units > 0
    }

    getDepthLabel() {
        const labels = {
            0.25: '1/4',
            0.33: '1/3',
            0.5: '1/2',
            1: 'Pleine'
        }

        return (
            labels[this.depth] ??
            String(this.depth)
        )
    }

    getPictureFrontUrl() {
        return this.picture_front
    }

    getPictureRearUrl() {
        return this.picture_rear
    }

    getAllPicturesUrls() {
        return this.pictures
    }

    // =========================
    // VALIDATION
    // =========================

    validate() {
        const errors = []

        if (!this.name?.trim()) {
            errors.push(
                'Nom du modèle requis'
            )
        }

        if (this.weight < 0) {
            errors.push(
                'Poids invalide'
            )
        }

        if (this.rack_units < 1) {
            errors.push(
                'Rack units invalide'
            )
        }

        if (this.power_connections < 0) {
            errors.push(
                'Nombre de connexions invalide'
            )
        }

        if (this.power_consumption < 0) {
            errors.push(
                'Consommation invalide'
            )
        }

        return errors
    }
}

export default ComputerModel