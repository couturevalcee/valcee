# Architecture Overview

This document summarizes the Valcee Couture storefront architecture (high level) used for developer onboarding and operations.

## Overview
- Framework: Shopify Hydrogen (Remix) — server-side rendering, route-based code splitting.
- Local dev: MiniOxygen (Vite) for previewing; server entry is `server.js`.
- API: Shopify Storefront GraphQL for product/collection data; Customer Account API for auth and orders.
- Cart/Checkout: server-side cart proxy at `app/routes/().api.checkout.create.jsx` using Hydrogen's cart handler.

## Key Layers
- app/routes — Remix route handlers and API endpoints.
- app/components — UI components (PDP, PLP, Cart, Drawers, Layouts).
- app/lib — server helpers (seo.server.js, session.server.js, cache helpers).
- app/data — GraphQL fragments and generated types.
- public — static assets and images.

## Data Flow
1. Browser requests a route → Hydrogen Remix loader runs server GraphQL queries.  
2. Storefront data flows from Shopify Storefront API into loaders and components via fragments.  
3. Cart creation is proxied by server API route which returns a Shopify checkout URL.  
4. Sessions and user authentication are handled via Hydrogen session helpers and the Customer Account API.

## Notes & Gotchas
- Product option field change: `product.options.values` deprecated — use `product.options.optionValues` and update VariantSelector accordingly.
- createWithCache now requires `request` when initialized (Hydrogen upgrade guidance).
- Routes are locale-scoped (foldered by `($locale)`), tests and scripts should account for locale in paths.

## Useful files
- `app/routes/().api.checkout.create.jsx` — cart/create proxy
- `app/data/fragments.js` — GraphQL fragments used across the app
- `storefrontapi.generated.d.ts` — generated types
- `playwright.config.js` — E2E test configuration

