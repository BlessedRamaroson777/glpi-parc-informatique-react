import apiV1 from "../utils/apiV1.jsx"

// ─── Détection de type par magic bytes ────────────────────────────────────
const IMAGE_SIGNATURES = [
  { ext: 'jpg',  mime: 'image/jpeg', parts: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }] },
  { ext: 'png',  mime: 'image/png',  parts: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }] },
  { ext: 'gif',  mime: 'image/gif',  parts: [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }] },
  { ext: 'bmp',  mime: 'image/bmp',  parts: [{ offset: 0, bytes: [0x42, 0x4d] }] },
  { ext: 'webp', mime: 'image/webp', parts: [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }] },
  { ext: 'tif',  mime: 'image/tiff', parts: [{ offset: 0, bytes: [0x49, 0x49, 0x2a, 0x00] }] },
  { ext: 'tif',  mime: 'image/tiff', parts: [{ offset: 0, bytes: [0x4d, 0x4d, 0x00, 0x2a] }] },
  { ext: 'ico',  mime: 'image/x-icon', parts: [{ offset: 0, bytes: [0x00, 0x00, 0x01, 0x00] }] },
  { ext: 'heic', mime: 'image/heic', parts: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, { offset: 8, bytes: [0x68, 0x65, 0x69] }] },
  { ext: 'avif', mime: 'image/avif', parts: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, { offset: 8, bytes: [0x61, 0x76, 0x69, 0x66] }] },
  { ext: 'psd',  mime: 'image/vnd.adobe.photoshop', parts: [{ offset: 0, bytes: [0x38, 0x42, 0x50, 0x53] }] },
]

const matchesPart   = (bytes, part) => part.bytes.every((b, i) => bytes[part.offset + i] === b)
const matchesSig    = (bytes, sig)  => sig.parts.every(part => matchesPart(bytes, part))
const detectType    = (bytes)       => IMAGE_SIGNATURES.find(sig => matchesSig(bytes, sig)) ?? null

// ─── Télécharge le fichier GLPI et retourne un blob URL vérifié ───────────
// Retourne null si le contenu n'est pas une image reconnue.
async function fetchImageBlobUrl(filepath) {
  const baseUrl = (localStorage.getItem("glpi_base_url") || "")
    .replace(/\/apirest\.php.*$/, "")
    .replace(/\/$/, "")

  const sessionToken = localStorage.getItem("glpi_session_token") || ""
  const appToken     = localStorage.getItem("glpi_app_token")     || ""

  const url = `${baseUrl}/files/${filepath}`

  const headers = { Accept: "*/*" }
  if (sessionToken) headers["Session-Token"] = sessionToken
  if (appToken)     headers["App-Token"]     = appToken

  const res = await fetch(url, { headers })
  if (!res.ok) return null

  const arrayBuffer = await res.arrayBuffer()
  const bytes       = new Uint8Array(arrayBuffer)

  // Vérification par magic bytes — on ignore le mime GLPI
  const detected = detectType(bytes)
  if (!detected) return null

  const blob    = new Blob([arrayBuffer], { type: detected.mime })
  const blobUrl = URL.createObjectURL(blob)
  return blobUrl
}

// ─── API publique ──────────────────────────────────────────────────────────

/**
 * Récupère les documents d'un item GLPI et retourne ceux qui sont
 * de vraies images (vérifiées par magic bytes), avec un blob URL prêt à afficher.
 */
export async function getItemDocuments(itemtype, itemsId) {
  try {
    const docs = await apiV1.get("Document", { itemtype, items_id: itemsId })
    if (!Array.isArray(docs) || docs.length === 0) return []

    const results = await Promise.all(
      docs.map(async (doc) => {
        if (!doc.filepath) return null
        try {
          const blobUrl = await fetchImageBlobUrl(doc.filepath)
          if (!blobUrl) return null   // pas une image — on ignore silencieusement
          return {
            id:       doc.id,
            name:     doc.name || doc.filename,
            filename: doc.filename,
            url:      blobUrl,        // blob URL utilisable directement dans <img src>
          }
        } catch {
          return null
        }
      })
    )

    return results.filter(Boolean)
  } catch (err) {
    console.warn(`getItemDocuments(${itemtype}, ${itemsId}):`, err)
    return []
  }
}