import React from "react";
import { useNavigate } from "react-router-dom";
import { getTickets, searchTickets } from "../../common/services/ticketService.jsx";
import Ticket from "../../common/entities/Ticket.jsx";
import { TICKET_STATUS } from "../../common/constants/TicketConstants.jsx";
import "../styles/tickets.css"; // Importation du même fichier CSS

const STATUS_LABELS = Object.fromEntries(TICKET_STATUS.map(s => [s.value, s.label]));

function Badge({ status }) {
  return <span className={`badge badge-list badge-status-${status}`}>{STATUS_LABELS[status] || `Statut ${status}`}</span>;
}

export default function Tickets() {
  const [tickets, setTickets] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
      const data = await getTickets();
      setTickets(data.map(item => new Ticket(item)));
  }

  async function handleSearch(e) {
    console.log("Recherche en cours pour :", e.target.value);
    const value = e.target.value;
    setSearch(value);

    if (value.trim() === "") {
      loadTickets();
      return;
    }
    try {
      const data = await searchTickets(value);
      // CRUCIAL : Mapper les données reçues avec la classe Ticket
      console.log("Données reçues de l'API :", data);
      
      setTickets(data.map(item => new Ticket(item)))
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
      setTickets([]); // Évite de faire planter l'affichage en cas d'erreur API
    }
  }

  return (
    <section className="tickets-list-container">
      <h1 className="list-title">Tickets</h1>
      {/* <input type="text" placeholder="Rechercher un ticket..." 
        onChange={handleSearch} 
        value={search}
        className="search-input"
      /> */}

      <ul className="tickets-list">
        {tickets.map(ticket => (
          <li
            key={ticket.id}
            onClick={() => navigate(`/admin/tickets/${ticket.id}`, { state: { ticket } })}
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