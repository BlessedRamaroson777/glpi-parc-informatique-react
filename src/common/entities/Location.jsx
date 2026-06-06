import apiV2 from '../../backoffice/utils/apiV2.jsx'

class Location {

    static ENDPOINT = 'Dropdowns/Location'

    constructor(data = {}) {
        this.id = data.id ?? null

        this.name = data.name ?? ''
        this.code = data.code ?? ''
        this.alias = data.alias ?? ''

        this.comment = data.comment ?? ''

        this.room = data.room ?? ''
        this.building = data.building ?? ''

        this.address = data.address ?? ''
        this.town = data.town ?? ''
        this.postcode = data.postcode ?? ''

        this.state = data.state ?? ''
        this.country = data.country ?? ''

        this.latitude = data.latitude ?? ''
        this.longitude = data.longitude ?? ''
        this.altitude = data.altitude ?? ''

        this.entity = data.entity ?? null
        this.parent = data.parent ?? null

        // Lecture seule
        this.completename = data.completename ?? ''
        this.level = data.level ?? 0
        this.is_recursive = data.is_recursive ?? false

        this.date_creation = data.date_creation ?? null
        this.date_mod = data.date_mod ?? null
    }

    static fromData(data) {
        return new Location(data)
    }

    _toPayload() {
        const payload = {
            name: this.name,
            code: this.code,
            alias: this.alias,
            comment: this.comment,

            room: this.room,
            building: this.building,

            address: this.address,
            town: this.town,
            postcode: this.postcode,

            state: this.state,
            country: this.country,

            latitude: this.latitude,
            longitude: this.longitude,
            altitude: this.altitude
        }

        if (this.entity?.id) {
            payload.entity = {
                id: Number(this.entity.id)
            }
        }

        if (this.parent?.id) {
            payload.parent = {
                id: Number(this.parent.id)
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
            Location.ENDPOINT,
            this._toPayload()
        )

        return Location.fromData(data)
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
            `${Location.ENDPOINT}/${this.id}`,
            this._toPayload()
        )

        return Location.fromData(data)
    }

    async delete(purge = false) {
        if (!this.id) {
            throw new Error(
                'Impossible de supprimer sans ID'
            )
        }

        await apiV2.delete(
            `${Location.ENDPOINT}/${this.id}${purge ? '?purge=true' : ''}`
        )
    }

    // =========================
    // CRUD STATIC
    // =========================

    static async getById(id) {
        const data = await apiV2.get(
            `${Location.ENDPOINT}/${id}`
        )

        return Location.fromData(data)
    }

    static async getAll(params = {}) {
        const data = await apiV2.get(
            Location.ENDPOINT,
            params
        )

        return data.map(item =>
            Location.fromData(item)
        )
    }

    static async exists(id) {
        try {
            await Location.getById(id)
            return true
        } catch {
            return false
        }
    }

    static async findOne(params = {}) {
        const list = await Location.getAll({
            ...params,
            limit: 1
        })

        return list[0] ?? null
    }

    // =========================
    // RELATIONS
    // =========================

    async getParent() {
        if (!this.parent?.id) {
            return null
        }

        return Location.getById(
            this.parent.id
        )
    }

    async getChildren() {
        return apiV2.get(
            Location.ENDPOINT,
            {
                filter: `parent.id==${this.id}`
            }
        )
    }

    async getComputers() {
        return apiV2.get(
            'Assets/Computer',
            {
                filter: `location.id==${this.id}`
            }
        )
    }

    async getMonitors() {
        return apiV2.get(
            'Assets/Monitor',
            {
                filter: `location.id==${this.id}`
            }
        )
    }

    async getTickets() {
        return apiV2.get(
            'Assistance/Ticket',
            {
                filter: `location.id==${this.id}`
            }
        )
    }

    // =========================
    // UTILITAIRES
    // =========================

    hasCoordinates() {
        return (
            this.latitude &&
            this.longitude
        )
    }

    getFormattedCoordinates() {
        if (!this.hasCoordinates()) {
            return null
        }

        return `${this.latitude}, ${this.longitude}`
    }

    getFormattedAddress() {
        const parts = []

        if (this.address) parts.push(this.address)
        if (this.postcode) parts.push(this.postcode)
        if (this.town) parts.push(this.town)
        if (this.country) parts.push(this.country)

        return parts.join(' - ')
    }

    getFormattedPath() {
        return (
            this.completename ||
            this.name
        )
    }

    getIndentLevel() {
        return this.level ?? 0
    }

    getIndentPrefix() {
        return '  '.repeat(
            this.getIndentLevel()
        )
    }

    getIndentedName() {
        return (
            this.getIndentPrefix() +
            this.name
        )
    }

    // =========================
    // VALIDATION
    // =========================

    validate() {
        const errors = []

        if (!this.name?.trim()) {
            errors.push(
                'Nom de localisation requis'
            )
        }

        return errors
    }
}

export default Location