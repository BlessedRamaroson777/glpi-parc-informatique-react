export const RESET_CONFIG = {

    // ── Assistance ─────────────────────────────

    tickets: {
        group: "Assistance",
        label: "Tickets",
        endpoint: "Assistance/Ticket",
        order: 1,
        dependencies: [],
        description: "Ticket 1 (Tsy mandeha) et Ticket 2 (Michauffe). Purge auto: suivis, coûts, membres et liaisons documents.",
    },

    problems: {
        group: "Assistance",
        label: "Problèmes",
        endpoint: "Assistance/Problem",
        order: 2,
        dependencies: [],
        description: "Tous les problèmes ITIL.",
    },

    changes: {
        group: "Assistance",
        label: "Changements",
        endpoint: "Assistance/Change",
        order: 3,
        dependencies: [],
        description: "Tous les changements ITIL.",
    },

    // ── Assets ─────────────────────────────

    computers: {
        group: "Assets",
        label: "Ordinateurs",
        endpoint: "Assets/Computer",
        order: 4,
        dependencies: [],
        description: "9 PC du PDF. Purge auto: Infocoms, composants internes.",
    },

    monitors: {
        group: "Assets",
        label: "Moniteurs",
        endpoint: "Assets/Monitor",
        order: 5,
        dependencies: [],
        description: "MN-FORM-002. Purge auto: Infocom.",
    },

    network_equipments: {
        group: "Assets",
        label: "Équipements réseau",
        endpoint: "Assets/NetworkEquipment",
        order: 6,
        dependencies: [],
        description: "Tous les équipements réseau.",
    },

    peripherals: {
        group: "Assets",
        label: "Périphériques",
        endpoint: "Assets/Peripheral",
        order: 7,
        dependencies: [],
        description: "Tous les périphériques.",
    },

    phones: {
        group: "Assets",
        label: "Téléphones",
        endpoint: "Assets/Phone",
        order: 8,
        dependencies: [],
        description: "Tous les téléphones.",
    },

    printers: {
        group: "Assets",
        label: "Imprimantes",
        endpoint: "Assets/Printer",
        order: 9,
        dependencies: [],
        description: "Toutes les imprimantes.",
    },

    networkequipment_models: {
        group: "Référentiels",
        label: "Modèles équipements réseau",
        endpoint: "Dropdowns/NetworkEquipmentModel",
        order: 33,
        dependencies: [],
    },

    peripheral_models: {
        group: "Référentiels",
        label: "Modèles périphériques",
        endpoint: "Dropdowns/PeripheralModel",
        order: 34,
        dependencies: [],
    },

    phone_models: {
        group: "Référentiels",
        label: "Modèles téléphones",
        endpoint: "Dropdowns/PhoneModel",
        order: 35,
        dependencies: [],
    },

    printer_models: {
        group: "Référentiels",
        label: "Modèles imprimantes",
        endpoint: "Dropdowns/PrinterModel",
        order: 36,
        dependencies: [],
    },

    softwares: {
        group: "Assets",
        label: "Logiciels",
        endpoint: "Assets/Software",
        order: 10,
        dependencies: [],
        description: "Tous les logiciels.",
    },

    software_licenses: {
        group: "Assets",
        label: "Licences logicielles",
        endpoint: "Assets/SoftwareLicense",
        order: 11,
        dependencies: [],
        description: "Toutes les licences logicielles.",
    },

    certificates: {
        group: "Assets",
        label: "Certificats",
        endpoint: "Assets/Certificate",
        order: 12,
        dependencies: [],
        description: "Tous les certificats.",
    },

    appliances: {
        group: "Assets",
        label: "Applicatifs",
        endpoint: "Assets/Appliance",
        order: 13,
        dependencies: [],
        description: "Tous les applicatifs.",
    },

    racks: {
        group: "Assets",
        label: "Baies serveur",
        endpoint: "Assets/Rack",
        order: 14,
        dependencies: [],
        description: "Toutes les baies serveur.",
    },

    enclosures: {
        group: "Assets",
        label: "Châssis",
        endpoint: "Assets/Enclosure",
        order: 15,
        dependencies: [],
        description: "Tous les châssis.",
    },

    pdus: {
        group: "Assets",
        label: "PDU",
        endpoint: "Assets/PDU",
        order: 16,
        dependencies: [],
        description: "Toutes les unités de distribution électrique.",
    },

    passive_dc_equipments: {
        group: "Assets",
        label: "Équipements passifs DC",
        endpoint: "Assets/PassiveDCEquipment",
        order: 17,
        dependencies: [],
        description: "Tous les équipements passifs de datacenter.",
    },

    cables: {
        group: "Assets",
        label: "Câbles",
        endpoint: "Assets/Cable",
        order: 18,
        dependencies: [],
        description: "Tous les câbles.",
    },

    sockets: {
        group: "Assets",
        label: "Prises",
        endpoint: "Assets/Socket",
        order: 19,
        dependencies: [],
        description: "Toutes les prises.",
    },

    unmanaged: {
        group: "Assets",
        label: "Assets non gérés",
        endpoint: "Assets/Unmanaged",
        order: 20,
        dependencies: [],
        description: "Tous les assets non gérés.",
    },

    // ── Gestion ─────────────────────────────

    documents: {
        group: "Gestion",
        label: "Documents",
        endpoint: "Management/Document",
        order: 21,
        dependencies: [],
        description: "Supprime les documents et fichiers physiques.",
    },

    contracts: {
        group: "Gestion",
        label: "Contrats",
        endpoint: "Management/Contract",
        order: 22,
        dependencies: [],
        description: "Tous les contrats.",
    },

    suppliers: {
        group: "Gestion",
        label: "Fournisseurs",
        endpoint: "Management/Supplier",
        order: 23,
        dependencies: [],
        description: "Tous les fournisseurs.",
    },

    contacts: {
        group: "Gestion",
        label: "Contacts",
        endpoint: "Management/Contact",
        order: 24,
        dependencies: [],
        description: "Tous les contacts.",
    },

    budgets: {
        group: "Gestion",
        label: "Budgets",
        endpoint: "Management/Budget",
        order: 25,
        dependencies: [],
        description: "Tous les budgets.",
    },

    // ── Projets ─────────────────────────────

    tasks: {
        group: "Projets",
        label: "Tâches",
        endpoint: "Project/Task",
        order: 26,
        dependencies: [],
        description: "Toutes les tâches de projet.",
    },

    // ── Administration ─────────────────────────────

    users: {
        group: "Administration",
        label: "Utilisateurs",
        endpoint: "Administration/User",
        order: 27,
        dependencies: [],
        description: "Rakoto Jean, Rasoanaivo Marie, Rakotondranaivo Paul, Rabe Hanitra, Rakoto Michel",
    },

    // ── Référentiels ─────────────────────────────

    computer_models: {
        group: "Référentiels",
        label: "Modèles d'ordinateurs",
        endpoint: "Dropdowns/ComputerModel",
        order: 28,
        dependencies: [],
        description: "9 modèles PC du PDF",
    },

    monitor_models: {
        group: "Référentiels",
        label: "Modèles de moniteurs",
        endpoint: "Dropdowns/MonitorModel",
        order: 29,
        dependencies: [],
        description: "AC1000",
    },

    manufacturers: {
        group: "Référentiels",
        label: "Fabricants",
        endpoint: "Dropdowns/Manufacturer",
        order: 30,
        dependencies: [],
        description: "Dell, HP, Lenovo",
    },

    locations: {
        group: "Référentiels",
        label: "Localisations",
        endpoint: "Dropdowns/Location",
        order: 31,
        dependencies: [],
        description: "Administration, Comptabilité, Laboratoire IA, Bibliothèque, Salle 301, Magasin Informatique",
    },

    states: {
        group: "Référentiels",
        label: "États",
        endpoint: "Dropdowns/State",
        order: 32,
        dependencies: [],
        description: "En production, Maintenance, En stock, En panne",
    },
}

export const PROTECTED_IDS = {
    users: [2, 3, 4, 5, 6],

    computer_models: [],
    monitor_models: [],
    manufacturers: [],
    locations: [],
    states: [],
}