# GLPI API V2 — Ressources complètes
> Base URL : `http://localhost:8081/api.php/v2.3`
> Auth : `Authorization: Bearer {access_token}`
> Total : **2454 endpoints** répartis en 21 catégories

---

## Headers communs

| Header | Description | Exemple |
|--------|-------------|---------|
| `Authorization` | Token OAuth2 | `Bearer eyJ...` |
| `Accept` | Format de réponse | `application/json` |
| `GLPI-Entity` | ID entité à utiliser | `0` |
| `GLPI-Entity-Recursive` | Inclure sous-entités | `true` |
| `Accept-Language` | Langue de la réponse | `fr_FR` |

## Paramètres de filtrage (query params)

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `filter` | Filtre RSQL | `?filter=name=="Mon ticket"` |
| `start` | Premier élément | `?start=0` |
| `limit` | Nb max résultats | `?limit=50` |
| `sort` | Tri | `?sort=date_creation:desc` |

---

## Reset / Nettoyage des données

Pour revenir à l'état de base sans réinstaller, supprimer dans cet ordre :

```
DELETE /Assistance/Ticket/{id}          → tickets
DELETE /Assistance/Change/{id}          → changements
DELETE /Assistance/Problem/{id}         → problèmes
DELETE /Assets/Computer/{id}            → ordinateurs
DELETE /Assets/Monitor/{id}             → moniteurs
DELETE /Assets/Printer/{id}             → imprimantes
DELETE /Assets/Phone/{id}               → téléphones
DELETE /Assets/NetworkEquipment/{id}    → équipements réseau
DELETE /Assets/Software/{id}            → logiciels
DELETE /Administration/User/{id}        → utilisateurs (garder id <= 5)
DELETE /Dropdowns/Location/{id}         → localisations
DELETE /Dropdowns/ITILCategory/{id}     → catégories tickets
DELETE /Management/Document/{id}        → documents
DELETE /Project/{id}                    → projets
```

> ⚠️ Ajouter `?force=true` pour suppression définitive (sans corbeille)

---

## 1. Session & Auth

```
GET    /session                          → Info session courante
GET    /authorize                        → Page autorisation OAuth2
POST   /authorize                        → Soumettre autorisation
POST   /token                            → Obtenir/renouveler token
GET    /Session/EntityTree               → Arbre des entités
GET    /status                           → Statut GLPI
GET    /status/all                       → Statut de tous les services
GET    /status/{service}                 → Statut d'un service
```

---

## 2. Administration (69 endpoints)

### Utilisateurs
```
GET    /Administration/User                              → Liste utilisateurs
POST   /Administration/User                             → Créer utilisateur
GET    /Administration/User/{id}                        → Détail utilisateur
PATCH  /Administration/User/{id}                        → Modifier utilisateur
DELETE /Administration/User/{id}                        → Supprimer utilisateur
GET    /Administration/User/username/{username}         → Par nom d'utilisateur
PATCH  /Administration/User/username/{username}         → Modifier par username
DELETE /Administration/User/username/{username}         → Supprimer par username
GET    /Administration/User/Me                          → Utilisateur courant
GET    /Administration/User/Me/Email                    → Emails courant
POST   /Administration/User/Me/Email                    → Ajouter email
GET    /Administration/User/Me/Email/{id}               → Email spécifique
GET    /Administration/User/Me/Emails/Default           → Email par défaut
GET    /Administration/User/Me/Picture                  → Photo profil
GET    /Administration/User/{id}/Picture                → Photo d'un user
GET    /Administration/User/Me/UsedItem                 → Items utilisés
GET    /Administration/User/{id}/UsedItem               → Items utilisés par user
GET    /Administration/User/Me/ManagedItem              → Items gérés
GET    /Administration/User/{id}/ManagedItem            → Items gérés par user
GET    /Administration/User/{id}/Preference             → Préférences user
PATCH  /Administration/User/{id}/Preference             → Modifier préférences
GET    /Administration/User/Me/Preference               → Mes préférences
PATCH  /Administration/User/Me/Preference               → Modifier mes préférences
GET    /Administration/User/{users_id}/Certificate      → Certificats user
POST   /Administration/User/{users_id}/Certificate      → Assigner certificat
GET    /Administration/User/{users_id}/Certificate/{id} → Certificat spécifique
PATCH  /Administration/User/{users_id}/Certificate/{id} → Modifier certificat
DELETE /Administration/User/{users_id}/Certificate/{id} → Supprimer certificat
```

