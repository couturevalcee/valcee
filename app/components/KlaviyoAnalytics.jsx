import {useAnalytics} from '@shopify/hydrogen';
import {useEffect} from 'react';

function klaviyoTrack(event, properties) {
  if (typeof window === 'undefined' || !window._learnq) return;
  window._learnq.push(['track', event, properties]);
}

/**
 * Bridges Hydrogen Analytics events to Klaviyo.
 * Renders nothing — just subscribes to analytics events.
 * @param {{ publicApiKey: string; customerEmail?: string; customerFirstName?: string }}
 */
export function KlaviyoAnalytics({publicApiKey, customerEmail, customerFirstName}) {
  // Inject Klaviyo's onsite JS SDK
  useEffect(() => {
    if (!publicApiKey || typeof window === 'undefined') return;
    if (document.querySelector(`script[src*="klaviyo.js"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${publicApiKey}`;
    document.head.appendChild(script);
  }, [publicApiKey]);

  // Identify logged-in customer
  useEffect(() => {
    if (!customerEmail || typeof window === 'undefined') return;
    window._learnq = window._learnq || [];
    window._learnq.push([
      'identify',
      {
        $email: customerEmail,
        ...(customerFirstName && {$first_name: customerFirstName}),
      },
    ]);
  }, [customerEmail, customerFirstName]);

  // Subscribe to Hydrogen analytics events
  const {subscribe, register} = useAnalytics();
  const {ready} = register('KlaviyoAnalytics');

  useEffect(() => {
    subscribe('product_viewed', ({products}) => {
      const p = products?.[0];
      if (!p) return;
      klaviyoTrack('Viewed Product', {
        ProductName: p.title,
        ProductID: p.id,
        ImageURL: p.featuredImage?.url,
        URL: window.location.href,
        Price: p.selectedVariant?.price?.amount,
      });
    });

    subscribe('product_added_to_cart', ({cart, currentLine}) => {
      klaviyoTrack('Added to Cart', {
        $value: parseFloat(cart?.cost?.totalAmount?.amount || 0),
        AddedItemProductName: currentLine?.merchandise?.product?.title,
        AddedItemImageURL: currentLine?.merchandise?.image?.url,
        ItemCount: cart?.totalQuantity,
      });
    });

    ready();
  }, [subscribe, register, ready]);

  return null;
}
