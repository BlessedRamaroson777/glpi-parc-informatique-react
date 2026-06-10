import sqlite3 from "sqlite3";

const DB_PATH = "./data.sqlite";

export function openDb() {
  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(
      "CREATE TABLE IF NOT EXISTS langues (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL)"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS statuts (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, externalId INTEGER)"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS langueStatut (id INTEGER PRIMARY KEY AUTOINCREMENT, langueId INTEGER NOT NULL, statutId INTEGER NOT NULL, valeur TEXT NOT NULL, FOREIGN KEY (langueId) REFERENCES langues(id), FOREIGN KEY (statutId) REFERENCES statuts(id))"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS appSettings (settingKey TEXT PRIMARY KEY, settingValue TEXT NOT NULL)"
    );
  });

  return db;
}

export function openLangue() {
  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(
      "CREATE TABLE IF NOT EXISTS langues (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL)"
    );
  });

  return db;
}

export function openStatut() {
  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(
      "CREATE TABLE IF NOT EXISTS statuts (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL,externalId INTEGER )");
  });

  return db;
}


export function openLangueStatut() {
  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(
      "CREATE TABLE IF NOT EXISTS langueStatut (id INTEGER PRIMARY KEY AUTOINCREMENT, langueId INTEGER NOT NULL,statutId INTEGER NOT NULL,valeur TEXT NOT NULL,FOREIGN KEY (langueId) REFERENCES langues(id))");
  });

  return db;
}
