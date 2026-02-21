import {defer} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {Heading, Text} from '~/components/Text';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

const FEATURED_PRODUCT_QUERY = `#graphql
  query FeaturedProduct(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 1, query: "tag:featured") {
      edges {
        node {
          handle
          title
          description
          featuredImage {
            url
            altText
          }
          media(first: 4) {
            edges {
              node {
                __typename
                ... on Video {
                  previewImage {
                    url
                  }
                  sources {
                    url
                    mimeType
                  }
                }
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

const FALLBACK_PRODUCT_QUERY = `#graphql
  query FallbackProduct(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 1) {
      edges {
        node {
          handle
          title
          description
          featuredImage {
            url
            altText
          }
          media(first: 4) {
            edges {
              node {
                __typename
                ... on Video {
                  previewImage {
                    url
                  }
                  sources {
                    url
                    mimeType
                  }
                }
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

/**
 * @param {import('@shopify/remix-oxygen').LoaderFunctionArgs} args
 */
export async function loader(args) {
  const {params, context, request} = args;
  const {language, country} = context.storefront.i18n;

  if (
    params.locale &&
    params.locale.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    throw new Response(null, {status: 404});
  }
  let featuredProduct = null;
  try {
    const data = await context.storefront.query(FEATURED_PRODUCT_QUERY, {
      variables: {
        country,
        language,
      },
    });
    const edge = data?.products?.edges?.[0];
    featuredProduct = edge?.node || null;

    // Fallback: if no featured product, get the first available product
    if (!featuredProduct) {
      const fallbackData = await context.storefront.query(
        FALLBACK_PRODUCT_QUERY,
        {
          variables: {
            country,
            language,
          },
        },
      );
      const fallbackEdge = fallbackData?.products?.edges?.[0];
      featuredProduct = fallbackEdge?.node || null;
    }
  } catch (e) {
    console.error('Failed to load featured product for home', e);
  }

  return defer({
    featuredProduct,
    seo: {
      title: 'Valcee Couture',
      description: 'The Official Store of Valcee Couture',
      url: request.url,
    },
  });
}

export const meta = ({matches}) =>
  getSeoMeta(...matches.map((m) => m.data.seo));

export default function Homepage() {
  const {featuredProduct} = useLoaderData();
  const imageMedia = featuredProduct?.featuredImage || null;

  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-contrast text-primary">
      {/* Immersive background layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {imageMedia && (
          <img
            src={imageMedia.url}
            alt={imageMedia.altText || featuredProduct?.title || 'Valcee'}
            className="w-full h-full object-cover scale-110 blur-2xl opacity-60"
          />
        )}
        {/* Gradient veil so foreground floats */}
        <div className="absolute inset-0 bg-gradient-to-br from-contrast/80 via-contrast/50 to-contrast/90" />
      </div>

      {/* Full-page feature: centered text + actions, no box */}
      <section className="relative flex-grow flex flex-col items-center justify-center px-4 py-0 text-center gap-5 fadeIn max-w-screen-xl mx-auto w-full h-full">
        {/* Editorial label */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <Text
            size="fine"
            className="uppercase tracking-[0.4em] text-primary/40 text-[0.6rem]"
          >
            Featured
          </Text>
          <div className="flex items-center gap-3 text-primary/50 text-[0.6rem] tracking-[0.35em] uppercase font-light">
            <span>See value</span>
            <span className="opacity-40">·</span>
            <span>Be value</span>
          </div>
        </div>

        {/* Featured image: largest element on the page */}
        {imageMedia ? (
          <Link
            to={featuredProduct ? `/products/${featuredProduct.handle}` : '#'}
            prefetch={featuredProduct ? 'intent' : 'none'}
            className="relative max-w-[70vw] sm:max-w-xs md:max-w-sm lg:max-w-md w-full mx-auto tap flex-shrink transition-transform duration-500 hover:scale-105 flex items-center justify-center"
          >
            <img
              src={imageMedia.url}
              alt={imageMedia.altText || featuredProduct?.title || ''}
              className="w-full h-auto max-h-[50vh] object-contain img-cutout drop-shadow-2xl"
            />
          </Link>
        ) : null}

        {/* Product name and actions */}
        <div className="flex flex-col items-center gap-4 flex-shrink-0">
          {featuredProduct?.title ? (
            <Link
              to={`/products/${featuredProduct.handle}`}
              prefetch="intent"
              className="group flex items-center gap-2"
            >
              <Heading
                as="h2"
                size="lead"
                className="tracking-[0.12em] uppercase text-base font-medium group-hover:opacity-80 transition-opacity"
              >
                {featuredProduct.title}
              </Heading>
              <span className="text-primary/30 group-hover:text-primary/60 transition-colors text-sm">→</span>
            </Link>
          ) : null}

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            {featuredProduct && (
              <Link
                to={`/products/${featuredProduct.handle}`}
                prefetch="intent"
                className="tap inline-flex items-center justify-center px-8 py-3 text-xs uppercase tracking-[0.2em] text-contrast bg-primary hover:bg-primary/90 transition-colors rounded-full font-medium"
              >
                View Product
              </Link>
            )}
            <Link
              to="/collections"
              prefetch="intent"
              className="tap inline-flex items-center justify-center px-8 py-3 text-xs uppercase tracking-[0.2em] text-primary/70 hover:text-primary transition-colors border border-primary/20 hover:border-primary/40 rounded-full"
            >
              Collections
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