### Groupes
```
GET    /Administration/Group                → Liste groupes
POST   /Administration/Group               → Créer groupe
GET    /Administration/Group/{id}          → Détail groupe
PATCH  /Administration/Group/{id}          → Modifier groupe
DELETE /Administration/Group/{id}          → Supprimer groupe
```

### Entités
```
GET    /Administration/Entity                           → Liste entités
POST   /Administration/Entity                          → Créer entité
GET    /Administration/Entity/{id}                     → Détail entité
PATCH  /Administration/Entity/{id}                     → Modifier entité
DELETE /Administration/Entity/{id}                     → Supprimer entité
GET    /Administration/Entity/{items_id}/KBArticle     → Articles KB liés
POST   /Administration/Entity/{items_id}/KBArticle     → Lier article KB
```

### Profils
```
GET    /Administration/Profile              → Liste profils
POST   /Administration/Profile             → Créer profil
GET    /Administration/Profile/{id}        → Détail profil
PATCH  /Administration/Profile/{id}        → Modifier profil
DELETE /Administration/Profile/{id}        → Supprimer profil
```

### Autres
```
GET    /Administration/EventLog            → Journal d'événements
GET    /Administration/EventLog/{id}       → Événement spécifique
GET    /Administration/UserCategory        → Catégories utilisateurs
POST   /Administration/UserCategory        → Créer catégorie
GET    /Administration/UserTitle           → Titres utilisateurs
POST   /Administration/UserTitle           → Créer titre
GET    /Administration/ApprovalSubstitute  → Substituts d'approbation
POST   /Administration/ApprovalSubstitute  → Créer substitut
```

---

## 3. Assistance / Helpdesk (155 endpoints) ⭐ IMPORTANT

