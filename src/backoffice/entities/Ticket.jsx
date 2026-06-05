class Ticket {
    constructor(data = {}) {
        this.id = data.id ?? null

        // ── CORE FIELDS ─────────────────────────────
        this.name = data.name ?? ''
        this.content = data.content ?? ''
        this.external_id = data.external_id ?? null

        // ── GLPI IDS (IMPORTANT: pas d'objets imbriqués) ──
        this.status = this._normalizeStatus(data.status)
        this.priority = data.priority ?? null
        this.urgency = data.urgency ?? null
        this.impact = data.impact ?? null
        this.type = data.type ?? null

        this.is_deleted = data.is_deleted ?? false

        // ── RELATIONS GLPI (IDS UNIQUEMENT) ─────────
        this.users_id_recipient = data.users_id_recipient ?? null
        this.users_id_lastupdater = data.users_id_lastupdater ?? null
        this.itilcategories_id = data.itilcategories_id ?? null
        this.locations_id = data.locations_id ?? null
        this.entities_id = data.entities_id ?? null

        // ── DATES ────────────────────────────────────
        this.date_creation = data.date_creation ?? null
        this.date_mod = data.date_mod ?? null
        this.solvedate = data.solvedate ?? null
        this.closedate = data.closedate ?? null

        // ── SLA ──────────────────────────────────────
        this.time_to_resolve = data.time_to_resolve ?? null
        this.time_to_own = data.time_to_own ?? null
    }

    // ─────────────────────────────────────────────
    // NORMALISATION GLPI STATUS
    // ─────────────────────────────────────────────
    _normalizeStatus(status) {
        if (!status) return 1
        if (typeof status === 'object') return status.id ?? 1
        return status
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