import apiV2 from '../../backoffice/utils/apiV2.jsx'

// Constantes pour le type d'authentification
export const USER_AUTHTYPE = {
    GLPI: 1,
    LDAP: 2,
    MAIL: 3,
    CAS: 4,
    X509: 5,
    API: 6,
}

class User {
    // Endpoint conforme a la configuration de reset
    endpoint = 'Administration/User'

    constructor(data = {}) {
        this.id = data.id ?? null  // readOnly

        // Champs simples
        this.username = data.username ?? ''
        this.realname = data.realname ?? ''
        this.firstname = data.firstname ?? ''
        this.phone = data.phone ?? ''
        this.phone2 = data.phone2 ?? ''
        this.mobile = data.mobile ?? ''
        this.comment = data.comment ?? ''
        this.registration_number = data.registration_number ?? ''
        this.nickname = data.nickname ?? ''

        // Booleans
        this.is_active = data.is_active ?? true
        this.is_deleted = data.is_deleted ?? false  // readOnly

        // Champs writeOnly
        this.password = data.password ?? ''
        this.password2 = data.password2 ?? ''

        // Enum
        this.authtype = data.authtype ?? USER_AUTHTYPE.GLPI

        // Relations (objets)
        this.location = data.location ?? null
        this.default_profile = data.default_profile ?? null
        this.default_entity = data.default_entity ?? null
        this.title = data.title ?? null
        this.category = data.category ?? null

        // Relations (tableaux) - Récupérés séparément ou via fields étendus
        this.emails = data.emails ?? []

        // Dates writables
        this.last_login = data.last_login ?? null
        this.begin_date = data.begin_date ?? null
        this.end_date = data.end_date ?? null
        this.substitution_start_date = data.substitution_start_date ?? null
        this.substitution_end_date = data.substitution_end_date ?? null

        // Dates readOnly
        this.date_creation = data.date_creation ?? null
        this.date_mod = data.date_mod ?? null
        this.date_sync = data.date_sync ?? null
        this.date_password_change = data.date_password_change ?? null
        this.picture = data.picture ?? null
    }

    static fromData(data) {
        const obj = Object.create(User.prototype)
        Object.assign(obj, data)
        obj.endpoint = 'Administration/User'
        return obj
    }

    // Payload de modification standardisé
    _toPayload() {
        return {
            username: this.username,
            realname: this.realname,
            firstname: this.firstname,
            phone: this.phone,
            phone2: this.phone2,
            mobile: this.mobile,
            comment: this.comment,
            registration_number: this.registration_number,
            nickname: this.nickname,
            is_active: Boolean(this.is_active),
            authtype: Number(this.authtype),
            last_login: this.last_login,
            begin_date: this.begin_date,
            end_date: this.end_date,
            substitution_start_date: this.substitution_start_date,
            substitution_end_date: this.substitution_end_date,
            
            // Relations objets conformes à l'API plate ou structurée
            location: this.location?.id ? { id: Number(this.location.id) } : null,
            default_profile: this.default_profile?.id ? { id: Number(this.default_profile.id) } : null,
            default_entity: this.default_entity?.id ? { id: Number(this.default_entity.id) } : null,
            title: this.title?.id ? { id: Number(this.title.id) } : null,
            category: this.category?.id ? { id: Number(this.category.id) } : null
        }
    }

    _toCreatePayload() {
        const payload = this._toPayload()
        if (this.password) {
            payload.password = this.password
            payload.password2 = this.password2 || this.password
        }
        return payload
    }

    // --- CRUD ---------------------------------------------------------------

    async save() {
        const created = await apiV2.post(this.endpoint, this._toCreatePayload())
        return User.fromData(created)
    }

    async getById(id) {
        const data = await apiV2.get(`${this.endpoint}/${id}`)
        return User.fromData(data)
    }

    async getAll(params = {}) {
        const data = await apiV2.get(this.endpoint, params)
        return data.map(item => User.fromData(item))
    }

