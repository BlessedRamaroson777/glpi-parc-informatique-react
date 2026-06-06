import { useMemo, useState } from "react";
import { apiRequest } from "../../common/services/authService.jsx";
import { RESET_CONFIG, PROTECTED_IDS } from "../constants/resetEntities.jsx";
import "../styles/reinitialisation.css";

// ─── Constantes ──────────────────────────────────────────────────────────────

const DRY_RUN = true;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise la réponse GLPI (array direct, ou { data: [] }, ou { items: [] }).
 */
function normalizeItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (payload?.items && Array.isArray(payload.items)) return payload.items;
  return [];
}

/**
 * Construit la liste des entités à afficher, triées par `order` croissant.
 * Distingue les entités "simples" (endpoint sans {id}) des "sous-ressources" (endpoint avec {id}).
 */
function buildSortedEntities() {
  return Object.entries(RESET_CONFIG)
    .map(([key, cfg]) => ({ key, ...cfg }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Regroupe les entités par groupe pour l'affichage UI.
 */
function buildGroups(sorted) {
  const map = new Map();
  for (const entity of sorted) {
    if (!map.has(entity.group)) map.set(entity.group, []);
    map.get(entity.group).push(entity);
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }));
}

// Couleur badge par groupe
const GROUP_COLORS = {
  Assistance:     { bg: '#fff3cd', border: '#ffc107', text: '#856404' },
  Assets:         { bg: '#cfe2ff', border: '#0d6efd', text: '#084298' },
  Administration: { bg: '#d1e7dd', border: '#198754', text: '#0a3622' },
  Référentiels:   { bg: '#f8d7da', border: '#dc3545', text: '#842029' },
};

const SORTED_ENTITIES = buildSortedEntities();
const ENTITY_GROUPS   = buildGroups(SORTED_ENTITIES);

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Reinitialisation() {
  const [selected, setSelected]   = useState({});
  const [logs, setLogs]           = useState([]);
  const [busy, setBusy]           = useState(false);
  const [logType, setLogType]     = useState({}); // key → 'info'|'success'|'error'|'warn'

  const allKeys = useMemo(
    () => SORTED_ENTITIES.map((e) => e.key),
    []
  );

  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected[k]);

  // ── Sélection ─────────────────────────────────────────────────────────────

  function toggleAll() {
    const value = !allSelected;
    const next  = {};
    allKeys.forEach((k) => { next[k] = value; });
    setSelected(next);
  }

  function toggleGroup(group) {
    const allChecked = group.items.every((item) => selected[item.key]);
    setSelected((prev) => {
      const next = { ...prev };
      group.items.forEach((item) => { next[item.key] = !allChecked; });
      return next;
    });
  }

  function toggleOne(key) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Logs ───────────────────────────────────────────────────────────────────

  function pushLog(message, type = 'info') {
    setLogs((prev) => [...prev, { message, type }]);
  }

  // ── Suppression d'une sous-ressource (endpoint contenant {id}) ────────────
  // ex: Assistance/Ticket/{id}/Cost  → on liste les tickets, puis pour chaque
  // ticket on récupère ses coûts et on les supprime.

  async function deleteSubResource(entity) {
    const { key, endpoint } = entity;
    // Trouve l'entité parente (celle dont dépend cette sous-ressource)
    const parentKey = entity.dependencies[0]; // ex: 'tickets'
    if (!parentKey) {
      pushLog(`⚠️  [${key}] Pas de parent défini — ignoré`, 'warn');
      return;
    }

    const parentCfg = RESET_CONFIG[parentKey];
    if (!parentCfg) {
      pushLog(`⚠️  [${key}] Parent "${parentKey}" introuvable dans RESET_CONFIG — ignoré`, 'warn');
      return;
    }

    // 1. Récupère la liste des parents
    const parentUrl = `/api.php/v2/${parentCfg.endpoint}`;
    pushLog(`  GET ${parentUrl}  (parents pour ${key})`);
    const parentResp  = await apiRequest(parentUrl, { method: 'GET' });
    const parentItems = normalizeItems(parentResp);

    if (parentItems.length === 0) {
      pushLog(`  ℹ️  Aucun parent "${parentKey}" trouvé → rien à faire pour "${key}"`, 'info');
      return;
    }

    // 2. Pour chaque parent, récupère et supprime les sous-ressources
    for (const parent of parentItems) {
      const parentId = parent.id ?? parent.ID;
      if (!parentId) continue;

      const subListUrl = `/api.php/v2/${endpoint.replace('{id}', parentId)}`;
      pushLog(`  GET ${subListUrl}`);
      const subResp  = await apiRequest(subListUrl, { method: 'GET' });
      const subItems = normalizeItems(subResp);

      for (const sub of subItems) {
        const subId = sub.id ?? sub.ID;
        if (!subId) continue;

        const deleteUrl = `${subListUrl}/${subId}?force=true`;
        pushLog(`  DELETE ${deleteUrl}`, 'warn');
        if (!DRY_RUN) {
          await apiRequest(deleteUrl, { method: 'DELETE' });
        }
      }
    }
  }

  // ── Suppression d'une entité simple ──────────────────────────────────────

  async function deleteSimpleEntity(entity) {
    const { key, endpoint } = entity;
    const listUrl = `/api.php/v2/${endpoint}`;
    pushLog(`GET ${listUrl}`);
    const response = await apiRequest(listUrl, { method: 'GET' });
    const rows     = normalizeItems(response);

    const protected_ids = PROTECTED_IDS[key] ?? [];

    for (const row of rows) {
      const id = row.id ?? row.ID;
      if (!id) continue;

      if (protected_ids.includes(id)) {
        pushLog(`  ⛔ SKIP ${key} id=${id} (ID protégé)`, 'warn');
        continue;
      }

      const deleteUrl = `/api.php/v2/${endpoint}/${id}?force=true`;
      pushLog(`  DELETE ${deleteUrl}`, 'warn');
      if (!DRY_RUN) {
        await apiRequest(deleteUrl, { method: 'DELETE' });
      }
    }
  }

  // ── Handler principal ─────────────────────────────────────────────────────

  async function handleReset() {
    const activeEntities = SORTED_ENTITIES.filter((e) => selected[e.key]);
    if (activeEntities.length === 0) {
      pushLog('⚠️  Aucune entité sélectionnée.', 'warn');
      return;
    }

    setBusy(true);
    setLogs([]);
    setLogType({});

    if (DRY_RUN) {
      pushLog('🔍  MODE DRY-RUN — aucune suppression réelle ne sera effectuée.', 'info');
    }

    try {
      for (const entity of activeEntities) {
        const isSubResource = entity.endpoint.includes('{id}');

        pushLog(`\n▶ [${entity.group}] ${entity.label} (order: ${entity.order})`, 'info');

        if (isSubResource) {
          await deleteSubResource(entity);
        } else {
          await deleteSimpleEntity(entity);
        }

        pushLog(`  ✅ ${entity.label} traité`, 'success');
      }

      if (DRY_RUN) {
        pushLog('\n✅  DRY_RUN terminé — passe DRY_RUN à false pour les vraies suppressions.', 'success');
      } else {
        pushLog('\n✅  Réinitialisation terminée.', 'success');
      }
    } catch (error) {
      pushLog(`\n❌  Erreur: ${error.message}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  const selectedCount = allKeys.filter((k) => selected[k]).length;

  return (
    <section id="reinitialisation" className="reinit-page">
      <div className="reinit-header">
        <h1>Réinitialisation GLPI</h1>
        <p className="reinit-subtitle">
          Supprime les données importées via les 3 fichiers CSV dans le bon ordre
          pour respecter les contraintes de clés étrangères de GLPI.
        </p>
        {DRY_RUN && (
          <div className="reinit-dryrun-badge">
            🔍 Mode DRY-RUN actif — aucune suppression réelle
          </div>
        )}
      </div>

      {/* Ordre de suppression */}
      <div className="reinit-order-info">
        <strong>Ordre de suppression (clés étrangères GLPI) :</strong>
        <ol>
          <li>Sous-ressources tickets <em>(coûts, suivis, documents, membres)</em></li>
          <li>Tickets</li>
          <li>Infocoms des assets <em>(computer &amp; monitor)</em></li>
          <li>Assets <em>(ordinateurs, moniteurs)</em></li>
          <li>Utilisateurs</li>
          <li>Référentiels <em>(modèles, fabricants, localisations, états)</em></li>
        </ol>
      </div>

      {/* Sélection globale */}
      <div className="reinit-select-all">
        <label className="reinit-checkbox-label">
          <input
            type="checkbox"
            id="select-all"
            checked={allSelected}
            onChange={toggleAll}
          />
          <span>Tout sélectionner</span>
          <span className="reinit-count-badge">{selectedCount} / {allKeys.length}</span>
        </label>
      </div>

      {/* Groupes */}
      <div className="form-grid">
        {ENTITY_GROUPS.map((group) => {
          const colors      = GROUP_COLORS[group.name] ?? GROUP_COLORS['Référentiels'];
          const groupChecked = group.items.every((item) => selected[item.key]);
          const groupPartial = !groupChecked && group.items.some((item) => selected[item.key]);

          return (
            <div key={group.name} className="reinit-group-card" style={{ '--group-border': colors.border, '--group-bg': colors.bg }}>
              <div className="reinit-group-header">
                <label className="reinit-checkbox-label">
                  <input
                    type="checkbox"
                    id={`group-${group.name}`}
                    checked={groupChecked}
                    ref={(el) => { if (el) el.indeterminate = groupPartial; }}
                    onChange={() => toggleGroup(group)}
                  />
                  <span
                    className="reinit-group-badge"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
                  >
                    {group.name}
                  </span>
                </label>
                <span className="reinit-group-count" style={{ color: colors.text }}>
                  {group.items.filter((i) => selected[i.key]).length}/{group.items.length}
                </span>
              </div>

              <div className="reinit-group-items">
                {group.items.map((item) => {
                  const isSubResource = item.endpoint.includes('{id}');
                  return (
                    <label key={item.key} className="reinit-item-label">
                      <input
                        type="checkbox"
                        id={`entity-${item.key}`}
                        checked={Boolean(selected[item.key])}
                        onChange={() => toggleOne(item.key)}
                      />
                      <div className="reinit-item-info">
                        <span className="reinit-item-name">
                          {isSubResource && <span className="reinit-sub-badge">↳ sous-res.</span>}
                          {item.label}
                        </span>
                        <span className="reinit-item-desc">{item.description}</span>
                        <code className="reinit-item-endpoint">{item.endpoint}</code>
                      </div>
                      <span className="reinit-order-tag">#{item.order}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Boutons */}
      <div className="button-row">
        <button
          type="button"
          id="btn-reset"
          className="reinit-btn reinit-btn-danger"
          onClick={handleReset}
          disabled={busy || selectedCount === 0}
        >
          {busy ? '⏳ En cours…' : `🗑️ Réinitialiser (${selectedCount} entité${selectedCount > 1 ? 's' : ''})`}
        </button>
        <button
          type="button"
          id="btn-clear-logs"
          className="reinit-btn reinit-btn-secondary"
          onClick={() => setLogs([])}
          disabled={busy}
        >
          Effacer les logs
        </button>
      </div>

      {/* Journal */}
      {logs.length > 0 && (
        <div className="reinit-log-panel">
          <div className="reinit-log-title">Journal d'exécution</div>
          {logs.map((entry, index) => (
            <div key={index} className={`reinit-log-line reinit-log-${entry.type}`}>
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
