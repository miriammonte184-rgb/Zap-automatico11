# Workspace

## Overview

ZapAuto - Sistema automático de consulta de materiais e OPs via WhatsApp.
Conecta-se ao WhatsApp via QR code e responde automaticamente a consultas de materiais e ordens de produção (OPs) a partir de uma planilha Excel.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/zapauto)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **WhatsApp**: whatsapp-web.js
- **Spreadsheet**: xlsx
- **Charts**: Recharts

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (WhatsApp + Spreadsheet + Query routes)
│   │   └── src/lib/        # whatsapp.ts, spreadsheet.ts
│   └── zapauto/            # React + Vite frontend dashboard
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/     # queryHistory.ts table
```

## Features

1. **Dashboard** - Stats, charts (volume by day, type breakdown), WhatsApp status
2. **WhatsApp** - QR code connection, status display, disconnect
3. **Planilha** - Upload Excel (.xlsx), shows loaded file info
4. **Consulta Manual** - Manual OP or material code query
5. **Histórico** - Table of all WhatsApp and manual queries

## Spreadsheet Rules

- Sheet tab: `SD4`
- Columns used: B (material code), D (description), F (OP code), G (empenho qty), H (plan date), K (status/sector), N (current stock), O (purchase order qty), P (arrival date)
- Filtered OUT statuses in col K: COMERCIAL, EXPEDIÇÃO, FINALIZADA, QUALIDADE, LOGISTICA, #N/D
- Consumption order: sorted by plan date ascending, earliest OPs consume stock first

## API Endpoints

- `GET /api/whatsapp/status` - Connection status
- `GET /api/whatsapp/qrcode` - QR code as data URL
- `POST /api/whatsapp/connect` - Start WhatsApp
- `POST /api/whatsapp/disconnect` - Stop WhatsApp
- `POST /api/spreadsheet/upload` - Upload Excel file
- `GET /api/spreadsheet/status` - Spreadsheet info
- `GET /api/query/op/:opCode` - Query OP for missing materials
- `GET /api/query/material/:materialCode` - Query a material
- `GET /api/query/history` - Recent queries
- `GET /api/query/stats` - Aggregate stats
