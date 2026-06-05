export const RESET_CONFIG = {

  // ── 1. Sous-ressources tickets EN PREMIER ─────────────────────────────────

  ticket_costs: {
    group: 'Assistance',
    label: 'Coûts des tickets',
    endpoint: 'Assistance/Ticket/{id}/Cost',
    order: 1,
    dependencies: ['tickets'],
    description: '2 entrées de coût sur le ticket 1 (page 3 du PDF)',
  },
  ticket_followups: {
    group: 'Assistance',
    label: 'Suivis des tickets',
    endpoint: 'Assistance/Ticket/{id}/Timeline/Followup',
    order: 1.1,
    dependencies: ['tickets'],
    description: 'Suivis auto créés par GLPI ou manuellement',
  },
  ticket_documents: {
    group: 'Assistance',
    label: 'Documents des tickets',
    endpoint: 'Assistance/Ticket/{id}/Timeline/Document',
    order: 1.2,
    dependencies: ['tickets'],
    description: 'Documents attachés dans la timeline',
  },
  ticket_team_members: {
    group: 'Assistance',
    label: 'Membres des tickets',
    endpoint: 'Assistance/Ticket/{id}/TeamMember',
    order: 1.3,
    dependencies: ['tickets'],
    description: 'Liens assets ↔ tickets (PC-ADM-001, MN-FORM-002)',
  },

  // ── 2. Tickets ────────────────────────────────────────────────────────────

  tickets: {
    group: 'Assistance',
    label: 'Tickets',
    endpoint: 'Assistance/Ticket',
    order: 2,
    dependencies: [],
    description: 'Ticket 1 (Tsy mandeha) et Ticket 2 (Michauffe) du PDF',
  },

  // ── 3. Sous-ressources assets ─────────────────────────────────────────────

  computer_infocom: {
    group: 'Assets',
    label: 'Infocoms des ordinateurs',
    endpoint: 'Assets/Computer/{id}/Infocom',
    order: 3,
    dependencies: ['computers'],
    description: 'Fiches financières auto-créées sur les 9 PC',
  },
  monitor_infocom: {
    group: 'Assets',
    label: 'Infocom du moniteur',
    endpoint: 'Assets/Monitor/{id}/Infocom',
    order: 3.1,
    dependencies: ['monitors'],
    description: 'Fiche financière auto-créée sur MN-FORM-002',
  },

  // ── 4. Assets ─────────────────────────────────────────────────────────────

  computers: {
    group: 'Assets',
    label: 'Ordinateurs',
    endpoint: 'Assets/Computer',
    order: 4,
    dependencies: ['users', 'locations', 'manufacturers', 'states', 'computer_models'],
    description: '9 PC du PDF',
  },
  monitors: {
    group: 'Assets',
    label: 'Moniteurs',
    endpoint: 'Assets/Monitor',
    order: 4.1,
    dependencies: ['users', 'locations', 'manufacturers', 'states', 'monitor_models'],
    description: 'MN-FORM-002',
  },

  // ── 5. Utilisateurs ───────────────────────────────────────────────────────

  users: {
    group: 'Administration',
    label: 'Utilisateurs',
    endpoint: 'Administration/User',
    order: 5,
    dependencies: [],
    description: 'Rakoto Jean, Rasoanaivo Marie, Rakotondranaivo Paul, Rabe Hanitra, Rakoto Michel',
  },

  // ── 6. Référentiels EN DERNIER ────────────────────────────────────────────

  computer_models: {
    group: 'Référentiels',
    label: 'Modèles d\'ordinateurs',
    endpoint: 'Dropdowns/ComputerModel',
    order: 6,
    dependencies: [],
    description: '9 modèles PC du PDF',
  },
  monitor_models: {
    group: 'Référentiels',
    label: 'Modèles de moniteurs',
    endpoint: 'Dropdowns/MonitorModel',
    order: 6.1,
    dependencies: [],
    description: 'AC1000',
  },
  manufacturers: {
    group: 'Référentiels',
    label: 'Fabricants',
    endpoint: 'Dropdowns/Manufacturer',
    order: 6.2,
    dependencies: [],
    description: 'Dell, HP, Lenovo',
  },
  locations: {
    group: 'Référentiels',
    label: 'Localisations',
    endpoint: 'Dropdowns/Location',
    order: 6.3,
    dependencies: [],
    description: 'Administration, Comptabilité, Laboratoire IA, Bibliothèque, Salle 301, Magasin Informatique',
  },
  states: {
    group: 'Référentiels',
    label: 'États',
    endpoint: 'Dropdowns/State',
    order: 6.4,
    dependencies: [],
    description: 'En production, Maintenance, En stock, En panne',
  },
}


export const PROTECTED_IDS = {
  users: [2, 3, 4, 5, 6],
  states:           [],  
  locations:        [],  
  manufacturers:    [],  
  computer_models:  [],  
  monitor_models:   [],  
}