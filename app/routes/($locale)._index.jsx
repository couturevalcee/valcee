import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';
        {/* Footer widget stage removed per request (kept minimal landing with collections only) */}
      id: 'resources',
      title: 'Resources',
      links: [
        {title: 'Size Guide', to: '/pages/size-guide'},
        {title: 'Care & Materials', to: '/pages/care'},
        {title: 'Shipping & Returns', to: '/policies/shipping-policy'},
      ],
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      links: [{title: 'Terms of Service', to: '/policies/terms-of-service'}],
    },
    {
      id: 'privacy',
      title: 'Privacy',
      links: [
      // footer removed per design request (keep landing minimal)
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

        {/* Footer widget stage removed per request (kept minimal landing with collections only) */}
      </div>
    </main>
  );
}

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

import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';
import {Suspense} from 'react';
import {Link} from '~/components/Link';
import {Heading} from '~/components/Text';
import {routeHeaders} from '~/data/cache';
import {useEffect, useRef, useState} from 'react';

export const headers = routeHeaders;

/**
 * @param {LoaderFunctionArgs} args
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

export const meta = ({matches}) => {
  return getSeoMeta(...matches.map((m) => m.data.seo));
};

export default function Homepage() {
  const {collections} = useLoaderData();
  const [progress, setProgress] = useState(0); // 0=collections fully visible
  const snapRef = useRef(null);

  useEffect(() => {
    const el = snapRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = Math.max(1, el.scrollHeight - el.clientHeight);
      const p = Math.max(0, Math.min(1, el.scrollTop / max));
      setProgress(p);
    };
    el.addEventListener('scroll', onScroll, {passive: true});
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // derived styles
  const gridOpacity = 1 - progress;
  const gridScale = 1 - progress * 0.05; // slight scale down

  return (
    <main className="bg-contrast text-primary">
      {/* Local snap container equal to viewport minus header */}
      <div
        ref={snapRef}
        className="h-[calc(var(--screen-height)-var(--height-nav))] overflow-y-auto snap-y snap-mandatory"
      >
        {/* Stage wrapper, centers first screen */}
        <section
          className="min-h-full flex items-center justify-center px-6 snap-center snap-always"
        >
          <div className="w-full max-w-screen-sm">
            <div
              className="grid grid-cols-2 gap-8 place-items-center transition-transform transition-opacity duration-200 ease-out"
              style={{opacity: gridOpacity, transform: `scale(${gridScale})`}}
            >
              {collections.map((c) => (
                <Link key={c.id} to={`/collections/${c.handle}`} prefetch="intent" className="fadeIn">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-[42vw] max-w-[180px] aspect-[3/4] rounded-sm overflow-hidden flex items-center justify-center transition-transform duration-300 ease-out will-change-transform hover:scale-105 blend-isolate bg-contrast">
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
      </div>
    </main>
  );
}

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

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
