Site Action Log

All changes, features, fixes, and actions performed on the Valcee Couture storefront are recorded here.

Format:
- Date (UTC) - Actor - Description

Log:
- 2025-10-16T00:00:00Z - Automated: Initialized log
- 2025-10-16T19:33:00Z - Developer: Added server-side checkout proxy at `app/routes/api/checkout/create.jsx` to create carts and return `checkoutUrl` using server-side Storefront API (keeps private tokens server-side).
- 2025-10-16T19:33:00Z - Developer: Added client-side integration in `app/components/Cart.jsx` to call `/api/checkout/create` when `cart.checkoutUrl` is not present and redirect the user to the returned URL.
- 2025-10-16T19:34:00Z - Developer: Removed editorial "i" icon from top header and replaced with Cart; removed duplicate cart from bottom bar.
- 2025-10-16T19:34:00Z - Developer: Updated BottomBar Help (?) button style to match top header icons (removed circular border/background).
- 2025-10-17T18:50:00Z - Developer: Fixed checkout API route by using Hydrogen's `context.cart.create()` instead of direct GraphQL `cartCreate` mutation. Route successfully creates cart and returns checkout URL.
- 2025-10-17T18:50:00Z - Developer: Tested checkout API endpoint - successfully creating cart with product variant `gid://shopify/ProductVariant/47367932543190` and returning checkout URL.
- 2025-10-17T18:52:00Z - Developer: Disabled demo checkout domain (`PUBLIC_CHECKOUT_DOMAIN`) in `.env` to prevent 401 errors from checkout.hydrogen.shop calls.
- 2025-10-18T22:00:00Z - AI Assistant: Conducted comprehensive site-wide audit and exploration covering architecture, purpose, APIs, integrations, design systems, brand identity, strategic positioning, gaps analysis, and recommendations for Valcee Couture e-commerce platform.
