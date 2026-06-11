import React from "react";
import apiV2 from "../../common/utils/apiV2.jsx"
import { getTickets, searchTickets, getTicketById, loadStatusTranslations } from "../../common/services/ticketService.jsx";
import Ticket from "../../common/entities/Ticket.jsx";
import TicketDetail from "./TicketDetail.jsx";
import "../../common/styles/tickets.css"; 
import CreateTicket from "./CreateTicket.jsx";
import { DEFAULT_KANBAN_COLORS } from "../../common/constants/TicketConstants.jsx";
import Solution from "../components/Solution.jsx";

const SETTINGS_API = "http://localhost:5050";

export default function StatutTicket() {
  const [tickets, setTickets] = React.useState([]);
  const [showDetail, setShowDetail] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [showSolution, setShowSolution] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedTicket, setSelectedTicket] = React.useState();
  const [status, setStatus] = React.useState();
  const [kanbanColors, setKanbanColors] = React.useState(DEFAULT_KANBAN_COLORS);

  // ✓ VOTRE IDÉE : TICKET_STATUS devient un état qui va recevoir le résultat du chargement
  const [ticketStatusList, setTicketStatusList] = React.useState([]);

  // Badge mis à jour pour utiliser vos traductions dynamiques
  function Badge({ status }) {
    const found = ticketStatusList.find(s => Number(s.value) === Number(status));
    return (
      <span className={`badge badge-list badge-status-${status}`}>
        {found ? found.label : `Statut ${status}`}
      </span>
    );
  }

  React.useEffect(() => {
    loadTickets();
    loadKanbanColors();
    
    // ✓ On charge vos traductions au démarrage et on met à jour votre variable globale du composant
    loadStatusTranslations().then(translations => {
      // translations ressemble à : { "1": "Nouveau", "2": "En cours..." }
      // On le transforme en tableau [{ value: 1, label: "Nouveau" }, ...]
      const formattedStatus = Object.entries(translations).map(([id, valeur]) => ({
        value: Number(id),
        label: valeur
      }));
      
      setTicketStatusList(formattedStatus);
    });
  }, []);

  async function loadKanbanColors() {
    try {
      const response = await fetch(`${SETTINGS_API}/api/kanban-colors`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erreur couleurs");
      setKanbanColors({ ...DEFAULT_KANBAN_COLORS, ...(data.colors || {}) });
    } catch (error) {
      console.error(error);
      setKanbanColors(DEFAULT_KANBAN_COLORS);
    }
  }

  async function loadTickets() {
      const data = await getTickets();
      const items = data.map(item => new Ticket(item)).map((ticket) => ({
        ...ticket,
        col: ticket.status,
      }))
      setTickets(items);
  }

  async function handleSearch(e) {
    const value = e.target.value;
    setSearch(value);
    if (value.trim() === "") {
      loadTickets();
      return;
    }
    try {
      const data = await searchTickets(value);
      setTickets(data.map(item => new Ticket(item)))
    } catch (error) {
      console.error(error);
      setTickets([]); 
    }
  }
  
  const handleShowDetail = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetail(prev => !prev);
  };

  const handleShowCreate = (statusId) => {
    setStatus(statusId);
    setShowCreate(prev => !prev);
  };

  function handleCloseCreate() {
    setShowCreate(false);
    loadTickets();
    loadKanbanColors();
  }

  const onDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, newStatus) => {
    const id = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const ticketChanger = await getTicketById(id)
    const payload = { ...ticketChanger, status: newStatus }
    await apiV2.patch(`/api.php/v2/Assistance/Ticket/${id}`, payload)
    setSelectedTicket(id);
    setShowSolution(true);
    loadTickets();
  };

  function getColumnStyle(statusValue) {
    const color = kanbanColors[`status${statusValue}`];
    if (!color) return undefined;
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
        key={status}
        className="status-group"
        style={getColumnStyle(status)}
      >
        <h2 className="status-group-title">
          <Badge status={status} /> ({length})
        </h2>
        <ul className="tickets-list">
          {tickets
            .filter(ticket => Number(ticket.status) === Number(status))
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
    {showSolution && 
      <div className="overlay-popup active" id="monPopup">
        <div className="contenu-popup">
            <button className="btn-fermer" onClick={() => setShowSolution(false)}>X</button>
            <Solution idTicket={selectedTicket} />
        </div>
      </div>
    }
    {showCreate && 
      <div className="overlay-popup active" id="monPopup">
        <div className="contenu-popup">
            <button className="btn-fermer" onClick={handleCloseCreate}>X</button>
            <CreateTicket statusTicket={status}/>
        </div>
      </div>
    }
    <div className="tickets-list-statut">
      {/* ✓ On boucle directement sur les colonnes dynamiques de l'API locale */}
      {ticketStatusList.map(statusValue => {
          const filtered = tickets.filter(t => Number(t.status) === Number(statusValue.value))
          return renderColumn(statusValue.value, statusValue.label, filtered.length)
        })}
    </div>
    </section>
  );
}