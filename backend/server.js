import express from "express";
import cors from "cors";
import { openDb } from "./db.js";

const app = express();
const db = openDb();

app.use(cors());
app.use(express.json());

app.get("/api/langues", (req, res) => {
  db.all("SELECT id, nom FROM langues ORDER BY id DESC", (error, rows) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ langues: rows });
  });
});

app.get("/api/langues/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  db.get("SELECT id, nom FROM langues WHERE id = ?", [id], (error, row) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ langue: row });
  });
});

app.post("/api/langues", (req, res) => {
  const { nom } = req.body;
  if (!nom) {
    res.status(400).json({ error: "Missing nom" });
    return;
  }

  db.run("INSERT INTO langues (nom) VALUES (?)", [nom], function onInsert(error) {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ id: this.lastID, nom });
  });
});

app.delete("/api/langues/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  db.run("DELETE FROM langues WHERE id = ?", [id], function onDelete(error) {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ deleted: this.changes });
  });
});


app.get("/api/statuts", (req, res) => {
  db.all("SELECT id, nom FROM statuts ORDER BY id DESC", (error, rows) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ statuts: rows });
  });
});

app.get("/api/statuts/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  db.get("SELECT id, nom FROM statuts WHERE id = ?", [id], (error, row) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ langue: row });
  });
});

app.post("/api/statuts", (req, res) => {
  const { nom, externalId } = req.body;

  if (!nom) {
    return res.status(400).json({ error: "Missing nom" });
  }

  db.run(
    "INSERT INTO statuts (nom, externalId) VALUES (?, ?)",
    [nom, externalId],
    function (error) {
      if (error) return res.status(500).json({ error: error.message });

      res.status(201).json({
        id: this.lastID,
        nom,
        externalId,
      });
    }
  );
});

// UPDATE statut
app.put("/api/statuts/:id", (req, res) => {
  const id = Number(req.params.id);
  const { nom, externalId } = req.body;

  db.run(
    "UPDATE statuts SET nom = ?, externalId = ? WHERE id = ?",
    [nom, externalId, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete("/api/statuts/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  db.run("DELETE FROM statuts WHERE id = ?", [id], function onDelete(error) {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ deleted: this.changes });
  });
});

app.get("/api/langue-statut", (req, res) => {
  db.all(
    `SELECT 
      ls.id,
      ls.valeur,
      l.id AS langueId,
      l.nom AS langueNom,
      s.id AS statutId,
      s.nom AS statutNom
    FROM langueStatut ls
    INNER JOIN langues l ON ls.langueId = l.id
    INNER JOIN statuts s ON ls.statutId = s.id
    ORDER BY ls.id DESC`,
    (error, rows) => {
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ langueStatut: rows });
    }
  );
});

app.post("/api/langue-statut", (req, res) => {
  const { langueId, statutId, valeur } = req.body;

  if (!langueId || !statutId || !valeur) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.run(
    "INSERT INTO langueStatut (langueId, statutId, valeur) VALUES (?, ?, ?)",
    [langueId, statutId, valeur],
    function (error) {
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put("/api/langue-statut/:id", (req, res) => {
  const id = Number(req.params.id);
  const { valeur } = req.body;

  if (!id || !valeur) {
    return res.status(400).json({ error: "Invalid request" });
  }

  db.run(
    "UPDATE langueStatut SET valeur = ? WHERE id = ?",
    [valeur, id],
    function (error) {
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ updated: this.changes });
    }
  );
});

app.delete("/api/langue-statut/:id", (req, res) => {
  const id = Number(req.params.id);

  db.run("DELETE FROM langueStatut WHERE id = ?", [id], function (error) {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ deleted: this.changes });
  });
});

app.get("/api/langue-statut/langue/:langueId", (req, res) => {
  const langueId = Number(req.params.langueId);

  db.all(
    `SELECT 
      ls.id,
      ls.valeur,
      l.nom AS langueNom,
      s.nom AS statutNom
    FROM langueStatut ls
    INNER JOIN langues l ON ls.langueId = l.id
    INNER JOIN statuts s ON ls.statutId = s.id
    WHERE ls.langueId = ?
    ORDER BY ls.id DESC`,
    [langueId],
    (error, rows) => {
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ langueStatut: rows });
    }
  );
});

app.post("/api/langue-with-statuts", (req, res) => {
  const { nomLangue } = req.body;

  if (!nomLangue) {
    return res.status(400).json({ error: "Missing nomLangue" });
  }

  // 1. créer langue
  db.run(
    "INSERT INTO langues (nom) VALUES (?)",
    [nomLangue],
    function (error) {
      if (error) return res.status(500).json({ error: error.message });

      const langueId = this.lastID;

      // 2. récupérer tous les statuts existants
      db.all("SELECT id FROM statuts", (err, statuts) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!statuts.length) {
          return res.json({
            langueId,
            message: "Langue créée sans statuts",
          });
        }

        // 3. insert automatique langueStatut
        const stmt = db.prepare(
          "INSERT INTO langueStatut (langueId, statutId, valeur) VALUES (?, ?, ?)"
        );

        for (const s of statuts) {
          stmt.run(langueId, s.id, ""); // vide au début
        }

        stmt.finalize();

        res.status(201).json({
          langueId,
          inserted: statuts.length,
        });
      });
    }
  );
});

app.post("/api/langue-statut/bulk", (req, res) => {
  const { langueId, traductions } = req.body;

  if (!langueId || !Array.isArray(traductions)) {
    return res.status(400).json({ error: "Missing data" });
  }

  const stmt = db.prepare(`
    INSERT INTO langueStatut (langueId, statutId, valeur)
    VALUES (?, ?, ?)
  `);

  for (const t of traductions) {
    stmt.run(langueId, t.statutId, t.valeur || "");
  }

  stmt.finalize();

  res.status(201).json({ inserted: traductions.length });
});

app.put("/api/langue-statut/:id", (req, res) => {
  const id = Number(req.params.id);
  const { valeur } = req.body;

  db.run(
    "UPDATE langueStatut SET valeur = ? WHERE id = ?",
    [valeur, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.get("/api/items", (req, res) => {
  db.all("SELECT id, name FROM items ORDER BY id DESC", (error, rows) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ items: rows });
  });
});


app.post("/api/items", (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "Missing name" });
    return;
  }

  db.run("INSERT INTO items (name) VALUES (?)", [name], function onInsert(error) {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ id: this.lastID, name });
  });
});

app.delete("/api/items/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  db.run("DELETE FROM items WHERE id = ?", [id], function onDelete(error) {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ deleted: this.changes });
  });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
