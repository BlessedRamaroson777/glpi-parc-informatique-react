// CostsByAssetType.jsx
import React, { useState, useEffect } from "react";
import { getTicketCout, getTickets, getTicketsCosts, getTicketsWithAssetTypes } from "../../common/services/ticketService.jsx"
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
    return Number(n)
    // return Number(n).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })

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

                setGrouped(couts)
            } catch (e) {
                setError(e.message)
            } finally {
                setLoading(false)
            } 

            // dans load() :
            const allTickets = await getTickets();
            const ids = allTickets.map(t => t.id);

            // Enrichit chaque ticket avec son assetType via Item_Ticket
            const ticketsWithTypes = await getTicketsWithAssetTypes(allTickets);
            setTickets(ticketsWithTypes);

            const { byTicket, totals } = await getTicketsCosts(ids);
            setByTicket(byTicket);
            setTotals(totals);
        }
        load()
    }, [])

    // Construit une liste unifiée par asset type
    const ASSET_KEYS = ASSET_TYPES.map(t => t.key); // ou tous les types connus

    // Map SQLite par assetType
    const sqliteByType = {};
    grouped.forEach(g => {
        sqliteByType[g.assetType] = g;
    });

    // Map GLPI par assetType (tickets ont-ils un champ assetType ?)
    // Si oui, grouper byTicket par ticket.assetType
    console.log(tickets)
    const glpiByType = {};
    tickets.forEach(ticket => {
        const type = ticket.assetType ?? "Inconnu";
        const costs = byTicket[ticket.id];
        if (!costs) return;
        if (!glpiByType[type]) glpiByType[type] = { totalGeneral: 0, totalDuration: 0 };
        glpiByType[type].totalGeneral  += costs.totalGeneral;
        glpiByType[type].totalDuration += costs.totalDuration;
    });

    // Tous les types présents dans l'une ou l'autre source
    // const allTypes = [...new Set([
    //     ...Object.keys(sqliteByType),
    //     ...Object.keys(glpiByType),
    // ])];
    const allTypes = ASSET_TYPES.map(t => t.key);
    

    if (loading) return <p className="loading">Chargement des coûts…</p>
    if (error)   return <p className="error">Erreur : {error}</p>

    return (
        <section className="costs-by-asset">
            <h2>Coûts par type d'asset</h2>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                        <tr style={{ background: "var(--bg-light, #f1f5f9)", textAlign: "left" }}>
                            <th style={th}>Type d'asset</th>
                            <th style={th}>Coût base (SQLite)</th>
                            <th style={th}>Coût réouverture</th>
                            <th style={th}>Coût GLPI</th>
                            <th style={{ ...th, color: "var(--primary, #2563eb)" }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allTypes.map((type, i) => {
                            const sql  = sqliteByType[type];
                            const glpi = glpiByType[type];

                            const superCout   = sql?.superCout   ?? 0;
                            const reouverture = sql?.reouverture ?? 0;
                            const coutGlpi    = glpi?.totalGeneral ?? 0;
                            const total       = superCout + reouverture + coutGlpi;

                            return (
                                <tr key={type} style={{
                                    borderBottom: "1px solid var(--border, #e2e8f0)",
                                    background: i % 2 === 0 ? "#fff" : "var(--bg-light, #f8fafc)",
                                }}>
                                    <td style={td}>{type}</td>
                                    <td style={td}>{formatCurrency(superCout)}</td>
                                    <td style={td}>{formatCurrency(reouverture)}</td>
                                    <td style={td}>{formatCurrency(coutGlpi)}</td>
                                    <td style={{ ...td, fontWeight: 700, color: "var(--primary, #2563eb)" }}>
                                        {formatCurrency(total)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: "var(--primary, #2563eb)", color: "#fff", fontWeight: 700 }}>
                            <td style={td}>TOTAL</td>
                            <td style={td}>{formatCurrency(allTypes.reduce((s, t) => s + (sqliteByType[t]?.superCout ?? 0), 0))}</td>
                            <td style={td}>{formatCurrency(allTypes.reduce((s, t) => s + (sqliteByType[t]?.reouverture ?? 0), 0))}</td>
                            <td style={td}>{formatCurrency(allTypes.reduce((s, t) => s + (glpiByType[t]?.totalGeneral ?? 0), 0))}</td>
                            <td style={td}>{formatCurrency(allTypes.reduce((s, t) => s + (sqliteByType[t]?.superCout ?? 0) + (sqliteByType[t]?.reouverture ?? 0) + (glpiByType[t]?.totalGeneral ?? 0), 0))}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </section>
    )
}

const th = { padding: "0.75rem 1rem", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0" }
const td = { padding: "0.6rem 1rem", whiteSpace: "nowrap" }