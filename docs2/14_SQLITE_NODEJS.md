# 🗄️ SQLite & Node.js (Le Backend)

Le projet utilise un serveur Node.js (Express) avec la base de données **SQLite** (via le module `sqlite3`). C'est dans le dossier `backend/`.

Voici comment manipuler la base de données correctement en vous basant sur votre fichier `server.js`.

## 1. Les 3 méthodes principales de SQLite

Le module `sqlite3` propose 3 méthodes différentes selon ce que vous voulez faire. C'est la source de la plupart des erreurs ("ça me donne un objet vide" ou "ça me donne row au lieu du tableau").

### A. `db.all()` — Récupérer PLUSIEURS lignes (Tableau)
Utilisez `db.all` quand vous attendez une liste (même s'il n'y a qu'un seul résultat ou aucun).

```javascript
// ✅ REQUÊTE
db.all("SELECT id, nom FROM langues", [], (error, rows) => {
    if (error) { ... }
    
    // rows est TOUJOURS un tableau : [{id: 1, nom: "FR"}, {id: 2, nom: "EN"}]
    // Si la table est vide, rows = []
    res.json({ langues: rows });
});
```

### B. `db.get()` — Récupérer UNE SEULE ligne (Objet)
Utilisez `db.get` quand vous cherchez un élément précis par son ID.

```javascript
// ✅ REQUÊTE
db.get("SELECT id, nom FROM langues WHERE id = ?", [id], (error, row) => {
    // row est un OBJET : {id: 1, nom: "FR"}
    // Si non trouvé, row = undefined
    res.json({ langue: row });
});
```

### C. `db.run()` — Ajouter, Modifier, Supprimer (Pas de résultat de lecture)
Utilisez `db.run` pour `INSERT`, `UPDATE`, `DELETE`. Ça ne retourne pas de lignes, mais des informations sur l'opération.

```javascript
// ✅ INSERTION (Créer)
db.run("INSERT INTO langues (nom) VALUES (?)", ["Français"], function(error) {
    // ⚠️ ATTENTION : Il faut utiliser "function(error)" et non une fonction fléchée "() =>"
    // car on a besoin du mot-clé "this" !
    
    const idCree = this.lastID;  // ← L'ID généré automatiquement
    res.status(201).json({ id: idCree });
});

// ✅ SUPPRESSION / MODIFICATION
db.run("DELETE FROM langues WHERE id = ?", [5], function(error) {
    const nombreLignesSupprimees = this.changes; // ← Combien de lignes ont été affectées
    res.json({ deleted: nombreLignesSupprimees });
});
```

## 2. La sécurité : Paramètres dynamiques `?`

**Ne concaténez JAMAIS** des variables directement dans la chaîne SQL. C'est une faille de sécurité majeure (Injection SQL) et ça plantera s'il y a des guillemets dans le texte.

```javascript
const name = "L'ordinateur"; // Contient une apostrophe

// ❌ FAUX ET DANGEREUX
db.run(`INSERT INTO items (name) VALUES ('${name}')`); // Va planter à cause de l'apostrophe

// ✅ VRAI ET SÉCURISÉ
db.run("INSERT INTO items (name) VALUES (?)", [name], function(err) { ... });
```

Si vous avez plusieurs paramètres :
```javascript
db.run(
    "UPDATE statuts SET nom = ?, externalId = ? WHERE id = ?",
    [nom, externalId, id], // L'ordre du tableau doit correspondre à l'ordre des ?
    function(err) { ... }
);
```

## 3. Les requêtes complexes (Exemples du projet)

### Jointures (INNER JOIN)
Quand vous avez besoin des données de plusieurs tables en même temps (ex: récupérer le texte de la langue ET le nom du statut).

```javascript
db.all(`
    SELECT 
      ls.id,
      ls.valeur,
      l.nom AS langueNom,    -- On renomme pour éviter les conflits
      s.nom AS statutNom
    FROM langueStatut ls
    INNER JOIN langues l ON ls.langueId = l.id
    INNER JOIN statuts s ON ls.statutId = s.id
`, [], (error, rows) => { ... });
```

### Agrégations (SUM, GROUP BY, CASE)
Faire des calculs directement dans la base de données (très rapide).

```javascript
db.all(`
    SELECT
      assetType,
      SUM(CASE WHEN typeCout = 'superCout' THEN valeur ELSE 0 END) AS superCout,
      SUM(glpiCout) AS coutTotal
    FROM couts
    GROUP BY assetType
`, [], (error, rows) => { ... });
```

## 4. Structure d'une route Express complète

Voici le template parfait d'une route API dans votre `server.js` :

```javascript
app.post("/api/mon-endpoint", (req, res) => {
    // 1. Récupérer les données envoyées par React
    const { titre, description } = req.body;

    // 2. Validation basique
    if (!titre) {
        return res.status(400).json({ error: "Le titre est requis" });
    }

    // 3. Exécuter la requête
    db.run(
        "INSERT INTO ma_table (titre, description) VALUES (?, ?)",
        [titre, description],
        function (error) {
            // 4. Gérer l'erreur SQL
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            // 5. Retourner le succès
            res.status(201).json({ 
                id: this.lastID, 
                message: "Créé avec succès" 
            });
        }
    );
});
```

## 5. Résoudre l'erreur "API ne répond pas" (CORS ou Crash)

Si React n'arrive pas à lire la base SQLite :
1. Vérifiez que `server.js` tourne (`node server.js`).
2. Vérifiez que la route exacte existe (attention aux majuscules/minuscules, `/api/Couts` n'est pas `/api/couts`).
3. Si le serveur crashe au démarrage, c'est souvent une erreur de syntaxe dans la création des tables dans `db.js`.
4. Si vous avez modifié `server.js`, il faut **redémarrer** le serveur Node (Ctrl+C puis relancer), sauf si vous utilisez `nodemon`.
