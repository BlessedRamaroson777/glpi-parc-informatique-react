import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getTicketById, getTicketItems } from "../../common/services/ticketService.jsx";
import Ticket from "../../common/entities/Ticket.jsx";
import { TICKET_STATUS, TICKET_PRIORITIES, TICKET_TYPES } from "../../common/constants/TicketConstants.jsx";
import { ASSET_TYPES } from "../../common/constants/Assets.jsx";
import { ItemImages } from "../../common/components/AssetImages.jsx";
import apiV1 from "../../common/utils/apiV1.jsx";
import "../styles/tickets.css";
import apiV2 from "../../common/utils/apiV2.jsx";

const STATUS_LABELS   = Object.fromEntries(TICKET_STATUS.map(s => [s.value, s.label]));
const PRIORITY_LABELS = Object.fromEntries(TICKET_PRIORITIES.map(s => [s.value, s.label]));
const TYPE_LABELS     = Object.fromEntries(TICKET_TYPES.map(s => [s.value, s.label]));

function Badge({ status }) {
    return <span className={`badge badge-status-${status}`}>{STATUS_LABELS[status] || `Statut ${status}`}</span>;
}

function Row({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div className="row-info">
            <span className="row-label">{label}</span>
            <span className="row-value">{value}</span>
        </div>
    );
}

