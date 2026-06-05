import apiV2 from '../utils/apiV2.jsx'

// Mapping des rôles officiels de l'API GLPI v2.3
export const GLPI_ACTOR_ROLES = {
    REQUESTER: 1,  // Demandeur
    ASSIGNED: 2,   // Assigné (Technicien / Groupe en charge)
    OBSERVER: 3    // Observateur
}

class TicketTeamMember {
    endpoint = 'Assistance/Ticket'

    constructor(data = {}) {
        this.id = data.id ?? null
        this.name = data.name ?? ''
        this.type = data.type ?? 'User'     // User, Group, Supplier
        this.role = data.role ?? GLPI_ACTOR_ROLES.ASSIGNED // Rôle numérique (1, 2 ou 3)
        this.ticket_id = data.ticket_id ?? null
    }

    static fromData(data, ticketId = null) {
        const obj = Object.create(TicketTeamMember.prototype)
        
        // GLPI retourne les acteurs sous forme d'objets typés (ex: users_id, groups_id)
        obj.id = data.users_id ?? data.groups_id ?? data.suppliers_id ?? data.id ?? null
        obj.name = data.name ?? ''
        obj.type = data.users_id ? 'User' : (data.groups_id ? 'Group' : (data.suppliers_id ? 'Supplier' : (data.type ?? 'User')))
        obj.role = Number(data.role ?? data.type); // Dans GLPI, le champ 'type' de l'acteur représente son rôle (1, 2, 3)
        obj.ticket_id = ticketId
        
        return obj
    }

    // 2. CORRECTION: Extraction depuis la structure globale _actors de GLPI v2.3
    async getByTicket(ticketId) {
        if (!ticketId) return []
        const ticket = await apiV2.get(`${this.endpoint}/${ticketId}`)
        
        // GLPI v2.3 sépare les acteurs par types dans l'objet '_actors'
        const actors = ticket._actors || {}
        const members = []

        if (actors.users) {
            actors.users.forEach(u => members.push(TicketTeamMember.fromData(u, ticketId)))
        }
        if (actors.groups) {
            actors.groups.forEach(g => members.push(TicketTeamMember.fromData(g, ticketId)))
        }
        if (actors.suppliers) {
            actors.suppliers.forEach(s => members.push(TicketTeamMember.fromData(s, ticketId)))
        }

        return members
    }

    // 2. CORRECTION: Injection ou modification d'un acteur via l'objet '_actors'
    async addToTicket(ticketId, memberData) {
        if (!ticketId) throw new Error('ID du ticket manquant')
        
        const roleId = typeof memberData.role === 'string' 
            ? (GLPI_ACTOR_ROLES[memberData.role.toUpperCase()] ?? 2)
            : Number(memberData.role ?? 2)

        // Préparation du payload d'acteurs conforme à GLPI v2.3
        const actorPayload = {}
        if (memberData.type === 'Group') {
            actorPayload.groups_id = Number(memberData.id)
        } else if (memberData.type === 'Supplier') {
            actorPayload.suppliers_id = Number(memberData.id)
        } else {
            actorPayload.users_id = Number(memberData.id)
        }
        actorPayload.type = roleId // Le champ 'type' dans l'objet d'action spécifie le rôle (1,2,3)

        // Envoi direct de la mise à jour de l'acteur imbriqué
        const updated = await apiV2.patch(`${this.endpoint}/${ticketId}`, {
            _actors: [actorPayload]
        })

        return TicketTeamMember.fromData({ ...actorPayload, id: memberData.id }, ticketId)
    }

    // 2. CORRECTION: Suppression via la structure d'acteurs de GLPI
    async removeFromTicket(ticketId, memberId, memberType) {
        if (!ticketId) throw new Error('ID du ticket manquant')

        // Pour supprimer un acteur dans GLPI, on passe une instruction de mise à jour 
        // ou on reconstruit la liste en omettant le membre supprimé.
        const ticket = await apiV2.get(`${this.endpoint}/${ticketId}`)
        const actors = ticket._actors || {}
        const updatedActors = []

        // Filtrage des utilisateurs
        if (actors.users) {
            actors.users.forEach(u => {
                if (!(memberType === 'User' && Number(u.users_id) === Number(memberId))) {
                    updatedActors.push({ users_id: u.users_id, type: u.type })
                }
            })
        }
        // Filtrage des groupes
        if (actors.groups) {
            actors.groups.forEach(g => {
                if (!(memberType === 'Group' && Number(g.groups_id) === Number(memberId))) {
                    updatedActors.push({ groups_id: g.groups_id, type: g.type })
                }
            })
        }

        return await apiV2.patch(`${this.endpoint}/${ticketId}`, { _actors: updatedActors })
    }

    // 2. CORRECTION: Mise à jour du rôle numérique
    async updateRole(ticketId, memberId, memberType, newRole) {
        const roleId = typeof newRole === 'string' 
            ? (GLPI_ACTOR_ROLES[newRole.toUpperCase()] ?? 2)
            : Number(newRole)

        // L'ajout d'un acteur existant avec un nouveau rôle écrase ou ajoute le rôle dans GLPI
        return await this.addToTicket(ticketId, { id: memberId, type: memberType, role: roleId })
    }

    // 3. CORRECTION OPTIMISATION: Fini le filtrage en boucle côté client !
    // Utilisation des filtres natifs RSQL de GLPI v2.3
    async getTicketsByUser(userId) {
        if (!userId) return []
        // Interroge directement le serveur pour n'obtenir QUE les tickets de cet utilisateur
        return await apiV2.get(this.endpoint, { 
            filter: `_actors.users_id==${userId}` 
        })
    }

    // --- Traducteurs d'affichage -------------------------------------------

    getTypeLabel() {
        const labels = { 'User': 'Utilisateur', 'Group': 'Groupe', 'Supplier': 'Fournisseur' }
        return labels[this.type] || this.type
    }

    getRoleLabel() {
        const currentRole = Number(this.role)
        const labels = { 
            1: 'Demandeur', 
            2: 'Assigné (Technicien)', 
            3: 'Observateur' 
        }
        return labels[currentRole] || 'Inconnu'
    }
}

export default TicketTeamMember