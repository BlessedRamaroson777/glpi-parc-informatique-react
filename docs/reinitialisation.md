# Reinitialisation (GLPI)

## Objectif
- Charger les entites via GET.
- Supprimer chaque id via DELETE avec `?force=true`.
- Respecter l'ordre des groupes pour eviter les erreurs de cles etrangeres.

## Ordre conseille
1. Dependances (tickets, changements, problemes, contrats, documents)
2. Parc (assets)
3. Gestion (fournisseurs, contacts, budgets, projets)
4. Administration (users, groupes, entites)

## Exemple simple (flow)
1. GET /api.php/v2/Assistance/Ticket
2. DELETE /api.php/v2/Assistance/Ticket/{id}?force=true

## Selection rapide
- "Tout selectionner" coche toutes les entites visibles.
- Tu peux decocher des elements avant de lancer.

## Mode test (dry run)
- Dans la page React, `DRY_RUN = true`.
- Tant que c'est `true`, seules les requetes sont loggees.
- Passe a `false` pour activer la suppression reelle.

## Configuration
- Les tokens OAuth changent souvent: ils ne doivent pas etre dans `.env.local`.
- `.env.local` sert aux valeurs fixes (client id/secret, base URL).
- Les access/refresh tokens sont stockes au runtime.

## Endpoints utilises
- Base: /api.php/v2
- DELETE force: ajouter `?force=true`
