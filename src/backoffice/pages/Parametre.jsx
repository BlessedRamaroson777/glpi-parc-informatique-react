import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5050";

export default function Parametre() {
  // ===================== LANGUES =====================
  const [langues, setLangues] = useState([]);
  const [nomLangue, setNomLangue] = useState("");

  // ===================== STATUTS =====================
  const [statuts, setStatuts] = useState([]);
  const [nomStatut, setNomStatut] = useState("");
  const [externalId, setExternalId] = useState("");

  // ===================== LANGUE STATUT =====================
  const [selectedLangue, setSelectedLangue] = useState(null);
  const [traductions, setTraductions] = useState({});

  const [status, setStatus] = useState("");

  // ===================================================
  // LOAD LANGUES
  async function loadLangues() {
    const res = await fetch(`${API_BASE_URL}/api/langues`);
    const data = await res.json();
    setLangues(data.langues || []);
  }

  // LOAD STATUTS
  async function loadStatuts() {
    const res = await fetch(`${API_BASE_URL}/api/statuts`);
    const data = await res.json();
    setStatuts(data.statuts || []);
  }

  useEffect(() => {
    loadLangues();
    loadStatuts();
  }, []);

  // ===================================================
  // CRUD LANGUE
  async function createLangue(e) {
    e.preventDefault();

    await fetch(`${API_BASE_URL}/api/langues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: nomLangue }),
    });

    setNomLangue("");
    loadLangues();
  }

  async function deleteLangue(id) {
    await fetch(`${API_BASE_URL}/api/langues/${id}`, {
      method: "DELETE",
    });

    loadLangues();
  }

  // ===================================================
  // CRUD STATUT
  async function createStatut(e) {
    e.preventDefault();

    await fetch(`${API_BASE_URL}/api/statuts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: nomStatut,
        externalId: externalId,
      }),
    });

    setNomStatut("");
    setExternalId("");
    loadStatuts();
  }

  async function deleteStatut(id) {
    await fetch(`${API_BASE_URL}/api/statuts/${id}`, {
      method: "DELETE",
    });

    loadStatuts();
  }

  // ===================================================
  // LOAD LANGUE STATUT (EDIT MODE)
  async function selectLangue(l) {
    setSelectedLangue(l);

    const res = await fetch(
      `${API_BASE_URL}/api/langue-statut/langue/${l.id}`
    );

    const data = await res.json();

    const map = {};
    data.langueStatut.forEach((ls) => {
      map[ls.statutId] = ls.valeur;
    });

    setTraductions(map);
  }

  function handleChangeTraduction(statutId, value) {
    setTraductions((prev) => ({
      ...prev,
      [statutId]: value,
    }));
  }

  function handleUnSelect(){
    setSelectedLangue(null)
  }

  // ===================================================
  // SAVE LANGUE + TRADUCTIONS (CREATE + UPDATE)
  async function saveLangueStatut(e) {
    e.preventDefault();

    setStatus("Saving...");

    let langueId = selectedLangue?.id;

    // CREATE LANGUE SI NOUVEAU
    if (!langueId) {
      const res = await fetch(`${API_BASE_URL}/api/langues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nomLangue }),
      });

      const data = await res.json();
      langueId = data.id;
    }

    // BUILD PAYLOAD
    const payload = statuts.map((s) => ({
      statutId: s.id,
      valeur: traductions[s.id] || "",
    }));

    await fetch(`${API_BASE_URL}/api/langue-statut/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ langueId, traductions: payload }),
    });

    setStatus("OK");

    setSelectedLangue(null);
    setNomLangue("");
    setTraductions({});

    loadLangues();
  }

  // ===================================================
  return (
    <div className="backend-test-page">

      <h1>Paramètres</h1>

      <div className="backend-test-content">

        {/* ================= LANGUES ================= */}
        <div>
          <h2>Langues</h2>

          <form className="backend-form" onSubmit={createLangue}>
            <input
              value={nomLangue}
              onChange={(e) => setNomLangue(e.target.value)}
              placeholder="Nom langue"
            />
            <button>Ajouter langue</button>
          </form>

          <ul className="backend-list">
            {langues.map((l) => (
              <li key={l.id}>
                {l.nom}

                <div>
                  <button onClick={() => selectLangue(l)}>Edit</button>
                  <button onClick={() => deleteLangue(l.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ================= STATUTS ================= */}
        <div>
          <h2>Statuts</h2>

          <form className="backend-form" onSubmit={createStatut}>
            <input
              value={nomStatut}
              onChange={(e) => setNomStatut(e.target.value)}
              placeholder="Nom statut"
            />

            <input
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="External ID"
            />

            <button>Ajouter statut</button>
          </form>

          <ul className="backend-list">
            {statuts.map((s) => (
              <li key={s.id}>
                {s.nom} ({s.externalId})

                <button onClick={() => deleteStatut(s.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ========== LANGUE STATUT ========== */}
        <div>
          <h2>Langue Statuts</h2>

          <form className="backend-form" onSubmit={saveLangueStatut}>
            <input
              value={selectedLangue?.nom || nomLangue}
              onChange={(e) => setNomLangue(e.target.value)}
              placeholder="Nom langue"
              disabled={selectedLangue}
            />

            <button>
              {selectedLangue ? "Update langue" : "Créer langue + traductions"}
            </button>
            {selectedLangue && 
            <div>
              <button onClick={handleUnSelect}>Effacer</button>
            </div>}
          </form>

          <p className="backend-status">{status}</p>
              
          <ul className="backend-list">
            {statuts.map((s) => (
              <li key={s.id}>
                <b>{s.nom}</b>

                <input
                  value={traductions[s.id] || ""}
                  onChange={(e) =>
                    handleChangeTraduction(s.id, e.target.value)
                  }
                />
              </li>
            ))}
          </ul>

        </div>

      </div>
    </div>
  );
}