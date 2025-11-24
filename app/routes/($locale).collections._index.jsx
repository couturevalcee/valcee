import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {Image, getSeoMeta} from '@shopify/hydrogen';
import {useState, useMemo, useEffect, useLayoutEffect} from 'react';
import {Link} from '~/components/Link';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

const COLLECTIONS_AND_PRODUCTS_QUERY = `#graphql
  query CollectionsAndProducts(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: 100) {
      nodes {
        id
        title
        handle
      }
    }
    products(first: 250) {
      nodes {
        id
        title
        handle
        tags
        featuredImage {
          url
          altText
          width
          height
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        collections(first: 10) {
          nodes {
            handle
          }
        }
      }
    }
  }
`;

/**
 * @param {LoaderFunctionArgs}
 */
export const loader = async ({request, context: {storefront}}) => {
  try {
    const {collections, products} = await storefront.query(COLLECTIONS_AND_PRODUCTS_QUERY, {
      variables: {
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
    });

    const seo = seoPayload.listCollections({
      collections,
      url: request.url,
    });

    return json({collections: collections.nodes, products: products.nodes, seo});
  } catch (e) {
    console.error('Failed to load Collections index', e);
    return json({collections: [], products: [], seo: null});
  }
};

/**
 * @param {Class<loader>>}
 */
export const meta = ({matches}) => {
  return getSeoMeta(...matches.map((match) => match.data.seo));
};

export default function Collections() {
  const {collections, products} = useLoaderData();
  const [activeFilter, setActiveFilter] = useState('all');
  const [zoomLevel, setZoomLevel] = useState(1); // Default columns

  // Filter products based on selected collection
  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeFilter !== 'all') {
      result = products.filter((product) =>
        product.collections.nodes.some((c) => c.handle === activeFilter)
      );
    }
    
    // Sort featured products to the top
    return [...result].sort((a, b) => {
      const aFeatured = a.tags?.includes('featured') || false;
      const bFeatured = b.tags?.includes('featured') || false;
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return 0;
    });
  }, [activeFilter, products]);

  // Filter out 'home-page' collection from the list
  const visibleCollections = collections.filter(c => !['home-page', 'homepage', 'frontpage'].includes(c.handle));

  // Reset scroll when view or filter changes
  useEffect(() => {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.scrollTo({top: 0, behavior: 'smooth'});
    }
  }, [zoomLevel, activeFilter]);

  // Enable scroll snapping for single view
  useEffect(() => {
    const html = document.documentElement;
    const snapClass = 'snap-y-mandatory';
    if (zoomLevel === 1) {
      html.classList.add(snapClass);
      html.style.scrollPaddingTop = 'var(--collections-header-height)';
    } else {
      html.classList.remove(snapClass);
      html.style.scrollPaddingTop = '';
    }
    return () => {
      html.classList.remove(snapClass);
      html.style.scrollPaddingTop = '';
    };
  }, [zoomLevel]);

  // Measure header + bottom icons heights; derive product viewport height for single view
  useLayoutEffect(() => {
    const headerEl = document.getElementById('collectionsHeader');
    const bottomEl = document.getElementById('bottomIcons');
    const headerH = headerEl?.getBoundingClientRect().height || 0;
    const bottomH = bottomEl?.getBoundingClientRect().height || 0;
    document.documentElement.style.setProperty('--collections-header-height', `${Math.round(headerH)}px`);
    document.documentElement.style.setProperty('--bottom-icons-height', `${Math.round(bottomH)}px`);
    const productViewport = Math.max(window.innerHeight - headerH - bottomH, 320); // clamp minimum
    document.documentElement.style.setProperty('--product-viewport-height', `${Math.round(productViewport)}px`);
  });

  return (
    <div className={`px-4 md:px-8 max-w-screen-xl mx-auto flex flex-col ${
      zoomLevel === 1 ? 'min-h-screen pb-12' : ''
    }`}>
      
      {/* Controls Header: Filter & Zoom */}
      <div id="collectionsHeader" className="sticky top-[var(--height-nav)] z-30 bg-contrast/95 backdrop-blur-md pt-6 pb-2 -mx-4 px-4 md:-mx-8 md:px-8 flex flex-col gap-2 transition-all duration-300">
        
        {/* Filter (Horizontal Scrollable Pills) */}
        <div className="w-full overflow-x-auto hiddenScroll flex items-center gap-2 pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ${
              activeFilter === 'all'
                ? 'bg-primary text-contrast shadow-md'
                : 'bg-primary/5 text-primary/70 hover:bg-primary/10'
            }`}
          >
            All
          </button>
          {visibleCollections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setActiveFilter(collection.handle)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-all duration-300 ${
                activeFilter === collection.handle
                  ? 'bg-primary text-contrast shadow-md'
                  : 'bg-primary/5 text-primary/70 hover:bg-primary/10'
              }`}
            >
              {collection.title}
            </button>
          ))}
        </div>

        {/* View Toggle (Simple Icons) */}
        <div className="flex items-center justify-end gap-4 border-t border-primary/5 pt-0.5">
          <span className="text-[10px] uppercase tracking-widest opacity-40">Layout</span>
          <div className="flex items-center gap-2 bg-primary/5 rounded-full p-1">
            <button 
              onClick={() => setZoomLevel(1)}
              className={`p-2 rounded-full transition-all ${zoomLevel === 1 ? 'bg-primary text-contrast shadow-sm' : 'text-primary/40'}`}
              aria-label="Single column view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </button>
            <button 
              onClick={() => setZoomLevel(2)}
              className={`p-2 rounded-full transition-all ${zoomLevel === 2 ? 'bg-primary text-contrast shadow-sm' : 'text-primary/40'}`}
              aria-label="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div 
        className={`grid gap-x-4 transition-all duration-500 ease-out ${
          zoomLevel === 1 
            ? 'grid-cols-1' 
            : 'gap-y-10 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'
        }`}
      >
        {filteredProducts.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.handle}`}
            prefetch="intent"
            className={`group relative transition-all duration-500 ${
              zoomLevel === 1 
                ? 'snap-start h-[var(--product-viewport-height)] flex flex-col items-center justify-center w-full' 
                : 'flex flex-col items-start justify-start'
            }`}
          >
            {/* Unified Card Content */}
            <div className={`flex flex-col items-center justify-center w-full mx-auto ${zoomLevel === 1 ? 'max-w-[92vw] gap-2 pb-12' : 'gap-3'}`}>
              <div className={`${zoomLevel === 1 ? 'w-full flex items-center justify-center' : 'w-full aspect-[4/5]'} overflow-hidden rounded-2xl`}>
                {product.featuredImage && (
                  <Image
                    data={product.featuredImage}
                    sizes="(min-width: 45em) 20vw, 50vw"
                    className={`${zoomLevel === 1 ? 'max-h-[60vh] w-auto object-contain' : 'w-full h-full object-contain'} transition-transform duration-700 ease-out group-hover:scale-105`}
                  />
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-primary text-sm font-medium tracking-wide group-hover:underline decoration-primary/30 underline-offset-4">
                  {product.title}
                </span>
                <span className="text-primary/60 text-xs tracking-wider">
                  {product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="flex items-center justify-center h-64 opacity-50">
          <span className="uppercase tracking-widest">No products found</span>
        </div>
      )}
    </div>
  );
}

/**
 * @param {{
 *   collection: Collection;
 *   loading?: HTMLImageElement['loading'];
 * }}
 */
function CollectionCard({collection, loading}) {
  return (
    <Link
      prefetch="viewport"
      to={`/collections/${collection.handle}`}
      className="grid gap-4"
    >
      <div className="card-image bg-primary/5 aspect-[3/2]">
        {collection?.image && (
          <Image
            data={collection.image}
            aspectRatio="6/4"
            sizes="(max-width: 32em) 100vw, 45vw"
            loading={loading}
          />
        )}
      </div>
      <Heading as="h3" size="copy">
        {collection.title}
      </Heading>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  query Collections(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        id
        title
        description
        handle
        seo {
          description
          title
        }
        image {
          id
          url
          width
          height
          altText
        }
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').MetaArgs} MetaArgs */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Collection} Collection */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
