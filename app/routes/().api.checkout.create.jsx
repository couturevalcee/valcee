import {json} from '@shopify/remix-oxygen';

// Server-side proxy to create a cart (and get a checkout url) using the
// server-side storefront client available on the Remix context. This keeps
// PRIVATE tokens on the server and returns only the checkout URL to the client.

export async function action({request, context}) {
  try {
    const body = await request.json();
    const rawLines = Array.isArray(body.lines) ? body.lines : [];

    // Basic validations
    if (!rawLines.length) {
      return json({error: 'No lines provided'}, {status: 400});
    }

    if (rawLines.length > 20) {
      return json({error: 'Too many lines (max 20)'}, {status: 400});
    }

    const lines = rawLines
      .map((l) => {
        const quantity = Number(l.quantity) || 1;
        // Clamp quantity to a reasonable range
        const q = Math.max(1, Math.min(100, quantity));
        let merchandiseId = l.merchandiseId || l.merchandise || l.variantId || null;
        if (!merchandiseId) return null;
        // Accept numeric IDs and convert to gid format if needed
        if (/^\d+$/.test(String(merchandiseId))) {
          merchandiseId = `gid://shopify/ProductVariant/${merchandiseId}`;
        }
        return {merchandiseId, quantity: q};
      })
      .filter(Boolean);

    if (!lines.length) {
      return json({error: 'No valid lines provided'}, {status: 400});
    }

    // Log intent (server-side)
    console.info('[checkout:create] creating cart with lines:', JSON.stringify(lines));

    // Use Hydrogen's cart helper instead of direct GraphQL
    const result = await context.cart.create({
      lines,
    });

    if (result.errors?.length) {
      console.warn('[checkout:create] cart errors', result.errors);
      return json({errors: result.errors}, {status: 400});
    }

    const checkoutUrl = result.cart?.checkoutUrl;
    if (!checkoutUrl) {
      console.error('[checkout:create] no checkoutUrl in response', data);
      return json({error: 'No checkout URL returned from Shopify'}, {status: 500});
    }

    console.info('[checkout:create] checkoutUrl created', checkoutUrl);
    return json({url: checkoutUrl});
  } catch (error) {
    console.error('Error in /api/checkout/create action', error);
    return json({error: error.message || String(error)}, {status: 500});
  }
}

export async function loader() {
  return json({ok: true});
}
