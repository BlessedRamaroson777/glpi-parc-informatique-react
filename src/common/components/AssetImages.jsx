import React from "react"
import { getItemDocuments } from "../../common/services/documentService.jsx"

// Cache mémoire — blob URLs par "Type-id"
// Important : les blob URLs sont valides tant que la page est ouverte
const imageCache = new Map()

// ─── Lightbox ──────────────────────────────────────────────────────────────
function Lightbox({ doc, onClose }) {
  React.useEffect(() => {
    const handler = e => e.key === "Escape" && onClose()
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        zIndex: 9999, cursor: "zoom-out",
      }}
    >
      <img
        src={doc.url}
        alt={doc.name}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: "90vw", maxHeight: "82vh",
          borderRadius: 10,
          boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
          cursor: "default",
        }}
      />
      <p style={{ color: "rgba(255,255,255,0.65)", marginTop: 12, fontSize: "0.85rem" }}>
        {doc.name}
      </p>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>
        Échap ou clic extérieur pour fermer
      </p>
    </div>
  )
}

// ─── Miniature ─────────────────────────────────────────────────────────────
function Thumb({ doc, size = 64 }) {
  const [lightbox, setLightbox] = React.useState(false)

  return (
    <>
      <div
        title={doc.name}
        onClick={() => setLightbox(true)}
        style={{
          width: size, height: size,
          borderRadius: size <= 40 ? 6 : 8,
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "var(--bg-light)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          cursor: "zoom-in", flexShrink: 0,
          transition: "box-shadow 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 0 2px var(--primary)"}
        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
      >
        {/* L'URL est un blob URL vérifié — si ça ne s'affiche pas, c'est un bug navigateur */}
        <img
          src={doc.url}
          alt={doc.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {lightbox && <Lightbox doc={doc} onClose={() => setLightbox(false)} />}
    </>
  )
}

// ─── Squelette de chargement ───────────────────────────────────────────────
function Skeleton({ size, count = 1 }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{
          width: size, height: size,
          borderRadius: size <= 40 ? 6 : 8,
          background: "var(--bg-light)",
          border: "1px solid var(--border)",
          opacity: 0.6,
        }} />
      ))}
    </div>
  )
}

// ─── Hook partagé ─────────────────────────────────────────────────────────
function useItemDocs(cacheKey, fetcher) {
  const cached              = imageCache.get(cacheKey) ?? null
  const [docs, setDocs]     = React.useState(cached)
  const [loading, setLoad]  = React.useState(cached === null)

  React.useEffect(() => {
    if (cached !== null) return
    fetcher()
      .then(result => { imageCache.set(cacheKey, result); setDocs(result) })
      .finally(() => setLoad(false))
  }, [cacheKey])

  return { docs, loading }
}

// ─── ItemImages — usage dans TicketDetail (miniatures 72×72) ──────────────
export function ItemImages({ itemtype, itemsId, size = 72 }) {
  const cacheKey = `${itemtype}-${itemsId}`
  const { docs, loading } = useItemDocs(
    cacheKey,
    () => getItemDocuments(itemtype, itemsId)
  )

  if (loading) return <Skeleton size={size} />
  if (!docs || docs.length === 0) return null

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
      {docs.map(doc => <Thumb key={doc.id} doc={doc} size={size} />)}
    </div>
  )
}

// ─── AssetImagesCell — usage dans le tableau Assets (miniatures 36×36) ────
export function AssetImagesCell({ asset }) {
  const cacheKey = `${asset.type}-${asset.id}`
  const { docs, loading } = useItemDocs(
    cacheKey,
    () => getItemDocuments(asset.type, asset.id)
  )

  if (loading) return <Skeleton size={36} />
  if (!docs || docs.length === 0) return <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
      {docs.map(doc => <Thumb key={doc.id} doc={doc} size={36} />)}
    </div>
  )
}