function fmt(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds) {
    if (!seconds) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return "—";
    return Number(amount).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function TicketDetail() {
    const { id }        = useParams();
    const { state }     = useLocation();
    const navigate      = useNavigate();
    const [ticket, setTicket]             = React.useState(state?.ticket ?? null);
    const [items, setItems]               = React.useState([]);
    const [costs, setCosts]               = React.useState([]);
    const [costsLoading, setCostsLoading] = React.useState(false);

    React.useEffect(() => {
        if (!ticket?.id) return;

        getTicketItems(ticket.id).then(async (data) => {
            const resolvedItems = await Promise.all(data.map(async (item) => {
                try {
                    const details = await apiV1.getItem(item.itemtype, item.items_id);
                    return { ...item, name: details?.name || "Inconnu", serial: details?.serial };
                } catch {
                    return { ...item, name: "Inconnu" };
                }
            }));
            setItems(resolvedItems);
        }).catch(() => setItems([]));

        setCostsLoading(true);
        apiV2.get(`/api.php/v2.3/Assistance/Ticket/${ticket.id}/Cost`)
            .then(data => setCosts(Array.isArray(data) ? data : (data?.data ?? [])))
            .catch(() => setCosts([]))
            .finally(() => setCostsLoading(false));
    }, [ticket?.id]);

    React.useEffect(() => {
        if (!ticket) {
            getTicketById(id).then(data => setTicket(new Ticket(data)));
        }
    }, [id]);

    if (!ticket) return <p className="loading-text">Chargement…</p>;

    const totalCosts = costs.reduce((sum, c) => {
        const hours = (c.duration || 0) / 3600;
        return sum + (c.cost_fixed || 0) + (c.cost_material || 0) + (c.cost_time || 0) * hours;
    }, 0);

    return (
        <section className="ticket-detail-container">
            <a onClick={() => navigate(-1)} className="btn-back" style={{ cursor: "pointer" }}>← Retour</a>

            <div className="ticket-header-meta">
                <span className="ticket-id">#{ticket.id}</span>
                <Badge status={ticket.status} />
            </div>

            <h1 className="ticket-title">{ticket.name}</h1>
            <div className="ticket-content" dangerouslySetInnerHTML={{ __html: ticket.content || "—" }} />

            <div className="info-section">
                <p className="section-title">Informations</p>
                <Row label="Type"         value={TYPE_LABELS[ticket.type] || ticket.type} />
                <Row label="Reference"    value={ticket.external_id || "Inconnue"} />
                <Row label="Priorité"     value={PRIORITY_LABELS[ticket.priority] || ticket.priority} />
                <Row label="Urgence"      value={PRIORITY_LABELS[ticket.urgency]  || ticket.urgency} />
                <Row label="Impact"       value={PRIORITY_LABELS[ticket.impact]   || ticket.impact} />
                <Row label="Entité"       value={ticket.entities_id} />
                <Row label="Catégorie"    value={ticket.itilcategories_id} />
                <Row label="Localisation" value={ticket.locations_id} />
            </div>

            <div className="info-section">
                <p className="section-title">Dates</p>
                <Row label="Créé le"    value={fmt(ticket.date_creation)} />
                <Row label="Modifié le" value={fmt(ticket.date_mod)} />
                <Row label="Résolution" value={fmt(ticket.solvedate)} />
                <Row label="Fermeture"  value={fmt(ticket.closedate)} />
            </div>

            {ticket.team?.length > 0 && (
                <div className="info-section">
                    <p className="section-title">Équipe</p>
                    <ul className="team-list">
                        {ticket.team.map((m, i) => (
                            <li key={i} className="team-item">
                                <div className="team-avatar">
                                    {(m.display_name || m.name || "?").slice(0, 2).toUpperCase()}
                                </div>
                                <span className="team-name">{m.display_name || m.name}</span>
                                <span className="team-role">{m.role}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── Éléments liés ────────────────────────────────────────── */}
            {items.length > 0 && (
                <div className="linked-items-section" style={{
                    marginTop: "2rem", padding: "1.5rem",
                    background: "var(--bg-light)", borderRadius: "8px",
                }}>
                    <p className="section-title" style={{ marginBottom: "1rem" }}>
                        Éléments liés ({items.length})
                    </p>
                    <ul className="linked-items-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {items.map((item, i) => {
                            const typeLabel = ASSET_TYPES.find(a => a.key === item.itemtype)?.label || item.itemtype;
                            return (
                                <li key={i} className="linked-item" style={{
                                    padding: "1rem 0",
                                    borderBottom: "1px solid var(--border)",
                                }}>
                                    {/* Ligne d'infos */}
                                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                        <span style={{
                                            background: "var(--primary-light)", color: "var(--primary)",
                                            padding: "2px 8px", borderRadius: "12px", fontSize: "0.85rem",
                                        }}>
                                            {typeLabel}
                                        </span>
                                        <strong>{item.name}</strong>
                                        {item.serial && (
                                            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                                (S/N: {item.serial})
                                            </span>
                                        )}
                                        <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                                            #{item.items_id}
                                        </span>
                                    </div>

                                    {/* ── Images de l'asset ── */}
                                    <ItemImages
                                      itemtype={item.itemtype}
                                      itemsId={item.items_id}
                                      assetName={item.name} // <--- On injecte le nom récupéré pour filtrer au niveau du service
                                      size={72}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* ── Coûts ────────────────────────────────────────────────── */}
            <div className="info-section">
                <p className="section-title">Coûts d'intervention ({costs.length})</p>
                {costsLoading ? (
                    <p className="loading-text">Chargement des coûts...</p>
                ) : costs.length === 0 ? (
                    <p className="empty-text">Aucun coût enregistré pour ce ticket.</p>
                ) : (
                    <div className="costs-list">
                        {costs.map((cost, i) => {
                            const hours    = (cost.duration || 0) / 3600;
                            const timeCost = (cost.cost_time || 0) * hours;
                            const subtotal = (cost.cost_fixed || 0) + (cost.cost_material || 0) + timeCost;
                            return (
                                <div key={cost.id || i} className="cost-card">
                                    <div className="cost-card-header">
                                        <span className="cost-title">{cost.name || `Coût #${i + 1}`}</span>
                                        <span className="cost-amount">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="cost-card-details">
                                        <div className="cost-row">
                                            <span className="cost-label">Durée</span>
                                            <span className="cost-value">{formatDuration(cost.duration || cost.actiontime)}</span>
                                        </div>
                                        <div className="cost-row">
                                            <span className="cost-label">Coût horaire</span>
                                            <span className="cost-value">{formatCurrency(cost.cost_time)}</span>
                                        </div>
                                        <div className="cost-row">
                                            <span className="cost-label">Coût fixe</span>
                                            <span className="cost-value">{formatCurrency(cost.cost_fixed)}</span>
                                        </div>
                                        <div className="cost-row">
                                            <span className="cost-label">Coût matériel</span>
                                            <span className="cost-value">{formatCurrency(cost.cost_material)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="cost-total-bar">
                            <strong>Total Général</strong>
                            <strong>{formatCurrency(totalCosts)}</strong>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}