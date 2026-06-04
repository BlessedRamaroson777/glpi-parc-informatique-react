import sqlite3 from "sqlite3";

const DB_PATH = "./data.sqlite";

export function openDb() {
  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(
      "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)"
    );
  });

  return db;
}
