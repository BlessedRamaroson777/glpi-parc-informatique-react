export const FICHIER1_CONFIG = {

  users: {
    group: 'Administration',
    label: 'Utilisateurs',
    endpoint: 'Administration/User',
  },

  locations: {
    group: 'Référentiels',
    label: 'Localisations',
    endpoint: 'Dropdowns/Location',
  },

  manufacturers: {
    group: 'Référentiels',
    label: 'Fabricants',
    endpoint: 'Dropdowns/Manufacturer',
  },

  states: {
    group: 'Référentiels',
    label: 'États',
    endpoint: 'Dropdowns/State',
  },

  computer_models: {
    group: 'Référentiels',
    label: 'Modèles d\'ordinateurs',
    endpoint: 'Dropdowns/ComputerModel',
  },

  monitor_models: {
    group: 'Référentiels',
    label: 'Modèles de moniteurs',
    endpoint: 'Dropdowns/MonitorModel',
  },

  computers: {
    group: 'Assets',
    label: 'Ordinateurs',
    endpoint: 'Assets/Computer',
    dependencies: [
      'users',
      'locations',
      'manufacturers',
      'states',
      'computer_models'
    ],
  },

  monitors: {
    group: 'Assets',
    label: 'Moniteurs',
    endpoint: 'Assets/Monitor',
    dependencies: [
      'users',
      'locations',
      'manufacturers',
      'states',
      'monitor_models'
    ],
  },

  computer_infocom: {
    group: 'Assets',
    label: 'Infocoms des ordinateurs',
    endpoint: 'Assets/Computer/{id}/Infocom',
    dependencies: ['computers'],
  },

  monitor_infocom: {
    group: 'Assets',
    label: 'Infocom des moniteurs',
    endpoint: 'Assets/Monitor/{id}/Infocom',
    dependencies: ['monitors'],
  },
};

export const FICHIER2_CONFIG = {

  tickets: {
    group: 'Assistance',
    label: 'Tickets',
    endpoint: 'Assistance/Ticket',
  },

  ticket_team_members: {
    group: 'Assistance',
    label: 'Membres des tickets',
    endpoint: 'Assistance/Ticket/{id}/TeamMember',
    dependencies: ['tickets'],
  },

  ticket_items: {
    group: 'Assistance',
    label: 'Éléments des tickets',
    endpoint: 'Assistance/Ticket/{id}/Item',
    dependencies: ['tickets'],
  }

};

export const FICHIER3_CONFIG = {

  ticket_costs: {
    group: 'Assistance',
    label: 'Coûts des tickets',
    endpoint: 'Assistance/Ticket/{id}/Cost',
    dependencies: ['tickets'],
  },

};