.open data.sqlite
.databases
.tables
CREATE TABLE IF NOT EXISTS langues (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    nom TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS statuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    nom TEXT NOT NULL,
    valeurInitial TEXT NOT NULL,
    externalId INTEGER 
);
CREATE TABLE IF NOT EXISTS langueStatut (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    langueId INTEGER NOT NULL,
    statutId INTEGER NOT NULL,
    valeur TEXT NOT NULL,
    FOREIGN KEY (langueId) REFERENCES langues(id)
);

CREATE TABLE IF NOT EXISTS appSettings (
    settingKey TEXT PRIMARY KEY, 
    settingValue TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS couts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    valeur TEXT NOT NULL,
    ticketId int, 
    assetType TEXT, 
    typeCout text,
    glpiCout int, 
    valeurInitial int,
    heure DATETIME
);

SELECT 
      id, ticketId, valeur, assetType, typeCout, glpiCout, valeurInitial 
    FROM couts 
      WHERE ticketId = 1034 and 
      heure = (SELECT max(heure) FROM couts WHERE ticketId = 1034 and typeCout = "superCout");

-- ── 1. INSERTION DES LANGUES ────────────────────────────────────────────────
,INSERT INTO langues (id, nom) VALUES 
(1, 'Français')
(2, 'Malagasy');

-- ── 2. INSERTION DES STATUTS ────────────────────────────────────────────────
-- externalId stocke la valeur numérique native utilisée par GLPI (1, 2, 5, etc.)
INSERT INTO statuts (id, nom, valeurInitial, externalId) VALUES 
(1, 'Nouveau', 'Nouveau', 1),
(2, 'En cours', 'En cours Attribué', 2),
(3, 'Résolu', 'Resolu', 5);

-- ── 3. TRADUCTIONS (LANGUESTATUT) ───────────────────────────────────────────
-- Liens et libellés localisés selon la langue
INSERT INTO langueStatut (langueId, statutId, valeur) VALUES 
-- Traductions pour le Français (langueId = 1)
(1, 1, 'Nouveau'),
(1, 2, 'En cours Attribué'),
(1, 3, 'Résolu'),

-- Traductions pour le Malagasy (langueId = 2)
(2, 1, 'Vaovao'),               -- "Nouveau" en Malagasy
(2, 2, 'An-dalam-pandrosoana'), -- "En cours" en Malagasy
(2, 3, 'Voavaha');              -- "Résolu" en Malagasy

INSERT OR IGNORE INTO appSettings (settingKey, settingValue)
VALUES (
  'kanban.colors',
  '{
    "status1": "#dcfce7",
    "status2": "#dbeafe",
    "status3": "#fad1d7",
    "status4": "#f3e8ff",
    "status5": "#fad1d7",
    "status6": "#f3e8ff",
    "status10": "#f3e8ff"
  }'
);

SELECT 
    ls.id AS langueStatutId,
    ls.valeur AS traduction,

    s.id AS statutId,
    s.nom AS statutNom,
    s.externalId as statutExternalId,

    l.id AS langueId,
    l.nom AS langueNom
FROM langueStatut ls
INNER JOIN statuts s ON ls.statutId = s.id
INNER JOIN langues l ON ls.langueId = l.id
WHERE l.nom = "Malagasy"
AND s.nom = "Nouveau";



ticket 1:reouverture 5

termine 45

ticket 2: reouverture 10

termine 150

anulation ticket 2
