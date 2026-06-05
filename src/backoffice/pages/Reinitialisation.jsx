import { useMemo, useState } from "react";
import { apiRequest } from "../services/authService.jsx";
import "../styles/reinitialisation.css";

const ENTITY_GROUPS = [
  {
    name: "Groupe 1 - Dependances",
    items: [
      {
        key: "tickets",
        label: "Tickets",
        listPath: "/api.php/v2/Assistance/Ticket",
        deletePath: "/api.php/v2/Assistance/Ticket",
      },
      {
        key: "changes",
        label: "Changements",
        listPath: "/api.php/v2/Assistance/Change",
        deletePath: "/api.php/v2/Assistance/Change",
      },
      {
        key: "problems",
        label: "Problemes",
        listPath: "/api.php/v2/Assistance/Problem",
        deletePath: "/api.php/v2/Assistance/Problem",
      },
      {
        key: "contracts",
        label: "Contrats",
        listPath: "/api.php/v2/Management/Contract",
        deletePath: "/api.php/v2/Management/Contract",
      },
      {
        key: "documents",
        label: "Documents",
        listPath: "/api.php/v2/Management/Document",
        deletePath: "/api.php/v2/Management/Document",
      },
    ],
  },
  {
    name: "Groupe 2 - Parc",
    items: [
      {
        key: "computers",
        label: "Ordinateurs",
        listPath: "/api.php/v2/Assets/Computer",
        deletePath: "/api.php/v2/Assets/Computer",
      },
      {
        key: "monitors",
        label: "Moniteurs",
        listPath: "/api.php/v2/Assets/Monitor",
        deletePath: "/api.php/v2/Assets/Monitor",
      },
      {
        key: "printers",
        label: "Imprimantes",
        listPath: "/api.php/v2/Assets/Printer",
        deletePath: "/api.php/v2/Assets/Printer",
      },
      {
        key: "network",
        label: "Equipements reseau",
        listPath: "/api.php/v2/Assets/NetworkEquipment",
        deletePath: "/api.php/v2/Assets/NetworkEquipment",
      },
      {
        key: "phones",
        label: "Telephones",
        listPath: "/api.php/v2/Assets/Phone",
        deletePath: "/api.php/v2/Assets/Phone",
      },
      {
        key: "peripherals",
        label: "Peripheriques",
        listPath: "/api.php/v2/Assets/Peripheral",
        deletePath: "/api.php/v2/Assets/Peripheral",
      },
      {
        key: "software",
        label: "Logiciels",
        listPath: "/api.php/v2/Assets/Software",
        deletePath: "/api.php/v2/Assets/Software",
      },
      {
        key: "passive-dc",
        label: "Equipements passifs DC",
        listPath: "/api.php/v2/Assets/PassiveDCEquipment",
        deletePath: "/api.php/v2/Assets/PassiveDCEquipment",
      },
      {
        key: "pdu",
        label: "PDU",
        listPath: "/api.php/v2/Assets/PDU",
        deletePath: "/api.php/v2/Assets/PDU",
      },
      {
        key: "enclosures",
        label: "Baies",
        listPath: "/api.php/v2/Assets/Enclosure",
        deletePath: "/api.php/v2/Assets/Enclosure",
      },
      {
        key: "racks",
        label: "Racks",
        listPath: "/api.php/v2/Assets/Rack",
        deletePath: "/api.php/v2/Assets/Rack",
      },
    ],
  },
  {
    name: "Groupe 3 - Gestion",
    items: [
      {
        key: "suppliers",
        label: "Fournisseurs",
        listPath: "/api.php/v2/Management/Supplier",
        deletePath: "/api.php/v2/Management/Supplier",
      },
      {
        key: "contacts",
        label: "Contacts",
        listPath: "/api.php/v2/Management/Contact",
        deletePath: "/api.php/v2/Management/Contact",
      },
      {
        key: "budgets",
        label: "Budgets",
        listPath: "/api.php/v2/Management/Budget",
        deletePath: "/api.php/v2/Management/Budget",
      },
      {
        key: "projects",
        label: "Projets",
        listPath: "/api.php/v2/Project",
        deletePath: "/api.php/v2/Project",
      },
    ],
  },
  {
    name: "Groupe 4 - Administration",
    items: [
      {
        key: "users",
        label: "Utilisateurs",
        listPath: "/api.php/v2/Administration/User",
        deletePath: "/api.php/v2/Administration/User",
      },
      {
        key: "groups",
        label: "Groupes",
        listPath: "/api.php/v2/Administration/Group",
        deletePath: "/api.php/v2/Administration/Group",
      },
      {
        key: "entities",
        label: "Entites",
        listPath: "/api.php/v2/Administration/Entity",
        deletePath: "/api.php/v2/Administration/Entity",
      },
    ],
  },
];