    async update() {
        if (!this.id) throw new Error('Impossible de modifier un User sans ID')
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, this._toPayload())
        return User.fromData(updated)
    }

    async delete(force = false) {
        if (!this.id) throw new Error('Impossible de supprimer un User sans ID')
        await apiV2.delete(`${this.endpoint}/${this.id}${force ? '?force=true' : ''}`)
    }

    // --- Méthodes spécifiques optimisées serveur (RSQL) ---------------------

    async getByUsername(username) {
        if (!username) return null
        const data = await this.getAll({ filter: `username=="${username}"` })
        return data.length > 0 ? data[0] : null
    }

    async getByEmail(email) {
        if (!email) return null
        // Filtre de liaison à travers la table associative
        const data = await this.getAll({ filter: `UserEmail.email=="${email}"` })
        return data.length > 0 ? data[0] : null
    }

    async getActive() {
        return await this.getAll({ filter: 'is_active==true' })
    }

    async getInactive() {
        return await this.getAll({ filter: 'is_active==false' })
    }

    async getDeleted() {
        return await this.getAll({ filter: 'is_deleted==true' })
    }

    async getByAuthType(authtype) {
        return await this.getAll({ filter: `authtype==${Number(authtype)}` })
    }

    async getLDAPUsers() {
        return await this.getByAuthType(USER_AUTHTYPE.LDAP)
    }

    async getByDefaultProfile(profileId) {
        if (!profileId) return []
        return await this.getAll({ filter: `default_profile.id==${profileId}` })
    }

    async getByDefaultEntity(entityId) {
        if (!entityId) return []
        return await this.getAll({ filter: `default_entity.id==${entityId}` })
    }

    async getByCategory(categoryId) {
        if (!categoryId) return []
        return await this.getAll({ filter: `category.id==${categoryId}` })
    }

    async getByTitle(titleId) {
        if (!titleId) return []
        return await this.getAll({ filter: `title.id==${titleId}` })
    }

    async getByLocation(locationId) {
        if (!locationId) return []
        return await this.getAll({ filter: `location.id==${locationId}` })
    }

    async searchByName(searchTerm) {
        if (!searchTerm?.trim()) return []
        return await this.getAll({ 
            filter: `username==*${searchTerm}*;realname==*${searchTerm}*,firstname==*${searchTerm}*` 
        })
    }

    async restore() {
        if (!this.id) throw new Error('Impossible de restaurer un User sans ID')
        // Dans GLPI, la restauration passe par une modification de is_deleted
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, { is_deleted: false })
        return User.fromData(updated)
    }

    async changePassword(newPassword, confirmPassword) {
        if (!this.id) throw new Error('Impossible de changer le mot de passe sans ID')
        if (newPassword !== confirmPassword) throw new Error('Les mots de passe ne correspondent pas')
        
        const payload = {
            password: newPassword,
            password2: confirmPassword
        }
        
        const updated = await apiV2.patch(`${this.endpoint}/${this.id}`, payload)
        return User.fromData(updated)
    }

    async activate() {
        if (!this.id) throw new Error('Impossible d\'activer un User sans ID')
        this.is_active = true
        return await this.update()
    }

    async deactivate() {
        if (!this.id) throw new Error('Impossible de désactiver un User sans ID')
        this.is_active = false
        return await this.update()
    }

    // --- Utilitaires de filtres génériques (Via API) -----------------------

    async getByApi(fieldName, value) {
        if (value === undefined || value === null || value === '') return []
        const values = Array.isArray(value) ? value : [value]
        const normalized = values.map(v => String(v).trim()).filter(s => s !== '')
        if (normalized.length === 0) return []

        const filter = normalized.length === 1
            ? `${fieldName}=="${normalized[0]}"`
            : `${fieldName}=in=(${normalized.join(',')})`

        return await this.getAll({ filter })
    }

    async getByNotApi(fieldName, value) {
        if (value === undefined || value === null || value === '') return []
        const values = Array.isArray(value) ? value : [value]
        const normalized = values.map(v => String(v).trim()).filter(s => s !== '')
        if (normalized.length === 0) return []

        const filter = normalized.length === 1
            ? `${fieldName}!="${normalized[0]}"`
            : `${fieldName}=out=(${normalized.join(',')})`

        return await this.getAll({ filter })
    }

    async getInclApi(includeIds = []) {
        const ids = includeIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        if (ids.length === 0) return []
        return await this.getAll({ filter: `id=in=(${ids.join(',')})` })
    }

    async getExclApi(excludeIds = []) {
        const ids = excludeIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        if (ids.length === 0) return await this.getAll()
        return await this.getAll({ filter: `id=out=(${ids.join(',')})` })
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

    // --- Validations et Getters --------------------------------------------

    validate() {
        const errors = []
        if (!this.username?.trim()) errors.push("Le nom d'utilisateur est requis")
        
        if (this.begin_date && this.end_date && new Date(this.begin_date) > new Date(this.end_date)) {
            errors.push('La date de début doit être antérieure à la date de fin')
        }
        return errors
    }

    getFullName() {
        return `${this.firstname} ${this.realname}`.trim() || this.username
    }

    getDisplayName() {
        if (this.realname) return `${this.firstname} ${this.realname}`
        return this.username
    }

    getPrimaryEmail() {
        const primary = this.emails.find(email => email.is_default)
        return primary ? primary.email : (this.emails[0]?.email || null)
    }

    isActive() {
        const now = new Date()
        if (!this.is_active || this.is_deleted) return false
        if (this.begin_date && new Date(this.begin_date) > now) return false
        if (this.end_date && new Date(this.end_date) < now) return false
        return true
    }

    getAuthTypeLabel() {
        const labels = {
            1: 'GLPI interne',
            2: 'LDAP',
            3: 'Email',
            4: 'CAS',
            5: 'X.509',
            6: 'API'
        }
        return labels[this.authtype] || 'Inconnu'
    }
}

export default User