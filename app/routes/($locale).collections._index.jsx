import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {Image, getSeoMeta} from '@shopify/hydrogen';
import {useState, useMemo, useEffect} from 'react';
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
  const visibleCollections = collections.filter(c => c.handle !== 'home-page');

  // Reset scroll when view or filter changes
  useEffect(() => {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.scrollTo({top: 0, behavior: 'smooth'});
    }
  }, [zoomLevel, activeFilter]);

  // Enable scroll snapping for single view
  useEffect(() => {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    const snapClass = 'snap-y-mandatory';
    if (zoomLevel === 1) {
      mainContent.classList.add(snapClass);
    } else {
      mainContent.classList.remove(snapClass);
    }
    return () => mainContent.classList.remove(snapClass);
  }, [zoomLevel]);

  return (
    <div className="min-h-screen pb-12 px-4 md:px-8 max-w-screen-xl mx-auto flex flex-col gap-4">
      
      {/* Controls Header: Filter & Zoom */}
      <div className="sticky top-0 z-30 bg-contrast/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 md:-mx-8 md:px-8 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-primary/10">
        
        {/* Filter (Dropdown) */}
        <div className="w-full md:w-auto relative text-center md:text-left">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="appearance-none bg-transparent border-b border-primary/20 py-2 pr-8 pl-8 text-center text-sm uppercase tracking-widest font-medium focus:outline-none focus:border-primary focus:ring-0 cursor-pointer w-full md:w-auto"
          >
            <option value="all">ALL</option>
            {visibleCollections.map((collection) => (
              <option key={collection.id} value={collection.handle}>
                {collection.title}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-primary">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <span className="text-[10px] uppercase tracking-widest opacity-50">View</span>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseInt(e.target.value))}
            className="w-32 h-1 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
            aria-label="Zoom level"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div 
        className="grid gap-x-5 gap-y-10 transition-all duration-300 ease-out"
        style={{
          gridTemplateColumns: `repeat(${zoomLevel}, minmax(0, 1fr))`
        }}
      >
        {filteredProducts.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.handle}`}
            prefetch="intent"
            className={`group relative flex flex-col items-center gap-3 ${zoomLevel === 1 ? 'justify-start' : ''}`}
            style={
              zoomLevel === 1
                ? {scrollSnapAlign: 'start', scrollMarginTop: '5.5rem'}
                : undefined
            }
          >
            <div className={`relative overflow-hidden w-full ${zoomLevel === 1 ? 'aspect-[3/4] max-h-[72vh]' : 'aspect-[4/5]'} max-w-[min(90vw,520px)] mx-auto`}>
              {product.featuredImage && (
                <Image
                  data={product.featuredImage}
                  aspectRatio={zoomLevel === 1 ? "3/4" : "4/5"}
                  sizes="(min-width: 45em) 20vw, 50vw"
                  className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105 img-cutout drop-shadow-xl"
                />
              )}
            </div>
            
            {/* Product Info (Underneath) */}
            <div className={`flex flex-col items-center text-center gap-1 transition-opacity duration-300 ${zoomLevel > 4 ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
              <span className="text-primary text-xs uppercase tracking-widest font-medium">
                {product.title}
              </span>
              {zoomLevel <= 2 && (
                <span className="text-primary/60 text-[10px] tracking-wider">
                  {product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}
                </span>
              )}
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
