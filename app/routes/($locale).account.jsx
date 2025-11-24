import {
  Await,
  Form,
  Outlet,
  useLoaderData,
  useMatches,
  useOutlet,
} from '@remix-run/react';
import {Suspense} from 'react';
import {defer, redirect} from '@shopify/remix-oxygen';
import {flattenConnection} from '@shopify/hydrogen';
import {Modal} from '~/components/Modal';
import {usePrefixPathWithLocale} from '~/lib/utils';
import {CACHE_NONE, routeHeaders} from '~/data/cache';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

import {getFeaturedData} from './($locale).featured-products';

export const headers = routeHeaders;

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, context, params}) {
  const localePrefix = params.locale ? `/${params.locale}` : '';
  if (!(await context.customerAccount.isLoggedIn())) {
    throw redirect(`${localePrefix}/account/login`);
  }

  const {data, errors} = await context.customerAccount.query(
    CUSTOMER_DETAILS_QUERY,
  );

  /**
   * If the customer failed to load, we assume their access token is invalid.
   */
  if (errors?.length || !data?.customer) {
    throw redirect(`${localePrefix}/account/login`);
  }

  const customer = data?.customer;

  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}.`
      : `Welcome to your account.`
    : 'Account Details';

  // Fetch wishlist products if any
  let wishlistProductsPromise = Promise.resolve([]);
  if (customer?.wishlist?.value) {
    try {
      const ids = JSON.parse(customer.wishlist.value);
      if (ids.length > 0) {
        wishlistProductsPromise = context.storefront.query(`#graphql
          query getWishlistProducts($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product {
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
                variants(first: 1) {
                  nodes {
                    id
                    image {
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
                  }
                }
              }
            }
          }
        `, {
          variables: {ids}
        }).then(result => result.nodes.filter(Boolean));
      }
    } catch (e) {
      console.error('Error parsing wishlist', e);
    }
  }

  return defer(
    {
      customer,
      heading,
      featuredDataPromise: getFeaturedData(context.storefront),
      wishlistProductsPromise,
    },
    {
      headers: {
        'Cache-Control': CACHE_NONE,
      },
    },
  );
}

export default function Authenticated() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  const outlet = useOutlet();
  const matches = useMatches();

  // routes that export handle { renderInModal: true }
  const renderOutletInModal = matches.some((match) => {
    const handle = match?.handle;
    return handle?.renderInModal;
  });

  // Get modal title and size from route handle
  const modalConfig = matches.reduce((acc, match) => {
    const handle = match?.handle;
    if (handle?.renderInModal) {
      return {
        title: handle.modalTitle || getModalTitle(match.pathname),
        size: handle.modalSize || 'lg',
      };
    }
    return acc;
  }, {title: '', size: 'lg'});

  // On desktop (lg+), render as side panel; on mobile, use modal
  if (renderOutletInModal) {
    return (
      <>
        {/* Mobile: Modal */}
        <div className="lg:hidden">
          <Modal cancelLink="/account" title={modalConfig.title} size={modalConfig.size}>
            <Outlet context={{
              customer: data.customer, 
              featuredDataPromise: data.featuredDataPromise,
              wishlistProductsPromise: data.wishlistProductsPromise
            }} />
          </Modal>
        </div>
        {/* Desktop: Side-by-side layout */}
        <div className="hidden lg:block">
          <AccountLayoutDesktop data={data} modalTitle={modalConfig.title}>
            <Outlet context={{
              customer: data.customer, 
              featuredDataPromise: data.featuredDataPromise,
              wishlistProductsPromise: data.wishlistProductsPromise
            }} />
          </AccountLayoutDesktop>
        </div>
      </>
    );
  }

  return <AccountLayout data={data} />;
}

function getModalTitle(pathname) {
  if (pathname.includes('/orders')) return 'Orders';
  if (pathname.includes('/wishlist')) return 'Wishlist';
  if (pathname.includes('/settings')) return 'Settings';
  if (pathname.includes('/edit')) return 'Edit Profile';
  if (pathname.includes('/address')) return 'Address';
  if (pathname.includes('/contact')) return 'Help';
  return '';
}

function AccountLayout({data}) {
  return (
    <div className="px-4 py-6 md:px-8 lg:px-12 lg:py-12 max-w-lg lg:max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6 lg:mb-10">
        <div>
          <h1 className="text-xl lg:text-3xl font-medium tracking-tight">
            {data.customer?.firstName || 'Account'}
          </h1>
          <p className="text-xs lg:text-sm text-primary/50 mt-0.5">
            {data.customer?.emailAddress?.emailAddress}
          </p>
        </div>
        <Form method="post" action={usePrefixPathWithLocale('/account/logout')}>
          <button 
            type="submit" 
            className="text-[10px] lg:text-xs text-primary/40 hover:text-primary transition-colors uppercase tracking-widest"
          >
            Sign out
          </button>
        </Form>
      </header>

      <main>
        <Outlet context={{
          customer: data.customer, 
          featuredDataPromise: data.featuredDataPromise,
          wishlistProductsPromise: data.wishlistProductsPromise
        }} />
      </main>
    </div>
  );
}

function AccountLayoutDesktop({data, modalTitle, children}) {
  return (
    <div className="px-8 lg:px-12 py-12 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">
            {data.customer?.firstName || 'Account'}
          </h1>
          <p className="text-sm text-primary/50 mt-0.5">
            {data.customer?.emailAddress?.emailAddress}
          </p>
        </div>
        <Form method="post" action={usePrefixPathWithLocale('/account/logout')}>
          <button 
            type="submit" 
            className="text-xs text-primary/40 hover:text-primary transition-colors uppercase tracking-widest"
          >
            Sign out
          </button>
        </Form>
      </header>

      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
        {/* Left: Dashboard */}
        <main>
          <Outlet context={{
            customer: data.customer, 
            featuredDataPromise: data.featuredDataPromise,
            wishlistProductsPromise: data.wishlistProductsPromise
          }} />
        </main>

        {/* Right: Detail Panel */}
        <aside className="lg:border-l lg:border-primary/10 lg:pl-12">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">{modalTitle}</h2>
              <a 
                href="/account" 
                className="text-xs text-primary/40 hover:text-primary uppercase tracking-widest"
              >
                Close
              </a>
            </div>
            {children}
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * @typedef {{
 *   orders: OrderCardFragment[];
 * }} OrderCardsProps
 */
/**
 * @typedef {Object} AccountType
 * @property {CustomerDetailsFragment} customer
 * @property {Promise<FeaturedData>} featuredDataPromise
 * @property {string} heading
 */

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('customer-accountapi.generated').CustomerDetailsFragment} CustomerDetailsFragment */
/** @typedef {import('customer-accountapi.generated').OrderCardFragment} OrderCardFragment */
/** @typedef {import('./($locale).featured-products').FeaturedData} FeaturedData */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
