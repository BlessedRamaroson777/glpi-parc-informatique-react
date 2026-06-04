# Backend Node + SQLite (example)

## Structure
- backend/server.js: Express server
- backend/db.js: SQLite init
- backend/package.json: deps + script

## Data model
- Table: `items`
- Columns: `id`, `name`

## Usage
1. `cd backend`
2. `npm install`
3. `npm run dev`

## Notes
- This is a demo backend only.
- It uses SQLite file `data.sqlite` at backend root.
- You can connect React to `http://localhost:5050/api/items`.
