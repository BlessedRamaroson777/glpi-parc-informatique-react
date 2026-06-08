import { apiRequest, ensureV1Session } from "../../common/services/authService.jsx"
import apiV1 from "../../common/utils/apiV1.jsx"
import { parseCsv } from "../utils/importUtils.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"

// ── Mapping Item_Type CSV → endpoint GLPI V1 ────────────────────────────────

const ITEMTYPE_TO_ENDPOINT = Object.fromEntries(
    ASSET_TYPES.map(({ key }) => [key, key])
)

// Modèles GLPI par type d'asset
const MODEL_ENDPOINT = {
    Computer:           "Dropdowns/ComputerModel",
    Monitor:            "Dropdowns/MonitorModel",
    NetworkEquipment:   "Dropdowns/NetworkEquipmentModel",
    Peripheral:         "Dropdowns/PeripheralModel",
    Phone:              "Dropdowns/PhoneModel",
    Printer:            "Dropdowns/PrinterModel",
    // Les autres types n'ont pas de modèle dédié dans GLPI
}

const MODEL_FIELD = {
    Computer:           "computermodels_id",
    Monitor:            "monitormodels_id",
    NetworkEquipment:   "networkequipmentmodels_id",
    Peripheral:         "peripheralmodels_id",
    Phone:              "phonemodels_id",
    Printer:            "printermodels_id",
}

// ── Résolution/création de référentiels ────────────────────────────────────

