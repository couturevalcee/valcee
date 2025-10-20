# Contributing

Thank you for contributing to the Valcee Couture storefront.

## Local setup
1. Clone the repo
2. Copy `.env.example` to `.env` and fill required Shopify keys.
3. Install deps: `npm install`
4. Start dev server: `npm run dev`

## Tests
- Playwright E2E tests are in `tests/`. Run with:
  - `npx playwright test`
  - Playwright will attempt to run `npm run preview` or reuse an existing server.

## Code standards
- Use Prettier and ESLint; run `npm run lint` before committing.
- Branches: feature/* for features, fix/* for bug fixes.

## Pull requests
- Run tests locally, include screenshots for UI changes, and add a descriptive PR summary.

