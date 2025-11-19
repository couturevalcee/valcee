import {defer} from '@shopify/remix-oxygen';
import {Await, Form, useLoaderData} from '@remix-run/react';
import {Suspense, useState} from 'react';
import {
  Pagination,
  getPaginationVariables,
  Analytics,
  getSeoMeta,
  Image,
} from '@shopify/hydrogen';

import {Heading, PageHeader, Section, Text} from '~/components/Text';
import {Input} from '~/components/Input';
import {Link} from '~/components/Link';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {FeaturedCollections} from '~/components/FeaturedCollections';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {getImageLoadingPriority, PAGINATION_SIZE} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';

import {getFeaturedData} from './($locale).featured-products';

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, context: {storefront}}) {
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get('q');
  const variables = getPaginationVariables(request, {pageBy: 8});

  const {products} = await storefront.query(SEARCH_QUERY, {
    variables: {
      searchTerm,
      ...variables,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  const shouldGetRecommendations = !searchTerm || products?.nodes?.length === 0;

  const seo = seoPayload.collection({
    url: request.url,
    collection: {
      id: 'search',
      title: 'Search',
      handle: 'search',
      descriptionHtml: 'Search results',
      description: 'Search results',
      seo: {
        title: 'Search',
        description: `Showing ${products.nodes.length} search results for "${searchTerm}"`,
      },
      metafields: [],
      products,
      updatedAt: new Date().toISOString(),
    },
  });

  return defer({
    seo,
    searchTerm,
    products,
    noResultRecommendations: shouldGetRecommendations
      ? getNoResultRecommendations(storefront)
      : Promise.resolve(null),
  });
}

/**
 * @param {Class<loader>>}
 */
export const meta = ({matches}) => {
  return getSeoMeta(...matches.map((match) => match.data.seo));
};

export default function Search() {
  /** @type {LoaderReturnData} */
  const {searchTerm, products, noResultRecommendations} = useLoaderData();
  const noResults = products?.nodes?.length === 0;
  const [zoomLevel, setZoomLevel] = useState(4);

  return (
    <div className="min-h-screen pb-12 px-4 md:px-8 max-w-screen-xl mx-auto flex flex-col gap-8 pt-24">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-primary/5 pb-4">
        <Heading as="h1" size="lead" className="uppercase tracking-widest">
          {searchTerm ? `Results for "${searchTerm}"` : 'Search'}
        </Heading>
        
        {!noResults && (
          <div className="flex items-center gap-3">
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
        )}
      </div>

      <Form method="get" className="relative flex w-full max-w-md mx-auto text-heading mb-8">
        <Input
          defaultValue={searchTerm}
          name="q"
          placeholder="Search…"
          type="search"
          variant="search"
          className="text-center uppercase tracking-widest"
        />
        <button className="absolute right-0 py-2 px-4" type="submit">
          GO
        </button>
      </Form>

      {!searchTerm || noResults ? (
        <NoResults
          noResults={noResults}
          recommendations={noResultRecommendations}
        />
      ) : (
        <Section padding="none">
          <Pagination connection={products}>
            {({nodes, isLoading, NextLink, PreviousLink}) => {
              return (
                <>
                  <div 
                    className="grid gap-x-4 gap-y-12 transition-all duration-500 ease-in-out"
                    style={{
                      gridTemplateColumns: `repeat(${zoomLevel}, minmax(0, 1fr))`
                    }}
                  >
                    {nodes.map((product) => {
                      // Handle different data structures (fragment vs direct query)
                      const image = product.featuredImage || product.variants?.nodes?.[0]?.image;
                      const price = product.priceRange?.minVariantPrice || product.variants?.nodes?.[0]?.price;
                      
                      return (
                        <Link
                          key={product.id}
                          to={`/products/${product.handle}`}
                          prefetch="intent"
                          className={`group relative flex flex-col gap-4 ${zoomLevel === 1 ? 'justify-start' : ''}`}
                        >
                          <div className={`relative overflow-hidden w-full ${zoomLevel === 1 ? 'aspect-[3/4] max-h-[70vh]' : 'aspect-[4/5]'}`}>
                            {image && (
                              <Image
                                data={image}
                                aspectRatio={zoomLevel === 1 ? "3/4" : "4/5"}
                                sizes="(min-width: 45em) 20vw, 50vw"
                                className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105 img-cutout drop-shadow-xl"
                              />
                            )}
                          </div>
                          
                          <div className={`flex flex-col items-center text-center gap-1 transition-opacity duration-300 ${zoomLevel > 4 ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                            <span className="text-primary text-xs uppercase tracking-widest font-medium">
                              {product.title}
                            </span>
                            {zoomLevel <= 2 && price && (
                              <span className="text-primary/60 text-[10px] tracking-wider">
                                {price.amount} {price.currencyCode}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center justify-center mt-12 gap-4">
                    <PreviousLink className="inline-block rounded font-medium text-center py-3 px-6 border border-primary/10 bg-contrast text-primary hover:bg-primary/5 transition-colors">
                      {isLoading ? 'Loading...' : 'Previous'}
                    </PreviousLink>
                    <NextLink className="inline-block rounded font-medium text-center py-3 px-6 border border-primary/10 bg-contrast text-primary hover:bg-primary/5 transition-colors">
                      {isLoading ? 'Loading...' : 'Next'}
                    </NextLink>
                  </div>
                </>
              );
            }}
          </Pagination>
        </Section>
      )}
      <Analytics.SearchView data={{searchTerm, searchResults: products}} />
    </div>
  );
}

/**
 * @param {{
 *   noResults: boolean;
 *   recommendations: Promise<null | FeaturedData>;
 * }}
 */
function NoResults({noResults, recommendations}) {
  return (
    <>
      {noResults && (
        <Section padding="x">
          <Text className="opacity-50">
            No results, try a different search.
          </Text>
        </Section>
      )}
      <Suspense>
        <Await
          errorElement="There was a problem loading related products"
          resolve={recommendations}
        >
          {(result) => {
            if (!result) return null;
            const {featuredCollections, featuredProducts} = result;

            return (
              <>
                <FeaturedCollections
                  title="Trending Collections"
                  collections={featuredCollections}
                />
                <ProductSwimlane
                  title="Trending Products"
                  products={featuredProducts}
                />
              </>
            );
          }}
        </Await>
      </Suspense>
    </>
  );
}

/**
 * @param {LoaderFunctionArgs['context']['storefront']} storefront
 */
export function getNoResultRecommendations(storefront) {
  return getFeaturedData(storefront, {pageBy: PAGINATION_SIZE});
}

const SEARCH_QUERY = `#graphql
  query PaginatedProductsSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $searchTerm: String
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: RELEVANCE,
      query: $searchTerm
    ) {
      nodes {
        id
        title
        handle
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
        ...ProductCard
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }

  ${PRODUCT_CARD_FRAGMENT}
`;

/** @typedef {import('@shopify/remix-oxygen').MetaArgs} MetaArgs */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('./($locale).featured-products').FeaturedData} FeaturedData */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
