
// ── CSV parser simple ───────────────────────────────────────────────────────

/**
 * Parse un texte CSV (première ligne = en-têtes).
 * Gère les champs entre guillemets simples.
 */export function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/)

    const headers = lines[0]
        .split(",")
        .map(h => h.trim().replace(/^"|"$/g, "").toLowerCase())

    return lines.slice(1).map(line => {
        const values = []
        let cur = ""
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const ch = line[i]

            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"'
                    i++
                } else {
                    inQuotes = !inQuotes
                }
                continue
            }

            if (ch === "," && !inQuotes) {
                values.push(cur.trim())
                cur = ""
                continue
            }

            cur += ch
        }
        values.push(cur.trim())

        return Object.fromEntries(
            headers.map((h, i) => [h, values[i] ?? ""])
        )
    })
}