import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getTicketById, getTicketItems } from "../services/ticketService.jsx";
import Ticket from "../entities/Ticket.jsx";
import "../styles/tickets.css"; // Importation du fichier CSS

const STATUS_LABELS   = { 1: "Nouveau", 2: "Attribué", 3: "Planifié", 4: "En attente", 5: "Résolu", 6: "Clos" };
const PRIORITY_LABELS = { 1: "Très basse", 2: "Basse", 3: "Moyenne", 4: "Haute", 5: "Très haute", 6: "Majeure" };
const TYPE_LABELS     = { 1: "Incident", 2: "Demande" };

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

export default function TicketDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [ticket, setTicket] = React.useState(state?.ticket ?? null);
  const [items, setItems] = React.useState([])

  React.useEffect(() => {
      if (ticket?.id) {
        getTicketItems(ticket.id).then(data => {
          console.log("Items liés :", data)
          setItems(data)
      }).catch(() => setItems([]))
      }
  }, [ticket?.id])

  React.useEffect(() => {
    if (!ticket) {
      getTicketById(id).then(data => setTicket(new Ticket(data)));
    }
  }, [id]);

  if (!ticket) return <p className="loading-text">Chargement…</p>;

  return (
    <section className="ticket-detail-container">
      <a onClick={() => navigate(-1)} className="btn-back">
        ← Retour
      </a>

      <div className="ticket-header-meta">
        <span className="ticket-id">#{ticket.id}</span>
        <Badge status={ticket.status} />
      </div>

      <h1 className="ticket-title">{ticket.name}</h1>

      <div className="ticket-content" dangerouslySetInnerHTML={{ __html: ticket.content || "—" }} />

      <div className="info-section">
        <p className="section-title">Informations</p>
        <Row label="Type"       value={TYPE_LABELS[ticket.type] || ticket.type} />
        <Row label="Priorité"   value={PRIORITY_LABELS[ticket.priority] || ticket.priority} />
        <Row label="Urgence"    value={PRIORITY_LABELS[ticket.urgency]  || ticket.urgency} />
        <Row label="Impact"     value={PRIORITY_LABELS[ticket.impact]   || ticket.impact} />
        <Row label="Entité"     value={ticket.entities_id} />
        <Row label="Catégorie"  value={ticket.itilcategories_id} />
        <Row label="Localisation" value={ticket.locations_id} />
      </div>

      <div className="info-section">
        <p className="section-title">Dates</p>
        <Row label="Créé le"       value={fmt(ticket.date_creation)} />
        <Row label="Modifié le"    value={fmt(ticket.date_mod)} />
        <Row label="Résolution"    value={fmt(ticket.solvedate)} />
        <Row label="Fermeture"     value={fmt(ticket.closedate)} />
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

      {items.length > 0 && (
      <div className="linked-items-section">
          <p className="section-title">Éléments liés</p>

          <ul className="linked-items-list">
              {items.map((item, i) => (
                  <li key={i} className="linked-item">
                      {item.itemtype} — {item.items_id}
                  </li>
              ))}
          </ul>
      </div>
    )}
    </section>
  );
}