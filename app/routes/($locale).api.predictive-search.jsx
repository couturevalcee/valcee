import {json} from '@shopify/remix-oxygen';
import {NO_CACHE} from '~/lib/const';

export async function loader({request, context: {storefront}}) {
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get('q');
  const limit = Number(searchParams.get('limit') || 10);

  if (!searchTerm) {
    return json({items: []}, {headers: {'Cache-Control': NO_CACHE}});
  }

  const data = await storefront.query(PREDICTIVE_SEARCH_QUERY, {
    variables: {
      q: searchTerm,
      limit,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  if (!data) {
    return json({items: []}, {headers: {'Cache-Control': NO_CACHE}});
  }

  const items = data.predictiveSearch?.products || [];

  return json({items}, {headers: {'Cache-Control': NO_CACHE}});
}

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query predictiveSearch(
    $q: String!
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      query: $q
      limit: $limit
      limitScope: EACH
      types: [PRODUCT]
    ) {
      products {
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
      }
    }
  }
`;
