import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { API } from "../constants/apiConfig.jsx";

export default function Langue() {
  const navigate = useNavigate();
  const [langues, setLangues] = useState([]);
  const [selectedLangue, setSelectedLangue] = useState("");


  useEffect(() => {
    async function loadLangues() {
      try {
        const response = await fetch(`${API}/api/langues`);
        const d = await response.json();
        const listeLangues = d.langues || [];
        
        setLangues(listeLangues);

        // Optionnel : Sélectionner par défaut la première langue de la liste
        if (listeLangues.length > 0) {
          setSelectedLangue(listeLangues[0].id);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des langues :", error);
      }
    }

    loadLangues();
  }, []);
  function handleSelectLangue() {
    localStorage.setItem("langueId", selectedLangue)
    console.log("Langue sélectionnée :", localStorage.getItem("langueId"));
  }
  return (
    <div className="logout-container">
      <div>
        <select value={selectedLangue} onChange={e => setSelectedLangue(e.target.value)}>
          {langues.map(l => (
            <option key={l.id} value={l.id}>
              {l.nom}
            </option>
          ))}
        </select>
        <button type="button" onClick={handleSelectLangue}>
          Selectionner
        </button>
      </div>
    </div>
  );
}