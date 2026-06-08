// export const ASSET_TYPES = [
//     { key: "Computer",         label: "Ordinateurs" },
//     { key: "Monitor",          label: "Moniteurs" },
//     { key: "Printer",          label: "Imprimantes" },
//     { key: "Phone",            label: "Téléphones" },
//     { key: "NetworkEquipment", label: "Équipements réseau" },
//     { key: "Software",         label: "Logiciels" },
//     { key: "Peripheral",       label: "Périphériques" },
// ]

// export const ASSET_TYPES = [
//     { key: "Computer", label: "Ordinateurs" },
//     { key: "Monitor", label: "Moniteurs" },
//     { key: "NetworkEquipment", label: "Équipements réseau" },
//     { key: "Peripheral", label: "Périphériques" },
//     { key: "Phone", label: "Téléphones" },
//     { key: "Printer", label: "Imprimantes" },
//     { key: "Software", label: "Logiciels" },
//     { key: "SoftwareLicense", label: "Licences logicielles" },
//     { key: "Certificate", label: "Certificats" },
//     { key: "Appliance", label: "Applicatifs" },
//     { key: "Rack", label: "Baies serveur" },
//     { key: "Enclosure", label: "Châssis" },
//     { key: "PDU", label: "PDU" },
//     { key: "PassiveDCEquipment", label: "Équipements passifs DC" },
//     { key: "Cable", label: "Câbles" },
//     { key: "Socket", label: "Prises" },
//     { key: "Unmanaged", label: "Assets non gérés" },
// ]
import { RESET_CONFIG } from "../../backoffice/constants/resetEntities.jsx"

export const ASSET_TYPES = Object.entries(RESET_CONFIG)
    .filter(([_, cfg]) => cfg.group === "Assets")
    .sort((a, b) => a[1].order - b[1].order)
    .map(([_, cfg]) => ({
        key:   cfg.endpoint.replace("Assets/", ""),  // "Computer", "Monitor"…
        label: cfg.label,
    }))