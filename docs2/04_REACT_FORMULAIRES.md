# ⚛️ React — Formulaires

## 1. Inputs contrôlés (le pattern du projet)

Dans ce projet, tous les formulaires utilisent des **inputs contrôlés** : la valeur de l'input est stockée dans un state React.

### Le pattern complet utilisé dans CreateTicket.jsx

```jsx
// 1. On initialise le state du formulaire
const [formData, setFormData] = useState({
    name: "",
    content: "",
    type: 1,          // 1 = Incident, 2 = Demande
    urgency: 3,       // 1-5
    status: 1,        // 1 = Nouveau
});

// 2. UNE SEULE fonction pour gérer TOUS les champs
const handleInputChange = (e) => {
    const { name, value } = e.target;
    //       ↑       ↑
    //  l'attribut  la valeur
    //  name=""     tapée

    setFormData(prev => ({
        ...prev,                    // On garde tout ce qu'il y avait avant
        [name]: value,              // On met à jour SEULEMENT le champ modifié
    }));
};

// 3. Chaque input a un name="" qui correspond à une clé du state
<input 
    type="text" 
    name="name"                   // ← Correspond à formData.name
    value={formData.name}         // ← La valeur vient du state
    onChange={handleInputChange}  // ← Chaque frappe met à jour le state
/>

<textarea 
    name="content"
    value={formData.content}
    onChange={handleInputChange}
/>
```

### Pourquoi `[name]: value` avec les crochets ?

C'est une syntaxe JavaScript appelée **computed property name**. Elle permet d'utiliser une variable comme clé d'un objet.

```javascript
const champ = "name";

// Sans crochets (FAUX) :
{ champ: "Jean" }  // → crée { champ: "Jean" }, pas { name: "Jean" }

// Avec crochets (VRAI) :
{ [champ]: "Jean" }  // → crée { name: "Jean" }
```

## 2. Les Select (listes déroulantes)

### Select simple avec des valeurs fixes

```jsx
<select name="type" value={formData.type} onChange={handleInputChange}>
    <option value={1}>Incident</option>
    <option value={2}>Demande</option>
</select>
```

### Select dynamique chargé depuis l'API

```jsx
// 1. State pour stocker les options
const [categories, setCategories] = useState([]);

// 2. Charger les options au montage
useEffect(() => {
    getITILCategories().then(setCategories);
}, []);

// 3. Afficher les options avec .map()
<select name="itilcategories_id" value={formData.itilcategories_id} onChange={handleInputChange}>
    <option value={0}>-----</option>
    {categories.map(c => (
        <option key={c.id} value={c.id}>
            {c.completename || c.name}
        </option>
    ))}
</select>
```

### Convertir les valeurs numériques

Par défaut, un `<select>` renvoie une **string**. Si votre API attend un nombre, il faut convertir.

```jsx
// Dans le projet, handleInputChange gère ça :
const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: ["type", "urgency", "impact", "priority", "status"].includes(name)
            ? (value === "" ? "" : parseInt(value, 10))  // ← Conversion en nombre
            : value,                                      // ← Reste une string
    }));
};
```

## 3. Soumission du formulaire

```jsx
const handleSubmit = async (e) => {
    e.preventDefault();  // ← CRUCIAL : empêche le rechargement de la page
    
    // 1. Validation
    if (!formData.name.trim()) {
        setStatus({ type: 'error', message: 'Titre requis' });
        return;
    }
    
    // 2. Indicateur de chargement
    setLoading(true);
    setStatus(null);
    
    try {
        // 3. Appel API
        const result = await createTicket(payload);
        
        // 4. Succès
        setStatus({ type: 'success', message: `Ticket #${result.id} créé !` });
        
        // 5. Reset du formulaire
        setFormData({
            name: "",
            content: "",
            type: 1,
            // ... toutes les valeurs initiales
        });
    } catch (error) {
        // 6. Gestion des erreurs
        setStatus({ type: 'error', message: 'Erreur : ' + error.message });
    } finally {
        // 7. Toujours remettre loading à false
        setLoading(false);
    }
};

// Dans le JSX
<form onSubmit={handleSubmit}>
    {/* ... inputs ... */}
    <button type="submit" disabled={loading}>
        {loading ? "Création en cours..." : "Soumettre"}
    </button>
</form>
```

## 4. Afficher un message de statut

```jsx
// Le state
const [status, setStatus] = useState(null);

// Dans le JSX
{status && (
    <div className={`status-message ${status.type}`}>
        {status.message}
    </div>
)}

// type = 'success' → vert
// type = 'error'   → rouge
```

## 5. Formulaire avec éléments sélectionnables (assets)

Pattern pour sélectionner des éléments dans une liste et les afficher :

```jsx
const [allAssets, setAllAssets] = useState([]);       // Tous les assets possibles
const [selectedAssets, setSelectedAssets] = useState([]); // Ceux sélectionnés

// Ajouter un asset sélectionné
const handleAssetSelect = (e) => {
    const [type, id] = e.target.value.split("-");
    const asset = allAssets.find(a => a.type === type && String(a.id) === id);
    
    // Vérifier qu'il n'est pas déjà sélectionné
    if (asset && !selectedAssets.some(a => a.id === asset.id && a.type === asset.type)) {
        setSelectedAssets(prev => [...prev, asset]);
    }
};

// Supprimer un asset sélectionné
const removeAsset = (assetToRemove) => {
    setSelectedAssets(prev => 
        prev.filter(a => !(a.id === assetToRemove.id && a.type === assetToRemove.type))
    );
};

// Afficher les chips des assets sélectionnés
{selectedAssets.map(asset => (
    <div key={`sel-${asset.type}-${asset.id}`} className="selected-asset-chip">
        <span>{asset.name}</span>
        <button type="button" onClick={() => removeAsset(asset)}>×</button>
    </div>
))}
```
