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
  } catch (e) {
    console.error('Failed to load featured product for home', e);
  }

  return defer({
    featuredProduct,
    seo: {
      title: 'Valcee Couture',
      description: 'Featured piece',
      url: request.url,
    },
  });
}

export const meta = ({matches}) => getSeoMeta(...matches.map((m) => m.data.seo));

export default function Homepage() {
  const {featuredProduct} = useLoaderData();
  const imageMedia = featuredProduct?.featuredImage || null;

  return (
    <main className="relative h-[calc(100vh-var(--height-nav))] bg-contrast text-primary overflow-hidden">
      {/* Immersive background layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <video
          className="w-full h-full object-cover scale-105 opacity-90"
          autoPlay
          muted
          loop
          playsInline
          poster={imageMedia?.url}
        >
          <source
            src="https://cdn.shopify.com/videos/c/o/v/c26b170b062c47ff9515e3ea542b4859.mp4"
            type="video/mp4"
          />
        </video>
        {!imageMedia ? null : (
          <img
            src={imageMedia.url}
            alt={imageMedia.altText || featuredProduct?.title || 'Valcee'}
            className="w-full h-full object-cover scale-105 opacity-90"
          />
        )}
        {/* Blur + gradient veil so foreground floats */}
        <div className="absolute inset-0 bg-gradient-to-b from-contrast/80 via-contrast/40 to-contrast/90 backdrop-blur-md" />
      </div>

      {/* Full-page feature: centered text + actions, no box */}
      <section className="relative flex h-full flex-col items-center justify-center px-6 text-center gap-4 fadeIn max-w-screen-xl mx-auto w-full">
        {/* Top label: FEATURED */}
        <div className="space-y-2 max-w-xl flex-shrink-0">
          <Text
            size="fine"
            className="uppercase tracking-[0.25em] text-primary/70"
          >
            Featured
          </Text>
          <div className="flex flex-col gap-0.5 text-primary/80 text-[0.6rem] tracking-[0.28em] uppercase">
            <span>See value</span>
            <span>Be value</span>
          </div>
        </div>

        {/* Featured image: largest element on the page */}
        {imageMedia ? (
          <Link
            to={featuredProduct ? `/products/${featuredProduct.handle}` : '#'}
            prefetch={featuredProduct ? 'intent' : 'none'}
            className="relative max-w-xs w-full mx-auto tap flex-shrink-0"
          >
            <img
              src={imageMedia.url}
              alt={imageMedia.altText || featuredProduct?.title || ''}
              className="w-full h-auto object-contain img-cutout drop-shadow-xl"
            />
          </Link>
        ) : null}

        {/* Product name and actions */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          {featuredProduct?.title ? (
            <Heading as="h2" size="lead" className="tracking-wide">
              {featuredProduct.title}
            </Heading>
          ) : null}

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <Link
              to="/collections"
              prefetch="intent"
              className="tap inline-flex items-center justify-center px-6 py-2 text-sm text-primary/90 hover:opacity-70 transition-opacity"
            >
              Shop
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

