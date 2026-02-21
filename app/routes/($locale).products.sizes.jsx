import {useLoaderData} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import {routeHeaders} from '~/data/cache';
import {Link} from '~/components/Link';

export const headers = routeHeaders;

export async function loader({context: {storefront}}) {
  const {products} = await storefront.query(PRODUCTS_WITH_SIZE_QUERY, {
    variables: {
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
    cache: storefront.CacheLong(),
  });

  const productsWithSize = products.nodes
    .map((p) => {
      const taxonomySizeLabel = p.taxonomySize?.references?.nodes
        ?.map((node) => {
          const labelField = node.fields?.find(
            (f) => f.key === 'label' || f.key === 'value' || f.key === 'name',
          );
          return labelField?.value ?? null;
        })
        .filter(Boolean)
        .join(', ') || null;

      return {
        ...p,
        resolvedSize: p.size?.value || taxonomySizeLabel || null,
      };
    })
    .filter((p) => p.resolvedSize && p.resolvedSize.trim() !== '');

  return {products: productsWithSize};
}

export default function ProductSizes() {
  const {products} = useLoaderData();

  return (
    <div className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
      <h1 className="text-3xl font-light tracking-widest uppercase mb-12 text-center">
        Products with Size Information
      </h1>

      {products.length === 0 ? (
        <p className="text-center opacity-60">
          No products with size information found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.handle}`}
              className="group block border border-primary/10 hover:border-primary/30 transition-colors"
            >
              {product.featuredImage && (
                <div className="aspect-[3/4] overflow-hidden bg-primary/5">
                  <Image
                    data={product.featuredImage}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-sm font-medium tracking-wide uppercase">
                  {product.title}
                </h2>
                <p className="mt-2 text-sm opacity-70">
                  <span className="font-semibold">Size:</span>{' '}
                  {product.resolvedSize}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const PRODUCTS_WITH_SIZE_QUERY = `#graphql
  query ProductsWithSize(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 250) {
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
        size: metafield(namespace: "custom", key: "size") {
          value
        }
        taxonomySize: metafield(namespace: "shopify", key: "size") {
          value
          references(first: 10) {
            nodes {
              ... on Metaobject {
                id
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;
