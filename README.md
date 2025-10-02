# Zora Webshop

This project contains a React frontend powered by Vite and a Node.js/Express API that stores data in PostgreSQL.

## Project structure

```
zora/          React frontend (Vite)
server/        Express API
```

## Prerequisites

- Node.js 18+
- Docker (optional, for running PostgreSQL locally)

## Install dependencies

1. Install frontend dependencies:
   ```bash
   cd zora
   npm install
   ```
2. Install backend dependencies:
   ```bash
   cd ../server
   npm install
   ```

## Database setup

The API expects a PostgreSQL instance. The default credentials align with the values in `server/.env` (user/password/database all `zora`).

### Option 1: Docker (recommended)

```bash
cd server
docker compose up db
```

This starts PostgreSQL 16 on `localhost:5433` with a persistent volume.

### Option 2: Existing PostgreSQL

Point the server at your own database by updating `server/.env` (or the associated environment variables) with the correct host, port, user, password, and database name.

### Seed the schema and sample data

Once the database is running, initialise it:

```bash
cd server
npm run db:init
```

The script creates the `products` and `users` tables and upserts the sample catalog from `server/db.json`. The Express server performs the same check when it boots, so rerunning the script is safe whenever you edit `db.json`.

## Running locally

Open separate terminals (ensure the database is running first):

1. **API**
   ```bash
   cd server
   npm run dev
   ```
   The server listens on `http://localhost:5000` by default.

2. **Frontend**
   ```bash
   cd zora
   npm run dev
   ```
   Vite will prompt for a port (typically `5173`). If the API runs elsewhere, create `zora/.env` with `VITE_API_BASE_URL` pointing to the desired URL.

## API endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/data`
- `POST /api/users`
- `POST /api/login`

The sample product catalogue lives in `server/db.json`; edit it and rerun `npm run db:init` to refresh the database.
