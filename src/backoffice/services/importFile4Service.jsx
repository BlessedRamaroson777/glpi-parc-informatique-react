import JSZip from "jszip"
import apiV1 from "../../common/utils/apiV1.jsx"
import { apiRequest } from "../../common/services/authService.jsx"

export async function runFile4Import(zipFile, pushLog, dryRun = false, registry = {}) {
    pushLog("═══ Feuille 4 : Images ═══", "info")

    // Extraire le ZIP
    const zip = await JSZip.loadAsync(zipFile)
    const imageFiles = Object.entries(zip.files).filter(([name, file]) =>
        !file.dir &&
        !name.startsWith("__MACOSX") &&
        !name.split("/").pop().startsWith("._") &&  // ← ajouter
        /\.(jpg|jpeg|png|gif|webp)$/i.test(name)
    )

    pushLog(`${imageFiles.length} image(s) trouvée(s) dans le ZIP`, "info")

    let count = 0

    for (const [filename, zipEntry] of imageFiles) {
        // ex: "PC-ADM-001.jpg" → assetName = "PC-ADM-001"
        const baseName  = filename.split("/").pop() // gère les sous-dossiers
        const assetName = baseName.replace(/\.[^.]+$/, "")

        // Cherche l'ID GLPI dans le registre
        const assetId   = registry.computers.get(assetName) ?? registry.monitors.get(assetName)
        const itemtype  = registry.computers.has(assetName) ? "Computer" : "Monitor"

        if (!assetId) {
            pushLog(`  ⚠ Asset « ${assetName} » non trouvé dans le registre — ignoré`, "warn")
            continue
        }

        pushLog(`  UPLOAD ${baseName} → ${itemtype} #${assetId}`, "warn")
        if (dryRun) { count++; continue }

        try {
            // Convertir en Blob
            const blob = await zipEntry.async("blob")
            const file = new File([blob], baseName, { type: blob.type || "image/jpeg" })

            // Créer le document GLPI via V1 (multipart)
            const formData = new FormData()
            formData.append("uploadManifest", JSON.stringify({
                input: {
                    name:        baseName,
                    itemtype,
                    items_id:    assetId,
                    entities_id: 0,
                    _filename:   [baseName],
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