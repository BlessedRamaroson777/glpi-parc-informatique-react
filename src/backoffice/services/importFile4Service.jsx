import JSZip from "jszip"
import apiV1 from "../../common/utils/apiV1.jsx"

export async function runFile4Import(zipFile, pushLog, dryRun = false, registry = {}) {
    pushLog("═══ Feuille 4 : Images ═══", "info")

    const zip = await JSZip.loadAsync(zipFile)
    const imageFiles = Object.entries(zip.files).filter(([name, file]) =>
        !file.dir &&
        !name.startsWith("__MACOSX") &&
        !name.split("/").pop().startsWith("._") &&
        /\.(jpg|jpeg|png|gif|webp)$/i.test(name)
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

        pushLog(`  UPLOAD ${baseName} → ${itemtype} #${assetId}`, "warn")
        if (dryRun) { count++; continue }

        try {
            const blob = await zipEntry.async("blob")

            const ext = baseName.split(".").pop().toLowerCase()
            const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" }
            const mimeType = mimeMap[ext] || "application/octet-stream"

            const file = new File([blob], baseName, { type: mimeType })

            const formData = new FormData()
            // "filename[0]" doit être la clé EXACTE — GLPI cherche $_FILES["filename"][0] côté PHP
            formData.append("uploadManifest", JSON.stringify({
                input: {
                    name:        assetName,
                    itemtype,
                    items_id:    assetId,
                    entities_id: 0,
                    _filename:   ["filename[0]"],
                }
            }))
            formData.append("filename[0]", file, baseName)

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