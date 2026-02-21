import {defer} from '@shopify/remix-oxygen';
import {Await, Form, useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
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

  return (
    <div className="min-h-screen pb-12 px-6 md:px-12 max-w-screen-2xl mx-auto flex flex-col gap-8 pt-20">
      <div className="flex flex-col items-center gap-6 py-8">
        <h1 className="text-sm uppercase tracking-[0.3em] text-primary/60 font-light">
          {searchTerm ? 'Search Results' : 'Search'}
        </h1>

        <Form method="get" className="relative w-full max-w-2xl">
          <Input
            defaultValue={searchTerm}
            name="q"
            placeholder="Search for timeless pieces..."
            type="search"
            variant="search"
            className="w-full rounded-full bg-primary/5 border border-primary/20 px-8 py-4 text-center text-base text-primary focus:border-primary/40 focus:outline-none placeholder:text-primary/40"
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-notice text-primary px-6 py-2 text-sm uppercase tracking-wider hover:bg-notice/90 transition-colors"
            type="submit"
          >
            Search
          </button>
        </Form>
      </div>

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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
                    {nodes.map((product) => {
                      const image = product.featuredImage || product.variants?.nodes?.[0]?.image;
                      const price = product.priceRange?.minVariantPrice || product.variants?.nodes?.[0]?.price;

                      return (
                        <Link
                          key={product.id}
                          to={`/products/${product.handle}`}
                          prefetch="intent"
                          className="group flex flex-col gap-3"
                        >
                          <div className="relative overflow-hidden w-full aspect-[4/5] bg-primary/5 rounded-lg">
                            {image && (
                              <Image
                                data={image}
                                aspectRatio="4/5"
                                sizes="(min-width: 64em) 25vw, (min-width: 48em) 33vw, 50vw"
                                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                              />
                            )}
                          </div>

                          <div className="flex flex-col items-center text-center gap-1">
                            <span className="text-primary text-xs uppercase tracking-widest font-medium">
                              {product.title}
                            </span>
                            {price && (
                              <span className="text-primary/60 text-xs tracking-wider">
                                {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center mt-16 gap-6">
                    <PreviousLink className="inline-block rounded-full font-medium text-center py-3 px-8 border border-primary/20 text-primary hover:bg-primary/5 transition-all text-sm uppercase tracking-wider">
                      {isLoading ? 'Loading...' : 'Previous'}
                    </PreviousLink>
                    <NextLink className="inline-block rounded-full font-medium text-center py-3 px-8 border border-primary/20 text-primary hover:bg-primary/5 transition-all text-sm uppercase tracking-wider">
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
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <p className="text-sm text-primary/50 uppercase tracking-wider">
            No results found
          </p>
        </div>
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