### Tickets
```
GET    /Assistance/Ticket                                   → Liste tickets
POST   /Assistance/Ticket                                   → Créer ticket
GET    /Assistance/Ticket/{id}                              → Détail ticket
PATCH  /Assistance/Ticket/{id}                              → Modifier ticket
DELETE /Assistance/Ticket/{id}                              → Supprimer ticket
GET    /Assistance/Ticket/{id}/Timeline                     → Timeline complète
GET    /Assistance/Ticket/{id}/Timeline/Followup            → Suivis
POST   /Assistance/Ticket/{id}/Timeline/Followup            → Ajouter suivi
GET    /Assistance/Ticket/{id}/Timeline/Followup/{sid}      → Suivi spécifique
PATCH  /Assistance/Ticket/{id}/Timeline/Followup/{sid}      → Modifier suivi
DELETE /Assistance/Ticket/{id}/Timeline/Followup/{sid}      → Supprimer suivi
GET    /Assistance/Ticket/{id}/Timeline/Solution            → Solution
POST   /Assistance/Ticket/{id}/Timeline/Solution            → Ajouter solution
GET    /Assistance/Ticket/{id}/Timeline/Solution/{sid}      → Solution spécifique
PATCH  /Assistance/Ticket/{id}/Timeline/Solution/{sid}      → Modifier solution
DELETE /Assistance/Ticket/{id}/Timeline/Solution/{sid}      → Supprimer solution
GET    /Assistance/Ticket/{id}/Timeline/Task                → Tâches
POST   /Assistance/Ticket/{id}/Timeline/Task                → Ajouter tâche
GET    /Assistance/Ticket/{id}/Timeline/Task/{sid}          → Tâche spécifique
PATCH  /Assistance/Ticket/{id}/Timeline/Task/{sid}          → Modifier tâche
DELETE /Assistance/Ticket/{id}/Timeline/Task/{sid}          → Supprimer tâche
GET    /Assistance/Ticket/{id}/Timeline/Document            → Documents
POST   /Assistance/Ticket/{id}/Timeline/Document            → Ajouter document
GET    /Assistance/Ticket/{id}/Timeline/Validation          → Validations
POST   /Assistance/Ticket/{id}/Timeline/Validation          → Ajouter validation
GET    /Assistance/Ticket/{id}/Timeline/Validation/{sid}    → Validation spécifique
PATCH  /Assistance/Ticket/{id}/Timeline/Validation/{sid}    → Modifier validation
DELETE /Assistance/Ticket/{id}/Timeline/Validation/{sid}    → Supprimer validation
GET    /Assistance/Ticket/{id}/TeamMember                   → Membres équipe
POST   /Assistance/Ticket/{id}/TeamMember                   → Ajouter membre
DELETE /Assistance/Ticket/{id}/TeamMember                   → Retirer membre
GET    /Assistance/Ticket/{id}/TeamMember/{role}            → Membres par rôle
GET    /Assistance/Ticket/{id}/Cost                         → Coûts
POST   /Assistance/Ticket/{id}/Cost                         → Ajouter coût
GET    /Assistance/Ticket/{id}/Cost/{cost_id}               → Coût spécifique
PATCH  /Assistance/Ticket/{id}/Cost/{cost_id}               → Modifier coût
DELETE /Assistance/Ticket/{id}/Cost/{cost_id}               → Supprimer coût
GET    /Assistance/Ticket/{id}/PendingReason                → Raison en attente
GET    /Assistance/Ticket/{assistance_id}/KBArticle         → Articles KB liés
POST   /Assistance/Ticket/{assistance_id}/KBArticle         → Lier article KB
```

### Changements
```
GET    /Assistance/Change                                   → Liste changements
POST   /Assistance/Change                                   → Créer changement
GET    /Assistance/Change/{id}                              → Détail changement
PATCH  /Assistance/Change/{id}                              → Modifier changement
DELETE /Assistance/Change/{id}                              → Supprimer changement
GET    /Assistance/Change/{id}/Timeline                     → Timeline
GET    /Assistance/Change/{id}/Timeline/Followup            → Suivis
POST   /Assistance/Change/{id}/Timeline/Followup            → Ajouter suivi
GET    /Assistance/Change/{id}/Timeline/Solution            → Solution
POST   /Assistance/Change/{id}/Timeline/Solution            → Ajouter solution
GET    /Assistance/Change/{id}/Timeline/Task                → Tâches
POST   /Assistance/Change/{id}/Timeline/Task                → Ajouter tâche
GET    /Assistance/Change/{id}/TeamMember                   → Membres équipe
POST   /Assistance/Change/{id}/TeamMember                   → Ajouter membre
GET    /Assistance/Change/{id}/Cost                         → Coûts
POST   /Assistance/Change/{id}/Cost                         → Ajouter coût
```

### Problèmes
```
GET    /Assistance/Problem                                  → Liste problèmes
POST   /Assistance/Problem                                  → Créer problème
GET    /Assistance/Problem/{id}                             → Détail problème
PATCH  /Assistance/Problem/{id}                             → Modifier problème
DELETE /Assistance/Problem/{id}                             → Supprimer problème
GET    /Assistance/Problem/{id}/Timeline                    → Timeline
GET    /Assistance/Problem/{id}/Timeline/Followup           → Suivis
POST   /Assistance/Problem/{id}/Timeline/Followup           → Ajouter suivi
GET    /Assistance/Problem/{id}/Timeline/Solution           → Solution
POST   /Assistance/Problem/{id}/Timeline/Solution           → Ajouter solution
GET    /Assistance/Problem/{id}/TeamMember                  → Membres équipe
```

