import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';
import {Suspense} from 'react';
import {Link} from '~/components/Link';
import {Heading} from '~/components/Text';
import {routeHeaders} from '~/data/cache';
import {useEffect, useRef, useState} from 'react';
import {CountrySelector} from '~/components/CountrySelector';
import {Disclosure, Transition} from '@headlessui/react';
import {IconCaret} from '~/components/Icon';

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
  const [progress, setProgress] = useState(0); // 0=collections fully visible, 1=footer fully visible
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
  const widgetOpacity = progress;
  const widgetTranslate = 30 - progress * 30; // slide up from 30px

  // curated footer sections
  const footerSections = [
    {
      id: 'community',
      title: 'Community',
      links: [
        {title: 'Instagram', to: 'https://instagram.com', external: true},
        {title: 'TikTok', to: 'https://tiktok.com', external: true},
        {title: 'Pinterest', to: 'https://pinterest.com', external: true},
      ],
    },
    {
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
        {title: 'Privacy Policy', to: '/policies/privacy-policy'},
        {title: 'Your privacy choices', to: '/policies/privacy-policy#choices'},
      ],
    },
  ];

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

        {/* Footer widget stage - redesigned */}
        <section
          aria-label="Valcee footer"
          className="min-h-full flex items-center justify-center px-6 snap-center snap-always"
          style={{
            opacity: widgetOpacity,
            transform: `translateY(${widgetTranslate}px)`,
            transition: 'opacity 200ms ease-out, transform 200ms ease-out',
          }}
        >
          <div className="w-full max-w-4xl py-14">
            {/* subtle ambient glow */}
            <div
              aria-hidden
              className="relative -mx-6 md:mx-0 h-0"
            >
              <div
                className="absolute inset-x-0 -top-16 h-24 opacity-[0.12]"
                style={{
                  background:
                    'radial-gradient(40rem 12rem at 50% 100%, rgba(255,255,255,0.7), rgba(255,255,255,0))',
                  mixBlendMode: 'soft-light',
                }}
              />
            </div>

            <div className="grid gap-8 md:gap-10">
              {/* Region selector card */}
              <div className="rounded-2xl border border-primary/15 bg-contrast/60 backdrop-blur-sm p-5 md:p-6 transition-colors hover:border-primary/30">
                <Heading as="h2" size="lead" className="mb-3">Region & currency</Heading>
                <div className="rounded-md border border-primary/25 hover:border-primary/40 transition-colors p-2">
                  <CountrySelector showLabel={false} overlay={false} allowedCountries={['US','CA']} />
                </div>
              </div>

              {/* Four-section minimal menu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {footerSections.map((section) => (
                  <Disclosure
                    key={section.id}
                    as="div"
                    className="group rounded-xl border border-primary/15 bg-contrast/60 backdrop-blur-sm overflow-hidden"
                  >
                    {({open}) => (
                      <>
                        <Disclosure.Button className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-primary/5 transition-colors">
                          <Heading as="h3" size="lead" className="leading-none tracking-wide">
                            {section.title}
                          </Heading>
                          <span
                            className={`ml-3 inline-flex items-center justify-center text-primary/80 transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
                            aria-hidden
                          >
                            <IconCaret direction="down" />
                          </span>
                        </Disclosure.Button>
                        <Transition
                          enter="transition duration-300 ease-out"
                          enterFrom="opacity-0 -translate-y-1"
                          enterTo="opacity-100 translate-y-0"
                          leave="transition duration-200 ease-in"
                          leaveFrom="opacity-100 translate-y-0"
                          leaveTo="opacity-0 -translate-y-1"
                        >
                          <Disclosure.Panel>
                            <ul className="px-5 pb-5 grid gap-2">
                              {section.links.map((link) => (
                                <li key={link.title}>
                                  {link.external ? (
                                    <a
                                      href={link.to}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="underline-offset-4 hover:underline"
                                    >
                                      {link.title}
                                    </a>
                                  ) : (
                                    <Link
                                      to={link.to}
                                      prefetch="intent"
                                      className="underline-offset-4 hover:underline"
                                    >
                                      {link.title}
                                    </Link>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </Disclosure.Panel>
                        </Transition>
                      </>
                    )}
                  </Disclosure>
                ))}
              </div>
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
