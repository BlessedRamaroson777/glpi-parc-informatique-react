import { apiRequest } from "../../common/services/authService.jsx"
import { RESET_CONFIG, PROTECTED_IDS } from "../constants/resetEntities.jsx"

// ── Helpers ────────────────────────────────────────────────────────────────

export function normalizeItems(payload) {
    if (Array.isArray(payload)) return payload
    if (payload?.data && Array.isArray(payload.data)) return payload.data
    return []
}

// ── Suppression d'une entité ───────────────────────────────────────────────

/**
 * Supprime tous les items d'une entité GLPI.
 * @param {object}   entity  — entrée du RESET_CONFIG enrichie avec `key`
 * @param {Function} pushLog — callback(msg, type)
 * @param {boolean}  dryRun  — si true, aucun appel DELETE réel
 */
export async function deleteEntity(entity, pushLog, dryRun = true) {
    const { key, endpoint } = entity
    const isSubResource     = endpoint.includes("{id}")

    if (isSubResource) {
        // Récupère la liste des parents pour itérer sur leurs sous-ressources
        const parentKey = entity.dependencies?.[0]
        const parentCfg = RESET_CONFIG[parentKey]
        if (!parentCfg) {
            pushLog(`⚠ Pas de config parent pour ${key}`, "warn")
            return
        }

        const parents = normalizeItems(
            await apiRequest(`/api.php/v2/${parentCfg.endpoint}`, { method: "GET" })
        )

        for (const parent of parents) {
            const url   = `/api.php/v2/${endpoint.replace("{id}", parent.id)}`
            let items = []
            try {
                // items = normalizeItems(await apiRequest(url, { method: "GET" }))
                // ligne simple resource
                items = normalizeItems(await apiRequest(`${url}?limit=1000`, { method: "GET" }))

            } catch (e) {
                // CORRECTION : On ignore aussi l'erreur 400 "Not Found" spécifique à l'API v2 de GLPI
                const isNotFound = e.message.includes("404") || 
                                   e.message.includes("400") || 
                                   e.message.includes("ERROR_ITEM_NOT_FOUND");
                
                if (!isNotFound) {
                    pushLog(`⚠ Erreur inattendue sur ${url}: ${e.message}`, "warn")
                }
                continue
            }
            for (const item of items) {
                pushLog(`DELETE ${url}/${item.id}`, "warn")
                if (!dryRun) {
                    try {
                        await apiRequest(`${url}/${item.id}?force=true`, { method: "DELETE" })
                    } catch (err) {
                        pushLog(`  ↳ Déjà supprimé ou introuvable (${err.message})`, "info")
                    }
                }
            }
        }
    } else {
        const url   = `/api.php/v2/${endpoint}`
        let items = []
        try {
            // items = normalizeItems(await apiRequest(url, { method: "GET" }))
            items = normalizeItems(await apiRequest(`${url}?limit=1000`, { method: "GET" }))

        } catch (e) {
            pushLog(`Impossible de lister ${url} (${e.message})`, "warn")
            return
        }
        const skip  = PROTECTED_IDS[key] ?? []

        for (const item of items) {
            if (skip.includes(item.id)) {
                pushLog(`SKIP ${key} #${item.id} (protégé)`, "warn")
                continue
            }
            pushLog(`DELETE ${url}/${item.id}`, "warn")
            if (!dryRun) {
                try {
                    await apiRequest(`${url}/${item.id}?force=true`, { method: "DELETE" })
                } catch (err) {
                    pushLog(`  ↳ Déjà supprimé ou introuvable (${err.message})`, "info")
                }
            }
        }
    }
}

// ── Orchestrateur ──────────────────────────────────────────────────────────

/**
 * Exécute la réinitialisation de toutes les entités sélectionnées, dans l'ordre.
 * @param {object[]} entities — liste filtrée + triée d'entités
 * @param {Function} pushLog  — callback(msg, type)
 * @param {boolean}  dryRun
 */
export async function runReset(entities, pushLog, dryRun = true) {
    if (dryRun) pushLog("Mode DRY-RUN — aucune suppression réelle", "info")

    for (const entity of entities) {
        pushLog(`▶ ${entity.label}`, "info")
        await deleteEntity(entity, pushLog, dryRun)
        pushLog(`✓ ${entity.label}`, "success")
    }

    pushLog(dryRun ? "DRY-RUN terminé" : "Réinitialisation terminée ✓", "success")
    alert(dryRun ? "DRY-RUN terminé — aucune suppression réelle" : "Réinitialisation terminée ✓")
}

export async function runResetForAll(pushLog, dryRun = true) {
    const allEntities = Object.entries(RESET_CONFIG).map(([key, cfg]) => ({ key, ...cfg }))
    const sortedEntities = allEntities.sort((a, b) => a.order - b.order)
    await runReset(sortedEntities, pushLog, dryRun)
}
