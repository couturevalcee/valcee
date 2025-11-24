import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {Image, getSeoMeta} from '@shopify/hydrogen';
import {useState, useMemo} from 'react';
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
  // Single unified layout; removed compact option as redundant.

  // Filter products based on selected collection
  const filteredProducts = useMemo(() => {
    const base = activeFilter === 'all'
      ? products
      : products.filter(p => p.collections.nodes.some(c => c.handle === activeFilter));
    return [...base].sort((a,b) => {
      const af = a.tags?.includes('featured');
      const bf = b.tags?.includes('featured');
      if (af && !bf) return -1;
      if (!af && bf) return 1;
      return 0;
    });
  }, [activeFilter, products]);

  // Filter out 'home-page' collection from the list
  const visibleCollections = collections.filter(c => !['home-page','homepage','frontpage'].includes(c.handle));

  // Simple, no scroll physics JS – keep native behavior.

  return (
    <div className="px-4 md:px-8 max-w-screen-xl mx-auto flex flex-col gap-4 py-4">
      <header id="collectionsHeader" className="sticky top-[var(--height-nav)] bg-contrast/95 backdrop-blur-sm z-10 flex flex-col gap-3 py-3 -mx-4 px-4 md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill label="All" active={activeFilter==='all'} onClick={()=>setActiveFilter('all')} />
          {visibleCollections.map(c => (
            <FilterPill key={c.id} label={c.title} active={activeFilter===c.handle} onClick={()=>setActiveFilter(c.handle)} />
          ))}
        </div>
      </header>
      <section>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map(p => (
            <Link key={p.id} to={`/products/${p.handle}`} prefetch="intent" className="group flex flex-col gap-1">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-xl">
                {p.featuredImage && (
                  <Image
                    data={p.featuredImage}
                    aspectRatio={'4/5'}
                    sizes="(min-width: 64em) 20vw, (min-width:48em) 25vw, 50vw"
                    className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium tracking-wide truncate">{p.title}</span>
                <span className="text-xs text-primary/60 tracking-wider">{p.priceRange.minVariantPrice.amount} {p.priceRange.minVariantPrice.currencyCode}</span>
              </div>
            </Link>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="flex items-center justify-center h-64 opacity-50">
            <span className="uppercase tracking-widest text-sm">No products found</span>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * @param {{
 *   collection: Collection;
 *   loading?: HTMLImageElement['loading'];
 * }}
 */

function FilterPill({label, active, onClick}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-widest transition-colors duration-150 border ${active ? 'bg-primary text-contrast border-primary' : 'bg-transparent text-primary/60 border-primary/20 hover:text-primary hover:border-primary/40'}`}
    >
      {label}
    </button>
  );
}

// Removed LayoutToggle component; single layout only.

/** @typedef {import('@shopify/remix-oxygen').MetaArgs} MetaArgs */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Collection} Collection */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