### Tickets/Changements récurrents
```
GET    /Assistance/RecurringTicket                          → Tickets récurrents
POST   /Assistance/RecurringTicket                         → Créer ticket récurrent
GET    /Assistance/RecurringTicket/{id}                    → Détail
PATCH  /Assistance/RecurringTicket/{id}                    → Modifier
DELETE /Assistance/RecurringTicket/{id}                    → Supprimer
GET    /Assistance/RecurringChange                         → Changements récurrents
POST   /Assistance/RecurringChange                         → Créer changement récurrent
```

### Statistiques
```
GET    /Assistance/Stat                                    → Vue d'ensemble stats
GET    /Assistance/Stat/Ticket/Global                      → Stats globales tickets
GET    /Assistance/Stat/Change/Global                      → Stats globales changements
GET    /Assistance/Stat/Problem/Global                     → Stats globales problèmes
GET    /Assistance/Stat/Ticket/Characteristics             → Caractéristiques tickets
GET    /Assistance/Stat/Ticket/Asset                       → Stats tickets par asset
GET    /Assistance/Stat/Ticket/Characteristics/Export      → Export stats
```

### Autres
```
GET    /Assistance/ExternalEvent                           → Événements externes
GET    /Assistance/PlanningReminder                        → Rappels planning
GET    /Assistance/PendingReason                           → Raisons en attente
```

---

## 4. Assets / Parc informatique (981 endpoints) ⭐ IMPORTANT

### Accès global
```
GET    /Assets/                          → Types d'assets disponibles
GET    /Assets/Global                    → Tous assets confondus
```

### Ordinateurs
```
GET    /Assets/Computer                  → Liste ordinateurs
POST   /Assets/Computer                  → Créer ordinateur
GET    /Assets/Computer/{id}             → Détail ordinateur
PATCH  /Assets/Computer/{id}             → Modifier ordinateur
DELETE /Assets/Computer/{id}             → Supprimer ordinateur
GET    /Assets/Computer/{id}/Infocom     → Infos financières
POST   /Assets/Computer/{id}/Infocom     → Créer infos financières
GET    /Assets/Computer/{id}/SoftwareInstallation   → Logiciels installés
GET    /Assets/Computer/{id}/Antivirus   → Antivirus
GET    /Assets/Computer/{id}/VirtualMachine         → VMs
GET    /Assets/Computer/{id}/OSInstallation         → OS installés
GET    /Assets/Computer/{id}/PeripheralConnection   → Périphériques connectés
GET    /Assets/Computer/{id}/RemoteManagement       → Gestion distante
```

### Autres assets (même structure CRUD)
```
GET/POST/PATCH/DELETE  /Assets/Monitor              → Moniteurs
GET/POST/PATCH/DELETE  /Assets/NetworkEquipment     → Équipements réseau
GET/POST/PATCH/DELETE  /Assets/Peripheral           → Périphériques
GET/POST/PATCH/DELETE  /Assets/Phone                → Téléphones
GET/POST/PATCH/DELETE  /Assets/Printer              → Imprimantes
GET/POST/PATCH/DELETE  /Assets/Software             → Logiciels
GET/POST/PATCH/DELETE  /Assets/SoftwareLicense      → Licences logiciels
GET/POST/PATCH/DELETE  /Assets/Certificate          → Certificats
GET/POST/PATCH/DELETE  /Assets/Appliance            → Applicatifs
GET/POST/PATCH/DELETE  /Assets/Rack                 → Baies
GET/POST/PATCH/DELETE  /Assets/Enclosure            → Boîtiers
GET/POST/PATCH/DELETE  /Assets/PDU                  → Unités de distribution
GET/POST/PATCH/DELETE  /Assets/Cable                → Câbles
GET/POST/PATCH/DELETE  /Assets/Socket               → Prises
GET/POST/PATCH/DELETE  /Assets/Cartridge            → Cartouches
GET/POST/PATCH/DELETE  /Assets/Consumable           → Consommables
GET/POST/PATCH/DELETE  /Assets/Unmanaged            → Assets non gérés
GET/POST/PATCH/DELETE  /Assets/PassiveDCEquipment   → Équipements passifs DC
```

