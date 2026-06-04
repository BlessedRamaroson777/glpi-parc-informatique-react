import express from "express";
import cors from "cors";
import { openDb } from "./db.js";

const app = express();
const db = openDb();

app.use(cors());
app.use(express.json());

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
