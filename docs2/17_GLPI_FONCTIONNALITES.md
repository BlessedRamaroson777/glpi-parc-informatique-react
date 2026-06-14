# 🔍 GLPI — Fonctionnalités Clés et Workflow

GLPI (Gestionnaire Libre de Parc Informatique) a ses propres règles métier. Pour bien coder autour de son API, il faut comprendre ses concepts de base.

## 1. Le Cycle de vie d'un Ticket (Statuts)

C'est la base de l'ITIL. Dans votre projet, vous utilisez ces statuts (ID numériques de GLPI) :

*   **1 = Nouveau (New)** : Le ticket vient d'être créé par l'utilisateur. Aucun technicien ne s'en occupe encore.
*   **2 = En cours / Attribué (Processing / Assigned)** : Un technicien a été assigné au ticket.
*   **3 = En attente (Pending)** : On attend une réponse de l'utilisateur ou une pièce matérielle.
*   **4 = En cours / Planifié (Processing / Planned)** : Le technicien a prévu une date d'intervention.
*   **5 = Résolu (Solved)** : Le technicien pense que c'est fini. L'utilisateur doit valider.
*   **6 = Clos (Closed)** : Le ticket est définitivement terminé et archivé. L'utilisateur a validé ou un délai (ex: 7 jours) est passé.

**Différence entre Incident (1) et Demande (2) :**
*   **Type 1 (Incident)** : "Mon écran est noir" (Restauration d'un service interrompu).
*   **Type 2 (Demande / Request)** : "J'ai besoin d'un nouveau clavier" (Fourniture d'un nouveau service).

## 2. Les Acteurs d'un Ticket (Utilisateurs liés)

GLPI ne stocke pas le "propriétaire" du ticket dans une colonne `user_id`. Il utilise une table de liaison (`Ticket_User`) car une personne peut avoir différents rôles :

*   **Type 1 = Demandeur (Requester)** : Celui qui a le problème ou fait la demande.
*   **Type 2 = Technicien / Attribué à (Assignee)** : La personne (ou le groupe de techniciens) qui doit résoudre le ticket.
*   **Type 3 = Observateur (Observer)** : Une personne en copie (ex: le manager) qui est informée de l'avancement.

Dans votre application (ex: `CreateTicket.jsx`), lorsque vous créez un ticket, vous devez faire DEUX appels API :
1. POST `/Ticket` pour créer l'objet ticket.
2. POST `/Ticket_User` avec `type: 1` pour lier l'utilisateur connecté comme demandeur.

## 3. Les Entités (Entities) vs Lieux (Locations)

**Entité (Entity) : Le concept le plus important (et le plus piégeur) de GLPI.**
Une entité est une cloison étanche (un silo). C'est fait pour le multi-entreprise ou multi-filiale. 
* Exemple : Entité "France", Entité "Canada". 
* Un technicien assigné à "France" ne verra JAMAIS les tickets ou les PC de "Canada" (sauf profil spécial).
* **Dans le code :** Quand vous créez n'importe quoi (Ticket, PC), il a TOUJOURS une `entities_id` (souvent 0 qui est l'entité Racine).

**Lieu (Location) :**
C'est purement géographique et ça n'a **aucun impact sur la sécurité ou la visibilité**.
* Exemple : "Bureau 402", "Salle serveur", "Bâtiment A".

## 4. La gestion du Temps et des Coûts

GLPI utilise différentes notions de temps :
*   `actiontime` (Temps d'intervention) : Le temps que le technicien a réellement passé (en **secondes**). Pour l'afficher en heures : `actiontime / 3600`.
*   `duration` : Semblable à `actiontime` selon le contexte (ex: dans les coûts).

**Les 3 types de coûts (`TicketCost`) :**
1.  **Coût temps (`cost_time`)** : C'est un taux horaire (ex: 50€/h). Si `duration` est 7200 (2h), le coût réel est 100€.
2.  **Coût fixe (`cost_fixed`)** : Frais de déplacement (ex: 30€).
3.  **Coût matériel (`cost_material`)** : Remplacement d'une pièce (ex: 150€ pour l'écran).
*Le coût total se calcule en additionnant : Coût fixe + Coût matériel + (Coût temps * (durée en secondes / 3600)).*

## 5. Les "Followups" et "Tasks" (Suivis et Tâches)

Ce qui ressemble à des "commentaires" ou un "chat" dans un ticket est géré par deux concepts :

*   **ITILFollowup (Suivi)** : Un message ajouté au ticket ("J'ai redémarré le serveur, ça marche ?"). Peut être Privé (`is_private: true`) pour être caché au client.
*   **TicketTask (Tâche)** : Une action technique à faire par le technicien ("Acheter la pièce", "Débrancher le câble"). Possède un état (À faire, Fait), un temps d'exécution et un coût propre.

## 6. La liaison Polymorphique (`itemtype` et `items_id`)

Comment lier un PC, une Imprimante, ou un Écran à un Ticket ?
GLPI ne fait pas une colonne `computer_id`, `printer_id`... Il utilise le **polymorphisme**.

Dans l'API (`Item_Ticket`) :
*   `itemtype` : Le type d'objet (ex: la chaîne de caractères `"Computer"`, `"Monitor"`, `"Printer"`).
*   `items_id` : L'identifiant (nombre) de cet objet.

Si on veut dire "Ce ticket concerne le Moniteur numéro 42" :
```javascript
{
    tickets_id: 105,
    itemtype: "Monitor",
    items_id: 42
}
```
Ce même schéma est utilisé partout dans GLPI (ex: Lier un Document à n'importe quoi).
