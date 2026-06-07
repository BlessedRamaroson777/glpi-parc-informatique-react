import JSZip from "jszip"
import apiV1 from "../../common/utils/apiV1.jsx"

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

export async function runFile4Import(zipFile, pushLog, dryRun = false, registry = {}) {
    pushLog("═══ Feuille 4 : Images ═══", "info")

    const zip = await JSZip.loadAsync(zipFile)
    const imageFiles = Object.entries(zip.files).filter(([name, file]) =>
        !file.dir &&
        !name.startsWith("__MACOSX") &&
        !name.split("/").pop().startsWith("._") &&
        /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name)
    )

    pushLog(`${imageFiles.length} image(s) trouvée(s) dans le ZIP`, "info")

    let count = 0

    for (const [filename, zipEntry] of imageFiles) {
        const baseName  = filename.split("/").pop()
        const assetName = baseName.replace(/\.[^.]+$/, "")

        const assetId  = registry.computers.get(assetName) ?? registry.monitors.get(assetName)
        const itemtype = registry.computers.has(assetName) ? "Computer" : "Monitor"

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
            count++
        } catch (err) {
            pushLog(`  ⚠ Erreur ${baseName}: ${err.message}`, "error")
        }
    }

    pushLog(`Feuille 4 terminée ✓ (${count} images importées)`, "success")
}