### Versions logicielles
```
GET    /Assets/Software/{software_id}/Version       → Versions d'un logiciel
POST   /Assets/Software/{software_id}/Version       → Créer version
GET    /Assets/Software/{software_id}/Version/{id}  → Version spécifique
PATCH  /Assets/Software/{software_id}/Version/{id}  → Modifier version
DELETE /Assets/Software/{software_id}/Version/{id}  → Supprimer version
```

### Assets personnalisés
```
GET    /Assets/Custom/                              → Types d'assets custom
GET    /Assets/Custom/{itemtype}                    → Liste assets custom
POST   /Assets/Custom/{itemtype}                    → Créer asset custom
GET    /Assets/Custom/{itemtype}/{id}               → Détail asset custom
PATCH  /Assets/Custom/{itemtype}/{id}               → Modifier
DELETE /Assets/Custom/{itemtype}/{id}               → Supprimer
```

---

## 5. Components / Composants (127 endpoints)

```
GET    /Components                       → Types de composants disponibles
GET/POST/PATCH/DELETE  /Components/Battery          → Batteries
GET/POST/PATCH/DELETE  /Components/Camera           → Caméras
GET/POST/PATCH/DELETE  /Components/Case             → Boîtiers
GET/POST/PATCH/DELETE  /Components/Controller       → Contrôleurs
GET/POST/PATCH/DELETE  /Components/Drive            → Lecteurs
GET/POST/PATCH/DELETE  /Components/Firmware         → Firmwares
GET/POST/PATCH/DELETE  /Components/GenericDevice    → Appareils génériques
GET/POST/PATCH/DELETE  /Components/GraphicCard      → Cartes graphiques
GET/POST/PATCH/DELETE  /Components/HardDrive        → Disques durs
GET/POST/PATCH/DELETE  /Components/Memory           → Mémoires RAM
GET/POST/PATCH/DELETE  /Components/NetworkCard      → Cartes réseau
GET/POST/PATCH/DELETE  /Components/PCIDevice        → Appareils PCI
GET/POST/PATCH/DELETE  /Components/PowerSupply      → Alimentations
GET/POST/PATCH/DELETE  /Components/Processor        → Processeurs
GET/POST/PATCH/DELETE  /Components/Sensor           → Capteurs
GET/POST/PATCH/DELETE  /Components/SIMCard          → Cartes SIM
GET/POST/PATCH/DELETE  /Components/SoundCard        → Cartes son
GET/POST/PATCH/DELETE  /Components/Systemboard      → Cartes mères

GET    /Components/{type}/{id}/Items    → Items associés à un composant
GET    /Components/{type}/Items/{id}    → Composant par item ID
```

---

## 6. Dropdowns / Référentiels (371 endpoints)

> Tous suivent le pattern : `GET/POST /Dropdowns/{type}` et `GET/PATCH/DELETE /Dropdowns/{type}/{id}`

