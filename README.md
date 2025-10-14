# Valcee Couture — Hydrogen Storefront

This is the Valcee Couture headless storefront built with Shopify Hydrogen (Remix) and Tailwind.

- Tech: Hydrogen v2 (Remix), Tailwind CSS, Headless UI
- Features: Branded header/footer, mobile-first home with snap, collections grid, product list/gallery, region selector, graceful fallbacks when Shopify data is unavailable

## Requirements

- Node.js 18+
- A Shopify store and Storefront API token

## Quick start

1. Install deps

```bash
npm install
```

2. Create `.env` with your shop details (do NOT commit this file):

```properties
SESSION_SECRET="something-random"
PUBLIC_STORE_DOMAIN=<your-store>.myshopify.com
PUBLIC_STOREFRONT_API_TOKEN=<storefront-api-token>
PUBLIC_CHECKOUT_DOMAIN=checkout.hydrogen.shop
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID=<optional-if-using-account-api>
SHOP_ID=<optional-if-using-account-api>
```

3. Dev server

```bash
npm run dev
```

4. Build

```bash
npm run build
```

## Environment notes

- Ensure products/collections are published to the same Custom Storefront app that issued your Storefront API token.
- Collection handles used on the homepage: `occasional`, `active`, `casual`, `lounge`.
- The app includes mock fallbacks so local dev still renders if Shopify is unreachable.

## Deploy

### Oxygen (recommended)

1. Push this repo to GitHub (see below).
2. In Shopify, open Hydrogen/Oxygen hosting and connect the repo.
3. Add the environment variables in Oxygen:
   - PUBLIC_STORE_DOMAIN
   - PUBLIC_STOREFRONT_API_TOKEN
   - SESSION_SECRET
   - PUBLIC_CHECKOUT_DOMAIN
   - (optional) PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID, SHOP_ID
4. Deploy. Oxygen will build and host your app.

### Vercel/Netlify (alternative)

1. Connect the GitHub repo in your platform.
2. Set the same environment variables.
3. Use the default build command (`npm run build`) and output handled by Hydrogen adapter.

## Git/GitHub

- This repo already includes `.gitignore` and `README.md`. When creating the GitHub repo, do not auto-add a README or .gitignore to avoid merge issues.
- Initialize and push:

```bash
git init
git add .
git commit -m "chore: initial import"
git branch -M main
git remote add origin <git@github.com:owner/repo.git>
git push -u origin main
```

- Optional workflow: develop branch + PRs to main to get deploy previews.

## Accounts (optional)

If using the Customer Account API locally, expose your dev server via ngrok and whitelist the URLs in the app settings (see Hydrogen docs).

## License

Copyright © Valcee Couture. All rights reserved.
