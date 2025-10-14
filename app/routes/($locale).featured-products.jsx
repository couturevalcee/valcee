import {json} from '@shopify/remix-oxygen';
import invariant from 'tiny-invariant';

import {
  PRODUCT_CARD_FRAGMENT,
  FEATURED_COLLECTION_FRAGMENT,
} from '~/data/fragments';

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context: {storefront}}) {
  return json(await getFeaturedData(storefront));
}

/**
 * @param {LoaderFunctionArgs['context']['storefront']} storefront
 * @param {{pageBy?: number}} [variables={}]
 */
export async function getFeaturedData(storefront, variables = {}) {
  try {
    const data = await storefront.query(FEATURED_ITEMS_QUERY, {
      variables: {
        pageBy: 12,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
        ...variables,
      },
    });

    return data ?? {featuredCollections: {nodes: []}, featuredProducts: {nodes: []}};
  } catch (e) {
    console.error('Failed to load featured data', e);
    return getMockFeatured();
  }
}

const FEATURED_ITEMS_QUERY = `#graphql
  query FeaturedItems(
    $country: CountryCode
    $language: LanguageCode
    $pageBy: Int = 12
  ) @inContext(country: $country, language: $language) {
    featuredCollections: collections(first: 3, sortKey: UPDATED_AT) {
      nodes {
        ...FeaturedCollectionDetails
      }
    }
    featuredProducts: products(first: $pageBy) {
      nodes {
        ...ProductCard
      }
    }
  }

  ${PRODUCT_CARD_FRAGMENT}
  ${FEATURED_COLLECTION_FRAGMENT}
`;

function getMockFeatured() {
  return {
    featuredCollections: getMockCollections(3),
    featuredProducts: getMockProducts(8),
  };
}

function getMockProducts(count = 8) {
  const cats = ['occasional', 'active', 'casual', 'lounge'];
  const nodes = Array.from({length: count}).map((_, i) => {
    const cat = cats[i % cats.length];
    const handle = `${cat}-${i + 1}`;
    const title = `${toTitle(cat)} ${i + 1}`;
    return {
      id: `mock-prod-${handle}`,
      title,
      handle,
      vendor: 'Valcee Couture',
      publishedAt: new Date().toISOString(),
      variants: {
        nodes: [
          {
            id: `mock-variant-${handle}`,
            availableForSale: false,
            image: null,
            price: {amount: '0.00', currencyCode: 'USD'},
            compareAtPrice: null,
            selectedOptions: [],
            product: {handle, title},
          },
        ],
      },
      __placeholder: true,
    };
  });
  return {nodes};
}

function getMockCollections(count = 3) {
  const cats = ['occasional', 'active', 'casual', 'lounge'];
  const nodes = cats.slice(0, count).map((h) => ({
    id: `mock-col-${h}`,
    title: toTitle(h),
    handle: h,
    description: '',
    seo: {title: toTitle(h), description: ''},
    image: null,
  }));
  return {nodes};
}

function toTitle(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