```
Location              → Localisations
State                 → États
Manufacturer          → Fabricants
Calendar              → Calendriers
ITILCategory          → Catégories ITIL (tickets)
TaskCategory          → Catégories de tâches
RequestType           → Types de demandes
SolutionType          → Types de solutions
DocumentCategory      → Catégories de documents
DocumentType          → Types de documents
VirtualMachineType    → Types de VMs
VirtualMachineState   → États de VMs
CableType             → Types de câbles
ComputerModel         → Modèles d'ordinateurs
ComputerType          → Types d'ordinateurs
MonitorModel          → Modèles de moniteurs
NetworkEquipmentModel → Modèles équipements réseau
PhoneModel            → Modèles de téléphones
PrinterModel          → Modèles d'imprimantes
BudgetType            → Types de budget
CertificateType       → Types de certificats
ContractType          → Types de contrats
ContactType           → Types de contacts
SupplierType          → Types de fournisseurs
ProjectType           → Types de projets
ProjectTaskType       → Types de tâches projet
LicenseType           → Types de licences
Network               → Réseaux
WifiNetwork           → Réseaux WiFi
BusinessCriticity     → Criticité métier
ApplianceType         → Types d'applicatifs
ApplianceEnvironment  → Environnements d'applicatifs
FollowupTemplate      → Modèles de suivis
TaskTemplate          → Modèles de tâches
SolutionTemplate      → Modèles de solutions
ValidationTemplate    → Modèles de validations
ApprovalStep          → Étapes d'approbation
HardDriveType         → Types de disques
Filesystem            → Systèmes de fichiers
Stencil               → Stencils
Plug                  → Prises électriques
PhonePowerSupply      → Alimentations téléphone
```

---

## 7. Management / Gestion (117 endpoints)

```
GET/POST/PATCH/DELETE  /Management/Budget            → Budgets
GET/POST/PATCH/DELETE  /Management/Cluster           → Clusters
GET/POST/PATCH/DELETE  /Management/Contact           → Contacts
GET/POST/PATCH/DELETE  /Management/Contract          → Contrats
GET/POST/PATCH/DELETE  /Management/Database          → Bases de données
GET/POST/PATCH/DELETE  /Management/DataCenter        → Centres de données
GET/POST/PATCH/DELETE  /Management/Document          → Documents
GET/POST/PATCH/DELETE  /Management/Domain            → Domaines
GET/POST/PATCH/DELETE  /Management/License           → Licences
GET/POST/PATCH/DELETE  /Management/Line              → Lignes
GET/POST/PATCH/DELETE  /Management/Supplier          → Fournisseurs
GET/POST/PATCH/DELETE  /Management/DatabaseInstance  → Instances de BDD
GET/POST/PATCH/DELETE  /Management/DomainRecord      → Enregistrements DNS

GET    /Management/Document/{id}/Download            → Télécharger document
GET    /Management/Contract/{id}/Cost                → Coûts contrat
POST   /Management/Contract/{id}/Cost                → Ajouter coût
```

---

## 8. Knowledgebase / Base de connaissance (19 endpoints)

```
GET    /Knowledgebase/Article                           → Liste articles
POST   /Knowledgebase/Article                          → Créer article
GET    /Knowledgebase/Article/{article_id}             → Détail article
PATCH  /Knowledgebase/Article/{article_id}             → Modifier article
DELETE /Knowledgebase/Article/{article_id}             → Supprimer article
GET    /Knowledgebase/Category                         → Catégories
POST   /Knowledgebase/Category                         → Créer catégorie
GET    /Knowledgebase/Article/{article_id}/Comment     → Commentaires
POST   /Knowledgebase/Article/{article_id}/Comment     → Ajouter commentaire
GET    /Knowledgebase/Article/{article_id}/Revision    → Révisions
GET    /Knowledgebase/Article/{article_id}/Revision/{revision}  → Révision spécifique
```

---

## 9. Project / Projets (42 endpoints)

```
GET    /Project/                         → Liste projets
POST   /Project/                         → Créer projet
GET    /Project/{id}                     → Détail projet
PATCH  /Project/{id}                     → Modifier projet
DELETE /Project/{id}                     → Supprimer projet
GET    /Project/Task                     → Toutes les tâches
POST   /Project/Task                     → Créer tâche
GET    /Project/Task/{id}               → Détail tâche
PATCH  /Project/Task/{id}               → Modifier tâche
DELETE /Project/Task/{id}               → Supprimer tâche
GET    /Project/{project_id}/Task        → Tâches d'un projet
POST   /Project/{project_id}/Task        → Ajouter tâche à projet
GET    /Project/{project_id}/Ticket      → Tickets liés
POST   /Project/{project_id}/Ticket      → Lier ticket
GET    /Project/{project_id}/Change      → Changements liés
GET    /Project/{project_id}/Problem     → Problèmes liés
GET    /Project/{project_id}/TeamMember  → Membres équipe
POST   /Project/{project_id}/TeamMember  → Ajouter membre
GET    /Project/Project/{id}/Cost        → Coûts
POST   /Project/Project/{id}/Cost        → Ajouter coût
```

