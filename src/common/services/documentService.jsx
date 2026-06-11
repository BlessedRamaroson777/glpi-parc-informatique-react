import apiV1 from "../utils/apiV1.jsx"

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

// ─── Télécharge via l'API REST (Session-Token dans le header) ─────────────
async function fetchDocumentBlobUrl(docId) {
    const baseUrl      = (localStorage.getItem("glpi_base_url") || "").replace(/\/$/, "")
    const sessionToken = localStorage.getItem("glpi_session_token") || ""
    const appToken     = localStorage.getItem("glpi_app_token")     || ""

    const attempts = [
        `${baseUrl}/Document/${docId}?alt=media`,
        `${baseUrl}/Document/${docId}?alt=media&dl=1`,
    ]

    const headers = {}
    if (sessionToken) headers["Session-Token"] = sessionToken
    if (appToken)     headers["App-Token"]     = appToken
    headers["Accept"] = "*/*"

    for (const url of attempts) {
        try {
            const res = await fetch(url, { headers, credentials: "include" })
            if (!res.ok) continue

            const contentType = res.headers.get("content-type") || ""
            if (contentType.includes("application/json")) continue

            const buf   = await res.arrayBuffer()
            const bytes = new Uint8Array(buf)
            if (bytes.length < 4) continue

            const detected = detectType(bytes)
            if (!detected) continue

            const blob = new Blob([buf], { type: detected.mime })
            return URL.createObjectURL(blob)
        } catch {
            continue
        }
    }

    return null
}

// ─── API publique ──────────────────────────────────────────────────────────
export async function getItemDocuments(itemtype, itemsId, assetName = "") {
    try {
        // Document_Item = table de liaison GLPI entre un item et ses documents
        const links = await apiV1.get("Document_Item", { 
            searchText: JSON.stringify({ itemtype, items_id: itemsId }),
            "searchText[itemtype]": itemtype,
            "searchText[items_id]": itemsId,
        })

        console.log("=== Document_Item links ===", links)

        if (!Array.isArray(links) || links.length === 0) return []

        // Filtrage strict par itemtype + items_id
        const filtered = links.filter(link =>
            link.itemtype === itemtype && String(link.items_id) === String(itemsId)
        )

        console.log("Links filtrés :", filtered)

        const results = await Promise.all(
            filtered.map(async (link) => {
                const docId = link.documents_id
                if (!docId) return null
                try {
                    const blobUrl = await fetchDocumentBlobUrl(docId)
                    if (!blobUrl) return null
                    return {
                        id:       docId,
                        name:     link.name || String(docId),
                        filename: link.filename,
                        url:      blobUrl,
                    }
                } catch { return null }
            })
        )

        return results.filter(Boolean)
    } catch (err) {
        console.warn(`getItemDocuments(${itemtype}, ${itemsId}):`, err)
        return []
    }
}