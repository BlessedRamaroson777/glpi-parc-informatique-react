/**
 * importFile1Service.jsx
 * ─────────────────────
 * Importe les assets depuis la Feuille 1 (Assets : Computers + Monitor).
 *
 * Ordre d'insertion GLPI :
 *   1. Localisations
 *   2. Fabricants
 *   3. États
 *   4. Modèles (ComputerModel / MonitorModel)
 *   5. Utilisateurs
 *   6. Ordinateurs
 *   7. Moniteurs
 *   8. Infocoms (auto par GLPI, mais on crée si absent)
 */

import { apiRequest, ensureV1Session } from "../../common/services/authService.jsx"
import apiV1 from "../../common/utils/apiV1.jsx"
import { parseCsv } from "../utils/importUtils.jsx"


// ── Résolution/création de référentiels ────────────────────────────────────

/**
 * Cherche un item par nom dans un endpoint GLPI.
 * Crée-le si inexistant.
 * Retourne l'ID GLPI.
 */
async function resolveOrCreate(endpoint, name, extraFields = {}, pushLog, dryRun) {
    if (!name) return null

    // GLPI API v2 ne supporte pas searchText — on récupère la liste complète
    // et on filtre côté client (référentiels petits, ≤ 200 entrées en pratique)
    let found = null
    try {
        const existing = await apiRequest(
            `/api.php/v2/${endpoint}?range=0-200`,
            { method: "GET" }
        )
        const items = Array.isArray(existing) ? existing : (existing?.data ?? [])
        found = items.find(it => it.name?.toLowerCase() === name.toLowerCase())
    } catch (err) {
        // Si la liste est vide, GLPI peut renvoyer 206/404 → on ignore et on crée
        pushLog(`  ↳ Liste ${endpoint} inaccessible (${err.message}) — tentative de création`, "warn")
    }

    if (found) {
        pushLog(`  ↳ ${endpoint} « ${name} » existe (id=${found.id})`, "info")
        return found.id
    }

    // Création
    pushLog(`  ↳ CREATE ${endpoint} « ${name} »`, "warn")
    if (dryRun) return `DRY-${name}`

    const created = await apiRequest(`/api.php/v2/${endpoint}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, ...extraFields }),
    })
    // GLPI peut retourner : {id, message} ou [{id, message}] ou null
    const record = Array.isArray(created) ? created[0] : created
    const newId  = record?.id ?? record?.data?.id ?? null
    if (newId) {
        pushLog(`  ↳ Créé avec id=${newId}`, "success")
    } else {
        pushLog(`  ↳ Créé (id non retourné par GLPI — réponse : ${JSON.stringify(created)})`, "warn")
    }
    return newId
}

// ── Mapping des champs ──────────────────────────────────────────────────────

const STATUS_MAP = {
    "en production": 1,
    "maintenance":   2,
    "en stock":      3,
    "en panne":      4,
}

function toSlug(name) {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9._]/g, "")
}

// ── Import principal ────────────────────────────────────────────────────────

/**
 * Importe tous les assets de la Feuille 1.
 *
 * @param {string}   csvText  — contenu brut du CSV
 * @param {Function} pushLog  — callback(msg, type)
 * @param {boolean}  dryRun
 * @returns {object} registry — { computers: Map<name,id>, monitors: Map<name,id> }
 */
export async function runFile1Import(csvText, pushLog, dryRun = true) {
    await ensureV1Session()   
    const rows = parseCsv(csvText)
    pushLog(`Feuille 1 — ${rows.length} lignes détectées`, "info")

    // Registres (name → GLPI id)
    const locationIds     = new Map()
    const manufacturerIds = new Map()
    const stateIds        = new Map()
    const modelIds        = new Map()   // key = "Computer:OptiPlex 7010"
    const userIds         = new Map()
    const computers       = new Map()
    const monitors        = new Map()

    // ── Étape 1 : Référentiels ──────────────────────────────────────────
    pushLog("── Référentiels ──", "info")

    const uniqueLocations     = [...new Set(rows.map(r => r.Location).filter(Boolean))]
    const uniqueManufacturers = [...new Set(rows.map(r => r.Manufacturer).filter(Boolean))]
    const uniqueStatuses      = [...new Set(rows.map(r => r.Status).filter(Boolean))]
    const computerModelNames  = [...new Set(rows.filter(r => r.Item_Type === "Computer").map(r => r.Model).filter(Boolean))]
    const monitorModelNames   = [...new Set(rows.filter(r => r.Item_Type === "Monitor").map(r => r.Model).filter(Boolean))]

    for (const name of uniqueLocations) {
        locationIds.set(name, await resolveOrCreate("Dropdowns/Location", name, {}, pushLog, dryRun))
    }
    for (const name of uniqueManufacturers) {
        manufacturerIds.set(name, await resolveOrCreate("Dropdowns/Manufacturer", name, {}, pushLog, dryRun))
    }
    for (const name of uniqueStatuses) {
        stateIds.set(name, await resolveOrCreate("Dropdowns/State", name, { is_visible: 1 }, pushLog, dryRun))
    }
    for (const name of computerModelNames) {
        modelIds.set(`Computer:${name}`, await resolveOrCreate("Dropdowns/ComputerModel", name, {}, pushLog, dryRun))
    }
    for (const name of monitorModelNames) {
        modelIds.set(`Monitor:${name}`, await resolveOrCreate("Dropdowns/MonitorModel", name, {}, pushLog, dryRun))
    }

    // ── Étape 2 : Utilisateurs ──────────────────────────────────────────
    pushLog("── Utilisateurs ──", "info")

    const uniqueUsers = [...new Set(rows.map(r => r.User).filter(Boolean))]
    // utilise v2

    // for (const fullName of uniqueUsers) {
    //     const parts    = fullName.trim().split(" ")
    //     const realname = parts.slice(1).join(" ") || fullName
    //     const name     = toSlug(fullName)          // login: prénom.nom
    //     const fields   = {
    //         name,
    //         realname,
    //         firstname: parts[0],
    //         password:  `ITU@${new Date().getFullYear()}!`,
    //         email:     `${name}@itu.mg`,
    //         is_active: 1,
    //     }
    //     userIds.set(fullName, await resolveOrCreate("Administration/User", name, fields, pushLog, dryRun))
    // }

    for (const fullName of uniqueUsers) {
        const parts    = fullName.trim().split(" ")
        const realname = parts.slice(1).join(" ") || fullName
        const name     = toSlug(fullName)
        const fields   = {
            name,
            realname,
            firstname: parts[0],
            password:  name,
            // password:  `ITU@${new Date().getFullYear()}!`,
            is_active: 1,
        }

        pushLog(`  ↳ CREATE User « ${name} »`, "warn")
        if (dryRun) { userIds.set(fullName, `DRY-${name}`); continue }

        try {
            const res = await apiV1.createItem("User", { input: fields })
            const id  = Array.isArray(res) ? res[0]?.id : res?.id
            pushLog(`  ↳ Créé avec id=${id}`, "success")
            userIds.set(fullName, id)
        } catch (err) {
            if (err.message.includes("existe") || err.message.includes("ERROR_GLPI_ADD")) {
                pushLog(`  ↳ User « ${name} » existe déjà — récupération de l'ID`, "warn")
                const searchRes = await apiV1.search("User", {
                    "criteria[0][field]":      1,
                    "criteria[0][searchtype]": "contains",
                    "criteria[0][value]":      name,
                    "forcedisplay[0]":         2,
                })
                const id = searchRes?.data?.[0]?.[2]
                userIds.set(fullName, id)
            } else {
                throw err
            }
        }
    }

    // ── Étape 3 : Assets ────────────────────────────────────────────────
    pushLog("── Assets ──", "info")

    const today = new Date().toISOString().slice(0, 10)

    for (const row of rows) {
        const isComputer = row.Item_Type === "Computer"
        const isMonitor  = row.Item_Type === "Monitor"
        if (!isComputer && !isMonitor) continue

        const itemtype = isComputer ? "Computer" : "Monitor"
        const modelKey = `${row.Item_Type}:${row.Model}`

        const payload = {
            name:             row.Name,
            otherserial:      row.Inventory_Number,
            serial:           `SN-${row.Inventory_Number}`,   // généré
            locations_id:     locationIds.get(row.Location)     ?? 0,
            manufacturers_id: manufacturerIds.get(row.Manufacturer) ?? 0,
            states_id:        stateIds.get(row.Status)          ?? 0,
            users_id:         userIds.get(row.User)             ?? 0,
            // users_id_tech:    userIds.get(row.User)             ?? 0,  // même utilisateur = technicien
            comment:          `Importé automatiquement le ${today}`,
            is_global:        0,
            date_mod:         `${today} 00:00:00`,
            ...(isComputer
                ? { computermodels_id: modelIds.get(modelKey) ?? 0 }
                : { monitormodels_id:  modelIds.get(modelKey) ?? 0 }
            ),
        }

        Object.keys(payload).forEach(k => {
            if (payload[k] === 0 || payload[k] === null || payload[k] === undefined) {
                delete payload[k]
            }
        })

        pushLog(`  CREATE ${itemtype} « ${row.Name} »`, "warn")

        if (!dryRun) {
            try {
                const res = await apiV1.createItem(itemtype, { input: payload })
                const newId = Array.isArray(res) ? res[0]?.id : res?.id
                if (newId) {
                    pushLog(`  ↳ id=${newId}`, "success")
                    if (isComputer) computers.set(row.Name, newId)
                    else            monitors.set(row.Name, newId)
                } else {
                    pushLog(`  ⚠ Erreur lors de la création de l'équipement (pas d'ID retourné)`, "error")
                }
            } catch (err) {
                pushLog(`  ⚠ Erreur: ${err.message}`, "error")
            }
        } else {
            if (isComputer) computers.set(row.Name, `DRY-${row.Name}`)
            else            monitors.set(row.Name, `DRY-${row.Name}`)
        }
    }

    pushLog(`Feuille 1 terminée ✓ (${computers.size} PC, ${monitors.size} moniteurs)`, "success")
    return { computers, monitors, userIds, locationIds, manufacturerIds, stateIds }
}