---

## 10. Inventory / Inventaire (17 endpoints)

```
GET    /Inventory/Agent                              → Agents d'inventaire
GET    /Inventory/Agent/{id}                        → Détail agent
PATCH  /Inventory/Agent/{id}                        → Modifier agent
DELETE /Inventory/Agent/{id}                        → Supprimer agent
POST   /Inventory/Agent/{id}/InventoryRequest       → Demander inventaire
POST   /Inventory/Agent/{id}/StatusRequest          → Demander statut
GET    /Inventory/Agent/{id}/InventoryFile          → Fichier d'inventaire
GET    /Inventory/LockedField                       → Champs verrouillés
POST   /Inventory/LockedField                       → Verrouiller champ
GET    /Inventory/SNMPCredential                    → Credentials SNMP
POST   /Inventory/SNMPCredential                    → Créer credential SNMP
```

---

## 11. Setup / Configuration (98 endpoints)

```
GET    /Setup/LDAPDirectory              → Annuaires LDAP
POST   /Setup/LDAPDirectory             → Créer annuaire LDAP
GET    /Setup/SLA                        → SLA
POST   /Setup/SLA                        → Créer SLA
GET    /Setup/OLA                        → OLA
POST   /Setup/OLA                        → Créer OLA
GET    /Setup/EmailCollector             → Collecteurs d'emails
POST   /Setup/EmailCollector            → Créer collecteur
GET    /Setup/Webhook                    → Webhooks
POST   /Setup/Webhook                   → Créer webhook
GET    /Setup/OAuthClient               → Clients OAuth
POST   /Setup/OAuthClient               → Créer client OAuth
GET    /Setup/Plugin                     → Plugins
POST   /Setup/Plugin/{id}/Enable        → Activer plugin
POST   /Setup/Plugin/{id}/Disable       → Désactiver plugin
POST   /Setup/Plugin/{id}/Install       → Installer plugin
POST   /Setup/Plugin/{id}/Uninstall     → Désinstaller plugin
GET    /Setup/Config                     → Configuration générale
GET    /Setup/Config/{context}          → Config par contexte
GET    /Setup/Config/{context}/{name}   → Config spécifique
PATCH  /Setup/Config/{context}/{name}   → Modifier config
GET    /Setup/AutomaticAction/{id}      → Action automatique
GET    /Setup/AutomaticAction/{id}/Log  → Logs action auto
```

---

## 12. Notifications (27 endpoints)

```
GET    /Notifications/Notification                              → Notifications
POST   /Notifications/Notification                             → Créer notification
GET    /Notifications/Notification/{id}                        → Détail
PATCH  /Notifications/Notification/{id}                        → Modifier
DELETE /Notifications/Notification/{id}                        → Supprimer
GET    /Notifications/Notification/{id}/Recipient              → Destinataires
POST   /Notifications/Notification/{id}/Recipient              → Ajouter destinataire
GET    /Notifications/NotificationTemplate                     → Templates
POST   /Notifications/NotificationTemplate                     → Créer template
GET    /Notifications/NotificationTemplate/{id}/Translation    → Traductions
POST   /Notifications/NotificationTemplate/{id}/Translation    → Ajouter traduction
GET    /Notifications/QueuedNotification                       → File d'attente
POST   /Notifications/QueuedNotification/{id}/SendRequest      → Envoyer notif
```

---

## 13. Rules / Règles (210 endpoints)

