class Ticket {
    constructor(data = {}) {
        this.id = data.id ?? null

        // ── CORE FIELDS ─────────────────────────────
        this.name       = data.name       ?? ''
        this.content    = data.content    ?? ''
        this.external_id = data.external_id ?? null
        this.team = data.team ?? []

        // ── GLPI IDS ────────────────────────────────
        this.status   = this._normalizeStatus(data.status)
        this.priority = this._normalizeId(data.priority)
        this.urgency  = this._normalizeId(data.urgency)
        this.impact   = this._normalizeId(data.impact)
        this.type     = this._normalizeId(data.type)

        this.is_deleted = data.is_deleted ?? false

        // ── RELATIONS (corrected key names) ─────────
        this.users_id_recipient   = this._normalizeId(data.user_recipient)   // was data.users_id_recipient
        this.users_id_lastupdater = this._normalizeId(data.user_editor)      // was data.users_id_lastupdater
        this.itilcategories_id    = this._normalizeId(data.category)         // was data.itilcategories_id
        this.locations_id         = this._normalizeId(data.location)         // was data.locations_id
        this.entities_id          = this._normalizeId(data.entity)           // was data.entities_id
        this.request_type         = this._normalizeId(data.request_type)     // new field

        // ── DATES (corrected key names) ──────────────
        this.date_creation = data.date_creation ?? null
        this.date_mod      = data.date_mod      ?? null
        this.solvedate     = data.date_solve    ?? null  // was data.solvedate
        this.closedate     = data.date_close    ?? null  // was data.closedate

        // ── SLA ──────────────────────────────────────
        this.time_to_resolve = data.sla_ttr ?? null  // was data.time_to_resolve
        this.time_to_own     = data.sla_tto ?? null  // was data.time_to_own
    }

    // ─────────────────────────────────────────────
    // NORMALISATION GLPI STATUS
    // ─────────────────────────────────────────────
    _normalizeStatus(status) {
        return this._normalizeId(status) ?? 1
    }

    _normalizeId(value) {
        if (value === null || value === undefined) return null
        if (typeof value === 'object') return value.id ?? null
        return value
    }

    // ─────────────────────────────────────────────
    // PAYLOAD GLPI (IMPORTANT: ONLY IDs)
    // ─────────────────────────────────────────────
    toPayload() {
        const payload = {
            name: this.name,
            content: this.content,
            external_id: this.external_id,

            status: Number(this.status),
            priority: Number(this.priority),
            urgency: Number(this.urgency),
            impact: Number(this.impact),
            type: Number(this.type),

            users_id_recipient: this.users_id_recipient,
            users_id_lastupdater: this.users_id_lastupdater,
            itilcategories_id: this.itilcategories_id,
            locations_id: this.locations_id,
            entities_id: this.entities_id,

            solvedate: this.solvedate,
            closedate: this.closedate,
            time_to_resolve: this.time_to_resolve,
            time_to_own: this.time_to_own
        }

        // clean null values (important GLPI)
        Object.keys(payload).forEach(k => {
            if (payload[k] === null || payload[k] === undefined) {
                delete payload[k]
            }
        })

        return payload
    }

    // ─────────────────────────────────────────────
    // VALIDATION MINIMALE
    // ─────────────────────────────────────────────
    validate() {
        const errors = []

        if (!this.name?.trim()) {
            errors.push('Ticket name required')
        }

        if (!this.content?.trim()) {
            errors.push('Ticket content required')
        }

        return errors
    }
}

export default Ticket