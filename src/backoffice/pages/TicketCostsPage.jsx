// CostsByAssetType.jsx
import React from "react"
import { getTicketCout, getTickets, getTicketsCosts } from "../../common/services/ticketService.jsx"
import { ASSET_TYPES } from "../../common/constants/Assets.jsx"
import apiV1 from "../../common/utils/apiV1.jsx"

function toNum(v) {
    if (v === null || v === undefined || v === "") return 0
    if (typeof v === "number") return v
    return parseFloat(String(v).replace(/\s/g, "").replace(",", ".")) || 0
}

function fmt(n) {
    return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatCurrency(n) {
    return Number(n).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

function formatDuration(seconds) {
    if (!seconds) return "—"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

const ASSET_LABEL = Object.fromEntries(ASSET_TYPES.map(t => [t.key, t.label]))

export default function CostsByAssetType() {
    const [grouped, setGrouped]             = React.useState([])
    const [dbTotal, setDbTotal]             = React.useState(0)
    const [glpiTotal, setGlpiTotal]         = React.useState(0)
    const [expanded, setExpanded]           = React.useState(null)
    const [detailsByType, setDetailsByType] = React.useState({})
    const [byTicket, setByTicket] = useState({});
    const [totals, setTotals]     = useState(null);
    const [tickets, setTickets]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);
    const [progress, setProgress] = useState({ done: 0, total: 0 });

    // Données brutes gardées en mémoire pour le détail au clic
    const byTicketRef    = React.useRef({})
    const dbCoutsRef     = React.useRef([])
    const allTicketsRef  = React.useRef([])

    React.useEffect(() => {
        async function load() {
            try {
                const dbData = await getTicketCout()
                const couts = dbData.couts
                console.log(couts)

                setGrouped(couts)
            } catch (e) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
            const allTickets = await getTickets();
            const ids = allTickets.map(t => t.id);
            setTickets(allTickets);
            
            const { byTicket, totals } = await getTicketsCosts();

            setByTicket(byTicket);
            setTotals(totals);
        }
        load()
    }, [])

    if (loading) return <p className="loading">Chargement des coûts…</p>
    if (error)   return <p className="error">Erreur : {error}</p>

    return (
        <section className="costs-by-asset">
            <h2>Coûts par type d'asset</h2>

            {grouped.length === 0 ? 
                (<div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                        <thead>
                            <tr style={{ background: "var(--bg-light, #f1f5f9)", textAlign: "left" }}>
                                <th style={th}>Type d'asset</th>
                                <th style={th}>Coût base (SQLite)</th>
                                <th style={th}>Coût reouverture </th>
                                <th style={th}>Coût GLPI </th>
                                <th style={{ ...th, color: "var(--primary, #2563eb)" }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map((ticket, i) => {
                                const t = byTicket[ticket.id];
                                if (!t) return null;
                                return (
                                    <React.Fragment key={ticket.id}>
                                        <tr style={{
                                            borderBottom: "1px solid var(--border, #e2e8f0)",
                                            background: i % 2 === 0 ? "#fff" : "var(--bg-light, #f8fafc)",
                                        }}>
                                            <td style={td}>ticket.assetType</td>
                                            <td style={td}>{formatDuration(t.totalDuration)}</td>
                                            <td style={td}>{formatCurrency(t.totalTime)}</td>
                                            <td style={td}>{formatCurrency(t.totalFixed)}</td>
                                            <td style={td}>{formatCurrency(t.totalMaterial)}</td>
                                            <td style={{ ...td, fontWeight: 700, color: "var(--primary, #2563eb)" }}>
                                                {formatCurrency(t.totalGeneral)}
                                            </td>
                                        </tr>
    
                                        {t.costs.map((cost, j) => {
                                            const duration = toNum(cost.duration ?? cost.actiontime);
                                            const h        = duration / 3600;
                                            const timeCost = Math.round(toNum(cost.cost_time) * h * 100) / 100;
                                            const sub      = timeCost + toNum(cost.cost_fixed);
                                            return (
                                                <tr key={j} style={{
                                                    borderBottom: "1px solid var(--border, #e2e8f0)",
                                                    background: "#fafbff",
                                                    fontSize: "0.82rem",
                                                    color: "var(--text-muted, #64748b)",
                                                }}>
                                                    <td style={td} />
                                                    <td style={{ ...td, paddingLeft: "2rem" }}>
                                                        ↳ {cost.name || `Coût #${j + 1}`}
                                                    </td>
                                                    <td style={td} />
                                                    <td style={td}>{formatDuration(duration)}</td>
                                                    <td style={td}>{formatCurrency(timeCost)}</td>
                                                    <td style={td}>{formatCurrency(toNum(cost.cost_fixed))}</td>
                                                    <td style={td}>{formatCurrency(toNum(cost.cost_material))}</td>
                                                    <td style={td}>{formatCurrency(sub)}</td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
    
                            {totals && (
                                <tr style={{ background: "var(--primary, #2563eb)", color: "#fff", fontWeight: 700 }}>
                                    <td style={td} colSpan={3}>Totaux généraux</td>
                                    <td style={td}>{formatDuration(totals.totalDuration)}</td>
                                    <td style={td}>{formatCurrency(totals.totalTime)}</td>
                                    <td style={td}>{formatCurrency(totals.totalFixed)}</td>
                                    <td style={td}>{formatCurrency(totals.totalMaterial)}</td>
                                    <td style={td}>{formatCurrency(totals.totalGeneral)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="assets-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={th}>Type d'asset</th>
                                <th style={th}>Coût base (SQLite)</th>
                                <th style={th}>Coût reouverture </th>
                                <th style={th}>Coût GLPI </th>
                                <th style={th}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grouped.map(g => {
                                return (
                                    <React.Fragment key={g.key}>
                                        <tr
                                            style={{ cursor: "pointer", borderBottom: "1px solid #e2e8f0" }}
                                        >
                                            <td style={td}>
                                                <span className="asset-type">{g.assetType}</span>
                                            </td>
                                            <td style={td}>{g.superCout} €</td>
                                            <td style={td}>{g.reouverture} €</td>
                                            <td style={td}>{g.coutTotal} €</td>
                                            <td style={td}>{g.coutTotal + g.superCout + g.reouverture} €</td>
                                        </tr>

                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td style={td}><strong>TOTAL</strong></td>
                                <td style={td}><strong>{fmt(dbTotal)} €</strong></td>
                                <td style={td}><strong>{fmt(glpiTotal)} €</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </section>
    )
}

const th = { padding: "0.75rem 1rem", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0" }
const td = { padding: "0.6rem 1rem", whiteSpace: "nowrap" }