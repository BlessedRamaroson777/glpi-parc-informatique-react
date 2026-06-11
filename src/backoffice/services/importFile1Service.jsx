import { apiRequest, ensureV1Session } from "../../common/services/authService.jsx"
import apiV1 from "../../common/utils/apiV1.jsx"
import { parseCsv } from "../utils/importUtils.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"
import { F1 } from "../constants/importConstants.jsx"   // ← import F1

// ── Mapping Item_Type CSV → endpoint GLPI V1 ────────────────────────────────

const ITEMTYPE_TO_ENDPOINT = Object.fromEntries(
    ASSET_TYPES.map(({ key }) => [key, key])
)

const MODEL_ENDPOINT = {
    Computer:           "Dropdowns/ComputerModel",
    Monitor:            "Dropdowns/MonitorModel",
    NetworkEquipment:   "Dropdowns/NetworkEquipmentModel",
    Peripheral:         "Dropdowns/PeripheralModel",
    Phone:              "Dropdowns/PhoneModel",
    Printer:            "Dropdowns/PrinterModel",
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
    const modelIds        = new Map()
    const userIds         = new Map()

    const assetRegistry = new Map()
    ASSET_TYPES.forEach(({ key }) => assetRegistry.set(key, new Map()))

    // ── Étape 1 : Référentiels ──────────────────────────────────────────
    pushLog("── Référentiels ──", "info")

    const uniqueLocations     = [...new Set(rows.map(r => r[F1.LOCATION]).filter(Boolean))]
    const uniqueManufacturers = [...new Set(rows.map(r => r[F1.MANUFACTURER]).filter(Boolean))]
    const uniqueStatuses      = [...new Set(rows.map(r => r[F1.STATUS]).filter(Boolean))]

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
            rows
                .filter(r => r[F1.ITEM_TYPE] === itemtype)
                .map(r => r[F1.MODEL])
                .filter(Boolean)
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

    const uniqueUsers = [...new Set(rows.map(r => r[F1.USER]).filter(Boolean))]

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
        const itemtype = row[F1.ITEM_TYPE]
        const endpoint = itemtype === "Socket" ? "Glpi\\Socket" : itemtype

        if (!itemtype || !endpoint) {
            pushLog(`⚠ Type inconnu « ${itemtype} » — ligne ignorée`, "warn")
            continue
        }

        const modelKey   = `${itemtype}:${row[F1.MODEL]}`
        const modelField = MODEL_FIELD[itemtype]

        const payload = {
            name:             row[F1.NAME],
            otherserial:      row[F1.INVENTORY_NUMBER],
            serial:           row[F1.INVENTORY_NUMBER] ?? "",
            locations_id:     locationIds.get(row[F1.LOCATION])     ?? 0,
            manufacturers_id: manufacturerIds.get(row[F1.MANUFACTURER]) ?? 0,
            states_id:        stateIds.get(row[F1.STATUS])           ?? 0,
            users_id:         userIds.get(row[F1.USER])              ?? 0,
            comment:          `Importé automatiquement le ${today}`,
            is_global:        0,
            date_mod:         `${today} 00:00:00`,
            ...(modelField && modelIds.has(modelKey)
                ? { [modelField]: modelIds.get(modelKey) }
                : {}
            ),
        }

        Object.keys(payload).forEach(k => {
            if (payload[k] === 0 || payload[k] === null || payload[k] === undefined || payload[k] === "") {
                delete payload[k]
            }
        })

        pushLog(`  CREATE ${itemtype} « ${row[F1.NAME]} »`, "warn")

        if (!dryRun) {
            try {
                let res
                if (itemtype === "Socket") {
                    res = await apiRequest("/api.php/v2/Assets/Socket", {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body:    JSON.stringify(payload),
                    })
                } else {
                    res = await apiV1.createItem(itemtype, { input: payload })
                }

                const newId = Array.isArray(res) ? res[0]?.id : res?.id
                if (newId) {
                    pushLog(`  ↳ id=${newId}`, "success")
                    assetRegistry.get(itemtype)?.set(row[F1.NAME], newId)
                } else {
                    pushLog(`  ⚠ Pas d'ID retourné pour « ${row[F1.NAME]} »`, "error")
                    throw new Error(`Pas d'ID retourné pour « ${row[F1.NAME]} »`)
                }
            } catch (err) {
                pushLog(`  ⚠ Erreur: ${err.message}`, "error")
                throw new Error(`⚠ Erreur: ${err.message}`)
            }
        } else {
            assetRegistry.get(itemtype)?.set(row[F1.NAME], `DRY-${row[F1.NAME]}`)
        }
    }

    // Résumé
    const counts = ASSET_TYPES
        .map(({ key, label }) => ({ label, count: assetRegistry.get(key)?.size ?? 0 }))
        .filter(({ count }) => count > 0)
        .map(({ label, count }) => `${count} ${label}`)
        .join(", ")
    pushLog(`Feuille 1 terminée ✓ (${counts || "0 assets"})`, "success")

    return {
        assetRegistry,
        computers:    assetRegistry.get("Computer") ?? new Map(),
        monitors:     assetRegistry.get("Monitor")  ?? new Map(),
        userIds,
        locationIds,
        manufacturerIds,
        stateIds,
    }
}