import {useRef, Suspense, useState, useEffect} from 'react';
import {Disclosure, Listbox} from '@headlessui/react';
import {defer} from '@shopify/remix-oxygen';
import {useLoaderData, Await} from '@remix-run/react';
import {
  getSeoMeta,
  Money,
  ShopPayButton,
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  getProductOptions,
} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import clsx from 'clsx';
import {Heading, Section, Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';
import {AddToCartButton} from '~/components/AddToCartButton';
import {Skeleton} from '~/components/Skeleton';
import {ProductGallery} from '~/components/ProductGallery';
import {IconCaret, IconCheck, IconClose} from '~/components/Icon';
import {getExcerpt} from '~/lib/utils';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';
import {MEDIA_FRAGMENT, PRODUCT_CARD_FRAGMENT} from '~/data/fragments';

export const headers = routeHeaders;

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  const {productHandle} = args.params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({params, request, context}) {
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  const selectedOptions = getSelectedProductOptions(request);

  const [{shop, product}] = await Promise.all([
    context.storefront.query(PRODUCT_QUERY, {
      variables: {
        handle: productHandle,
        selectedOptions,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response('product', {status: 404});
  }

  const recommended = getRecommendedProducts(context.storefront, product.id);
  const selectedVariant = product.selectedOrFirstAvailableVariant ?? {};
  const variants = getAdjacentAndFirstAvailableVariants(product);

  const seo = seoPayload.product({
    product: {...product, variants},
    selectedVariant,
    url: request.url,
  });

  return {
    product,
    variants,
    shop,
    storeDomain: shop.primaryDomain.url,
    recommended,
    seo,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs} args
 */
function loadDeferredData(args) {
  // Put any API calls that are not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

/**
 * @param {Class<loader>>}
 */
export const meta = ({matches}) => {
  return getSeoMeta(...matches.map((match) => match.data.seo));
};

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, shop, recommended, variants, storeDomain} = useLoaderData();
  const {media, title, vendor, descriptionHtml} = product;
  const {shippingPolicy, refundPolicy} = shop;

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    variants,
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const firstVideo = media.nodes.find((med) => med.__typename === 'Video');

  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      
      const playVideo = async () => {
        try {
          await videoRef.current.play();
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.log('Autoplay failed:', e);
          }
        }
      };
      
      playVideo();
    }
  }, [firstVideo]);

  return (
    <>
      {firstVideo && (
        <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <video
            key={firstVideo.id}
            ref={videoRef}
            className="w-full h-full object-cover opacity-20"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            poster={firstVideo.previewImage?.url}
          >
            {firstVideo.sources.map((source) => (
              <source key={source.url} src={source.url} type={source.mimeType} />
            ))}
          </video>
        </div>
      )}
      <Section className="px-4 md:px-8 lg:px-12 max-w-screen-xl mx-auto pb-40 md:pb-0">
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 lg:grid-cols-2 md:items-center md:gap-10 lg:gap-16 md:min-h-[calc(100vh-var(--height-nav))] md:pb-[15vh]">
          {/* Left: product imagery */}
          <div className="md:col-span-2 lg:col-span-1 flex flex-col gap-4 justify-center">
            <ProductGallery
              media={media.nodes}
              className="w-full"
            />
          </div>

          {/* Right: details */}
          <div className="md:col-span-1 lg:col-span-1 flex flex-col gap-8 text-center items-center justify-center">
            <div className="flex flex-col gap-2 items-center">
              <Heading as="h1" className="whitespace-normal text-4xl font-bold tracking-tighter">
                {title}
              </Heading>
            </div>

            <ProductForm
              productOptions={productOptions}
              selectedVariant={selectedVariant}
              storeDomain={storeDomain}
              descriptionHtml={descriptionHtml}
            />
          </div>
        </div>
      </Section>
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </>
  );
}

/**
 * @param {{
 *   productOptions: MappedProductOptions[];
 *   selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 *   storeDomain: string;
 *   descriptionHtml: string;
 * }}
 */
export function ProductForm({productOptions, selectedVariant, storeDomain, descriptionHtml}) {
  const isOutOfStock = !selectedVariant?.availableForSale;
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Check if we should hide options (single variant)
  const hasVariants = productOptions.length > 1 || (productOptions[0]?.optionValues.length > 1);

  return (
    <div className="grid gap-8 place-items-center">
      <div className="text-2xl font-medium">
        {selectedVariant?.price && <Money data={selectedVariant?.price} />}
      </div>

      {descriptionHtml && (
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="text-sm uppercase tracking-widest border-b border-primary/50 hover:border-primary transition-colors pb-0.5"
          >
            {isDescriptionExpanded ? 'Close' : 'Read More'}
          </button>
          
          <div 
            className={`prose dark:prose-invert text-sm leading-relaxed opacity-80 overflow-hidden transition-all duration-500 ease-in-out ${isDescriptionExpanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
          >
            <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
          </div>
        </div>
      )}

      {hasVariants && (
        <div className="grid gap-4 justify-items-center">
          {productOptions.map((option) => (
            <div key={option.name} className="flex flex-col gap-2 items-center">
              <h3 className="text-sm opacity-60">{option.name}</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {option.optionValues.map((value) => (
                  <Link
                    key={value.name}
                    to={value.variantUriQuery ? `?${value.variantUriQuery}` : '#'}
                    preventScrollReset
                    replace
                    className={clsx(
                      'text-sm px-3 py-1 border transition-all',
                      value.selected 
                        ? 'border-primary opacity-100' 
                        : 'border-transparent opacity-50 hover:opacity-100'
                    )}
                  >
                    {value.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddToCartButton
        disabled={isOutOfStock}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                },
              ]
            : []
        }
        className="text-center text-xl font-bold hover:opacity-70 transition-opacity w-max bg-transparent border-none p-0 text-primary"
      >
        {isOutOfStock ? 'Sold Out' : 'Get'}
      </AddToCartButton>
    </div>
  );
}

/**
 * @param {{
 *   swatch?: Maybe<ProductOptionValueSwatch> | undefined;
 *   name: string;
 * }}
 */
function ProductOptionSwatch({swatch, name}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      className="w-8 h-8"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}

/**
 * @param {{
 *   title: string;
 *   content: string;
 *   learnMore?: string;
 * }}
 */
function ProductDetail({title, content, learnMore}) {
  return (
    <Disclosure key={title} as="div" className="grid w-full gap-2">
      {({open}) => (
        <>
          <Disclosure.Button className="text-left">
            <div className="flex justify-between">
              <Text size="lead" as="h4">
                {title}
              </Text>
              <IconClose
                className={clsx(
                  'transition-transform transform-gpu duration-200',
                  !open && 'rotate-[45deg]',
                )}
              />
            </div>
          </Disclosure.Button>

          <Disclosure.Panel className={'pb-4 pt-2 grid gap-2'}>
            <div
              className="prose dark:prose-invert"
              dangerouslySetInnerHTML={{__html: content}}
            />
            {learnMore && (
              <div className="">
                <Link
                  className="pb-px border-b border-primary/30 text-primary/50"
                  to={learnMore}
                >
                  Learn more
                </Link>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    availableForSale
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
    media(first: 7) {
      nodes {
        ...Media
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
    shop {
      name
      primaryDomain {
        url
      }
      shippingPolicy {
        body
        handle
      }
      refundPolicy {
        body
        handle
      }
    }
  }
  ${MEDIA_FRAGMENT}
  ${PRODUCT_FRAGMENT}
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query productRecommendations(
    $productId: ID!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    recommended: productRecommendations(productId: $productId) {
      ...ProductCard
    }
    additional: products(first: $count, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

/**
 * @param {Storefront} storefront
 * @param {string} productId
 */
async function getRecommendedProducts(storefront, productId) {
  const products = await storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
    variables: {productId, count: 12},
  });

  invariant(products, 'No data returned from Shopify API');

  const mergedProducts = (products.recommended ?? [])
    .concat(products.additional.nodes)
    .filter(
      (value, index, array) =>
        array.findIndex((value2) => value2.id === value.id) === index,
    );

  const originalProduct = mergedProducts.findIndex(
    (item) => item.id === productId,
  );

  mergedProducts.splice(originalProduct, 1);

  return {nodes: mergedProducts};
}

/** @typedef {import('@shopify/remix-oxygen').MetaArgs} MetaArgs */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Maybe} Maybe */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').ProductOptionValueSwatch} ProductOptionValueSwatch */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('~/lib/type').Storefront} Storefront */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
