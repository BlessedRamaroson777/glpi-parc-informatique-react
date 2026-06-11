import React, { useEffect, useState } from "react";

export default function StatutTraduit() {
  // 1. L'état qui va recevoir vos statuts traduits de la DB
  const [statuts, setStatuts] = useState([]);

  // 2. Le useEffect qui charge les données au démarrage de la page
  useEffect(() => {
    async function chargerStatuts() {
      try {
        const langId = localStorage.getItem("langueId") || "1";
        const res = await fetch(`http://localhost:5050/api/langue-statut/langue/${langId}`);
        const data = await res.json();

        // Transformation directe de l'objet API en tableau [{ value, label }]
        const listeFormatee = (data.langueStatut || []).map(x => ({
          value: Number(x.statutId),
          label: x.valeur
        }));

        setStatuts(listeFormatee); // On stocke le résultat final
      } catch (error) {
        console.error("Erreur de chargement :", error);
      }
    }

    chargerStatuts();
  }, []); // [] = s'exécute une seule fois au chargement de la page

  // 3. L'affichage propre et simple
  return (
    <div style={{ padding: "20px" }}>
      <h3>Exemple d'utilisation des statuts traduits :</h3>
      
      <select>
        {statuts.map(s => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}