# 🛠️ Recettes — Comment faire...

Ce fichier contient des **tutoriels pas-à-pas** pour les tâches les plus courantes dans le projet. Chaque recette est autonome et peut être suivie de A à Z.

---

## Recette 1 : Ajouter une nouvelle page dans le backoffice

### Étapes

**1. Créer le fichier de la page**

```
src/backoffice/pages/MaNouvellePage.jsx
```

```jsx
import React, { useState, useEffect } from "react";

export default function MaNouvellePage() {
    return (
        <section>
            <h1>Ma Nouvelle Page</h1>
            <p>Contenu ici...</p>
        </section>
    );
}
```

**2. Ajouter la route**

Ouvrir le fichier de routes du backoffice et ajouter :

```jsx
import MaNouvellePage from "../pages/MaNouvellePage.jsx";

// Dans les <Routes> :
<Route path="ma-page" element={<MaNouvellePage />} />
```

**3. Ajouter un lien dans la navigation**

```jsx
<NavLink to="/admin/ma-page">Ma Page</NavLink>
```

---

## Recette 2 : Créer une nouvelle entité GLPI

Exemple : Créer une entité `Printer` pour gérer les imprimantes.

**1. Créer le fichier de l'entité**

```
src/common/entities/Printer.jsx
```

```jsx
import apiV2 from '../utils/apiV2.jsx';

class Printer {
    static ENDPOINT = 'Assets/Printer';

    constructor(data = {}) {
        this.id = data.id ?? null;
        this.name = data.name ?? '';
        this.serial = data.serial ?? '';
        this.comment = data.comment ?? '';
        this.is_deleted = data.is_deleted ?? false;

        // Relations
        this.entity = data.entity ?? null;
        this.location = data.location ?? null;
        this.manufacturer = data.manufacturer ?? null;
        this.model = data.model ?? null;
        this.user = data.user ?? null;
        this.status = data.status ?? null;

        // Dates
        this.date_creation = data.date_creation ?? null;
        this.date_mod = data.date_mod ?? null;
    }

    static fromData(data) {
        return new Printer(data);
    }

    _toPayload() {
        const payload = {
            name: this.name,
            serial: this.serial,
            comment: this.comment,
        };

        if (this.entity?.id) payload.entity = { id: Number(this.entity.id) };
        if (this.location?.id) payload.location = { id: Number(this.location.id) };
        if (this.manufacturer?.id) payload.manufacturer = { id: Number(this.manufacturer.id) };
        if (this.model?.id) payload.model = { id: Number(this.model.id) };
        if (this.user?.id) payload.user = { id: Number(this.user.id) };
        if (this.status?.id) payload.status = { id: Number(this.status.id) };

        return payload;
    }

    // CRUD
    async save() {
        const data = await apiV2.post(Printer.ENDPOINT, this._toPayload());
        return Printer.fromData(data);
    }

    async update() {
        if (!this.id) throw new Error('Printer ID requis');
        const data = await apiV2.patch(`${Printer.ENDPOINT}/${this.id}`, this._toPayload());
        return Printer.fromData(data);
    }

    async delete(purge = false) {
        if (!this.id) throw new Error('Printer ID requis');
        await apiV2.delete(`${Printer.ENDPOINT}/${this.id}${purge ? '?purge=true' : ''}`);
    }

    static async getById(id) {
        const data = await apiV2.get(`${Printer.ENDPOINT}/${id}`);
        return Printer.fromData(data);
    }

    static async getAll(params = {}) {
        const data = await apiV2.get(Printer.ENDPOINT, params);
        return data.map(item => Printer.fromData(item));
    }

    validate() {
        const errors = [];
        if (!this.name?.trim()) errors.push('Nom requis');
        return errors;
    }
}

export default Printer;
```

**2. L'utiliser dans un composant**

```jsx
import Printer from '../../common/entities/Printer.jsx';

// Récupérer toutes les imprimantes
const printers = await Printer.getAll();

// Créer une imprimante
const p = new Printer({ name: "HP LaserJet", serial: "ABC123" });
p.location = { id: 5 };
await p.save();
```

---

## Recette 3 : Ajouter un service (fonctions API)

Exemple : Un service pour les imprimantes.

**1. Créer le fichier**

```
src/common/services/printerService.jsx
```

```jsx
import apiV2 from "../utils/apiV2.jsx";

const BASE = "/api.php/v2.3/Assets/Printer";

export function getPrinters(params = {}) {
    return apiV2.get(`${BASE}?start=0&limit=999`, params);
}

export function getPrinterById(id) {
    return apiV2.get(`${BASE}/${id}`);
}

export function createPrinter(data) {
    return apiV2.post(BASE, data);
}

export function updatePrinter(id, data) {
    return apiV2.patch(`${BASE}/${id}`, data);
}

export function deletePrinter(id, purge = false) {
    return apiV2.delete(`${BASE}/${id}${purge ? '?purge=true' : ''}`);
}
```

---

## Recette 4 : Afficher une liste avec chargement et erreurs

Pattern complet copier-collable :

```jsx
import React, { useState, useEffect } from "react";

export default function MaListePage() {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        monService.getAll()
            .then(data => {
                const list = Array.isArray(data) ? data : (data?.data ?? []);
                setItems(list);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Chargement...</p>;
    if (error) return <p style={{ color: "red" }}>Erreur : {error}</p>;
    if (items.length === 0) return <p>Aucun résultat.</p>;

    return (
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                {items.map(item => (
                    <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
```

---

## Recette 5 : Créer un formulaire de création complet

