# Zora Webshop

This project contains a React frontend powered by Vite and a Node.js/Express API that serves catalog data.

## Project structure

```
zora/          React frontend (Vite)
server/        Express API
```

## Prerequisites

- Node.js 18+

## Setup

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

## Running locally

Open **two** terminals:

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
   Vite will prompt for a port (typically `5173`).

The frontend automatically reads from the API at `http://localhost:5000`. To point it at another host, create `zora/.env` and set `VITE_API_BASE_URL`.

## API endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/data`

Product data is stored in `server/db.json` and can be edited directly for quick prototyping.