const DRY_RUN = true;

function normalizeItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload?.data && Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload?.items && Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
}

export default function Reinitialisation() {
  const [selected, setSelected] = useState({});
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);

  const allKeys = useMemo(
    () => ENTITY_GROUPS.flatMap((group) => group.items.map((item) => item.key)),
    []
  );

  const allSelected = allKeys.length > 0 && allKeys.every((key) => selected[key]);

  function toggleAll() {
    const next = {};
    const value = !allSelected;
    allKeys.forEach((key) => {
      next[key] = value;
    });
    setSelected(next);
  }

  function toggleGroup(group) {
    const allChecked = group.items.every(
        (item) => selected[item.key]
    );

    setSelected((prev) => {
        const next = { ...prev };

        group.items.forEach((item) => {
        next[item.key] = !allChecked;
        });

        return next;
    });
    }

  function toggleOne(key) {
    setSelected((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function pushLog(message) {
    setLogs((prev) => [...prev, message]);
  }

  async function handleReset() {
    setBusy(true);
    setLogs([]);

    try {
      for (const group of ENTITY_GROUPS) {
        const activeItems = group.items.filter((item) => selected[item.key]);
        if (activeItems.length === 0) {
          continue;
        }

        pushLog(`--- ${group.name} ---`);

        for (const item of activeItems) {
          pushLog(`GET ${item.listPath}`);
          const response = await apiRequest(item.listPath, { method: "GET" });
          const rows = normalizeItems(response);

          for (const row of rows) {
            const id = row.id ?? row.ID;
            if (!id) {
              continue;
            }

            const deleteUrl = `${item.deletePath}/${id}?force=true`;
            pushLog(`DELETE ${deleteUrl}`);

            if (!DRY_RUN) {
              await apiRequest(deleteUrl, { method: "DELETE" });
            }
          }
        }
      }

      if (DRY_RUN) {
        pushLog("DRY_RUN actif: aucune suppression effectuee.");
      }
    } catch (error) {
      pushLog(`Erreur: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="reinitialisation" className="reinit-page">
      <h1>Reinitialisation</h1>
      <p>Selectionne les entites a purger, puis lance la reinitialisation.</p>

      <div className="form-grid">
        <label>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
          />
          Tout selectionner
        </label>

        {ENTITY_GROUPS.map((group) => {
            const groupSelected = group.items.every(
                (item) => selected[item.key]
            );

            return (
                <div key={group.name}>
                <strong>
                    {group.name}
                    <label>
                    <input
                        type="checkbox"
                        checked={groupSelected}
                        onChange={() => toggleGroup(group)}
                    />
                    Tout selectionner
                    </label>
                </strong>

                {group.items.map((item) => (
                    <label key={item.key}>
                    <input
                        type="checkbox"
                        checked={Boolean(selected[item.key])}
                        onChange={() => toggleOne(item.key)}
                    />
                    {item.label}
                    </label>
                ))}
                </div>
            );
        })}
      </div>

      <div className="button-row">
        <button type="button" onClick={handleReset} disabled={busy}>
          Reinitialiser
        </button>
      </div>

      {logs.length > 0 && (
        <div className="status">
          {logs.map((line, index) => (
            <div key={`${line}-${index}`}>{line}</div>
          ))}
        </div>
      )}
    </section>
  );
}