```jsx
import React, { useState } from "react";

export default function FormulairePrinter() {
    const [formData, setFormData] = useState({
        name: "",
        serial: "",
        comment: "",
        locations_id: 0,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "locations_id" ? parseInt(value, 10) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setMessage({ type: "error", text: "Le nom est requis." });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const result = await createPrinter(formData);
            setMessage({ type: "success", text: `Imprimante #${result.id} créée !` });
            setFormData({ name: "", serial: "", comment: "", locations_id: 0 });
        } catch (err) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {message && (
                <div className={`status-message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="form-group">
                <label>Nom *</label>
                <input name="name" value={formData.name} onChange={handleChange} />
            </div>

            <div className="form-group">
                <label>Numéro de série</label>
                <input name="serial" value={formData.serial} onChange={handleChange} />
            </div>

            <div className="form-group">
                <label>Commentaire</label>
                <textarea name="comment" value={formData.comment} onChange={handleChange} />
            </div>

            <button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : "Créer l'imprimante"}
            </button>
        </form>
    );
}
```

---

## Recette 6 : Ajouter un filtre de recherche à une liste

```jsx
const [searchQuery, setSearchQuery] = useState("");
const [items, setItems] = useState([]);

// Filtrer côté client
const filteredItems = items.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.serial?.toLowerCase().includes(searchQuery.toLowerCase())
);

// Dans le JSX
<input
    type="text"
    placeholder="Rechercher..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
/>

<table>
    <tbody>
        {filteredItems.map(item => (
            <tr key={item.id}>
                <td>{item.name}</td>
            </tr>
        ))}
    </tbody>
</table>
```

---

## Recette 7 : Ajouter une colonne à un tableau existant

**1. Ajouter le `<th>` dans le header**

```jsx
<thead>
    <tr>
        <th>ID</th>
        <th>Nom</th>
        <th>Localisation</th>  {/* ← NOUVEAU */}
    </tr>
</thead>
```

**2. Ajouter le `<td>` dans le body**

```jsx
<tbody>
    {items.map(item => (
        <tr key={item.id}>
            <td>{item.id}</td>
            <td>{item.name}</td>
            <td>{item.location?.name ?? "—"}</td>  {/* ← NOUVEAU */}
        </tr>
    ))}
</tbody>
```

---

## Recette 8 : Gérer les coûts comme dans TicketDetail

Pattern pour calculer et afficher des totaux :

```jsx
// 1. Charger les coûts
const [costs, setCosts] = useState([]);

useEffect(() => {
    apiV2.get(`/api.php/v2.3/Assistance/Ticket/${ticketId}/Cost`)
        .then(data => setCosts(Array.isArray(data) ? data : (data?.data ?? [])))
        .catch(() => setCosts([]));
}, [ticketId]);

// 2. Calculer les totaux
const totalFixed    = costs.reduce((sum, c) => sum + (c.cost_fixed    || 0), 0);
const totalMaterial = costs.reduce((sum, c) => sum + (c.cost_material || 0), 0);
const totalTime     = costs.reduce((sum, c) => {
    const hours = (c.duration || c.actiontime || 0) / 3600;
    return sum + (c.cost_time || 0) * hours;
}, 0);
const totalGeneral  = totalFixed + totalMaterial + totalTime;

// 3. Afficher
function formatCurrency(amount) {
    return Number(amount).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

<p>Coût fixe total : {formatCurrency(totalFixed)}</p>
<p>Coût matériel total : {formatCurrency(totalMaterial)}</p>
<p>Coût horaire total : {formatCurrency(totalTime)}</p>
<p><strong>Total général : {formatCurrency(totalGeneral)}</strong></p>
```

---

## Recette 9 : Lier des éléments à un ticket lors de la création

```jsx
// 1. Créer le ticket
const ticketRes = await createTicket(payload);
const ticketId = ticketRes.id;

// 2. Lier les acteurs (Ticket_User)
// type: 1=Demandeur, 2=Attribué, 3=Observateur
await apiV1.createItem("Ticket_User", {
    input: {
        tickets_id: ticketId,
        users_id: userId,
        type: 1,
    }
});

// 3. Lier les assets (Item_Ticket)
await apiV1.createItem("Item_Ticket", {
    input: {
        tickets_id: ticketId,
        itemtype: "Computer",   // ou "Monitor", "Printer"...
        items_id: computerId,
    }
});
```

---

## Recette 10 : Récupérer les constantes (statuts, priorités, types)

```jsx
import { 
    TICKET_STATUS, 
    TICKET_PRIORITIES, 
    TICKET_TYPES 
} from '../../common/constants/TicketConstants.jsx';

// Créer un dictionnaire pour afficher les labels
const STATUS_LABELS   = Object.fromEntries(TICKET_STATUS.map(s => [s.value, s.label]));
const PRIORITY_LABELS = Object.fromEntries(TICKET_PRIORITIES.map(s => [s.value, s.label]));
const TYPE_LABELS     = Object.fromEntries(TICKET_TYPES.map(s => [s.value, s.label]));

// Utilisation
<span>{STATUS_LABELS[ticket.status]}</span>      // → "Nouveau", "Clos"...
<span>{PRIORITY_LABELS[ticket.priority]}</span>   // → "Haute", "Basse"...
<span>{TYPE_LABELS[ticket.type]}</span>           // → "Incident", "Demande"

// Les valeurs GLPI :
// Status : 1=Nouveau, 2=En cours Attribué, 6=Clos
// Type : 1=Incident, 2=Demande
// Priorité : 1=Très basse → 6=Majeure
```
