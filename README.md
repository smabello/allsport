# AllSport

AllSport provides live sports scores, AI-generated match outcome estimates, and current sports headlines. It is not a betting or sportsbook app.

## Features

- ESPN scoreboards for the NBA, NFL, MLB, and selected soccer leagues, refreshed every 30 seconds.
- AI predictions for up to eight live or scheduled games, refreshed every five minutes. The model receives only the matchup, game status, current score, start time, and available season records.
- ESPN sports headlines, refreshed every two minutes. “Trending sports” is based on how often each sport appears in the current headline feed, not audience views or a popularity metric.
- An affiliate-promotions page with a clear disclosure. Offers remain unpublished until partner links and terms are confirmed.
- Editorial tools for staff to manage news stories.

AI estimates are not guarantees. They use limited scoreboard data and do not include injury reports or other live context.
Partner links may earn AllSport a commission and do not affect match analysis or news coverage.

## Run locally

Requirements: Node.js and npm.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and add an OpenAI API key, or complete Azure OpenAI credentials. The key stays on the server and must not be committed.
3. In one terminal, start the AI API server with `npm run dev:server`.
4. In another terminal, start the web app with `npm run dev`.
5. Open `http://localhost:4178`.

Without a configured AI provider, live scores and headlines still work, but the app reports that AI predictions are unavailable instead of substituting a non-AI estimate.

## Build and lint

- `npm run build`
- `npm run lint`
