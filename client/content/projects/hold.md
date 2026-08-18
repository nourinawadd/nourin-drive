---
type: website
name: HOLD
date: 2026-07
url: https://hold.nourin.me
repo: https://github.com/nourinawadd/hold
stack: .NET 10 · Blazor Server · EF Core · PostgreSQL · AngleSharp · Docker
cv: true
---
A wishlist that makes you wait: save an item, set how long you will hold it, and watch the countdown instead of the thing.

- Built a wishlist app in .NET 10 and Blazor Server where every saved item carries a user-set waiting period, from a day to a year, and only surfaces as ready once it elapses.
- Wrote a multi-strategy product scraper with AngleSharp that pulls title, brand, image and price from a pasted link through JSON-LD, microdata, OpenGraph and Shopify parsers, falling back to an LLM extractor when a page exposes no structured data.
- Moved from a MERN split to a server-rendered model with no API layer, where components call injected services directly over the Blazor circuit instead of fetching REST endpoints.
- Modelled lists, items, categories and settings in EF Core against PostgreSQL with migrations, UTC-normalised timestamps, and per-currency budget totals for each list.
- Added read-only share links that render a list to visitors with no account, alongside Google OAuth for owners, and link-free entries whose self-entered prices stay flagged as estimates.
- Containerised with Docker Compose behind a health check, covered by an xUnit suite over the parsers, price normaliser and ready-state logic, run on GitHub Actions.