```
GET    /Rule/Collection                  → Collections de règles disponibles

# Pour chaque collection (Ticket, Change, Problem, Asset, Location, etc.) :
GET    /Rule/Collection/{type}/Rule                     → Règles
POST   /Rule/Collection/{type}/Rule                    → Créer règle
GET    /Rule/Collection/{type}/Rule/{id}               → Détail règle
PATCH  /Rule/Collection/{type}/Rule/{id}               → Modifier règle
DELETE /Rule/Collection/{type}/Rule/{id}               → Supprimer règle
GET    /Rule/Collection/{type}/Rule/{id}/Criteria      → Critères
POST   /Rule/Collection/{type}/Rule/{id}/Criteria      → Ajouter critère
GET    /Rule/Collection/{type}/Rule/{id}/Action        → Actions
POST   /Rule/Collection/{type}/Rule/{id}/Action        → Ajouter action

# Types disponibles :
# Ticket, Change, Problem, Asset, Location, Right
# MailCollector, SoftwareCategory, ImportAsset, ImportEntity, DefineItemtype
```

---

## 14. Notes (150 endpoints)

> Pattern : `GET/POST /{itemtype}/{items_id}/Note` et `GET/PATCH/DELETE /{itemtype}/{items_id}/Note/{id}`

```
# Disponible sur tous ces types :
Computer, Monitor, Phone, Printer, NetworkEquipment, Peripheral
Software, SoftwareLicense, Certificate, Appliance, Rack, Enclosure
Budget, Contact, Contract, Supplier, Domain, DomainRecord
Database, DatabaseInstance, Cluster, Project, ProjectTask
Entity, Group, Line, Change, Problem, DCRoom
```

---

## 15. Tools / Outils (11 endpoints)

```
GET    /Tools/                           → Outils disponibles
GET    /Tools/Reminder                   → Rappels
POST   /Tools/Reminder                  → Créer rappel
GET    /Tools/Reminder/{id}             → Détail rappel
PATCH  /Tools/Reminder/{id}             → Modifier rappel
DELETE /Tools/Reminder/{id}             → Supprimer rappel
GET    /Tools/RSSFeed                    → Flux RSS
POST   /Tools/RSSFeed                   → Créer flux RSS
GET    /Tools/RSSFeed/{id}              → Détail flux
PATCH  /Tools/RSSFeed/{id}              → Modifier flux
DELETE /Tools/RSSFeed/{id}              → Supprimer flux
```

---

## 16. GraphQL (2 endpoints)

```
POST   /GraphQL/                         → Requête GraphQL
GET    /GraphQL/Schema                   → Schéma GraphQL
```

---

## 17. Autres (10 endpoints)

```
GET    /                                 → Info API & versions
GET    /doc                              → Documentation HTML
GET    /doc.json                         → Documentation JSON (swagger)
GET    /getting-started                  → Guide démarrage
POST   /Transfer                         → Transférer un item entre entités
GET    /locales                          → Langues disponibles
```

---

## Exemples pratiques

### Créer un ticket
```json
POST /Assistance/Ticket
{
  "name": "Mon problème",
  "content": "Description détaillée",
  "type": 1,
  "urgency": 3,
  "priority": 3,
  "status": 1
}
```

### Valeurs urgency/priority/status
| Valeur | Urgence/Priorité | Status |
|--------|-----------------|--------|
| 1 | Très basse | Nouveau |
| 2 | Basse | En cours |
| 3 | Moyenne | En attente |
| 4 | Haute | Résolu |
| 5 | Très haute | Fermé |
| 6 | Majeure | — |

### type ticket
| Valeur | Type |
|--------|------|
| 1 | Incident |
| 2 | Demande |

### Créer un ordinateur
```json
POST /Assets/Computer
{
  "name": "PC-001",
  "serial": "SN123456",
  "entities_id": 0,
  "states_id": 1
}
```

### Filtrer les tickets ouverts
```
GET /Assistance/Ticket?filter=status==1&sort=date_creation:desc&limit=20
```
