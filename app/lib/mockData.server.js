// Dev-only mock data helpers for when Storefront API is unavailable.

const CATEGORIES = ['occasional', 'active', 'casual', 'lounge'];

function makeProductNode(base, index) {
  const handle = `${base}-${index + 1}`;
  const title = `${toTitle(base)} ${index + 1}`;
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
}

function makeCollectionNode(base) {
  const handle = base;
  const title = toTitle(base);
  return {
    id: `mock-col-${handle}`,
    title,
    handle,
    description: '',
    seo: {title, description: ''},
    image: null,
  };
}

function toTitle(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getMockProducts(count = 12) {
  const nodes = Array.from({length: count}).map((_, i) =>
    makeProductNode(CATEGORIES[i % CATEGORIES.length], i),
  );
  return {
    nodes,
    pageInfo: {
      hasPreviousPage: false,
      hasNextPage: false,
      startCursor: null,
      endCursor: null,
    },
  };
}

export function getMockCollections(count = 4) {
  const nodes = CATEGORIES.slice(0, count).map(makeCollectionNode);
  return {
    nodes,
    pageInfo: {
      hasPreviousPage: false,
      hasNextPage: false,
      startCursor: null,
      endCursor: null,
    },
  };
}

export function getMockFeatured() {
  return {
    featuredCollections: getMockCollections(3),
    featuredProducts: getMockProducts(8),
  };
}
