import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {Image, getSeoMeta} from '@shopify/hydrogen';
import {useState, useMemo, useEffect, useLayoutEffect, useRef} from 'react';
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
  const [mode, setMode] = useState('immersive'); // 'immersive' | 'grid'
  const scrollerRef = useRef(null);

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

  // Reset internal scroll when mode or filter changes
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTo({top: 0, behavior: 'auto'});
  }, [mode, activeFilter]);

  // Set viewport height variable for internal scroller
  useLayoutEffect(() => {
    function measure() {
      const nav = document.querySelector('header');
      const header = document.getElementById('collectionsHeader');
      const bottom = document.getElementById('bottomIcons');
      const navH = nav?.getBoundingClientRect().height || 0;
      const headerH = header?.getBoundingClientRect().height || 0;
      const bottomH = bottom?.getBoundingClientRect().height || 0;
      const viewport = window.innerHeight - navH - headerH - bottomH;
      document.documentElement.style.setProperty('--collections-viewport', `${Math.max(viewport, 360)}px`);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Fade panels in when intersecting for subtle polish
  useEffect(() => {
    if (mode !== 'immersive' || !scrollerRef.current) return;
    const panels = scrollerRef.current.querySelectorAll('.collection-panel');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('opacity-100')),
      {root: scrollerRef.current, threshold: 0.6},
    );
    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, [mode, filteredProducts]);

  // Measure nav + header + bottom; derive precise product viewport height
  useLayoutEffect(() => {
    function measure() {
      const navEl = document.querySelector('header');
      const headerEl = document.getElementById('collectionsHeader');
      const bottomEl = document.getElementById('bottomIcons');
      const navH = navEl?.getBoundingClientRect().height || 0;
      const headerH = headerEl?.getBoundingClientRect().height || 0;
      const bottomH = bottomEl?.getBoundingClientRect().height || 0;
      const totalTopOffset = navH + headerH;
      const viewportH = window.innerHeight - totalTopOffset - bottomH;
      const productViewport = Math.max(viewportH, 350); // clamp
      const doc = document.documentElement;
      doc.style.setProperty('--collections-header-height', `${Math.round(headerH)}px`);
      doc.style.setProperty('--bottom-icons-height', `${Math.round(bottomH)}px`);
      doc.style.setProperty('--total-top-offset', `${Math.round(totalTopOffset)}px`);
      doc.style.setProperty('--product-viewport-height', `${Math.round(productViewport)}px`);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div className="px-4 md:px-8 max-w-screen-xl mx-auto flex flex-col">
      <div id="collectionsHeader" className="sticky top-[var(--height-nav)] z-30 bg-contrast/95 backdrop-blur-md pt-6 pb-3 -mx-4 px-4 md:-mx-8 md:px-8 flex flex-col gap-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 overflow-x-auto hiddenScroll flex items-center gap-2 pr-4">
            <FilterPill label="All" active={activeFilter==='all'} onClick={()=>setActiveFilter('all')} />
            {visibleCollections.map((c) => (
              <FilterPill key={c.id} label={c.title} active={activeFilter===c.handle} onClick={()=>setActiveFilter(c.handle)} />
            ))}
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 border-l border-primary/10 pl-3">
            <ViewToggle active={mode==='immersive'} onClick={()=>setMode('immersive')} icon="single" />
            <ViewToggle active={mode==='grid'} onClick={()=>setMode('grid')} icon="grid" />
          </div>
        </div>
      </div>

      {mode==='immersive' ? (
        <div ref={scrollerRef} className="collections-scroll flex flex-col">
          {filteredProducts.map((product) => (
            <Link key={product.id} to={`/products/${product.handle}`} prefetch="intent" className="collection-panel opacity-0 transition-opacity duration-500 flex flex-col items-center justify-center w-full px-2">
              <div className="flex flex-col items-center justify-center w-full max-w-[92vw] gap-4">
                <div className="w-full flex items-center justify-center h-[80%] overflow-hidden rounded-2xl">
                  {product.featuredImage && (
                    <Image data={product.featuredImage} sizes="(min-width: 48em) 40vw, 90vw" className="max-h-[65vh] w-auto object-contain drop-shadow-xl transition-transform duration-500 ease-out group-hover:scale-105" />
                  )}
                </div>
                <div className="flex flex-col items-center gap-1 mt-2">
                  <span className="text-primary text-sm font-medium tracking-widest uppercase">{product.title}</span>
                  <span className="text-primary/60 text-xs tracking-wider">{product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-x-4 gap-y-10 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 pt-6">
          {filteredProducts.map((product) => (
            <Link key={product.id} to={`/products/${product.handle}`} prefetch="intent" className="flex flex-col items-start justify-start w-full group">
              <div className="w-full aspect-[4/5] overflow-hidden rounded-xl bg-primary/5">
                {product.featuredImage && (
                  <Image data={product.featuredImage} sizes="(min-width: 64em) 22vw, (min-width:48em) 28vw, 50vw" className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105" />
                )}
              </div>
              <div className="flex flex-col items-start gap-1 mt-2">
                <span className="text-primary text-sm font-medium tracking-wide group-hover:underline decoration-primary/30 underline-offset-4">{product.title}</span>
                <span className="text-primary/60 text-xs tracking-wider">{product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

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

function FilterPill({label, active, onClick}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-medium uppercase tracking-widest transition-all duration-200 border ${
        active
          ? 'bg-primary text-contrast border-primary shadow-sm scale-105'
          : 'bg-transparent text-primary/60 border-primary/10 hover:border-primary/30 hover:text-primary'
      }`}
    >
      {label}
    </button>
  );
}

function ViewToggle({active, onClick, icon}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-colors duration-200 ${
        active ? 'bg-primary/10 text-primary' : 'text-primary/40 hover:text-primary/70'
      }`}
      aria-label={icon === 'single' ? 'Immersive View' : 'Grid View'}
    >
      {icon === 'single' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="4" width="14" height="16" rx="2" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )}
    </button>
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
