import React, { useEffect, useState } from "react";
import { getTickets } from "../../common/services/ticketService.jsx";
import { getTicketsCosts } from "../../common/services/ticketService.jsx";

function formatDuration(seconds) {
    if (!seconds) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatCurrency(amount) {
    if (!amount && amount !== 0) return "—";
    return Number(amount).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function TicketCostsPage() {
    const [byTicket, setByTicket] = useState({});
    const [totals, setTotals]     = useState(null);
    const [tickets, setTickets]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const allTickets = await getTickets();
                const ids = allTickets.map(t => t.id);
                const { byTicket, totals } = await getTicketsCosts(ids);
                setTickets(allTickets);
                setByTicket(byTicket);
                setTotals(totals);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <p style={{ padding: "2rem" }}>Chargement des coûts…</p>;
    if (error)   return <p style={{ padding: "2rem", color: "red" }}>Erreur : {error}</p>;

    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            <h1 style={{ marginBottom: "1.5rem" }}>Coûts par ticket</h1>

            {/* ── Totaux globaux ── */}
            {totals && (
                <div style={{
                    display: "flex", gap: "1rem", flexWrap: "wrap",
                    marginBottom: "2rem",
                }}>
                    {[
                        { label: "Durée totale",       value: formatDuration(totals.totalDuration) },
                        { label: "Coût horaire total", value: formatCurrency(totals.totalTime) },
                        { label: "Coût fixe total",    value: formatCurrency(totals.totalFixed) },
                        { label: "Coût matériel total",value: formatCurrency(totals.totalMaterial) },
                        { label: "Total général",      value: formatCurrency(totals.totalGeneral), highlight: true },
                    ].map(card => (
                        <div key={card.label} style={{
                            flex: "1 1 150px",
                            padding: "1rem 1.5rem",
                            borderRadius: "8px",
                            background: card.highlight ? "var(--primary, #2563eb)" : "var(--bg-light, #f1f5f9)",
                            color: card.highlight ? "#fff" : "inherit",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                        }}>
                            <div style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.3rem" }}>{card.label}</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{card.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tableau ── */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                        <tr style={{ background: "var(--bg-light, #f1f5f9)", textAlign: "left" }}>
                            <th style={th}>#</th>
                            <th style={th}>Ticket</th>
                            <th style={th}>Nb coûts</th>
                            <th style={th}>Durée</th>
                            <th style={th}>Coût horaire</th>
                            <th style={th}>Coût fixe</th>
                            <th style={th}>Coût matériel</th>
                            <th style={{ ...th, color: "var(--primary, #2563eb)" }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map((ticket, i) => {
                            const t = byTicket[ticket.id];
                            if (!t) return null;
                            return (
                                <React.Fragment key={ticket.id}>
                                    {/* Ligne résumé ticket */}
                                    <tr style={{ borderBottom: "1px solid var(--border, #e2e8f0)", background: i % 2 === 0 ? "#fff" : "var(--bg-light, #f8fafc)" }}>
                                        <td style={td}>{ticket.id}</td>
                                        <td style={{ ...td, maxWidth: 260 }}>
                                            <span style={{ fontWeight: 500 }}>{ticket.name || `Ticket #${ticket.id}`}</span>
                                        </td>
                                        <td style={td}>{t.costs.length}</td>
                                        <td style={td}>{formatDuration(t.totalDuration)}</td>
                                        <td style={td}>{formatCurrency(t.totalTime)}</td>
                                        <td style={td}>{formatCurrency(t.totalFixed)}</td>
                                        <td style={td}>{formatCurrency(t.totalMaterial)}</td>
                                        <td style={{ ...td, fontWeight: 700, color: "var(--primary, #2563eb)" }}>
                                            {formatCurrency(t.totalGeneral)}
                                        </td>
                                    </tr>

                                    {/* Lignes détail coûts */}
                                    {t.costs.map((cost, j) => {
                                        const h       = (cost.duration || cost.actiontime || 0) / 3600;
                                        const timeCost = (cost.cost_time || 0) * h;
                                        const sub      = (cost.cost_fixed || 0) + (cost.cost_material || 0) + timeCost;
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
                                                <td style={td}>{formatDuration(cost.duration || cost.actiontime)}</td>
                                                <td style={td}>{formatCurrency(timeCost)}</td>
                                                <td style={td}>{formatCurrency(cost.cost_fixed)}</td>
                                                <td style={td}>{formatCurrency(cost.cost_material)}</td>
                                                <td style={td}>{formatCurrency(sub)}</td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}

                        {/* Ligne totaux globaux */}
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
        </div>
    );
}

const th = {
    padding: "0.75rem 1rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    borderBottom: "2px solid var(--border, #e2e8f0)",
};

const td = {
    padding: "0.6rem 1rem",
    whiteSpace: "nowrap",
};