async function resolveOrCreate(endpoint, name, extraFields = {}, pushLog, dryRun) {
    if (!name) return null

    let found = null
    try {
        const existing = await apiRequest(
            `/api.php/v2/${endpoint}?range=0-200`,
            { method: "GET" }
        )
        const items = Array.isArray(existing) ? existing : (existing?.data ?? [])
        found = items.find(it => it.name?.toLowerCase() === name.toLowerCase())
    } catch (err) {
        pushLog(`  ↳ Liste ${endpoint} inaccessible — tentative de création`, "warn")
    }

    if (found) {
        pushLog(`  ↳ ${endpoint} « ${name} » existe (id=${found.id})`, "info")
        return found.id
    }

    pushLog(`  ↳ CREATE ${endpoint} « ${name} »`, "warn")
    if (dryRun) return `DRY-${name}`

    const created = await apiRequest(`/api.php/v2/${endpoint}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, ...extraFields }),
    })
    const record = Array.isArray(created) ? created[0] : created
    const newId  = record?.id ?? record?.data?.id ?? null
    if (newId) {
        pushLog(`  ↳ Créé avec id=${newId}`, "success")
    } else {
        pushLog(`  ↳ Créé (réponse: ${JSON.stringify(created)})`, "warn")
    }
    return newId
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(name) {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9._]/g, "")
}

// ── Import principal ────────────────────────────────────────────────────────

export async function runFile1Import(csvText, pushLog, dryRun = true) {
    await ensureV1Session()
    const rows = parseCsv(csvText)
    pushLog(`Feuille 1 — ${rows.length} lignes détectées`, "info")

    const locationIds     = new Map()
    const manufacturerIds = new Map()
    const stateIds        = new Map()
    const modelIds        = new Map()   // "Computer:OptiPlex 7010" → id
    const userIds         = new Map()

    // Registre dynamique : une Map par type d'asset
    // ex: assetRegistry.get("Computer") → Map<name, glpiId>
    const assetRegistry = new Map()
    ASSET_TYPES.forEach(({ key }) => assetRegistry.set(key, new Map()))

    // ── Étape 1 : Référentiels ──────────────────────────────────────────
    pushLog("── Référentiels ──", "info")

    const uniqueLocations     = [...new Set(rows.map(r => r.Location).filter(Boolean))]
    const uniqueManufacturers = [...new Set(rows.map(r => r.Manufacturer).filter(Boolean))]
    const uniqueStatuses      = [...new Set(rows.map(r => r.Status).filter(Boolean))]

    for (const name of uniqueLocations) {
        locationIds.set(name, await resolveOrCreate("Dropdowns/Location", name, {}, pushLog, dryRun))
    }
    for (const name of uniqueManufacturers) {
        manufacturerIds.set(name, await resolveOrCreate("Dropdowns/Manufacturer", name, {}, pushLog, dryRun))
    }
    for (const name of uniqueStatuses) {
        stateIds.set(name, await resolveOrCreate("Dropdowns/State", name, { is_visible: 1 }, pushLog, dryRun))
    }

    // Modèles — uniquement pour les types qui en ont
    for (const [itemtype, modelEndpoint] of Object.entries(MODEL_ENDPOINT)) {
        const names = [...new Set(
            rows.filter(r => r.Item_Type === itemtype).map(r => r.Model).filter(Boolean)
        )]
        for (const name of names) {
            modelIds.set(
                `${itemtype}:${name}`,
                await resolveOrCreate(modelEndpoint, name, {}, pushLog, dryRun)
            )
        }
    }

    // ── Étape 2 : Utilisateurs ──────────────────────────────────────────
    pushLog("── Utilisateurs ──", "info")

    const uniqueUsers = [...new Set(rows.map(r => r.User).filter(Boolean))]

    for (const fullName of uniqueUsers) {
        const parts    = fullName.trim().split(" ")
        const realname = parts.slice(1).join(" ") || fullName
        const name     = toSlug(fullName)
        const fields   = {
            name,
            realname,
            firstname: parts[0],
            password:  name,
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
        // const itemtype = row.Item_Type
        // if (!itemtype || !ITEMTYPE_TO_ENDPOINT[itemtype]) {
        //     pushLog(`  ⚠ Type inconnu « ${itemtype} » — ligne ignorée`, "warn")
        //     continue
        // }
        const itemtype = row.Item_Type
        // const endpoint = ITEMTYPE_TO_ENDPOINT[itemtype]
        const endpoint =
            itemtype === "Socket"
                ? "Glpi\\Socket"
                : itemtype

        if (!itemtype || !endpoint) {
            pushLog(`⚠ Type inconnu « ${itemtype} » — ligne ignorée`, "warn")
            continue
        }
        const modelKey   = `${itemtype}:${row.Model}`
        const modelField = MODEL_FIELD[itemtype]

        const payload = {
            name:             row.Name,
            otherserial:      row.Inventory_Number,
            serial:           row.Inventory_Number ?? "",
            locations_id:     locationIds.get(row.Location)       ?? 0,
            manufacturers_id: manufacturerIds.get(row.Manufacturer) ?? 0,
            states_id:        stateIds.get(row.Status)             ?? 0,
            users_id:         userIds.get(row.User)                ?? 0,
            comment:          `Importé automatiquement le ${today}`,
            is_global:        0,
            date_mod:         `${today} 00:00:00`,
            ...(modelField && modelIds.has(modelKey)
                ? { [modelField]: modelIds.get(modelKey) }
                : {}
            ),
        }

        // Nettoie les valeurs nulles/zéro
        Object.keys(payload).forEach(k => {
            if (payload[k] === 0 || payload[k] === null || payload[k] === undefined || payload[k] === "") {
                delete payload[k]
            }
        })

        pushLog(`  CREATE ${itemtype} « ${row.Name} »`, "warn")

        if (!dryRun) {
            try {
                let res
                // const res   = await apiV1.createItem(itemtype, { input: payload })
                if (itemtype === "Socket") {
                    res = await apiRequest(
                        "/api.php/v2/Assets/Socket",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(payload)
                        }
                    )

                    console.log(res)
                }
                else {
                    res = await apiV1.createItem(itemtype, {
                        input: payload
                    })
                }
                // const res = await apiV1.createItem(endpoint, {
                //     input: payload
                // })
                const newId = Array.isArray(res) ? res[0]?.id : res?.id
                if (newId) {
                    pushLog(`  ↳ id=${newId}`, "success")
                    assetRegistry.get(itemtype)?.set(row.Name, newId)
                } else {
                    pushLog(`  ⚠ Pas d'ID retourné pour « ${row.Name} »`, "error")
                    throw new Error(`Pas d'ID retourné pour « ${row.Name} »`)
                }
            } catch (err) {
                pushLog(`  ⚠ Erreur: ${err.message}`, "error")
                throw new Error(`  ⚠ Erreur: ${err.message}`, "error")

            }
        } else {
            assetRegistry.get(itemtype)?.set(row.Name, `DRY-${row.Name}`)
        }
    }

    // Résumé
    const counts = ASSET_TYPES
        .map(({ key, label }) => ({ label, count: assetRegistry.get(key)?.size ?? 0 }))
        .filter(({ count }) => count > 0)
        .map(({ label, count }) => `${count} ${label}`)
        .join(", ")
    pushLog(`Feuille 1 terminée ✓ (${counts || "0 assets"})`, "success")

    // Retourne le registre complet + rétrocompatibilité computers/monitors
    return {
        assetRegistry,
        computers:    assetRegistry.get("Computer")  ?? new Map(),
        monitors:     assetRegistry.get("Monitor")   ?? new Map(),
        userIds,
        locationIds,
        manufacturerIds,
        stateIds,
    }
}