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

// ─── ItemImages — Usage dans TicketDetail (Miniatures 72×72) ──────────────
export function ItemImages({ itemtype, itemsId, assetName, size = 72 }) {
    const [images, setImages] = React.useState([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        if (!itemtype || !itemsId) {
            setLoading(false)
            return
        }

        setLoading(true)
        getItemDocuments(itemtype, itemsId, assetName)
            .then(setImages)
            .catch(() => setImages([]))
            .finally(() => setLoading(false))
    }, [itemtype, itemsId, assetName])

    if (loading) return <Skeleton size={size} />
    if (!images || images.length === 0) return null

    return (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {images.map(doc => (
                <Thumb key={doc.id} doc={doc} size={size} />
            ))}
        </div>
    )
}

// ─── AssetImagesCell — Usage dans la liste générale des Assets ────────────
export function AssetImagesCell({ asset }) {
    const [images, setImages] = React.useState([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
      if (!asset?.id || !asset?.type) { setLoading(false); return }
      
      const cacheKey = `${asset.type}-${asset.id}`
      if (imageCache.has(cacheKey)) {
          setImages(imageCache.get(cacheKey))
          setLoading(false)
          return
      }

      setLoading(true)
      getItemDocuments(asset.type, asset.id, asset.name)
          .then(docs => {
              imageCache.set(cacheKey, docs)  // cache dans la Map importée
              setImages(docs)
          })
          .catch(() => setImages([]))
          .finally(() => setLoading(false))
  }, [asset?.id, asset?.type])

    if (loading) return <Skeleton size={40} />
    if (!images || images.length === 0) return <span style={{ color: "var(--text-muted)" }}>—</span>

    return (
        <div className="assets-cell-thumbs" style={{ display: "flex", gap: "4px" }}>
            {images.map(doc => (
                <Thumb key={doc.id} doc={doc} size={40} />
            ))}
        </div>
    )
}