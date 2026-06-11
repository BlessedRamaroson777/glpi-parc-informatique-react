import React from "react";
import apiV2 from "../../common/utils/apiV2.jsx"
import { getTickets, searchTickets, getTicketById } from "../../common/services/ticketService.jsx";
import Ticket from "../../common/entities/Ticket.jsx";
import { TICKET_STATUS } from "../../common/constants/TicketConstants.jsx";
import TicketDetail from "./TicketDetail.jsx";
import "../../common/styles/tickets.css"; // Importation du même fichier CSS
import CreateTicket from "./CreateTicket.jsx";
import { DEFAULT_KANBAN_COLORS } from "../../common/constants/TicketConstants.jsx";

const STATUS_LABELS = Object.fromEntries(TICKET_STATUS.map(s => [s.value, s.label]));
const SETTINGS_API = "http://localhost:5050";

function Badge({ status }) {
  return <span className={`badge badge-list badge-status-${status}`}>{STATUS_LABELS[status] || `Statut ${status}`}</span>;
}

export default function StatutTicket() {
  const [tickets, setTickets] = React.useState([]);
  const [showDetail, setShowDetail] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedTicket, setSelectedTicket] = React.useState();
  const [status, setStatus] = React.useState();
  const [kanbanColors, setKanbanColors] = React.useState(DEFAULT_KANBAN_COLORS);

  React.useEffect(() => {
    loadTickets();
    loadKanbanColors();
  }, []);

  async function loadKanbanColors() {
    try {
      const response = await fetch(`${SETTINGS_API}/api/kanban-colors`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur de chargement des couleurs");
      }
      setKanbanColors({ ...DEFAULT_KANBAN_COLORS, ...(data.colors || {}) });
    } catch (error) {
      console.error(error);
      setKanbanColors(DEFAULT_KANBAN_COLORS);
    }
  }

  async function loadTickets() {
      const data = await getTickets();
      const liste = data.map(item => new Ticket(item))
      const items = liste.map((ticket) => ({
        ...ticket,
        col: ticket.status,
      }))
      setTickets(items);
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
  
  async function handleShowDetail(ticketId){
    setSelectedTicket(ticketId);
    setShowDetail(prev => !prev)
  }

  async function handleShowCreate(statusId){
    setStatus(statusId);
    setShowCreate(prev => !prev)
  }

  // Événement déclenché au début du glissement de la carte
  const onDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
  };

  // Permet à la colonne de recevoir un élément déposé
  const onDragOver = (e) => {
    e.preventDefault();
  };

  // Événement déclenché lors du dépôt de la carte dans une colonne
  const onDrop = async (e, newStatus) => {
    const id = parseInt(e.dataTransfer.getData("text/plain"), 10);

    // const updatedtickets = tickets.map(ticket => 
    //   ticket.id === id ? { ...ticket, status: newStatus } : ticket
    // );
    // setTickets(updatedtickets);
    const ticketChanger = await getTicketById(id)
    // const update = await updateTicketStatus(ticketChanger, newStatus)
    const payload = {
      ...ticketChanger,
      status: newStatus
    }
    const res = await apiV2.patch(`/api.php/v2/Assistance/Ticket/${id}`, payload)
    console.log(res)
    loadTickets()
  };

  function getColumnStyle(statusValue) {
    const color = kanbanColors[`status${statusValue}`];
    if (!color) {
      return undefined;
    }

    return {
      backgroundColor: color,
      border: `1px solid ${color}`,
      borderRadius: "8px",
      padding: "10px",
    };
  }

  const renderColumn = (status, label, length) => {
    return (
      <div 
        onDragOver={onDragOver} 
        onDrop={(e) => onDrop(e, status)}
        key={label}
        className="status-group"
        style={getColumnStyle(status)}
      >
        <h2 className="status-group-title">
          <Badge status={status} /> ({length})
        </h2>
        <ul className="tickets-list">
          {tickets
            .filter(ticket => ticket.status === status)
            .map(ticket => (
              <li
                  key={ticket.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, ticket.id)}
                  onClick={() => handleShowDetail(ticket)}
                  className="ticket-list-item"
                >
                  <div className="ticket-item-left">
                    <span className="ticket-id">#{ticket.id}</span>
                    <span className="ticket-item-title">{ticket.name}</span>
                  </div>
                  <div className="ticket-item-right">
                    <Badge status={ticket.status} />
                    <span className="ticket-item-date">{new Date(ticket.date_creation).toLocaleDateString("fr-FR")}</span>
                  </div>
                </li>
            ))}
          </ul>
          <br />
          <button onClick={() => handleShowCreate(status)}>Ajouter un ticket</button>
      </div>
    );
  };

  return (
    <section className="tickets-list-container">
    <h1 className="list-title">Tickets repartis par statut</h1>
    {showDetail && 
      <div className="overlay-popup active" id="monPopup">
        <div className="contenu-popup">
            <button className="btn-fermer" onClick={() => setShowDetail(false)}>X</button>
            <TicketDetail ticket={selectedTicket} />
        </div>
      </div>
    }
    {showCreate && 
      <div className="overlay-popup active" id="monPopup">
        <div className="contenu-popup">
            <button className="btn-fermer" onClick={() => setShowCreate(false)}>X</button>
            <CreateTicket statusTicket={status}/>
        </div>
      </div>
    }
    <div className="tickets-list-statut">
      {TICKET_STATUS.map(statusValue => {
          const filtered = tickets.filter(t => Number(t.status) === Number(statusValue.value))
          // if (filtered.length === 0) return null
          return (
            renderColumn(statusValue.value,statusValue.label,filtered.length)
          )
        })}
    </div>
    </section>
  );
}