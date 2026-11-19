# Ripe

*Watch what's next in food.*

Follow new foods and supplement ingredients from lab to shop shelf.

Ripe shows where products like **Solein** (Solar Foods' gas-fermented protein) and **NMN** (a supplement ingredient) are in the approval process in each market, and notifies you when something changes.

## Features

- Product timelines per market: application → safety opinion → authorisation → products in shops
- Follow products and get push notifications when their status changes
- Every status shows its official source and the date it was last checked
- Daily AI-assisted update job that finds news and proposes updates
- Admin review web page: approve or reject proposed updates and product suggestions

## Tech

Expo (React Native) · TypeScript · Node.js + Express · PostgreSQL + Prisma · Anthropic API (Claude with web search) · Expo Notifications

## Getting started

```bash
# 1. Database (PostgreSQL running locally or in the cloud)
cp server/.env.example server/.env   # fill in DATABASE_URL and ANTHROPIC_API_KEY

# 2. Server
cd server
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# 3. Mobile app
cd ../apps/mobile
npm install
npx expo start
```

## Documentation

- [Project plan](docs/PROJECT_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [AI update pipeline](docs/AI_UPDATE_PIPELINE.md)
- [Content guidelines](docs/CONTENT_GUIDELINES.md)
- [Company portal (planned)](docs/COMPANY_PORTAL.md)

## Disclaimer

Ripe shows regulatory status information with links to sources. It does not give medical, nutritional or dosing advice.
