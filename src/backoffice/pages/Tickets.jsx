import React from "react";
import { useNavigate } from "react-router-dom";
import { getTickets } from "../services/ticketService.jsx";
import Ticket from "../entities/Ticket.jsx";
import "../styles/tickets.css"; // Importation du même fichier CSS

const STATUS_LABELS = { 1: "Nouveau", 2: "Attribué", 3: "Planifié", 4: "En attente", 5: "Résolu", 6: "Clos" };

function Badge({ status }) {
  return <span className={`badge badge-list badge-status-${status}`}>{STATUS_LABELS[status] || `Statut ${status}`}</span>;
}

export default function Tickets() {
  const [tickets, setTickets] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    getTickets().then(data => setTickets(data.map(item => new Ticket(item))));
  }, []);

  return (
    <section className="tickets-list-container">
      <h1 className="list-title">Tickets</h1>

      <ul className="tickets-list">
        {tickets.map(ticket => (
          <li
            key={ticket.id}
            onClick={() => navigate(`/tickets/${ticket.id}`, { state: { ticket } })}
            className="ticket-list-item"
          >
            <div className="ticket-item-left">
              <span className="ticket-id">#{ticket.id}</span>
              <span className="ticket-item-title">{ticket.name}</span>
              <span className="ticket-item">Derniere modification: {new Date(ticket.date_mod).toLocaleDateString("fr-FR")}</span>
              <span className="ticket-item">Date ouverture: {new Date(ticket.date_creation).toLocaleDateString("fr-FR")}</span>
              <span className="ticket-item">Priorité: {ticket.priority}</span>
            </div>
            <div className="ticket-item-right">
              <Badge status={ticket.status} />
              <span className="ticket-item-date">{new Date(ticket.date_creation).toLocaleDateString("fr-FR")}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}