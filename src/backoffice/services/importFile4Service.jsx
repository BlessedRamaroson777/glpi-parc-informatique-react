import JSZip from "jszip"
import apiV1 from "../../common/utils/apiV1.jsx"
import { apiRequest } from "../../common/services/authService.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"

// ─── Magic bytes ───────────────────────────────────────────────────────────
const IMAGE_SIGNATURES = [
    { ext: 'jpg',  mime: 'image/jpeg', parts: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }] },
    { ext: 'png',  mime: 'image/png',  parts: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }] },
    { ext: 'gif',  mime: 'image/gif',  parts: [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }] },
    { ext: 'bmp',  mime: 'image/bmp',  parts: [{ offset: 0, bytes: [0x42, 0x4d] }] },
    { ext: 'webp', mime: 'image/webp', parts: [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }] },
]

function detectType(bytes) {
    for (const sig of IMAGE_SIGNATURES) {
        if (sig.parts.every(p => p.bytes.every((b, i) => bytes[p.offset + i] === b))) {
            return { ext: sig.ext, mime: sig.mime }
        }
    }
    return null
}

function resolveAsset(name, assetRegistry) {
    for (const [itemtype, map] of assetRegistry) {
        if (map.has(name)) {
            return {
                itemtype,
                items_id: map.get(name)
            }
        }
    }
    return null
}

async function buildRegistryFromGlpi(assetNames, pushLog) {
    pushLog("↳ Registre vide — chargement depuis GLPI...", "info")

    const nameSet = new Set(assetNames)
    const registry = new Map()

    for (const asset of ASSET_TYPES) {
        try {
            // Une seule requête par type — pas de filtre, on filtre côté client
            const res = await apiRequest(
                `/api.php/v2/Assets/${asset.key}?range=0-999`,
                { method: "GET" }
            )

            if (!Array.isArray(res) || res.length === 0) continue

            const map = new Map()
            for (const item of res) {
                if (nameSet.has(item.name)) {
                    map.set(item.name, item.id)
                }
            }

            if (map.size > 0) {
                const itemtype = asset.key === "Socket" ? "Glpi\\Socket" : asset.key
                registry.set(itemtype, map)
                pushLog(`  ↳ ${asset.key}: ${map.size} asset(s) trouvé(s)`, "info")
            }
        } catch (err) {
            pushLog(`  ⚠ Erreur chargement ${asset.key}: ${err.message}`, "warn")
            // non-bloquant — on continue avec les autres types
        }
    }

    const total = [...registry.values()].reduce((acc, m) => acc + m.size, 0)
    pushLog(`↳ Registre reconstruit (${total} assets trouvés)`, "success")
    return registry
}

export async function runFile4Import(zipFile, pushLog, dryRun = false, registry = {}) {
    pushLog("═══ Feuille 4 : Images ═══", "info")

    let { assetRegistry = new Map() } = registry

    const zip = await JSZip.loadAsync(zipFile)
    const imageFiles = Object.entries(zip.files).filter(([name, file]) =>
        !file.dir &&
        !name.startsWith("__MACOSX") &&
        !name.split("/").pop().startsWith("._") &&
        /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name)
    )

    pushLog(`${imageFiles.length} image(s) trouvée(s) dans le ZIP`, "info")

    // ── Reconstruction du registre si absent ──────────────────────────────
    if (assetRegistry.size === 0) {
        const assetNames = imageFiles.map(([filename]) =>
            filename.split("/").pop().replace(/\.[^.]+$/, "")
        )
        assetRegistry = await buildRegistryFromGlpi(assetNames, pushLog)
    }

    let count = 0

    for (const [filename, zipEntry] of imageFiles) {
        const baseName  = filename.split("/").pop()
        const assetName = baseName.replace(/\.[^.]+$/, "")


        const resolved = resolveAsset(assetName, assetRegistry)

        if (!resolved) {
            pushLog(`⚠ Asset « ${assetName} » non trouvé dans le registre — ignoré`, "warn")
            continue
        }

        const assetId  = resolved.items_id
        const itemtype = resolved.itemtype

        if (!assetId) {
            pushLog(`  ⚠ Asset « ${assetName} » non trouvé dans le registre — ignoré`, "warn")
            continue
        }

        if (dryRun) {
            pushLog(`  UPLOAD ${baseName} → ${itemtype} #${assetId}`, "warn")
            count++
            continue
        }

        try {
            const arrayBuffer = await zipEntry.async("arraybuffer")
            const bytes       = new Uint8Array(arrayBuffer)
            const detected    = detectType(bytes)

            if (!detected) {
                pushLog(`  ⚠ ${baseName}: contenu non reconnu comme image — ignoré`, "warn")
                continue
            }

            // Nom de fichier avec la vraie extension (corrige les JPEG renommés en .png etc.)
            const realFilename = `${assetName}.${detected.ext}`
            const declaredExt  = baseName.split(".").pop().toLowerCase()

            if (detected.ext !== declaredExt && !(detected.ext === "jpg" && declaredExt === "jpeg")) {
                pushLog(`  ℹ ${baseName}: détecté comme ${detected.ext} (extension corrigée)`, "warn")
            }

            pushLog(`  UPLOAD ${realFilename} → ${itemtype} #${assetId}`, "warn")

            const file = new File([arrayBuffer], realFilename, { type: detected.mime })

            const formData = new FormData()
            formData.append("uploadManifest", JSON.stringify({
                input: {
                    name:        assetName,
                    itemtype,
                    items_id:    assetId,
                    entities_id: 0,
                    _filename:   ["filename[0]"],
                }
            }))
            formData.append("filename[0]", file, realFilename)

            const res = await apiV1.post("Document", formData)
            const id  = Array.isArray(res) ? res[0]?.id : res?.id
            pushLog(`  ↳ Document créé id=${id}`, "success")

            // ── Vérification liaison ──────────────────────────────────────
            // if (id) {
            //     try {
            //         const doc = await apiV1.getItem("Document", id)
            //         const linked = doc?.items_id === assetId && doc?.itemtype === itemtype
            //         if (linked) {
            //             pushLog(`  ✓ Liaison confirmée → ${itemtype} #${assetId}`, "success")
            //         } else {
            //             pushLog(`  ⚠ Document créé mais liaison incorrecte (itemtype=${doc?.itemtype}, items_id=${doc?.items_id})`, "error")
            //         }
            //     } catch {
            //         pushLog(`  ℹ Impossible de vérifier la liaison`, "warn")
            //     }
            // }
            count++
        } catch (err) {
            pushLog(`  ⚠ Erreur ${baseName}: ${err.message}`, "error")
        }
    }

    pushLog(`Feuille 4 terminée ✓ (${count} images importées)`, "success")
}