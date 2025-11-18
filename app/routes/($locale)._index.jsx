import {defer} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {Heading} from '~/components/Text';
import {useEffect} from 'react';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

const LANDING_COLLECTIONS_QUERY = `#graphql
  query LandingCollections(
    $h1: String
    $h2: String
    $h3: String
    $h4: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    c1: collection(handle: $h1) {
      id
      handle
      title
      image { url altText width height }
    }
    c2: collection(handle: $h2) {
      id
      handle
      title
      image { url altText width height }
    }
    c3: collection(handle: $h3) {
      id
      handle
      title
      image { url altText width height }
    }
    c4: collection(handle: $h4) {
      id
      handle
      title
      image { url altText width height }
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

  const handles = ['occasional', 'active', 'casual', 'lounge'];

  let data = null;
  try {
    data = await context.storefront.query(LANDING_COLLECTIONS_QUERY, {
      variables: {
        h1: handles[0],
        h2: handles[1],
        h3: handles[2],
        h4: handles[3],
        country,
        language,
      },
    });
  } catch (e) {
    console.error('Failed to load landing collections', e);
  }

  const collections = [data?.c1, data?.c2, data?.c3, data?.c4]
    .map((c, i) =>
      c ? c : {id: `placeholder-${i}`, handle: handles[i], title: handles[i]},
    )
    .filter(Boolean);

  return defer({
    collections,
    seo: {
      title: 'Valcee Couture',
      description: 'Collections',
      url: request.url,
    },
  });
}

export const meta = ({matches}) => getSeoMeta(...matches.map((m) => m.data.seo));

export default function Homepage() {
  const {collections} = useLoaderData();
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
    .collection-image { width: 40vw; }
    @media (min-width: 640px) { /* sm */
      .collection-image { width: 28vw; }
    }
    @media (min-width: 768px) { /* md */
      .collection-image { width: 18vw; }
    }
    @media (min-width: 1024px) { /* lg */
      .collection-image { width: 12vw; }
    }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  return (
    <main className="bg-contrast text-primary overflow-x-hidden overscroll-none">
      {/* Center collections; respect header height to avoid recoil and ensure true centering */}
      <section style={{minHeight: 'calc(100vh - var(--height-nav, 0px))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6vh 4vw'}}>
        <div style={{width: '100%', maxWidth: '92vw', marginLeft: 'auto', marginRight: 'auto'}}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 place-items-center justify-center transition-transform duration-200 ease-out">
            {collections.map((c) => (
              <Link key={c.id} to={`/collections/${c.handle}`} prefetch="intent" className="fadeIn">
                <div className="flex flex-col items-center gap-2">
                  <div className="aspect-[3/4] rounded-sm overflow-hidden flex items-center justify-center transition-transform duration-300 ease-out will-change-transform hover:scale-105 blend-isolate bg-contrast collection-image" >
                    {c?.image?.url ? (
                      <img
                        src={c.image.url}
                        alt={c.image.altText || c.title}
                        className="img-cutout w-full h-full object-contain opacity-95"
                        loading="eager"
                      />
                    ) : (
                      <img
                        src={`/images/collections/${c.handle}.png`}
                        alt={c.title}
                        className="img-cutout w-full h-full object-contain opacity-95"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <Heading as="h2" size="lead" className="capitalize tracking-wide">
                    {c.title}
                  </Heading>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

/* collection-image responsive styles are injected on the client via useEffect above */

